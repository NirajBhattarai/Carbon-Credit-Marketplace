'use client';

/**
 * Agent Ecosystem Chat Interface
 * Provides a conversational interface to communicate with A2A agents
 */

import React, { useState, useEffect, useRef } from 'react';

interface ChatMessage {
  id: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  timestamp: number;
  agentId?: string;
  messageType?: string;
}

interface Agent {
  id: string;
  name: string;
  type: string;
  isOnline: boolean;
  capabilities: string[];
  statistics: any;
}

export default function AgentEcosystemChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize chat with welcome message
  useEffect(() => {
    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      role: 'system',
      content: `🤖 Welcome to the Agent Ecosystem Chat!

I'm your interface to communicate with carbon credit trading agents. Here's what you can do:

📋 **Agent Management**
• "list agents" - Show all available agents
• "check status" - View ecosystem health
• "agent details [ID]" - Get specific agent info

🧪 **Testing & Communication**
• "run test" - Execute a test scenario
• "send [MESSAGE_TYPE] [AGENT_ID]" - Send messages to agents
• "simulate transaction" - Run a complete transaction flow

📊 **Monitoring**
• "performance" - View agent performance metrics
• "transactions" - See recent transaction history
• "market data" - Get current market information

💬 **Natural Language**
• "How are the agents doing?"
• "What's the current status?"
• "Can you run a test?"

🔗 **Hedera Integration**
• "check my balance" - Get HBAR balance
• "create carbon token" - Create carbon credit token
• "transfer HBAR" - Transfer HBAR tokens
• "hedera help" - Hedera-specific commands

Type "help" for more commands or use the quick action buttons!`,
      timestamp: Date.now(),
    };
    setMessages([welcomeMessage]);
    loadAgents();
  }, []);

  // Load available agents
  const loadAgents = async () => {
    try {
      const response = await fetch('/api/agent-ecosystem/chat');
      const data = await response.json();

      if (data.success) {
        setAgents(data.agents);
        setIsConnected(true);
      }
    } catch (error) {
      console.error('Error loading agents:', error);
      setIsConnected(false);
    }
  };

  // Send message to agent ecosystem
  const sendMessage = async (message: string) => {
    if (!message.trim()) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/agent-ecosystem/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      const data = await response.json();

      if (data.success && data.responses) {
        setMessages(prev => [...prev, ...data.responses]);
      } else {
        const errorMessage: ChatMessage = {
          id: `error_${Date.now()}`,
          role: 'system',
          content: `❌ Error: ${data.error || 'Failed to process message'}`,
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        role: 'system',
        content: `❌ Network error: ${(error as Error).message}`,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle quick actions
  const handleQuickAction = async (action: string) => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/agent-ecosystem/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();

      if (data.success && data.responses) {
        setMessages(prev => [...prev, ...data.responses]);
      }
    } catch (error) {
      console.error('Error executing quick action:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Format timestamp
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className='flex h-screen bg-gray-100'>
      {/* Sidebar */}
      <div className='w-80 bg-white shadow-lg p-4'>
        <h2 className='text-xl font-bold mb-4'>Agent Ecosystem</h2>

        {/* Connection Status */}
        <div className='mb-4'>
          <div
            className={`flex items-center ${isConnected ? 'text-green-600' : 'text-red-600'}`}
          >
            <div
              className={`w-3 h-3 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
            ></div>
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
        </div>

        {/* Quick Actions */}
        <div className='mb-6'>
          <h3 className='font-semibold mb-2'>Quick Actions</h3>
          <div className='space-y-2'>
            <button
              onClick={() => handleQuickAction('list_agents')}
              disabled={isLoading}
              className='w-full text-left px-3 py-2 bg-blue-100 hover:bg-blue-200 rounded text-sm'
            >
              📋 List Agents
            </button>
            <button
              onClick={() => handleQuickAction('ecosystem_status')}
              disabled={isLoading}
              className='w-full text-left px-3 py-2 bg-green-100 hover:bg-green-200 rounded text-sm'
            >
              📊 Check Status
            </button>
            <button
              onClick={() => handleQuickAction('run_test')}
              disabled={isLoading}
              className='w-full text-left px-3 py-2 bg-yellow-100 hover:bg-yellow-200 rounded text-sm'
            >
              🧪 Run Test
            </button>
            <button
              onClick={() => sendMessage('performance')}
              disabled={isLoading}
              className='w-full text-left px-3 py-2 bg-purple-100 hover:bg-purple-200 rounded text-sm'
            >
              📈 Performance
            </button>
            <button
              onClick={() => sendMessage('market data')}
              disabled={isLoading}
              className='w-full text-left px-3 py-2 bg-indigo-100 hover:bg-indigo-200 rounded text-sm'
            >
              💹 Market Data
            </button>
            <button
              onClick={() => sendMessage('simulate transaction')}
              disabled={isLoading}
              className='w-full text-left px-3 py-2 bg-red-100 hover:bg-red-200 rounded text-sm'
            >
              🔄 Simulate Transaction
            </button>
            <button
              onClick={() => sendMessage('check my balance')}
              disabled={isLoading}
              className='w-full text-left px-3 py-2 bg-emerald-100 hover:bg-emerald-200 rounded text-sm'
            >
              💰 Check HBAR Balance
            </button>
            <button
              onClick={() => sendMessage('create carbon token')}
              disabled={isLoading}
              className='w-full text-left px-3 py-2 bg-teal-100 hover:bg-teal-200 rounded text-sm'
            >
              🪙 Create Carbon Token
            </button>
            <button
              onClick={() => sendMessage('hedera help')}
              disabled={isLoading}
              className='w-full text-left px-3 py-2 bg-cyan-100 hover:bg-cyan-200 rounded text-sm'
            >
              🔗 Hedera Help
            </button>
          </div>
        </div>

        {/* Agents List */}
        <div>
          <h3 className='font-semibold mb-2'>Available Agents</h3>
          <div className='space-y-2'>
            {agents.map(agent => (
              <div
                key={agent.id}
                className={`p-2 rounded text-sm ${
                  agent.isOnline
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                <div className='font-medium'>{agent.name}</div>
                <div className='text-xs text-gray-600'>{agent.type}</div>
                <div className='text-xs'>
                  {agent.isOnline ? '🟢 Online' : '🔴 Offline'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className='flex-1 flex flex-col'>
        {/* Chat Header */}
        <div className='bg-white shadow-sm p-4 border-b'>
          <h1 className='text-2xl font-bold'>Agent Ecosystem Chat</h1>
          <p className='text-gray-600'>
            Communicate with carbon credit trading agents
          </p>
        </div>

        {/* Messages */}
        <div className='flex-1 overflow-y-auto p-4 space-y-4'>
          {messages.map(message => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-3xl px-4 py-2 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : message.role === 'system'
                      ? 'bg-gray-200 text-gray-800'
                      : 'bg-green-100 text-green-800'
                }`}
              >
                <div className='whitespace-pre-wrap'>{message.content}</div>
                <div className='text-xs opacity-70 mt-1'>
                  {formatTime(message.timestamp)}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className='flex justify-start'>
              <div className='bg-gray-200 text-gray-800 px-4 py-2 rounded-lg'>
                <div className='flex items-center'>
                  <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2'></div>
                  Processing...
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className='bg-white border-t p-4'>
          <div className='flex space-x-2'>
            <input
              type='text'
              value={inputMessage}
              onChange={e => setInputMessage(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && sendMessage(inputMessage)}
              placeholder="Type your message... (try 'help', 'check my balance', 'create carbon token', 'hedera help')"
              className='flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
              disabled={isLoading}
            />
            <button
              onClick={() => sendMessage(inputMessage)}
              disabled={isLoading || !inputMessage.trim()}
              className='px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              Send
            </button>
          </div>

          {/* Quick Commands */}
          <div className='mt-2 text-xs text-gray-500'>
            Try: "check my balance", "create carbon token", "hedera help", "list
            agents", "run test", "help"
          </div>
        </div>
      </div>
    </div>
  );
}
