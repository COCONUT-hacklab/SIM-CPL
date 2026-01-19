package service

import (
	"cpmk/internal/config"
	"cpmk/internal/dto"
	"cpmk/internal/model"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type SyncService struct {
	DB     *gorm.DB
	Config *config.Config
}

func NewSyncService(db *gorm.DB, cfg *config.Config) *SyncService {
	return &SyncService{DB: db, Config: cfg}
}

// Helper untuk variasi kode prodi
func mapKodeProdiToPrefix(kodeAngka string) []string {
	kode := strings.TrimSpace(kodeAngka)
	switch kode {
	case "20201":
		return []string{"CW620201", "20201"}
	case "22202":
		return []string{"CW622202", "CW622020", "22202"}
	case "23201":
		return []string{"CW623201", "23201"}
	case "35201":
		return []string{"CW635201", "35201"}
	case "55202":
		return []string{"CW655202", "CW655201", "55202"}
	default:
		return []string{kode}
	}
}

func (s *SyncService) SyncCurriculum(targetProdiID uint64) error {
	// 1. Cek Prodi
	var targetProdi model.Prodi
	if err := s.DB.Where("id_prodi = ?", targetProdiID).First(&targetProdi).Error; err != nil {
		return fmt.Errorf("prodi tidak ditemukan")
	}

	possiblePrefixes := mapKodeProdiToPrefix(targetProdi.KodeProdi)

	// 2. Ambil Data dari Smart RPS
	url := fmt.Sprintf("%s/api/v1/sync/curriculum", s.Config.SmartRpsURL)
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return err
	}
	req.Header.Set("X-Sync-Key", s.Config.SyncSecretKey)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("error smart rps: %d", resp.StatusCode)
	}

	var response struct {
		Data []dto.SmartRpsCourse `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return err
	}

	fmt.Printf(">>> START SYNC PRODI ID %d (%d Data) <<<\n", targetProdiID, len(response.Data))
	successCount := 0
	failCount := 0

	// 3. Loop Data (TANPA Global Transaction)
	for _, extMK := range response.Data {
		// Filter Prefix Kode MK
		mkCodeUpper := strings.ToUpper(extMK.Code)
		isMatch := false
		if strings.HasPrefix(mkCodeUpper, "AW") || strings.HasPrefix(mkCodeUpper, "BW") {
			isMatch = true
		} else {
			for _, prefix := range possiblePrefixes {
				if strings.Contains(mkCodeUpper, strings.ToUpper(prefix)) {
					isMatch = true
					break
				}
			}
		}

		if !isMatch {
			continue
		}

		// Proses Simpan per MK
		if err := s.processSingleMK(targetProdiID, extMK); err != nil {
			fmt.Printf("   [FAIL] %s: %v\n", extMK.Code, err)
			failCount++
		} else {
			successCount++
		}
	}

	fmt.Printf(">>> SYNC SELESAI. Sukses: %d, Gagal: %d <<<\n", successCount, failCount)
	return nil
}

// processSingleMK menangani penyimpanan 1 MK + CPMK + SubCPMK + Mapping dalam satu transaksi kecil
func (s *SyncService) processSingleMK(targetProdiID uint64, extMK dto.SmartRpsCourse) error {
	return s.DB.Transaction(func(tx *gorm.DB) error {
		// A. Simpan Mata Kuliah
		var mk model.MataKuliah
		err := tx.Where("kode_mk = ?", extMK.Code).First(&mk).Error

		mk.IDProdi = &targetProdiID
		mk.KodeMK = extMK.Code
		mk.NamaMK = extMK.Title

		// Handling pointer SKS/Semester
		if extMK.Credits != nil {
			mk.SKS = uint8(*extMK.Credits)
		}
		if extMK.Semester != nil {
			mk.Semester = uint8(*extMK.Semester)
		}

		if err == gorm.ErrRecordNotFound {
			mk.ID = uuid.New().String()
			mk.IsActive = true
			if err := tx.Create(&mk).Error; err != nil {
				return err
			}
		} else {
			if err := tx.Save(&mk).Error; err != nil {
				return err
			}
		}

		// B. Simpan CPMK
		for _, extCPMK := range extMK.CPMKs {
			var cpmk model.CPMK
			kodeCPMK := fmt.Sprintf("CPMK-%d", extCPMK.CPMKNumber)

			err := tx.Where("id_mk = ? AND kode_cpmk = ?", mk.ID, kodeCPMK).First(&cpmk).Error
			cpmk.IDMK = mk.ID
			cpmk.KodeCPMK = kodeCPMK
			cpmk.Deskripsi = extCPMK.Description

			// Simpan MatchedCPL
			if extCPMK.MatchedCPL != "" {
				cpmk.MatchedCPL = extCPMK.MatchedCPL
			}

			// === FIX 1: Assignment Pointer yang Benar ===
			// Karena di Model CPMK, Bobot adalah *float64, dan extCPMK.Bobot juga *float64
			// Kita tinggal copy pointernya saja.
			cpmk.Bobot = extCPMK.Bobot

			// Jika nil, kita paksa jadi 0.0 (buat pointer baru)
			if cpmk.Bobot == nil {
				var zero float64 = 0
				cpmk.Bobot = &zero
			}

			if err == gorm.ErrRecordNotFound {
				cpmk.ID = uuid.New().String()
				if err := tx.Create(&cpmk).Error; err != nil {
					return err
				}
			} else {
				if err := tx.Save(&cpmk).Error; err != nil {
					return err
				}
			}

			// C. Simpan Sub-CPMK
			for _, extSub := range extCPMK.SubCPMKs {
				var subCpmk model.SubCPMK
				kodeSub := fmt.Sprintf("Sub-CPMK-%d", extSub.SubCPMKNumber)
				err := tx.Where("id_cpmk = ? AND kode_sub_cpmk = ?", cpmk.ID, kodeSub).First(&subCpmk).Error

				subCpmk.IDCPMK = cpmk.ID
				subCpmk.KodeSubCPMK = kodeSub
				subCpmk.Deskripsi = extSub.Description

				// === FIX 2: Assignment Pointer SubCPMK ===
				subCpmk.Bobot = extSub.Bobot

				if subCpmk.Bobot == nil {
					var zero float64 = 0
					subCpmk.Bobot = &zero
				}

				if err == gorm.ErrRecordNotFound {
					subCpmk.ID = uuid.New().String()
					if err := tx.Create(&subCpmk).Error; err != nil {
						return err
					}
				} else {
					if err := tx.Save(&subCpmk).Error; err != nil {
						return err
					}
				}
			}

			// D. Mapping CPL (Relasi Table cpl_mk)
			if extCPMK.MatchedCPL != "" {
				cplCodes := strings.Split(extCPMK.MatchedCPL, ",")
				for _, codeRaw := range cplCodes {
					code := strings.TrimSpace(codeRaw)
					if code == "" {
						continue
					}
					// Normalisasi: Hapus strip agar CPL-01 match dengan CPL01
					codeClean := strings.ReplaceAll(code, "-", "")

					var cpl model.CPL
					// Cari CPL dengan toleransi format
					if err := tx.Where("(kode_cpl = ? OR kode_cpl = ?) AND id_prodi = ?", code, codeClean, targetProdiID).First(&cpl).Error; err == nil {
						var mapping model.CPLMK
						errMap := tx.Where("id_cpl = ? AND id_mk = ?", cpl.IDCPL, mk.ID).First(&mapping).Error
						if errMap == gorm.ErrRecordNotFound {
							mapping = model.CPLMK{
								IDCPL:         cpl.IDCPL,
								IDMK:          mk.ID,
								Sumber:        "sync",
								BobotFraction: 0,
							}
							tx.Create(&mapping)
						}
					}
				}
			}
		}
		return nil
	})
}
