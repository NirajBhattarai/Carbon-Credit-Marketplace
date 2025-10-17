/**
 * Base Agent Interface
 * Defines the standard interface for all carbon credit trading agents
 */

export interface AgentConfig {
  id: string;
  name: string;
  walletAddress: string;
  agentType: AgentType;
  capabilities: AgentCapability[];
  settings: AgentSettings;
}

export enum AgentType {
  CARBON_SEQUESTER = 'CARBON_SEQUESTER',
  CARBON_OFFSETTER = 'CARBON_OFFSETTER',
  CARBON_TRADER = 'CARBON_TRADER',
}

export enum AgentCapability {
  GENERATE_CREDITS = 'GENERATE_CREDITS',
  PURCHASE_CREDITS = 'PURCHASE_CREDITS',
  TRADE_CREDITS = 'TRADE_CREDITS',
  PRICE_DISCOVERY = 'PRICE_DISCOVERY',
  MARKET_MAKING = 'MARKET_MAKING',
  RISK_MANAGEMENT = 'RISK_MANAGEMENT',
  BUDGET_MANAGEMENT = 'BUDGET_MANAGEMENT',
  OFFSET_TRACKING = 'OFFSET_TRACKING',
}

export interface AgentSettings {
  isActive: boolean;
  maxTransactionAmount: number;
  minTransactionAmount: number;
  priceVolatility: number;
  humanApprovalRequired: boolean;
  riskThreshold: number;
}

export interface AgentState {
  credits: number;
  hbarBalance: number;
  totalTransactions: number;
  isOnline: boolean;
  lastActivity: number;
  performance: AgentPerformance;
}

export interface AgentPerformance {
  totalCreditsGenerated: number;
  totalCreditsPurchased: number;
  totalCreditsTraded: number;
  totalRevenue: number;
  totalExpenses: number;
  successRate: number;
}

export interface A2AMessage {
  id: string;
  from: string;
  to: string;
  type: MessageType;
  payload: any;
  timestamp: number;
  signature?: string;
}

export enum MessageType {
  // Credit Management
  CREDIT_OFFER = 'CREDIT_OFFER',
  CREDIT_REQUEST = 'CREDIT_REQUEST',
  CREDIT_AVAILABILITY = 'CREDIT_AVAILABILITY',

  // Trading
  PRICE_QUOTE = 'PRICE_QUOTE',
  PRICE_NEGOTIATION = 'PRICE_NEGOTIATION',
  ORDER_PLACEMENT = 'ORDER_PLACEMENT',
  ORDER_FILL = 'ORDER_FILL',

  // Transactions
  TRANSACTION_PROPOSAL = 'TRANSACTION_PROPOSAL',
  TRANSACTION_ACCEPT = 'TRANSACTION_ACCEPT',
  TRANSACTION_REJECT = 'TRANSACTION_REJECT',
  TRANSACTION_COMPLETE = 'TRANSACTION_COMPLETE',

  // Market Data
  MARKET_UPDATE = 'MARKET_UPDATE',
  PRICE_DISCOVERY = 'PRICE_DISCOVERY',
  VOLUME_UPDATE = 'VOLUME_UPDATE',

  // System
  HEARTBEAT = 'HEARTBEAT',
  AGENT_DISCOVERY = 'AGENT_DISCOVERY',
  CAPABILITY_ADVERTISEMENT = 'CAPABILITY_ADVERTISEMENT',
  ERROR = 'ERROR',
}

export abstract class BaseAgent {
  protected config: AgentConfig;
  protected state: AgentState;
  protected messageHandlers: Map<
    MessageType,
    (message: A2AMessage) => Promise<void>
  > = new Map();
  protected isRunning: boolean = false;

  constructor(config: AgentConfig) {
    this.config = config;
    this.state = {
      credits: 0,
      hbarBalance: 1000, // Starting balance
      totalTransactions: 0,
      isOnline: true,
      lastActivity: Date.now(),
      performance: {
        totalCreditsGenerated: 0,
        totalCreditsPurchased: 0,
        totalCreditsTraded: 0,
        totalRevenue: 0,
        totalExpenses: 0,
        successRate: 100,
      },
    };
  }

  /**
   * Initialize the agent
   */
  abstract initialize(): Promise<void>;

  /**
   * Shutdown the agent
   */
  abstract shutdown(): Promise<void>;

  /**
   * Process incoming A2A message
   */
  async processMessage(message: A2AMessage): Promise<void> {
    const handler = this.messageHandlers.get(message.type);
    if (handler) {
      await handler(message);
    } else {
      console.log(
        `❌ ${this.config.name}: No handler for message type: ${message.type}`
      );
    }
  }

  /**
   * Send A2A message
   */
  async sendMessage(
    message: Omit<A2AMessage, 'id' | 'timestamp'>
  ): Promise<string> {
    const fullMessage: A2AMessage = {
      ...message,
      id: this.generateMessageId(),
      timestamp: Date.now(),
    };

    console.log(
      `📤 ${this.config.name}: Sending ${message.type} to ${message.to}`
    );

    // In real implementation, this would go through A2A protocol
    // For now, we'll just log it
    return fullMessage.id;
  }

  /**
   * Get agent information
   */
  getInfo(): any {
    return {
      id: this.config.id,
      name: this.config.name,
      type: this.config.agentType,
      walletAddress: this.config.walletAddress,
      capabilities: this.config.capabilities,
      isOnline: this.state.isOnline,
      lastActivity: this.state.lastActivity,
    };
  }

  /**
   * Get agent statistics
   */
  getStatistics(): any {
    return {
      credits: this.state.credits,
      hbarBalance: this.state.hbarBalance,
      totalTransactions: this.state.totalTransactions,
      performance: this.state.performance,
      isRunning: this.isRunning,
    };
  }

  /**
   * Get agent state
   */
  getState(): AgentState {
    return { ...this.state };
  }

  /**
   * Update agent configuration
   */
  updateConfig(updates: Partial<AgentConfig>): void {
    this.config = { ...this.config, ...updates };
    console.log(`🔧 ${this.config.name}: Configuration updated`);
  }

  /**
   * Generate unique message ID
   */
  protected generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Update last activity timestamp
   */
  protected updateActivity(): void {
    this.state.lastActivity = Date.now();
  }
}
