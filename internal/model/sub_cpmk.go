package model

type SubCPMK struct {
	IDSubCPMK      uint64  `json:"id_sub_cpmk"      gorm:"column:id_sub_cpmk;primaryKey"`
	IDCPMK         uint64  `json:"id_cpmk"          gorm:"column:id_cpmk"`
	KodeSubCPMK    string  `json:"kode_sub_cpmk"    gorm:"column:kode_sub_cpmk"`
	Deskripsi      string  `json:"deskripsi"        gorm:"column:deskripsi"`
	BobotDalamCPMK float64 `json:"bobot_dalam_cpmk" gorm:"column:bobot_dalam_cpmk"`
}

func (SubCPMK) TableName() string { return "sub_cpmk" }
