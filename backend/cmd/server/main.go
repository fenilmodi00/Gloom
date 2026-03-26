package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"

	"backend/internal/config"
	"backend/internal/db"
	"backend/internal/server"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	ctx := context.Background()

	database, err := db.New(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer database.Close()

	srv := server.New(cfg, database)

	log.Printf("Starting server on port %s in %s mode", cfg.Port, cfg.GoEnv)

	errChan := make(chan error, 1)
	go func() {
		if err := srv.Listen(":" + cfg.Port); err != nil {
			errChan <- err
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)

	select {
	case err := <-errChan:
		log.Fatalf("Server error: %v", err)
	case sig := <-quit:
		log.Printf("Received signal %v, shutting down server...", sig)
		if err := srv.Shutdown(); err != nil {
			log.Fatalf("Server forced to shutdown: %v", err)
		}
	}

	log.Println("Server exiting")
}
