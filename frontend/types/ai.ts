/**
 * AI Coach types
 */

export type AIChatMode = "OFF" | "COACH";

export interface AIChatRequest {
  problem_id: number;
  submission_id?: string;
  mode: AIChatMode;
  message: string;
  code_context?: string;
  conversation_id?: string;
}

export interface AIChatResponse {
  reply: string;
  conversation_id: string;
  message_id: string;
  token_estimate?: number;
}

export interface AIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface AIConversation {
  id: string;
  problem_id: number;
  mode: string;
  created_at: string;
  updated_at: string;
  messages: AIMessage[];
}

export interface AIConversationListItem {
  id: string;
  problem_id: number;
  problem_title?: string;
  mode: string;
  message_count: number;
  preview?: string;  // First user message preview
  created_at: string;
  updated_at: string;
}

// Alias for component usage
export type AIConversationSummary = AIConversationListItem;

export interface AIConversationListResponse {
  conversations: AIConversationListItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}
