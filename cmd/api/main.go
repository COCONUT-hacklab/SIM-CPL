package main

import (
	"context"
	"log"

	"cpmk/internal/config"
	"cpmk/internal/db"
	httphandler "cpmk/internal/http"
	"cpmk/internal/model"
	"cpmk/internal/utils"

	"gorm.io/gorm"
)

func main() {
	ctx := context.Background()
	cfg := config.Load()

	// 1. Connect Database (Pastikan db.MustConnect sudah menggunakan Retry Logic untuk Docker)
	db.MustConnect(ctx, cfg.DBDSN)

	// 2. Auto Migration
	log.Println(" Memulai migrasi database...")
	err := db.DB.AutoMigrate(
		&model.Prodi{}, // Master Prodi (Harus duluan)
		&model.User{},  // User (Foreign Key ke Prodi)
		&model.MataKuliah{},
		&model.Mahasiswa{},
		&model.CPL{},
		&model.CPMK{},
		&model.SubCPMK{},
		&model.CPLMK{},
		&model.NilaiMK{},
		&model.NilaiCPL{},
	)
	if err != nil {
		log.Fatalf(" Migrasi database gagal: %v", err)
	}
	log.Println(" Migrasi database selesai.")

	SeedProdi(db.DB)
	SeedUsers(db.DB)

	r := httphandler.NewRouter(db.DB, cfg)

	log.Printf(" Server berjalan di port :%s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatalf("Server error: %v", err)
	}
}

// === SEEDER PRODI (WAJIB ADA SEBELUM USER) ===
func SeedProdi(gdb *gorm.DB) {
	// Data Prodi sesuai ID yang digunakan di User
	prodis := []model.Prodi{
		{IDProdi: 1, KodeProdi: "TE", NamaProdi: "Teknik Elektro", Jenjang: "S1"},
		{IDProdi: 2, KodeProdi: "TP", NamaProdi: "Teknik Pengairan", Jenjang: "S1"},
		{IDProdi: 3, KodeProdi: "TA", NamaProdi: "Arsitektur", Jenjang: "S1"},
		{IDProdi: 4, KodeProdi: "PWK", NamaProdi: "Perencanaan Wilayah dan Kota", Jenjang: "S1"},
		{IDProdi: 5, KodeProdi: "TF", NamaProdi: "Informatika", Jenjang: "S1"},
	}

	for _, p := range prodis {
		var count int64
		// Cek apakah prodi sudah ada (untuk menghindari duplikasi saat restart docker)
		if err := gdb.Model(&model.Prodi{}).Where("id_prodi = ?", p.IDProdi).Count(&count).Error; err == nil && count == 0 {
			if errCreate := gdb.Create(&p).Error; errCreate != nil {
				log.Printf("Gagal seeding prodi %s: %v", p.NamaProdi, errCreate)
			} else {
				log.Printf("buildings Prodi %s created", p.NamaProdi)
			}
		}
	}
}

// === SEEDER USER ===
func SeedUsers(gdb *gorm.DB) {
	passDefault, _ := utils.HashPassword("kaprodi123") // Password contoh

	// Buat user Admin tanpa ID Prodi (nil)
	users := []model.User{
		{
			ProdiID:  nil, // PENTING: nil artinya tidak terikat prodi manapun (Admin Global)
			Nama:     "kaprodi",
			Email:    "admin@unismuh.ac.id",
			Password: passDefault,
			Role:     "admin", // Set role sebagai admin
		},
		// Anda tetap bisa menambahkan user kaprodi spesifik jika mau
		// {IDProdi: &idProdiElektro, Nama: "Kaprodi Elektro", ...},
	}

	for _, u := range users {
		var count int64
		gdb.Model(&model.User{}).Where("email = ?", u.Email).Count(&count)
		if count == 0 {
			gdb.Create(&u)
			log.Printf("User %s created", u.Email)
		}
	}
}
