package model

type CPLMK struct {
	IDCPLMK       uint64  `gorm:"column:id_cpl_mk;primaryKey;autoIncrement"`
	IDCPL         uint64  `gorm:"column:id_cpl;not null"`
	IDMK          string  `gorm:"column:id_mk;type:char(36);not null"` // FIX: Ubah ke String (UUID)
	BobotFraction float64 `gorm:"column:bobot_fraction;not null"`
	Sumber        string  `gorm:"column:sumber;size:20;not null"`
}

func (CPLMK) TableName() string { return "cpl_mk" }
