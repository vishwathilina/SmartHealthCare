FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# System deps for Pillow (JPEG/PNG) and common wheels.
RUN apt-get update && apt-get install -y --no-install-recommends \
    libjpeg62-turbo \
    zlib1g \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY backend ./backend

# Create uploads dir (FastAPI serves it at /uploads).
RUN mkdir -p ./backend/uploads

EXPOSE 8000

WORKDIR /app/backend

CMD ["uvicorn", "main:app", "--host=0.0.0.0", "--port=8000"]

