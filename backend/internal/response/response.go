package response

import (
	"github.com/gofiber/fiber/v2"
)

type Error struct {
	Code    string   `json:"code"`
	Message string   `json:"message"`
	Details []string `json:"details,omitempty"`
}

type ErrorResponse struct {
	Error Error `json:"error"`
}

func Success(c *fiber.Ctx, data interface{}) error {
	return c.Status(fiber.StatusOK).JSON(fiber.Map{"data": data})
}

func Created(c *fiber.Ctx, data interface{}) error {
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"data": data})
}

func NoContent(c *fiber.Ctx) error {
	return c.SendStatus(fiber.StatusNoContent)
}

func BadRequest(c *fiber.Ctx, msg string) error {
	return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{
		Error: Error{
			Code:    "bad_request",
			Message: msg,
		},
	})
}

func Unauthorized(c *fiber.Ctx, msg string) error {
	return c.Status(fiber.StatusUnauthorized).JSON(ErrorResponse{
		Error: Error{
			Code:    "unauthorized",
			Message: msg,
		},
	})
}

func Forbidden(c *fiber.Ctx, msg string) error {
	return c.Status(fiber.StatusForbidden).JSON(ErrorResponse{
		Error: Error{
			Code:    "forbidden",
			Message: msg,
		},
	})
}

func NotFound(c *fiber.Ctx, msg string) error {
	return c.Status(fiber.StatusNotFound).JSON(ErrorResponse{
		Error: Error{
			Code:    "not_found",
			Message: msg,
		},
	})
}

func Conflict(c *fiber.Ctx, msg string) error {
	return c.Status(fiber.StatusConflict).JSON(ErrorResponse{
		Error: Error{
			Code:    "conflict",
			Message: msg,
		},
	})
}

func ValidationError(c *fiber.Ctx, errs []string) error {
	return c.Status(fiber.StatusUnprocessableEntity).JSON(ErrorResponse{
		Error: Error{
			Code:    "validation_error",
			Message: "Validation failed",
			Details: errs,
		},
	})
}

func InternalError(c *fiber.Ctx, msg string) error {
	if msg == "" {
		msg = "Internal server error"
	}
	return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse{
		Error: Error{
			Code:    "internal_error",
			Message: msg,
		},
	})
}
