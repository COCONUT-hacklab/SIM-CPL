package service

import (
	"context"
	"fmt"

	"cpmk/internal/db"

	"gorm.io/gorm"
)

// RecalculateCPLForProdiSemester melakukan perhitungan CPL di level DB.
// Aggregation SUM/AVG dilakukan di SQL, bukan di Go.
func RecalculateCPLForProdiSemester(
	ctx context.Context,
	gdb *gorm.DB,
	idProdi uint64,
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

        SUM(
            CASE
                WHEN cm.bobot_fraction IS NOT NULL AND cm.bobot_fraction > 0
                    THEN n.nilai_angka * cm.bobot_fraction
                ELSE 0
            END
        ) AS sum_weighted,

        SUM(
            CASE
                WHEN cm.bobot_fraction IS NOT NULL AND cm.bobot_fraction > 0
                    THEN cm.bobot_fraction
                ELSE 0
            END
        ) AS sum_weight,

        SUM(
            CASE
                WHEN cm.bobot_fraction IS NULL OR cm.bobot_fraction <= 0
                    THEN n.nilai_angka
                ELSE 0
            END
        ) AS sum_plain,

        SUM(
            CASE
                WHEN cm.bobot_fraction IS NULL OR cm.bobot_fraction <= 0
                    THEN 1
                ELSE 0
            END
        ) AS count_plain,

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
    GROUP BY
        n.id_mhs,
        cm.id_cpl
) AS t
WHERE t.nilai_cpl IS NOT NULL
ON DUPLICATE KEY UPDATE
    nilai_angka = VALUES(nilai_angka),
    sumber = VALUES(sumber),
    tanggal_hitung = VALUES(tanggal_hitung);
`

	if err := gdb.Exec(sql, semester, idProdi, semester).Error; err != nil {
		return fmt.Errorf("recalculate CPL failed (prodi=%d, semester=%d): %w",
			idProdi, semester, err)
	}

	return nil
}
