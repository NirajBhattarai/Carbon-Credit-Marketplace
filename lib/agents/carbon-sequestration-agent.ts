/**
 * Carbon Sequestration Agent
 * Generates carbon credits from IoT data and manages credit offers
 */

import {
  BaseAgent,
  AgentConfig,
  AgentCapability,
  A2AMessage,
  MessageType,
} from './base-agent';

export interface SequestrationAgentConfig extends AgentConfig {
  agentType: 'CARBON_SEQUESTER';
  capabilities: [
    AgentCapability.GENERATE_CREDITS,
    AgentCapability.PRICE_DISCOVERY,
    AgentCapability.RISK_MANAGEMENT,
  ];
  sequestrationSettings: {
    projectName: string;
    location: string;
    creditGenerationRate: number; // credits per hour
    basePricePerCredit: number; // HBAR per credit
    maxCreditsPerOffer: number;
    minCreditsPerOffer: number;
    qualityThreshold: number; // 0-100
  };
}

export interface IoTData {
  deviceId: string;
  co2Reduced: number;
  energySaved: number;
  temperature: number;
  humidity: number;
  timestamp: number;
}

export class CarbonSequestrationAgent extends BaseAgent {
  private config: SequestrationAgentConfig;
  private creditGenerationInterval: NodeJS.Timeout | null = null;
  private pendingOffers: Map<string, any> = new Map();

  constructor(config: SequestrationAgentConfig) {
    super(config);
    this.config = config;
    this.setupMessageHandlers();
  }

  /**
   * Initialize the agent
   */
  async initialize(): Promise<void> {
    console.log(
      `🌱 Initializing Carbon Sequestration Agent: ${this.config.name}`
    );

    // Start credit generation
    this.startCreditGeneration();

    // Start heartbeat
    this.startHeartbeat();

    this.isRunning = true;
    this.updateActivity();

    console.log(
      `✅ Carbon Sequestration Agent initialized: ${this.config.name}`
    );
  }

  /**
   * Shutdown the agent
   */
  async shutdown(): Promise<void> {
    console.log(`🛑 ${this.config.name}: Shutting down...`);

    if (this.creditGenerationInterval) {
      clearInterval(this.creditGenerationInterval);
    }

    this.isRunning = false;
    this.state.isOnline = false;

    console.log(`✅ ${this.config.name}: Shutdown complete`);
  }

  /**
   * Setup message handlers
   */
  private setupMessageHandlers(): void {
    this.messageHandlers.set(
      MessageType.CREDIT_REQUEST,
      this.handleCreditRequest.bind(this)
    );
    this.messageHandlers.set(
      MessageType.PRICE_NEGOTIATION,
      this.handlePriceNegotiation.bind(this)
    );
    this.messageHandlers.set(
      MessageType.TRANSACTION_PROPOSAL,
      this.handleTransactionProposal.bind(this)
    );
    this.messageHandlers.set(
      MessageType.TRANSACTION_ACCEPT,
      this.handleTransactionAccept.bind(this)
    );
    this.messageHandlers.set(
      MessageType.TRANSACTION_REJECT,
      this.handleTransactionReject.bind(this)
    );
    this.messageHandlers.set(
      MessageType.HEARTBEAT,
      this.handleHeartbeat.bind(this)
    );
  }

  /**
   * Start credit generation simulation
   */
  private startCreditGeneration(): void {
    this.creditGenerationInterval = setInterval(() => {
      this.generateCredits();
    }, 5000); // Generate credits every 5 seconds
  }

  /**
   * Generate credits from simulated IoT data
   */
  private generateCredits(): void {
    // Simulate IoT data
    const iotData: IoTData = {
      deviceId: this.config.id,
      co2Reduced: 85.5, // Hardcoded for testing
      energySaved: 42.3,
      temperature: 24.8,
      humidity: 65.2,
      timestamp: Date.now(),
    };

    // Calculate credits based on environmental impact
    const creditsGenerated = this.calculateCreditsFromIoTData(iotData);

    if (creditsGenerated > 0) {
      this.state.credits += creditsGenerated;
      this.state.performance.totalCreditsGenerated += creditsGenerated;
      this.updateActivity();

      console.log(
        `🌱 ${this.config.name}: Generated ${creditsGenerated} credits (Total: ${this.state.credits})`
      );

      // Broadcast credit offer if we have enough credits
      if (
        this.state.credits >=
        this.config.sequestrationSettings.minCreditsPerOffer
      ) {
        this.broadcastCreditOffer();
      }
    }
  }

