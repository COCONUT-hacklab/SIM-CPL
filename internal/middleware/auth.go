package middleware

import (
	"net/http"
	"strings"

	"cpmk/internal/utils"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Akses ditolak: Token tidak ditemukan"})
			c.Abort()
			return
		}

		// Format token harus: "Bearer <token_panjang>"
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Format token salah"})
			c.Abort()
			return
		}

		tokenString := parts[1]
		claims := &utils.JWTClaim{}

		// Verifikasi token dengan Secret Key
		token, err := jwt.ParseWithClaims(tokenString, claims, func(t *jwt.Token) (interface{}, error) {
			return utils.SecretKey, nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token tidak valid atau sudah kadaluarsa"})
			c.Abort()
			return
		}

		// Token valid! Simpan info user agar bisa dipakai di handler lain (opsional)
		c.Set("id_user", claims.IDUser)
		c.Set("id_prodi", claims.IDProdi)
		c.Set("role", claims.Role)

		c.Next()
	}
}
