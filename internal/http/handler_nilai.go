package http

import (
	"net/http"
	"strconv"

	"cpmk/internal/db"
	"cpmk/internal/model"

	"github.com/gin-gonic/gin"
	"github.com/xuri/excelize/v2"
	"gorm.io/gorm"
)

// FORMAT XLSX (sederhana):
// Sheet1, mulai baris 2:
// A: NIM
// B: Nama
// C: Angkatan
// D: Kode MK
// E: Semester tempuh (angka)
// F: Tahun ajaran (string, mis "2024/2025")
// G: Nilai angka (float)
//
// Admin upload per prodi & per semester.

type importResponse struct {
	ImportedMahasiswa int `json:"imported_mahasiswa"`
	ImportedNilaiMK   int `json:"imported_nilai_mk"`
}

// POST /api/nilai-mk/import-xlsx
func importNilaiMahasiswaXLSXHandler(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file is required"})
		return
	}

	fh, err := file.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "cannot open file"})
		return
	}
	defer fh.Close()

	f, err := excelize.OpenReader(fh)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid xlsx"})
		return
	}
	defer f.Close()

	rows, err := f.GetRows("Sheet1")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "cannot read Sheet1"})
		return
	}

	importedMhs := 0
	importedNilai := 0

	err = db.DB.Transaction(func(tx *gorm.DB) error {
		mhsCache := map[string]model.Mahasiswa{}
		mkCache := map[string]model.MK{}

		for i, row := range rows {
			if i == 0 {
				// header
				continue
			}
			if len(row) < 7 {
				continue
			}
			nim := row[0]
			nama := row[1]
			angkatanStr := row[2]
			kodeMK := row[3]
			semStr := row[4]
			tahunAjaran := row[5]
			nilaiStr := row[6]

			if nim == "" || kodeMK == "" {
				continue
			}

			// angkatan
			angkatan, _ := strconv.Atoi(angkatanStr)
			semInt, _ := strconv.Atoi(semStr)
			semester := uint8(semInt)
			nilai, _ := strconv.ParseFloat(nilaiStr, 64)

			// mahasiswa (cari / buat)
			mhs, ok := mhsCache[nim]
			if !ok {
				if err := tx.Where("nim = ?", nim).First(&mhs).Error; err != nil {
					// buat baru, tapi perlu id_prodi - sementara: 1 (hardcode dulu, nanti disesuaikan)
					mhs = model.Mahasiswa{
						IDProdi:  1,
						NIM:      nim,
						Nama:     nama,
						Angkatan: angkatan,
						Status:   "aktif",
					}
					if err := tx.Create(&mhs).Error; err != nil {
						return err
					}
					importedMhs++
				}
				mhsCache[nim] = mhs
			}

			// mk (cari by kode_mk)
			mk, ok2 := mkCache[kodeMK]
			if !ok2 {
				if err := tx.Where("kode_mk = ?", kodeMK).First(&mk).Error; err != nil {
					// kalau MK tidak ketemu, skip baris
					continue
				}
				mkCache[kodeMK] = mk
			}

			// upsert nilai_mk
			var existing model.NilaiMK
			err := tx.Where("id_mhs = ? AND id_mk = ? AND semester_tempuh = ?",
				mhs.IDMhs, mk.IDMK, semester).First(&existing).Error

			if err != nil {
				nm := model.NilaiMK{
					IDMhs:          mhs.IDMhs,
					IDMK:           mk.IDMK,
					SemesterTempuh: semester,
					TahunAjaran:    tahunAjaran,
					NilaiAngka:     nilai,
					Sumber:         "import_xlsx",
				}
				if err := tx.Create(&nm).Error; err != nil {
					return err
				}
			} else {
				existing.NilaiAngka = nilai
				existing.TahunAjaran = tahunAjaran
				existing.Sumber = "import_xlsx"
				if err := tx.Save(&existing).Error; err != nil {
					return err
				}
			}
			importedNilai++

			// Hitung CPL untuk mhs ini & semester ini
			if err := HitungCPLMahasiswa(mhs.IDMhs, semester); err != nil {
				return err
			}
		}

		return nil
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, importResponse{
		ImportedMahasiswa: importedMhs,
		ImportedNilaiMK:   importedNilai,
	})
}

// GET /api/mahasiswa/:nim/cpl?semester=1
func getCPLByMahasiswaHandler(c *gin.Context) {
	nim := c.Param("nim")
	semStr := c.Query("semester")
	if semStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "semester is required"})
		return
	}
	semInt, err := strconv.Atoi(semStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid semester"})
		return
	}
	semester := uint8(semInt)

	// cari mahasiswa
	var mhs model.Mahasiswa
	if err := db.DB.Where("nim = ?", nim).First(&mhs).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "mahasiswa not found"})
		return
	}

	// ambil nilai_cpl
	var list []model.NilaiCPL
	if err := db.DB.Where("id_mhs = ? AND semester_eval = ?", mhs.IDMhs, semester).
		Find(&list).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
		return
	}

	// join manual ke tabel cpl buat dapetin kode_cpl
	type CPLItem struct {
		KodeCPL    string  `json:"kode_cpl"`
		NilaiAngka float64 `json:"nilai_angka"`
	}
	var result []CPLItem

	for _, n := range list {
		var cpl model.CPL
		if err := db.DB.First(&cpl, n.IDCPL).Error; err != nil {
			continue
		}
		result = append(result, CPLItem{
			KodeCPL:    cpl.KodeCPL,
			NilaiAngka: n.NilaiAngka,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"nim":      mhs.NIM,
		"nama":     mhs.Nama,
		"cpl":      result,
		"semester": semester,
	})
}
