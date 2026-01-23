package db

import (
	"context"
	"database/sql"
	"log"
	"strings"
	"time"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func MustConnect(ctx context.Context, dsn string) {
	var err error

	maxRetries := 30
	retryInterval := 2 * time.Second

	for i := 0; i < maxRetries; i++ {
		// 1. Konfigurasi GORM
		config := &gorm.Config{
			Logger: logger.Default.LogMode(logger.Info),
		}

		// 2. Coba Koneksi ke Database
		DB, err = gorm.Open(mysql.Open(dsn), config)
		if err == nil {
			// Cek ping fisik untuk memastikan koneksi benar-benar hidup
			sqlDB, errPing := DB.DB()
			if errPing == nil && sqlDB.Ping() == nil {
				log.Println("Berhasil terhubung ke database!")

				// Setup Connection Pool
				sqlDB.SetMaxIdleConns(10)
				sqlDB.SetMaxOpenConns(100)
				sqlDB.SetConnMaxLifetime(time.Hour)

				return
			}
			err = errPing // Simpan error ping jika ada
		}

		// 3. DETEKSI ERROR: Apakah database belum ada?
		// Error code 1049 adalah "Unknown database"
		if err != nil && (strings.Contains(err.Error(), "Unknown database") || strings.Contains(err.Error(), "1049")) {
			log.Printf("Database tujuan belum ditemukan. Mencoba membuat database otomatis...")

			if errCreate := createDatabase(dsn); errCreate != nil {
				log.Printf("Gagal membuat database otomatis: %v", errCreate)
			} else {
				log.Println("Database berhasil dibuat! Mencoba connect ulang di putaran berikutnya...")
				time.Sleep(1 * time.Second)
				continue // Langsung coba connect ulang (skip sleep panjang)
			}
		}

		log.Printf("Database belum siap (Percobaan %d/%d). Error: %v. Menunggu %v...", i+1, maxRetries, err, retryInterval)
		time.Sleep(retryInterval)
	}

	log.Fatalf("Gagal terhubung ke database setelah %d percobaan. Error: %v", maxRetries, err)
}

// createDatabase memparsing DSN untuk mengambil nama DB, lalu melakukan CREATE DATABASE
func createDatabase(fullDSN string) error {
	// Logika Parsing DSN (Data Source Name)
	// Format DSN biasanya: user:pass@tcp(host:port)/dbname?param=val

	// 1. Pisahkan parameter query (?)
	parts := strings.Split(fullDSN, "?")
	baseDSN := parts[0]
	params := ""
	if len(parts) > 1 {
		params = "?" + parts[1]
	}

	// 2. Ambil nama database (bagian setelah slash terakhir)
	lastSlashIndex := strings.LastIndex(baseDSN, "/")
	if lastSlashIndex == -1 {
		return nil // Format tidak valid, tidak bisa auto-create
	}

	dbName := baseDSN[lastSlashIndex+1:]
	if dbName == "" {
		return nil
	}

	// 3. Buat DSN Root (tanpa nama database) untuk koneksi awal
	// Contoh: root:pass@tcp(localhost:3306)/
	dsnRoot := baseDSN[:lastSlashIndex+1] + params

	// 4. Koneksi menggunakan driver database/sql standar (bukan GORM)
	db, err := sql.Open("mysql", dsnRoot)
	if err != nil {
		return err
	}
	defer db.Close()

	// 5. Eksekusi perintah CREATE DATABASE
	_, err = db.Exec("CREATE DATABASE IF NOT EXISTS " + dbName)
	return err
}