  /**
   * Calculate credits from IoT data
   */
  private calculateCreditsFromIoTData(data: IoTData): number {
    const co2Factor = data.co2Reduced / 100; // 100 CO2 units = 1 credit
    const energyFactor = data.energySaved / 50; // 50 energy units = 1 credit
    const environmentalFactor = (data.temperature + data.humidity) / 100;

    const baseCredits = (co2Factor + energyFactor) * environmentalFactor;
    return Math.floor(baseCredits * 10) / 10;
  }

  /**
   * Broadcast credit offer
   */
  private async broadcastCreditOffer(): Promise<void> {
    const offerAmount = Math.min(
      this.state.credits,
      this.config.sequestrationSettings.maxCreditsPerOffer
    );

    const message = {
      from: this.config.id,
      to: 'broadcast',
      type: MessageType.CREDIT_OFFER,
      payload: {
        creditAmount: offerAmount,
        pricePerCredit: this.config.sequestrationSettings.basePricePerCredit,
        totalPrice:
          offerAmount * this.config.sequestrationSettings.basePricePerCredit,
        sellerAgentId: this.config.id,
        sellerName: this.config.name,
        projectName: this.config.sequestrationSettings.projectName,
        location: this.config.sequestrationSettings.location,
        quality: this.getCreditQuality(),
        expirationTime: Date.now() + 300000, // 5 minutes
      },
    };

    await this.sendMessage(message);
    console.log(
      `📢 ${this.config.name}: Broadcasting credit offer - ${offerAmount} credits @ ${this.config.sequestrationSettings.basePricePerCredit} HBAR each`
    );
  }

  /**
   * Handle credit request
   */
  private async handleCreditRequest(message: A2AMessage): Promise<void> {
    const request = message.payload;
    console.log(
      `📨 ${this.config.name}: Received credit request from ${message.from}`
    );

    // Check availability
    if (this.state.credits < request.creditAmount) {
      await this.sendMessage({
        from: this.config.id,
        to: message.from,
        type: MessageType.TRANSACTION_REJECT,
        payload: {
          reason: 'Insufficient credits available',
          availableCredits: this.state.credits,
          requestedCredits: request.creditAmount,
        },
      });
      return;
    }

    // Check price
    if (
      this.config.sequestrationSettings.basePricePerCredit >
      request.maxPricePerCredit
    ) {
      await this.sendMessage({
        from: this.config.id,
        to: message.from,
        type: MessageType.PRICE_NEGOTIATION,
        payload: {
          proposedPrice: this.config.sequestrationSettings.basePricePerCredit,
          reasoning: 'Price exceeds maximum acceptable price',
        },
      });
      return;
    }

    // Accept request
    const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await this.sendMessage({
      from: this.config.id,
      to: message.from,
      type: MessageType.TRANSACTION_PROPOSAL,
      payload: {
        transactionId,
        creditAmount: request.creditAmount,
        pricePerCredit: this.config.sequestrationSettings.basePricePerCredit,
        totalAmount:
          request.creditAmount *
          this.config.sequestrationSettings.basePricePerCredit,
        sellerAgentId: this.config.id,
        buyerAgentId: request.buyerAgentId,
        expirationTime: Date.now() + 300000,
      },
    });

    console.log(
      `✅ ${this.config.name}: Sent transaction proposal for ${request.creditAmount} credits`
    );
  }

