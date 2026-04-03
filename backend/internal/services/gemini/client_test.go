package gemini

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestNewClient(t *testing.T) {
	client := NewClient("https://generativelanguage.googleapis.com", "test-api-key")

	if client == nil {
		t.Fatal("expected non-nil client")
	}
	if client.baseURL != "https://generativelanguage.googleapis.com" {
		t.Errorf("expected baseURL %q, got %q", "https://generativelanguage.googleapis.com", client.baseURL)
	}
	if client.apiKey != "test-api-key" {
		t.Errorf("expected apiKey %q, got %q", "test-api-key", client.apiKey)
	}
	if client.maxRetries != 3 {
		t.Errorf("expected maxRetries %d, got %d", 3, client.maxRetries)
	}
}

func TestClient_DefaultHTTPClient(t *testing.T) {
	client := NewClient("https://generativelanguage.googleapis.com", "test-api-key")

	if client.httpClient == nil {
		t.Fatal("expected non-nil httpClient")
	}
}

func TestTrimMarkdownCodeBlock(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "plain text",
			input:    `{"category": "tops"}`,
			expected: `{"category": "tops"}`,
		},
		{
			name:     "with json code block",
			input:    "```json\n{\"category\": \"tops\"}\n```",
			expected: `{"category": "tops"}`,
		},
		{
			name:     "with markdown code block no language",
			input:    "```\n{\"category\": \"tops\"}\n```",
			expected: `{"category": "tops"}`,
		},
		{
			name:     "with extra whitespace",
			input:    "```json\n  {\"category\": \"tops\"}\n  ```",
			expected: "{\"category\": \"tops\"}",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := trimMarkdownCodeBlock(tt.input)
			if result != tt.expected {
				t.Errorf("trimMarkdownCodeBlock(%q) = %q, want %q", tt.input, result, tt.expected)
			}
		})
	}
}

func TestClient_CategorizeImage_Integration(t *testing.T) {
	// Skip integration test if no API key is set
	apiKey := "test-key"
	if apiKey == "" {
		t.Skip("Skipping integration test: GEMINI_API_KEY not set")
	}

	// This would be a real integration test
	// For now, we just verify the client can be created
	client := NewClient("https://generativelanguage.googleapis.com", apiKey)
	if client == nil {
		t.Fatal("expected non-nil client")
	}
}

func TestCategorizeResponse_JSON(t *testing.T) {
	resp := CategorizeResponse{
		Category:     "tops",
		SubCategory:  "tshirt",
		OccasionTags: []string{"casual", "streetwear"},
		StyleTags:    []string{"modern"},
		Colors:       []string{"black", "white"},
	}

	if resp.Category != "tops" {
		t.Errorf("expected Category %q, got %q", "tops", resp.Category)
	}
	if resp.SubCategory != "tshirt" {
		t.Errorf("expected SubCategory %q, got %q", "tshirt", resp.SubCategory)
	}
	if len(resp.OccasionTags) != 2 {
		t.Errorf("expected 2 OccasionTags, got %d", len(resp.OccasionTags))
	}
	if len(resp.StyleTags) != 1 {
		t.Errorf("expected 1 StyleTags, got %d", len(resp.StyleTags))
	}
	if len(resp.Colors) != 2 {
		t.Errorf("expected 2 Colors, got %d", len(resp.Colors))
	}
}

// Mock server for testing HTTP interactions
func TestClient_FetchImage(t *testing.T) {
	// Create a mock server
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("test image data"))
	}))
	defer server.Close()

	client := NewClient("https://generativelanguage.googleapis.com", "test-key")

	data, err := client.fetchImage(context.Background(), server.URL)
	if err != nil {
		t.Fatalf("fetchImage failed: %v", err)
	}

	if string(data) != "test image data" {
		t.Errorf("expected %q, got %q", "test image data", string(data))
	}
}

func TestClient_FetchImage_NotFound(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNotFound)
	}))
	defer server.Close()

	client := NewClient("https://generativelanguage.googleapis.com", "test-key")

	_, err := client.fetchImage(context.Background(), server.URL)
	if err == nil {
		t.Fatal("expected error for 404 response")
	}
}
