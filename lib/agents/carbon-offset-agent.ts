/**
 * Carbon Offset Agent
 * Buys carbon credits to offset emissions from industrial processes
 */

import {
  BaseAgent,
  AgentConfig,
  AgentType,
  AgentCapability,
} from './base-agent';
import {
  A2AMessage,
  MessageType,
  CreditRequestMessage,
  CreditOfferMessage,
} from './a2a-protocol';

export interface OffsetAgentConfig extends AgentConfig {
  emissionSources: string[];
  offsetTargets: {
    monthlyTarget: number; // credits needed per month
    urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  };
  budget: {
    monthlyBudget: number; // HBAR per month
    maxPricePerCredit: number; // HBAR
  };
  creditPreferences: {
    preferredTypes: ('SEQUESTER' | 'EMITTER')[];
    qualityRequirements: 'HIGH' | 'MEDIUM' | 'LOW';
  };
}

export class CarbonOffsetAgent extends BaseAgent {
  private config: OffsetAgentConfig;
  private pendingRequests: Map<string, any> = new Map();
  private emissionTracking: Map<string, number> = new Map();

  constructor(config: OffsetAgentConfig) {
    super(config);
    this.config = config;
  }

  protected setupMessageHandlers(): void {
    this.messageHandlers.set(
      MessageType.CREDIT_OFFER,
      this.handleCreditOffer.bind(this)
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
  }

  /**
   * Initialize the offset agent
   */
  async initialize(): Promise<void> {
    await super.initialize();

    // Start emission monitoring
    this.startEmissionMonitoring();

    // Start credit purchasing process
    this.startCreditPurchasing();

    console.log(`Carbon Offset Agent ${this.config.name} initialized`);
  }

  /**
   * Start monitoring emissions from sources
   */
  private startEmissionMonitoring(): void {
    setInterval(async () => {
      try {
        await this.calculateEmissions();
      } catch (error) {
        console.error('Error monitoring emissions:', error);
      }
    }, 60000); // Check every minute
  }

  /**
   * Calculate current emissions from all sources
   */
  private async calculateEmissions(): Promise<void> {
    for (const source of this.config.emissionSources) {
      // Simulate emission calculation
      const emissions = this.simulateEmissions(source);
      this.emissionTracking.set(source, emissions);

      console.log(`Source ${source} emitting ${emissions} CO2 units`);
    }

    // Check if we need to purchase credits
    await this.checkCreditNeeds();
  }

  /**
   * Simulate emissions from a source (in real implementation, this would connect to actual sensors)
   */
  private simulateEmissions(source: string): number {
    // Simulate varying emission rates
    const baseRate = 100; // CO2 units per minute
    const variation = (Math.random() - 0.5) * 20; // ±10% variation
    return Math.max(0, baseRate + variation);
  }

  /**
   * Check if we need to purchase credits
   */
  private async checkCreditNeeds(): Promise<void> {
    const totalEmissions = Array.from(this.emissionTracking.values()).reduce(
      (sum, emissions) => sum + emissions,
      0
    );
    const creditsNeeded = Math.ceil(totalEmissions / 1000); // 1000 CO2 units = 1 credit

    const currentCredits = this.state.credits;
    const targetCredits = this.config.offsetTargets.monthlyTarget;

    if (currentCredits < targetCredits * 0.8) {
      // Buy when below 80% of target
      console.log(
        `Need to purchase credits. Current: ${currentCredits}, Target: ${targetCredits}`
      );
      await this.requestCreditPurchase(creditsNeeded);
    }
  }

  /**
   * Request credit purchase from available sellers
   */
  private async requestCreditPurchase(creditsNeeded: number): Promise<void> {
    const request: CreditRequestMessage = {
      creditAmount: creditsNeeded,
      maxPricePerCredit: this.config.budget.maxPricePerCredit,
      buyerAgentId: this.config.id,
      creditType:
        this.config.creditPreferences.preferredTypes[0] || 'SEQUESTER',
      urgency: this.config.offsetTargets.urgencyLevel,
      deadline: Date.now() + 300000, // 5 minutes
    };

    console.log(
      `Requesting ${creditsNeeded} credits at max ${this.config.budget.maxPricePerCredit} HBAR each`
    );

    // Broadcast the request
    await this.broadcastMessage(MessageType.CREDIT_REQUEST, request);

    // Store the request for tracking
    this.pendingRequests.set(request.buyerAgentId, request);
  }

  /**
   * Start credit purchasing process
   */
  private startCreditPurchasing(): void {
    setInterval(async () => {
      try {
        // Check for expired requests
        const now = Date.now();
        for (const [requestId, request] of this.pendingRequests) {
          if (now > request.deadline) {
            console.log(`Request ${requestId} expired`);
            this.pendingRequests.delete(requestId);
          }
        }
      } catch (error) {
        console.error('Error in credit purchasing process:', error);
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Handle credit offer messages
   */
  private async handleCreditOffer(message: A2AMessage): Promise<void> {
    const offer = message.payload;

    console.log(`Received credit offer from ${message.from}:`, offer);

    // Check if offer meets our criteria
    if (!this.isOfferAcceptable(offer)) {
      console.log(`Offer from ${message.from} does not meet criteria`);
      return;
    }

    // Check if we have pending requests
    const pendingRequest = Array.from(this.pendingRequests.values()).find(
      req =>
        req.creditAmount <= offer.creditAmount &&
        req.maxPricePerCredit >= offer.pricePerCredit
    );

    if (pendingRequest) {
      // Accept the offer
      await this.sendMessage(message.from, MessageType.TRANSACTION_ACCEPT, {
        creditAmount: Math.min(offer.creditAmount, pendingRequest.creditAmount),
        pricePerCredit: offer.pricePerCredit,
        buyerAgentId: this.config.id,
      });
    }
  }

  /**
   * Check if an offer meets our criteria
   */
  private isOfferAcceptable(offer: CreditOfferMessage): boolean {
    // Check price
    if (offer.pricePerCredit > this.config.budget.maxPricePerCredit) {
      return false;
    }

    // Check credit type
    if (
      !this.config.creditPreferences.preferredTypes.includes(offer.creditType)
    ) {
      return false;
    }

    // Check quality
    if (
      this.config.creditPreferences.qualityRequirements === 'HIGH' &&
      offer.metadata.quality !== 'HIGH'
    ) {
      return false;
    }

    // Check expiration
    if (offer.expirationTime < Date.now()) {
      return false;
    }

    return true;
  }

  /**
   * Handle price negotiation messages
   */
  private async handlePriceNegotiation(message: A2AMessage): Promise<void> {
    const negotiation = message.payload;

    console.log(
      `Received price negotiation from ${message.from}:`,
      negotiation
    );

    // Check if the proposed price is acceptable
    if (negotiation.proposedPrice <= this.config.budget.maxPricePerCredit) {
      await this.sendMessage(message.from, MessageType.TRANSACTION_ACCEPT, {
        acceptedPrice: negotiation.proposedPrice,
        transactionId: negotiation.transactionId,
      });
    } else {
      // Counter offer
      const counterOffer = Math.min(
        this.config.budget.maxPricePerCredit,
        negotiation.proposedPrice * 0.9 // 10% discount
      );

      await this.sendMessage(message.from, MessageType.PRICE_NEGOTIATION, {
        proposedPrice: counterOffer,
        counterOffer: counterOffer,
        reasoning: `Our maximum budget is ${this.config.budget.maxPricePerCredit} HBAR per credit`,
        marketData: negotiation.marketData,
      });
    }
  }

  /**
   * Handle transaction proposal messages
   */
  private async handleTransactionProposal(message: A2AMessage): Promise<void> {
    const proposal = message.payload;

    console.log(
      `Received transaction proposal from ${message.from}:`,
      proposal
    );

    // Check if we can afford this transaction
    if (proposal.totalAmount > this.state.hbarBalance) {
      await this.sendMessage(message.from, MessageType.TRANSACTION_REJECT, {
        transactionId: proposal.transactionId,
        reason: 'Insufficient HBAR balance',
      });
      return;
    }

    // Execute the transaction
    const success = await this.executeTransaction(
      proposal.transactionId,
      proposal.totalAmount,
      proposal.sellerAgentId,
      `Purchase ${proposal.creditAmount} carbon credits`
    );

    if (success) {
      // Update credits
      this.state.credits += proposal.creditAmount;

      await this.sendMessage(message.from, MessageType.TRANSACTION_ACCEPT, {
        transactionId: proposal.transactionId,
        confirmation: 'Transaction executed successfully',
      });

      // Remove from pending requests
      this.pendingRequests.delete(proposal.buyerAgentId);
    } else {
      await this.sendMessage(message.from, MessageType.TRANSACTION_REJECT, {
        transactionId: proposal.transactionId,
        reason: 'Transaction execution failed',
      });
    }
  }

  /**
   * Handle transaction accept messages
   */
  private async handleTransactionAccept(message: A2AMessage): Promise<void> {
    const accept = message.payload;

    console.log(
      `Transaction ${accept.transactionId} accepted by ${message.from}`
    );

    // Update our state
    this.state.performance.successfulTrades++;
  }

  /**
   * Handle transaction reject messages
   */
  private async handleTransactionReject(message: A2AMessage): Promise<void> {
    const reject = message.payload;

    console.log(
      `Transaction ${reject.transactionId} rejected by ${message.from}: ${reject.reason}`
    );

    // Remove from pending requests
    this.pendingRequests.delete(reject.transactionId);
  }

  /**
   * Get agent statistics
   */
  getStatistics(): any {
    return {
      agentId: this.config.id,
      credits: this.state.credits,
      hbarBalance: this.state.hbarBalance,
      emissionSources: this.config.emissionSources.length,
      currentEmissions: Array.from(this.emissionTracking.entries()).map(
        ([source, emissions]) => ({
          source,
          emissions,
        })
      ),
      pendingRequests: this.pendingRequests.size,
      performance: this.state.performance,
      budget: {
        monthlyBudget: this.config.budget.monthlyBudget,
        maxPricePerCredit: this.config.budget.maxPricePerCredit,
        remainingBudget:
          this.config.budget.monthlyBudget - this.state.performance.totalVolume,
      },
    };
  }

  /**
   * Simulate monthly budget refresh
   */
  simulateMonthlyBudgetRefresh(): void {
    this.state.hbarBalance += this.config.budget.monthlyBudget;
    console.log(
      `Monthly budget refreshed. New balance: ${this.state.hbarBalance} HBAR`
    );
  }
}
