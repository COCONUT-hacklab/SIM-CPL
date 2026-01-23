package utils

import (
	_ "errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

// Ganti ini dengan secret key yang susah ditebak, sebaiknya taruh di .env
var SecretKey = []byte("RAHASIA_DAPUR_SIMCPL_2025")

type JWTClaim struct {
	IDUser  uint64  `json:"id_user"`
	IDProdi *uint64 `json:"id_prodi"`
	Role    string  `json:"role"`
	jwt.RegisteredClaims
}

func HashPassword(pwd string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(pwd), bcrypt.DefaultCost)
	return string(bytes), err
}

func CheckPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

func GenerateToken(idUser uint64, prodiID *uint64, role string) (string, error) {
	claims := &JWTClaim{
		IDUser:  idUser,
		IDProdi: prodiID,
		Role:    role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)), // Token berlaku 24 jam
			Issuer:    "sim-cpl-backend",
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(SecretKey)
}
