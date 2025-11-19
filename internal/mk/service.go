package mk

import (
	"context"
	"fmt"

	"gorm.io/gorm"
)

type Service struct {
	db *gorm.DB
}

func NewService(db *gorm.DB) *Service {
	return &Service{db: db}
}

// Bagian CPMK
type CreateCPMKReq struct {
	KodeCPMK  string `json:"kode_cpmk"`
	Deskripsi string `json:"deskripsi"`
}

func (s *Service) CreateCPMK(ctx context.Context, req CreateCPMKReq) (*CPMK, error) {
	// opsional: cek manual dulu
	var count int64
	if err := s.db.WithContext(ctx).
		Model(&CPMK{}).
		Where("kode_cpmk = ?", req.KodeCPMK).
		Count(&count).Error; err != nil {
		return nil, err
	}
	if count > 0 {
		return nil, fmt.Errorf("kode_cpmk sudah digunakan")
	}

	c := CPMK{
		KodeCPMK:  req.KodeCPMK,
		Deskripsi: req.Deskripsi,
	}
	if err := s.db.WithContext(ctx).Create(&c).Error; err != nil {
		return nil, err
	}
	return &c, nil
}

type AssignCPMKToMKReq struct {
	IDMK    uint64   `json:"id_mk"`
	IDCPMKs []uint64 `json:"id_cpmk_list"`
	// bisa tambahkan bobot per CPMK kalau mau
}

func (s *Service) AssignCPMKToMK(ctx context.Context, req AssignCPMKToMKReq) error {
	if len(req.IDCPMKs) == 0 {
		return fmt.Errorf("minimal 1 CPMK")
	}

	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// hapus mapping lama untuk MK ini (kalau kamu mau mode replace)
		if err := tx.Where("id_mk = ?", req.IDMK).Delete(&MKCPMK{}).Error; err != nil {
			return err
		}

		// insert mapping baru
		var list []MKCPMK
		for _, idCpmk := range req.IDCPMKs {
			list = append(list, MKCPMK{
				IDMK:   req.IDMK,
				IDCPMK: idCpmk,
				// Bobot bisa diisi manual atau dihitung otomatis nanti
			})
		}
		return tx.Create(&list).Error
	})
}

type AssignCPLToMKReq struct {
	IDMK  uint64 `json:"id_mk"`
	Items []struct {
		IDCPL uint64   `json:"id_cpl"`
		Bobot *float64 `json:"bobot_pct"` // opsional
	} `json:"items"`
}

func (s *Service) AssignCPLToMK(ctx context.Context, req AssignCPLToMKReq) error {
	if len(req.Items) == 0 {
		return fmt.Errorf("minimal 1 CPL")
	}

	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("id_mk = ?", req.IDMK).Delete(&CPLMK{}).Error; err != nil {
			return err
		}

		var list []CPLMK
		for _, item := range req.Items {
			local := item
			list = append(list, CPLMK{
				IDMK:  req.IDMK,
				IDCPL: local.IDCPL,
				Bobot: local.Bobot,
			})
		}
		return tx.Create(&list).Error
	})
}

//Crud CPL
// CPL

func (s *Service) CreateCPL(ctx context.Context, kode, deskripsi string) (*CPL, error) {
	// optional: cek unik kode_cpl
	var cnt int64
	if err := s.db.WithContext(ctx).Model(&CPL{}).
		Where("kode_cpl = ?", kode).Count(&cnt).Error; err != nil {
		return nil, err
	}
	if cnt > 0 {
		return nil, fmt.Errorf("kode_cpl sudah digunakan")
	}

	cpl := CPL{
		KodeCPL:   kode,
		Deskripsi: deskripsi,
	}
	if err := s.db.WithContext(ctx).Create(&cpl).Error; err != nil {
		return nil, err
	}
	return &cpl, nil
}

func (s *Service) ListCPL(ctx context.Context) ([]CPL, error) {
	var cpls []CPL
	if err := s.db.WithContext(ctx).Order("kode_cpl").Find(&cpls).Error; err != nil {
		return nil, err
	}
	return cpls, nil
}

