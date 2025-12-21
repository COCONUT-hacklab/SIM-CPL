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
