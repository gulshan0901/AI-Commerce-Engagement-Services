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

export type FeedbackResponse = { id: string; rating: number; message: string };

export type CategorySummary = { slug: string; image_url: string; product_count: number };
