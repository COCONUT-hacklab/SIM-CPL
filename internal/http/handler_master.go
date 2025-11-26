package http

import (
	"net/http"
	"strconv"

	"cpmk/internal/db"
	"cpmk/internal/model"

	"github.com/gin-gonic/gin"
)

// GET /api/prodi
func listProdiHandler(c *gin.Context) {
	var prodis []model.Prodi
	if err := db.DB.Find(&prodis).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
		return
	}
	c.JSON(http.StatusOK, prodis)
}

// GET /api/prodi/:id_prodi/cpl
func listCPLByProdiHandler(c *gin.Context) {
	idStr := c.Param("id_prodi")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id_prodi"})
		return
	}

	var cpls []model.CPL
	if err := db.DB.Where("id_prodi = ?", id).Find(&cpls).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
		return
	}
	c.JSON(http.StatusOK, cpls)
}

// GET /api/prodi/:id_prodi/mk?semester=1
func listMKByProdiSemesterHandler(c *gin.Context) {
	idStr := c.Param("id_prodi")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id_prodi"})
		return
	}
	semStr := c.Query("semester")
	var mkList []model.MK

	q := db.DB.Where("id_prodi = ?", id)
	if semStr != "" {
		sem, err := strconv.ParseUint(semStr, 10, 8)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid semester"})
			return
		}
		q = q.Where("semester = ?", sem)
	}
	if err := q.Find(&mkList).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
		return
	}
	c.JSON(http.StatusOK, mkList)
}

// GET /api/mk/:id_mk/cpmk
func listCPMKByMKHandler(c *gin.Context) {
	idStr := c.Param("id_mk")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id_mk"})
		return
	}

	var list []model.CPMK
	if err := db.DB.Where("id_mk = ?", id).Find(&list).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
		return
	}
	c.JSON(http.StatusOK, list)
}
