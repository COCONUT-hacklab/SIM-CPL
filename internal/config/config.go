package config

import (
	"log"
	"os"
)

type Config struct {
	DBDSN         string
	Port          string
	SmartRpsURL   string
	SyncSecretKey string
}

func Load() *Config {
	dbDsn := os.Getenv("DB_DSN")
	if dbDsn == "" {
		log.Fatal("DB_DSN environment variable is required")
	}

	return &Config{
		DBDSN:         dbDsn,
		Port:          env("PORT", "8001"),
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
