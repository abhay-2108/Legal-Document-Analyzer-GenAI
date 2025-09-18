# Legal Document Analyzer - Main Application Dockerfile

FROM python:3.11-slim as base

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH="/app" \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy requirements file
COPY requirements.txt .

# Install Python dependencies
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

# Download spaCy model for NLP
RUN python -m spacy download en_core_web_sm

# Copy application code
COPY src/ ./src/
COPY config/ ./config/

# Create directories for document storage
RUN mkdir -p document_storage/metadata && \
    chmod 755 document_storage

# Create non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser && \
    chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Default command
CMD ["python", "-m", "uvicorn", "src.api_gateway.main:app", "--host", "0.0.0.0", "--port", "8000"]

# Development stage (with additional dev tools)
FROM base as development

# Install development dependencies
RUN pip install pytest pytest-asyncio black flake8 mypy

# Enable debugging
ENV DEBUG=true

# Development command with hot reload
CMD ["python", "-m", "uvicorn", "src.api_gateway.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

# Production stage (optimized)
FROM base as production

# Set production environment
ENV ENVIRONMENT=production \
    DEBUG=false

# Production-specific optimizations
RUN pip cache purge && \
    find /app -type d -name "__pycache__" -delete && \
    find /app -type f -name "*.pyc" -delete

# Production command
CMD ["python", "-m", "uvicorn", "src.api_gateway.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
