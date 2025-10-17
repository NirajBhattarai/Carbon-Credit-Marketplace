/**
 * Base Agent Class for Carbon Credit Trading
 * Implements core functionality for all trading agents
 */

import { A2AProtocol, A2AMessage, MessageType } from './a2a-protocol';

export interface AgentConfig {
  id: string;
  name: string;
  type: AgentType;
  walletAddress: string;
  capabilities: AgentCapability[];
  settings: AgentSettings;
}

export enum AgentType {
  CARBON_SEQUESTER = 'carbon_sequester',
  CARBON_OFFSETTER = 'carbon_offseter',
  CARBON_TRADER = 'carbon_trader',
  IOT_MONITOR = 'iot_monitor',
  MARKET_MAKER = 'market_maker',
}

export enum AgentCapability {
  GENERATE_CREDITS = 'generate_credits',
  BUY_CREDITS = 'buy_credits',
  SELL_CREDITS = 'sell_credits',
  MONITOR_IOT = 'monitor_iot',
  PRICE_DISCOVERY = 'price_discovery',
  RISK_ASSESSMENT = 'risk_assessment',
  HUMAN_INTERACTION = 'human_interaction',
}

export interface AgentSettings {
  maxTransactionAmount: number; // in HBAR
  riskTolerance: 'LOW' | 'MEDIUM' | 'HIGH';
  humanApprovalRequired: boolean;
  autoTradingEnabled: boolean;
  priceRange: {
    min: number;
    max: number;
  };
  creditTypes: ('SEQUESTER' | 'EMITTER')[];
}

export interface AgentState {
  credits: number;
  hbarBalance: number;
  activeTransactions: string[];
  lastActivity: number;
  status: 'ACTIVE' | 'INACTIVE' | 'ERROR';
  performance: {
    totalTrades: number;
    successfulTrades: number;
    totalVolume: number;
    averagePrice: number;
  };
}

export abstract class BaseAgent {
  protected config: AgentConfig;
  protected state: AgentState;
  protected a2aProtocol: A2AProtocol;
  protected messageHandlers: Map<
    MessageType,
    (message: A2AMessage) => Promise<void>
  > = new Map();

  constructor(config: AgentConfig) {
    this.config = config;
    this.state = {
      credits: 0,
      hbarBalance: 0,
      activeTransactions: [],
      lastActivity: Date.now(),
      status: 'ACTIVE',
      performance: {
        totalTrades: 0,
        successfulTrades: 0,
        totalVolume: 0,
        averagePrice: 0,
      },
    };
    this.a2aProtocol = new A2AProtocol();
    this.setupMessageHandlers();
  }

  /**
   * Initialize the agent
   */
  async initialize(): Promise<void> {
    console.log(`Initializing agent ${this.config.name} (${this.config.id})`);

    // Register message handlers
    for (const [messageType, handler] of this.messageHandlers) {
      this.a2aProtocol.registerHandler(messageType, handler);
    }

    // Start message processing loop
    this.startMessageProcessing();

    // Start heartbeat
    this.startHeartbeat();

    console.log(`Agent ${this.config.name} initialized successfully`);
  }

  /**
   * Setup message handlers - to be implemented by subclasses
   */
  protected abstract setupMessageHandlers(): void;

  /**
   * Start processing incoming messages
   */
  private async startMessageProcessing(): Promise<void> {
    setInterval(async () => {
      try {
        const messages = await this.a2aProtocol.receiveMessages(this.config.id);
        for (const message of messages) {
          await this.processMessage(message);
        }
      } catch (error) {
        console.error(
          `Error processing messages for agent ${this.config.id}:`,
          error
        );
      }
    }, 1000); // Process messages every second
  }

  /**
   * Start sending heartbeat messages
   */
  private async startHeartbeat(): Promise<void> {
    setInterval(async () => {
      try {
        await this.a2aProtocol.sendMessage({
          from: this.config.id,
          to: 'broadcast',
          type: MessageType.HEARTBEAT,
          payload: {
            agentId: this.config.id,
            status: this.state.status,
            timestamp: Date.now(),
          },
        });
      } catch (error) {
        console.error(
          `Error sending heartbeat for agent ${this.config.id}:`,
          error
        );
      }
    }, 30000); // Send heartbeat every 30 seconds
  }

