package service

import (
	"cpmk/internal/config"
	"cpmk/internal/dto"
	"cpmk/internal/model"
	"encoding/json"
	"fmt"
	"net/http"

	"gorm.io/gorm"
)

type SyncService struct {
	DB     *gorm.DB
	Config *config.Config
}

func NewSyncService(db *gorm.DB, cfg *config.Config) *SyncService {
	return &SyncService{
		DB:     db,
		Config: cfg,
	}
}

// SyncCurriculum menarik data MK -> CPMK -> Sub-CPMK dari Smart RPS
func (s *SyncService) SyncCurriculum(targetProdiID uint64) error {
	// 1. Persiapkan Request ke Smart RPS
	url := fmt.Sprintf("%s/api/v1/sync/curriculum", s.Config.SmartRpsURL)
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return err
	}

	// Masukkan Kunci Rahasia di Header
	req.Header.Set("X-Sync-Key", s.Config.SyncSecretKey)

	// 2. Kirim Request
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("gagal koneksi ke Smart RPS: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("smart RPS menolak akses: status %d", resp.StatusCode)
	}

	// 3. Decode Response JSON ke DTO
	var response struct {
		Data []dto.SmartRpsCourse `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return fmt.Errorf("gagal membaca data JSON: %v", err)
	}

	// 4. Proses Penyimpanan ke Database (Transaction)
	tx := s.DB.Begin()

	for _, extMK := range response.Data {
		// --- A. Sync Mata Kuliah (MK) ---
		var mk model.MataKuliah

		// Cek apakah MK sudah ada berdasarkan Kode MK
		err := tx.Where("kode_mk = ?", extMK.Code).First(&mk).Error

		mk.IDProdi = targetProdiID // Sementara kita tembak ke prodi tertentu
		mk.KodeMK = extMK.Code
		mk.NamaMK = extMK.Title
		if extMK.Credits != nil {
			mk.SKS = uint8(*extMK.Credits)
		}
		if extMK.Semester != nil {
			mk.Semester = uint8(*extMK.Semester)
		}

		if err == gorm.ErrRecordNotFound {
			// Insert Baru
			if err := tx.Create(&mk).Error; err != nil {
				tx.Rollback()
				return err
			}
		} else {
			// Update Existing
			if err := tx.Save(&mk).Error; err != nil {
				tx.Rollback()
				return err
			}
		}

		// --- B. Sync CPMK ---
		// Hapus CPMK lama untuk MK ini agar bersih (opsional, tergantung strategi)
		// tx.Where("id_mk = ?", mk.IDMK).Delete(&model.CPMK{})

		for _, extCPMK := range extMK.CPMKs {
			var cpmk model.CPMK
			kodeCPMK := fmt.Sprintf("CPMK-%d", extCPMK.CPMKNumber) // Generate kode: CPMK-1

			// Cari CPMK existing di MK ini
			err := tx.Where("id_mk = ? AND kode_cpmk = ?", mk.IDMK, kodeCPMK).First(&cpmk).Error

			cpmk.IDMK = mk.IDMK
			cpmk.KodeCPMK = kodeCPMK
			cpmk.Deskripsi = extCPMK.Description
			cpmk.BobotCPMK = extCPMK.Bobot

			if err == gorm.ErrRecordNotFound {
				if err := tx.Create(&cpmk).Error; err != nil {
					tx.Rollback()
					return err
				}
			} else {
				if err := tx.Save(&cpmk).Error; err != nil {
					tx.Rollback()
					return err
				}
			}

			// --- C. Sync Sub-CPMK ---
			for _, extSub := range extCPMK.SubCPMKs {
				var subCpmk model.SubCPMK
				kodeSub := fmt.Sprintf("Sub-CPMK-%d", extSub.SubCPMKNumber)

				err := tx.Where("id_cpmk = ? AND kode_sub_cpmk = ?", cpmk.IDCPMK, kodeSub).First(&subCpmk).Error

				subCpmk.IDCPMK = cpmk.IDCPMK
				subCpmk.KodeSubCPMK = kodeSub
				subCpmk.Deskripsi = extSub.Description
				if extSub.Bobot != nil {
					subCpmk.BobotDalamCPMK = *extSub.Bobot
				}

				if err == gorm.ErrRecordNotFound {
					if err := tx.Create(&subCpmk).Error; err != nil {
						tx.Rollback()
						return err
					}
				} else {
					tx.Save(&subCpmk)
				}
			}
		}
	}

	return tx.Commit().Error
}
