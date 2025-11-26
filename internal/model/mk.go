package model

type MK struct {
	IDMK     uint64 `gorm:"column:id_mk;primaryKey;autoIncrement"`
	IDProdi  uint64 `gorm:"column:id_prodi;not null"`
	KodeMK   string `gorm:"column:kode_mk;size:30;unique;not null"`
	NamaMK   string `gorm:"column:nama_mk;size:255;not null"`
	SKS      uint8  `gorm:"column:sks;not null"`
	Semester uint8  `gorm:"column:semester;not null"`
}

func (MK) TableName() string { return "mk" }
