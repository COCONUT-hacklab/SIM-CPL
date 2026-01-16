package http

import (
	"net/http"
	"strconv"
	"strings"

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
// GET /api/prodi/:id_prodi/mk?semester=1
func listMKByProdiSemesterHandler(c *gin.Context) {
	ctx := c.Request.Context()

	// ID Prodi tetap Uint64 (sesuai SQL Anda)
	idStr := c.Param("id_prodi")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id_prodi"})
		return
	}
	semStr := c.Query("semester")

	var mkList []model.MataKuliah
	q := db.DB.WithContext(ctx).Where("id_prodi = ?", id)
	if semStr != "" {
		sem, err := strconv.Atoi(semStr) // Gunakan Atoi untuk int biasa
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

	// === PERBAIKAN DI SINI (Gunakan String untuk UUID MK) ===
	mkIDs := make([]string, len(mkList)) // Ubah ke String slice
	for i, mk := range mkList {
		mkIDs[i] = mk.ID // Gunakan field ID (String)
	}

	// Query CPL relations
	type cplMKJoin struct {
		IDMK    string `gorm:"column:id_mk"` // Ubah ke String
		KodeCPL string `gorm:"column:kode_cpl"`
	}
	var cplMKs []cplMKJoin

	if len(mkIDs) > 0 {
		db.DB.WithContext(ctx).
			Table("cpl_mk").
			Select("cpl_mk.id_mk, cpl.kode_cpl").
			Joins("JOIN cpl ON cpl.id_cpl = cpl_mk.id_cpl").
			Where("cpl_mk.id_mk IN ?", mkIDs). // GORM support IN slice string
			Find(&cplMKs)
	}

	// Map MK ID (String) -> []CPL kode
	cplMap := make(map[string][]string) // Key map jadi String
	for _, cm := range cplMKs {
		cplMap[cm.IDMK] = append(cplMap[cm.IDMK], cm.KodeCPL)
	}

	// Build response
	type mkResp struct {
		IDMK       string   `json:"id_mk"`    // Ubah ke String
		IDProdi    uint64   `json:"id_prodi"` // Prodi local ID (jika ada)
		KodeMK     string   `json:"kode_mk"`
		NamaMK     string   `json:"nama_mk"`
		SKS        uint8    `json:"sks"`
		Semester   uint8    `json:"semester"`
		CPLTerkait []string `json:"cpl_terkait"`
	}

	respList := make([]mkResp, len(mkList))
	for i, mk := range mkList {
		// Pastikan field di struct model.MataKuliah Anda sudah diupdate ke string ID
		respList[i] = mkResp{
			IDMK: mk.ID, // String UUID
			// IDProdi:    mk.IDProdi, // (Uncomment jika field IDProdi bertipe uint64/pointer)
			KodeMK:     mk.KodeMK,
			NamaMK:     mk.NamaMK,
			SKS:        mk.SKS,
			Semester:   mk.Semester,
			CPLTerkait: cplMap[mk.ID],
		}
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
	db.DB.WithContext(ctx).Model(&model.MataKuliah{}).Where("id_prodi = ?", id).Count(&totalMK)

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
// GET /api/mk/:id_mk/cpmk
func listCPMKByMKHandler(c *gin.Context) {
	ctx := c.Request.Context()

	// === PERBAIKAN: Langsung ambil String UUID ===
	idMKStr := c.Param("id_mk")
	if idMKStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id_mk"})
		return
	}

	// Cek apakah MK ada (Optional, tapi bagus untuk validasi)
	var mk model.MataKuliah
	// Gunakan idMKStr langsung di query
	if err := db.DB.WithContext(ctx).Where("id = ?", idMKStr).First(&mk).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "mk not found"})
		return
	}

	var list []model.CPMK
	// cpmk.id_mk sekarang string (UUID)
	if err := db.DB.WithContext(ctx).
		Where("id_mk = ?", mk.ID). // ID string
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
	IDMK      string `json:"id_mk"` // UBAH KE STRING (UUID)
	KodeMK    string `json:"kode_mk"`
	NamaMK    string `json:"nama_mk"`
	SKS       uint8  `json:"sks"`
	Semester  uint8  `json:"semester"`
	CPMKCount int    `json:"cpmk_count"`
	Relasi    string `json:"relasi"` // "direct" (via cpmk)
}

type CPLMappingItem struct {
	IDCPL     uint64          `json:"id_cpl"`
	KodeCPL   string          `json:"kode_cpl"`
	Deskripsi string          `json:"deskripsi"`
	MKList    []MKMappingItem `json:"mk_list"`
}

