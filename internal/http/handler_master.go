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

	// Get all MK IDs for batch query
	mkIDs := make([]uint64, len(mkList))
	for i, mk := range mkList {
		mkIDs[i] = mk.IDMK
	}

	// Query CPL relations for all MKs in one batch
	type cplMKJoin struct {
		IDMK    uint64 `gorm:"column:id_mk"`
		KodeCPL string `gorm:"column:kode_cpl"`
	}
	var cplMKs []cplMKJoin
	if len(mkIDs) > 0 {
		db.DB.WithContext(ctx).
			Table("cpl_mk").
			Select("cpl_mk.id_mk, cpl.kode_cpl").
			Joins("JOIN cpl ON cpl.id_cpl = cpl_mk.id_cpl").
			Where("cpl_mk.id_mk IN ?", mkIDs).
			Find(&cplMKs)
	}

	// Build map of MK ID -> []CPL kode
	cplMap := make(map[uint64][]string)
	for _, cm := range cplMKs {
		cplMap[cm.IDMK] = append(cplMap[cm.IDMK], cm.KodeCPL)
	}

	// Build response with cpl_terkait
	type mkResp struct {
		IDMK       uint64   `json:"id_mk"`
		IDProdi    uint64   `json:"id_prodi"`
		KodeMK     string   `json:"kode_mk"`
		NamaMK     string   `json:"nama_mk"`
		SKS        uint8    `json:"sks"`
		Semester   uint8    `json:"semester"`
		CPLTerkait []string `json:"cpl_terkait"`
	}

	respList := make([]mkResp, len(mkList))
	for i, mk := range mkList {
		respList[i] = mkResp{
			IDMK:       mk.IDMK,
			IDProdi:    mk.IDProdi,
			KodeMK:     mk.KodeMK,
			NamaMK:     mk.NamaMK,
			SKS:        mk.SKS,
			Semester:   mk.Semester,
			CPLTerkait: cplMap[mk.IDMK],
		}
		// Ensure not nil
		if respList[i].CPLTerkait == nil {
			respList[i].CPLTerkait = []string{}
		}
	}

	c.JSON(http.StatusOK, respList)
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

// GET /api/prodi/:id_prodi/stats
// Returns comprehensive prodi statistics for the Per Prodi tab
func getProdiStatsHandler(c *gin.Context) {
	ctx := c.Request.Context()

	idStr := c.Param("id_prodi")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id_prodi"})
		return
	}

	// Get prodi info
	var prodi model.Prodi
	if err := db.DB.WithContext(ctx).Where("id_prodi = ?", id).First(&prodi).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "prodi not found"})
		return
	}

	// Count mahasiswa per angkatan
	type angkatanCount struct {
		Angkatan int   `gorm:"column:angkatan"`
		Jumlah   int64 `gorm:"column:jumlah"`
	}
	var angkatanDist []angkatanCount
	db.DB.WithContext(ctx).
		Table("mahasiswa").
		Select("angkatan, COUNT(*) as jumlah").
		Where("id_prodi = ?", id).
		Group("angkatan").
		Order("angkatan").
		Scan(&angkatanDist)

	// Count mahasiswa by status
	type statusCount struct {
		Status string `gorm:"column:status"`
		Jumlah int64  `gorm:"column:jumlah"`
	}
	var statusDist []statusCount
	db.DB.WithContext(ctx).
		Table("mahasiswa").
		Select("status, COUNT(*) as jumlah").
		Where("id_prodi = ?", id).
		Group("status").
		Scan(&statusDist)

	// Total mahasiswa
	var totalMahasiswa int64
	db.DB.WithContext(ctx).Model(&model.Mahasiswa{}).Where("id_prodi = ?", id).Count(&totalMahasiswa)

	// Total MK
	var totalMK int64
	db.DB.WithContext(ctx).Model(&model.MK{}).Where("id_prodi = ?", id).Count(&totalMK)

	// Total CPL
	var totalCPL int64
	db.DB.WithContext(ctx).Model(&model.CPL{}).Where("id_prodi = ?", id).Count(&totalCPL)

	// Total nilai MK records
	var totalNilaiMK int64
	db.DB.WithContext(ctx).
		Table("nilai_mk").
		Joins("JOIN mahasiswa ON mahasiswa.id_mhs = nilai_mk.id_mhs").
		Where("mahasiswa.id_prodi = ?", id).
		Count(&totalNilaiMK)

	// Build distribusi angkatan response
	distribusiAngkatan := make([]gin.H, len(angkatanDist))
	for i, a := range angkatanDist {
		distribusiAngkatan[i] = gin.H{
			"angkatan": a.Angkatan,
			"jumlah":   a.Jumlah,
		}
	}

	// Build distribusi status response
	distribusiStatus := make([]gin.H, len(statusDist))
	for i, s := range statusDist {
		distribusiStatus[i] = gin.H{
			"status": s.Status,
			"jumlah": s.Jumlah,
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"prodi": gin.H{
			"id_prodi":   prodi.IDProdi,
			"kode_prodi": prodi.KodeProdi,
			"nama_prodi": prodi.NamaProdi,
		},
		"total_mahasiswa":     totalMahasiswa,
		"total_mk":            totalMK,
		"total_cpl":           totalCPL,
		"total_nilai_mk":      totalNilaiMK,
		"distribusi_angkatan": distribusiAngkatan,
		"distribusi_status":   distribusiStatus,
	})
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
		Where("id_mk = ?", mk.IDMK).
		Order("kode_cpmk").
		Find(&list).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db error cpmk"})
		return
	}

	c.JSON(http.StatusOK, list)
}

