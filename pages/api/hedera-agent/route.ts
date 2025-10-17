/**
 * Hedera Agent API Endpoint
 * Integrates Hedera Agent Kit with the carbon credit agent ecosystem
 */

import { NextRequest } from 'next/server';
import {
  RequestSchema,
  createErrorResponse,
  createSuccessResponse,
  transformMessagesToHistory,
} from '@/lib/hedera/api-utils';
import {
  initializeLLM,
  createHederaToolkit,
  createChatPrompt,
  createAgentExecutorWithPrompt,
  extractResultFromResponse,
} from '@/lib/hedera/agent-factory';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = RequestSchema.parse(body);
    const input = parsed.input;
    const history = parsed.messages || [];
    const accountId = parsed.accountId;

    const { bootstrap, tools } = createHederaToolkit(undefined, accountId);
    const historyMessages = transformMessagesToHistory(history);

    // Enhanced system prompt for carbon credit ecosystem
    const systemPrompt = `You are a helpful Hedera-powered AI assistant specialized in carbon credit trading and blockchain operations. 

You can help with:
- Checking HBAR balances and account information
- Creating and managing carbon credit tokens (HTS)
- Transferring HBAR and tokens
- Creating consensus topics for carbon credit transactions
- Querying Hedera network data
- Managing carbon credit portfolios

Always provide clear, helpful responses about Hedera operations and carbon credit trading.`;

    const chatPrompt = createChatPrompt(systemPrompt);

    let llm;
    try {
      llm = initializeLLM();
    } catch (e) {
      return createErrorResponse(
        e instanceof Error ? e.message : 'Invalid AI provider configuration'
      );
    }

    const executor = createAgentExecutorWithPrompt(
      llm,
      tools,
      chatPrompt,
      false
    );
    const response = await executor.invoke({
      input,
      history: historyMessages,
    });
    const result = extractResultFromResponse(response);

    return createSuccessResponse({
      mode: bootstrap.mode,
      network: bootstrap.network,
      result,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return createErrorResponse(message);
  }
}
