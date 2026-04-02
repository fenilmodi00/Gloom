package rembg

import (
	"bytes"
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

func TestRemoveBackground_Success(t *testing.T) {
	// Create a test server that returns a successful response
	testServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			t.Errorf("Expected POST request, got %s", r.Method)
		}
		if !strings.Contains(r.Header.Get("Content-Type"), "multipart/form-data") {
			t.Errorf("Expected multipart/form-data content type")
		}
		// Return a simple PNG response
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("test-image-data"))
	}))
	defer testServer.Close()

	// Create client with test server URL
	client := NewClient(testServer.URL)

	// Test successful removal
	result, err := client.RemoveBackground(context.Background(), []byte("test-image"), "test.png")
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}
	if !bytes.Equal(result, []byte("test-image-data")) {
		t.Errorf("Expected 'test-image-data', got %s", string(result))
	}
}

func TestRemoveBackground_Retry(t *testing.T) {
	// Track number of requests
	requestCount := 0

	// Create a test server that fails the first 2 times, then succeeds
	testServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requestCount++
		if requestCount <= 2 {
			// Return internal server error for first 2 requests
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte("internal error"))
			return
		}
		// Succeed on third request
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("success-after-retries"))
	}))
	defer testServer.Close()

	// Create client with test server URL
	client := NewClient(testServer.URL)

	// Test that it retries and eventually succeeds
	result, err := client.RemoveBackground(context.Background(), []byte("test-image"), "test.png")
	if err != nil {
		t.Fatalf("Expected no error after retries, got %v", err)
	}
	if !bytes.Equal(result, []byte("success-after-retries")) {
		t.Errorf("Expected 'success-after-retries', got %s", string(result))
	}
	if requestCount != 3 {
		t.Errorf("Expected 3 requests, got %d", requestCount)
	}
}

func TestRemoveBackground_MaxRetriesExceeded(t *testing.T) {
	// Create a test server that always fails
	testServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusBadGateway)
		w.Write([]byte("bad gateway"))
	}))
	defer testServer.Close()

	// Create client with test server URL
	client := NewClient(testServer.URL)

	// Test that it fails after max retries
	result, err := client.RemoveBackground(context.Background(), []byte("test-image"), "test.png")
	if err == nil {
		t.Fatalf("Expected error after max retries, got nil")
	}
	if result != nil {
		t.Errorf("Expected nil result, got %v", result)
	}
	if !strings.Contains(err.Error(), "rembg service failed after 3 attempts") {
		t.Errorf("Expected error about 3 attempts, got %v", err)
	}
}

func TestRemoveBackground_ContextCancellation(t *testing.T) {
	// Create a test server that delays response
	testServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Simulate slow service
		time.Sleep(2 * time.Second)
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("delayed-response"))
	}))
	defer testServer.Close()

	// Create client with test server URL
	client := NewClient(testServer.URL)

	// Create context that cancels quickly
	ctx, cancel := context.WithTimeout(context.Background(), 100*time.Millisecond)
	defer cancel()

	// Test that it respects context cancellation
	result, err := client.RemoveBackground(ctx, []byte("test-image"), "test.png")
	if err == nil {
		t.Fatalf("Expected error due to context cancellation, got nil")
	}
	if result != nil {
		t.Errorf("Expected nil result, got %v", result)
	}
	// Should be context deadline exceeded or canceled
	if err != context.DeadlineExceeded && err != context.Canceled {
		t.Errorf("Expected context error, got %v", err)
	}
}
