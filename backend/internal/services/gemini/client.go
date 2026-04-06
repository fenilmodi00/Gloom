package gemini

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"math/rand"
	"net/http"
	"regexp"
	"strings"
	"time"
)

// Client is an HTTP client for the Gemini API.
type Client struct {
	baseURL    string
	apiKey     string
	httpClient *http.Client
	maxRetries int
}

// NewClient creates a new Gemini service client.
func NewClient(baseURL, apiKey string) *Client {
	return &Client{
		baseURL:    baseURL,
		apiKey:     apiKey,
		httpClient: &http.Client{Timeout: 60 * time.Second},
		maxRetries: 3,
	}
}

// Part represents a content part in the request.
type Part struct {
	Text string `json:"text,omitempty"`
	// InlineData for base64 image data
	InlineData *InlineData `json:"inlineData,omitempty"`
}

// InlineData holds base64 encoded image data.
type InlineData struct {
	MimeType string `json:"mimeType"`
	Data     string `json:"data"`
}

// Content represents a content item in the request.
type Content struct {
	Role  string `json:"role,omitempty"`
	Parts []Part `json:"parts"`
}

// GenerationConfig specifies the output format configuration.
type GenerationConfig struct {
	ResponseMimeType string  `json:"responseMimeType"`
	ResponseSchema   *Schema `json:"responseSchema,omitempty"`
}

// Schema defines the expected response schema.
type Schema struct {
	Type        string             `json:"type"`
	Description string             `json:"description,omitempty"`
	Properties  map[string]*Schema `json:"properties,omitempty"`
	Required    []string           `json:"required,omitempty"`
	Items       *Schema            `json:"items,omitempty"` // For array element definitions
	Enum        []string           `json:"enum,omitempty"`  // For string enum values
}

// CategorizeRequest is the request body for the Gemini API.
type CategorizeRequest struct {
	Contents         []Content        `json:"contents"`
	GenerationConfig GenerationConfig `json:"generationConfig"`
}

// CategorizeResponse is the response from the Gemini API categorization.
type CategorizeResponse struct {
	Category       string   `json:"category"`
	SubCategory    string   `json:"sub_category,omitempty"`
	OccasionTags   []string `json:"occasion_tags"`
	StyleTags      []string `json:"style_tags"`
	Colors         []string `json:"colors,omitempty"`
	VibeTags       []string `json:"vibe_tags,omitempty"`
	FunctionalTags []string `json:"functional_tags,omitempty"`
	SilhouetteTags []string `json:"silhouette_tags,omitempty"`
	FabricGuess    string   `json:"fabric_guess,omitempty"`
}

// CategorizeImage analyzes a clothing image URL and returns categorization tags.
// It retries up to maxRetries times with exponential backoff + jitter.
func (c *Client) CategorizeImage(ctx context.Context, imageURL string) (*CategorizeResponse, error) {
	// Fetch the image data
	imageBytes, err := c.fetchImage(ctx, imageURL)
	if err != nil {
		return nil, fmt.Errorf("fetch image: %w", err)
	}

	// Create the request
	reqBody := c.createRequest(imageBytes)

	var lastErr error
	for attempt := 0; attempt < c.maxRetries; attempt++ {
		if attempt > 0 {
			// Exponential backoff with jitter: 1s±500ms, 2s±1s, 4s±2s
			baseDelay := time.Duration(1<<uint(attempt-1)) * time.Second
			jitter := time.Duration(rand.Int63n(int64(baseDelay)))
			select {
			case <-ctx.Done():
				return nil, ctx.Err()
			case <-time.After(baseDelay + jitter):
			}
		}

		result, err := c.doRequest(ctx, reqBody)
		if err == nil {
			return result, nil
		}
		lastErr = err
	}
	return nil, fmt.Errorf("gemini service failed after %d attempts: %w", c.maxRetries, lastErr)
}

// fetchImage downloads image data from a URL.
func (c *Client) fetchImage(ctx context.Context, imageURL string) ([]byte, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, imageURL, nil)
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("http request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("failed to fetch image: status %d", resp.StatusCode)
	}

	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read body: %w", err)
	}

	return data, nil
}

