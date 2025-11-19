package mk

import "time"

type CPL struct {
	IDCPL     uint64    `gorm:"column:id_cpl;primaryKey;autoIncrement" json:"id_cpl"`
	KodeCPL   string    `gorm:"column:kode_cpl" json:"kode_cpl"`
	Deskripsi string    `gorm:"column:deskripsi" json:"deskripsi"`
	CreatedAt time.Time `gorm:"column:created_at" json:"created_at"`
	UpdatedAt time.Time `gorm:"column:updated_at" json:"updated_at"`
}

func (CPL) TableName() string { return "cpl" }

type MK struct {
	IDMK      uint64    `gorm:"column:id_mk;primaryKey;autoIncrement" json:"id_mk"`
	KodeMK    string    `gorm:"column:kode_mk" json:"kode_mk"`
	NamaMK    string    `gorm:"column:nama_mk" json:"nama_mk"`
	SKS       *uint8    `gorm:"column:sks" json:"sks,omitempty"`
	Semester  *uint8    `gorm:"column:semester" json:"semester,omitempty"`
	CreatedAt time.Time `gorm:"column:created_at" json:"created_at"`
	UpdatedAt time.Time `gorm:"column:updated_at" json:"updated_at"`
}

func (MK) TableName() string { return "mk" }

type CPLMK struct {
	ID        uint64    `gorm:"column:id_cpl_mk;primaryKey;autoIncrement" json:"id_cpl_mk"`
	IDCPL     uint64    `gorm:"column:id_cpl" json:"id_cpl"`
	IDMK      uint64    `gorm:"column:id_mk" json:"id_mk"`
	Bobot     *float64  `gorm:"column:bobot_pct" json:"bobot_pct,omitempty"`
	CreatedAt time.Time `gorm:"column:created_at" json:"created_at"`
	UpdatedAt time.Time `gorm:"column:updated_at" json:"updated_at"`
}

func (CPLMK) TableName() string { return "cpl_mk" }

type CPMK struct {
	IDCPMK    uint64    `gorm:"column:id_cpmk;primaryKey;autoIncrement" json:"id_cpmk"`
	KodeCPMK  string    `gorm:"column:kode_cpmk" json:"kode_cpmk"`
	Deskripsi string    `gorm:"column:deskripsi" json:"deskripsi"`
	CreatedAt time.Time `gorm:"column:created_at" json:"created_at"`
	UpdatedAt time.Time `gorm:"column:updated_at" json:"updated_at"`
}

func (CPMK) TableName() string { return "cpmk" }

type MKCPMK struct {
	ID        uint64    `gorm:"column:id_mk_cpmk;primaryKey;autoIncrement" json:"id_mk_cpmk"`
	IDMK      uint64    `gorm:"column:id_mk" json:"id_mk"`
	IDCPMK    uint64    `gorm:"column:id_cpmk" json:"id_cpmk"`
	Bobot     *float64  `gorm:"column:bobot_pct" json:"bobot_pct,omitempty"`
	CreatedAt time.Time `gorm:"column:created_at" json:"created_at"`
	UpdatedAt time.Time `gorm:"column:updated_at" json:"updated_at"`
}

func (MKCPMK) TableName() string { return "mk_cpmk" }
