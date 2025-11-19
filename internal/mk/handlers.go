package mk

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

// Register semua route di sini
func (h *Handler) Register(r *gin.Engine) {
	api := r.Group("/api")

	// CPL
	api.POST("/cpl", h.createCPL)
	api.GET("/cpl", h.listCPL)
	api.GET("/cpl/:id", h.getCPL)
	api.PUT("/cpl/:id", h.updateCPL)
	api.DELETE("/cpl/:id", h.deleteCPL)

	// MK
	api.POST("/mk", h.createMK)
	api.GET("/mk", h.listMK)
	api.GET("/mk/:id", h.getMK)

	// CPMK
	api.POST("/cpmk", h.createCPMK)
	api.GET("/cpmk", h.listCPMK)

	// Relasi CPL <-> MK
	api.PUT("/mk/:id/assign-cpl", h.assignCPLToMK)

	// Relasi MK <-> CPMK
	api.PUT("/mk/:id/assign-cpmk", h.assignCPMKToMK)
}

//
// ========== CPL HANDLERS ==========
//

type createCPLReq struct {
	KodeCPL   string `json:"kode_cpl" binding:"required"`
	Deskripsi string `json:"deskripsi" binding:"required"`
}

func (h *Handler) createCPL(c *gin.Context) {
	var req createCPLReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	cpl, err := h.svc.CreateCPL(c, req.KodeCPL, req.Deskripsi)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, cpl)
}

func (h *Handler) listCPL(c *gin.Context) {
	cpls, err := h.svc.ListCPL(c)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, cpls)
}

func (h *Handler) getCPL(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)
	cpl, err := h.svc.GetCPL(c, id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, cpl)
}

type updateCPLReq struct {
	KodeCPL   *string `json:"kode_cpl"`
	Deskripsi *string `json:"deskripsi"`
}

func (h *Handler) updateCPL(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)

	var req updateCPLReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.svc.UpdateCPL(c, id, req.KodeCPL, req.Deskripsi); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *Handler) deleteCPL(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)

	if err := h.svc.DeleteCPL(c, id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}

//
// ========== MK HANDLERS ==========
//

type createMKReq struct {
	KodeMK   string `json:"kode_mk" binding:"required"`
	NamaMK   string `json:"nama_mk" binding:"required"`
	SKS      *uint8 `json:"sks"`
	Semester *uint8 `json:"semester"`
}

func (h *Handler) createMK(c *gin.Context) {
	var req createMKReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	mk, err := h.svc.CreateMK(c, req.KodeMK, req.NamaMK, req.SKS, req.Semester)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, mk)
}

func (h *Handler) listMK(c *gin.Context) {
	mks, err := h.svc.ListMK(c)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, mks)
}

func (h *Handler) getMK(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)

	mkDetail, err := h.svc.GetMKDetail(c, id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, mkDetail)
}

//
// ========== CPMK HANDLERS ==========
//

type createCPMKReq struct {
	KodeCPMK  string `json:"kode_cpmk" binding:"required"`
	Deskripsi string `json:"deskripsi" binding:"required"`
}

func (h *Handler) createCPMK(c *gin.Context) {
	var req createCPMKReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	cpmk, err := h.svc.CreateCPMK(c, CreateCPMKReq{
		KodeCPMK:  req.KodeCPMK,
		Deskripsi: req.Deskripsi,
	})
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, cpmk)
}

func (h *Handler) listCPMK(c *gin.Context) {
	cpmks, err := h.svc.ListCPMK(c)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, cpmks)
}

//
// ========== RELASI: CPL <-> MK ==========
//

type assignCPLItem struct {
	IDCPL uint64   `json:"id_cpl" binding:"required"`
	Bobot *float64 `json:"bobot_pct"` // bisa null kalau belum diatur
}

type assignCPLReq struct {
	Items []assignCPLItem `json:"items" binding:"required"`
}

func parseUintMust(s string) uint64 {
	id, _ := strconv.ParseUint(s, 10, 64)
	return id
}

func (h *Handler) assignCPLToMK(c *gin.Context) {
	idMK := parseUintMust(c.Param("id"))

	var req assignCPLReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	in := AssignCPLToMKReq{
		IDMK: idMK,
	}
	for _, item := range req.Items {
		it := item
		in.Items = append(in.Items, struct {
			IDCPL uint64   `json:"id_cpl"`
			Bobot *float64 `json:"bobot_pct"`
		}{
			IDCPL: it.IDCPL,
			Bobot: it.Bobot,
		})
	}

	if err := h.svc.AssignCPLToMK(c, in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}

//
// ========== RELASI: MK <-> CPMK ==========
//

type assignCPMKReq struct {
	IDCPMKList []uint64 `json:"id_cpmk_list" binding:"required"`
}

func (h *Handler) assignCPMKToMK(c *gin.Context) {
	idMK := parseUintMust(c.Param("id"))

	var req assignCPMKReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.svc.AssignCPMKToMK(c, AssignCPMKToMKReq{
		IDMK:    idMK,
		IDCPMKs: req.IDCPMKList,
	}); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}
