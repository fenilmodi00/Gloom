package config

import (
	"fmt"
	"os"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	DatabaseURL            string
	SupabaseURL            string
	SupabaseJWTSecret      string
	SupabaseServiceRoleKey string
	Port                   string
	GoEnv                  string
	FrontendURL            string
}

func Load() (*Config, error) {
	_ = godotenv.Load() // ignore error if .env not found in prod

	cfg := &Config{
		DatabaseURL:            os.Getenv("DATABASE_URL"),
		SupabaseURL:            os.Getenv("SUPABASE_URL"),
		SupabaseJWTSecret:      os.Getenv("SUPABASE_JWT_SECRET"),
		SupabaseServiceRoleKey: os.Getenv("SUPABASE_SERVICE_ROLE_KEY"),
		Port:                   os.Getenv("PORT"),
		GoEnv:                  os.Getenv("GO_ENV"),
		FrontendURL:            os.Getenv("FRONTEND_URL"),
	}

	if cfg.Port == "" {
		cfg.Port = "8080"
	}
	if cfg.GoEnv == "" {
		cfg.GoEnv = "development"
	}

	var missing []string
	if cfg.DatabaseURL == "" {
		missing = append(missing, "DATABASE_URL")
	}
	if cfg.SupabaseJWTSecret == "" {
		missing = append(missing, "SUPABASE_JWT_SECRET")
	}
	if cfg.SupabaseServiceRoleKey == "" {
		missing = append(missing, "SUPABASE_SERVICE_ROLE_KEY")
	}

	if len(missing) > 0 {
		return nil, fmt.Errorf("missing required env var(s): %s", strings.Join(missing, ", "))
	}

	return cfg, nil
}

func (c *Config) IsDevelopment() bool {
	return c.GoEnv == "development"
}
