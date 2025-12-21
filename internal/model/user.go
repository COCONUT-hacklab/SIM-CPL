package model

import "time"

type User struct {
	ID        uint64    `gorm:"column:id_user;primaryKey;autoIncrement" json:"id_user"`
	IDProdi   uint64    `gorm:"column:id_prodi;unique;not null" json:"id_prodi" // 1 Prodi = 1 Akun Kaprodi`
	Nama      string    `gorm:"column:nama;size:100;not null" json:"nama"`
	Email     string    `gorm:"column:email;size:100;unique;not null" json:"email"`
	Password  string    `gorm:"column:password;size:255;not null" json:"-" // JSON "-" agar password tidak ikut terkirim di API response`
	Role      string    `gorm:"column:role;size:20;default:'kaprodi'" json:"role"`
	CreatedAt time.Time `gorm:"column:created_at"`
	UpdatedAt time.Time `gorm:"column:updated_at"`

	// Relasi (Optional, agar bisa preload data prodi)
	Prodi Prodi `gorm:"foreignKey:IDProdi;references:IDProdi" `
}

func (User) TableName() string { return "users" }
