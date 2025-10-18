#!/bin/bash

# Carbon Credit Marketplace MQTT Simulator Setup Script
# This script helps set up and run the MQTT data simulator

set -e

echo "🌱 Carbon Credit Marketplace MQTT Simulator Setup"
echo "================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm version: $(npm --version)"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
else
    echo "✅ Dependencies already installed"
fi

# Check if MQTT broker is running (optional check)
echo ""
echo "🔍 Checking MQTT broker connection..."

# Try to connect to default MQTT broker
if command -v nc &> /dev/null; then
    if nc -z localhost 9001 2>/dev/null; then
        echo "✅ MQTT broker appears to be running on localhost:9001"
    else
        echo "⚠️  MQTT broker not detected on localhost:9001"
        echo "   Make sure your MQTT broker is running before starting the simulator"
    fi
else
    echo "⚠️  Cannot check MQTT broker status (netcat not available)"
    echo "   Make sure your MQTT broker is running before starting the simulator"
fi

echo ""
echo "🚀 Setup complete! You can now run the simulator:"
echo ""
echo "   npm run simulate        # Run the simulator"
echo "   npm run simulate:dev     # Run in development mode"
echo ""
echo "📱 Don't forget to:"
echo "   1. Start your MQTT broker"
echo "   2. Start the Carbon Credit Marketplace UI"
echo "   3. Open the IoT Device Dashboard to see the data"
echo ""
echo "🛑 Press Ctrl+C to stop the simulator when running"
echo ""
echo "📚 For more information, see scripts/README.md"
