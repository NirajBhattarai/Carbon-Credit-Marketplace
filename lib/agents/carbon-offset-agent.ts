/**
 * Carbon Offset Agent
 * Purchases carbon credits to offset emissions and manages offset tracking
 */

import {
  BaseAgent,
  AgentConfig,
  AgentCapability,
  A2AMessage,
  MessageType,
} from './base-agent';

export interface OffsetAgentConfig extends AgentConfig {
  agentType: 'CARBON_OFFSETTER';
  capabilities: [
    AgentCapability.PURCHASE_CREDITS,
    AgentCapability.BUDGET_MANAGEMENT,
    AgentCapability.OFFSET_TRACKING,
    AgentCapability.RISK_MANAGEMENT,
  ];
  offsetSettings: {
    organizationName: string;
    industry: string;
    monthlyBudget: number; // HBAR per month
    targetOffsetAmount: number; // credits per month
    maxPricePerCredit: number; // HBAR per credit
    preferredCreditTypes: string[];
    urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  };
}

export interface OffsetRequirement {
  id: string;
  amount: number;
  deadline: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  reason: string;
}

export class CarbonOffsetAgent extends BaseAgent {
  private config: OffsetAgentConfig;
  private pendingRequests: Map<string, any> = new Map();
  private offsetRequirements: OffsetRequirement[] = [];
  private monthlySpending: number = 0;

  constructor(config: OffsetAgentConfig) {
    super(config);
    this.config = config;
    this.setupMessageHandlers();
  }

  /**
   * Initialize the agent
   */
  async initialize(): Promise<void> {
    console.log(`🏢 Initializing Carbon Offset Agent: ${this.config.name}`);

    // Start offset monitoring
    this.startOffsetMonitoring();

    // Start heartbeat
    this.startHeartbeat();

    this.isRunning = true;
    this.updateActivity();

    console.log(`✅ Carbon Offset Agent initialized: ${this.config.name}`);
  }

  /**
   * Shutdown the agent
   */
  async shutdown(): Promise<void> {
    console.log(`🛑 ${this.config.name}: Shutting down...`);

    this.isRunning = false;
    this.state.isOnline = false;

    console.log(`✅ ${this.config.name}: Shutdown complete`);
  }

