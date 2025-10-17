/**
 * API Utilities for Hedera Agent Kit Integration
 * Handles request/response formatting and message transformation
 */

import { z } from 'zod';

export const RequestSchema = z.object({
  input: z.string(),
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string(),
      })
    )
    .optional(),
  accountId: z.string().optional(),
});

export type RequestData = z.infer<typeof RequestSchema>;

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AgentResponse {
  ok: boolean;
  result?: string;
  error?: string;
  mode?: string;
  network?: string;
}

export interface WalletPrepareResponse {
  ok: boolean;
  result?: string;
  bytesBase64?: string;
  error?: string;
}

export function createSuccessResponse(data: Partial<AgentResponse>): Response {
  return Response.json({ ok: true, ...data });
}

export function createErrorResponse(message: string): Response {
  return Response.json({ ok: false, error: message });
}

export function transformMessagesToHistory(messages: Message[]) {
  return messages.map(msg => ({
    role: msg.role,
    content: msg.content,
  }));
}