  /**
   * Process a received message
   */
  protected async processMessage(message: A2AMessage): Promise<void> {
    console.log(`Agent ${this.config.id} received message:`, message.type);

    const handler = this.messageHandlers.get(message.type);
    if (handler) {
      await handler(message);
    } else {
      console.warn(
        `No handler for message type ${message.type} in agent ${this.config.id}`
      );
    }

    this.state.lastActivity = Date.now();
  }

  /**
   * Send a message to another agent
   */
  protected async sendMessage(
    to: string,
    type: MessageType,
    payload: any
  ): Promise<string> {
    return this.a2aProtocol.sendMessage({
      from: this.config.id,
      to,
      type,
      payload,
    });
  }

  /**
   * Broadcast a message to all agents
   */
  protected async broadcastMessage(
    type: MessageType,
    payload: any
  ): Promise<string> {
    return this.sendMessage('broadcast', type, payload);
  }

  /**
   * Update agent state
   */
  protected updateState(updates: Partial<AgentState>): void {
    this.state = { ...this.state, ...updates };
  }

  /**
   * Check if agent has a specific capability
   */
  hasCapability(capability: AgentCapability): boolean {
    return this.config.capabilities.includes(capability);
  }

  /**
   * Get agent information
   */
  getInfo(): { config: AgentConfig; state: AgentState } {
    return {
      config: this.config,
      state: this.state,
    };
  }

  /**
   * Request human approval for a transaction
   */
  protected async requestHumanApproval(
    transactionId: string,
    amount: number,
    reason: string,
    urgency: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM'
  ): Promise<boolean> {
    if (!this.config.settings.humanApprovalRequired) {
      return true; // Auto-approve if human approval not required
    }

    console.log(`Requesting human approval for transaction ${transactionId}`);

    // Send approval request to human interface
    await this.sendMessage(
      'human_interface',
      MessageType.HUMAN_APPROVAL_REQUEST,
      {
        transactionId,
        amount,
        reason,
        urgency,
        context: {
          agentId: this.config.id,
          action: 'transaction_approval',
          riskLevel: this.calculateRiskLevel(amount),
        },
      }
    );

    // For demo purposes, we'll simulate human approval
    // In a real implementation, this would wait for human response
    return this.simulateHumanApproval(transactionId, amount);
  }

  /**
   * Calculate risk level based on transaction amount
   */
  private calculateRiskLevel(amount: number): 'LOW' | 'MEDIUM' | 'HIGH' {
    const maxAmount = this.config.settings.maxTransactionAmount;
    if (amount <= maxAmount * 0.1) return 'LOW';
    if (amount <= maxAmount * 0.5) return 'MEDIUM';
    return 'HIGH';
  }

  /**
   * Simulate human approval (for demo purposes)
   */
  private simulateHumanApproval(
    transactionId: string,
    amount: number
  ): boolean {
    // Simulate approval based on amount and risk tolerance
    const maxAmount = this.config.settings.maxTransactionAmount;
    const riskTolerance = this.config.settings.riskTolerance;

    if (amount > maxAmount) return false;
    if (riskTolerance === 'LOW' && amount > maxAmount * 0.3) return false;
    if (riskTolerance === 'MEDIUM' && amount > maxAmount * 0.7) return false;

    console.log(`Human approval granted for transaction ${transactionId}`);
    return true;
  }

  /**
   * Execute a transaction
   */
  protected async executeTransaction(
    transactionId: string,
    amount: number,
    recipient: string,
    description: string
  ): Promise<boolean> {
    try {
      // Check if human approval is required and obtained
      const approved = await this.requestHumanApproval(
        transactionId,
        amount,
        `Transaction: ${description}`
      );

      if (!approved) {
        console.log(`Transaction ${transactionId} rejected by human approval`);
        return false;
      }

      // Execute the transaction (simulated)
      console.log(
        `Executing transaction ${transactionId}: ${amount} HBAR to ${recipient}`
      );

      // Update state
      this.state.hbarBalance -= amount;
      this.state.activeTransactions.push(transactionId);
      this.state.performance.totalTrades++;
      this.state.performance.totalVolume += amount;

      // Simulate transaction completion
      setTimeout(() => {
        this.state.activeTransactions = this.state.activeTransactions.filter(
          id => id !== transactionId
        );
        this.state.performance.successfulTrades++;
      }, 5000);

      return true;
    } catch (error) {
      console.error(`Error executing transaction ${transactionId}:`, error);
      return false;
    }
  }

  /**
   * Shutdown the agent
   */
  async shutdown(): Promise<void> {
    console.log(`Shutting down agent ${this.config.name}`);
    this.state.status = 'INACTIVE';
  }
}
