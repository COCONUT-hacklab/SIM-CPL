package model

import "time"

type User struct {
	ID uint64 `gorm:"column:id_user;primaryKey;autoIncrement" json:"id_user"`

	// UBAH NAMA FIELD: Dari IDProdi menjadi ProdiID
	// Tapi tetap gunakan column:id_prodi agar di database namanya tetap 'id_prodi'
	ProdiID *uint64 `gorm:"column:id_prodi" json:"id_prodi"`

	Nama      string    `gorm:"column:nama;size:100;not null" json:"nama"`
	Email     string    `gorm:"column:email;size:100;unique;not null" json:"email"`
	Password  string    `gorm:"column:password;size:255;not null" json:"-"`
	Role      string    `gorm:"column:role;size:20;default:'kaprodi'" json:"role"`
	CreatedAt time.Time `gorm:"column:created_at"`
	UpdatedAt time.Time `gorm:"column:updated_at"`

	// Update foreignKey ke nama field baru (ProdiID)
	// References ke nama field target di Prodi (IDProdi)
	Prodi Prodi `gorm:"foreignKey:ProdiID;references:IDProdi;constraint:OnUpdate:CASCADE,OnDelete:SET NULL;"`
}

func (User) TableName() string { return "users" }
