#!/bin/bash
# Start Python Prophet service

cd "$(dirname "$0")/py_forecast"

# Check if Python is available
if command -v python3 &> /dev/null; then
    PYTHON=python3
elif command -v python &> /dev/null; then
    PYTHON=python
else
    echo "❌ Python not found. Please install Python 3.9+"
    exit 1
fi

# Check if dependencies are installed
if ! $PYTHON -c "import fastapi" 2>/dev/null; then
    echo "📦 Installing Python dependencies..."
    pip install -r ../requirements.txt || pip3 install -r ../requirements.txt
fi

# Start the service
echo "🚀 Starting Prophet service..."
$PYTHON server.py

