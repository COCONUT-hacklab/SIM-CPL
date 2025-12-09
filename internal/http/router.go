package http

import (
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func NewRouter() *gin.Engine {
	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"}, // Allow all origins
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "X-Requested-With"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: false,
		MaxAge:           12 * time.Hour, // 12 hours
	}))
	// health
	r.GET("/health", healthHandler)

	api := r.Group("/api")
	{
		api.GET("/prodi", listProdiHandler)
		api.GET("/prodi/:id_prodi/cpl", listCPLByProdiHandler)
		api.GET("/prodi/:id_prodi/mk", listMKByProdiSemesterHandler)
		api.GET("/mk/:id_mk/cpmk", listCPMKByMKHandler)

		//IMPORT Nilai
		api.POST("/nilai-mk/import", importNilaiJSONHandler)

		api.GET("/mahasiswa/:nim/cpl", getCPLByMahasiswaHandler)

		// Prodi CPL-MK Mapping
		api.POST("/prodi/:id_prodi/cpl-mk/import-xlsx", importCPLMKMappingHandler)

		//api.GET("/prodi/:id_prodi/cpl-mk", lis	tCPLMKByProdiHandler)
		//api.GET("/prodi/:id_prodi/cpl-mk/summary", getCPLMKSummaryHandler)
	}

	return r
}
