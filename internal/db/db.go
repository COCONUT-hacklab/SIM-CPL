package db

import (
	"context"
	"log"
	"time"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

var DB *gorm.DB

// MustConnect membuka koneksi DB dan panic/log.Fatalf jika gagal.
// ctx dipakai hanya untuk handshake awal.
func MustConnect(ctx context.Context, dsn string) *gorm.DB {
	// batas waktu koneksi awal, misal 10 detik
	ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	gdb, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("failed to open DB: %v", err)
	}

	// Ping untuk memastikan koneksi hidup
	sqlDB, err := gdb.DB()
	if err != nil {
		log.Fatalf("failed to get sql.DB: %v", err)
	}
	if err := sqlDB.PingContext(ctx); err != nil {
		log.Fatalf("failed to ping DB: %v", err)
	}

	DB = gdb
	return gdb
}
