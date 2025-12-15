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
		MaxAge:           12 * time.Hour,
	}))

	// health
	r.GET("/health", healthHandler)

	api := r.Group("/api")
	{
		// MASTER DATA
		api.GET("/prodi", listProdiHandler)
		api.GET("/prodi/:id_prodi/mk", listMKByProdiSemesterHandler)
		api.GET("/prodi/:id_prodi/cpl", listCPLByProdiHandler)
		api.GET("/prodi/:id_prodi/stats", getProdiStatsHandler)
		api.GET("/mk/:id_mk/cpmk", listCPMKByMKHandler)

		// STATISTIK CPL PER PRODI + SEMESTER
		api.GET("/prodi/:id_prodi/cpl-stats", getCPLStatsByProdiSemesterHandler)

		// CPL MAPPING (CPL -> MK -> CPMK)
		api.GET("/prodi/:id_prodi/cpl-mapping", getCPLMappingHandler)

		// IMPORT NILAI MK
		// (kalau handler kamu namanya importNilaiJSONHandler, ganti di sini)
		api.POST("/nilai-mk/import", importNilaiHandler)

		// ADMIN – RECALC BOBOT CPL-MK & MK-CPMK
		api.POST("/prodi/:id_prodi/recalc-bobot", recalcBobotHandler)

		api.GET("/prodi/:id_prodi/mahasiswa-nilai", listMahasiswaDenganNilaiHandler)

		// NILAI CPL PER MAHASISWA
		api.GET("/mahasiswa/:nim/cpl", getCPLByMahasiswaHandler)

		// (Endpoint lain seperti /prodi/:id_prodi/mahasiswa-nilai atau
		//  /mahasiswa/:nim/cpl bisa kamu daftarkan di sini juga,
		//  disesuaikan dengan file handler_nilai.go yang sekarang.)
	}

	return r
}
