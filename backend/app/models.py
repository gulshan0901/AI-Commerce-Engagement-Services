"""Define the validated API request, response, and domain data contracts."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class Product(BaseModel):
    id: str
    name: str
    brand: str
    category: str
    description: str
    price: float
    rating: float
    in_stock: bool
    image_url: str
    specs: dict[str, str]
    tags: list[str]


class ProductList(BaseModel):
    """A catalogue page plus the unsliced result count for pagination clients."""

    items: list[Product]
    total: int


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    conversation_id: str | None = None


class SearchRequest(BaseModel):
    query: str = Field(default="", max_length=120)
    category: str | None = None
    max_price: float | None = Field(default=None, gt=0)


class RecommendRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)


class Recommendation(BaseModel):
    product: Product
    reasons: list[str]


class ChatResponse(BaseModel):
    conversation_id: str
    answer: str
    recommendations: list[Recommendation]
    source: Literal["openai", "fallback"]
    memory_used: bool = False
    intent: Literal["shopping", "comparison", "support", "order_tracking", "return"] = "shopping"


class User(BaseModel):
    id: str
    email: str | None = None


class PhaseStatus(BaseModel):
    status: Literal["planned"] = "planned"
    phase: int
    message: str


class ConversationSummary(BaseModel):
    id: str
    title: str
    created_at: datetime
    updated_at: datetime


class ConversationMessage(BaseModel):
    id: str
    conversation_id: str
    role: Literal["user", "assistant"]
    content: str
    created_at: datetime


class ConversationDetail(BaseModel):
    conversation: ConversationSummary
    messages: list[ConversationMessage]


class MemoryProfile(BaseModel):
    favorite_brands: list[str] = Field(default_factory=list)
    budget: float | None = None
    sizes: list[str] = Field(default_factory=list)


class SemanticSearchResponse(BaseModel):
    items: list[Product]
    total: int
    source: Literal["supabase", "local"]


class OrderLineInput(BaseModel):
    product_id: str
    quantity: int = Field(ge=1, le=20)


class CheckoutRequest(BaseModel):
    lines: list[OrderLineInput] = Field(min_length=1, max_length=50)
    delivery_name: str = Field(min_length=2, max_length=120)
    delivery_email: str = Field(min_length=3, max_length=320)
    delivery_address: str = Field(min_length=5, max_length=500)


class OrderItem(BaseModel):
    product_id: str
    name: str
    price: float
    quantity: int
    image_url: str


class Order(BaseModel):
    id: str
    user_id: str
    status: Literal["pending", "confirmed", "shipped", "delivered", "return_requested", "returned", "cancelled"]
    total: float
    items: list[OrderItem]
    tracking_number: str | None = None
    delivery_name: str
    delivery_email: str
    delivery_address: str
    return_reason: str | None = None
    return_requested_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class CompareRequest(BaseModel):
    product_ids: list[str] = Field(min_length=2, max_length=4)


class ComparisonRow(BaseModel):
    attribute: str
    values: dict[str, str]


class CompareResponse(BaseModel):
    products: list[Product]
    rows: list[ComparisonRow]
    verdict: str
    best_product_id: str


class SupportRequest(BaseModel):
    question: str = Field(min_length=2, max_length=1000)


class FaqSource(BaseModel):
    id: str
    question: str


class SupportResponse(BaseModel):
    answer: str
    sources: list[FaqSource]
    confidence: float = Field(ge=0, le=1)
    escalate: bool = False


class TrackOrderRequest(BaseModel):
    order_id: str


class TrackOrderResponse(BaseModel):
    order: Order
    summary: str


class ReturnRequest(BaseModel):
    order_id: str
    reason: str = Field(min_length=5, max_length=500)


class ReturnResponse(BaseModel):
    order: Order
    message: str


class IntentResult(BaseModel):
    intent: Literal["shopping", "comparison", "support", "order_tracking", "return"]
    confidence: float = Field(ge=0, le=1)


class FeedbackRequest(BaseModel):
    conversation_id: str | None = None
    message_id: str | None = None
    rating: int = Field(ge=1, le=5)
    comment: str | None = Field(default=None, max_length=1000)


class FeedbackResponse(BaseModel):
    id: str
    rating: int
    message: str = "Thank you. Your feedback will be included in the quality dashboard."


class MetricCard(BaseModel):
    label: str
    value: float
    unit: str = ""


class AgentMetric(BaseModel):
    agent: str
    requests: int
    average_latency_ms: float
    satisfaction: float | None = None


class AnalyticsResponse(BaseModel):
    cards: list[MetricCard]
    agent_performance: list[AgentMetric]
    tool_usage: dict[str, int]
    recent_events: int


class VisualSearchRequest(BaseModel):
    image_data_url: str = Field(min_length=20, max_length=10_000_000)
    filename: str = Field(default="product-image", max_length=255)


class VisualSearchResponse(BaseModel):
    analysis: str
    similar: list[Recommendation]
    cheaper_alternatives: list[Recommendation]
    matching_accessories: list[Recommendation]
    source: Literal["openai", "fallback"]


class ObservabilityConversation(BaseModel):
    id: str
    first_message: str
    turns: int
    input_tokens: int
    output_tokens: int
    total_tokens: int
    last_activity: datetime


class TraceSpan(BaseModel):
    name: str
    kind: Literal["llm", "tool"]
    duration_ms: int
    input_tokens: int = 0
    output_tokens: int = 0


class ObservabilityTurn(BaseModel):
    number: int
    user_message: str
    assistant_message: str
    agent: str
    latency_ms: int
    input_tokens: int
    output_tokens: int
    spans: list[TraceSpan]


class ConversationObservability(BaseModel):
    conversation: ObservabilityConversation
    turns: list[ObservabilityTurn]


class ConversationReview(BaseModel):
    score: int = Field(ge=1, le=5)
    summary: str
    tool_issues: list[str]
    behavior_observations: list[str]
    efficiency_notes: list[str]
    source: Literal["openai", "fallback"]


class ImprovementRequest(BaseModel):
    feedback: str = Field(min_length=3, max_length=3000)
    conversation_area: str = "All turns"
    improvement_focus: str = "Overall experience"


class ImprovementResponse(BaseModel):
    ideas: list[str]
    source: Literal["openai", "fallback"]
