import pytest
from fastapi.testclient import TestClient
from app.main import app
import io
from PIL import Image

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["model"] == "birefnet-general"
    assert data["ready"] is True

def test_remove_background_valid_image():
    # Programmatically generate a small solid-color PIL image (100x100 red JPEG)
    img = Image.new("RGB", (100, 100), color="red")
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format="JPEG")
    img_byte_arr.seek(0)

    response = client.post(
        "/remove-background",
        files={"file": ("test.jpg", img_byte_arr, "image/jpeg")}
    )

    assert response.status_code == 200
    assert response.headers["content-type"] == "image/png"
    assert "X-Processing-Time" in response.headers
    assert response.headers["X-Model"] == "birefnet-general"

    # Check magic bytes for PNG
    assert response.content.startswith(b'\x89PNG')

def test_invalid_file_type():
    # POST a plain .txt file, assert 400
    fake_txt_bytes = b"Hello, world!"
    response = client.post(
        "/remove-background",
        files={"file": ("test.txt", fake_txt_bytes, "text/plain")}
    )

    assert response.status_code == 400
    assert "Invalid file type" in response.json()["detail"]

def test_file_too_large():
    # POST a fake 11MB bytes object, assert 400
    fake_large_bytes = b"0" * (11 * 1024 * 1024)
    response = client.post(
        "/remove-background",
        files={"file": ("large.jpg", fake_large_bytes, "image/jpeg")}
    )

    assert response.status_code == 400
    assert "File too large" in response.json()["detail"]

def test_processing_time_header():
    # Assert X-Processing-Time header exists in response
    img = Image.new("RGB", (10, 10), color="blue")
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format="JPEG")
    img_byte_arr.seek(0)

    response = client.post(
        "/remove-background",
        files={"file": ("test.jpg", img_byte_arr, "image/jpeg")}
    )

    assert response.status_code == 200
    assert "X-Processing-Time" in response.headers
