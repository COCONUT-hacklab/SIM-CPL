package model

type CPMK struct {
	IDCPMK    uint64   `gorm:"column:id_cpmk;primaryKey;autoIncrement"`
	IDMK      uint64   `gorm:"column:id_mk;not null"`
	KodeCPMK  string   `gorm:"column:kode_cpmk;size:20;not null"`
	Deskripsi string   `gorm:"column:deskripsi;type:text;not null"`
	BobotCPMK *float64 `gorm:"column:bobot_cpmk"` // nullable
}

func (CPMK) TableName() string { return "cpmk" }
