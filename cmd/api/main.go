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

	db.MustConnect(ctx, cfg.DBDSN)

	r := httphandler.NewRouter()

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
		{IDProdi: 5, Nama: "Kaprodi Informatika", Email: "kaprodi.informatika@unismuh.ac.id", Password: passDefault, Role: "kaprodi"},
		{IDProdi: 3, Nama: "Kaprodi Arsitektur", Email: "kaprodi.arsitektur@unismuh.ac.id", Password: passDefault, Role: "kaprodi"},
		{IDProdi: 4, Nama: "Kaprodi PWK", Email: "kaprodi.pwk@unismuh.ac.id", Password: passDefault, Role: "kaprodi"},
		{IDProdi: 2, Nama: "Kaprodi Pengairan", Email: "kaprodi.pengairan@unismuh.ac.id", Password: passDefault, Role: "kaprodi"}, // Asumsi ID sesuai DB Anda
		{IDProdi: 1, Nama: "Kaprodi Elektro", Email: "kaprodi.elektro@unismuh.ac.id", Password: passDefault, Role: "kaprodi"},
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
