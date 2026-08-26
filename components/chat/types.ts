export interface ChatMessage {
  id: string | number;
  content: string;
  isUser: boolean;
  timestamp?: string | Date;
  isStreaming?: boolean;
}

export interface Suggestion {
  initials: string;
  title: string;
  description: string;
  prompt: string;
}

export interface ConversationSummary {
  id: number;
  title: string;
}
