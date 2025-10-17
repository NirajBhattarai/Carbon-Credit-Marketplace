/**
 * LLM Factory for Hedera Agent Kit
 * Creates AI language models for the carbon credit agent ecosystem
 */

import { ChatGroq } from '@langchain/groq';

export function createLLMFromEnv() {
  const { GROQ_API_KEY } = process.env;

  if (!GROQ_API_KEY) {
    throw new Error(
      'GROQ_API_KEY is required. Get a free API key at https://console.groq.com/keys'
    );
  }

  return new ChatGroq({
    model: 'llama-3.3-70b-versatile',
    apiKey: GROQ_API_KEY,
  });
}
