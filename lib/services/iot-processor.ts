import { db, userCarbonCredits, userCreditHistory, deviceData, iotDevices } from '../db'
import { eq, desc } from 'drizzle-orm'
import { RedisService } from '../redis'

export interface IoTDataPayload {
  c: number // credits
  h: number // humidity
  cr: number // co2 reduced
  e: number // energy saved
  o: boolean // online status
  t: number // timestamp
}

export interface ProcessedIoTData {
  credits: number
  co2Reduced: number
  energySaved: number
  temperatureImpact: number
  humidityImpact: number
  isOnline: boolean
  timestamp: string
}

/**
 * Process IoT data and update user credits
 */
export class IoTDataProcessor {
  /**
   * Process incoming IoT data and update user credits
   */
  static async processIoTData(
    deviceId: string,
    payload: IoTDataPayload,
    userId?: string
  ): Promise<ProcessedIoTData> {
    try {
      // If userId not provided, find it from device
      if (!userId) {
        const device = await db
          .select({ applicationId: iotDevices.applicationId })
          .from(iotDevices)
          .where(eq(iotDevices.deviceId, deviceId))
          .limit(1)

        if (device.length === 0) {
          throw new Error(`Device ${deviceId} not found`)
        }

        // Get user from application
        const application = await db
          .select({ userId: iotDevices.applicationId })
          .from(iotDevices)
          .where(eq(iotDevices.deviceId, deviceId))
          .limit(1)

        userId = application[0]?.userId
        if (!userId) {
          throw new Error(`User not found for device ${deviceId}`)
        }
      }

      // Process the IoT data
      const processedData: ProcessedIoTData = {
        credits: payload.c,
        co2Reduced: payload.cr,
        energySaved: payload.e,
        temperatureImpact: 0, // Calculate based on humidity if needed
        humidityImpact: payload.h,
        isOnline: payload.o,
        timestamp: new Date(payload.t * 1000).toISOString(),
      }

      // Calculate temperature impact based on humidity (example calculation)
      processedData.temperatureImpact = this.calculateTemperatureImpact(payload.h)

      // Update user credits in database
      await this.updateUserCredits(userId, processedData)

      // Add to credit history
      await this.addCreditHistory(userId, processedData, deviceId)

      // Update Redis cache
      await this.updateRedisCache(userId, processedData)

      // Store device data
      await this.storeDeviceData(deviceId, payload)

      return processedData
    } catch (error) {
      console.error('Error processing IoT data:', error)
      throw error
    }
  }

  /**
   * Update user credits in database
   */
  private static async updateUserCredits(
    userId: string,
    data: ProcessedIoTData
  ): Promise<void> {
    // Get current credits
    const currentCredits = await db
      .select()
      .from(userCarbonCredits)
      .where(eq(userCarbonCredits.userId, userId))
      .orderBy(desc(userCarbonCredits.updatedAt))
      .limit(1)

    const currentData = currentCredits[0] || {
      credits: '0',
      co2Reduced: '0',
      energySaved: '0',
      temperatureImpact: '0',
      humidityImpact: '0',
      isOnline: false,
    }

    // Calculate new totals
    const newCredits = parseFloat(currentData.credits) + data.credits
    const newCo2Reduced = parseFloat(currentData.co2Reduced) + data.co2Reduced
    const newEnergySaved = parseFloat(currentData.energySaved) + data.energySaved
    const newTemperatureImpact = parseFloat(currentData.temperatureImpact) + data.temperatureImpact
    const newHumidityImpact = parseFloat(currentData.humidityImpact) + data.humidityImpact

    // Insert new credit record
    await db.insert(userCarbonCredits).values({
      userId,
      credits: newCredits.toString(),
      co2Reduced: newCo2Reduced.toString(),
      energySaved: newEnergySaved.toString(),
      temperatureImpact: newTemperatureImpact.toString(),
      humidityImpact: newHumidityImpact.toString(),
      isOnline: data.isOnline,
    })
  }

