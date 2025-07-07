# Use slim Python 3.11 base image
FROM python:3.11-slim

# Set working directory inside container
WORKDIR /app

# Install system dependencies if needed (for psycopg2 or others)
RUN apt-get update && apt-get install -y gcc libpq-dev && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies first (useful for caching)
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all backend source code into container
COPY backend/ .

# Set environment variables
ENV DATABASE_URL=sqlite:///./lms.db \
    ENVIRONMENT=production \
    PYTHONUNBUFFERED=1

# Run FastAPI backend
CMD ["python", "main.py"]
