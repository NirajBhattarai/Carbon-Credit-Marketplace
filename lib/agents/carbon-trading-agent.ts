/**
 * Carbon Trading Agent
 * Facilitates marketplace transactions and price discovery
 */

import {
  BaseAgent,
  AgentConfig,
  AgentCapability,
  A2AMessage,
  MessageType,
} from './base-agent';

export interface TradingAgentConfig extends AgentConfig {
  agentType: 'CARBON_TRADER';
  capabilities: [
    AgentCapability.TRADE_CREDITS,
    AgentCapability.PRICE_DISCOVERY,
    AgentCapability.MARKET_MAKING,
    AgentCapability.RISK_MANAGEMENT,
  ];
  tradingSettings: {
    tradingStrategy: 'MARKET_MAKER' | 'ARBITRAGE' | 'HIGH_FREQUENCY';
    maxPositionSize: number; // Maximum credits to hold
    minSpread: number; // Minimum bid-ask spread (HBAR)
    maxSpread: number; // Maximum bid-ask spread (HBAR)
    riskTolerance: 'LOW' | 'MEDIUM' | 'HIGH';
    tradingHours: {
      start: number; // Hour of day (0-23)
      end: number; // Hour of day (0-23)
    };
  };
}

export interface OrderBook {
  bids: Order[];
  asks: Order[];
  lastPrice: number;
  volume24h: number;
}

export interface Order {
  id: string;
  agentId: string;
  type: 'BID' | 'ASK';
  amount: number;
  price: number;
  timestamp: number;
  status: 'ACTIVE' | 'FILLED' | 'CANCELLED';
}

export interface MarketData {
  symbol: string;
  lastPrice: number;
  bidPrice: number;
  askPrice: number;
  volume24h: number;
  priceChange24h: number;
  timestamp: number;
}

export class CarbonTradingAgent extends BaseAgent {
  private config: TradingAgentConfig;
  private orderBook: OrderBook;
  private marketData: MarketData;
  private activeOrders: Map<string, Order> = new Map();
  private tradingInterval: NodeJS.Timeout | null = null;

  constructor(config: TradingAgentConfig) {
    super(config);
    this.config = config;
    this.orderBook = {
      bids: [],
      asks: [],
      lastPrice: 5.0, // Starting price
      volume24h: 0,
    };
    this.marketData = {
      symbol: 'CCT/HBAR',
      lastPrice: 5.0,
      bidPrice: 4.9,
      askPrice: 5.1,
      volume24h: 0,
      priceChange24h: 0,
      timestamp: Date.now(),
    };
    this.setupMessageHandlers();
  }

  /**
   * Initialize the agent
   */
  async initialize(): Promise<void> {
    console.log(`📈 Initializing Carbon Trading Agent: ${this.config.name}`);

    // Start trading activities
    this.startTrading();

    // Start market data updates
    this.startMarketDataUpdates();

    // Start heartbeat
    this.startHeartbeat();

    this.isRunning = true;
    this.updateActivity();

    console.log(`✅ Carbon Trading Agent initialized: ${this.config.name}`);
  }

