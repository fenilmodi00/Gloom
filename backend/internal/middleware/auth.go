package middleware

import (
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"

	"github.com/styleai/backend/internal/response"
)

func AuthRequired(jwtSecret string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return response.Unauthorized(c, "missing authorization header")
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			return response.Unauthorized(c, "invalid authorization format")
		}

		tokenString := parts[1]
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fiber.NewError(fiber.StatusUnauthorized, "unexpected signing method")
			}
			return []byte(jwtSecret), nil
		})

		if err != nil || !token.Valid {
			return response.Unauthorized(c, "invalid or expired token")
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			return response.Unauthorized(c, "invalid token claims")
		}

		sub, ok := claims["sub"].(string)
		if !ok || sub == "" {
			return response.Unauthorized(c, "missing subject claim")
		}

		userID, err := uuid.Parse(sub)
		if err != nil {
			return response.Unauthorized(c, "invalid user ID format")
		}

		c.Locals("userID", userID)
		return c.Next()
	}
}

func GetUserID(c *fiber.Ctx) uuid.UUID {
	return c.Locals("userID").(uuid.UUID)
}
