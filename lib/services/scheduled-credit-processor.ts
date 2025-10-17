/**
 * Scheduled Credit Processing Service
 * Automatically processes credits for sequester devices
 */

import { CarbonCreditEngine } from './carbon-credit-engine';
import { db, iotDevices, userCreditHistory } from '@/lib/db';
import { eq, and, desc } from 'drizzle-orm';

export class ScheduledCreditProcessor {
  private static isProcessing = false;
  private static intervalId: NodeJS.Timeout | null = null;

  /**
   * Start the scheduled credit processing
   */
  static start(intervalMinutes: number = 60) {
    if (this.intervalId) {
      console.log('Scheduled credit processing is already running');
      return;
    }

    console.log(`Starting scheduled credit processing every ${intervalMinutes} minutes`);
    
    this.intervalId = setInterval(async () => {
      await this.processAllDevices();
    }, intervalMinutes * 60 * 1000);

    // Process immediately on start
    this.processAllDevices();
  }

  /**
   * Stop the scheduled credit processing
   */
  static stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Stopped scheduled credit processing');
    }
  }

  /**
   * Process credits for all active sequester devices
   */
  static async processAllDevices(): Promise<void> {
    if (this.isProcessing) {
      console.log('Credit processing is already in progress, skipping...');
      return;
    }

    this.isProcessing = true;
    console.log('Starting credit processing for all devices...');

    try {
      // Get all active sequester devices
      const devices = await db
        .select()
        .from(iotDevices)
        .where(
          eq(iotDevices.deviceType, 'SEQUESTER')
        );

      console.log(`Found ${devices.length} sequester devices to process`);

      let processedCount = 0;
      let errorCount = 0;

      for (const device of devices) {
        try {
          await this.processDeviceCredits(device.deviceId);
          processedCount++;
        } catch (error) {
          console.error(`Error processing credits for device ${device.deviceId}:`, error);
          errorCount++;
        }
      }

      console.log(`Credit processing completed: ${processedCount} successful, ${errorCount} errors`);
    } catch (error) {
      console.error('Error in scheduled credit processing:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process credits for a specific device
   */
  static async processDeviceCredits(deviceId: string): Promise<void> {
    try {
      // Get the last processed time for this device
      const lastProcessed = await this.getLastProcessedTime(deviceId);
      const now = new Date();

      // Check if we should process credits (at least 24 hours since last processing)
      const timeSinceLastProcess = now.getTime() - lastProcessed.getTime();
      const minInterval = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

      if (timeSinceLastProcess < minInterval) {
        console.log(`Device ${deviceId}: Not enough time passed since last processing`);
        return;
      }

      // Calculate the time range for processing
      const endTime = now;
      const startTime = new Date(lastProcessed.getTime() + 60 * 1000); // 1 minute after last processed

      console.log(`Processing credits for device ${deviceId} from ${startTime.toISOString()} to ${endTime.toISOString()}`);

      // Process credits for this time period
      const result = await CarbonCreditEngine.processCreditsForPeriod(
        deviceId,
        startTime,
        endTime
      );

      if (result.creditsEarned > 0) {
        console.log(`Device ${deviceId}: Earned ${result.creditsEarned} credits`);
        console.log(`  - CO2 Reduced: ${result.co2Reduced} kg`);
        console.log(`  - Energy Saved: ${result.energySaved} kWh`);
        console.log(`  - Data Points: ${result.dataPointsUsed}`);
      } else {
        console.log(`Device ${deviceId}: No credits earned (${result.reason})`);
      }
    } catch (error) {
      console.error(`Error processing credits for device ${deviceId}:`, error);
      throw error;
    }
  }

  /**
   * Get the last processed time for a device
   */
  private static async getLastProcessedTime(deviceId: string): Promise<Date> {
    try {
      // Get the most recent credit history entry for this device
      const lastEntry = await db
        .select()
        .from(userCreditHistory)
        .where(
          and(
            eq(userCreditHistory.sourceId, deviceId),
            eq(userCreditHistory.source, 'IOT_DEVICE')
          )
        )
        .orderBy(desc(userCreditHistory.createdAt))
        .limit(1);

      if (lastEntry.length > 0) {
        return lastEntry[0].createdAt;
      }

      // If no history, use device creation time
      const device = await db
        .select()
        .from(iotDevices)
        .where(eq(iotDevices.deviceId, deviceId))
        .limit(1);

      if (device.length > 0) {
        return device[0].createdAt;
      }

      // Fallback to 7 days ago
      return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    } catch (error) {
      console.error(`Error getting last processed time for device ${deviceId}:`, error);
      // Fallback to 7 days ago
      return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    }
  }

  /**
   * Process credits for a specific time range (manual trigger)
   */
  static async processCreditsForRange(
    deviceId: string,
    startTime: Date,
    endTime: Date
  ): Promise<any> {
    console.log(`Manually processing credits for device ${deviceId} from ${startTime.toISOString()} to ${endTime.toISOString()}`);
    
    return await CarbonCreditEngine.processCreditsForPeriod(
      deviceId,
      startTime,
      endTime
    );
  }

  /**
   * Get processing status
   */
  static getStatus() {
    return {
      isRunning: this.intervalId !== null,
      isProcessing: this.isProcessing,
      intervalId: this.intervalId,
    };
  }
}

// Auto-start the processor in production
if (process.env.NODE_ENV === 'production') {
  ScheduledCreditProcessor.start(60); // Process every hour
}
