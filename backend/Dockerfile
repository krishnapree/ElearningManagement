FROM python:3.11-slim

WORKDIR /app

# Copy and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend source code
COPY . .

ENV DATABASE_URL="sqlite:///./lms.db"
ENV ENVIRONMENT="production"

CMD ["python", "main.py"] 