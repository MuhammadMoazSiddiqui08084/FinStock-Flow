#!/bin/bash

# Start development servers for FinStock Flow
# This script starts all services: Frontend (Vite), Backend (Node), Python (Prophet)

echo "🚀 Starting FinStock Flow Development Environment..."

# Check if Node modules are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

# Check if Python dependencies are installed
if ! python3 -c "import fastapi" 2>/dev/null; then
    echo "🐍 Installing Python dependencies..."
    cd backend/py_forecast && pip install -r ../requirements.txt && cd ../..
fi

# Create necessary directories
mkdir -p data tmp

# Start all services using concurrently
echo "🎯 Starting all services..."
npm run dev

