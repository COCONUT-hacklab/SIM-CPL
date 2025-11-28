package http

import (
	"github.com/gin-gonic/gin"
)

func NewRouter() *gin.Engine {
	r := gin.Default()

	// health
	r.GET("/health", healthHandler)

	api := r.Group("/api")
	{
		api.GET("/prodi", listProdiHandler)
		api.GET("/prodi/:id_prodi/cpl", listCPLByProdiHandler)
		api.GET("/prodi/:id_prodi/mk", listMKByProdiSemesterHandler)
		api.GET("/mk/:id_mk/cpmk", listCPMKByMKHandler)

		api.POST("/prodi/:id_prodi/nilai-mk/import-xlsx", importNilaiMahasiswaXLSXHandler)
		api.GET("/mahasiswa/:nim/cpl", getCPLByMahasiswaHandler)
	}

	return r
}
