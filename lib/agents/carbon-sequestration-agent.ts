/**
 * Carbon Sequestration Agent
 * Monitors IoT devices and generates carbon credits based on environmental data
 */

import { BaseAgent, AgentConfig, AgentType, AgentCapability } from './base-agent';
import { A2AMessage, MessageType, CreditOfferMessage } from './a2a-protocol';
import { db } from '@/lib/db';
import { iotDevices, deviceData, userCarbonCredits } from '@/lib/db/schema';
import { eq, and, gte } from 'drizzle-orm';

export interface SequestrationAgentConfig extends AgentConfig {
  monitoredDevices: string[];
  creditGenerationThresholds: {
    co2Reduction: number;
    energyGeneration: number;
    timeWindow: number; // in seconds
  };
  creditPricing: {
    basePrice: number; // HBAR per credit
    priceVariation: number; // percentage variation
  };
}

export class CarbonSequestrationAgent extends BaseAgent {
  private config: SequestrationAgentConfig;
  private deviceDataCache: Map<string, any[]> = new Map();
  
  constructor(config: SequestrationAgentConfig) {
    super(config);
    this.config = config;
  }
  
  protected setupMessageHandlers(): void {
    this.messageHandlers.set(MessageType.CREDIT_REQUEST, this.handleCreditRequest.bind(this));
    this.messageHandlers.set(MessageType.PRICE_NEGOTIATION, this.handlePriceNegotiation.bind(this));
    this.messageHandlers.set(MessageType.TRANSACTION_PROPOSAL, this.handleTransactionProposal.bind(this));
    this.messageHandlers.set(MessageType.SENSOR_DATA, this.handleSensorData.bind(this));
  }
  
  /**
   * Initialize the sequestration agent
   */
  async initialize(): Promise<void> {
    await super.initialize();
    
    // Start monitoring IoT devices
    this.startDeviceMonitoring();
    
    // Start credit generation process
    this.startCreditGeneration();
    
    console.log(`Carbon Sequestration Agent ${this.config.name} initialized`);
  }
  
  /**
   * Start monitoring IoT devices for data
   */
  private startDeviceMonitoring(): void {
    setInterval(async () => {
      try {
        await this.processDeviceData();
      } catch (error) {
        console.error('Error monitoring devices:', error);
      }
    }, 30000); // Check every 30 seconds
  }
  
  /**
   * Process data from monitored devices
   */
  private async processDeviceData(): Promise<void> {
    for (const deviceId of this.config.monitoredDevices) {
      try {
        // Get recent device data
        const recentData = await db
          .select()
          .from(deviceData)
          .where(
            and(
              eq(deviceData.deviceId, deviceId),
              gte(deviceData.timestamp, new Date(Date.now() - this.config.creditGenerationThresholds.timeWindow * 1000))
            )
          )
          .orderBy(deviceData.timestamp);
        
        if (recentData.length > 0) {
          await this.analyzeDeviceData(deviceId, recentData);
        }
      } catch (error) {
        console.error(`Error processing data for device ${deviceId}:`, error);
      }
    }
  }
  
  /**
   * Analyze device data to determine credit generation
   */
  private async analyzeDeviceData(deviceId: string, data: any[]): Promise<void> {
    const totals = data.reduce((acc, record) => ({
      co2Reduction: acc.co2Reduction + parseFloat(record.co2Value || 0),
      energyGeneration: acc.energyGeneration + parseFloat(record.energyValue || 0),
    }), { co2Reduction: 0, energyGeneration: 0 });
    
    const thresholds = this.config.creditGenerationThresholds;
    
    // Check if thresholds are met for credit generation
    if (totals.co2Reduction >= thresholds.co2Reduction || 
        totals.energyGeneration >= thresholds.energyGeneration) {
      
      const creditsToGenerate = this.calculateCreditsToGenerate(totals);
      
      if (creditsToGenerate > 0) {
        await this.generateCarbonCredits(deviceId, creditsToGenerate, totals);
      }
    }
  }
  
