/**
 * Carbon Credit Engine
 * Handles credit calculation, deduplication, and minting for sequester devices
 */

import {
  db,
  userCarbonCredits,
  userCreditHistory,
  deviceData,
  iotDevices,
  carbonCreditTransactions,
} from '../db';
import { eq, desc, and, gte, lte } from 'drizzle-orm';
import { RedisService } from '../redis';

export interface CreditCalculationConfig {
  // CO2 reduction thresholds (in grams)
  co2Threshold: number; // Minimum CO2 reduction to earn 1 credit
  energyThreshold: number; // Minimum energy saved to earn 1 credit
  
  // Time-based settings
  creditIntervalHours: number; // Hours between credit calculations
  maxCreditsPerDay: number; // Maximum credits per device per day
  
  // Environmental impact multipliers
  temperatureMultiplier: number; // Temperature impact multiplier
  humidityMultiplier: number; // Humidity impact multiplier
  
  // Verification settings
  requireVerification: boolean; // Require data verification before minting
  minDataPoints: number; // Minimum data points for credit calculation
}

export interface CreditCalculationResult {
  creditsEarned: number;
  co2Reduced: number;
  energySaved: number;
  temperatureImpact: number;
  humidityImpact: number;
  dataPointsUsed: number;
  timeRange: {
    start: Date;
    end: Date;
  };
  canMint: boolean;
  reason?: string;
}

export interface MintingStatus {
  totalCredits: number;
  mintedCredits: number;
  pendingCredits: number;
  availableToMint: number;
  lastMintTime?: Date;
  nextMintTime?: Date;
}

export class CarbonCreditEngine {
  private static readonly DEFAULT_CONFIG: CreditCalculationConfig = {
    co2Threshold: 1000, // 1kg CO2 = 1 credit
    energyThreshold: 100, // 100kWh = 1 credit
    creditIntervalHours: 24, // Calculate credits every 24 hours
    maxCreditsPerDay: 100, // Max 100 credits per device per day
    temperatureMultiplier: 0.1,
    humidityMultiplier: 0.05,
    requireVerification: true,
    minDataPoints: 10, // Need at least 10 data points
  };

  /**
   * Calculate credits for a sequester device based on time range
   */
  static async calculateCredits(
    deviceId: string,
    startTime: Date,
    endTime: Date,
    config: Partial<CreditCalculationConfig> = {}
  ): Promise<CreditCalculationResult> {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };

