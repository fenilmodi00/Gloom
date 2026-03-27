# Stage 1: Builder
FROM python:3.11-slim AS builder

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        gcc \
        g++ \
        libglib2.0-0 \
        libgl1-mesa-glx && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --no-cache-dir --prefix=/install -r requirements.txt


# Stage 2: Runtime
FROM python:3.11-slim

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        libglib2.0-0 \
        libgl1-mesa-glx && \
    rm -rf /var/lib/apt/lists/*

# Copy installed Python packages from builder stage
COPY --from=builder /install /usr/local

# CRITICAL STEP: Pre-download birefnet-general model at Docker BUILD TIME
RUN python -c "from rembg import new_session; new_session('birefnet-general')"

WORKDIR /usr/src/app

COPY app/ ./app/

ENV PORT=7000
EXPOSE 7000

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT} --workers 2"]
