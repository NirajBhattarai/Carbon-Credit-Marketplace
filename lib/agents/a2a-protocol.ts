/**
 * Agent-to-Agent (A2A) Protocol Implementation
 * Enables communication between AI agents for carbon credit trading
 */

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
  // Carbon Credit Trading Messages
  CREDIT_OFFER = 'credit_offer',
  CREDIT_REQUEST = 'credit_request',
  PRICE_NEGOTIATION = 'price_negotiation',
  TRANSACTION_PROPOSAL = 'transaction_proposal',
  TRANSACTION_ACCEPT = 'transaction_accept',
  TRANSACTION_REJECT = 'transaction_reject',

  // IoT Data Messages
  SENSOR_DATA = 'sensor_data',
  CREDIT_GENERATION = 'credit_generation',
  THRESHOLD_ALERT = 'threshold_alert',

  // Payment Messages
  PAYMENT_REQUEST = 'payment_request',
  PAYMENT_CONFIRMATION = 'payment_confirmation',
  SETTLEMENT_COMPLETE = 'settlement_complete',

  // Human-in-the-loop Messages
  HUMAN_APPROVAL_REQUEST = 'human_approval_request',
  HUMAN_APPROVAL_RESPONSE = 'human_approval_response',

  // System Messages
  HEARTBEAT = 'heartbeat',
  ERROR = 'error',
}

export interface CreditOfferMessage {
  creditAmount: number;
  pricePerCredit: number; // in HBAR
  sellerAgentId: string;
  creditType: 'SEQUESTER' | 'EMITTER';
  expirationTime: number;
  metadata: {
    source: string;
    verificationData: any;
    quality: 'HIGH' | 'MEDIUM' | 'LOW';
  };
}

export interface CreditRequestMessage {
  creditAmount: number;
  maxPricePerCredit: number; // in HBAR
  buyerAgentId: string;
  creditType: 'SEQUESTER' | 'EMITTER';
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  deadline: number;
}

export interface PriceNegotiationMessage {
  proposedPrice: number;
  counterOffer?: number;
  reasoning: string;
  marketData: {
    averagePrice: number;
    recentTransactions: Array<{
      price: number;
      timestamp: number;
    }>;
  };
}

export interface TransactionProposalMessage {
  transactionId: string;
  creditAmount: number;
  pricePerCredit: number;
  totalAmount: number; // in HBAR
  sellerAgentId: string;
  buyerAgentId: string;
  smartContractAddress: string;
  requiresHumanApproval: boolean;
  expirationTime: number;
}

export interface PaymentRequestMessage {
  transactionId: string;
  amount: number; // in HBAR
  recipientAddress: string;
  paymentMethod: 'HBAR' | 'STABLECOIN';
  deadline: number;
}

export interface HumanApprovalRequestMessage {
  transactionId: string;
  amount: number;
  reason: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  context: {
    agentId: string;
    action: string;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  };
}

export class A2AProtocol {
  private messageQueue: Map<string, A2AMessage[]> = new Map();
  private messageHandlers: Map<
    MessageType,
    (message: A2AMessage) => Promise<void>
  > = new Map();

  constructor() {
    this.setupDefaultHandlers();
  }

  private setupDefaultHandlers(): void {
    this.messageHandlers.set(
      MessageType.HEARTBEAT,
      this.handleHeartbeat.bind(this)
    );
    this.messageHandlers.set(MessageType.ERROR, this.handleError.bind(this));
  }

  /**
   * Send a message from one agent to another
   */
  async sendMessage(
    message: Omit<A2AMessage, 'id' | 'timestamp'>
  ): Promise<string> {
    const fullMessage: A2AMessage = {
      ...message,
      id: this.generateMessageId(),
      timestamp: Date.now(),
    };

    // Add to recipient's message queue
    if (!this.messageQueue.has(message.to)) {
      this.messageQueue.set(message.to, []);
    }
    this.messageQueue.get(message.to)!.push(fullMessage);

    // Process the message
    await this.processMessage(fullMessage);

    return fullMessage.id;
  }

  /**
   * Receive messages for a specific agent
   */
  async receiveMessages(agentId: string): Promise<A2AMessage[]> {
    const messages = this.messageQueue.get(agentId) || [];
    this.messageQueue.set(agentId, []); // Clear the queue
    return messages;
  }

  /**
   * Register a message handler for a specific message type
   */
  registerHandler(
    messageType: MessageType,
    handler: (message: A2AMessage) => Promise<void>
  ): void {
    this.messageHandlers.set(messageType, handler);
  }

  /**
   * Process a received message
   */
  private async processMessage(message: A2AMessage): Promise<void> {
    const handler = this.messageHandlers.get(message.type);
    if (handler) {
      try {
        await handler(message);
      } catch (error) {
        console.error(`Error processing message ${message.id}:`, error);
        await this.sendMessage({
          from: 'system',
          to: message.from,
          type: MessageType.ERROR,
          payload: {
            originalMessageId: message.id,
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        });
      }
    }
  }

  /**
   * Generate a unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Handle heartbeat messages
   */
  private async handleHeartbeat(message: A2AMessage): Promise<void> {
    console.log(`Heartbeat received from agent ${message.from}`);
  }

  /**
   * Handle error messages
   */
  private async handleError(message: A2AMessage): Promise<void> {
    console.error(`Error message received:`, message.payload);
  }

  /**
   * Create a credit offer message
   */
  createCreditOffer(
    to: string,
    offer: CreditOfferMessage,
    from: string
  ): Promise<string> {
    return this.sendMessage({
      from,
      to,
      type: MessageType.CREDIT_OFFER,
      payload: offer,
    });
  }

  /**
   * Create a credit request message
   */
  createCreditRequest(
    to: string,
    request: CreditRequestMessage,
    from: string
  ): Promise<string> {
    return this.sendMessage({
      from,
      to,
      type: MessageType.CREDIT_REQUEST,
      payload: request,
    });
  }

  /**
   * Create a price negotiation message
   */
  createPriceNegotiation(
    to: string,
    negotiation: PriceNegotiationMessage,
    from: string
  ): Promise<string> {
    return this.sendMessage({
      from,
      to,
      type: MessageType.PRICE_NEGOTIATION,
      payload: negotiation,
    });
  }

  /**
   * Create a transaction proposal message
   */
  createTransactionProposal(
    to: string,
    proposal: TransactionProposalMessage,
    from: string
  ): Promise<string> {
    return this.sendMessage({
      from,
      to,
      type: MessageType.TRANSACTION_PROPOSAL,
      payload: proposal,
    });
  }

  /**
   * Create a human approval request message
   */
  createHumanApprovalRequest(
    to: string,
    request: HumanApprovalRequestMessage,
    from: string
  ): Promise<string> {
    return this.sendMessage({
      from,
      to,
      type: MessageType.HUMAN_APPROVAL_REQUEST,
      payload: request,
    });
  }
}
