package http

import (
	"net/http"

	"cpmk/internal/db"
	"cpmk/internal/model"
	"cpmk/internal/utils"

	"github.com/gin-gonic/gin"
)

type loginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

func loginHandler(c *gin.Context) {
	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Format data tidak valid"})
		return
	}

	// 1. Cari user di database
	var user model.User
	if err := db.DB.Where("email = ?", req.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Email atau password salah"})
		return
	}

	// 2. Cek Password
	if !utils.CheckPasswordHash(req.Password, user.Password) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Email atau password salah"})
		return
	}

	// 3. Buat Token JWT
	token, err := utils.GenerateToken(user.ID, user.IDProdi, user.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat token"})
		return
	}

	// 4. Kirim respon sukses
	c.JSON(http.StatusOK, gin.H{
		"token": token,
		"user": gin.H{
			"id_user":  user.ID,
			"nama":     user.Nama,
			"email":    user.Email,
			"id_prodi": user.IDProdi,
			"role":     user.Role,
		},
	})
}
