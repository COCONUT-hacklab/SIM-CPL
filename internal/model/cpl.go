package model

type CPL struct {
	IDCPL     uint64 `json:"id_cpl"    gorm:"column:id_cpl;primaryKey;autoIncrement"`
	IDProdi   uint64 `json:"id_prodi"  gorm:"column:id_prodi;not null"`
	KodeCPL   string `json:"kode_cpl"  gorm:"column:kode_cpl;size:20;not null"`
	Deskripsi string `json:"deskripsi" gorm:"column:deskripsi;type:text;not null"`
}

func (CPL) TableName() string { return "cpl" }
