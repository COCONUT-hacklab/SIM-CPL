package model

type MataKuliah struct {
	ID       string  `gorm:"type:char(36);primaryKey" json:"id_mk"`      // UUID
	IDProdi  *uint64 `gorm:"type:bigint unsigned;index" json:"id_prodi"` // Tambah index biasa
	KodeMK   string  `gorm:"type:varchar(191);index" json:"kode_mk"`     // <--- HAPUS 'uniqueIndex', ganti jadi 'index'
	NamaMK   string  `gorm:"type:longtext" json:"nama_mk"`
	SKS      uint8   `gorm:"type:tinyint unsigned" json:"sks"`
	Semester uint8   `gorm:"type:tinyint unsigned" json:"semester"`
	IsActive bool    `gorm:"type:boolean;default:true" json:"is_active"`

	// Relations
	CPMKs []CPMK `gorm:"foreignKey:IDMK;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"cpmk,omitempty"`
}

// TableName overrides the table name used by User to `mk`
func (MataKuliah) TableName() string {
	return "mk"
}