  /**
   * Calculate how many credits to generate based on data
   */
  private calculateCreditsToGenerate(totals: { co2Reduction: number; energyGeneration: number }): number {
    const co2Credits = Math.floor(totals.co2Reduction / this.config.creditGenerationThresholds.co2Reduction);
    const energyCredits = Math.floor(totals.energyGeneration / this.config.creditGenerationThresholds.energyGeneration);
    
    return Math.max(co2Credits, energyCredits);
  }
  
  /**
   * Generate carbon credits and update database
   */
  private async generateCarbonCredits(
    deviceId: string,
    credits: number,
    data: { co2Reduction: number; energyGeneration: number }
  ): Promise<void> {
    try {
      // Get device information
      const device = await db
        .select()
        .from(iotDevices)
        .where(eq(iotDevices.deviceId, deviceId))
        .limit(1);
      
      if (device.length === 0) {
        console.error(`Device ${deviceId} not found`);
        return;
      }
      
      const deviceInfo = device[0];
      
      // Update user carbon credits
      await db
        .insert(userCarbonCredits)
        .values({
          userId: deviceInfo.applicationId, // Using applicationId as userId for now
          credits: credits.toString(),
          co2Reduced: data.co2Reduction.toString(),
          energySaved: data.energyGeneration.toString(),
          temperatureImpact: '0',
          humidityImpact: '0',
          isOnline: true,
          timestamp: new Date(),
        });
      
      // Update agent state
      this.state.credits += credits;
      
      console.log(`Generated ${credits} carbon credits for device ${deviceId}`);
      
      // Broadcast credit availability
      await this.broadcastCreditAvailability(credits, deviceId);
      
    } catch (error) {
      console.error(`Error generating carbon credits:`, error);
    }
  }
  
  /**
   * Broadcast credit availability to other agents
   */
  private async broadcastCreditAvailability(credits: number, deviceId: string): Promise<void> {
    const offer: CreditOfferMessage = {
      creditAmount: credits,
      pricePerCredit: this.calculateCurrentPrice(),
      sellerAgentId: this.config.id,
      creditType: 'SEQUESTER',
      expirationTime: Date.now() + 3600000, // 1 hour
      metadata: {
        source: deviceId,
        verificationData: {
          deviceId,
          timestamp: Date.now(),
        },
        quality: 'HIGH',
      },
    };
    
    await this.broadcastMessage(MessageType.CREDIT_OFFER, offer);
  }
  
  /**
   * Calculate current price based on market conditions
   */
  private calculateCurrentPrice(): number {
    const basePrice = this.config.creditPricing.basePrice;
    const variation = this.config.creditPricing.priceVariation;
    
    // Add some randomness to simulate market fluctuations
    const randomVariation = (Math.random() - 0.5) * variation;
    return basePrice * (1 + randomVariation / 100);
  }
  
  /**
   * Handle credit request messages
   */
  private async handleCreditRequest(message: A2AMessage): Promise<void> {
    const request = message.payload;
    
    console.log(`Received credit request from ${message.from}:`, request);
    
    // Check if we have enough credits
    if (this.state.credits < request.creditAmount) {
      await this.sendMessage(message.from, MessageType.TRANSACTION_REJECT, {
        reason: 'Insufficient credits available',
        availableCredits: this.state.credits,
      });
      return;
    }
    
    // Check if price is acceptable
    const ourPrice = this.calculateCurrentPrice();
    if (ourPrice > request.maxPricePerCredit) {
      await this.sendMessage(message.from, MessageType.PRICE_NEGOTIATION, {
        proposedPrice: ourPrice,
        reasoning: `Current market price is ${ourPrice} HBAR per credit`,
        marketData: {
          averagePrice: ourPrice,
          recentTransactions: [],
        },
      });
      return;
    }
    
    // Accept the request
    const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await this.sendMessage(message.from, MessageType.TRANSACTION_PROPOSAL, {
      transactionId,
      creditAmount: request.creditAmount,
      pricePerCredit: ourPrice,
      totalAmount: request.creditAmount * ourPrice,
      sellerAgentId: this.config.id,
      buyerAgentId: request.buyerAgentId,
      smartContractAddress: '0x...', // Would be actual contract address
      requiresHumanApproval: this.config.settings.humanApprovalRequired,
      expirationTime: Date.now() + 300000, // 5 minutes
    });
  }
  
