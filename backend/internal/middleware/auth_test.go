package middleware

import (
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

func TestAuthRequired(t *testing.T) {
	secret := "test-secret-key"
	userID := uuid.New()

	app := fiber.New()
	app.Use(AuthRequired(secret))
	app.Get("/test", func(c *fiber.Ctx) error {
		id := GetUserID(c)
		return c.SendString(id.String())
	})

	generateToken := func(id string, expiry time.Duration) string {
		token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
			"sub": id,
			"exp": time.Now().Add(expiry).Unix(),
		})
		tString, _ := token.SignedString([]byte(secret))
		return tString
	}

	tests := []struct {
		name           string
		authHeader     string
		expectedStatus int
		expectedBody   string
	}{
		{
			name:           "valid token",
			authHeader:     "Bearer " + generateToken(userID.String(), time.Hour),
			expectedStatus: fiber.StatusOK,
			expectedBody:   userID.String(),
		},
		{
			name:           "missing header",
			authHeader:     "",
			expectedStatus: fiber.StatusUnauthorized,
		},
		{
			name:           "invalid format",
			authHeader:     "Basic whatever",
			expectedStatus: fiber.StatusUnauthorized,
		},
		{
			name:           "expired token",
			authHeader:     "Bearer " + generateToken(userID.String(), -time.Hour),
			expectedStatus: fiber.StatusUnauthorized,
		},
		{
			name:           "missing sub claim",
			authHeader:     "Bearer " + func() string {
				token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
					"exp": time.Now().Add(time.Hour).Unix(),
				})
				tString, _ := token.SignedString([]byte(secret))
				return tString
			}(),
			expectedStatus: fiber.StatusUnauthorized,
		},
		{
			name:           "invalid signature",
			authHeader:     "Bearer " + generateToken(userID.String(), time.Hour) + "bad",
			expectedStatus: fiber.StatusUnauthorized,
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
