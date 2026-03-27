import requests
import os
import sys

def main():
    base_url = os.getenv("BASE_URL", "http://localhost:7000")
    sample_img_path = os.path.join(os.path.dirname(__file__), "sample.jpg")
    output_img_path = os.path.join(os.path.dirname(__file__), "output.png")

    print(f"Connecting to {base_url}...")

    # 1. Hit GET /health
    print(f"Testing GET {base_url}/health")
    try:
        health_resp = requests.get(f"{base_url}/health")
        health_resp.raise_for_status()
        print("Health check passed. Response JSON:")
        print(health_resp.json())
    except Exception as e:
        print(f"Health check failed: {e}")
        sys.exit(1)

    # 2. Check sample.jpg
    if not os.path.exists(sample_img_path):
        print(f"\n[ERROR] '{sample_img_path}' does not exist.")
        print("Please place a test image named 'sample.jpg' in the tests/ directory and try again.")
        sys.exit(1)

    # 3. POST /remove-background
    print(f"\nTesting POST {base_url}/remove-background")
    try:
        with open(sample_img_path, "rb") as f:
            files = {"file": ("sample.jpg", f, "image/jpeg")}
            resp = requests.post(f"{base_url}/remove-background", files=files)

        print(f"Status Code: {resp.status_code}")
        if resp.status_code == 200:
            print(f"X-Processing-Time: {resp.headers.get('X-Processing-Time')}")
            print(f"X-Model: {resp.headers.get('X-Model')}")

            # Save returned PNG
            with open(output_img_path, "wb") as out_f:
                out_f.write(resp.content)
            print(f"\n✅ Done — open tests/output.png to inspect quality")
        else:
            print(f"Failed to remove background. Response: {resp.text}")
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    main()
