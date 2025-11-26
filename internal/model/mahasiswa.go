package model

type Mahasiswa struct {
	IDMhs    uint64 `gorm:"column:id_mhs;primaryKey;autoIncrement"`
	IDProdi  uint64 `gorm:"column:id_prodi;not null"`
	NIM      string `gorm:"column:nim;size:30;unique;not null"`
	Nama     string `gorm:"column:nama;size:200;not null"`
	Angkatan int    `gorm:"column:angkatan;not null"`
	Status   string `gorm:"column:status;size:20;not null"`
}

func (Mahasiswa) TableName() string { return "mahasiswa" }