// GET /api/prodi/:id_prodi/cpl-mapping?semester=1
// Returns CPL list with linked MK (filtered by semester) and CPMK count per MK
// GET /api/cpl/mapping?semester=...
// GET /api/cpl/mapping?semester=...
// GET /api/prodi/:id_prodi/cpl-mapping?semester=1
// GET /api/prodi/:id_prodi/cpl-mapping
func listCPLMappingHandler(c *gin.Context) {
	ctx := c.Request.Context()
	idProdiStr := c.Param("id_prodi")
	semesterStr := c.Query("semester")

	// 1. Get CPL
	var cpls []model.CPL
	if err := db.DB.WithContext(ctx).Where("id_prodi = ?", idProdiStr).Order("kode_cpl").Find(&cpls).Error; err != nil {
		c.JSON(500, gin.H{"error": "db error cpl"})
		return
	}

	// 2. Get MK
	mkQuery := db.DB.WithContext(ctx).Model(&model.MataKuliah{}).Where("id_prodi = ?", idProdiStr)
	if semesterStr != "" {
		mkQuery = mkQuery.Where("semester = ?", semesterStr)
	}
	var mks []model.MataKuliah
	if err := mkQuery.Find(&mks).Error; err != nil {
		c.JSON(500, gin.H{"error": "db error mk"})
		return
	}

	mkMap := make(map[string]model.MataKuliah)
	mkIDs := make([]string, 0)
	for _, m := range mks {
		mkMap[m.ID] = m
		mkIDs = append(mkIDs, m.ID)
	}

	// 3. Mapping Relation (CPL -> MK)
	cplToMKs := make(map[uint64][]string)
	if len(cpls) > 0 {
		rows, _ := db.DB.Table("cpl_mk").Select("distinct id_cpl, id_mk").Where("id_cpl IN (SELECT id_cpl FROM cpl WHERE id_prodi = ?)", idProdiStr).Rows()
		defer rows.Close()
		for rows.Next() {
			var idCPL uint64
			var idMK string
			rows.Scan(&idCPL, &idMK)
			cplToMKs[idCPL] = append(cplToMKs[idCPL], idMK)
		}
	}

	// 4. Get CPMK Details (Untuk ditampilkan di frontend)
	type CPMKInfo struct {
		IDMK       string
		KodeCPMK   string
		Deskripsi  string
		MatchedCPL string
	}
	var cpmkRaw []CPMKInfo
	if len(mkIDs) > 0 {
		db.DB.Table("cpmk").Select("id_mk, kode_cpmk, deskripsi, matched_cpl").Where("id_mk IN ?", mkIDs).Scan(&cpmkRaw)
	}

	// Group CPMK by MK
	mkToCPMKs := make(map[string][]CPMKInfo)
	for _, cc := range cpmkRaw {
		mkToCPMKs[cc.IDMK] = append(mkToCPMKs[cc.IDMK], cc)
	}

	// 5. Build Response
	result := make([]CPLMappingItem, 0)
	for _, cpl := range cpls {
		item := CPLMappingItem{
			IDCPL:     cpl.IDCPL,
			KodeCPL:   cpl.KodeCPL,
			Deskripsi: cpl.Deskripsi,
			MKList:    []MKMappingItem{},
		}

		// Cari MK yang terhubung
		mkIDsForCPL := cplToMKs[cpl.IDCPL]
		for _, mkID := range mkIDsForCPL {
			mk, exists := mkMap[mkID]
			if !exists {
				continue
			}

			// Filter CPMK yang relevan dengan CPL ini
			var relevantCPMKs []string
			rawList := mkToCPMKs[mkID]
			for _, r := range rawList {
				// Cek apakah kode CPL ada di string MatchedCPL (misal "CPL-01, CPL-02")
				// Bersihkan string agar match (CPL-01 vs CPL01)
				cleanRaw := strings.ReplaceAll(r.MatchedCPL, "-", "")
				cleanCPL := strings.ReplaceAll(cpl.KodeCPL, "-", "")

				if strings.Contains(r.MatchedCPL, cpl.KodeCPL) || strings.Contains(cleanRaw, cleanCPL) {
					relevantCPMKs = append(relevantCPMKs, r.KodeCPMK) // Atau r.Deskripsi jika mau
				}
			}

			// Join CPMK codes untuk ditampilkan
			cpmkDisplay := strings.Join(relevantCPMKs, ", ")

			mkItem := MKMappingItem{
				IDMK:      mk.ID,
				KodeMK:    mk.KodeMK,
				NamaMK:    mk.NamaMK,
				SKS:       mk.SKS,
				Semester:  mk.Semester,
				CPMKCount: len(relevantCPMKs), // Jumlah CPMK terkait
				Relasi:    cpmkDisplay,        // <--- KIRIM LIST CPMK DISINI (Frontend pakai field Relasi/custom)
			}
			item.MKList = append(item.MKList, mkItem)
		}
		result = append(result, item)
	}

	c.JSON(http.StatusOK, result)
}
