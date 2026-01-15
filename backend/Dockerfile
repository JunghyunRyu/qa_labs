FROM python:3.11-slim

WORKDIR /app

# Copy requirements and install Python dependencies
# psycopg2-binary doesn't need build tools
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user for Celery worker security
RUN adduser --disabled-password --gecos '' --uid 1000 celeryuser && \
    chown -R celeryuser:celeryuser /app

# Expose port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