  /**
   * Handle price negotiation messages
   */
  private async handlePriceNegotiation(message: A2AMessage): Promise<void> {
    const negotiation = message.payload;
    
    console.log(`Received price negotiation from ${message.from}:`, negotiation);
    
    // Simple negotiation logic
    const ourPrice = this.calculateCurrentPrice();
    const proposedPrice = negotiation.proposedPrice;
    
    // Accept if within 10% of our price
    if (Math.abs(proposedPrice - ourPrice) / ourPrice <= 0.1) {
      await this.sendMessage(message.from, MessageType.TRANSACTION_ACCEPT, {
        acceptedPrice: proposedPrice,
        transactionId: negotiation.transactionId,
      });
    } else {
      await this.sendMessage(message.from, MessageType.PRICE_NEGOTIATION, {
        proposedPrice: ourPrice,
        counterOffer: ourPrice,
        reasoning: `Our minimum price is ${ourPrice} HBAR per credit`,
        marketData: negotiation.marketData,
      });
    }
  }
  
  /**
   * Handle transaction proposal messages
   */
  private async handleTransactionProposal(message: A2AMessage): Promise<void> {
    const proposal = message.payload;
    
    console.log(`Received transaction proposal from ${message.from}:`, proposal);
    
    // Execute the transaction
    const success = await this.executeTransaction(
      proposal.transactionId,
      proposal.totalAmount,
      proposal.buyerAgentId,
      `Sell ${proposal.creditAmount} carbon credits`
    );
    
    if (success) {
      // Update credits
      this.state.credits -= proposal.creditAmount;
      
      await this.sendMessage(message.from, MessageType.TRANSACTION_ACCEPT, {
        transactionId: proposal.transactionId,
        confirmation: 'Transaction executed successfully',
      });
    } else {
      await this.sendMessage(message.from, MessageType.TRANSACTION_REJECT, {
        transactionId: proposal.transactionId,
        reason: 'Transaction execution failed',
      });
    }
  }
  
  /**
   * Handle sensor data messages
   */
  private async handleSensorData(message: A2AMessage): Promise<void> {
    const sensorData = message.payload;
    
    console.log(`Received sensor data from ${message.from}:`, sensorData);
    
    // Process the sensor data
    await this.processSensorData(sensorData);
  }
  
  /**
   * Process incoming sensor data
   */
  private async processSensorData(data: any): Promise<void> {
    // Store in cache for analysis
    const deviceId = data.deviceId;
    if (!this.deviceDataCache.has(deviceId)) {
      this.deviceDataCache.set(deviceId, []);
    }
    
    this.deviceDataCache.get(deviceId)!.push(data);
    
    // Keep only recent data (last hour)
    const cutoff = Date.now() - 3600000;
    this.deviceDataCache.set(
      deviceId,
      this.deviceDataCache.get(deviceId)!.filter(d => d.timestamp > cutoff)
    );
  }
  
  /**
   * Start credit generation process
   */
  private startCreditGeneration(): void {
    setInterval(async () => {
      try {
        // Process cached data for credit generation
        for (const [deviceId, data] of this.deviceDataCache) {
          if (data.length > 0) {
            await this.analyzeDeviceData(deviceId, data);
          }
        }
      } catch (error) {
        console.error('Error in credit generation process:', error);
      }
    }, 60000); // Check every minute
  }
  
  /**
   * Get agent statistics
   */
  getStatistics(): any {
    return {
      agentId: this.config.id,
      credits: this.state.credits,
      monitoredDevices: this.config.monitoredDevices.length,
      activeTransactions: this.state.activeTransactions.length,
      performance: this.state.performance,
      deviceDataCache: Array.from(this.deviceDataCache.entries()).map(([deviceId, data]) => ({
        deviceId,
        dataPoints: data.length,
        latestTimestamp: data.length > 0 ? Math.max(...data.map(d => d.timestamp)) : null,
      })),
    };
  }
}
