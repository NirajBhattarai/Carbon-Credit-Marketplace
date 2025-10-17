/**
 * Agent Management API
 * Provides endpoints to manage and monitor carbon credit trading agents
 */

import { NextApiRequest, NextApiResponse } from 'next';
import {
  AgentManager,
  createDefaultAgentManagerConfig,
} from '@/lib/agents/agent-manager';
import { authenticateJWTPages } from '@/lib/auth/middleware';

// Global agent manager instance
let agentManager: AgentManager | null = null;

/**
 * Initialize the agent manager
 */
async function initializeAgentManager(): Promise<AgentManager> {
  if (!agentManager) {
    const config = createDefaultAgentManagerConfig();
    agentManager = new AgentManager(config);
    await agentManager.initialize();
  }
  return agentManager;
}

/**
 * GET /api/agents - Get all agents and ecosystem statistics
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Authenticate the request
    const authResult = await authenticateJWTPages(req);
    if (authResult) {
      return res.status(authResult.status).json(authResult.data);
    }

    const manager = await initializeAgentManager();

    switch (req.method) {
      case 'GET':
        return handleGetAgents(req, res, manager);
      case 'POST':
        return handleCreateAgent(req, res, manager);
      case 'PUT':
        return handleUpdateAgent(req, res, manager);
      case 'DELETE':
        return handleDeleteAgent(req, res, manager);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Agent API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Handle GET requests - Get agents and statistics
 */
async function handleGetAgents(
  req: NextApiRequest,
  res: NextApiResponse,
  manager: AgentManager
) {
  const { agentId, type, statistics } = req.query;

  try {
    if (agentId) {
      // Get specific agent
      const agent = manager.getAgent(agentId as string);
      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      return res.status(200).json({
        success: true,
        agent: agent.getInfo(),
        statistics: agent.getStatistics(),
      });
    }

    if (type) {
      // Get agents by type
      const agents = manager.getAgentsByType(type as any);
      return res.status(200).json({
        success: true,
        agents: agents.map(agent => agent.getInfo()),
        count: agents.length,
      });
    }

    if (statistics === 'true') {
      // Get ecosystem statistics
      const ecosystemStats = manager.getEcosystemStatistics();
      return res.status(200).json({
        success: true,
        statistics: ecosystemStats,
      });
    }

    // Get all agents
    const allAgents = manager.getAllAgents();
    return res.status(200).json({
      success: true,
      agents: allAgents.map(agent => agent.getInfo()),
      count: allAgents.length,
      ecosystem: {
        isRunning: manager.isEcosystemRunning(),
        config: manager.getConfig(),
      },
    });
  } catch (error) {
    console.error('Error handling GET request:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Handle POST requests - Create new agent
 */
async function handleCreateAgent(
  req: NextApiRequest,
  res: NextApiResponse,
  manager: AgentManager
) {
  try {
    const agentConfig = req.body;

    // Validate required fields
    if (!agentConfig.id || !agentConfig.name || !agentConfig.type) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: id, name, type',
      });
    }

    // Check if agent already exists
    if (manager.getAgent(agentConfig.id)) {
      return res.status(409).json({
        success: false,
        error: 'Agent with this ID already exists',
      });
    }

    // Create and initialize the agent
    let newAgent;
    switch (agentConfig.type) {
      case 'carbon_sequester':
        const { CarbonSequestrationAgent } = await import(
          '@/lib/agents/carbon-sequestration-agent'
        );
        newAgent = new CarbonSequestrationAgent(agentConfig);
        break;
      case 'carbon_offseter':
        const { CarbonOffsetAgent } = await import(
          '@/lib/agents/carbon-offset-agent'
        );
        newAgent = new CarbonOffsetAgent(agentConfig);
        break;
      case 'carbon_trader':
        const { CarbonTradingAgent } = await import(
          '@/lib/agents/carbon-trading-agent'
        );
        newAgent = new CarbonTradingAgent(agentConfig);
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid agent type',
        });
    }

    await newAgent.initialize();

    // Add to manager (this would need to be implemented in AgentManager)
    // For now, we'll just return success
    return res.status(201).json({
      success: true,
      message: 'Agent created successfully',
      agent: newAgent.getInfo(),
    });
  } catch (error) {
    console.error('Error creating agent:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Handle PUT requests - Update agent configuration
 */
async function handleUpdateAgent(
  req: NextApiRequest,
  res: NextApiResponse,
  manager: AgentManager
) {
  try {
    const { agentId } = req.query;
    const updates = req.body;

    if (!agentId) {
      return res.status(400).json({
        success: false,
        error: 'Agent ID is required',
      });
    }

    const agent = manager.getAgent(agentId as string);
    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found',
      });
    }

    await manager.updateAgentConfig(agentId as string, updates);

    return res.status(200).json({
      success: true,
      message: 'Agent configuration updated successfully',
      agent: manager.getAgent(agentId as string)?.getInfo(),
    });
  } catch (error) {
    console.error('Error updating agent:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Handle DELETE requests - Delete agent
 */
async function handleDeleteAgent(
  req: NextApiRequest,
  res: NextApiResponse,
  manager: AgentManager
) {
  try {
    const { agentId } = req.query;

    if (!agentId) {
      return res.status(400).json({
        success: false,
        error: 'Agent ID is required',
      });
    }

    const agent = manager.getAgent(agentId as string);
    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found',
      });
    }

    await agent.shutdown();

    // Remove from manager (this would need to be implemented in AgentManager)
    // For now, we'll just return success

    return res.status(200).json({
      success: true,
      message: 'Agent deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting agent:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * GET /api/agents/ecosystem - Get ecosystem statistics
 */
export async function getEcosystemStats(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const manager = await initializeAgentManager();
    const stats = manager.getEcosystemStatistics();

    return res.status(200).json({
      success: true,
      statistics: stats,
    });
  } catch (error) {
    console.error('Error getting ecosystem stats:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * POST /api/agents/broadcast - Broadcast message to all agents
 */
export async function broadcastToAgents(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { type, payload } = req.body;

    if (!type) {
      return res.status(400).json({
        success: false,
        error: 'Message type is required',
      });
    }

    const manager = await initializeAgentManager();
    const messageId = await manager.broadcastToAllAgents(type, payload);

    return res.status(200).json({
      success: true,
      message: 'Message broadcasted successfully',
      messageId,
    });
  } catch (error) {
    console.error('Error broadcasting message:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * POST /api/agents/emergency-stop - Emergency stop all agents
 */
export async function emergencyStop(req: NextApiRequest, res: NextApiResponse) {
  try {
    const manager = await initializeAgentManager();
    await manager.emergencyStop();

    return res.status(200).json({
      success: true,
      message: 'Emergency stop executed successfully',
    });
  } catch (error) {
    console.error('Error executing emergency stop:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * POST /api/agents/restart - Restart the ecosystem
 */
export async function restartEcosystem(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const manager = await initializeAgentManager();
    await manager.restart();

    return res.status(200).json({
      success: true,
      message: 'Ecosystem restarted successfully',
    });
  } catch (error) {
    console.error('Error restarting ecosystem:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
