package middleware

import (
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

func CORS(frontendURL string, isDevelopment bool) fiber.Handler {
	allowOrigins := frontendURL
	if isDevelopment {
		allowOrigins = "*"
	}

	allowCredentials := true
	if isDevelopment {
		allowCredentials = false // Fiber disallows AllowCredentials=true when AllowOrigins="*"
	}

	return cors.New(cors.Config{
		AllowOrigins:     allowOrigins,
		AllowMethods:     "GET,POST,HEAD,PUT,DELETE,PATCH,OPTIONS",
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
		AllowCredentials: allowCredentials,
		MaxAge:           86400,
	})
}
