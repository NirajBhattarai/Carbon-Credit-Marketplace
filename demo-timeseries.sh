#!/bin/bash

# Demo script to show time-series data viewing capabilities

echo "🚀 Carbon Credit Marketplace - Time-Series Data Demo"
echo "=================================================="
echo ""

echo "📊 Available ways to view your time-series data:"
echo ""

echo "1. 🌐 Web Dashboard (Recommended)"
echo "   • Start Next.js server: npm run dev"
echo "   • Open: http://localhost:3000/timeseries"
echo "   • Features: Interactive UI, real-time updates, filtering"
echo ""

echo "2. 💻 Command Line Tool"
echo "   • View raw data: ./view-timeseries.js --query"
echo "   • View statistics: ./view-timeseries.js --stats"
echo "   • Filter by device: ./view-timeseries.js --query --device DEVICE_001"
echo "   • Custom time range: ./view-timeseries.js --stats --time 7d"
echo ""

echo "3. 🌐 InfluxDB Web UI"
echo "   • Open: http://localhost:8086"
echo "   • Login: admin / carboncredit123"
echo "   • Navigate to Data Explorer"
echo "   • Run Flux queries for advanced analysis"
echo ""

echo "4. 🔌 API Endpoints"
echo "   • Query data: curl 'http://localhost:3000/api/timeseries/query?startTime=-24h'"
echo "   • Get stats: curl 'http://localhost:3000/api/timeseries/stats?period=24h'"
echo ""

echo "5. 📱 Mobile-Friendly Dashboard"
echo "   • Responsive design works on all devices"
echo "   • Touch-friendly controls"
echo "   • Real-time data updates"
echo ""

echo "🎯 Quick Start Commands:"
echo ""

# Check if services are running
echo "🔍 Checking service status..."

if curl -s http://localhost:8086/health > /dev/null 2>&1; then
    echo "✅ InfluxDB is running (http://localhost:8086)"
else
    echo "❌ InfluxDB is not running. Start with: ./setup-timeseries.sh"
fi

if nc -z localhost 1883 2>/dev/null; then
    echo "✅ MQTT Broker is running (localhost:1883)"
else
    echo "❌ MQTT Broker is not running. Start with: ./setup-timeseries.sh"
fi

if curl -s http://localhost:3000/api/timeseries/query > /dev/null 2>&1; then
    echo "✅ Next.js API is running (http://localhost:3000)"
else
    echo "❌ Next.js API is not running. Start with: npm run dev"
fi

echo ""
echo "📈 Sample Data Queries:"
echo ""

echo "# View recent sensor data"
echo "curl 'http://localhost:3000/api/timeseries/query?startTime=-1h&limit=10'"
echo ""

echo "# Get device statistics"
echo "curl 'http://localhost:3000/api/timeseries/stats?period=24h'"
echo ""

echo "# Filter by device type"
echo "curl 'http://localhost:3000/api/timeseries/query?deviceType=SEQUESTER&startTime=-6h'"
echo ""

echo "# Command line tool examples"
echo "./view-timeseries.js --query --time 1h"
echo "./view-timeseries.js --stats --device DEVICE_001"
echo ""

echo "🎉 Ready to explore your carbon credit time-series data!"
echo ""
echo "💡 Pro Tips:"
echo "   • Use shorter time ranges for faster queries"
echo "   • Filter by device ID to focus on specific devices"
echo "   • Check the InfluxDB UI for advanced Flux queries"
echo "   • Monitor device health with connection events"
echo ""
