package model

type CPL struct {
	IDCPL     uint64 `gorm:"column:id_cpl;primaryKey;autoIncrement"`
	IDProdi   uint64 `gorm:"column:id_prodi;not null"`
	KodeCPL   string `gorm:"column:kode_cpl;size:20;not null"`
	Deskripsi string `gorm:"column:deskripsi;type:text;not null"`
}

func (CPL) TableName() string { return "cpl" }
