package model

type CPMK struct {
	IDCPMK    uint64   `json:"id_cpmk"    gorm:"column:id_cpmk;primaryKey;autoIncrement"`
	IDMK      uint64   `json:"id_mk"      gorm:"column:id_mk;not null"`
	IDCPL     *uint64  `json:"id_cpl"     gorm:"column:id_cpl"`
	KodeCPMK  string   `json:"kode_cpmk"  gorm:"column:kode_cpmk;size:20;not null"`
	Deskripsi string   `json:"deskripsi"  gorm:"column:deskripsi;type:text;not null"`
	BobotCPMK *float64 `json:"bobot_cpmk" gorm:"column:bobot_cpmk"` // nullable
}

func (CPMK) TableName() string { return "cpmk" }
