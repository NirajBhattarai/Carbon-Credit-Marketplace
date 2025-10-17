/**
 * Agent Manager
 * Orchestrates all carbon credit trading agents and manages the ecosystem
 */

import { BaseAgent, AgentConfig, AgentType, AgentCapability } from './base-agent';
import { CarbonSequestrationAgent, SequestrationAgentConfig } from './carbon-sequestration-agent';
import { CarbonOffsetAgent, OffsetAgentConfig } from './carbon-offset-agent';
import { CarbonTradingAgent, TradingAgentConfig } from './carbon-trading-agent';
import { A2AProtocol, MessageType } from './a2a-protocol';

export interface AgentManagerConfig {
  agents: {
    sequestration: SequestrationAgentConfig[];
    offset: OffsetAgentConfig[];
    trading: TradingAgentConfig[];
  };
  ecosystem: {
    enableHumanInTheLoop: boolean;
    maxTransactionAmount: number;
    emergencyStopEnabled: boolean;
  };
}

export class AgentManager {
  private config: AgentManagerConfig;
  private agents: Map<string, BaseAgent> = new Map();
  private a2aProtocol: A2AProtocol;
  private isRunning: boolean = false;
  private statistics: Map<string, any> = new Map();
  
  constructor(config: AgentManagerConfig) {
    this.config = config;
    this.a2aProtocol = new A2AProtocol();
  }
  
  /**
   * Initialize the agent manager and all agents
   */
  async initialize(): Promise<void> {
    console.log('Initializing Agent Manager...');
    
    // Initialize sequestration agents
    for (const agentConfig of this.config.agents.sequestration) {
      const agent = new CarbonSequestrationAgent(agentConfig);
      await agent.initialize();
      this.agents.set(agentConfig.id, agent);
      console.log(`Initialized sequestration agent: ${agentConfig.name}`);
    }
    
    // Initialize offset agents
    for (const agentConfig of this.config.agents.offset) {
      const agent = new CarbonOffsetAgent(agentConfig);
      await agent.initialize();
      this.agents.set(agentConfig.id, agent);
      console.log(`Initialized offset agent: ${agentConfig.name}`);
    }
    
    // Initialize trading agents
    for (const agentConfig of this.config.agents.trading) {
      const agent = new CarbonTradingAgent(agentConfig);
      await agent.initialize();
      this.agents.set(agentConfig.id, agent);
      console.log(`Initialized trading agent: ${agentConfig.name}`);
    }
    
    // Start monitoring
    this.startMonitoring();
    
    this.isRunning = true;
    console.log(`Agent Manager initialized with ${this.agents.size} agents`);
  }
  
  /**
   * Start monitoring all agents
   */
  private startMonitoring(): void {
    setInterval(async () => {
      try {
        await this.collectStatistics();
        await this.checkAgentHealth();
        await this.processSystemMessages();
      } catch (error) {
        console.error('Error in agent monitoring:', error);
      }
    }, 30000); // Monitor every 30 seconds
  }
  
  /**
   * Collect statistics from all agents
   */
  private async collectStatistics(): Promise<void> {
    for (const [agentId, agent] of this.agents) {
      try {
        const stats = agent.getStatistics();
        this.statistics.set(agentId, {
          ...stats,
          timestamp: Date.now(),
        });
      } catch (error) {
        console.error(`Error collecting statistics from agent ${agentId}:`, error);
      }
    }
  }
  
  /**
   * Check health of all agents
   */
  private async checkAgentHealth(): Promise<void> {
    for (const [agentId, agent] of this.agents) {
      try {
        const info = agent.getInfo();
        const now = Date.now();
        const lastActivity = info.state.lastActivity;
        
        // Check if agent is responsive (no activity for 5 minutes)
        if (now - lastActivity > 300000) {
          console.warn(`Agent ${agentId} appears unresponsive`);
          
          // Send heartbeat check
          await this.a2aProtocol.sendMessage({
            from: 'system',
            to: agentId,
            type: MessageType.HEARTBEAT,
            payload: { check: true },
          });
        }
      } catch (error) {
        console.error(`Error checking health of agent ${agentId}:`, error);
      }
    }
  }
  
