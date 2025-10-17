/**
 * Agent Ecosystem Dashboard
 * Displays real-time information about carbon credit trading agents
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface AgentInfo {
  id: string;
  name: string;
  type: string;
  status: string;
  credits: number;
  hbarBalance: number;
  performance: {
    totalTrades: number;
    successfulTrades: number;
    totalVolume: number;
    averagePrice: number;
  };
}

interface EcosystemStats {
  ecosystem: {
    totalAgents: number;
    totalCredits: number;
    totalHbarBalance: number;
    totalTrades: number;
    totalVolume: number;
    averagePrice: number;
  };
  agents: AgentInfo[];
}

export function AgentEcosystemDashboard() {
  const [stats, setStats] = useState<EcosystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  // Fetch ecosystem statistics
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/agents?statistics=true');
      const data = await response.json();
      
      if (data.success) {
        setStats(data.statistics);
        setIsRunning(data.statistics.ecosystem.isRunning);
      } else {
        setError(data.error || 'Failed to fetch statistics');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Emergency stop
  const handleEmergencyStop = async () => {
    try {
      const response = await fetch('/api/agents/emergency-stop', {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.success) {
        setIsRunning(false);
        await fetchStats(); // Refresh stats
      } else {
        setError(data.error || 'Failed to execute emergency stop');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  // Restart ecosystem
  const handleRestart = async () => {
    try {
      const response = await fetch('/api/agents/restart', {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.success) {
        setIsRunning(true);
        await fetchStats(); // Refresh stats
      } else {
        setError(data.error || 'Failed to restart ecosystem');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  // Fetch stats on component mount and every 30 seconds
  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
        <span className="ml-2">Loading agent ecosystem...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-red-800 font-semibold">Error</h3>
        <p className="text-red-600">{error}</p>
        <Button onClick={fetchStats} className="mt-2">
          Retry
        </Button>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-gray-600">No ecosystem data available</p>
      </div>
    );
  }

  const getAgentTypeColor = (type: string) => {
    switch (type) {
      case 'carbon_sequester':
        return 'bg-green-100 text-green-800';
      case 'carbon_offseter':
        return 'bg-blue-100 text-blue-800';
      case 'carbon_trader':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'INACTIVE':
        return 'bg-red-100 text-red-800';
      case 'ERROR':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Agent Ecosystem</h1>
          <p className="text-gray-600">Carbon Credit Trading Agents Dashboard</p>
        </div>
        <div className="flex space-x-2">
          <Badge className={isRunning ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
            {isRunning ? 'Running' : 'Stopped'}
          </Badge>
          <Button
            onClick={handleEmergencyStop}
            variant="destructive"
            disabled={!isRunning}
          >
            Emergency Stop
          </Button>
          <Button
            onClick={handleRestart}
            disabled={isRunning}
          >
            Restart
          </Button>
        </div>
      </div>

      {/* Ecosystem Overview */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Ecosystem Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.ecosystem.totalAgents}</div>
            <div className="text-sm text-gray-600">Total Agents</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.ecosystem.totalCredits.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total Credits</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.ecosystem.totalHbarBalance.toFixed(2)}</div>
            <div className="text-sm text-gray-600">HBAR Balance</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.ecosystem.totalTrades}</div>
            <div className="text-sm text-gray-600">Total Trades</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">{stats.ecosystem.totalVolume.toFixed(2)}</div>
            <div className="text-sm text-gray-600">Total Volume</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-pink-600">{stats.ecosystem.averagePrice.toFixed(3)}</div>
            <div className="text-sm text-gray-600">Avg Price</div>
          </div>
        </div>
      </Card>

      {/* Agents List */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Active Agents</h2>
        <div className="space-y-4">
          {stats.agents.map((agent) => (
            <div key={agent.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <h3 className="font-semibold text-lg">{agent.name}</h3>
                  <Badge className={getAgentTypeColor(agent.type)}>
                    {agent.type.replace('_', ' ').toUpperCase()}
                  </Badge>
                  <Badge className={getStatusColor(agent.status)}>
                    {agent.status}
                  </Badge>
                </div>
                <div className="text-sm text-gray-500">
                  ID: {agent.id}
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Credits:</span>
                  <span className="ml-1 font-semibold">{agent.credits}</span>
                </div>
                <div>
                  <span className="text-gray-600">HBAR Balance:</span>
                  <span className="ml-1 font-semibold">{agent.hbarBalance.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Trades:</span>
                  <span className="ml-1 font-semibold">{agent.performance.totalTrades}</span>
                </div>
                <div>
                  <span className="text-gray-600">Volume:</span>
                  <span className="ml-1 font-semibold">{agent.performance.totalVolume.toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Real-time Updates */}
      <div className="text-center text-sm text-gray-500">
        Last updated: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
}
