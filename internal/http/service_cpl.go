package http

import (
	"time"

	"cpmk/internal/db"
	"cpmk/internal/model"
)

func HitungCPLMahasiswa(idMhs uint64, semesterEval uint8) error {
	// 1. ambil semua nilai MK mahasiswa di semester ini
	var nilaiMK []model.NilaiMK
	if err := db.DB.Where("id_mhs = ? AND semester_tempuh = ?", idMhs, semesterEval).
		Find(&nilaiMK).Error; err != nil {
		return err
	}
	if len(nilaiMK) == 0 {
		return nil
	}

	// map id_mk -> nilai
	nilaiByMK := map[uint64]float64{}
	var mkIDs []uint64
	for _, n := range nilaiMK {
		nilaiByMK[n.IDMK] = n.NilaiAngka
		mkIDs = append(mkIDs, n.IDMK)
	}

	// 2. ambil bobot cpl_mk untuk mk2 tsb
	var rels []model.CPLMK
	if err := db.DB.Where("id_mk IN ?", mkIDs).Find(&rels).Error; err != nil {
		return err
	}

	// agregasi per CPL
	type agg struct {
		Total float64
	}
	aggByCPL := map[uint64]*agg{}

	for _, r := range rels {
		nMk, ok := nilaiByMK[r.IDMK]
		if !ok {
			continue
		}
		a := aggByCPL[r.IDCPL]
		if a == nil {
			a = &agg{}
			aggByCPL[r.IDCPL] = a
		}
		a.Total += nMk * r.BobotFraction
	}

	// 3. simpan ke nilai_cpl (upsert)
	for idCpl, a := range aggByCPL {
		var existing model.NilaiCPL
		err := db.DB.Where("id_mhs = ? AND id_cpl = ? AND semester_eval = ?",
			idMhs, idCpl, semesterEval).First(&existing).Error

		if err != nil {
			// gorm.ErrRecordNotFound or others
			// kita cek pakai RowsAffected di Upsert manual
			n := model.NilaiCPL{
				IDMhs:         idMhs,
				IDCPL:         idCpl,
				SemesterEval:  semesterEval,
				NilaiAngka:    a.Total,
				TanggalHitung: time.Now(),
			}
			if db.DB.Where("id_mhs = ? AND id_cpl = ? AND semester_eval = ?",
				idMhs, idCpl, semesterEval).
				Assign(map[string]interface{}{
					"nilai_angka":    n.NilaiAngka,
					"tanggal_hitung": n.TanggalHitung,
				}).FirstOrCreate(&n).Error != nil {
				return err
			}
		} else {
			existing.NilaiAngka = a.Total
			existing.TanggalHitung = time.Now()
			if err := db.DB.Save(&existing).Error; err != nil {
				return err
			}
		}
	}

	return nil
}
