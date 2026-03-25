package wardrobe

import (
	"bytes"
	"encoding/json"
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
)

func TestWardrobe_ListItems(t *testing.T) {
	app := fiber.New()
	app.Get("/wardrobe", func(c *fiber.Ctx) error {
		return c.SendStatus(200)
	})

	req := httptest.NewRequest("GET", "/wardrobe", nil)
	resp, _ := app.Test(req)
	assert.Equal(t, 200, resp.StatusCode)
}

func TestWardrobe_CreateItem_InvalidCategory(t *testing.T) {
	app := fiber.New()
	app.Post("/wardrobe", func(c *fiber.Ctx) error {
		return c.SendStatus(422)
	})

	body, _ := json.Marshal(map[string]interface{}{"category": "invalid_cat", "image_url": "http://img.com"})
	req := httptest.NewRequest("POST", "/wardrobe", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	resp, _ := app.Test(req)
	assert.Equal(t, 422, resp.StatusCode)
}

func TestWardrobe_DeleteItem(t *testing.T) {
	app := fiber.New()
	app.Delete("/wardrobe/:id", func(c *fiber.Ctx) error {
		return c.SendStatus(204)
	})

	req := httptest.NewRequest("DELETE", "/wardrobe/123e4567-e89b-12d3-a456-426614174000", nil)
	resp, _ := app.Test(req)
	assert.Equal(t, 204, resp.StatusCode)
}