  /**
   * Shutdown the agent
   */
  async shutdown(): Promise<void> {
    console.log(`🛑 ${this.config.name}: Shutting down...`);

    if (this.tradingInterval) {
      clearInterval(this.tradingInterval);
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
      MessageType.CREDIT_OFFER,
      this.handleCreditOffer.bind(this)
    );
    this.messageHandlers.set(
      MessageType.CREDIT_REQUEST,
      this.handleCreditRequest.bind(this)
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
      MessageType.ORDER_PLACEMENT,
      this.handleOrderPlacement.bind(this)
    );
    this.messageHandlers.set(
      MessageType.ORDER_FILL,
      this.handleOrderFill.bind(this)
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
   * Start trading activities
   */
  private startTrading(): void {
    this.tradingInterval = setInterval(() => {
      this.executeTradingStrategy();
    }, 2000); // Execute strategy every 2 seconds
  }

  /**
   * Execute trading strategy
   */
  private executeTradingStrategy(): void {
    switch (this.config.tradingSettings.tradingStrategy) {
      case 'MARKET_MAKER':
        this.executeMarketMaking();
        break;
      case 'ARBITRAGE':
        this.executeArbitrage();
        break;
      case 'HIGH_FREQUENCY':
        this.executeHighFrequencyTrading();
        break;
    }
  }

  /**
   * Execute market making strategy
   */
  private executeMarketMaking(): void {
    // Place bid orders
    if (this.orderBook.bids.length < 3) {
      this.placeBidOrder();
    }

    // Place ask orders
    if (this.orderBook.asks.length < 3) {
      this.placeAskOrder();
    }

    // Update spreads
    this.updateSpreads();
  }

  /**
   * Execute arbitrage strategy
   */
  private executeArbitrage(): void {
    // Look for price discrepancies
    const priceDifference = this.marketData.askPrice - this.marketData.bidPrice;

    if (priceDifference > this.config.tradingSettings.minSpread * 2) {
      // Execute arbitrage trade
      this.executeArbitrageTrade();
    }
  }

  /**
   * Execute high frequency trading
   */
  private executeHighFrequencyTrading(): void {
    // Place small orders frequently
    if (Math.random() < 0.7) {
      // 70% chance
      this.placeSmallOrder();
    }
  }

  /**
   * Place bid order
   */
  private placeBidOrder(): void {
    const bidPrice = this.marketData.lastPrice - (Math.random() * 0.2 + 0.1);
    const amount = Math.floor(Math.random() * 20) + 5; // 5-25 credits

    const order: Order = {
      id: `bid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      agentId: this.config.id,
      type: 'BID',
      amount,
      price: bidPrice,
      timestamp: Date.now(),
      status: 'ACTIVE',
    };

    this.orderBook.bids.push(order);
    this.activeOrders.set(order.id, order);

    console.log(
      `📊 ${this.config.name}: Placed bid order - ${amount} credits @ ${bidPrice} HBAR`
    );
  }

  /**
   * Place ask order
   */
  private placeAskOrder(): void {
    const askPrice = this.marketData.lastPrice + (Math.random() * 0.2 + 0.1);
    const amount = Math.floor(Math.random() * 20) + 5; // 5-25 credits

    const order: Order = {
      id: `ask_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      agentId: this.config.id,
      type: 'ASK',
      amount,
      price: askPrice,
      timestamp: Date.now(),
      status: 'ACTIVE',
    };

    this.orderBook.asks.push(order);
    this.activeOrders.set(order.id, order);

    console.log(
      `📊 ${this.config.name}: Placed ask order - ${amount} credits @ ${askPrice} HBAR`
    );
  }

  /**
   * Place small order for HFT
   */
  private placeSmallOrder(): void {
    const isBid = Math.random() < 0.5;
    const price = isBid
      ? this.marketData.lastPrice - Math.random() * 0.1
      : this.marketData.lastPrice + Math.random() * 0.1;
    const amount = Math.floor(Math.random() * 5) + 1; // 1-5 credits

    const order: Order = {
      id: `${isBid ? 'bid' : 'ask'}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      agentId: this.config.id,
      type: isBid ? 'BID' : 'ASK',
      amount,
      price,
      timestamp: Date.now(),
      status: 'ACTIVE',
    };

    if (isBid) {
      this.orderBook.bids.push(order);
    } else {
      this.orderBook.asks.push(order);
    }
    this.activeOrders.set(order.id, order);

    console.log(
      `⚡ ${this.config.name}: Placed ${isBid ? 'bid' : 'ask'} order - ${amount} credits @ ${price} HBAR`
    );
  }

  /**
   * Execute arbitrage trade
   */
  private executeArbitrageTrade(): void {
    const buyPrice = this.marketData.bidPrice;
    const sellPrice = this.marketData.askPrice;
    const amount = Math.floor(Math.random() * 10) + 5; // 5-15 credits
    const profit = (sellPrice - buyPrice) * amount;

    console.log(
      `💰 ${this.config.name}: Executing arbitrage trade - Buy @ ${buyPrice}, Sell @ ${sellPrice}, Profit: ${profit} HBAR`
    );

    // Simulate trade execution
    this.state.performance.totalCreditsTraded += amount;
    this.state.performance.totalRevenue += profit;
    this.state.totalTransactions++;
  }

  /**
   * Update spreads
   */
  private updateSpreads(): void {
    if (this.orderBook.bids.length > 0 && this.orderBook.asks.length > 0) {
      const bestBid = Math.max(...this.orderBook.bids.map(b => b.price));
      const bestAsk = Math.min(...this.orderBook.asks.map(a => a.price));

      this.marketData.bidPrice = bestBid;
      this.marketData.askPrice = bestAsk;
      this.marketData.lastPrice = (bestBid + bestAsk) / 2;
    }
  }

  /**
   * Start market data updates
   */
  private startMarketDataUpdates(): void {
    setInterval(() => {
      this.updateMarketData();
    }, 5000); // Update every 5 seconds
  }

  /**
   * Update market data
   */
  private updateMarketData(): void {
    // Simulate price movement
    const priceChange = (Math.random() - 0.5) * 0.2; // -0.1 to +0.1 HBAR
    this.marketData.lastPrice = Math.max(
      0.1,
      this.marketData.lastPrice + priceChange
    );

    // Update volume
    this.marketData.volume24h += Math.random() * 100;

    // Update timestamp
    this.marketData.timestamp = Date.now();

    // Broadcast market update
    this.sendMessage({
      from: this.config.id,
      to: 'broadcast',
      type: MessageType.MARKET_UPDATE,
      payload: this.marketData,
    });
  }

  /**
   * Handle credit offer
   */
  private async handleCreditOffer(message: A2AMessage): Promise<void> {
    const offer = message.payload;
    console.log(
      `📨 ${this.config.name}: Received credit offer from ${message.from}`
    );

    // Analyze the offer
    if (this.isGoodOffer(offer)) {
      // Place bid order
      await this.sendMessage({
        from: this.config.id,
        to: message.from,
        type: MessageType.ORDER_PLACEMENT,
        payload: {
          creditAmount: Math.min(offer.creditAmount, 20), // Max 20 credits
          pricePerCredit: offer.pricePerCredit,
          totalAmount: Math.min(offer.creditAmount, 20) * offer.pricePerCredit,
          buyerAgentId: this.config.id,
        },
      });

      console.log(
        `✅ ${this.config.name}: Placed order for credit offer from ${message.from}`
      );
    }
  }

  /**
   * Handle credit request
   */
  private async handleCreditRequest(message: A2AMessage): Promise<void> {
    const request = message.payload;
    console.log(
      `📨 ${this.config.name}: Received credit request from ${message.from}`
    );

    // Check if we have credits to sell
    if (this.state.credits >= request.creditAmount) {
      // Provide price quote
      await this.sendMessage({
        from: this.config.id,
        to: message.from,
        type: MessageType.PRICE_QUOTE,
        payload: {
          creditAmount: request.creditAmount,
          pricePerCredit: this.calculateAskPrice(),
          totalAmount: request.creditAmount * this.calculateAskPrice(),
          sellerAgentId: this.config.id,
        },
      });

      console.log(
        `✅ ${this.config.name}: Provided price quote to ${message.from}`
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

    // Analyze the quote
    if (this.isGoodQuote(quote)) {
      await this.sendMessage({
        from: this.config.id,
        to: message.from,
        type: MessageType.ORDER_PLACEMENT,
        payload: {
          creditAmount: quote.creditAmount,
          pricePerCredit: quote.pricePerCredit,
          totalAmount: quote.totalAmount,
          buyerAgentId: this.config.id,
        },
      });

      console.log(
        `✅ ${this.config.name}: Placed order for price quote from ${message.from}`
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

    // Counter-offer if needed
    const counterPrice = this.calculateCounterPrice(negotiation.proposedPrice);

    await this.sendMessage({
      from: this.config.id,
      to: message.from,
      type: MessageType.PRICE_NEGOTIATION,
      payload: {
        proposedPrice: counterPrice,
        accepted: Math.abs(counterPrice - negotiation.proposedPrice) < 0.1,
        reasoning: 'Counter-offer based on market conditions',
      },
    });

    console.log(
      `💰 ${this.config.name}: Counter-offered price: ${counterPrice} HBAR`
    );
  }

  /**
   * Handle order placement
   */
  private async handleOrderPlacement(message: A2AMessage): Promise<void> {
    const order = message.payload;
    console.log(
      `📋 ${this.config.name}: Received order placement from ${message.from}`
    );

    // Process the order
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await this.sendMessage({
      from: this.config.id,
      to: message.from,
      type: MessageType.ORDER_FILL,
      payload: {
        orderId,
        creditAmount: order.creditAmount,
        pricePerCredit: order.pricePerCredit,
        totalAmount: order.totalAmount,
        status: 'FILLED',
      },
    });

    console.log(`✅ ${this.config.name}: Filled order ${orderId}`);
  }

  /**
   * Handle order fill
   */
  private async handleOrderFill(message: A2AMessage): Promise<void> {
    const fill = message.payload;
    console.log(`✅ ${this.config.name}: Order ${fill.orderId} filled`);

    // Update performance metrics
    this.state.performance.totalCreditsTraded += fill.creditAmount;
    this.state.performance.totalRevenue += fill.totalAmount;
    this.state.totalTransactions++;
  }

  /**
   * Handle transaction proposal
   */
  private async handleTransactionProposal(message: A2AMessage): Promise<void> {
    const proposal = message.payload;
    console.log(
      `📋 ${this.config.name}: Received transaction proposal from ${message.from}`
    );

    // Accept the transaction
    await this.sendMessage({
      from: this.config.id,
      to: message.from,
      type: MessageType.TRANSACTION_ACCEPT,
      payload: {
        transactionId: proposal.transactionId,
        confirmation: 'Transaction accepted by trading agent',
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
      `✅ ${this.config.name}: Transaction ${accept.transactionId} accepted`
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
          marketData: this.marketData,
          activeOrders: this.activeOrders.size,
          lastActivity: this.state.lastActivity,
        },
      });
    }, 30000); // Send heartbeat every 30 seconds
  }

  /**
   * Check if offer is good
   */
  private isGoodOffer(offer: any): boolean {
    return offer.pricePerCredit <= this.marketData.lastPrice * 1.1; // Within 10% of market price
  }

  /**
   * Check if quote is good
   */
  private isGoodQuote(quote: any): boolean {
    return quote.pricePerCredit >= this.marketData.lastPrice * 0.9; // Within 10% of market price
  }

  /**
   * Calculate ask price
   */
  private calculateAskPrice(): number {
    return this.marketData.lastPrice + (Math.random() * 0.2 + 0.1);
  }

  /**
   * Calculate counter price
   */
  private calculateCounterPrice(proposedPrice: number): number {
    return proposedPrice + (Math.random() * 0.1 - 0.05); // Small adjustment
  }

  /**
   * Get market summary
   */
  getMarketSummary(): any {
    return {
      marketData: this.marketData,
      orderBook: {
        bidCount: this.orderBook.bids.length,
        askCount: this.orderBook.asks.length,
        bestBid:
          this.orderBook.bids.length > 0
            ? Math.max(...this.orderBook.bids.map(b => b.price))
            : 0,
        bestAsk:
          this.orderBook.asks.length > 0
            ? Math.min(...this.orderBook.asks.map(a => a.price))
            : 0,
      },
      activeOrders: this.activeOrders.size,
      tradingStrategy: this.config.tradingSettings.tradingStrategy,
    };
  }
}
