/**
 * AI Coach API client
 */

import { post, get } from "@/lib/api";
import type {
  AIChatRequest,
  AIChatResponse,
  AIConversation,
  AIConversationListResponse,
} from "@/types/ai";

const AI_ENDPOINT = "/v1/ai";

/**
 * Send a message to AI Coach
 */
export async function sendAIMessage(
  request: AIChatRequest
): Promise<AIChatResponse> {
  return post<AIChatResponse>(`${AI_ENDPOINT}/chat`, request);
}

/**
 * Get user's AI conversations list
 */
export async function getAIConversations(
  problemId?: number,
  page: number = 1,
  pageSize: number = 10
): Promise<AIConversationListResponse> {
  let endpoint = `${AI_ENDPOINT}/conversations?page=${page}&page_size=${pageSize}`;
  if (problemId) {
    endpoint += `&problem_id=${problemId}`;
  }
  return get<AIConversationListResponse>(endpoint);
}

/**
 * Get a specific conversation with messages
 */
export async function getAIConversation(
  conversationId: string
): Promise<AIConversation> {
  return get<AIConversation>(`${AI_ENDPOINT}/conversations/${conversationId}`);
}
