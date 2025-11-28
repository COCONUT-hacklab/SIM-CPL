package http

import (
	"errors"
	"net/http"
	"strconv"

	"cpmk/internal/db"
	"cpmk/internal/model"

	"github.com/gin-gonic/gin"
	"github.com/xuri/excelize/v2"
	"gorm.io/gorm"
)

type importResponse struct {
	ImportedMahasiswa int `json:"imported_mahasiswa"`
	ImportedNilaiMK   int `json:"imported_nilai_mk"`
}

// POST /api/nilai-mk/import-xlsx
func importNilaiMahasiswaXLSXHandler(c *gin.Context) {
	fileHeader, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file is required (field name: file)"})
		return
	}

	fh, err := fileHeader.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "cannot open uploaded file"})
		return
	}
	defer fh.Close()

	f, err := excelize.OpenReader(fh)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid xlsx: " + err.Error()})
		return
	}
	defer f.Close()

	// Ambil sheet pertama saja, jangan hardcode "Sheet1"
	sheets := f.GetSheetList()
	if len(sheets) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "xlsx has no sheet"})
		return
	}
	sheetName := sheets[0]

	rows, err := f.GetRows(sheetName)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "cannot read rows: " + err.Error()})
		return
	}
	if len(rows) <= 1 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no data rows (header only)"})
		return
	}

	importedMhs := 0
	importedNilai := 0

	idProdiStr := c.Param("id_prodi")
	idProdi, err := strconv.ParseUint(idProdiStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id_prodi"})
		return
	}

	err = db.DB.Transaction(func(tx *gorm.DB) error {
		mhsCache := map[string]model.Mahasiswa{}
		mkCache := map[string]model.MK{}

		for i, row := range rows {
			if i == 0 {
				// header
				continue
			}

			// Minimal 7 kolom: NIM, Nama, Angkatan, Kode MK, Semester, Tahun Ajaran, Nilai
			if len(row) < 7 {
				// baris kosong / tidak lengkap → skip
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
				// baris tidak valid → skip
				continue
			}

			angkatan, _ := strconv.Atoi(angkatanStr)
			semInt, _ := strconv.Atoi(semStr)
			semester := uint8(semInt)
			nilai, _ := strconv.ParseFloat(nilaiStr, 64)

			// --- MAHASISWA (cari / buat) ---
			mhs, ok := mhsCache[nim]
			if !ok {
				err := tx.Where("nim = ?", nim).First(&mhs).Error
				if err != nil {
					if errors.Is(err, gorm.ErrRecordNotFound) {
						// buat baru
						mhs = model.Mahasiswa{
							IDProdi:  idProdi,
							NIM:      nim,
							Nama:     nama,
							Angkatan: angkatan,
							Status:   "aktif",
						}
						if err := tx.Create(&mhs).Error; err != nil {
							return err
						}
						importedMhs++
					} else {
						// error lain → batalkan transaksi
						return err
					}
				}
				mhsCache[nim] = mhs
			}

			// --- MK (harus sudah ada di master mk) ---
			mk, ok2 := mkCache[kodeMK]
			if !ok2 {
				if err := tx.Where("kode_mk = ?", kodeMK).First(&mk).Error; err != nil {
					// kalau mk tidak ditemukan, ini serius → stop & lapor
					if errors.Is(err, gorm.ErrRecordNotFound) {
						return errors.New("kode_mk " + kodeMK + " tidak ditemukan di tabel mk")
					}
					return err
				}
				mkCache[kodeMK] = mk
			}

			// --- UPSERT nilai_mk ---
			var existing model.NilaiMK
			err := tx.Where("id_mhs = ? AND id_mk = ? AND semester_tempuh = ?",
				mhs.IDMhs, mk.IDMK, semester).First(&existing).Error

			if err != nil {
				if errors.Is(err, gorm.ErrRecordNotFound) {
					// insert baru
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
					importedNilai++
				} else {
					return err
				}
			} else {
				// update nilai
				existing.NilaiAngka = nilai
				existing.TahunAjaran = tahunAjaran
				existing.Sumber = "import_xlsx"
				if err := tx.Save(&existing).Error; err != nil {
					return err
				}
				importedNilai++
			}

			// Hitung CPL mahasiswa ini di semester tersebut
			if err := HitungCPLMahasiswa(mhs.IDMhs, semester); err != nil {
				return err
			}
		}

		return nil
	})

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
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
