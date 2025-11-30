package model

type Prodi struct {
	IDProdi   uint64 `json:"id_prodi"	gorm:"column:id_prodi;primaryKey;autoIncrement"`
	KodeProdi string `json:"kode_prodi"	gorm:"column:kode_prodi;size:20;unique;not null"`
	NamaProdi string `json:"nama_prodi"	gorm:"column:nama_prodi;size:200;not null"`
	Jenjang   string `json:"jenjang" 	gorm:"column:jenjang;size:10;not null"`
}

func (Prodi) TableName() string { return "prodi" }
