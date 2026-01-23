package db

import (
	"context"
	"log"
	"time"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

// MustConnect mencoba koneksi ke database dengan mekanisme Retry (Penting untuk Docker)
func MustConnect(ctx context.Context, dsn string) {
	var err error

	// Konfigurasi Retry: Coba 30 kali, jeda 2 detik (Total tunggu 1 menit)
	maxRetries := 30
	retryInterval := 2 * time.Second

	for i := 0; i < maxRetries; i++ {
		// Konfigurasi GORM
		config := &gorm.Config{
			Logger: logger.Default.LogMode(logger.Info),
		}

		DB, err = gorm.Open(mysql.Open(dsn), config)
		if err == nil {
			// Cek ping ke database fisik untuk memastikan koneksi benar-benar hidup
			sqlDB, errPing := DB.DB()
			if errPing == nil && sqlDB.Ping() == nil {
				log.Println("Berhasil terhubung ke database!")

				// Setup Connection Pool (Opsional tapi disarankan)
				sqlDB.SetMaxIdleConns(10)
				sqlDB.SetMaxOpenConns(100)
				sqlDB.SetConnMaxLifetime(time.Hour)

				return
			}
		}

		log.Printf("⏳ Database belum siap (Percobaan %d/%d). Menunggu %v... Error: %v", i+1, maxRetries, retryInterval, err)
		time.Sleep(retryInterval)
	}

	// Jika sudah 30x mencoba masih gagal, baru Panic
	log.Fatalf("Gagal terhubung ke database setelah %d percobaan. Pastikan service database berjalan dan DSN benar. Error: %v", maxRetries, err)
}