  /**
   * Process system-wide messages
   */
  private async processSystemMessages(): Promise<void> {
    // Process messages for system agent
    const systemMessages = await this.a2aProtocol.receiveMessages('system');
    
    for (const message of systemMessages) {
      await this.handleSystemMessage(message);
    }
  }
  
  /**
   * Handle system messages
   */
  private async handleSystemMessage(message: any): Promise<void> {
    switch (message.type) {
      case MessageType.ERROR:
        console.error('System error message:', message.payload);
        break;
      case MessageType.HEARTBEAT:
        console.log('System heartbeat received');
        break;
      default:
        console.log('Unknown system message type:', message.type);
    }
  }
  
  /**
   * Get ecosystem statistics
   */
  getEcosystemStatistics(): any {
    const agentStats = Array.from(this.statistics.entries()).map(([agentId, stats]) => ({
      agentId,
      ...stats,
    }));
    
    // Calculate ecosystem-wide metrics
    const totalCredits = agentStats.reduce((sum, stats) => sum + (stats.credits || 0), 0);
    const totalHbarBalance = agentStats.reduce((sum, stats) => sum + (stats.hbarBalance || 0), 0);
    const totalTrades = agentStats.reduce((sum, stats) => sum + (stats.performance?.totalTrades || 0), 0);
    const totalVolume = agentStats.reduce((sum, stats) => sum + (stats.performance?.totalVolume || 0), 0);
    
    return {
      ecosystem: {
        totalAgents: this.agents.size,
        totalCredits,
        totalHbarBalance,
        totalTrades,
        totalVolume,
        averagePrice: totalTrades > 0 ? totalVolume / totalTrades : 0,
      },
      agents: agentStats,
      timestamp: Date.now(),
    };
  }
  
  /**
   * Get agent by ID
   */
  getAgent(agentId: string): BaseAgent | undefined {
    return this.agents.get(agentId);
  }
  
  /**
   * Get all agents
   */
  getAllAgents(): BaseAgent[] {
    return Array.from(this.agents.values());
  }
  
  /**
   * Get agents by type
   */
  getAgentsByType(type: AgentType): BaseAgent[] {
    return Array.from(this.agents.values()).filter(agent => 
      agent.getInfo().config.type === type
    );
  }
  
  /**
   * Send message to specific agent
   */
  async sendMessageToAgent(
    agentId: string,
    type: MessageType,
    payload: any
  ): Promise<string> {
    return this.a2aProtocol.sendMessage({
      from: 'system',
      to: agentId,
      type,
      payload,
    });
  }
  
  /**
   * Broadcast message to all agents
   */
  async broadcastToAllAgents(type: MessageType, payload: any): Promise<string> {
    return this.a2aProtocol.sendMessage({
      from: 'system',
      to: 'broadcast',
      type,
      payload,
    });
  }
  
  /**
   * Emergency stop all agents
   */
  async emergencyStop(): Promise<void> {
    console.log('Emergency stop initiated...');
    
    for (const [agentId, agent] of this.agents) {
      try {
        await agent.shutdown();
        console.log(`Agent ${agentId} stopped`);
      } catch (error) {
        console.error(`Error stopping agent ${agentId}:`, error);
      }
    }
    
    this.isRunning = false;
    console.log('Emergency stop completed');
  }
  
  /**
   * Restart the ecosystem
   */
  async restart(): Promise<void> {
    console.log('Restarting ecosystem...');
    
    await this.emergencyStop();
    await this.initialize();
    
    console.log('Ecosystem restarted');
  }
  
  /**
   * Check if the manager is running
   */
  isEcosystemRunning(): boolean {
    return this.isRunning;
  }
  
  /**
   * Get configuration
   */
  getConfig(): AgentManagerConfig {
    return this.config;
  }
  
