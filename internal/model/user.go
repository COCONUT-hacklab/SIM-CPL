package model

import "time"

type User struct {
	ID uint64 `gorm:"column:id_user;primaryKey;autoIncrement" json:"id_user"`

	// UBAH DISINI:
	// 1. Gunakan *uint64 (Pointer) agar bisa NULL
	// 2. Hapus 'unique' untuk sementara agar GORM yakin ini relasi 'Belongs To' (banyak user bisa ke 1 prodi, atau 1 user 1 prodi tapi logic validasi di level aplikasi saja)
	// 3. Hapus comment yang mengganggu
	IDProdi *uint64 `gorm:"column:id_prodi" json:"id_prodi"`

	Nama      string    `gorm:"column:nama;size:100;not null" json:"nama"`
	Email     string    `gorm:"column:email;size:100;unique;not null" json:"email"`
	Password  string    `gorm:"column:password;size:255;not null" json:"-"`
	Role      string    `gorm:"column:role;size:20;default:'kaprodi'" json:"role"`
	CreatedAt time.Time `gorm:"column:created_at"`
	UpdatedAt time.Time `gorm:"column:updated_at"`

	// PERBAIKAN RELASI:
	// Cukup 'foreignKey:IDProdi'. GORM akan otomatis mencari IDProdi di tabel Prodi.
	// Hapus 'references' yang berlebihan.
	Prodi Prodi `gorm:"foreignKey:IDProdi;constraint:OnUpdate:CASCADE,OnDelete:SET NULL;"`
}

func (User) TableName() string { return "users" }
