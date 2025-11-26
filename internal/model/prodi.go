package model

type Prodi struct {
	IDProdi   uint64 `gorm:"column:id_prodi;primaryKey;autoIncrement"`
	KodeProdi string `gorm:"column:kode_prodi;size:20;unique;not null"`
	NamaProdi string `gorm:"column:nama_prodi;size:200;not null"`
	Jenjang   string `gorm:"column:jenjang;size:10;not null"`
}

func (Prodi) TableName() string { return "prodi" }
