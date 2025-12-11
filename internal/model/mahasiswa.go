package model

type Mahasiswa struct {
	IDMhs    uint64 `json:"id_mhs"    gorm:"column:id_mhs;primaryKey;autoIncrement"`
	IDProdi  uint64 `json:"id_prodi"  gorm:"column:id_prodi;not null"`
	NIM      string `json:"nim"       gorm:"column:nim;size:30;unique;not null"`
	Nama     string `json:"nama"      gorm:"column:nama;size:200;not null"`
	Angkatan int    `json:"angkatan"  gorm:"column:angkatan;not null"`
	Status   string `json:"status"    gorm:"column:status;size:20;not null;default:'AKTIF'"`
}

func (Mahasiswa) TableName() string { return "mahasiswa" }
