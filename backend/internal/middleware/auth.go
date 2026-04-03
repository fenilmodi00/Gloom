package middleware

import (
	"fmt"
	"os"
	"strings"

	"backend/internal/response"
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

func AuthRequired(jwtSecret string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			// In development, allow bypass with a default user ID if header is missing
			if os.Getenv("GO_ENV") == "development" {
				userID, _ := uuid.Parse("00000000-0000-0000-0000-000000000000")
				c.Locals("userID", userID)
				return c.Next()
			}
			return response.Unauthorized(c, "missing authorization header")
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			return response.Unauthorized(c, "invalid authorization header format")
		}

		tokenString := parts[1]

		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			return []byte(jwtSecret), nil
		})

		if err != nil {
			if strings.Contains(err.Error(), "token is expired") {
				return response.Unauthorized(c, "token expired")
			}
			return response.Unauthorized(c, "invalid token")
		}

		if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
			sub, ok := claims["sub"].(string)
			if !ok || sub == "" {
				// In development, allow bypass with a default user ID if sub claim is missing
				if os.Getenv("GO_ENV") == "development" {
					userID, _ := uuid.Parse("00000000-0000-0000-0000-000000000000")
					c.Locals("userID", userID)
					return c.Next()
				}
				return response.Unauthorized(c, "missing sub claim")
			}

			userID, err := uuid.Parse(sub)
			if err != nil {
				return response.Unauthorized(c, "invalid user id format")
			}

			c.Locals("userID", userID)
			return c.Next()
		}

		return response.Unauthorized(c, "invalid token claims")
	}
}

func GetUserID(c *fiber.Ctx) uuid.UUID {
	userID, ok := c.Locals("userID").(uuid.UUID)
	if !ok {
		return uuid.Nil
	}
	return userID
}
