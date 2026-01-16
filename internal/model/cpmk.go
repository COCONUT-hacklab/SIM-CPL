package model

type CPMK struct {
	ID        string   `json:"id" gorm:"primaryKey;type:char(36)"`
	IDMK      string   `json:"id_mk" gorm:"column:id_mk;type:char(36);not null"` // Foreign Key UUID
	KodeCPMK  string   `json:"kode_cpmk" gorm:"column:kode_cpmk;not null"`
	Deskripsi string   `json:"deskripsi" gorm:"column:deskripsi;type:text"`
	Bobot     *float64 `json:"bobot" gorm:"column:bobot;type:decimal(10,2)"` // Bobot sudah aman
}

func (CPMK) TableName() string { return "cpmk" }
