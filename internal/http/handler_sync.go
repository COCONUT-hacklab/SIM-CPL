package http

import (
	"net/http"
	"strconv"

	"cpmk/internal/config"
	"cpmk/internal/service"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type SyncHandler struct {
	Service *service.SyncService
}

func NewSyncHandler(db *gorm.DB, cfg *config.Config) *SyncHandler {
	return &SyncHandler{
		Service: service.NewSyncService(db, cfg),
	}
}

// TriggerSync adalah endpoint yang akan dipanggil Admin
// POST /api/sync/curriculum?prodi_id=1
func (h *SyncHandler) TriggerSync(c *gin.Context) {
	// Ambil ID Prodi tujuan (misal dari Query Param atau Token Admin)
	prodiIDStr := c.Query("prodi_id")
	if prodiIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Parameter prodi_id wajib diisi"})
		return
	}

	prodiID, err := strconv.ParseUint(prodiIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID Prodi tidak valid"})
		return
	}

	// Panggil Service
	if err := h.Service.SyncCurriculum(prodiID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Gagal sinkronisasi data",
			"detail":  err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Data Kurikulum berhasil disinkronkan dari Smart RPS",
	})
}
