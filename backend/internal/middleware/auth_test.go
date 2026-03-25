package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

func TestAuthRequired(t *testing.T) {
	secret := "my-secret"
	app := fiber.New()
	app.Use(AuthRequired(secret))
	app.Get("/test", func(c *fiber.Ctx) error {
		userID := GetUserID(c)
		return c.SendString(userID.String())
	})

	validUserID := uuid.New()
	validToken := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub": validUserID.String(),
		"exp": time.Now().Add(time.Hour).Unix(),
	})
	validTokenString, _ := validToken.SignedString([]byte(secret))

	expiredToken := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub": validUserID.String(),
		"exp": time.Now().Add(-time.Hour).Unix(),
	})
	expiredTokenString, _ := expiredToken.SignedString([]byte(secret))

	wrongSecretToken := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub": validUserID.String(),
		"exp": time.Now().Add(time.Hour).Unix(),
	})
	wrongSecretTokenString, _ := wrongSecretToken.SignedString([]byte("wrong-secret"))

	tests := []struct {
		name           string
		authHeader     string
		expectedStatus int
	}{
		{
			name:           "Valid Token",
			authHeader:     "Bearer " + validTokenString,
			expectedStatus: http.StatusOK,
		},
		{
			name:           "Missing Header",
			authHeader:     "",
			expectedStatus: http.StatusUnauthorized,
		},
		{
			name:           "Invalid Format",
			authHeader:     "Token " + validTokenString,
			expectedStatus: http.StatusUnauthorized,
		},
		{
			name:           "Expired Token",
			authHeader:     "Bearer " + expiredTokenString,
			expectedStatus: http.StatusUnauthorized,
		},
		{
			name:           "Invalid Signature",
			authHeader:     "Bearer " + wrongSecretTokenString,
			expectedStatus: http.StatusUnauthorized,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest("GET", "/test", nil)
			if tt.authHeader != "" {
				req.Header.Set("Authorization", tt.authHeader)
			}
			resp, _ := app.Test(req)
			assert.Equal(t, tt.expectedStatus, resp.StatusCode)
		})
	}
}
