package model

import "time"

type NilaiCPL struct {
	IDNilaiCPL    uint64    `gorm:"column:id_nilai_cpl;primaryKey;autoIncrement"`
	IDMhs         uint64    `gorm:"column:id_mhs;not null"`
	IDCPL         uint64    `gorm:"column:id_cpl;not null"`
	SemesterEval  uint8     `gorm:"column:semester_eval;not null"`
	NilaiAngka    float64   `gorm:"column:nilai_angka;not null"`
	TanggalHitung time.Time `gorm:"column:tanggal_hitung;not null"`
}

func (NilaiCPL) TableName() string { return "nilai_cpl" }