  /**
   * Add credit history entry
   */
  private static async addCreditHistory(
    userId: string,
    data: ProcessedIoTData,
    deviceId: string
  ): Promise<void> {
    await db.insert(userCreditHistory).values({
      userId,
      creditsEarned: data.credits.toString(),
      co2Reduced: data.co2Reduced.toString(),
      energySaved: data.energySaved.toString(),
      temperatureImpact: data.temperatureImpact.toString(),
      humidityImpact: data.humidityImpact.toString(),
      source: 'IOT_DEVICE',
      sourceId: deviceId,
      metadata: {
        deviceId,
        timestamp: data.timestamp,
      },
    })
  }

  /**
   * Update Redis cache
   */
  private static async updateRedisCache(
    userId: string,
    data: ProcessedIoTData
  ): Promise<void> {
    // Get current totals from database
    const currentCredits = await db
      .select()
      .from(userCarbonCredits)
      .where(eq(userCarbonCredits.userId, userId))
      .orderBy(desc(userCarbonCredits.updatedAt))
      .limit(1)

    if (currentCredits.length > 0) {
      const creditsData = currentCredits[0]
      const cacheData = {
        credits: parseFloat(creditsData.credits),
        co2Reduced: parseFloat(creditsData.co2Reduced),
        energySaved: parseFloat(creditsData.energySaved),
        temperatureImpact: parseFloat(creditsData.temperatureImpact),
        humidityImpact: parseFloat(creditsData.humidityImpact),
        isOnline: creditsData.isOnline,
        timestamp: creditsData.timestamp.toISOString(),
      }

      await RedisService.cacheUserCredits(userId, cacheData)
      await RedisService.updateLeaderboard(userId, cacheData.credits)
    }

    // Add to Redis history
    await RedisService.addCreditHistory(userId, {
      creditsEarned: data.credits,
      co2Reduced: data.co2Reduced,
      energySaved: data.energySaved,
      temperatureImpact: data.temperatureImpact,
      humidityImpact: data.humidityImpact,
      source: 'IOT_DEVICE',
      sourceId: deviceId,
      timestamp: data.timestamp,
    })

    // Invalidate dashboard cache
    await RedisService.invalidateUserCache(userId)
  }

  /**
   * Store device data
   */
  private static async storeDeviceData(
    deviceId: string,
    payload: IoTDataPayload
  ): Promise<void> {
    await db.insert(deviceData).values({
      deviceId,
      timestamp: new Date(payload.t * 1000),
      co2Value: payload.cr.toString(),
      energyValue: payload.e.toString(),
      temperature: '0', // Not provided in payload
      humidity: payload.h.toString(),
      dataHash: this.generateDataHash(payload),
      verified: true,
    })
  }

  /**
   * Calculate temperature impact based on humidity
   */
  private static calculateTemperatureImpact(humidity: number): number {
    // Example calculation: higher humidity = lower temperature impact
    // This is a simplified model - adjust based on your requirements
    return Math.max(0, (100 - humidity) * 0.1)
  }

  /**
   * Generate data hash for verification
   */
  private static generateDataHash(payload: IoTDataPayload): string {
    const dataString = `${payload.c}-${payload.h}-${payload.cr}-${payload.e}-${payload.o}-${payload.t}`
    return Buffer.from(dataString).toString('base64')
  }

  /**
   * Process batch IoT data
   */
  static async processBatchIoTData(
    deviceId: string,
    payloads: IoTDataPayload[],
    userId?: string
  ): Promise<ProcessedIoTData[]> {
    const results: ProcessedIoTData[] = []

    for (const payload of payloads) {
      try {
        const result = await this.processIoTData(deviceId, payload, userId)
        results.push(result)
      } catch (error) {
        console.error(`Error processing payload ${payload.t}:`, error)
        // Continue processing other payloads
      }
    }

    return results
  }
}
