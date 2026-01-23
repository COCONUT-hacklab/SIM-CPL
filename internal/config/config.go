package config

import (
	"os"
)

type Config struct {
	DBDSN         string
	Port          string
	SmartRpsURL   string // URL Backend Smart RPS
	SyncSecretKey string // Key yang sama dengan yang ada di Smart RPS
}

func Load() *Config {
	return &Config{
		DBDSN: env("DB_DSN", "root:@tcp(127.0.0.1:3306)/cpl_unismuh?parseTime=true&loc=Local"),
		Port:  env("PORT", "8001"),
		// Default ke localhost jika belum diset di .env
		SmartRpsURL:   env("SMART_RPS_URL", "http://localhost:8080"),
		SyncSecretKey: env("SYNC_SECRET_KEY", "rahasia_dapur_fti_2025_jangan_disebar"),
	}
}

func env(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}
