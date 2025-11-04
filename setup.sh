#!/bin/bash

echo "🚀 Setting up one_nbtc_ui project..."

# Create project structure
mkdir -p one_nbtc_ui_backend
mkdir -p one_nbtc_ui_frontend/src
mkdir -p one_nbtc_ui_database_production

echo "✅ Project structure created"

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd one_nbtc_ui_backend
npm install
cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd one_nbtc_ui_frontend
npm install
cd ..

echo "🎉 Setup complete!"
echo ""
echo "To start the project:"
echo "1. Backend: cd one_nbtc_ui_backend && npm run dev"
echo "2. Frontend: cd one_nbtc_ui_frontend && npm run dev"
echo "3. Database: cd one_nbtc_ui_database_production && docker-compose up -d"