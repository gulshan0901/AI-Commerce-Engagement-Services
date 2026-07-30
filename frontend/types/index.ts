/** Defines shared frontend contracts for catalogue, chat, analytics, and support. */
export type Product = {
  id: string;
  name: string;
  brand: string;
  category: string;
  description: string;
  price: number;
  rating: number;
  in_stock: boolean;
  image_url: string;
  specs: Record<string, string>;
  tags: string[];
};

/** A single server-side catalogue page and the total number of matching products. */
export type ProductPage = { items: Product[]; total: number };

export type Recommendation = { product: Product; reasons: string[] };
export type ChatResponse = {
  conversation_id: string;
  answer: string;
  recommendations: Recommendation[];
  source: "openai" | "fallback";
  memory_used: boolean;
  intent: "shopping" | "comparison" | "support" | "order_tracking" | "return";
};

export type ConversationSummary = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

export type ConversationMessage = {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

export type ConversationDetail = {
  conversation: ConversationSummary;
  messages: ConversationMessage[];
};

export type CompareResponse = {
  products: Product[];
  rows: { attribute: string; values: Record<string, string> }[];
  verdict: string;
  best_product_id: string;
};

export type SupportResponse = {
  answer: string;
  sources: { id: string; question: string }[];
  confidence: number;
  escalate: boolean;
};

export type AnalyticsResponse = {
  cards: { label: string; value: number; unit: string }[];
  agent_performance: { agent: string; requests: number; average_latency_ms: number; satisfaction?: number }[];
  tool_usage: Record<string, number>;
  recent_events: number;
};

export type ObservabilityConversation = {
  id: string;
  first_message: string;
  turns: number;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  last_activity: string;
};

export type TraceSpan = {
  name: string;
  kind: "llm" | "tool";
  duration_ms: number;
  input_tokens: number;
  output_tokens: number;
};

export type ObservabilityTurn = {
  number: number;
  user_message: string;
  assistant_message: string;
  agent: string;
  latency_ms: number;
  input_tokens: number;
  output_tokens: number;
  spans: TraceSpan[];
};

export type ConversationObservability = {
  conversation: ObservabilityConversation;
  turns: ObservabilityTurn[];
};

export type ConversationReview = {
  score: number;
  summary: string;
  tool_issues: string[];
  behavior_observations: string[];
  efficiency_notes: string[];
  source: "openai" | "fallback";
};

export type ImprovementResponse = { ideas: string[]; source: "openai" | "fallback" };

export type FeedbackResponse = { id: string; rating: number; message: string };

export type CategorySummary = { slug: string; image_url: string; product_count: number };

export type VisualSearchResponse = {
  analysis: string;
  similar: Recommendation[];
  cheaper_alternatives: Recommendation[];
  matching_accessories: Recommendation[];
  source: "openai" | "fallback";
};
