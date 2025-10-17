#!/usr/bin/env node

/**
 * Test MQTT to InfluxDB with real API key
 */

const mqtt = require('mqtt')

async function testWithRealAPIKey() {
  console.log('🧪 Testing MQTT to InfluxDB with real API key...\n')
  
  try {
    // Use real API key from database
    const apiKey = 'cc_dfd4d3742159b53e68b4f2bae6df4132f2374c64b53a26b43cf6604e46c7e62a'
    
    // Test wallet address lookup first
    console.log('1. 🔑 Testing wallet address lookup...')
    const walletResponse = await fetch(`http://localhost:3000/api/mqtt/wallet-address?apiKey=${apiKey}`)
    const walletResult = await walletResponse.json()
    
    if (walletResult.success) {
      console.log('✅ Wallet address lookup successful!')
      console.log(`   API Key: ${apiKey.slice(0, 10)}...`)
      console.log(`   Wallet: ${walletResult.data.walletAddress}`)
      console.log(`   Username: ${walletResult.data.username}`)
    } else {
      console.error('❌ Wallet address lookup failed:', walletResult.message)
      return
    }
    
    // Connect to MQTT broker
    console.log('\n2. 🔌 Connecting to MQTT broker...')
    const client = mqtt.connect('mqtt://localhost:1883', {
      clientId: `test_real_${Math.random().toString(16).substr(2, 8)}`,
      clean: true,
    })
    
    await new Promise((resolve, reject) => {
      client.on('connect', () => {
        console.log('✅ Connected to MQTT broker')
        resolve()
      })
      
      client.on('error', (error) => {
        console.error('❌ MQTT connection error:', error)
        reject(error)
      })
      
      setTimeout(() => {
        reject(new Error('MQTT connection timeout'))
      }, 5000)
    })
    
    // Send MQTT message with real API key
    console.log('\n3. 📤 Sending MQTT message with real API key...')
    const topic = `carbon_sequester/${apiKey}/sensor_data`
    const payload = JSON.stringify({
      c: 450,      // CO2 reading
      h: 65,       // Humidity
      cr: 225.0,   // Credits
      e: 13.0,     // Emissions
      o: true,     // Offset
      t: Date.now() // Timestamp
    })
    
    console.log(`   Topic: ${topic}`)
    console.log(`   Payload: ${payload}`)
    
    client.publish(topic, payload, (error) => {
      if (error) {
        console.error('❌ Failed to publish MQTT message:', error)
      } else {
        console.log('✅ MQTT message published successfully')
      }
    })
    
    // Wait for processing
    console.log('\n4. ⏳ Waiting for MQTT context to process message...')
    await new Promise(resolve => setTimeout(resolve, 5000))
    
    // Check InfluxDB
    console.log('\n5. 🔍 Checking InfluxDB for new data...')
    const response = await fetch('http://localhost:3000/api/timeseries/query?startTime=-2m&limit=10')
    const result = await response.json()
    
    if (result.success) {
      console.log(`✅ InfluxDB query successful - Found ${result.count} data points`)
      
      if (result.data.length > 0) {
        console.log('\n📊 Data found in InfluxDB:')
        result.data.forEach((device, index) => {
          console.log(`\n   Device ${index + 1}:`)
          console.log(`   • Device ID: ${device.deviceId}`)
          console.log(`   • Wallet Address: ${device.walletAddress}`)
          console.log(`   • Device Type: ${device.deviceType}`)
          console.log(`   • API Key: ${device.apiKey}`)
          console.log(`   • Data Points: ${device.timeSeries.length}`)
          
          if (device.timeSeries.length > 0) {
            const latestData = device.timeSeries[0]
            console.log(`   • Latest CO₂: ${latestData.co2} ppm`)
            console.log(`   • Latest Credits: ${latestData.credits}`)
            console.log(`   • Latest Timestamp: ${new Date(latestData.timestamp).toLocaleString()}`)
          }
        })
        
        console.log('\n🎉 SUCCESS! CO2 data is now being saved to InfluxDB!')
      } else {
        console.log('⚠️ No data found in InfluxDB')
        console.log('\nThe MQTT context might not be connected. Check:')
        console.log('1. Open http://localhost:3000/mqtt-debug')
        console.log('2. Check if MQTT is connected')
        console.log('3. Look for errors in browser console')
      }
    } else {
      console.error('❌ InfluxDB query failed:', result.error)
    }
    
    // Cleanup
    client.end()
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

// Install mqtt if needed
try {
  require('mqtt')
} catch (error) {
  console.log('Installing mqtt package...')
  const { execSync } = require('child_process')
  execSync('npm install mqtt', { stdio: 'inherit' })
}

testWithRealAPIKey().catch(console.error)
