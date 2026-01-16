package service

import (
	"context"
	"fmt"

	"cpmk/internal/db"

	"gorm.io/gorm"
)

// RecalculateCPLForProdiSemester
// ------------------------------------------------------
// Melakukan perhitungan nilai CPL per mahasiswa, per CPL,
// untuk satu prodi & satu semester. Semua agregasi dilakukan
// di level SQL (DB-first aggregation).
//
// Rumus:
//   - Jika ada bobot di cpl_mk.bobot_fraction:
//     nilai_cpl = SUM(nilai_mk * bobot) / SUM(bobot)
//   - Jika semua bobot null/0:
//     nilai_cpl = AVG(nilai_mk)
func RecalculateCPLForProdiSemester(
	ctx context.Context,
	gdb *gorm.DB,
	idProdi *uint64,
	semester uint8,
) error {
	if gdb == nil {
		gdb = db.DB
	}
	gdb = gdb.WithContext(ctx)

	sql := `
INSERT INTO nilai_cpl (
    id_mhs,
    id_cpl,
    semester_eval,
    nilai_angka,
    sumber,
    tanggal_hitung
)
SELECT
    t.id_mhs,
    t.id_cpl,
    ? AS semester_eval,
    t.nilai_cpl,
    'recalc_import' AS sumber,
    NOW() AS tanggal_hitung
FROM (
    SELECT
        n.id_mhs,
        cm.id_cpl,

        -- total nilai berbobot
        SUM(
            CASE
                WHEN cm.bobot_fraction IS NOT NULL AND cm.bobot_fraction > 0
                    THEN n.nilai_angka * cm.bobot_fraction
                ELSE 0
            END
        ) AS sum_weighted,

        -- total bobot
        SUM(
            CASE
                WHEN cm.bobot_fraction IS NOT NULL AND cm.bobot_fraction > 0
                    THEN cm.bobot_fraction
                ELSE 0
            END
        ) AS sum_weight,

        -- total nilai plain (tanpa bobot), untuk fallback
        SUM(
            CASE
                WHEN cm.bobot_fraction IS NULL OR cm.bobot_fraction <= 0
                    THEN n.nilai_angka
                ELSE 0
            END
        ) AS sum_plain,

        -- hitung berapa mk tanpa bobot
        SUM(
            CASE
                WHEN cm.bobot_fraction IS NULL OR cm.bobot_fraction <= 0
                    THEN 1
                ELSE 0
            END
        ) AS count_plain,

        -- nilai_cpl final
        CASE
            WHEN
                SUM(
                    CASE
                        WHEN cm.bobot_fraction IS NOT NULL AND cm.bobot_fraction > 0
                            THEN cm.bobot_fraction
                        ELSE 0
                    END
                ) > 0
            THEN
                SUM(
                    CASE
                        WHEN cm.bobot_fraction IS NOT NULL AND cm.bobot_fraction > 0
                            THEN n.nilai_angka * cm.bobot_fraction
                        ELSE 0
                    END
                )
                /
                SUM(
                    CASE
                        WHEN cm.bobot_fraction IS NOT NULL AND cm.bobot_fraction > 0
                            THEN cm.bobot_fraction
                        ELSE 0
                    END
                )
            WHEN
                SUM(
                    CASE
                        WHEN cm.bobot_fraction IS NULL OR cm.bobot_fraction <= 0
                            THEN 1
                        ELSE 0
                    END
                ) > 0
            THEN
                SUM(
                    CASE
                        WHEN cm.bobot_fraction IS NULL OR cm.bobot_fraction <= 0
                            THEN n.nilai_angka
                        ELSE 0
                    END
                )
                /
                SUM(
                    CASE
                        WHEN cm.bobot_fraction IS NULL OR cm.bobot_fraction <= 0
                            THEN 1
                        ELSE 0
                    END
                )
            ELSE NULL
        END AS nilai_cpl
    FROM nilai_mk n
    JOIN mk m ON n.id_mk = m.id_mk
    JOIN cpl_mk cm ON cm.id_mk = m.id_mk
    WHERE
        m.id_prodi = ?
        AND n.semester_tempuh = ?
        AND (m.id_konsentrasi IS NULL OR m.id_konsentrasi = (
            SELECT id_konsentrasi FROM mahasiswa WHERE id_mhs = n.id_mhs
        ))
    GROUP BY
        n.id_mhs,
        cm.id_cpl
) AS t
WHERE t.nilai_cpl IS NOT NULL
ON DUPLICATE KEY UPDATE
    nilai_angka     = VALUES(nilai_angka),
    sumber          = VALUES(sumber),
    tanggal_hitung  = VALUES(tanggal_hitung);
`

	if err := gdb.Exec(sql, semester, idProdi, semester).Error; err != nil {
		return fmt.Errorf("recalculate CPL failed (prodi=%d, semester=%d): %w",
			idProdi, semester, err)
	}

	return nil
}

