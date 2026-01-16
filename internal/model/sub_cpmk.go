package model

type SubCPMK struct {
	ID          string   `json:"id" gorm:"primaryKey;type:char(36)"`
	IDCPMK      string   `json:"id_cpmk" gorm:"column:id_cpmk;type:char(36);not null"`
	KodeSubCPMK string   `json:"kode_sub_cpmk" gorm:"column:kode_sub_cpmk;not null"`
	Deskripsi   string   `json:"deskripsi" gorm:"column:deskripsi;type:text"`
	Bobot       *float64 `json:"bobot" gorm:"column:bobot;type:decimal(10,2)"`
}

func (SubCPMK) TableName() string { return "sub_cpmk" }
