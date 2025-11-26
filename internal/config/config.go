package config

import "os"

type Config struct {
	DBDSN string
	Port  string
}

func Load() *Config {
	return &Config{
		DBDSN: env("DB_DSN", "root:@tcp(127.0.0.1:3306)/cpl_unismuh?parseTime=true"),
		Port:  env("PORT", "8080"),
	}
}

func env(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}
