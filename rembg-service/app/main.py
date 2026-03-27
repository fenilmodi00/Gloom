from fastapi import FastAPI, UploadFile, File, HTTPException, Response
from fastapi.responses import JSONResponse
import time
import os
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

LOG_LEVEL = os.getenv("LOG_LEVEL", "info").upper()
logging.basicConfig(level=LOG_LEVEL)
logger = logging.getLogger(__name__)

# Import processor after env vars are loaded, so model loads here
from app.processor import process_image

app = FastAPI(
    title="rembg Background Removal API",
    version="1.0.0",
    description="CPU-based background removal using birefnet-general model"
)

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE_MB = int(os.getenv("MAX_FILE_SIZE_MB", "10"))
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

@app.get("/health")
def health_check():
    return JSONResponse(
        content={
            "status": "ok",
            "model": "birefnet-general",
            "ready": True
        },
        status_code=200
    )

@app.post("/remove-background")
async def remove_background(file: UploadFile = File(...)):
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type: {file.content_type}. Allowed types are {ALLOWED_CONTENT_TYPES}."
        )

    file_bytes = await file.read()
    file_size = len(file_bytes)

    if file_size > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"File too large: {file_size} bytes. Max allowed size is {MAX_FILE_SIZE_BYTES} bytes."
        )

    start_time = time.time()
    try:
        output_bytes = process_image(file_bytes)
    except Exception as e:
        logger.error(f"Error processing image: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="An error occurred while processing the image."
        )
    end_time = time.time()
    processing_time = end_time - start_time

    # Log to stdout as per requirements
    print(f"Processed image in {processing_time:.4f} seconds", flush=True)

    return Response(
        content=output_bytes,
        media_type="image/png",
        headers={
            "X-Processing-Time": f"{processing_time:.4f}",
            "X-Model": "birefnet-general"
        }
    )
