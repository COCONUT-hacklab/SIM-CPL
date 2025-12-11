package model

type MK struct {
	IDMK     uint64 `json:"id_mk" gorm:"column:id_mk;primaryKey;autoIncrement"`
	IDProdi  uint64 `json:"id_prodi" gorm:"column:id_prodi;not null"`
	KodeMK   string `json:"kode_mk" gorm:"column:kode_mk;size:30;unique;not null"`
	NamaMK   string `json:"nama_mk" gorm:"column:nama_mk;size:255;not null"`
	SKS      uint8  `json:"sks" gorm:"column:sks;not null"`
	Semester uint8  `json:"semester" gorm:"column:semester;not null"`
}

func (MK) TableName() string { return "mk" }
