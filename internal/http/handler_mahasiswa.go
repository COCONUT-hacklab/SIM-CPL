// internal/http/handler_mahasiswa.go
package http

import (
	"net/http"
	"strconv"

	"cpmk/internal/db"
	"cpmk/internal/model"

	"github.com/gin-gonic/gin"
)

type MahasiswaSummary struct {
	IDMhs       uint64 `json:"id_mhs"`
	NIM         string `json:"nim"`
	Nama        string `json:"nama"`
	Angkatan    int    `json:"angkatan"`
	SemesterMax uint8  `json:"semester_max"`
	TotalNilai  int    `json:"total_nilai"`
	DariImport  int    `json:"dari_import"`
}

func listMahasiswaDenganNilaiHandler(c *gin.Context) {
	ctx := c.Request.Context()

	idStr := c.Param("id_prodi")
	idProdi, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id_prodi tidak valid"})
		return
	}

	semStr := c.Query("semester") // boleh kosong

	// DB-first aggregation: hitung di SQL, bukan di Go
	baseSQL := `
SELECT
	m.id_mhs,
	m.nim,
	m.nama,
	m.angkatan,
	MAX(n.semester_tempuh) AS semester_max,
	COUNT(*)              AS total_nilai,
	SUM(CASE WHEN n.sumber = 'import_json' THEN 1 ELSE 0 END) AS dari_import
FROM mahasiswa m
JOIN nilai_mk n ON n.id_mhs = m.id_mhs
WHERE m.id_prodi = ?
`
	args := []any{idProdi}

	if semStr != "" {
		baseSQL += " AND n.semester_tempuh = ?"
		if sem, err := strconv.ParseUint(semStr, 10, 8); err == nil {
			args = append(args, uint8(sem))
		} else {
			c.JSON(http.StatusBadRequest, gin.H{"error": "semester tidak valid"})
			return
		}
	}

	baseSQL += `
GROUP BY
	m.id_mhs, m.nim, m.nama, m.angkatan
ORDER BY
	m.nim
`

	var rows []MahasiswaSummary
	if err := db.DB.WithContext(ctx).Raw(baseSQL, args...).Scan(&rows).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db error summary mahasiswa"})
		return
	}

	c.JSON(http.StatusOK, rows)
}

func listAngkatanHandler(c *gin.Context) {
	idProdi := c.Param("id_prodi")
	var angkatans []int

	// Ambil daftar angkatan unik dari tabel mahasiswa
	err := db.DB.Model(&model.Mahasiswa{}).
		Where("id_prodi = ?", idProdi).
		Distinct().
		Order("angkatan DESC").
		Pluck("angkatan", &angkatans).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "gagal ambil data angkatan"})
		return
	}
	c.JSON(http.StatusOK, angkatans)
}

// GET /api/mahasiswa/:nim/mk/:id_mk/analisis
func getMKAnalisisMahasiswaHandler(c *gin.Context) {
    ctx := c.Request.Context()
    nim := c.Param("nim")
    idMK, _ := strconv.ParseUint(c.Param("id_mk"), 10, 64)

    // 1. Ambil data mahasiswa berdasarkan NIM
    var mhs model.Mahasiswa
    if err := db.DB.WithContext(ctx).Where("nim = ?", nim).First(&mhs).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "mahasiswa tidak ditemukan"})
        return
    }

    // 2. Query Gabungan: Ambil CPMK, Nilai Mahasiswa, dan Sub-CPMK terkait
    type SubCPMKRes struct {
        Kode      string  `json:"kode_sub_cpmk"`
        Deskripsi string  `json:"deskripsi"`
        Nilai     float64 `json:"nilai"`
    }
    
    type CPMKAnalisisRes struct {
        IDCPMK    uint64       `json:"id_cpmk"`
        KodeCPMK  string       `json:"kode_cpmk"`
        Nilai     float64      `json:"nilai"`
        Bobot     float64      `json:"bobot_cpmk"`
        Deskripsi string       `json:"deskripsi"`
        SubCPMKs  []SubCPMKRes `json:"sub_cpmks"`
    }

    var results []CPMKAnalisisRes
    db.DB.WithContext(ctx).Table("cpmk").
        Select("cpmk.id_cpmk, cpmk.kode_cpmk, cpmk.deskripsi, cpmk.bobot_cpmk, COALESCE(nilai_cpmk.nilai, 0) as nilai").
        Joins("LEFT JOIN nilai_cpmk ON nilai_cpmk.id_cpmk = cpmk.id_cpmk AND nilai_cpmk.id_mhs = ?", mhs.IDMhs).
        Where("cpmk.id_mk = ?", idMK).
        Scan(&results)

    // 3. Ambil rincian Sub-CPMK untuk setiap CPMK
    for i := range results {
        var subs []SubCPMKRes
        db.DB.WithContext(ctx).Table("sub_cpmk").
            Select("sub_cpmk.kode_sub_cpmk, sub_cpmk.deskripsi, COALESCE(nilai_sub_cpmk.nilai, 0) as nilai").
            Joins("LEFT JOIN nilai_sub_cpmk ON nilai_sub_cpmk.id_sub_cpmk = sub_cpmk.id_sub_cpmk AND nilai_sub_cpmk.id_mhs = ?", mhs.IDMhs).
            Where("sub_cpmk.id_cpmk = ?", results[i].IDCPMK).
            Scan(&subs)
        results[i].SubCPMKs = subs
    }

    c.JSON(http.StatusOK, results)
}