// createRequest builds the Gemini API request body.
func (c *Client) createRequest(imageBytes []byte) CategorizeRequest {
	prompt := `Analyze this clothing item image and provide categorization in JSON format.
Return JSON with:
- category: One of ["tops", "bottoms", "fullbody", "outerwear", "shoes", "bags", "accessories"]
- sub_category: Specific type (e.g., "tshirt", "jeans", "sneakers", "watch")
- occasion_tags: Array of applicable occasions from ["casual", "semi-formal", "formal", "athletic", "evening", "business", "party"]
- style_tags: Array of style descriptors from ["minimalist", "bohemian", "streetwear", "classic", "vintage", "modern", "ethnic", "western"]
- colors: Array of dominant colors detected in the image
- vibe_tags: Array of aesthetic vibes (e.g., "grunge", "preppy", "minimalist", "oversized")
- functional_tags: Array of functional features (e.g., "waterproof", "breathable", "stretchy", "warm")
- silhouette_tags: Array of silhouette descriptors (e.g., "slim-fit", "baggy", "cropped", "a-line")
- fabric_guess: Estimated fabric/material (e.g., "cotton", "denim", "leather", "polyester")`

	return CategorizeRequest{
		Contents: []Content{
			{
				Parts: []Part{
					{
						Text: prompt,
					},
					{
						InlineData: &InlineData{
							MimeType: "image/jpeg",
							Data:     base64.StdEncoding.EncodeToString(imageBytes),
						},
					},
				},
			},
		},
		GenerationConfig: GenerationConfig{
			ResponseMimeType: "application/json",
			ResponseSchema: &Schema{
				Type:     "OBJECT",
				Required: []string{"category", "occasion_tags"},
				Properties: map[string]*Schema{
					"category": {
						Type:        "STRING",
						Description: "Item category",
						Enum:        []string{"tops", "bottoms", "fullbody", "outerwear", "shoes", "bags", "accessories"},
					},
					"sub_category": {
						Type:        "STRING",
						Description: "Specific sub-category type",
					},
					"occasion_tags": {
						Type:        "ARRAY",
						Description: "Applicable occasions",
						Items: &Schema{
							Type: "STRING",
							Enum: []string{"casual", "semi-formal", "formal", "athletic", "evening", "business", "party"},
						},
					},
					"style_tags": {
						Type:        "ARRAY",
						Description: "Style descriptors",
						Items: &Schema{
							Type: "STRING",
							Enum: []string{"minimalist", "bohemian", "streetwear", "classic", "vintage", "modern", "ethnic", "western"},
						},
					},
					"colors": {
						Type:        "ARRAY",
						Description: "Dominant colors",
						Items: &Schema{
							Type: "STRING",
						},
					},
					"vibe_tags": {
						Type:        "ARRAY",
						Description: "Aesthetic vibes",
						Items: &Schema{
							Type: "STRING",
						},
					},
					"functional_tags": {
						Type:        "ARRAY",
						Description: "Functional features",
						Items: &Schema{
							Type: "STRING",
						},
					},
					"silhouette_tags": {
						Type:        "ARRAY",
						Description: "Silhouette descriptors",
						Items: &Schema{
							Type: "STRING",
						},
					},
					"fabric_guess": {
						Type:        "STRING",
						Description: "Estimated fabric",
					},
				},
			},
		},
	}
}

// doRequest sends the categorization request to Gemini API.
func (c *Client) doRequest(ctx context.Context, reqBody CategorizeRequest) (*CategorizeResponse, error) {
	bodyBytes, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("marshal request: %w", err)
	}

	url := fmt.Sprintf("%s/v1beta/models/gemini-2.5-flash:generateContent?key=%s", c.baseURL, c.apiKey)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(bodyBytes))
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("http request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("gemini service returned %d: %s", resp.StatusCode, string(respBody))
	}

	// Parse the response
	var geminiResp struct {
		Candidates []struct {
			Content struct {
				Parts []struct {
					Text string `json:"text"`
				} `json:"parts"`
			} `json:"content"`
		} `json:"candidates"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&geminiResp); err != nil {
		return nil, fmt.Errorf("decode response: %w", err)
	}

	if len(geminiResp.Candidates) == 0 || len(geminiResp.Candidates[0].Content.Parts) == 0 {
		return nil, fmt.Errorf("empty response from gemini")
	}

	responseText := geminiResp.Candidates[0].Content.Parts[0].Text

	// Clean up markdown code blocks if present
	cleanedText := trimMarkdownCodeBlock(responseText)

	var result CategorizeResponse
	if err := json.Unmarshal([]byte(cleanedText), &result); err != nil {
		return nil, fmt.Errorf("parse categorization result: %w", err)
	}

	return &result, nil
}

// trimMarkdownCodeBlock removes ```json ... ``` wrapping from text.
func trimMarkdownCodeBlock(text string) string {
	// Pattern to match markdown code blocks with flexible whitespace
	codeBlockPattern := regexp.MustCompile("(?s)```(?:json)?\\s*(.*?)\\s*```")
	matches := codeBlockPattern.FindStringSubmatch(text)
	if len(matches) >= 2 {
		return strings.TrimSpace(matches[1])
	}
	return strings.TrimSpace(text)
}
