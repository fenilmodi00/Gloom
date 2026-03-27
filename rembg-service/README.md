# rembg Background Removal API

## 1. Overview
This is a background removal REST API microservice built using FastAPI and `rembg`. It leverages the powerful `birefnet-general` model for AI-based background removal, running exclusively on CPU via ONNX Runtime. This service receives images, processes them entirely in memory, and returns transparent PNG cutouts.

## 2. Requirements
- Python 3.11+
- Docker (for containerized deployment)
- Minimum 3GB+ RAM available (Peak usage ~2.5GB during inference, ~2GB idle).

## 3. Local Setup (without Docker)
1. **Create and activate a virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt -r requirements-dev.txt
   ```

3. **Run the server**:
   ```bash
   uvicorn app.main:app --reload --port 7000
   ```
   *Note: On the first run, it will automatically download the `birefnet-general` model (~370MB) to your local `~/.u2net/` directory.*

## 4. Running Tests
The project includes both automated pytest tests and a manual local testing script.

- **Run Automated API Tests**:
  ```bash
  pytest tests/test_api.py -v
  ```

- **Run Manual Test**:
  Make sure you place a real image named `sample.jpg` in the `tests/` directory first.
  ```bash
  python tests/test_local.py
  ```

## 5. Docker Build & Run
The Dockerfile uses a multi-stage build that bakes the `birefnet-general` model into the image at build time to completely avoid cold-start delays.

1. **Build the image**:
   ```bash
   docker build -t rembg-service:local .
   ```

2. **Run the container**:
   ```bash
   docker run -p 7000:7000 --memory="4g" --cpus="3" rembg-service:local
   ```

3. **Monitor resources** (Expect ~2.5GB peak, ~2GB idle):
   ```bash
   docker stats
   ```

## 6. API Reference

### `GET /health`
Returns system health and model readiness status. Useful for deployment container health checks.
**Response**:
```json
{
  "status": "ok",
  "model": "birefnet-general",
  "ready": true
}
```

### `POST /remove-background`
Accepts an image and removes its background.
- **Parameters**: `multipart/form-data` with a single `file` field containing an image (jpeg, png, webp). Max size: 10MB.
- **Headers Returned**:
  - `X-Processing-Time`: float representing seconds taken for processing.
  - `X-Model`: `birefnet-general`
- **Response**: Returns raw PNG bytes (`image/png`) with a transparent background.
- **Error Codes**:
  - `400`: Invalid file type or file size exceeds limits.
  - `500`: Internal server error processing the image.

### `GET /docs`
FastAPI auto-generated Swagger UI for interactive API exploration.

## 7. Leapcell Deployment
1. Push your code to GitHub.
2. Connect the repository on the Leapcell Dashboard.
3. Configure settings:
   - **Runtime**: Docker
   - **Port**: 7000
   - **Memory**: 3584 MB (Allocates 3 CPU cores on Leapcell).
   - **Min Instances**: **1 (CRITICAL)** — Keeps the model warm in memory to prevent cold starts.
   - **Max Instances**: 3 (Auto-scales under load).
   - **Health Check path**: `GET /health`
   - **Environment variables**: `PORT` (e.g., 7000), `LOG_LEVEL` (e.g., info).

## 8. Calling From Go
If calling this service from a Go backend, you can execute a multipart request like this:

```go
package main

import (
	"bytes"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
)

func main() {
	file, _ := os.Open("image.jpg")
	defer file.Close()

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	part, _ := writer.CreateFormFile("file", "image.jpg")
	io.Copy(part, file)
	writer.Close()

	req, _ := http.NewRequest("POST", "https://your-rembg-service.leapcell.dev/remove-background", body)
	req.Header.Add("Content-Type", writer.FormDataContentType())

	client := &http.Client{}
	res, _ := client.Do(req)
	defer res.Body.Close()

	fmt.Println("Processing Time:", res.Header.Get("X-Processing-Time"))

	out, _ := os.Create("output.png")
	defer out.Close()
	io.Copy(out, res.Body)
}
```

## 9. Known Limitations
- **CPU Inference**: Processing takes around 5–8 seconds per image due to CPU-only execution.
- **Image Quality**: Best results are achieved when users photograph clothes on plain or white backgrounds.
- **Sync Processing**: The API request blocks during processing. It is highly recommended that callers enqueue requests using an async job worker to prevent HTTP timeouts.

## 10. Troubleshooting
- **OOM Errors**: If the service crashes due to out-of-memory errors on Leapcell, increase memory allocation to `4096MB`.
- **ShapeInferenceError**: If `onnxruntime` throws `ShapeInferenceError`, ensure `onnxruntime==1.19.0` is strictly installed in your environment. Versions `1.20.x` have a known bug with `birefnet-general`.
- **Slow First Request**: Ensure **Min Instances = 1** on Leapcell. If set to 0, the container will scale down and require cold starts, creating severe delays as the model loads into RAM.