  /**
   * Handle price negotiation
   */
  private async handlePriceNegotiation(message: A2AMessage): Promise<void> {
    const negotiation = message.payload;
    console.log(
      `💰 ${this.config.name}: Received price negotiation from ${message.from}`
    );

    const priceDifference = Math.abs(
      negotiation.proposedPrice -
        this.config.sequestrationSettings.basePricePerCredit
    );
    const priceThreshold =
      this.config.sequestrationSettings.basePricePerCredit * 0.1;

    if (priceDifference <= priceThreshold) {
      this.config.sequestrationSettings.basePricePerCredit =
        negotiation.proposedPrice;

      await this.sendMessage({
        from: this.config.id,
        to: message.from,
        type: MessageType.PRICE_NEGOTIATION,
        payload: {
          proposedPrice: this.config.sequestrationSettings.basePricePerCredit,
          accepted: true,
          reasoning: 'Price negotiation accepted',
        },
      });

      console.log(
        `✅ ${this.config.name}: Accepted negotiated price: ${this.config.sequestrationSettings.basePricePerCredit} HBAR`
      );
    } else {
      await this.sendMessage({
        from: this.config.id,
        to: message.from,
        type: MessageType.PRICE_NEGOTIATION,
        payload: {
          proposedPrice: this.config.sequestrationSettings.basePricePerCredit,
          accepted: false,
          reasoning: 'Price difference too large',
        },
      });

      console.log(`❌ ${this.config.name}: Rejected price negotiation`);
    }
  }

  /**
   * Handle transaction proposal
   */
  private async handleTransactionProposal(message: A2AMessage): Promise<void> {
    const proposal = message.payload;
    console.log(
      `📋 ${this.config.name}: Received transaction proposal from ${message.from}`
    );

    if (proposal.creditAmount > this.state.credits) {
      await this.sendMessage({
        from: this.config.id,
        to: message.from,
        type: MessageType.TRANSACTION_REJECT,
        payload: {
          transactionId: proposal.transactionId,
          reason: 'Insufficient credits available',
        },
      });
      return;
    }

    await this.sendMessage({
      from: this.config.id,
      to: message.from,
      type: MessageType.TRANSACTION_ACCEPT,
      payload: {
        transactionId: proposal.transactionId,
        confirmation: 'Transaction accepted',
      },
    });

    console.log(
      `✅ ${this.config.name}: Accepted transaction ${proposal.transactionId}`
    );
  }

  /**
   * Handle transaction accept
   */
  private async handleTransactionAccept(message: A2AMessage): Promise<void> {
    const accept = message.payload;
    console.log(
      `✅ ${this.config.name}: Transaction ${accept.transactionId} accepted by buyer`
    );

    this.state.totalTransactions++;
    this.state.performance.totalCreditsTraded += accept.creditAmount || 0;
    this.state.performance.totalRevenue += accept.totalAmount || 0;

    console.log(
      `🎉 ${this.config.name}: Transaction completed! Total transactions: ${this.state.totalTransactions}`
    );
  }

  /**
   * Handle transaction reject
   */
  private async handleTransactionReject(message: A2AMessage): Promise<void> {
    const reject = message.payload;
    console.log(
      `❌ ${this.config.name}: Transaction rejected: ${reject.reason}`
    );
  }

  /**
   * Handle heartbeat
   */
  private async handleHeartbeat(message: A2AMessage): Promise<void> {
    console.log(
      `💓 ${this.config.name}: Received heartbeat from ${message.from}`
    );
  }

  /**
   * Start heartbeat
   */
  private startHeartbeat(): void {
    setInterval(() => {
      this.sendMessage({
        from: this.config.id,
        to: 'broadcast',
        type: MessageType.HEARTBEAT,
        payload: {
          agentId: this.config.id,
          status: 'online',
          credits: this.state.credits,
          lastActivity: this.state.lastActivity,
        },
      });
    }, 30000); // Send heartbeat every 30 seconds
  }

  /**
   * Get credit quality
   */
  private getCreditQuality(): 'HIGH' | 'MEDIUM' | 'LOW' {
    if (this.state.credits > 100) return 'HIGH';
    if (this.state.credits > 50) return 'MEDIUM';
    return 'LOW';
  }
}
