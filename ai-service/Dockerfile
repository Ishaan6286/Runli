FROM python:3.11-slim
WORKDIR /app
# Install system dependencies for OpenCV and YOLO
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libxcb1 \
    && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
# Pre-download YOLOv8 nano-pose model at build time to avoid cold-start latency
RUN python -c "from ultralytics import YOLO; YOLO('yolov8n-pose.pt')"
# Create persistent storage dir for ChromaDB
RUN mkdir -p /app/chroma_data
COPY . .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
