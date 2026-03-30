package db

import (
	"time"

	"github.com/google/uuid"
)

type Profile struct {
	ID           uuid.UUID `json:"id"`
	Name         *string   `json:"name"`
	AvatarURL    *string   `json:"avatar_url"`
	BodyPhotoURL *string   `json:"body_photo_url"`
	SkinTone     *string   `json:"skin_tone"`
	StyleTags    []string  `json:"style_tags"`
	CreatedAt    time.Time `json:"created_at"`
}

type WardrobeItem struct {
	ID               uuid.UUID `json:"id"`
	UserID           uuid.UUID `json:"user_id"`
	ImageURL         string    `json:"image_url"`
	CutoutURL        *string   `json:"cutout_url"`
	Category         string    `json:"category"`
	SubCategory      *string   `json:"sub_category"`
	Colors           []string  `json:"colors"`
	StyleTags        []string  `json:"style_tags"`
	OccasionTags     []string  `json:"occasion_tags"`
	FunctionalTags   []string  `json:"functional_tags"`
	SilhouetteTags   []string  `json:"silhouette_tags"`
	VibeTags         []string  `json:"vibe_tags"`
	FabricGuess      *string   `json:"fabric_guess"`
	ProcessingStatus string    `json:"processing_status"`
	CreatedAt        time.Time `json:"created_at"`
}

type Outfit struct {
	ID             uuid.UUID `json:"id"`
	UserID         uuid.UUID `json:"user_id"`
	ItemIDs        []string  `json:"item_ids"`
	Occasion       *string   `json:"occasion"`
	Vibe           *string   `json:"vibe"`
	ColorReasoning *string   `json:"color_reasoning"`
	AIScore        float64   `json:"ai_score"`
	CoverImageURL  *string   `json:"cover_image_url"`
	CreatedAt      time.Time `json:"created_at"`
}

type UpdateProfileRequest struct {
	Name         *string  `json:"name" validate:"omitempty,min=2"`
	AvatarURL    *string  `json:"avatar_url" validate:"omitempty,url"`
	BodyPhotoURL *string  `json:"body_photo_url" validate:"omitempty,url"`
	SkinTone     *string  `json:"skin_tone" validate:"omitempty"`
	StyleTags    []string `json:"style_tags" validate:"omitempty"`
}

type CreateWardrobeItemRequest struct {
	ImageURL         string   `json:"image_url" validate:"required,url"`
	Category         string   `json:"category" validate:"required"`
	SubCategory      *string  `json:"sub_category" validate:"omitempty"`
	Colors           []string `json:"colors" validate:"omitempty"`
	StyleTags        []string `json:"style_tags" validate:"omitempty"`
	OccasionTags     []string `json:"occasion_tags" validate:"omitempty"`
	FunctionalTags   []string `json:"functional_tags" validate:"omitempty"`
	SilhouetteTags   []string `json:"silhouette_tags" validate:"omitempty"`
	VibeTags         []string `json:"vibe_tags" validate:"omitempty"`
	ProcessingStatus string   `json:"processing_status" validate:"omitempty"`
}

type UpdateWardrobeItemRequest struct {
	ImageURL         *string  `json:"image_url" validate:"omitempty,url"`
	CutoutURL        *string  `json:"cutout_url" validate:"omitempty,url"`
	Category         *string  `json:"category" validate:"omitempty"`
	SubCategory      *string  `json:"sub_category" validate:"omitempty"`
	Colors           []string `json:"colors" validate:"omitempty"`
	StyleTags        []string `json:"style_tags" validate:"omitempty"`
	OccasionTags     []string `json:"occasion_tags" validate:"omitempty"`
	FunctionalTags   []string `json:"functional_tags" validate:"omitempty"`
	SilhouetteTags   []string `json:"silhouette_tags" validate:"omitempty"`
	VibeTags         []string `json:"vibe_tags" validate:"omitempty"`
	FabricGuess      *string  `json:"fabric_guess" validate:"omitempty"`
	ProcessingStatus *string  `json:"processing_status" validate:"omitempty"`
}

type CreateOutfitRequest struct {
	ItemIDs        []string `json:"item_ids" validate:"required,min=1"`
	Occasion       *string  `json:"occasion" validate:"omitempty"`
	Vibe           *string  `json:"vibe" validate:"omitempty"`
	ColorReasoning *string  `json:"color_reasoning" validate:"omitempty"`
	AIScore        float64  `json:"ai_score" validate:"omitempty,min=0,max=1"`
	CoverImageURL  *string  `json:"cover_image_url" validate:"omitempty,url"`
}
