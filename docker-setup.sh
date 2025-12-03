#!/bin/bash

# Ring-Garmin Server - Docker Setup Script
# This script helps you set up the Ring integration server using Docker

set -e

echo "═══════════════════════════════════════════════════════════════════════"
echo "Ring-Garmin Integration - Docker Setup"
echo "═══════════════════════════════════════════════════════════════════════"
echo ""

# Create config directory
mkdir -p config

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "✗ docker-compose not found. Please install Docker Compose first."
    exit 1
fi

echo "Building Docker image..."
docker-compose build

echo ""
echo "═══════════════════════════════════════════════════════════════════════"
echo "Setup Steps"
echo "═══════════════════════════════════════════════════════════════════════"
echo ""
echo "Run the following commands to configure the server:"
echo ""
echo "1. Authenticate with Ring:"
echo "   docker-compose run --rm ring-server node scripts/auth.js"
echo ""
echo "2. Select your Ring device:"
echo "   docker-compose run --rm ring-server node scripts/select-device.js"
echo ""
echo "3. Generate shared secret for Garmin watch:"
echo "   docker-compose run --rm ring-server node scripts/generate-secret.js"
echo ""
echo "4. Start the server:"
echo "   docker-compose up -d"
echo ""
echo "5. Check server health:"
echo "   curl http://localhost:3000/health"
echo ""
echo "═══════════════════════════════════════════════════════════════════════"