    try {
      // Get device information
      const device = await db
        .select()
        .from(iotDevices)
        .where(eq(iotDevices.deviceId, deviceId))
        .limit(1);

      if (device.length === 0) {
        throw new Error(`Device ${deviceId} not found`);
      }

      // All devices are now sequester devices

      // Get data points in time range
      const dataPoints = await db
        .select()
        .from(deviceData)
        .where(
          and(
            eq(deviceData.deviceId, deviceId),
            gte(deviceData.timestamp, startTime),
            lte(deviceData.timestamp, endTime)
          )
        )
        .orderBy(deviceData.timestamp);

      // Check minimum data points requirement
      if (dataPoints.length < finalConfig.minDataPoints) {
        return {
          creditsEarned: 0,
          co2Reduced: 0,
          energySaved: 0,
          temperatureImpact: 0,
          humidityImpact: 0,
          dataPointsUsed: dataPoints.length,
          timeRange: { start: startTime, end: endTime },
          canMint: false,
          reason: `Insufficient data points: ${dataPoints.length}/${finalConfig.minDataPoints}`,
        };
      }

      // Calculate aggregated values
      const aggregated = this.aggregateDataPoints(dataPoints);

      // Calculate credits based on thresholds
      const co2Credits = Math.floor(aggregated.co2Reduced / finalConfig.co2Threshold);
      const energyCredits = Math.floor(aggregated.energySaved / finalConfig.energyThreshold);
      
      // Calculate environmental impact credits
      const temperatureCredits = Math.floor(
        aggregated.temperatureImpact * finalConfig.temperatureMultiplier
      );
      const humidityCredits = Math.floor(
        aggregated.humidityImpact * finalConfig.humidityMultiplier
      );

      // Total credits earned
      const totalCredits = co2Credits + energyCredits + temperatureCredits + humidityCredits;

      // Apply daily limit
      const creditsEarned = Math.min(totalCredits, finalConfig.maxCreditsPerDay);

      // Check if we can mint (has enough credits and meets requirements)
      const canMint = creditsEarned > 0 && 
        (!finalConfig.requireVerification || aggregated.verifiedDataPoints >= dataPoints.length * 0.8);

      return {
        creditsEarned,
        co2Reduced: aggregated.co2Reduced,
        energySaved: aggregated.energySaved,
        temperatureImpact: aggregated.temperatureImpact,
        humidityImpact: aggregated.humidityImpact,
        dataPointsUsed: dataPoints.length,
        timeRange: { start: startTime, end: endTime },
        canMint,
        reason: canMint ? undefined : 'Insufficient credits or verification requirements not met',
      };
    } catch (error) {
      console.error('Error calculating credits:', error);
      throw error;
    }
  }

  /**
   * Check if credits have already been calculated for a time period
   */
  static async hasCreditsBeenCalculated(
    deviceId: string,
    startTime: Date,
    endTime: Date
  ): Promise<boolean> {
    try {
      const existingHistory = await db
        .select()
        .from(userCreditHistory)
        .where(
          and(
            eq(userCreditHistory.sourceId, deviceId),
            eq(userCreditHistory.source, 'IOT_DEVICE'),
            gte(userCreditHistory.createdAt, startTime),
            lte(userCreditHistory.createdAt, endTime)
          )
        )
        .limit(1);

      return existingHistory.length > 0;
    } catch (error) {
      console.error('Error checking credit calculation:', error);
      return false;
    }
  }

  /**
   * Process credits for a device over a time period
   */
  static async processCreditsForPeriod(
    deviceId: string,
    startTime: Date,
    endTime: Date,
    config: Partial<CreditCalculationConfig> = {}
  ): Promise<CreditCalculationResult> {
    try {
      // Check if credits already calculated for this period
      const alreadyCalculated = await this.hasCreditsBeenCalculated(deviceId, startTime, endTime);
      
      if (alreadyCalculated) {
        return {
          creditsEarned: 0,
          co2Reduced: 0,
          energySaved: 0,
          temperatureImpact: 0,
          humidityImpact: 0,
          dataPointsUsed: 0,
          timeRange: { start: startTime, end: endTime },
          canMint: false,
          reason: 'Credits already calculated for this period',
        };
      }

      // Calculate credits
      const result = await this.calculateCredits(deviceId, startTime, endTime, config);

      if (result.canMint && result.creditsEarned > 0) {
        // Get device owner
        const device = await db
          .select()
          .from(iotDevices)
          .where(eq(iotDevices.deviceId, deviceId))
          .limit(1);

        if (device.length > 0) {
          const walletAddress = device[0].walletAddress;

          // Update user credits
          await this.updateUserCredits(walletAddress, result);

          // Add to credit history
          await this.addCreditHistory(walletAddress, result, deviceId);

          // Update Redis cache
          await this.updateRedisCache(walletAddress, result, deviceId);
        }
      }

      return result;
    } catch (error) {
      console.error('Error processing credits:', error);
      throw error;
    }
  }

  /**
   * Get minting status for a device
   */
  static async getMintingStatus(deviceId: string): Promise<MintingStatus> {
    try {
      // Get device owner
      const device = await db
        .select()
        .from(iotDevices)
        .where(eq(iotDevices.deviceId, deviceId))
        .limit(1);

      if (device.length === 0) {
        throw new Error(`Device ${deviceId} not found`);
      }

      const walletAddress = device[0].walletAddress;

      // Get current user credits
      const userCredits = await db
        .select()
        .from(userCarbonCredits)
        .where(eq(userCarbonCredits.walletAddress, walletAddress))
        .orderBy(desc(userCarbonCredits.updatedAt))
        .limit(1);

      const currentCredits = userCredits[0] || {
        credits: '0',
        co2Reduced: '0',
        energySaved: '0',
        temperatureImpact: '0',
        humidityImpact: '0',
        isOnline: false,
        timestamp: new Date(),
      };

      // Get pending mint requests
      const pendingMints = await db
        .select()
        .from(carbonCreditTransactions)
        .where(
          and(
            eq(carbonCreditTransactions.deviceId, deviceId),
            eq(carbonCreditTransactions.transactionType, 'MINT'),
            eq(carbonCreditTransactions.status, 'PENDING')
          )
        );

      const pendingCredits = pendingMints.reduce(
        (sum, tx) => sum + parseFloat(tx.amount),
        0
      );

      // Get last mint time
      const lastMint = await db
        .select()
        .from(carbonCreditTransactions)
        .where(
          and(
            eq(carbonCreditTransactions.deviceId, deviceId),
            eq(carbonCreditTransactions.transactionType, 'MINT'),
            eq(carbonCreditTransactions.status, 'CONFIRMED')
          )
        )
        .orderBy(desc(carbonCreditTransactions.createdAt))
        .limit(1);

      const lastMintTime = lastMint[0]?.createdAt;
      const nextMintTime = lastMintTime 
        ? new Date(lastMintTime.getTime() + 24 * 60 * 60 * 1000) // 24 hours later
        : new Date();

      return {
        totalCredits: parseFloat(currentCredits.credits),
        mintedCredits: parseFloat(currentCredits.credits) - pendingCredits,
        pendingCredits,
        availableToMint: parseFloat(currentCredits.credits),
        lastMintTime,
        nextMintTime,
      };
    } catch (error) {
      console.error('Error getting minting status:', error);
      throw error;
    }
  }

  /**
   * Create mint request for credits
   */
  static async createMintRequest(
    deviceId: string,
    amount: number,
    dataHash: string
  ): Promise<string> {
    try {
      // Create transaction record
      const transaction = await db.insert(carbonCreditTransactions).values({
        deviceId,
        transactionType: 'MINT',
        amount: amount.toString(),
        status: 'PENDING',
        data: {
          dataHash,
          timestamp: new Date().toISOString(),
        },
      }).returning({ id: carbonCreditTransactions.id });

      return transaction[0].id;
    } catch (error) {
      console.error('Error creating mint request:', error);
      throw error;
    }
  }

  /**
   * Aggregate data points for credit calculation
   */
  private static aggregateDataPoints(dataPoints: any[]) {
    let co2Reduced = 0;
    let energySaved = 0;
    let temperatureImpact = 0;
    let humidityImpact = 0;
    let verifiedDataPoints = 0;

    for (const point of dataPoints) {
      co2Reduced += parseFloat(point.co2Value);
      energySaved += parseFloat(point.energyValue);
      temperatureImpact += parseFloat(point.temperature);
      humidityImpact += parseFloat(point.humidity);
      
      if (point.verified) {
        verifiedDataPoints++;
      }
    }

    return {
      co2Reduced,
      energySaved,
      temperatureImpact,
      humidityImpact,
      verifiedDataPoints,
    };
  }

  /**
   * Update user credits in database
   */
  private static async updateUserCredits(
    walletAddress: string,
    result: CreditCalculationResult
  ): Promise<void> {
    // Get current credits
    const currentCredits = await db
      .select()
      .from(userCarbonCredits)
      .where(eq(userCarbonCredits.walletAddress, walletAddress))
      .orderBy(desc(userCarbonCredits.updatedAt))
      .limit(1);

    const currentData = currentCredits[0] || {
      credits: '0',
      co2Reduced: '0',
      energySaved: '0',
      temperatureImpact: '0',
      humidityImpact: '0',
      isOnline: false,
    };

    // Calculate new totals
    const newCredits = parseFloat(currentData.credits) + result.creditsEarned;
    const newCo2Reduced = parseFloat(currentData.co2Reduced) + result.co2Reduced;
    const newEnergySaved = parseFloat(currentData.energySaved) + result.energySaved;
    const newTemperatureImpact = parseFloat(currentData.temperatureImpact) + result.temperatureImpact;
    const newHumidityImpact = parseFloat(currentData.humidityImpact) + result.humidityImpact;

    // Insert new credit record
    await db.insert(userCarbonCredits).values({
      walletAddress,
      credits: newCredits.toString(),
      co2Reduced: newCo2Reduced.toString(),
      energySaved: newEnergySaved.toString(),
      temperatureImpact: newTemperatureImpact.toString(),
      humidityImpact: newHumidityImpact.toString(),
      isOnline: true,
    });
  }

  /**
   * Add credit history entry
   */
  private static async addCreditHistory(
    walletAddress: string,
    result: CreditCalculationResult,
    deviceId: string
  ): Promise<void> {
    await db.insert(userCreditHistory).values({
      walletAddress,
      creditsEarned: result.creditsEarned.toString(),
      co2Reduced: result.co2Reduced.toString(),
      energySaved: result.energySaved.toString(),
      temperatureImpact: result.temperatureImpact.toString(),
      humidityImpact: result.humidityImpact.toString(),
      source: 'IOT_DEVICE',
      sourceId: deviceId,
      metadata: {
        deviceId,
        timeRange: result.timeRange,
        dataPointsUsed: result.dataPointsUsed,
      },
    });
  }

  /**
   * Update Redis cache
   */
  private static async updateRedisCache(
    walletAddress: string,
    result: CreditCalculationResult,
    deviceId: string
  ): Promise<void> {
    // Get current totals from database
    const currentCredits = await db
      .select()
      .from(userCarbonCredits)
      .where(eq(userCarbonCredits.walletAddress, walletAddress))
      .orderBy(desc(userCarbonCredits.updatedAt))
      .limit(1);

    if (currentCredits.length > 0) {
      const creditsData = currentCredits[0];
      const cacheData = {
        credits: parseFloat(creditsData.credits),
        co2Reduced: parseFloat(creditsData.co2Reduced),
        energySaved: parseFloat(creditsData.energySaved),
        temperatureImpact: parseFloat(creditsData.temperatureImpact),
        humidityImpact: parseFloat(creditsData.humidityImpact),
        isOnline: creditsData.isOnline,
        timestamp: creditsData.timestamp.toISOString(),
      };

      await RedisService.cacheUserCredits(walletAddress, cacheData);
      await RedisService.updateLeaderboard(walletAddress, cacheData.credits);
    }

    // Add to Redis history
    await RedisService.addCreditHistory(walletAddress, {
      creditsEarned: result.creditsEarned,
      co2Reduced: result.co2Reduced,
      energySaved: result.energySaved,
      temperatureImpact: result.temperatureImpact,
      humidityImpact: result.humidityImpact,
      source: 'IOT_DEVICE',
      sourceId: deviceId,
      timestamp: result.timeRange.end.toISOString(),
    });

    // Invalidate dashboard cache
    await RedisService.invalidateUserCache(walletAddress);
  }
}
