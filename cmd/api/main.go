package main

import (
	"context"
	"log"

	"cpmk/internal/config"
	"cpmk/internal/db"
	httphandler "cpmk/internal/http"
)

func main() {
	ctx := context.Background()

	cfg := config.Load()

	db.MustConnect(ctx, cfg.DBDSN)

	r := httphandler.NewRouter()

	log.Printf("listening on :%s ...", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatalf("server error: %v", err)
	}
}
