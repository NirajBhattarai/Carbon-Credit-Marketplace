import { db, iotDevices, deviceData, carbonCreditTransactions } from '@/lib/db'

async function seed() {
  console.log('🌱 Starting database seed...')

  try {
    // Clear existing data
    await db.delete(carbonCreditTransactions)
    await db.delete(deviceData)
    await db.delete(iotDevices)

    console.log('🗑️ Cleared existing data')

    // Seed IoT devices
    const devices = await db.insert(iotDevices).values([
      {
        deviceId: 'SOLAR_FARM_001',
        deviceType: 'CREATOR',
        location: 'California Solar Farm',
        projectName: 'Renewable Energy Project Alpha',
        description: 'Solar panel monitoring system',
        isActive: true,
        lastSeen: new Date(),
      },
      {
        deviceId: 'WIND_TURBINE_001',
        deviceType: 'CREATOR',
        location: 'Texas Wind Farm',
        projectName: 'Wind Energy Initiative',
        description: 'Wind turbine monitoring system',
        isActive: true,
        lastSeen: new Date(),
      },
      {
        deviceId: 'MANUFACTURING_PLANT_001',
        deviceType: 'BURNER',
        location: 'Detroit Manufacturing Plant',
        projectName: 'Industrial Process Monitoring',
        description: 'Manufacturing plant emission monitoring',
        isActive: true,
        lastSeen: new Date(),
      },
      {
        deviceId: 'DATA_CENTER_001',
        deviceType: 'BURNER',
        location: 'Silicon Valley Data Center',
        projectName: 'Data Center Operations',
        description: 'Data center energy consumption monitoring',
        isActive: true,
        lastSeen: new Date(),
      },
    ]).returning()

    console.log(`✅ Created ${devices.length} IoT devices`)

    // Generate sample device data
    const sampleData = []
    const now = new Date()

    for (let i = 0; i < 100; i++) {
      const device = devices[i % devices.length]
      const timestamp = new Date(now.getTime() - (i * 30 * 60 * 1000)) // 30 minutes apart
      
      let co2Value, energyValue, temperature, humidity

      if (device.deviceType === 'CREATOR') {
        // Solar/Wind generation data
        co2Value = Math.random() * 500 + 200 // 200-700 CO2 reduction
        energyValue = Math.random() * 300 + 100 // 100-400 energy generation
        temperature = Math.random() * 10 + 20 // 20-30°C
        humidity = Math.random() * 30 + 40 // 40-70%
      } else {
        // Manufacturing/Data center consumption data
        co2Value = Math.random() * 800 + 300 // 300-1100 CO2 emissions
        energyValue = Math.random() * 500 + 200 // 200-700 energy consumption
        temperature = Math.random() * 15 + 22 // 22-37°C
        humidity = Math.random() * 20 + 30 // 30-50%
      }

      sampleData.push({
        deviceId: device.deviceId,
        timestamp,
        co2Value: co2Value.toString(),
        energyValue: energyValue.toString(),
        temperature: temperature.toString(),
        humidity: humidity.toString(),
        dataHash: `hash_${i}`,
        verified: Math.random() > 0.1, // 90% verified
      })
    }

    await db.insert(deviceData).values(sampleData)
    console.log(`✅ Created ${sampleData.length} sample data points`)

    // Create some sample transactions
    const transactions = await db.insert(carbonCreditTransactions).values([
      {
        deviceId: 'SOLAR_FARM_001',
        transactionType: 'MINT',
        amount: '5.0',
        status: 'CONFIRMED',
        data: { totalCo2: 5000, totalEnergy: 3000 },
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
      },
      {
        deviceId: 'WIND_TURBINE_001',
        transactionType: 'MINT',
        amount: '3.0',
        status: 'CONFIRMED',
        data: { totalCo2: 3000, totalEnergy: 2000 },
        createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000), // 4 hours ago
      },
      {
        deviceId: 'MANUFACTURING_PLANT_001',
        transactionType: 'BURN',
        amount: '2.0',
        status: 'PENDING',
        data: { totalCo2: 2000, totalEnergy: 1500 },
        createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000), // 1 hour ago
      },
    ]).returning()

    console.log(`✅ Created ${transactions.length} sample transactions`)

    console.log('🎉 Database seed completed successfully!')
    console.log('\n📊 Summary:')
    console.log(`- ${devices.length} IoT devices`)
    console.log(`- ${sampleData.length} data points`)
    console.log(`- ${transactions.length} transactions`)

  } catch (error) {
    console.error('❌ Seed failed:', error)
    process.exit(1)
  }
}

seed()
  .then(() => {
    console.log('✅ Seed script completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Seed script failed:', error)
    process.exit(1)
  })
