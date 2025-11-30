package http

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"cpmk/internal/db"
	"cpmk/internal/model"

	"github.com/gin-gonic/gin"
	"github.com/xuri/excelize/v2"
	"gorm.io/gorm"
)

func normalizeHeader(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	s = strings.ReplaceAll(s, " ", "")
	s = strings.ReplaceAll(s, "_", "")
	return s
}

// POST /api/prodi/:id_prodi/cpl-mk/import-xlsx
func importCPLMKMappingHandler(c *gin.Context) {
	idProdiStr := c.Param("id_prodi")
	idProdi, err := strconv.ParseUint(idProdiStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id_prodi"})
		return
	}

	fileHeader, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file is required (field: file)"})
		return
	}

	fh, err := fileHeader.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "cannot open uploaded file"})
		return
	}
	defer fh.Close()

	xf, err := excelize.OpenReader(fh)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid xlsx: " + err.Error()})
		return
	}
	defer xf.Close()

	// Pakai sheet "mk & cpl" kalau ada, kalau tidak pakai sheet pertama
	sheets := xf.GetSheetList()
	if len(sheets) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "xlsx has no sheets"})
		return
	}
	sheetName := "mk & cpl"
	found := false
	for _, s := range sheets {
		if strings.EqualFold(strings.TrimSpace(s), sheetName) {
			sheetName = s
			found = true
			break
		}
	}
	if !found {
		sheetName = sheets[0]
	}

	rows, err := xf.GetRows(sheetName)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "cannot read sheet: " + err.Error()})
		return
	}
	if len(rows) < 2 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no data rows"})
		return
	}

	header := rows[0]
	if len(header) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "header row is empty"})
		return
	}

	// Identifikasi kolom "kode mk" dan kolom CPL
	kodeMKIdx := -1
	cplCols := make(map[int]string) // colIndex -> kode_cpl (e.g. "CPL1")

	for idx, h := range header {
		nh := normalizeHeader(h)
		if nh == "kodemk" || nh == "kodemata kuliah" || nh == "kodemkobe" {
			kodeMKIdx = idx
			continue
		}
		if strings.HasPrefix(nh, "cpl") {
			// misal header "CPL1" -> kode_cpl "CPL1"
			// atau "cpl_1" -> "CPL1"
			code := strings.ToUpper(strings.ReplaceAll(h, " ", ""))
			code = strings.ToUpper(strings.ReplaceAll(code, "_", ""))
			// kalau malah jadi "CPL1" "CPL2" dsb sudah oke
			if !strings.HasPrefix(code, "CPL") {
				// fallback from normalized name
				code = "CPL" + strings.TrimPrefix(nh, "cpl")
				code = strings.ToUpper(code)
			}
			cplCols[idx] = code
		}
	}

	if kodeMKIdx == -1 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "cannot find Kode MK column in header"})
		return
	}
	if len(cplCols) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no CPL columns detected in header"})
		return
	}

	// Map: kode_cpl -> list of kode_mk
	cplToMK := map[string][]string{}

	for i, row := range rows {
		if i == 0 {
			continue // header
		}
		if kodeMKIdx >= len(row) {
			continue
		}
		kodeMK := strings.TrimSpace(row[kodeMKIdx])
		if kodeMK == "" {
			continue
		}

		// periksa tiap kolom CPL
		for colIdx, kodeCPL := range cplCols {
			if colIdx >= len(row) {
				continue
			}
			val := strings.TrimSpace(row[colIdx])
			if val == "" {
				continue // tidak memuat CPL ini
			}
			// ada isi -> MK ini memuat CPL tersebut
			cplToMK[kodeCPL] = append(cplToMK[kodeCPL], kodeMK)
		}
	}

	if len(cplToMK) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no CPL-MK relationships found (all empty?)"})
		return
	}

	type SummaryItem struct {
		KodeCPL      string   `json:"kode_cpl"`
		CountMK      int      `json:"count_mk"`
		BobotPerMK   float64  `json:"bobot_per_mk"`
		KodeMKSample []string `json:"kode_mk_sample"`
	}

	var summary []SummaryItem

	// Jalankan dalam transaksi
	err = db.DB.Transaction(func(tx *gorm.DB) error {
		// Optional: hapus mapping lama prodi ini dulu
		// (kalau cpl_mk punya id_prodi, gunakan WHERE id_prodi = ?)
		// kalau tidak, kita ambil cpl per prodi lalu delete by id_cpl
		var cpls []model.CPL
		if err := tx.Where("id_prodi = ?", idProdi).Find(&cpls).Error; err != nil {
			return err
		}
		cplIDByKode := map[string]uint64{}
		for _, c := range cpls {
			cplIDByKode[strings.ToUpper(strings.TrimSpace(c.KodeCPL))] = c.IDCPL
		}

		// Ambil semua MK prodi ini (lookup by kode_mk)
		var mks []model.MK
		if err := tx.Where("id_prodi = ?", idProdi).Find(&mks).Error; err != nil {
			return err
		}
		mkIDByKode := map[string]uint64{}
		for _, m := range mks {
			mkIDByKode[strings.TrimSpace(m.KodeMK)] = m.IDMK
		}

		// Hapus mapping lama untuk CPL prodi ini
		var cplIDs []uint64
		for _, c := range cpls {
			cplIDs = append(cplIDs, c.IDCPL)
		}
		if len(cplIDs) > 0 {
			if err := tx.Where("id_cpl IN ?", cplIDs).Delete(&model.CPLMK{}).Error; err != nil {
				return err
			}
		}

		// Insert mapping baru
		for kodeCPL, mkCodes := range cplToMK {
			kodeCPLNorm := strings.ToUpper(strings.TrimSpace(kodeCPL))
			idCPL, ok := cplIDByKode[kodeCPLNorm]
			if !ok {
				return fmt.Errorf("CPL %s (from header) not found in table cpl for prodi %d", kodeCPLNorm, idProdi)
			}

			// filter MK yang benar-benar ada di tabel mk
			var mkIDs []uint64
			var sampleMK []string

			for _, km := range mkCodes {
				idMK, ok := mkIDByKode[km]
				if !ok {
					// kalau mau keras, bisa return error di sini
					// return fmt.Errorf("kode_mk %s (from mapping) not found in table mk", km)
					// untuk sekarang, skip yang tidak ada
					continue
				}
				mkIDs = append(mkIDs, idMK)
				if len(sampleMK) < 5 {
					sampleMK = append(sampleMK, km)
				}
			}

			if len(mkIDs) == 0 {
				continue
			}

			bobot := 1.0 / float64(len(mkIDs))

			for _, idMK := range mkIDs {
				rec := model.CPLMK{
					IDCPL:         idCPL,
					IDMK:          idMK,
					BobotFraction: bobot,
					Sumber:        "import_xlsx",
				}
				if err := tx.Create(&rec).Error; err != nil {
					return err
				}
			}

			summary = append(summary, SummaryItem{
				KodeCPL:      kodeCPLNorm,
				CountMK:      len(mkIDs),
				BobotPerMK:   bobot,
				KodeMKSample: sampleMK,
			})
		}

		return nil
	})

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":           "ok",
		"id_prodi":         idProdi,
		"cpl_mk_generated": summary,
	})
}