// RecalculateWeightsForProdi
// ------------------------------------------------------
// Menghitung ulang bobot:
// 1) CPL -> MK  (tabel cpl_mk.bobot_fraction)
//   - per CPL: total bobot = 1.0 (100%)
//   - tiap MK yang terkait CPL tersebut: 1 / jumlah_mk
//
// 2) MK -> CPMK (tabel cpmk.bobot_cpmk)
//   - per MK: total bobot = 1.0 (100%)
//   - tiap CPMK di MK tsb: 1 / jumlah_cpmk
//
// Semuanya dilakukan di level SQL (UPDATE ... JOIN).
func RecalculateWeightsForProdi(
	ctx context.Context,
	gdb *gorm.DB,
	idProdi uint64,
) error {
	if gdb == nil {
		gdb = db.DB
	}
	gdb = gdb.WithContext(ctx)

	tx := gdb.Begin()
	if err := tx.Error; err != nil {
		return fmt.Errorf("begin tx recalc weights: %w", err)
	}

	// ---------- 1) Recalculate CPL -> MK weights ----------
	//
	// UPDATE cpl_mk cm
	// JOIN (
	//   SELECT cm2.id_cpl, COUNT(*) AS cnt
	//   FROM cpl_mk cm2
	//   JOIN cpl ON cpl.id_cpl = cm2.id_cpl
	//   WHERE cpl.id_prodi = ?
	//   GROUP BY cm2.id_cpl
	// ) agg ON cm.id_cpl = agg.id_cpl
	// JOIN cpl ON cpl.id_cpl = cm.id_cpl
	// SET cm.bobot_fraction = 1.0 / agg.cnt
	// WHERE cpl.id_prodi = ?;
	updateCPLMK := `
UPDATE cpl_mk AS cm
JOIN (
    SELECT cm2.id_cpl, COUNT(*) AS cnt
    FROM cpl_mk AS cm2
    JOIN cpl ON cpl.id_cpl = cm2.id_cpl
    WHERE cpl.id_prodi = ?
    GROUP BY cm2.id_cpl
) AS agg ON cm.id_cpl = agg.id_cpl
JOIN cpl ON cpl.id_cpl = cm.id_cpl
SET cm.bobot_fraction = 1.0 / agg.cnt
WHERE cpl.id_prodi = ?;
`
	if err := tx.Exec(updateCPLMK, idProdi, idProdi).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("recalculate CPL->MK weights failed: %w", err)
	}

	// ---------- 2) Recalculate MK -> CPMK weights ----------
	//
	// UPDATE cpmk cp
	// JOIN (
	//   SELECT id_mk, COUNT(*) AS cnt
	//   FROM cpmk
	//   GROUP BY id_mk
	// ) agg ON cp.id_mk = agg.id_mk
	// JOIN mk ON mk.id_mk = cp.id_mk
	// SET cp.bobot_cpmk = 1.0 / agg.cnt
	// WHERE mk.id_prodi = ?;
	updateCPMK := `
UPDATE cpmk AS cp
JOIN (
    SELECT id_mk, COUNT(*) AS cnt
    FROM cpmk
    GROUP BY id_mk
) AS agg ON cp.id_mk = agg.id_mk
JOIN mk ON mk.id_mk = cp.id_mk
SET cp.bobot_cpmk = 1.0 / agg.cnt
WHERE mk.id_prodi = ?;
`
	if err := tx.Exec(updateCPMK, idProdi).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("recalculate MK->CPMK weights failed: %w", err)
	}

	if err := tx.Commit().Error; err != nil {
		return fmt.Errorf("commit recalc weights failed: %w", err)
	}

	return nil
}
