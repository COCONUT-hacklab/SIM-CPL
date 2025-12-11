package service

import (
	"context"
	"fmt"
	"strconv"
	"strings"
	"time"

	"cpmk/internal/db"
	"cpmk/internal/model"

	"gorm.io/gorm"
)

type ImportMatkulItem struct {
	Kode string
	Nama string
	SKS  uint8
}

type ImportMahasiswaItem struct {
	NIM      string
	Nama     string
	NilaiMap map[string]float64 // kodeMK -> nilai
}

type ImportNilaiParams struct {
	ProdiKode   string
	Semester    uint8
	TahunAjaran string
	MatkulList  []ImportMatkulItem
	ImportData  []ImportMahasiswaItem
}

// ImportNilaiMK menjalankan import nilai MK dalam satu transaksi, lalu (opsional) hitung ulang CPL.
func ImportNilaiMK(ctx context.Context, gdb *gorm.DB, params ImportNilaiParams) (summary map[string]any, err error) {
	if gdb == nil {
		gdb = db.DB
	}
	gdb = gdb.WithContext(ctx)

	if params.TahunAjaran == "" {
		params.TahunAjaran = "2024/2025"
	}

	// Ambil prodi
	var prodi model.Prodi
	if err := gdb.Where("kode_prodi = ?", params.ProdiKode).First(&prodi).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("prodi %s tidak ditemukan", params.ProdiKode)
		}
		return nil, fmt.Errorf("db error saat ambil prodi: %w", err)
	}

	var (
		createdMK     int
		createdMhs    int
		insertedNilai int
		updatedNilai  int
		skipped       int
	)

	err = gdb.Transaction(func(tx *gorm.DB) error {
		// 1. Pastikan semua MK ada
		mkMap := make(map[string]model.MK)

		kodeList := make([]string, 0, len(params.MatkulList))
		for _, m := range params.MatkulList {
			kodeList = append(kodeList, strings.TrimSpace(m.Kode))
		}

		if len(kodeList) > 0 {
			var existingMK []model.MK
			if err := tx.Where("kode_mk IN ? AND id_prodi = ?", kodeList, prodi.IDProdi).
				Find(&existingMK).Error; err != nil {
				return fmt.Errorf("db error load mk existing: %w", err)
			}
			for _, mk := range existingMK {
				mkMap[strings.ToLower(mk.KodeMK)] = mk
			}
		}

		for _, item := range params.MatkulList {
			key := strings.ToLower(item.Kode)
			if _, ok := mkMap[key]; ok {
				continue
			}
			mk := model.MK{
				IDProdi:  prodi.IDProdi,
				KodeMK:   item.Kode,
				NamaMK:   item.Nama,
				SKS:      item.SKS,
				Semester: params.Semester,
			}
			if err := tx.Create(&mk).Error; err != nil {
				return fmt.Errorf("insert mk gagal (%s): %w", item.Kode, err)
			}
			mkMap[key] = mk
			createdMK++
		}

		// 2. Pastikan Mahasiswa ada
		mhsMap := make(map[string]model.Mahasiswa)

		nimList := make([]string, 0, len(params.ImportData))
		for _, d := range params.ImportData {
			nimList = append(nimList, d.NIM)
		}

		if len(nimList) > 0 {
			var existingMhs []model.Mahasiswa
			if err := tx.Where("nim IN ? AND id_prodi = ?", nimList, prodi.IDProdi).
				Find(&existingMhs).Error; err != nil {
				return fmt.Errorf("db error load mahasiswa existing: %w", err)
			}
			for _, m := range existingMhs {
				mhsMap[m.NIM] = m
			}
		}

		for _, d := range params.ImportData {
			if _, ok := mhsMap[d.NIM]; ok {
				continue
			}

			angkatan := deriveAngkatanFromNIM(d.NIM)
			if angkatan == 0 {
				// fallback kalau format NIM nggak kebaca (harusnya jarang)
				angkatan = time.Now().Year()
			}

			m := model.Mahasiswa{
				NIM:      d.NIM,
				Nama:     d.Nama,
				IDProdi:  prodi.IDProdi,
				Angkatan: angkatan,
				Status:   "AKTIF",
			}

			if err := tx.Create(&m).Error; err != nil {
				return fmt.Errorf("insert mahasiswa gagal (nim=%s): %w", d.NIM, err)
			}

			mhsMap[d.NIM] = m
			createdMhs++
		}

		// 3. Simpan nilai MK
		for _, d := range params.ImportData {
			mhs := mhsMap[d.NIM]

			for kodeMK, nilai := range d.NilaiMap {
				key := strings.ToLower(kodeMK)
				mk, ok := mkMap[key]
				if !ok {
					skipped++
					continue
				}

				var nilaiMK model.NilaiMK
				err := tx.Where("id_mhs = ? AND id_mk = ?", mhs.IDMhs, mk.IDMK).
					First(&nilaiMK).Error

				if err == gorm.ErrRecordNotFound {
					nilaiMK = model.NilaiMK{
						IDMhs:          mhs.IDMhs,
						IDMK:           mk.IDMK,
						SemesterTempuh: params.Semester,
						TahunAjaran:    params.TahunAjaran,
						NilaiAngka:     nilai,
						Sumber:         "import_json",
					}
					if err := tx.Create(&nilaiMK).Error; err != nil {
						return fmt.Errorf("insert nilai_mk gagal (nim=%s, mk=%s): %w",
							mhs.NIM, mk.KodeMK, err)
					}
					insertedNilai++
				} else if err == nil {
					nilaiMK.NilaiAngka = nilai
					nilaiMK.SemesterTempuh = params.Semester
					nilaiMK.TahunAjaran = params.TahunAjaran
					nilaiMK.Sumber = "import_json"
					if err := tx.Save(&nilaiMK).Error; err != nil {
						return fmt.Errorf("update nilai_mk gagal (nim=%s, mk=%s): %w",
							mhs.NIM, mk.KodeMK, err)
					}
					updatedNilai++
				} else {
					return fmt.Errorf("db error cek nilai_mk (nim=%s, mk=%s): %w",
						mhs.NIM, mk.KodeMK, err)
				}
			}
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	// Hitung ulang CPL untuk prodi+semester ini
	if err := RecalculateCPLForProdiSemester(ctx, gdb, prodi.IDProdi, params.Semester); err != nil {
		return map[string]any{
			"prodi":          prodi.KodeProdi,
			"semester":       params.Semester,
			"tahun_ajaran":   params.TahunAjaran,
			"mk_baru":        createdMK,
			"mhs_baru":       createdMhs,
			"nilai_inserted": insertedNilai,
			"nilai_updated":  updatedNilai,
			"nilai_dilewati": skipped,
			"recalc_error":   err.Error(),
		}, nil
	}

	summary = map[string]any{
		"prodi":          prodi.KodeProdi,
		"semester":       params.Semester,
		"tahun_ajaran":   params.TahunAjaran,
		"mk_baru":        createdMK,
		"mhs_baru":       createdMhs,
		"nilai_inserted": insertedNilai,
		"nilai_updated":  updatedNilai,
		"nilai_dilewati": skipped,
	}
	return summary, nil
}

// deriveAngkatanFromNIM mengekstrak 2 digit terakhir nim dan mengubahnya ke tahun 20xx.
// Contoh: 105841115422 -> "22" -> 2022.
func deriveAngkatanFromNIM(nim string) int {
	if len(nim) < 2 {
		return 0
	}
	last2 := nim[len(nim)-2:]
	yy, err := strconv.Atoi(last2)
	if err != nil {
		return 0
	}
	year := 2000 + yy

	// sanity check: jangan sampai 2099 dll yang aneh
	currentYear := time.Now().Year()
	if year < 2000 || year > currentYear+1 {
		return 0
	}
	return year
}
