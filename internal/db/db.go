package db

import (
	"log"
	"os"
	"time"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// New mengembalikan *gorm.DB yang siap dipakai
func New() *gorm.DB {
	// DSN bisa kamu override via env: DB_DSN
	// format: user:pass@tcp(host:port)/dbname?charset=utf8mb4&parseTime=True&loc=Local
	dsn := os.Getenv("DB_DSN")
	if dsn == "" {
		// default untuk development lokal
		// sesuaikan user/pass/port dengan MariaDB kamu
		dsn = "root:@tcp(127.0.0.1:3306)/idk?charset=utf8mb4&parseTime=True&loc=Local"
	}

	cfg := &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info), // bisa diganti Silent kalau mau adem
	}

	db, err := gorm.Open(mysql.Open(dsn), cfg)
	if err != nil {
		log.Fatalf("failed to connect database: %v", err)
	}

	// optional: tes koneksi sekali
	sqlDB, err := db.DB()
	if err != nil {
		log.Fatalf("failed to get generic DB: %v", err)
	}
	sqlDB.SetMaxIdleConns(5)
	sqlDB.SetMaxOpenConns(20)
	sqlDB.SetConnMaxLifetime(30 * time.Minute)

	if err := sqlDB.Ping(); err != nil {
		log.Fatalf("failed to ping database: %v", err)
	}

	log.Println("database connected")
	return db
}
