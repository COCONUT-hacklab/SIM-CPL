package http

import (
	"database/sql"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"cpmk/internal/db"
	"cpmk/internal/model"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// ---------------------------
// STRUCT PAYLOAD IMPORT JSON
// ---------------------------

type ImportMatkulItem struct {
	Kode string `json:"kode"`
	Nama string `json:"nama"`
	SKS  uint8  `json:"sks"`
}

type ImportMahasiswaItem struct {
	NIM      string             `json:"nim"`
	Nama     string             `json:"nama"`
	NilaiMap map[string]float64 `json:"nilaiMap"`
}

type ImportNilaiRequest struct {
	ProdiKode  string                `json:"prodiKode"`
	Semester   uint8                 `json:"semester"`
	MatkulList []ImportMatkulItem    `json:"matkulList"`
	ImportData []ImportMahasiswaItem `json:"importData"`
}

// row mentah hasil join nilai_mk + mk + cpl_mk
type cplCalcRow struct {
	IDMhs         uint64          `gorm:"column:id_mhs"`
	IDCPL         uint64          `gorm:"column:id_cpl"`
	NilaiAngka    float64         `gorm:"column:nilai_angka"`
	BobotFraction sql.NullFloat64 `gorm:"column:bobot_fraction"`
}

// aggregator per (mhs, cpl)
type cplAgg struct {
	SumWeighted float64
	SumWeight   float64
	SumPlain    float64
	CountPlain  int
	HasBobot    bool
}

// ---------------------------
// POST /api/nilai-mk/import-json
// ---------------------------

func importNilaiJSONHandler(c *gin.Context) {
	var req ImportNilaiRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "payload tidak valid: " + err.Error(),
		})
		return
	}

	// Validasi dasar
	if req.ProdiKode == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "prodiKode wajib diisi"})
		return
	}
	if req.Semester == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "semester wajib > 0"})
		return
	}
	if len(req.MatkulList) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "matkulList tidak boleh kosong"})
		return
	}
	if len(req.ImportData) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "importData tidak boleh kosong"})
		return
	}

	// Ambil prodi
	var prodi model.Prodi
	if err := db.DB.Where("kode_prodi = ?", req.ProdiKode).First(&prodi).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusBadRequest, gin.H{"error": "prodi tidak ditemukan"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "db error prodi"})
		}
		return
	}

	// Jalankan dalam transaksi
	err := db.DB.Transaction(func(tx *gorm.DB) error {

		// ========================
		// 1. Pastikan semua MK ada
		// ========================

		mkMap := make(map[string]*model.MK)

		kodeList := make([]string, 0)
		for _, m := range req.MatkulList {
			kodeList = append(kodeList, strings.TrimSpace(m.Kode))
		}

		var existingMK []model.MK
		tx.Where("kode_mk IN ? AND id_prodi = ?", kodeList, prodi.IDProdi).Find(&existingMK)
		for i := range existingMK {
			mk := &existingMK[i]
			mkMap[strings.ToLower(mk.KodeMK)] = mk
		}

		createdMK := 0
		for _, item := range req.MatkulList {
			key := strings.ToLower(item.Kode)

			if _, ok := mkMap[key]; ok {
				continue
			}

			mk := model.MK{
				IDProdi:  prodi.IDProdi,
				KodeMK:   item.Kode,
				NamaMK:   item.Nama,
				SKS:      item.SKS,
				Semester: req.Semester,
			}

			if err := tx.Create(&mk).Error; err != nil {
				return err
			}

			mkMap[key] = &mk
			createdMK++
		}

		// ==========================
		// 2. Pastikan Mahasiswa ada
		// ==========================

		mhsMap := make(map[string]*model.Mahasiswa)

		nimList := make([]string, 0)
		for _, d := range req.ImportData {
			nimList = append(nimList, d.NIM)
		}

		var existingMhs []model.Mahasiswa
		tx.Where("nim IN ? AND id_prodi = ?", nimList, prodi.IDProdi).Find(&existingMhs)
		for i := range existingMhs {
			m := &existingMhs[i]
			mhsMap[m.NIM] = m
		}

		createdMhs := 0
		for _, d := range req.ImportData {
			if _, ok := mhsMap[d.NIM]; ok {
				continue
			}

			m := model.Mahasiswa{
				NIM:     d.NIM,
				Nama:    d.Nama,
				IDProdi: prodi.IDProdi,
			}

			if err := tx.Create(&m).Error; err != nil {
				return err
			}

			mhsMap[d.NIM] = &m
			createdMhs++
		}

		// ======================
		// 3. Simpan nilai MK
		// ======================

		insertedNilai := 0
		updatedNilai := 0
		skipped := 0

		for _, d := range req.ImportData {
			mhs := mhsMap[d.NIM]

			for kodeMK, nilai := range d.NilaiMap {
				key := strings.ToLower(kodeMK)

				mk, ok := mkMap[key]
				if !ok {
					skipped++
					continue
				}

				var nilaiMK model.NilaiMK
				err := tx.Where("id_mhs = ? AND id_mk = ?", mhs.IDMhs, mk.IDMK).First(&nilaiMK).Error

				if err == gorm.ErrRecordNotFound {
					nilaiMK = model.NilaiMK{
						IDMhs:      mhs.IDMhs,
						IDMK:       mk.IDMK,
						NilaiAngka: nilai,
						Sumber:     "import_json",
					}
					tx.Create(&nilaiMK)
					insertedNilai++
				} else if err == nil {
					nilaiMK.NilaiAngka = nilai
					nilaiMK.Sumber = "import_json"
					tx.Save(&nilaiMK)
					updatedNilai++
				} else {
					skipped++
				}
			}
		}

		// simpan summary
		c.Set("summary", gin.H{
			"prodi":          prodi.KodeProdi,
			"semester":       req.Semester,
			"mk_baru":        createdMK,
			"mhs_baru":       createdMhs,
			"nilai_inserted": insertedNilai,
			"nilai_updated":  updatedNilai,
			"nilai_dilewati": skipped,
		})

		return nil
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "gagal import: " + err.Error(),
		})
		return
	}

	summary, _ := c.Get("summary")
	c.JSON(http.StatusOK, gin.H{
		"status":  "ok",
		"summary": summary,
	})
}

