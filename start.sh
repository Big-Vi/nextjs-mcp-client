#!/bin/bash

# Quick Start Script for MCP Client with Docker Compose
# This script will start all MCP servers and the client

echo "🚀 Starting MCP Client with all servers..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    cp .env.example .env
    echo "📝 Please edit .env file with your GitLab token and other settings"
    echo "Then run this script again."
    exit 1
fi

# Pull latest images
echo "📦 Pulling latest images..."
docker-compose pull

# Build and start all services
echo "🔨 Building and starting services..."
docker-compose up --build -d

if [ $? -eq 0 ]; then
    echo "✅ All services started successfully!"
    echo ""
    echo "🌐 Services available at:"
    echo "   • MCP Client:        http://localhost:3000"
    echo "   • DevOps MCP Server: http://localhost:3001"
    echo "   • GitLab MCP Server: http://localhost:3333"
    echo ""
    echo "📋 Useful commands:"
    echo "   • View logs:         docker-compose logs -f"
    echo "   • Stop services:     docker-compose down"
    echo "   • Restart services:  docker-compose restart"
    echo ""
    echo "🔍 Check service status:"
    docker-compose ps
else
    echo "❌ Failed to start services!"
    exit 1
fi
