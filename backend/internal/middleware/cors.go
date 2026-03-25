package middleware

import (
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

func CORS(frontendURL string, isDevelopment bool) fiber.Handler {
	origins := frontendURL
	if isDevelopment {
		origins = "*"
	}

	return cors.New(cors.Config{
		AllowOrigins:     origins,
		AllowMethods:     "GET, POST, PATCH, PUT, DELETE, OPTIONS",
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
		AllowCredentials: true,
		MaxAge:           86400, // 24 hours
	})
}