// =======================================
// GET /api/mahasiswa/:nim/cpl?semester=1
// =======================================

func getCPLByMahasiswaHandler(c *gin.Context) {
	nim := c.Param("nim")
	semStr := c.Query("semester")

	semInt, err := strconv.Atoi(semStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "semester invalid"})
		return
	}

	var mhs model.Mahasiswa
	if err := db.DB.Where("nim = ?", nim).First(&mhs).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "mahasiswa tidak ditemukan"})
		return
	}

	var list []model.NilaiCPL
	db.DB.Where("id_mhs = ? AND semester_eval = ?", mhs.IDMhs, uint8(semInt)).Find(&list)

	response := []gin.H{}
	for _, item := range list {
		var cpl model.CPL
		if err := db.DB.First(&cpl, item.IDCPL).Error; err == nil {
			response = append(response, gin.H{
				"kode_cpl":    cpl.KodeCPL,
				"nilai_angka": item.NilaiAngka,
			})
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"nim":      mhs.NIM,
		"nama":     mhs.Nama,
		"semester": semInt,
		"cpl":      response,
	})
}

func recalculateCPLForProdiSemester(idProdi uint64, semester uint8) error {
	// 1. Ambil data (Query tetap sama)
	var rows []cplCalcRow
	query := `
        SELECT
            n.id_mhs,
            cm.id_cpl,
            n.nilai_angka,
            cm.bobot_fraction
        FROM nilai_mk n
        JOIN mk m ON n.id_mk = m.id_mk
        JOIN cpl_mk cm ON cm.id_mk = m.id_mk
        WHERE m.id_prodi = ? AND n.semester_tempuh = ?
    `
	if err := db.DB.Raw(query, idProdi, semester).Scan(&rows).Error; err != nil {
		return fmt.Errorf("gagal mengambil data hitung CPL: %w", err)
	}

	if len(rows) == 0 {
		return nil
	}

	// 2. Definisi Struct Key untuk Map (Pengganti string "id-id")
	type aggKey struct {
		IDMhs uint64
		IDCPL uint64
	}

	// Gunakan struct sebagai key map
	aggMap := make(map[aggKey]*cplAgg)

	for _, r := range rows {
		// Langsung buat key tanpa fmt.Sprintf
		key := aggKey{IDMhs: r.IDMhs, IDCPL: r.IDCPL}

		a, ok := aggMap[key]
		if !ok {
			a = &cplAgg{}
			aggMap[key] = a
		}

		if r.BobotFraction.Valid && r.BobotFraction.Float64 > 0 {
			a.SumWeighted += r.NilaiAngka * r.BobotFraction.Float64
			a.SumWeight += r.BobotFraction.Float64
			a.HasBobot = true
		} else {
			a.SumPlain += r.NilaiAngka
			a.CountPlain++
		}
	}

	// 3. Konversi ke slice
	upserts := make([]model.NilaiCPL, 0, len(aggMap))
	now := time.Now()

	for key, a := range aggMap {
		var nilaiCPL float64
		if a.HasBobot && a.SumWeight > 0 {
			nilaiCPL = a.SumWeighted / a.SumWeight
		} else if a.CountPlain > 0 {
			nilaiCPL = a.SumPlain / float64(a.CountPlain)
		} else {
			continue
		}

		upserts = append(upserts, model.NilaiCPL{
			IDMhs:         key.IDMhs, // Tidak perlu fmt.Sscanf lagi
			IDCPL:         key.IDCPL,
			SemesterEval:  semester,
			NilaiAngka:    nilaiCPL,
			Sumber:        "recalc_import",
			TanggalHitung: now,
		})
	}

	if len(upserts) == 0 {
		return nil
	}

	// 4. Batch Upsert (Lebih aman menggunakan CreateInBatches)
	// Batch size 100-500 biasanya aman untuk semua DB
	err := db.DB.Clauses(clause.OnConflict{
		Columns: []clause.Column{
			{Name: "id_mhs"},
			{Name: "id_cpl"},
			{Name: "semester_eval"},
		},
		DoUpdates: clause.AssignmentColumns([]string{
			"nilai_angka",
			"sumber",
			"tanggal_hitung",
		}),
	}).
		CreateInBatches(&upserts, 100).Error // <-- Perubahan penting di sini

	if err != nil {
		return fmt.Errorf("gagal upsert nilai_cpl: %w", err)
	}

	return nil
}
