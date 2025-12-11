package http

import (
	"errors"
	"net/http"
	"strconv"

	"cpmk/internal/db"
	"cpmk/internal/model"
	"cpmk/internal/service"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type importMatkulPayload struct {
	Kode string `json:"kode"`
	Nama string `json:"nama"`
	SKS  uint8  `json:"sks"`
}

type importMahasiswaPayload struct {
	NIM      string             `json:"nim"`
	Nama     string             `json:"nama"`
	NilaiMap map[string]float64 `json:"nilaiMap"`
}

type importNilaiRequest struct {
	ProdiKode   string                   `json:"prodiKode"`
	Semester    uint8                    `json:"semester"`
	TahunAjaran string                   `json:"tahunAjaran"`
	MatkulList  []importMatkulPayload    `json:"matkulList"`
	ImportData  []importMahasiswaPayload `json:"importData"`
}

// POST /api/nilai-mk/import
func importNilaiHandler(c *gin.Context) {
	ctx := c.Request.Context()

	var req importNilaiRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "payload tidak valid: " + err.Error(),
		})
		return
	}

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

	// mapping payload ke struct service
	matkulItems := make([]service.ImportMatkulItem, 0, len(req.MatkulList))
	for _, m := range req.MatkulList {
		matkulItems = append(matkulItems, service.ImportMatkulItem{
			Kode: m.Kode,
			Nama: m.Nama,
			SKS:  m.SKS,
		})
	}

	importItems := make([]service.ImportMahasiswaItem, 0, len(req.ImportData))
	for _, d := range req.ImportData {
		importItems = append(importItems, service.ImportMahasiswaItem{
			NIM:      d.NIM,
			Nama:     d.Nama,
			NilaiMap: d.NilaiMap,
		})
	}

	params := service.ImportNilaiParams{
		ProdiKode:   req.ProdiKode,
		Semester:    req.Semester,
		TahunAjaran: req.TahunAjaran,
		MatkulList:  matkulItems,
		ImportData:  importItems,
	}

	summary, err := service.ImportNilaiMK(ctx, nil, params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "gagal import: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "ok",
		"summary": summary,
	})
}

// GET /api/mahasiswa/:nim/cpl?semester=1
func getCPLByMahasiswaHandler(c *gin.Context) {
	ctx := c.Request.Context()
	nim := c.Param("nim")
	semStr := c.Query("semester")

	if semStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "semester wajib diisi"})
		return
	}

	// parse ke int
	var sem uint8
	{
		var tmp uint64
		var err error
		tmp, err = strconv.ParseUint(semStr, 10, 8)
		if err != nil || tmp == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "semester tidak valid"})
			return
		}
		sem = uint8(tmp)
	}

	// ambil mahasiswa
	var mhs model.Mahasiswa
	if err := db.DB.WithContext(ctx).Where("nim = ?", nim).First(&mhs).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "mahasiswa tidak ditemukan"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "db error mahasiswa"})
		}
		return
	}

	// ambil nilai CPL untuk semester_eval = sem
	var list []model.NilaiCPL
	if err := db.DB.WithContext(ctx).
		Where("id_mhs = ? AND semester_eval = ?", mhs.IDMhs, sem).
		Find(&list).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db error nilai_cpl"})
		return
	}

	// join CPL code (bisa pakai 1 query terpisah atau simple loop)
	// untuk efisiensi, kita ambil semua cpl id -> kode_cpl dalam satu query
	cplIDs := make([]uint64, 0, len(list))
	for _, n := range list {
		cplIDs = append(cplIDs, n.IDCPL)
	}

	cplMap := map[uint64]string{}
	if len(cplIDs) > 0 {
		var cpls []model.CPL
		if err := db.DB.WithContext(ctx).
			Where("id_cpl IN ?", cplIDs).
			Find(&cpls).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "db error cpl"})
			return
		}
		for _, cpl := range cpls {
			cplMap[cpl.IDCPL] = cpl.KodeCPL
		}
	}

	type cplResp struct {
		KodeCPL    string  `json:"kode_cpl"`
		NilaiAngka float64 `json:"nilai_angka"`
	}

	respList := make([]cplResp, 0, len(list))
	for _, n := range list {
		respList = append(respList, cplResp{
			KodeCPL:    cplMap[n.IDCPL],
			NilaiAngka: n.NilaiAngka,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"nim":      mhs.NIM,
		"nama":     mhs.Nama,
		"semester": sem,
		"cpl":      respList,
	})
}