  /**
   * Setup message handlers
   */
  private setupMessageHandlers(): void {
    this.messageHandlers.set(
      MessageType.CREDIT_OFFER,
      this.handleCreditOffer.bind(this)
    );
    this.messageHandlers.set(
      MessageType.PRICE_QUOTE,
      this.handlePriceQuote.bind(this)
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
   * Start offset monitoring
   */
  private startOffsetMonitoring(): void {
    setInterval(() => {
      this.checkOffsetRequirements();
    }, 10000); // Check every 10 seconds
  }

  /**
   * Check offset requirements and initiate purchases
   */
  private checkOffsetRequirements(): void {
    // Simulate offset requirements
    if (Math.random() < 0.3) {
      // 30% chance of new requirement
      this.createOffsetRequirement();
    }

    // Process pending requirements
    for (const requirement of this.offsetRequirements) {
      if (
        this.canAffordPurchase(requirement.amount) &&
        requirement.deadline > Date.now()
      ) {
        this.requestCredits(requirement);
      }
    }
  }

  /**
   * Create a new offset requirement
   */
  private createOffsetRequirement(): void {
    const requirement: OffsetRequirement = {
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      amount: Math.floor(Math.random() * 50) + 10, // 10-60 credits
      deadline: Date.now() + Math.random() * 3600000 + 1800000, // 30-90 minutes
      priority: ['LOW', 'MEDIUM', 'HIGH'][Math.floor(Math.random() * 3)] as
        | 'LOW'
        | 'MEDIUM'
        | 'HIGH',
      reason: 'Monthly carbon offset requirement',
    };

    this.offsetRequirements.push(requirement);
    console.log(
      `📋 ${this.config.name}: Created offset requirement - ${requirement.amount} credits (Priority: ${requirement.priority})`
    );
  }

  /**
   * Check if we can afford a purchase
   */
  private canAffordPurchase(amount: number): boolean {
    const estimatedCost = amount * this.config.offsetSettings.maxPricePerCredit;
    return (
      this.state.hbarBalance >= estimatedCost &&
      this.monthlySpending + estimatedCost <=
        this.config.offsetSettings.monthlyBudget
    );
  }

  /**
   * Request credits from available sellers
   */
  private async requestCredits(requirement: OffsetRequirement): Promise<void> {
    const message = {
      from: this.config.id,
      to: 'broadcast',
      type: MessageType.CREDIT_REQUEST,
      payload: {
        creditAmount: requirement.amount,
        maxPricePerCredit: this.config.offsetSettings.maxPricePerCredit,
        buyerAgentId: this.config.id,
        buyerName: this.config.name,
        organizationName: this.config.offsetSettings.organizationName,
        industry: this.config.offsetSettings.industry,
        urgency: requirement.priority,
        deadline: requirement.deadline,
        preferredCreditTypes: this.config.offsetSettings.preferredCreditTypes,
      },
    };

    await this.sendMessage(message);
    console.log(
      `📤 ${this.config.name}: Requesting ${requirement.amount} credits for offset requirement ${requirement.id}`
    );
  }

  /**
   * Handle credit offer
   */
  private async handleCreditOffer(message: A2AMessage): Promise<void> {
    const offer = message.payload;
    console.log(
      `📨 ${this.config.name}: Received credit offer from ${message.from}`
    );

    // Check if offer meets our criteria
    if (
      offer.pricePerCredit <= this.config.offsetSettings.maxPricePerCredit &&
      offer.creditAmount >= 10 && // Minimum purchase amount
      this.canAffordPurchase(offer.creditAmount)
    ) {
      // Send credit request
      await this.sendMessage({
        from: this.config.id,
        to: message.from,
        type: MessageType.CREDIT_REQUEST,
        payload: {
          creditAmount: Math.min(offer.creditAmount, 50), // Max 50 credits per purchase
          maxPricePerCredit: this.config.offsetSettings.maxPricePerCredit,
          buyerAgentId: this.config.id,
          urgency: this.config.offsetSettings.urgencyLevel,
          deadline: Date.now() + 300000, // 5 minutes
        },
      });

      console.log(
        `✅ ${this.config.name}: Responding to credit offer from ${message.from}`
      );
    }
  }

  /**
   * Handle price quote
   */
  private async handlePriceQuote(message: A2AMessage): Promise<void> {
    const quote = message.payload;
    console.log(
      `💰 ${this.config.name}: Received price quote from ${message.from}`
    );

    if (quote.pricePerCredit <= this.config.offsetSettings.maxPricePerCredit) {
      // Accept the quote
      await this.sendMessage({
        from: this.config.id,
        to: message.from,
        type: MessageType.ORDER_PLACEMENT,
        payload: {
          creditAmount: quote.creditAmount,
          pricePerCredit: quote.pricePerCredit,
          totalAmount: quote.creditAmount * quote.pricePerCredit,
          buyerAgentId: this.config.id,
        },
      });

      console.log(
        `✅ ${this.config.name}: Placed order for ${quote.creditAmount} credits @ ${quote.pricePerCredit} HBAR`
      );
    }
  }

  /**
   * Handle price negotiation
   */
  private async handlePriceNegotiation(message: A2AMessage): Promise<void> {
    const negotiation = message.payload;
    console.log(
      `💰 ${this.config.name}: Received price negotiation from ${message.from}`
    );

    if (
      negotiation.proposedPrice <= this.config.offsetSettings.maxPricePerCredit
    ) {
      await this.sendMessage({
        from: this.config.id,
        to: message.from,
        type: MessageType.PRICE_NEGOTIATION,
        payload: {
          proposedPrice: negotiation.proposedPrice,
          accepted: true,
          reasoning: 'Price within acceptable range',
        },
      });

      console.log(
        `✅ ${this.config.name}: Accepted negotiated price: ${negotiation.proposedPrice} HBAR`
      );
    } else {
      await this.sendMessage({
        from: this.config.id,
        to: message.from,
        type: MessageType.PRICE_NEGOTIATION,
        payload: {
          proposedPrice: this.config.offsetSettings.maxPricePerCredit,
          accepted: false,
          reasoning: 'Price exceeds maximum budget',
        },
      });

      console.log(
        `❌ ${this.config.name}: Rejected price negotiation - exceeds budget`
      );
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

    // Check budget and availability
    if (proposal.totalAmount > this.state.hbarBalance) {
      await this.sendMessage({
        from: this.config.id,
        to: message.from,
        type: MessageType.TRANSACTION_REJECT,
        payload: {
          transactionId: proposal.transactionId,
          reason: 'Insufficient HBAR balance',
        },
      });
      return;
    }

    if (
      proposal.totalAmount >
      this.config.offsetSettings.monthlyBudget - this.monthlySpending
    ) {
      await this.sendMessage({
        from: this.config.id,
        to: message.from,
        type: MessageType.TRANSACTION_REJECT,
        payload: {
          transactionId: proposal.transactionId,
          reason: 'Exceeds monthly budget',
        },
      });
      return;
    }

    // Accept the transaction
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
      `✅ ${this.config.name}: Transaction ${accept.transactionId} accepted by seller`
    );

    // Simulate transaction completion
    this.state.totalTransactions++;
    this.state.performance.totalCreditsPurchased += accept.creditAmount || 0;
    this.state.performance.totalExpenses += accept.totalAmount || 0;
    this.monthlySpending += accept.totalAmount || 0;

    console.log(
      `🎉 ${this.config.name}: Purchase completed! Total transactions: ${this.state.totalTransactions}`
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
          hbarBalance: this.state.hbarBalance,
          monthlySpending: this.monthlySpending,
          lastActivity: this.state.lastActivity,
        },
      });
    }, 30000); // Send heartbeat every 30 seconds
  }

  /**
   * Get offset tracking summary
   */
  getOffsetSummary(): any {
    return {
      totalCreditsPurchased: this.state.performance.totalCreditsPurchased,
      monthlySpending: this.monthlySpending,
      monthlyBudget: this.config.offsetSettings.monthlyBudget,
      budgetUtilization:
        (this.monthlySpending / this.config.offsetSettings.monthlyBudget) * 100,
      pendingRequirements: this.offsetRequirements.length,
      averagePricePerCredit:
        this.state.performance.totalExpenses /
          this.state.performance.totalCreditsPurchased || 0,
    };
  }
}
