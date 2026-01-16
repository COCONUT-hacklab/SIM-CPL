package http

import (
	// Import Config
	"cpmk/internal/config"
	"cpmk/internal/middleware" // Pastikan folder middleware sudah ada

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	// Import Gorm
)

func NewRouter(db *gorm.DB, cfg *config.Config) *gin.Engine {
	r := gin.Default()

	// Konfigurasi CORS (Sesuai kode lama Anda)
	r.Use(cors.New(cors.Config{
		// Gunakan wildcard "*" hanya untuk memastikan koneksi tembus saat testing
		AllowAllOrigins: true,
		AllowMethods:    []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		// "ngrok-skip-browser-warning" WAJIB ada di sini
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Requested-With", "ngrok-skip-browser-warning"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	syncHandler := NewSyncHandler(db, cfg) // Tambahkan baris ini
	// Endpoint Health Check (Bisa diakses siapa saja)
	r.GET("/health", healthHandler)

	api := r.Group("/api")
	{
		// ==============================
		// 1. PUBLIC ROUTES (Tanpa Login)
		// ==============================
		api.POST("/login", loginHandler) // <-- Endpoint Login Baru
		api.GET("/prodi", listProdiHandler)

		api.GET("/prodi/:id_prodi/mk", listMKByProdiSemesterHandler)
		api.GET("/prodi/:id_prodi/cpl", listCPLByProdiHandler)
		api.GET("/prodi/:id_prodi/stats", getProdiStatsHandler)
		api.GET("/mk/:id_mk/cpmk", listCPMKByMKHandler)

		// STATISTIK CPL
		api.GET("/prodi/:id_prodi/cpl-stats", getCPLStatsByProdiSemesterHandler)
		api.GET("/prodi/:id_prodi/cpl-mapping", listCPLMappingHandler)

		// IMPORT & ADMIN (Tadi error karena duplikat, sekarang aman)
		api.POST("/nilai-mk/import", importNilaiHandler)
		api.POST("/prodi/:id_prodi/recalc-bobot", recalcBobotHandler)

		// MAHASISWA & NILAI
		api.GET("/prodi/:id_prodi/mahasiswa-nilai", listMahasiswaDenganNilaiHandler)
		api.GET("/mahasiswa/:nim/cpl", getCPLByMahasiswaHandler)
		api.GET("/mahasiswa/:nim/nilai-mk", getNilaiMKByMahasiswaHandler)
		api.GET("/mahasiswa/:nim/mk/:id_mk/analisis", getMKAnalisisMahasiswaHandler)

		api.POST("/sync/curriculum", syncHandler.TriggerSync)
		// ==============================
		// 2. PROTECTED ROUTES (Wajib Token/Login)
		// ==============================
		protected := api.Group("/midd")
		protected.Use(middleware.AuthMiddleware()) // Pasang Gembok di sini
		{
			// MASTER DATA
			protected.GET("/prodi", listProdiHandler)
			protected.GET("/prodi/:id_prodi/mk", listMKByProdiSemesterHandler)
			protected.GET("/prodi/:id_prodi/cpl", listCPLByProdiHandler)
			protected.GET("/prodi/:id_prodi/stats", getProdiStatsHandler)
			protected.GET("/mk/:id_mk/cpmk", listCPMKByMKHandler)

			// STATISTIK CPL
			protected.GET("/prodi/:id_prodi/cpl-stats", getCPLStatsByProdiSemesterHandler)
			protected.GET("/prodi/:id_prodi/cpl-mapping", listCPLMappingHandler)

			// IMPORT & ADMIN (Tadi error karena duplikat, sekarang aman)
			protected.POST("/nilai-mk/import", importNilaiHandler)
			protected.POST("/prodi/:id_prodi/recalc-bobot", recalcBobotHandler)

			// MAHASISWA & NILAI
			protected.GET("/prodi/:id_prodi/mahasiswa-nilai", listMahasiswaDenganNilaiHandler)
			protected.GET("/mahasiswa/:nim/cpl", getCPLByMahasiswaHandler)
			protected.GET("/mahasiswa/:nim/nilai-mk", getNilaiMKByMahasiswaHandler)
		}
	}

	return r
}
