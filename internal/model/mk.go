package model

type MataKuliah struct {
	ID        string  `json:"id" gorm:"primaryKey;type:char(36)"` // Ubah ke String/UUID
	IDProdi   *uint64 `json:"id_prodi" gorm:"column:id_prodi"`    // Tetap uint jika tabel prodi tidak diubah
	KodeMK    string  `json:"kode_mk" gorm:"column:kode_mk;unique;not null"`
	NamaMK    string  `json:"nama_mk" gorm:"column:nama_mk;not null"`
	SKS       uint8   `json:"sks" gorm:"column:sks"`
	Semester  uint8   `json:"semester" gorm:"column:semester"`
	Deskripsi string  `json:"deskripsi" gorm:"column:deskripsi"`
	IsActive  bool    `json:"is_active" gorm:"column:is_active;default:true"`
}

func (MataKuliah) TableName() string { return "mk" }
