package config

import (
	"os"
)

type Config struct {
	DBDSN string
	Port  string
}

func Load() *Config {
	return &Config{
		// contoh DSN MySQL:
		// user:password@tcp(host:port)/dbname?parseTime=true&loc=Local
		DBDSN: env("DB_DSN", "root:@tcp(127.0.0.1:3306)/cpl_unismuh?parseTime=true&loc=Local"),
		Port:  env("PORT", "8001"),
	}
}

func env(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}
