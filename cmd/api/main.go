package main

import (
	"log"
	"os"

	"cpmk/internal/db"
	"cpmk/internal/mk"

	"github.com/gin-gonic/gin"
)

func main() {
	database := db.New()

	svc := mk.NewService(database)
	handler := mk.NewHandler(svc)

	r := gin.Default()
	handler.Register(r)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Println("listening on :" + port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal(err)
	}
}
