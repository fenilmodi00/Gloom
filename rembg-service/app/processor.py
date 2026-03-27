import io
from PIL import Image
from rembg import remove, new_session

print("Loading birefnet-general model session...", flush=True)
SESSION = new_session("birefnet-general")
print("Successfully loaded birefnet-general model session.", flush=True)

def process_image(image_bytes: bytes) -> bytes:
    """
    Takes raw image bytes, converts to an RGB PIL Image,
    removes the background using rembg with the pre-loaded session,
    and returns PNG bytes with transparent background (RGBA).
    """
    input_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    output_image = remove(input_image, session=SESSION)

    output_io = io.BytesIO()
    output_image.save(output_io, format="PNG")
    return output_io.getvalue()
