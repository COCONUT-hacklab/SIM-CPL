package model

type NilaiMK struct {
	IDNilaiMK      uint64  `gorm:"column:id_nilai_mk;primaryKey;autoIncrement"`
	IDMhs          uint64  `gorm:"column:id_mhs;not null"`
	IDMK           uint64  `gorm:"column:id_mk;not null"`
	SemesterTempuh uint8   `gorm:"column:semester_tempuh;not null"`
	TahunAjaran    string  `gorm:"column:tahun_ajaran;size:20;not null"`
	NilaiAngka     float64 `gorm:"column:nilai_angka;not null"`
	NilaiHuruf     *string `gorm:"column:nilai_huruf;size:2"`
	Sumber         string  `gorm:"column:sumber;size:20;not null"`
}

func (NilaiMK) TableName() string { return "nilai_mk" }
