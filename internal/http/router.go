package http

import (
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func NewRouter() *gin.Engine {
	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "X-Requested-With"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: false,
		MaxAge:           12 * time.Hour,
	}))

	r.GET("/health", healthHandler)

	api := r.Group("/api")
	{
		api.GET("/prodi", listProdiHandler)
		api.GET("/prodi/:id_prodi/mk", listMKByProdiSemesterHandler)
		api.GET("/prodi/:id_prodi/cpl", listCPLByProdiHandler)
		api.GET("/prodi/:id_prodi/mahasiswa-nilai", listMahasiswaDenganNilaiHandler)
		api.GET("/prodi/:id_prodi/cpl-stats", getCPLStatsByProdiSemesterHandler)

		api.GET("/mk/:id_mk/cpmk", listCPMKByMKHandler)

		api.POST("/nilai-mk/import", importNilaiHandler)
		api.GET("/mahasiswa/:nim/cpl", getCPLByMahasiswaHandler)
	}

	return r
}
