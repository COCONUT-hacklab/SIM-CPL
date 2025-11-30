package http

import (
	"encoding/csv"
	"fmt"
	"net/http"
	"path/filepath"
	"strconv"
	"strings"

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
// importNilaiMahasiswaXLSXHandler
// Endpoint: POST /api/prodi/:id_prodi/nilai-mk/import-xlsx
// Menerima file .xlsx atau .csv, membaca NIM, Nama, dan nilai MK,
// lalu menyimpannya ke tabel nilai.
func importNilaiMahasiswaXLSXHandler(c *gin.Context) {
	// --- 1. Ambil id_prodi dari path ---
	idProdiStr := c.Param("id_prodi")
	if idProdiStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id_prodi wajib diisi"})
		return
	}

	idProdi, err := strconv.ParseUint(idProdiStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id_prodi tidak valid"})
		return
	}

	// --- 2. Ambil file dari form-data ---
	fileHeader, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file tidak ditemukan di form-data (key: file)"})
		return
	}

	ext := strings.ToLower(filepath.Ext(fileHeader.Filename))
	file, err := fileHeader.Open()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "gagal membuka file upload"})
		return
	}
	defer file.Close()

	// --- 3. Baca file menjadi rows[][]string (Excel atau CSV) ---
	var rows [][]string

	switch ext {
	case ".xlsx", ".xlsm", ".xls":
		// Baca Excel
		xls, err := excelize.OpenReader(file)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "file excel tidak valid"})
			return
		}
		defer xls.Close()

		sheetName := xls.GetSheetName(0)
		if sheetName == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "sheet excel kosong"})
			return
		}

		rows, err = xls.GetRows(sheetName)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "gagal membaca sheet excel"})
			return
		}

	case ".csv":
		// Baca CSV
		reader := csv.NewReader(file)
		reader.TrimLeadingSpace = true
		rows, err = reader.ReadAll()
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "gagal membaca file CSV"})
			return
		}

	default:
		c.JSON(http.StatusBadRequest, gin.H{
			"error": fmt.Sprintf("format file tidak didukung: %s (hanya .xlsx / .csv)", ext),
		})
		return
	}

	if len(rows) < 2 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file tidak memiliki data (minimal header + 1 baris data)"})
		return
	}

	// --- 4. Proses header: cari index nim, nama, dan kolom MK ---
	headerRow := rows[0]
	headers := make([]string, len(headerRow))
	for i, h := range headerRow {
		headers[i] = strings.TrimSpace(strings.ToLower(h))
	}

	nimIdx := -1
	namaIdx := -1
	mkCols := make(map[int]string) // idx kolom -> kode/nama MK (raw dari header)

	for i, h := range headers {
		switch h {
		case "nim", "npm":
			nimIdx = i
		case "nama", "nama mahasiswa":
			namaIdx = i
		default:
			if h != "" {
				// anggap header lain adalah kode/nama MK (ex: "inf105", "pancasila")
				mkCols[i] = h
			}
		}
	}

	if nimIdx == -1 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "kolom NIM/NPM tidak ditemukan di header"})
		return
	}
	if len(mkCols) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "tidak ada kolom mata kuliah di header (selain nim/nama)"})
		return
	}

	// --- 5. Proses tiap baris data ---
	importedNilai := 0
	failedRows := 0

	for rowIdx := 1; rowIdx < len(rows); rowIdx++ {
		row := rows[rowIdx]
		if len(row) == 0 {
			continue
		}

		// jaga-jaga kalau ada baris pendek
		getCell := func(idx int) string {
			if idx < len(row) {
				return strings.TrimSpace(row[idx])
			}
			return ""
		}

		nim := getCell(nimIdx)
		if nim == "" {
			failedRows++
			continue
		}
		nama := ""
		if namaIdx >= 0 {
			nama = getCell(namaIdx)
		}

		// --- 5a. Ambil / buat Mahasiswa ---
		var mhs model.Mahasiswa // SESUAIKAN dengan struct kamu
		err := db.DB.Where("nim = ? AND id_prodi = ?", nim, idProdi).First(&mhs).Error
		if err != nil {
			if err == gorm.ErrRecordNotFound {
				// buat mahasiswa baru
				mhs = model.Mahasiswa{
					// SESUAIKAN field-nya dengan model kamu
					NIM:     nim,
					Nama:    nama,
					IDProdi: idProdi,
				}
				if err := db.DB.Create(&mhs).Error; err != nil {
					failedRows++
					continue
				}
			} else {
				// error lain
				failedRows++
				continue
			}
		}

		// --- 5b. Loop tiap kolom MK ---
		for colIdx, mkKey := range mkCols {
			rawVal := getCell(colIdx)
			if rawVal == "" {
				continue
			}

			nilaiFloat, err := strconv.ParseFloat(strings.ReplaceAll(rawVal, ",", "."), 64)
			if err != nil {
				// nilai tidak valid -> skip kolom ini
				continue
			}

			// cari MK berdasarkan header (biasanya pakai kode_mk)
			var mk model.MK // SESUAIKAN dengan struct kamu
			err = db.DB.
				Where("LOWER(kode_mk) = ? AND id_prodi = ?", strings.ToLower(mkKey), idProdi).
				First(&mk).Error
			if err != nil {
				// kalau tidak ketemu coba pakai nama_mk
				err2 := db.DB.
					Where("LOWER(nama_mk) = ? AND id_prodi = ?", strings.ToLower(mkKey), idProdi).
					First(&mk).Error
				if err2 != nil {
					// MK tidak ketemu di DB, skip saja kolom ini
					continue
				}
			}

			// --- 5c. Simpan atau update nilai MK ---
			var nilai model.NilaiMK // SESUAIKAN dengan struct kamu
			err = db.DB.
				Where("id_mahasiswa = ? AND id_mk = ?", mhs.IDMahasiswa, mk.IDMK).
				First(&nilai).Error

			if err == gorm.ErrRecordNotFound {
				nilai = model.NilaiMK{
					// Sesuaikan field:
					IDMahasiswa: mhs.IDMahasiswa,
					IDMK:        mk.IDMK,
					NilaiAkhir:  nilaiFloat,
					Semester:    int(mk.Semester), // kalau ada
					Sumber:      "import_xlsx",    // kalau ada field sumber
				}
				if err := db.DB.Create(&nilai).Error; err != nil {
					continue
				}
			} else if err == nil {
				// update nilai lama
				nilai.NilaiAkhir = nilaiFloat
				// nilai.Semester = ...
				// nilai.Sumber = "import_xlsx"
				if err := db.DB.Save(&nilai).Error; err != nil {
					continue
				}
			} else {
				continue
			}

			importedNilai++
		}
	}

	// --- 6. Response ---
	c.JSON(http.StatusOK, gin.H{
		"status":             "ok",
		"id_prodi":           idProdi,
		"file_name":          fileHeader.Filename,
		"file_extension":     ext,
		"imported_nilai_mk":  importedNilai,
		"failed_rows":        failedRows,
		"total_data_barisan": len(rows) - 1,
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