// GET /api/prodi/:id_prodi/cpl-stats?semester=1
// If semester is omitted, returns overall CPL stats across all semesters
func getCPLStatsByProdiSemesterHandler(c *gin.Context) {
	ctx := c.Request.Context()

	idStr := c.Param("id_prodi")
	idProdi, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id_prodi"})
		return
	}

	semStr := c.Query("semester")

	var rows []CPLStat
	var query string
	var args []any

	if semStr != "" {
		// Specific semester filter
		sem, err := strconv.Atoi(semStr)
		if err != nil || sem <= 0 || sem > 20 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid semester"})
			return
		}

		query = `
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
		args = []any{sem, idProdi}
	} else {
		// Overall stats (no semester filter)
		query = `
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
LEFT JOIN nilai_cpl nc ON nc.id_cpl = c.id_cpl
WHERE c.id_prodi = ?
GROUP BY c.id_cpl, c.kode_cpl, c.deskripsi
ORDER BY c.kode_cpl
`
		args = []any{idProdi}
	}

	if err := db.DB.WithContext(ctx).
		Raw(query, args...).
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

// ========================= CPL MAPPING (CPL -> MK -> CPMK) =========================

type MKMappingItem struct {
	IDMK      uint64 `json:"id_mk"`
	KodeMK    string `json:"kode_mk"`
	NamaMK    string `json:"nama_mk"`
	SKS       uint8  `json:"sks"`
	Semester  uint8  `json:"semester"`
	CPMKCount int    `json:"cpmk_count"`
}

type CPLMappingItem struct {
	IDCPL     uint64          `json:"id_cpl"`
	KodeCPL   string          `json:"kode_cpl"`
	Deskripsi string          `json:"deskripsi"`
	MKList    []MKMappingItem `json:"mk_list"`
}

// GET /api/prodi/:id_prodi/cpl-mapping?semester=1
// Returns CPL list with linked MK (filtered by semester) and CPMK count per MK
func getCPLMappingHandler(c *gin.Context) {
	ctx := c.Request.Context()

	idStr := c.Param("id_prodi")
	idProdi, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id_prodi"})
		return
	}

	semStr := c.Query("semester")
	var semFilter *uint8
	if semStr != "" {
		sem, err := strconv.ParseUint(semStr, 10, 8)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid semester"})
			return
		}
		s := uint8(sem)
		semFilter = &s
	}

	// 1. Get all CPL for this prodi
	var cpls []model.CPL
	if err := db.DB.WithContext(ctx).
		Where("id_prodi = ?", idProdi).
		Order("kode_cpl").
		Find(&cpls).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db error cpl"})
		return
	}

	// 2. Get CPL-MK mappings
	var cplMKs []model.CPLMK
	if err := db.DB.WithContext(ctx).Find(&cplMKs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db error cpl_mk"})
		return
	}

	// Build map: id_cpl -> []id_mk
	cplToMKs := make(map[uint64][]uint64)
	for _, cm := range cplMKs {
		cplToMKs[cm.IDCPL] = append(cplToMKs[cm.IDCPL], cm.IDMK)
	}

	// 3. Get all MK for this prodi (optionally filtered by semester)
	var mks []model.MK
	mkQuery := db.DB.WithContext(ctx).Where("id_prodi = ?", idProdi)
	if semFilter != nil {
		mkQuery = mkQuery.Where("semester = ?", *semFilter)
	}
	if err := mkQuery.Find(&mks).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db error mk"})
		return
	}

	// Build map: id_mk -> MK
	mkMap := make(map[uint64]model.MK)
	mkIDs := make([]uint64, 0, len(mks))
	for _, mk := range mks {
		mkMap[mk.IDMK] = mk
		mkIDs = append(mkIDs, mk.IDMK)
	}

	// 4. Count CPMK per MK
	type cpmkCount struct {
		IDMK  uint64 `gorm:"column:id_mk"`
		Count int    `gorm:"column:cnt"`
	}
	var cpmkCounts []cpmkCount
	if len(mkIDs) > 0 {
		if err := db.DB.WithContext(ctx).
			Model(&model.CPMK{}).
			Select("id_mk, COUNT(*) as cnt").
			Where("id_mk IN ?", mkIDs).
			Group("id_mk").
			Scan(&cpmkCounts).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "db error cpmk count"})
			return
		}
	}
	cpmkCountMap := make(map[uint64]int)
	for _, cc := range cpmkCounts {
		cpmkCountMap[cc.IDMK] = cc.Count
	}

	// 5. Build response
	result := make([]CPLMappingItem, 0, len(cpls))
	for _, cpl := range cpls {
		item := CPLMappingItem{
			IDCPL:     cpl.IDCPL,
			KodeCPL:   cpl.KodeCPL,
			Deskripsi: cpl.Deskripsi,
			MKList:    []MKMappingItem{},
		}

		// Get MK IDs linked to this CPL
		mkIDsForCPL := cplToMKs[cpl.IDCPL]
		for _, mkID := range mkIDsForCPL {
			mk, exists := mkMap[mkID]
			if !exists {
				// MK not in current semester filter
				continue
			}
			item.MKList = append(item.MKList, MKMappingItem{
				IDMK:      mk.IDMK,
				KodeMK:    mk.KodeMK,
				NamaMK:    mk.NamaMK,
				SKS:       mk.SKS,
				Semester:  mk.Semester,
				CPMKCount: cpmkCountMap[mk.IDMK],
			})
		}

		result = append(result, item)
	}

	c.JSON(http.StatusOK, result)
}
