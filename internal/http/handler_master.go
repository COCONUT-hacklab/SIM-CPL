package http

import (
	"net/http"
	"strconv"

	"cpmk/internal/db"
	"cpmk/internal/model"
	"cpmk/internal/service"

	"github.com/gin-gonic/gin"
)

type CPLStat struct {
	IDCPL           uint64  `json:"id_cpl"`
	KodeCPL         string  `json:"kode_cpl"`
	Deskripsi       string  `json:"deskripsi"`
	JumlahMahasiswa int64   `json:"jumlah_mahasiswa"`
	RataNilai       float64 `json:"rata_nilai"`
	MinNilai        float64 `json:"min_nilai"`
	MaxNilai        float64 `json:"max_nilai"`
	KategoriTinggi  int64   `json:"kategori_tinggi"`
	KategoriSedang  int64   `json:"kategori_sedang"`
	KategoriRendah  int64   `json:"kategori_rendah"`
}

// ========================= MASTER: PRODI, MK, CPL, CPMK =========================

// GET /api/prodi
func listProdiHandler(c *gin.Context) {
	ctx := c.Request.Context()

	var prodis []model.Prodi
	if err := db.DB.WithContext(ctx).Find(&prodis).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db error prodi"})
		return
	}
	c.JSON(http.StatusOK, prodis)
}

// GET /api/prodi/:id_prodi/mk?semester=1
func listMKByProdiSemesterHandler(c *gin.Context) {
	ctx := c.Request.Context()

	idStr := c.Param("id_prodi")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id_prodi"})
		return
	}
	semStr := c.Query("semester")

	var mkList []model.MK
	q := db.DB.WithContext(ctx).Where("id_prodi = ?", id)
	if semStr != "" {
		sem, err := strconv.ParseUint(semStr, 10, 8)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid semester"})
			return
		}
		q = q.Where("semester = ?", sem)
	}

	if err := q.Find(&mkList).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db error mk"})
		return
	}

	c.JSON(http.StatusOK, mkList)
}

// GET /api/prodi/:id_prodi/cpl
func listCPLByProdiHandler(c *gin.Context) {
	ctx := c.Request.Context()

	idStr := c.Param("id_prodi")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id_prodi"})
		return
	}

	var list []model.CPL
	if err := db.DB.WithContext(ctx).
		Where("id_prodi = ?", id).
		Order("kode_cpl").
		Find(&list).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db error cpl"})
		return
	}

	c.JSON(http.StatusOK, list)
}

// GET /api/mk/:id_mk/cpmk
// Join berdasarkan kode_mk (kalau tabel CPMK menyimpan kode_mk lama)
func listCPMKByMKHandler(c *gin.Context) {
	ctx := c.Request.Context()

	idStr := c.Param("id_mk")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id_mk"})
		return
	}

	// ambil kode_mk dari id_mk
	var mk model.MK
	if err := db.DB.WithContext(ctx).First(&mk, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "mk not found"})
		return
	}

	// cari CPMK berdasarkan kode_mk (kalau struktur cpmk ada kolom kode_mk)
	var list []model.CPMK
	if err := db.DB.WithContext(ctx).
		Where("kode_mk = ?", mk.KodeMK).
		Order("kode_cpmk").
		Find(&list).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db error cpmk"})
		return
	}

	c.JSON(http.StatusOK, list)
}

// GET /api/prodi/:id_prodi/cpl-stats?semester=1
func getCPLStatsByProdiSemesterHandler(c *gin.Context) {
	ctx := c.Request.Context()

	idStr := c.Param("id_prodi")
	idProdi, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id_prodi"})
		return
	}

	semStr := c.Query("semester")
	if semStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "semester wajib diisi"})
		return
	}
	sem, err := strconv.Atoi(semStr)
	if err != nil || sem <= 0 || sem > 20 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid semester"})
		return
	}

	var rows []CPLStat
	query := `
SELECT
    c.id_cpl,
    c.kode_cpl,
    c.deskripsi,
    COUNT(nc.id_mhs) AS jumlah_mahasiswa,
    COALESCE(AVG(nc.nilai_angka), 0) AS rata_nilai,
    COALESCE(MIN(nc.nilai_angka), 0) AS min_nilai,
    COALESCE(MAX(nc.nilai_angka), 0) AS max_nilai,
    SUM(CASE WHEN nc.nilai_angka >= 70 THEN 1 ELSE 0 END) AS kategori_tinggi,
    SUM(CASE WHEN nc.nilai_angka >= 50 AND nc.nilai_angka < 70 THEN 1 ELSE 0 END) AS kategori_sedang,
    SUM(CASE WHEN nc.nilai_angka < 50 THEN 1 ELSE 0 END) AS kategori_rendah
FROM cpl c
LEFT JOIN nilai_cpl nc
       ON nc.id_cpl = c.id_cpl
      AND nc.semester_eval = ?
WHERE c.id_prodi = ?
GROUP BY c.id_cpl, c.kode_cpl, c.deskripsi
ORDER BY c.kode_cpl
`
	if err := db.DB.WithContext(ctx).
		Raw(query, sem, idProdi).
		Scan(&rows).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db error cpl stats"})
		return
	}

	c.JSON(http.StatusOK, rows)
}

// ========================= ADMIN: RECALC BOBOT CPL–MK & MK–CPMK =========================

// POST /api/prodi/:id_prodi/recalc-bobot
// Dipanggil setelah:
//   - update struktur cpl_mk (mapping CPL–MK)
//   - update CPMK per MK
//
// atau kapan saja kaprodi mau “resync” bobot.
func recalcBobotHandler(c *gin.Context) {
	ctx := c.Request.Context()

	idStr := c.Param("id_prodi")
	idProdi, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id_prodi"})
		return
	}

	if err := service.RecalculateWeightsForProdi(ctx, nil, idProdi); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "recalculate weights failed",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "ok",
		"message": "bobot CPL-MK dan MK-CPMK berhasil dihitung ulang",
	})
}