  /**
   * Update agent configuration
   */
  async updateAgentConfig(agentId: string, updates: Partial<AgentConfig>): Promise<void> {
    const agent = this.agents.get(agentId);
    if (agent) {
      const currentConfig = agent.getInfo().config;
      const newConfig = { ...currentConfig, ...updates };
      
      // Restart agent with new configuration
      await agent.shutdown();
      
      // Create new agent instance with updated config
      let newAgent: BaseAgent;
      
      if (newConfig.type === AgentType.CARBON_SEQUESTER) {
        newAgent = new CarbonSequestrationAgent(newConfig as SequestrationAgentConfig);
      } else if (newConfig.type === AgentType.CARBON_OFFSETTER) {
        newAgent = new CarbonOffsetAgent(newConfig as OffsetAgentConfig);
      } else if (newConfig.type === AgentType.CARBON_TRADER) {
        newAgent = new CarbonTradingAgent(newConfig as TradingAgentConfig);
      } else {
        throw new Error(`Unknown agent type: ${newConfig.type}`);
      }
      
      await newAgent.initialize();
      this.agents.set(agentId, newAgent);
      
      console.log(`Agent ${agentId} configuration updated`);
    }
  }
  
  /**
   * Shutdown the agent manager
   */
  async shutdown(): Promise<void> {
    console.log('Shutting down Agent Manager...');
    
    await this.emergencyStop();
    
    console.log('Agent Manager shutdown complete');
  }
}

/**
 * Factory function to create a default agent manager configuration
 */
export function createDefaultAgentManagerConfig(): AgentManagerConfig {
  return {
    agents: {
      sequestration: [
        {
          id: 'sequester_001',
          name: 'Forest Carbon Sequestration Agent',
          type: AgentType.CARBON_SEQUESTER,
          walletAddress: '0x...',
          capabilities: [AgentCapability.GENERATE_CREDITS, AgentCapability.SELL_CREDITS, AgentCapability.MONITOR_IOT],
          settings: {
            maxTransactionAmount: 1000,
            riskTolerance: 'MEDIUM',
            humanApprovalRequired: true,
            autoTradingEnabled: true,
            priceRange: { min: 0.5, max: 2.0 },
            creditTypes: ['SEQUESTER'],
          },
          monitoredDevices: ['DEVICE_001', 'DEVICE_002'],
          creditGenerationThresholds: {
            co2Reduction: 1000,
            energyGeneration: 500,
            timeWindow: 3600,
          },
          creditPricing: {
            basePrice: 1.0,
            priceVariation: 10,
          },
        },
      ],
      offset: [
        {
          id: 'offset_001',
          name: 'Industrial Carbon Offset Agent',
          type: AgentType.CARBON_OFFSETTER,
          walletAddress: '0x...',
          capabilities: [AgentCapability.BUY_CREDITS, AgentCapability.RISK_ASSESSMENT],
          settings: {
            maxTransactionAmount: 2000,
            riskTolerance: 'LOW',
            humanApprovalRequired: true,
            autoTradingEnabled: true,
            priceRange: { min: 0.8, max: 1.5 },
            creditTypes: ['SEQUESTER'],
          },
          emissionSources: ['FACTORY_001', 'POWER_PLANT_001'],
          offsetTargets: {
            monthlyTarget: 1000,
            urgencyLevel: 'MEDIUM',
          },
          budget: {
            monthlyBudget: 1500,
            maxPricePerCredit: 1.2,
          },
          creditPreferences: {
            preferredTypes: ['SEQUESTER'],
            qualityRequirements: 'HIGH',
          },
        },
      ],
      trading: [
        {
          id: 'trader_001',
          name: 'Carbon Credit Market Maker',
          type: AgentType.CARBON_TRADER,
          walletAddress: '0x...',
          capabilities: [AgentCapability.PRICE_DISCOVERY, AgentCapability.BUY_CREDITS, AgentCapability.SELL_CREDITS],
          settings: {
            maxTransactionAmount: 5000,
            riskTolerance: 'HIGH',
            humanApprovalRequired: false,
            autoTradingEnabled: true,
            priceRange: { min: 0.1, max: 5.0 },
            creditTypes: ['SEQUESTER', 'EMITTER'],
          },
          marketMaking: {
            spreadPercentage: 2.0,
            maxInventory: 2000,
            minInventory: 100,
          },
          priceDiscovery: {
            updateInterval: 10000,
            volatilityThreshold: 5.0,
          },
          riskManagement: {
            maxPositionSize: 1000,
            stopLossPercentage: 10.0,
          },
        },
      ],
    },
    ecosystem: {
      enableHumanInTheLoop: true,
      maxTransactionAmount: 10000,
      emergencyStopEnabled: true,
    },
  };
}