func (s *Service) GetCPL(ctx context.Context, id uint64) (*CPL, error) {
	var cpl CPL
	if err := s.db.WithContext(ctx).First(&cpl, "id_cpl = ?", id).Error; err != nil {
		return nil, err
	}
	return &cpl, nil
}

func (s *Service) UpdateCPL(ctx context.Context, id uint64, kode *string, deskripsi *string) error {
	var cpl CPL
	if err := s.db.WithContext(ctx).First(&cpl, "id_cpl = ?", id).Error; err != nil {
		return err
	}
	if kode != nil {
		cpl.KodeCPL = *kode
	}
	if deskripsi != nil {
		cpl.Deskripsi = *deskripsi
	}
	return s.db.WithContext(ctx).Save(&cpl).Error
}

func (s *Service) DeleteCPL(ctx context.Context, id uint64) error {
	return s.db.WithContext(ctx).Delete(&CPL{}, "id_cpl = ?", id).Error
}

//crud MK
// MK

func (s *Service) CreateMK(ctx context.Context, kode, nama string, sks, semester *uint8) (*MK, error) {
	var cnt int64
	if err := s.db.WithContext(ctx).Model(&MK{}).
		Where("kode_mk = ?", kode).Count(&cnt).Error; err != nil {
		return nil, err
	}
	if cnt > 0 {
		return nil, fmt.Errorf("kode_mk sudah digunakan")
	}

	mk := MK{
		KodeMK:   kode,
		NamaMK:   nama,
		SKS:      sks,
		Semester: semester,
	}
	if err := s.db.WithContext(ctx).Create(&mk).Error; err != nil {
		return nil, err
	}
	return &mk, nil
}

func (s *Service) ListMK(ctx context.Context) ([]MK, error) {
	var mks []MK
	if err := s.db.WithContext(ctx).Order("kode_mk").Find(&mks).Error; err != nil {
		return nil, err
	}
	return mks, nil
}

// detail MK + mapping CPL & CPMK
type MKDetail struct {
	MK    MK     `json:"mk"`
	CPLs  []CPL  `json:"cpls"`
	CPMKs []CPMK `json:"cpmks"`
}

func (s *Service) GetMKDetail(ctx context.Context, idMK uint64) (*MKDetail, error) {
	var mk MK
	if err := s.db.WithContext(ctx).First(&mk, "id_mk = ?", idMK).Error; err != nil {
		return nil, err
	}

	// ambil CPL terkait
	var cplMK []CPLMK
	if err := s.db.WithContext(ctx).Where("id_mk = ?", idMK).Find(&cplMK).Error; err != nil {
		return nil, err
	}
	var cplIDs []uint64
	for _, cm := range cplMK {
		cplIDs = append(cplIDs, cm.IDCPL)
	}

	var cpls []CPL
	if len(cplIDs) > 0 {
		if err := s.db.WithContext(ctx).Where("id_cpl IN ?", cplIDs).Find(&cpls).Error; err != nil {
			return nil, err
		}
	}

	// ambil CPMK terkait
	var mkcpmk []MKCPMK
	if err := s.db.WithContext(ctx).Where("id_mk = ?", idMK).Find(&mkcpmk).Error; err != nil {
		return nil, err
	}
	var cpmkIDs []uint64
	for _, mc := range mkcpmk {
		cpmkIDs = append(cpmkIDs, mc.IDCPMK)
	}
	var cpmks []CPMK
	if len(cpmkIDs) > 0 {
		if err := s.db.WithContext(ctx).Where("id_cpmk IN ?", cpmkIDs).Find(&cpmks).Error; err != nil {
			return nil, err
		}
	}

	return &MKDetail{
		MK:    mk,
		CPLs:  cpls,
		CPMKs: cpmks,
	}, nil
}

// list
func (s *Service) ListCPMK(ctx context.Context) ([]CPMK, error) {
	var items []CPMK
	if err := s.db.WithContext(ctx).Order("kode_cpmk").Find(&items).Error; err != nil {
		return nil, err
	}
	return items, nil
}
