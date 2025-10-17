/**
 * Agent Ecosystem with Chat Interface
 * Provides a conversational interface to communicate with A2A agents
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { AgentManager } from '@/lib/agents/agent-manager';
import { MessageType } from '@/lib/agents/base-agent';
import {
  initializeLLM,
  createHederaToolkit,
  createChatPrompt,
  createAgentExecutorWithPrompt,
  extractResultFromResponse,
} from '@/lib/hedera/agent-factory';
import {
  RequestSchema,
  createErrorResponse,
  createSuccessResponse,
  transformMessagesToHistory,
} from '@/lib/hedera/api-utils';

// Global agent manager instance
let agentManager: AgentManager | null = null;

async function initializeAgentManager(): Promise<AgentManager> {
  if (!agentManager) {
    // Create agent ecosystem configuration
    const config = {
      agents: {
        sequestration: [
          {
            id: 'seq-001',
            name: 'Amazon Rainforest Project',
            walletAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
            agentType: 'CARBON_SEQUESTER' as any,
            capabilities: [
              'GENERATE_CREDITS',
              'PRICE_DISCOVERY',
              'RISK_MANAGEMENT',
            ],
            settings: {
              isActive: true,
              maxTransactionAmount: 1000,
              minTransactionAmount: 10,
              priceVolatility: 0.1,
              humanApprovalRequired: false,
              riskThreshold: 0.8,
            },
            sequestrationSettings: {
              projectName: 'Amazon Rainforest Project',
              location: 'Amazon Rainforest, Brazil',
              creditGenerationRate: 20,
              basePricePerCredit: 5.5,
              maxCreditsPerOffer: 100,
              minCreditsPerOffer: 10,
              qualityThreshold: 85,
            },
          },
        ],
        offset: [
          {
            id: 'offset-001',
            name: 'TechCorp Carbon Offset',
            walletAddress: '0x8ba1f109551bD432803012645Hac136c',
            agentType: 'CARBON_OFFSETTER' as any,
            capabilities: [
              'PURCHASE_CREDITS',
              'BUDGET_MANAGEMENT',
              'OFFSET_TRACKING',
            ],
            settings: {
              isActive: true,
              maxTransactionAmount: 500,
              minTransactionAmount: 5,
              priceVolatility: 0.05,
              humanApprovalRequired: true,
              riskThreshold: 0.9,
            },
            offsetSettings: {
              organizationName: 'TechCorp Inc',
              industry: 'Technology',
              monthlyBudget: 1000,
              targetOffsetAmount: 200,
              maxPricePerCredit: 6.0,
              preferredCreditTypes: ['HIGH', 'MEDIUM'],
              urgencyLevel: 'MEDIUM' as const,
            },
          },
        ],
        trading: [
          {
            id: 'trader-001',
            name: 'Carbon Market Maker',
            walletAddress: '0x1234567890123456789012345678901234567890',
            agentType: 'CARBON_TRADER' as any,
            capabilities: ['TRADE_CREDITS', 'PRICE_DISCOVERY', 'MARKET_MAKING'],
            settings: {
              isActive: true,
              maxTransactionAmount: 2000,
              minTransactionAmount: 1,
              priceVolatility: 0.15,
              humanApprovalRequired: false,
              riskThreshold: 0.7,
            },
            tradingSettings: {
              tradingStrategy: 'MARKET_MAKER' as const,
              maxPositionSize: 100,
              minSpread: 0.1,
              maxSpread: 0.5,
              riskTolerance: 'MEDIUM' as const,
              tradingHours: { start: 9, end: 17 },
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

    agentManager = new AgentManager(config);
    await agentManager.initialize();
  }
  return agentManager;
}

/**
 * Chat message interface
 */
interface ChatMessage {
  id: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  timestamp: number;
  agentId?: string;
  messageType?: string;
}

/**
 * POST /api/agent-ecosystem/chat - Chat with agents
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const manager = await initializeAgentManager();

    switch (req.method) {
      case 'POST':
        return handleChatMessage(req, res, manager);
      case 'GET':
        return handleGetChatHistory(req, res, manager);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Agent Ecosystem Chat API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Handle chat messages
 */
