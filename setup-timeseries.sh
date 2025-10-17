#!/bin/bash

# Carbon Credit Marketplace - Time-Series Database Setup Script

echo "🚀 Setting up Carbon Credit Marketplace Time-Series Database..."

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p mosquitto/config
mkdir -p mosquitto/data
mkdir -p mosquitto/log

# Set permissions for Mosquitto
chmod 755 mosquitto/data
chmod 755 mosquitto/log

# Start Docker services
echo "🐳 Starting Docker services..."
docker-compose -f docker-compose.timeseries.yml up -d

# Wait for InfluxDB to be ready
echo "⏳ Waiting for InfluxDB to be ready..."
sleep 10

# Check if InfluxDB is running
echo "🔍 Checking InfluxDB status..."
if curl -s http://localhost:8086/health > /dev/null; then
    echo "✅ InfluxDB is running successfully!"
else
    echo "❌ InfluxDB is not responding. Please check the logs:"
    echo "   docker-compose -f docker-compose.timeseries.yml logs influxdb"
    exit 1
fi

# Check if MQTT broker is running
echo "🔍 Checking MQTT broker status..."
if nc -z localhost 1883; then
    echo "✅ MQTT broker is running on port 1883!"
else
    echo "❌ MQTT broker is not responding. Please check the logs:"
    echo "   docker-compose -f docker-compose.timeseries.yml logs mosquitto"
fi

if nc -z localhost 9001; then
    echo "✅ MQTT WebSocket broker is running on port 9001!"
else
    echo "❌ MQTT WebSocket broker is not responding."
fi

echo ""
echo "🎉 Setup complete! Your time-series database is ready."
echo ""
echo "📊 Access InfluxDB UI at: http://localhost:8086"
echo "   Username: admin"
echo "   Password: carboncredit123"
echo "   Organization: carbon-credit-org"
echo "   Bucket: mqtt-data"
echo ""
echo "📡 MQTT Broker endpoints:"
echo "   TCP: localhost:1883"
echo "   WebSocket: ws://localhost:9001"
echo ""
echo "🔧 Useful commands:"
echo "   View logs: docker-compose -f docker-compose.timeseries.yml logs -f"
echo "   Stop services: docker-compose -f docker-compose.timeseries.yml down"
echo "   Restart services: docker-compose -f docker-compose.timeseries.yml restart"
echo ""
echo "📈 API endpoints for time-series data:"
echo "   Query data: GET /api/timeseries/query"
echo "   Device stats: GET /api/timeseries/stats"
echo ""
