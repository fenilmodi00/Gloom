package server

import (
	"context"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"

	"github.com/styleai/backend/internal/config"
	"github.com/styleai/backend/internal/db"
	"github.com/styleai/backend/internal/handlers/outfit"
	"github.com/styleai/backend/internal/handlers/presigned"
	"github.com/styleai/backend/internal/handlers/profile"
	"github.com/styleai/backend/internal/handlers/wardrobe"
	"github.com/styleai/backend/internal/middleware"
	"github.com/styleai/backend/internal/response"
)

type Server struct {
	app *fiber.App
}

func New(cfg *config.Config, database *db.DB) *Server {
	app := fiber.New(fiber.Config{
		AppName:      "StyleAI Backend",
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
		BodyLimit:    10 * 1024 * 1024, // 10MB
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			code := fiber.StatusInternalServerError
			if e, ok := err.(*fiber.Error); ok {
				code = e.Code
			}
			return c.Status(code).JSON(response.ErrorResponse{
				Error: response.Error{Code: "error", Message: err.Error()},
			})
		},
	})

	app.Use(middleware.CORS(cfg.FrontendURL, cfg.IsDevelopment()))
	app.Use(logger.New())
	app.Use(recover.New())

	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":  "ok",
			"version": "0.1.0",
		})
	})

	apiV1 := app.Group("/api/v1")
	apiV1.Use(middleware.AuthRequired(cfg.SupabaseJWTSecret))

	// TODO: Phase 2 - Add Fal.ai, Gemini AI, Image processing, Job queues integrations
	profile.New(database).RegisterRoutes(apiV1)
	wardrobe.New(database).RegisterRoutes(apiV1)
	outfit.New(database).RegisterRoutes(apiV1)
	presigned.New(database, cfg.SupabaseURL, cfg.SupabaseServiceRoleKey).RegisterRoutes(apiV1)

	app.Use(func(c *fiber.Ctx) error {
		return response.NotFound(c, "route not found")
	})

	return &Server{app: app}
}

func (s *Server) Listen(addr string) error {
	return s.app.Listen(addr)
}

func (s *Server) ShutdownWithContext(ctx context.Context) error {
	return s.app.ShutdownWithContext(ctx)
}