async function handleChatMessage(
  req: NextApiRequest,
  res: NextApiResponse,
  manager: AgentManager
) {
  try {
    const { message, agentId, action } = req.body;

    if (!message && !action) {
      return res.status(400).json({
        success: false,
        error: 'Message or action is required',
      });
    }

    const allAgents = manager.getAllAgents();
    const responses: ChatMessage[] = [];

    // Handle specific actions
    if (action) {
      switch (action) {
        case 'list_agents':
          const agentList = allAgents.map(agent => ({
            id: agent.getInfo().id,
            name: agent.getInfo().name,
            type: agent.getInfo().type,
            isOnline: agent.getState().isOnline,
            capabilities: agent.getInfo().capabilities,
          }));

          responses.push({
            id: `msg_${Date.now()}`,
            role: 'system',
            content: `Available agents:\n${agentList.map(a => `- ${a.name} (${a.type}) - ${a.isOnline ? 'Online' : 'Offline'}`).join('\n')}`,
            timestamp: Date.now(),
          });
          break;

        case 'ecosystem_status':
          const ecosystemStats = manager.getEcosystemStatistics();
          responses.push({
            id: `msg_${Date.now()}`,
            role: 'system',
            content: `Ecosystem Status:\n- Total Agents: ${allAgents.length}\n- Running: ${manager.isEcosystemRunning()}\n- Total Credits: ${ecosystemStats.totalCredits}\n- Total Transactions: ${ecosystemStats.totalTransactions}`,
            timestamp: Date.now(),
          });
          break;

        case 'run_test':
          // Run a quick test scenario
          const sequestrationAgent = allAgents.find(
            a => a.getInfo().type === 'CARBON_SEQUESTER'
          );
          const offsetAgent = allAgents.find(
            a => a.getInfo().type === 'CARBON_OFFSETTER'
          );

          if (sequestrationAgent && offsetAgent) {
            const testMessage = {
              from: offsetAgent.getInfo().id,
              to: sequestrationAgent.getInfo().id,
              type: MessageType.CREDIT_REQUEST,
              payload: {
                creditAmount: 20,
                maxPricePerCredit: 6.0,
                buyerAgentId: offsetAgent.getInfo().id,
                urgency: 'MEDIUM',
                deadline: Date.now() + 300000,
              },
            };

            await sequestrationAgent.processMessage({
              ...testMessage,
              id: `test_${Date.now()}`,
              timestamp: Date.now(),
            });

            responses.push({
              id: `msg_${Date.now()}`,
              role: 'system',
              content: `🧪 Test executed! ${offsetAgent.getInfo().name} sent a credit request for 20 credits to ${sequestrationAgent.getInfo().name}. Check the terminal for agent responses!`,
              timestamp: Date.now(),
            });
          }
          break;

        case 'performance':
          const performanceData = allAgents.map(agent => ({
            name: agent.getInfo().name,
            type: agent.getInfo().type,
            stats: agent.getStatistics(),
          }));

          responses.push({
            id: `msg_${Date.now()}`,
            role: 'system',
            content: `📈 Agent Performance:\n\n${performanceData
              .map(
                p =>
                  `**${p.name}** (${p.type})\n` +
                  `• Credits: ${p.stats.credits}\n` +
                  `• HBAR Balance: ${p.stats.hbarBalance}\n` +
                  `• Transactions: ${p.stats.totalTransactions}\n` +
                  `• Revenue: ${p.stats.performance?.totalRevenue || 0} HBAR\n`
              )
              .join('\n')}`,
            timestamp: Date.now(),
          });
          break;

        case 'market_data':
          const tradingAgent = allAgents.find(
            a => a.getInfo().type === 'CARBON_TRADER'
          );
          if (tradingAgent && 'getMarketSummary' in tradingAgent) {
            const marketSummary = (tradingAgent as any).getMarketSummary();
            responses.push({
              id: `msg_${Date.now()}`,
              role: 'system',
              content:
                `💹 Market Data:\n\n` +
                `• Last Price: ${marketSummary.marketData?.lastPrice || 'N/A'} HBAR\n` +
                `• Bid Price: ${marketSummary.marketData?.bidPrice || 'N/A'} HBAR\n` +
                `• Ask Price: ${marketSummary.marketData?.askPrice || 'N/A'} HBAR\n` +
                `• Volume 24h: ${marketSummary.marketData?.volume24h || 'N/A'}\n` +
                `• Active Orders: ${marketSummary.activeOrders || 0}\n` +
                `• Trading Strategy: ${marketSummary.tradingStrategy || 'N/A'}`,
              timestamp: Date.now(),
            });
          } else {
            responses.push({
              id: `msg_${Date.now()}`,
              role: 'system',
              content: `❌ Trading agent not available for market data`,
              timestamp: Date.now(),
            });
          }
          break;
      }
    }

    // Handle Hedera Agent Kit integration
    if (message) {
      const lowerMessage = message.toLowerCase();
      
      if (
        lowerMessage.includes('hedera') ||
        lowerMessage.includes('hbar') ||
        lowerMessage.includes('token') ||
        lowerMessage.includes('balance')
      ) {
      try {
        const { bootstrap, tools } = createHederaToolkit();
        const historyMessages = transformMessagesToHistory([]);

        const systemPrompt = `You are a Hedera-powered AI assistant specialized in carbon credit trading and blockchain operations. 
        
You can help with:
- Checking HBAR balances and account information
- Creating and managing carbon credit tokens (HTS)
- Transferring HBAR and tokens
- Creating consensus topics for carbon credit transactions
- Querying Hedera network data
- Managing carbon credit portfolios

Always provide clear, helpful responses about Hedera operations and carbon credit trading.`;

        const chatPrompt = createChatPrompt(systemPrompt);
        const llm = initializeLLM();
        const executor = createAgentExecutorWithPrompt(
          llm,
          tools,
          chatPrompt,
          false
        );

        const response = await executor.invoke({
          input: message,
          history: historyMessages,
        });
        const result = extractResultFromResponse(response);

        responses.push({
          id: `msg_${Date.now()}`,
          role: 'system',
          content: `🔗 **Hedera Agent Kit Response:**\n\n${result}`,
          timestamp: Date.now(),
        });
      } catch (error) {
        responses.push({
          id: `msg_${Date.now()}`,
          role: 'system',
          content: `❌ Hedera Agent Kit Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: Date.now(),
        });
      }

      // Parse user intent
      if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
        responses.push({
          id: `msg_${Date.now()}`,
          role: 'system',
          content:
            'Hello! I\'m the Agent Ecosystem. I can help you communicate with carbon credit trading agents. Try asking me to "list agents", "check status", or "run test".',
          timestamp: Date.now(),
        });
      } else if (
        lowerMessage.includes('list') &&
        lowerMessage.includes('agent')
      ) {
        const agentList = allAgents.map(agent => ({
          id: agent.getInfo().id,
          name: agent.getInfo().name,
          type: agent.getInfo().type,
          isOnline: agent.getState().isOnline,
        }));

        responses.push({
          id: `msg_${Date.now()}`,
          role: 'system',
          content: `Here are the available agents:\n${agentList.map(a => `- ${a.name} (${a.type}) - ${a.isOnline ? '🟢 Online' : '🔴 Offline'}`).join('\n')}`,
          timestamp: Date.now(),
        });
      } else if (
        lowerMessage.includes('status') ||
        lowerMessage.includes('how are')
      ) {
        const ecosystemStats = manager.getEcosystemStatistics();
        responses.push({
          id: `msg_${Date.now()}`,
          role: 'system',
          content: `Ecosystem Status:\n🟢 Running: ${manager.isEcosystemRunning()}\n👥 Total Agents: ${allAgents.length}\n💰 Total Credits: ${ecosystemStats.totalCredits}\n📊 Total Transactions: ${ecosystemStats.totalTransactions}\n💵 Total Revenue: ${ecosystemStats.totalRevenue} HBAR`,
          timestamp: Date.now(),
        });
      } else if (
        lowerMessage.includes('test') ||
        lowerMessage.includes('run')
      ) {
        // Run a quick test
        const sequestrationAgent = allAgents.find(
          a => a.getInfo().type === 'CARBON_SEQUESTER'
        );
        const offsetAgent = allAgents.find(
          a => a.getInfo().type === 'CARBON_OFFSETTER'
        );

        if (sequestrationAgent && offsetAgent) {
          const testMessage = {
            from: offsetAgent.getInfo().id,
            to: sequestrationAgent.getInfo().id,
            type: MessageType.CREDIT_REQUEST,
            payload: {
              creditAmount: 25,
              maxPricePerCredit: 6.0,
              buyerAgentId: offsetAgent.getInfo().id,
              urgency: 'MEDIUM',
              deadline: Date.now() + 300000,
            },
          };

          await sequestrationAgent.processMessage({
            ...testMessage,
            id: `test_${Date.now()}`,
            timestamp: Date.now(),
          });

          responses.push({
            id: `msg_${Date.now()}`,
            role: 'system',
            content: `🧪 Test executed! ${offsetAgent.getInfo().name} sent a credit request for 25 credits to ${sequestrationAgent.getInfo().name}. Check the terminal for agent responses!`,
            timestamp: Date.now(),
          });
        }
      } else if (
        lowerMessage.includes('send') &&
        lowerMessage.includes('message')
      ) {
        // Parse message sending request
        const parts = message.split(' ');
        const sendIndex = parts.findIndex(p => p.toLowerCase() === 'send');

        if (sendIndex !== -1 && parts[sendIndex + 1] && parts[sendIndex + 2]) {
          const messageType = parts[sendIndex + 1].toUpperCase();
          const targetAgent = parts[sendIndex + 2];

          const agent = allAgents.find(
            a =>
              a.getInfo().id === targetAgent ||
              a.getInfo().name.toLowerCase().includes(targetAgent.toLowerCase())
          );

          if (
            agent &&
            Object.values(MessageType).includes(messageType as MessageType)
          ) {
            // Send the message
            const testPayload = {
              creditAmount: 15,
              maxPricePerCredit: 5.5,
              buyerAgentId: 'user',
              urgency: 'MEDIUM',
              deadline: Date.now() + 300000,
            };

            await agent.processMessage({
              id: `chat_${Date.now()}`,
              from: 'user',
              to: agent.getInfo().id,
              type: messageType as MessageType,
              payload: testPayload,
              timestamp: Date.now(),
            });

            responses.push({
              id: `msg_${Date.now()}`,
              role: 'system',
              content: `📤 Message sent! Sent ${messageType} to ${agent.getInfo().name}`,
              timestamp: Date.now(),
            });
          } else {
            responses.push({
              id: `msg_${Date.now()}`,
              role: 'system',
              content: `❌ Agent not found or invalid message type. Available agents: ${allAgents.map(a => a.getInfo().id).join(', ')}`,
              timestamp: Date.now(),
            });
          }
        }
      } else if (
        lowerMessage.includes('performance') ||
        lowerMessage.includes('metrics')
      ) {
        const performanceData = allAgents.map(agent => ({
          name: agent.getInfo().name,
          type: agent.getInfo().type,
          stats: agent.getStatistics(),
        }));

        responses.push({
          id: `msg_${Date.now()}`,
          role: 'system',
          content: `📈 Agent Performance Metrics:\n\n${performanceData
            .map(
              p =>
                `**${p.name}** (${p.type})\n` +
                `• Credits: ${p.stats.credits}\n` +
                `• HBAR Balance: ${p.stats.hbarBalance}\n` +
                `• Transactions: ${p.stats.totalTransactions}\n` +
                `• Revenue: ${p.stats.performance?.totalRevenue || 0} HBAR\n`
            )
            .join('\n')}`,
          timestamp: Date.now(),
        });
      } else if (
        lowerMessage.includes('market') ||
        lowerMessage.includes('price') ||
        lowerMessage.includes('data')
      ) {
        const tradingAgent = allAgents.find(
          a => a.getInfo().type === 'CARBON_TRADER'
        );
        if (tradingAgent && 'getMarketSummary' in tradingAgent) {
          const marketSummary = (tradingAgent as any).getMarketSummary();
          responses.push({
            id: `msg_${Date.now()}`,
            role: 'system',
            content:
              `💹 Market Data:\n\n` +
              `• Last Price: ${marketSummary.marketData?.lastPrice || 'N/A'} HBAR\n` +
              `• Bid Price: ${marketSummary.marketData?.bidPrice || 'N/A'} HBAR\n` +
              `• Ask Price: ${marketSummary.marketData?.askPrice || 'N/A'} HBAR\n` +
              `• Volume 24h: ${marketSummary.marketData?.volume24h || 'N/A'}\n` +
              `• Active Orders: ${marketSummary.activeOrders || 0}\n` +
              `• Trading Strategy: ${marketSummary.tradingStrategy || 'N/A'}`,
            timestamp: Date.now(),
          });
        } else {
          responses.push({
            id: `msg_${Date.now()}`,
            role: 'system',
            content: `❌ Trading agent not available for market data`,
            timestamp: Date.now(),
          });
        }
      } else if (
        lowerMessage.includes('simulate') ||
        lowerMessage.includes('transaction')
      ) {
        // Simulate a complete transaction flow
        const sequestrationAgent = allAgents.find(
          a => a.getInfo().type === 'CARBON_SEQUESTER'
        );
        const offsetAgent = allAgents.find(
          a => a.getInfo().type === 'CARBON_OFFSETTER'
        );
        const tradingAgent = allAgents.find(
          a => a.getInfo().type === 'CARBON_TRADER'
        );

        if (sequestrationAgent && offsetAgent && tradingAgent) {
          // Step 1: Credit request
          const creditRequest = {
            from: offsetAgent.getInfo().id,
            to: sequestrationAgent.getInfo().id,
            type: MessageType.CREDIT_REQUEST,
            payload: {
              creditAmount: 30,
              maxPricePerCredit: 6.0,
              buyerAgentId: offsetAgent.getInfo().id,
              urgency: 'HIGH',
              deadline: Date.now() + 300000,
            },
          };

          await sequestrationAgent.processMessage({
            ...creditRequest,
            id: `sim_${Date.now()}`,
            timestamp: Date.now(),
          });

          // Step 2: Price negotiation
          const priceNegotiation = {
            from: tradingAgent.getInfo().id,
            to: sequestrationAgent.getInfo().id,
            type: MessageType.PRICE_NEGOTIATION,
            payload: {
              proposedPrice: 5.5,
              reasoning: 'Market analysis shows optimal pricing',
            },
          };

          await sequestrationAgent.processMessage({
            ...priceNegotiation,
            id: `sim_${Date.now()}_2`,
            timestamp: Date.now(),
          });

          responses.push({
            id: `msg_${Date.now()}`,
            role: 'system',
            content:
              `🔄 Complete Transaction Simulation:\n\n` +
              `1. ✅ ${offsetAgent.getInfo().name} requested 30 credits\n` +
              `2. ✅ ${tradingAgent.getInfo().name} negotiated price at 5.5 HBAR\n` +
              `3. ✅ Transaction flow initiated\n\n` +
              `Check the terminal for detailed agent responses!`,
            timestamp: Date.now(),
          });
        } else {
          responses.push({
            id: `msg_${Date.now()}`,
            role: 'system',
            content: `❌ Not all agents available for transaction simulation`,
            timestamp: Date.now(),
          });
        }
      } else if (lowerMessage.includes('help')) {
        responses.push({
          id: `msg_${Date.now()}`,
          role: 'system',
          content:
            `🤖 Agent Ecosystem Commands:\n\n` +
            `📋 **Agent Management**\n` +
            `• "list agents" - Show all available agents\n` +
            `• "check status" - Show ecosystem status\n` +
            `• "agent details [ID]" - Get specific agent info\n\n` +
            `🧪 **Testing & Communication**\n` +
            `• "run test" - Execute a test scenario\n` +
            `• "simulate transaction" - Run complete transaction flow\n` +
            `• "send [MESSAGE_TYPE] [AGENT_ID]" - Send messages to agents\n\n` +
            `📊 **Monitoring**\n` +
            `• "performance" - View agent performance metrics\n` +
            `• "market data" - Get current market information\n` +
            `• "transactions" - See recent transaction history\n\n` +
            `🔗 **Hedera Integration**\n` +
            `• "check my balance" - Get HBAR balance\n` +
            `• "create carbon token" - Create carbon credit token\n` +
            `• "transfer HBAR" - Transfer HBAR tokens\n` +
            `• "hedera help" - Hedera-specific commands\n\n` +
            `💬 **Natural Language**\n` +
            `• "How are the agents doing?"\n` +
            `• "What's the current status?"\n` +
            `• "Can you run a test?"\n\n` +
            `Available message types: CREDIT_REQUEST, PRICE_NEGOTIATION, TRANSACTION_PROPOSAL, HEARTBEAT`,
          timestamp: Date.now(),
        });
      } else {
        // Default response for unrecognized messages
        responses.push({
          id: `msg_${Date.now()}`,
          role: 'system',
          content:
            `I didn't understand that. Here are some things you can try:\n\n` +
            `• "list agents" - See all agents\n` +
            `• "check status" - View ecosystem health\n` +
            `• "run test" - Execute test scenario\n` +
            `• "performance" - View metrics\n` +
            `• "market data" - Get market info\n` +
            `• "simulate transaction" - Run transaction flow\n` +
            `• "help" - Show all commands`,
          timestamp: Date.now(),
        });
      }
    }
  }

    return res.status(200).json({
      success: true,
      responses,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error handling chat message:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Handle get chat history
 */
async function handleGetChatHistory(
  req: NextApiRequest,
  res: NextApiResponse,
  manager: AgentManager
) {
  try {
    const allAgents = manager.getAllAgents();
    const ecosystemStats = manager.getEcosystemStatistics();

    return res.status(200).json({
      success: true,
      agents: allAgents.map(agent => ({
        id: agent.getInfo().id,
        name: agent.getInfo().name,
        type: agent.getInfo().type,
        isOnline: agent.getState().isOnline,
        capabilities: agent.getInfo().capabilities,
        statistics: agent.getStatistics(),
      })),
      ecosystem: {
        isRunning: manager.isEcosystemRunning(),
        totalAgents: allAgents.length,
        statistics: ecosystemStats,
      },
      availableCommands: [
        'list agents',
        'check status',
        'run test',
        'send [MESSAGE_TYPE] [AGENT_ID]',
        'help',
      ],
    });
  } catch (error) {
    console.error('Error getting chat history:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
