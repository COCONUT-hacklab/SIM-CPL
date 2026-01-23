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

	// 1. Connect Database
	db.MustConnect(ctx, cfg.DBDSN)

	// 2. JALANKAN AUTO MIGRATION DISINI
	// Ini akan membuat tabel jika belum ada, atau mengupdate kolom jika ada perubahan di struct
	log.Println("Memulai migrasi database otomatis...")
	err := db.DB.AutoMigrate(
		&model.Prodi{},      // Master Prodi
		&model.User{},       // User / Kaprodi
		&model.MataKuliah{}, // Master MK
		&model.Mahasiswa{},  // Master Mahasiswa
		&model.CPL{},        // Master CPL
		&model.CPMK{},       // Master CPMK
		&model.SubCPMK{},    // Master Sub-CPMK
		&model.CPLMK{},      // Mapping CPL <-> MK
		&model.NilaiMK{},    // Transaksi Nilai MK
		&model.NilaiCPL{},   // Transaksi Nilai CPL (Hasil Hitung)
	)

	if err != nil {
		log.Fatalf("Gagal melakukan migrasi database: %v", err)
	}
	log.Println("Migrasi database selesai.")

	// 3. Setup Router & Server
	r := httphandler.NewRouter(db.DB, cfg)

	// 4. Seeder User Awal (Opsional, tetap dijalankan jika tabel user kosong/user belum ada)
	SeedUsers(db.DB)

	log.Printf("listening on :%s ...", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatalf("server error: %v", err)
	}
}

//SEKALI JALANIN SAJA UNTUK INSERT USER AWAL

// Potongan kode untuk insert user awal (Seeder)
func SeedUsers(gdb *gorm.DB) {
	// Password default dari screenshot
	passDefault, _ := utils.HashPassword("kaprodi123")

	users := []model.User{

		{IDProdi: 1, Nama: "Kaprodi", Email: "kaprodi.elektro@unismuh.ac.id", Password: passDefault, Role: "kaprodi"},
	}

	for _, u := range users {
		// Cek jika email sudah ada biar gak duplikat
		var count int64
		gdb.Model(&model.User{}).Where("email = ?", u.Email).Count(&count)
		if count == 0 {
			gdb.Create(&u)
			log.Printf("User %s created", u.Email)
		}
	}
}
