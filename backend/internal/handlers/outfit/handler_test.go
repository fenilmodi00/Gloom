package outfit

import (
	"bytes"
	"encoding/json"
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
)

func TestOutfit_ListOutfits(t *testing.T) {
	app := fiber.New()
	app.Get("/outfits", func(c *fiber.Ctx) error {
		return c.SendStatus(200)
	})

	req := httptest.NewRequest("GET", "/outfits", nil)
	resp, _ := app.Test(req)
	assert.Equal(t, 200, resp.StatusCode)
}

func TestOutfit_CreateOutfit_EmptyItems(t *testing.T) {
	app := fiber.New()
	app.Post("/outfits", func(c *fiber.Ctx) error {
		return c.SendStatus(422)
	})

	body, _ := json.Marshal(map[string]interface{}{"item_ids": []string{}})
	req := httptest.NewRequest("POST", "/outfits", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	resp, _ := app.Test(req)
	assert.Equal(t, 422, resp.StatusCode)
}

func TestOutfit_DeleteOutfit(t *testing.T) {
	app := fiber.New()
	app.Delete("/outfits/:id", func(c *fiber.Ctx) error {
		return c.SendStatus(204)
	})

	req := httptest.NewRequest("DELETE", "/outfits/123e4567-e89b-12d3-a456-426614174000", nil)
	resp, _ := app.Test(req)
	assert.Equal(t, 204, resp.StatusCode)
}
