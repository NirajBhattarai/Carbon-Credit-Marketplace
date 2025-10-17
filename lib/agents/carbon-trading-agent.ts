/**
 * Carbon Trading Agent (Market Maker)
 * Facilitates marketplace transactions and provides price discovery
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
  CreditOfferMessage,
  CreditRequestMessage,
} from './a2a-protocol';

export interface TradingAgentConfig extends AgentConfig {
  marketMaking: {
    spreadPercentage: number; // Buy/sell spread
    maxInventory: number; // Maximum credits to hold
    minInventory: number; // Minimum credits to maintain
  };
  priceDiscovery: {
    updateInterval: number; // milliseconds
    volatilityThreshold: number; // percentage
  };
  riskManagement: {
    maxPositionSize: number; // HBAR
    stopLossPercentage: number; // percentage
  };
}

export interface MarketData {
  timestamp: number;
  price: number;
  volume: number;
  bid: number;
  ask: number;
  spread: number;
}

export class CarbonTradingAgent extends BaseAgent {
  private config: TradingAgentConfig;
  private marketData: MarketData[] = [];
  private orderBook: {
    bids: Array<{ price: number; amount: number; agentId: string }>;
    asks: Array<{ price: number; amount: number; agentId: string }>;
  } = { bids: [], asks: [] };
  private activeOrders: Map<string, any> = new Map();

  constructor(config: TradingAgentConfig) {
    super(config);
    this.config = config;
  }

  protected setupMessageHandlers(): void {
    this.messageHandlers.set(
      MessageType.CREDIT_OFFER,
      this.handleCreditOffer.bind(this)
    );
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
  }

  /**
   * Initialize the trading agent
   */
  async initialize(): Promise<void> {
    await super.initialize();

    // Start market making
    this.startMarketMaking();

    // Start price discovery
    this.startPriceDiscovery();

    // Start order book management
    this.startOrderBookManagement();

    console.log(`Carbon Trading Agent ${this.config.name} initialized`);
  }

  /**
   * Start market making process
   */
  private startMarketMaking(): void {
    setInterval(async () => {
      try {
        await this.updateMarketMakingQuotes();
      } catch (error) {
        console.error('Error in market making:', error);
      }
    }, 10000); // Update every 10 seconds
  }

  /**
   * Update market making quotes
   */
  private async updateMarketMakingQuotes(): Promise<void> {
    const currentPrice = this.getCurrentMarketPrice();
    const spread = this.config.marketMaking.spreadPercentage / 100;

    const bidPrice = currentPrice * (1 - spread / 2);
    const askPrice = currentPrice * (1 + spread / 2);

    // Check inventory levels
    if (this.state.credits < this.config.marketMaking.minInventory) {
      // Need to buy credits
      await this.placeBuyOrder(
        bidPrice,
        this.config.marketMaking.minInventory - this.state.credits
      );
    }

    if (this.state.credits > this.config.marketMaking.maxInventory) {
      // Need to sell credits
      await this.placeSellOrder(
        askPrice,
        this.state.credits - this.config.marketMaking.maxInventory
      );
    }

    // Update market data
    this.updateMarketData({
      timestamp: Date.now(),
      price: currentPrice,
      volume: 0,
      bid: bidPrice,
      ask: askPrice,
      spread: askPrice - bidPrice,
    });
  }

  /**
   * Start price discovery process
   */
  private startPriceDiscovery(): void {
    setInterval(async () => {
      try {
        await this.updatePriceDiscovery();
      } catch (error) {
        console.error('Error in price discovery:', error);
      }
    }, this.config.priceDiscovery.updateInterval);
  }

  /**
   * Update price discovery
   */
  private async updatePriceDiscovery(): Promise<void> {
    // Analyze recent transactions and market data
    const recentTransactions = this.marketData.slice(-10); // Last 10 data points

    if (recentTransactions.length > 0) {
      const averagePrice =
        recentTransactions.reduce((sum, data) => sum + data.price, 0) /
        recentTransactions.length;
      const volatility = this.calculateVolatility(recentTransactions);

      console.log(
        `Market analysis - Average price: ${averagePrice}, Volatility: ${volatility}%`
      );

      // Adjust quotes based on volatility
      if (volatility > this.config.priceDiscovery.volatilityThreshold) {
        console.log('High volatility detected, adjusting spread');
        // Increase spread during high volatility
        this.config.marketMaking.spreadPercentage *= 1.2;
      } else {
        // Decrease spread during low volatility
        this.config.marketMaking.spreadPercentage *= 0.95;
      }

      // Ensure spread stays within reasonable bounds
      this.config.marketMaking.spreadPercentage = Math.max(
        0.5,
        Math.min(5.0, this.config.marketMaking.spreadPercentage)
      );
    }
  }

  /**
   * Calculate price volatility
   */
  private calculateVolatility(data: MarketData[]): number {
    if (data.length < 2) return 0;

    const prices = data.map(d => d.price);
    const mean = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const variance =
      prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) /
      prices.length;
    const standardDeviation = Math.sqrt(variance);

    return (standardDeviation / mean) * 100;
  }

  /**
   * Start order book management
   */
  private startOrderBookManagement(): void {
    setInterval(async () => {
      try {
        await this.matchOrders();
      } catch (error) {
        console.error('Error in order book management:', error);
      }
    }, 5000); // Check every 5 seconds
  }

  /**
   * Match orders in the order book
   */
  private async matchOrders(): Promise<void> {
    // Sort orders by price
    this.orderBook.bids.sort((a, b) => b.price - a.price); // Highest bid first
    this.orderBook.asks.sort((a, b) => a.price - b.price); // Lowest ask first

    // Match orders
    while (this.orderBook.bids.length > 0 && this.orderBook.asks.length > 0) {
      const bestBid = this.orderBook.bids[0];
      const bestAsk = this.orderBook.asks[0];

      if (bestBid.price >= bestAsk.price) {
        // Match found
        const matchAmount = Math.min(bestBid.amount, bestAsk.amount);
        const matchPrice = (bestBid.price + bestAsk.price) / 2; // Mid-price

        console.log(
          `Order match: ${matchAmount} credits at ${matchPrice} HBAR each`
        );

        // Execute the match
        await this.executeMatch(bestBid, bestAsk, matchAmount, matchPrice);

        // Update order book
        bestBid.amount -= matchAmount;
        bestAsk.amount -= matchAmount;

        if (bestBid.amount <= 0) {
          this.orderBook.bids.shift();
        }
        if (bestAsk.amount <= 0) {
          this.orderBook.asks.shift();
        }
      } else {
        break; // No more matches possible
      }
    }
  }

  /**
   * Execute a matched order
   */
  private async executeMatch(
    bid: { price: number; amount: number; agentId: string },
    ask: { price: number; amount: number; agentId: string },
    amount: number,
    price: number
  ): Promise<void> {
    const transactionId = `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Notify both parties
    await this.sendMessage(bid.agentId, MessageType.TRANSACTION_ACCEPT, {
      transactionId,
      creditAmount: amount,
      pricePerCredit: price,
      counterparty: ask.agentId,
    });

    await this.sendMessage(ask.agentId, MessageType.TRANSACTION_ACCEPT, {
      transactionId,
      creditAmount: amount,
      pricePerCredit: price,
      counterparty: bid.agentId,
    });

    // Update our market data
    this.updateMarketData({
      timestamp: Date.now(),
      price: price,
      volume: amount,
      bid: bid.price,
      ask: ask.price,
      spread: ask.price - bid.price,
    });
  }

  /**
   * Place a buy order
   */
  private async placeBuyOrder(price: number, amount: number): Promise<void> {
    const orderId = `buy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.orderBook.bids.push({
      price,
      amount,
      agentId: this.config.id,
    });

    this.activeOrders.set(orderId, {
      type: 'BUY',
      price,
      amount,
      timestamp: Date.now(),
    });

    console.log(`Placed buy order: ${amount} credits at ${price} HBAR each`);
  }

  /**
   * Place a sell order
   */
  private async placeSellOrder(price: number, amount: number): Promise<void> {
    const orderId = `sell_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.orderBook.asks.push({
      price,
      amount,
      agentId: this.config.id,
    });

    this.activeOrders.set(orderId, {
      type: 'SELL',
      price,
      amount,
      timestamp: Date.now(),
    });

    console.log(`Placed sell order: ${amount} credits at ${price} HBAR each`);
  }

  /**
   * Handle credit offer messages
   */
  private async handleCreditOffer(message: A2AMessage): Promise<void> {
    const offer = message.payload;

    console.log(`Received credit offer from ${message.from}:`, offer);

    // Add to order book as ask
    this.orderBook.asks.push({
      price: offer.pricePerCredit,
      amount: offer.creditAmount,
      agentId: message.from,
    });

    // Check for immediate matches
    await this.matchOrders();
  }

  /**
   * Handle credit request messages
   */
  private async handleCreditRequest(message: A2AMessage): Promise<void> {
    const request = message.payload;

    console.log(`Received credit request from ${message.from}:`, request);

    // Add to order book as bid
    this.orderBook.bids.push({
      price: request.maxPricePerCredit,
      amount: request.creditAmount,
      agentId: message.from,
    });

    // Check for immediate matches
    await this.matchOrders();
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

    // Provide market data and recommendations
    const marketAnalysis = this.getMarketAnalysis();

    await this.sendMessage(message.from, MessageType.PRICE_NEGOTIATION, {
      proposedPrice: negotiation.proposedPrice,
      marketAnalysis,
      recommendation: this.getPriceRecommendation(negotiation.proposedPrice),
    });
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

    // Validate the proposal against market conditions
    const marketPrice = this.getCurrentMarketPrice();
    const priceDeviation =
      Math.abs(proposal.pricePerCredit - marketPrice) / marketPrice;

    if (priceDeviation > 0.1) {
      // More than 10% deviation
      await this.sendMessage(message.from, MessageType.TRANSACTION_REJECT, {
        transactionId: proposal.transactionId,
        reason: `Price deviation too high: ${priceDeviation * 100}%`,
        marketPrice,
      });
      return;
    }

    // Accept the proposal
    await this.sendMessage(message.from, MessageType.TRANSACTION_ACCEPT, {
      transactionId: proposal.transactionId,
      confirmation: 'Transaction validated and accepted',
    });
  }

  /**
   * Handle transaction accept messages
   */
  private async handleTransactionAccept(message: A2AMessage): Promise<void> {
    const accept = message.payload;

    console.log(
      `Transaction ${accept.transactionId} accepted by ${message.from}`
    );

    // Update market data
    this.updateMarketData({
      timestamp: Date.now(),
      price: accept.pricePerCredit || this.getCurrentMarketPrice(),
      volume: accept.creditAmount || 0,
      bid: this.getBestBid(),
      ask: this.getBestAsk(),
      spread: this.getSpread(),
    });
  }

  /**
   * Handle transaction reject messages
   */
  private async handleTransactionReject(message: A2AMessage): Promise<void> {
    const reject = message.payload;

    console.log(
      `Transaction ${reject.transactionId} rejected by ${message.from}: ${reject.reason}`
    );
  }

  /**
   * Get current market price
   */
  private getCurrentMarketPrice(): number {
    if (this.marketData.length === 0) return 1.0; // Default price

    const latest = this.marketData[this.marketData.length - 1];
    return latest.price;
  }

  /**
   * Get best bid price
   */
  private getBestBid(): number {
    if (this.orderBook.bids.length === 0) return 0;
    return Math.max(...this.orderBook.bids.map(bid => bid.price));
  }

  /**
   * Get best ask price
   */
  private getBestAsk(): number {
    if (this.orderBook.asks.length === 0) return Infinity;
    return Math.min(...this.orderBook.asks.map(ask => ask.price));
  }

  /**
   * Get current spread
   */
  private getSpread(): number {
    const bestBid = this.getBestBid();
    const bestAsk = this.getBestAsk();
    return bestAsk - bestBid;
  }

  /**
   * Update market data
   */
  private updateMarketData(data: MarketData): void {
    this.marketData.push(data);

    // Keep only last 100 data points
    if (this.marketData.length > 100) {
      this.marketData = this.marketData.slice(-100);
    }
  }

  /**
   * Get market analysis
   */
  private getMarketAnalysis(): any {
    const recentData = this.marketData.slice(-10);
    const volatility = this.calculateVolatility(recentData);
    const averagePrice =
      recentData.reduce((sum, data) => sum + data.price, 0) / recentData.length;

    return {
      currentPrice: this.getCurrentMarketPrice(),
      averagePrice,
      volatility,
      spread: this.getSpread(),
      volume: recentData.reduce((sum, data) => sum + data.volume, 0),
      orderBookDepth: {
        bids: this.orderBook.bids.length,
        asks: this.orderBook.asks.length,
      },
    };
  }

  /**
   * Get price recommendation
   */
  private getPriceRecommendation(proposedPrice: number): string {
    const marketPrice = this.getCurrentMarketPrice();
    const deviation = (proposedPrice - marketPrice) / marketPrice;

    if (deviation > 0.05) return 'Price seems high, consider lowering';
    if (deviation < -0.05) return 'Price seems low, consider raising';
    return 'Price is fair based on current market conditions';
  }

  /**
   * Get agent statistics
   */
  getStatistics(): any {
    return {
      agentId: this.config.id,
      credits: this.state.credits,
      hbarBalance: this.state.hbarBalance,
      marketData: {
        currentPrice: this.getCurrentMarketPrice(),
        spread: this.getSpread(),
        volatility: this.calculateVolatility(this.marketData.slice(-10)),
        dataPoints: this.marketData.length,
      },
      orderBook: {
        bids: this.orderBook.bids.length,
        asks: this.orderBook.asks.length,
        bestBid: this.getBestBid(),
        bestAsk: this.getBestAsk(),
      },
      activeOrders: this.activeOrders.size,
      performance: this.state.performance,
    };
  }
}
