package http

import (
	"cpmk/internal/db"
	"cpmk/internal/model"
	"net/http"

	"github.com/gin-gonic/gin"
)

// GET /api/mahasiswa/:nim/mk/:id_mk/analisis
func getMKAnalisisMahasiswaHandler(c *gin.Context) {
	ctx := c.Request.Context()
	nim := c.Param("nim")
	idMK := c.Param("id_mk")

	// 1. Validasi Mahasiswa
	var mhs model.Mahasiswa
	if err := db.DB.WithContext(ctx).Where("nim = ?", nim).First(&mhs).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "mahasiswa tidak ditemukan"})
		return
	}

	// 2. Ambil Nilai MK & Detail MK
	type MKDetail struct {
		KodeMK     string  `json:"kode_mk"`
		NamaMK     string  `json:"nama_mk"`
		SKS        uint8   `json:"sks"`
		NilaiAngka float64 `json:"nilai_angka"`
		NilaiHuruf string  `json:"nilai_huruf"`
	}

	var mkDetail MKDetail
	// FIX: Update JOIN agar menggunakan m.id (UUID)
	err := db.DB.WithContext(ctx).
		Table("nilai_mk as n").
		Select("m.kode_mk, m.nama_mk, m.sks, n.nilai_angka, n.nilai_huruf").
		Joins("JOIN mk as m ON m.id = n.id_mk"). // <-- PERBAIKAN DISINI (m.id_mk -> m.id)
		Where("n.id_mhs = ? AND n.id_mk = ?", mhs.IDMhs, idMK).
		Scan(&mkDetail).Error

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "nilai mk tidak ditemukan"})
		return
	}

	// 3. Ambil Nilai CPL yang disumbangkan MK ini
	type CPLSumbangan struct {
		KodeCPL   string  `json:"kode_cpl"`
		Deskripsi string  `json:"deskripsi"`
		Bobot     float64 `json:"bobot_mk_cpl"`
		Nilai     float64 `json:"nilai_kontribusi"`
	}

	var cplList []CPLSumbangan
	err = db.DB.WithContext(ctx).
		Table("cpl_mk as cm").
		Select("c.kode_cpl, c.deskripsi, cm.bobot_fraction as bobot, (? * cm.bobot_fraction) as nilai", mkDetail.NilaiAngka).
		Joins("JOIN cpl as c ON c.id_cpl = cm.id_cpl").
		Where("cm.id_mk = ?", idMK).
		Scan(&cplList).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "gagal hitung kontribusi cpl"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"mahasiswa": gin.H{
			"nim":  mhs.NIM,
			"nama": mhs.Nama,
		},
		"matakuliah":     mkDetail,
		"kontribusi_cpl": cplList,
	})
}

// GET /api/prodi/:id_prodi/mahasiswa-nilai?semester=1
func listMahasiswaDenganNilaiHandler(c *gin.Context) {
	ctx := c.Request.Context()
	idProdi := c.Param("id_prodi")
	semStr := c.Query("semester")

	// Filter dasar: Prodi
	query := db.DB.WithContext(ctx).
		Table("mahasiswa as m").
		Select("m.id_mhs, m.nim, m.nama, m.angkatan, COUNT(n.id_nilai_mk) as jumlah_mk_dinilai, AVG(n.nilai_angka) as ipk_semester_ini").
		Joins("LEFT JOIN nilai_mk as n ON n.id_mhs = m.id_mhs").
		Where("m.id_prodi = ?", idProdi).
		Group("m.id_mhs")

	// Filter Semester pada Nilai
	if semStr != "" {
		query = query.Where("n.semester_tempuh = ?", semStr)
	}

	type MhsList struct {
		IDMhs          uint64  `json:"id_mhs"`
		NIM            string  `json:"nim"`
		Nama           string  `json:"nama"`
		Angkatan       int     `json:"angkatan"`
		JumlahMK       int     `json:"jumlah_mk"`
		IPKSemesterIni float64 `json:"rata_nilai"`
	}

	var results []MhsList
	if err := query.Scan(&results).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
		return
	}

	c.JSON(http.StatusOK, results)
}
