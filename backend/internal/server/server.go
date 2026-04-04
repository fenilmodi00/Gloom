package server

import (
	"time"

	"backend/internal/config"
	"backend/internal/db"
	"backend/internal/handlers/edgefunction"
	"backend/internal/handlers/modelimage"
	"backend/internal/handlers/outfit"
	"backend/internal/handlers/presigned"
	"backend/internal/handlers/profile"
	"backend/internal/handlers/wardrobe"
	"backend/internal/middleware"
	"backend/internal/response"
	"backend/internal/services/gemini"
	"backend/internal/services/rembg"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
)

type Server struct {
	app *fiber.App
}

func New(cfg *config.Config, database *db.DB) *Server {
	app := fiber.New(fiber.Config{
		AppName:      "Gloom Backend",
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
		BodyLimit:    10 * 1024 * 1024, // 10MB
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			code := fiber.StatusInternalServerError
			if e, ok := err.(*fiber.Error); ok {
				code = e.Code
			}
			return c.Status(code).JSON(response.ErrorResponse{
				Error: response.Error{
					Code:    "error",
					Message: err.Error(),
				},
			})
		},
	})

	app.Use(recover.New())
	app.Use(logger.New())
	app.Use(middleware.CORS(cfg.FrontendURL, cfg.IsDevelopment()))

	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":  "ok",
			"version": "0.1.0",
		})
	})

	api := app.Group("/api/v1")
	api.Use(middleware.AuthRequired(cfg.SupabaseJWTSecret))

	profileHandler := profile.New(database)
	profileHandler.RegisterRoutes(api)

	wardrobeHandler := wardrobe.New(database, cfg.SupabaseURL, cfg.SupabaseServiceRoleKey)
	wardrobeHandler.RegisterRoutes(api)

	wardrobeUploadHandler := wardrobe.NewUploadHandler(cfg.SupabaseURL, cfg.SupabaseServiceRoleKey)
	wardrobeUploadHandler.RegisterRoutes(api)

	rembgClient := rembg.NewClient(cfg.RembgServiceURL)
	geminiClient := gemini.NewClient("https://generativelanguage.googleapis.com", cfg.GeminiApiKey)
	rembgHandler := wardrobe.NewRembgHandler(database, rembgClient, geminiClient, cfg.SupabaseURL, cfg.SupabaseServiceRoleKey)
	rembgHandler.RegisterRoutes(api)

	parallelHandler := wardrobe.NewParallelHandler(database, rembgClient, geminiClient, cfg.SupabaseURL, cfg.SupabaseServiceRoleKey)
	parallelHandler.RegisterRoutes(api)

	outfitHandler := outfit.New(database)
	outfitHandler.RegisterRoutes(api)

	modelImageHandler := modelimage.New(database, cfg.SupabaseURL, cfg.SupabaseServiceRoleKey)
	modelImageHandler.RegisterRoutes(api)

	presignedHandler := presigned.New(database, cfg.SupabaseURL, cfg.SupabaseServiceRoleKey)
	presignedHandler.RegisterRoutes(api)

	edgeFunctionHandler := edgefunction.New(cfg.SupabaseURL, cfg.SupabaseServiceRoleKey)
	edgeFunctionHandler.RegisterRoutes(api)

	app.Use(func(c *fiber.Ctx) error {
		return response.NotFound(c, "route not found")
	})

	return &Server{
		app: app,
	}
}

func (s *Server) Listen(addr string) error {
	return s.app.Listen(addr)
}

func (s *Server) Shutdown() error {
	return s.app.ShutdownWithTimeout(5 * time.Second)
}
