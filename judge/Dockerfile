FROM python:3.11-slim

WORKDIR /workdir

# Install pytest
RUN pip install --no-cache-dir pytest

# Copy conftest.py for security restrictions
COPY conftest.py /workdir/conftest.py

# Default command
CMD ["pytest", "-q", "--disable-warnings", "--maxfail=1"]

