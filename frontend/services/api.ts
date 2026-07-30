import { AnalyticsResponse, CategorySummary, ChatResponse, CompareResponse, ConversationDetail, ConversationSummary, FeedbackResponse, Product, SupportResponse, VisualSearchResponse } from "@/types";
import { Order, ReturnResponse, TrackOrderResponse } from "@/types/order";
import type { CartLine } from "@/features/cart/CartProvider";
import { createSupabaseClient } from "@/services/supabase";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const catalogueCache = new Map<string, { expires: number; value: unknown }>();

async function request<T>(path: string, init?: RequestInit, token?: string, retrySession = true): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init?.headers },
  });
  if (response.status === 401 && token && retrySession) {
    const supabase = createSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase.auth.refreshSession();
      if (!error && data.session?.access_token) return request<T>(path, init, data.session.access_token, false);
    }
  }
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(response.status === 401 ? "Your session expired. Please sign in again." : payload.detail ?? "Request failed");
  }
  return response.json() as Promise<T>;
}

export async function getProducts(query = "", token?: string): Promise<Product[]> {
  const cacheKey = `products:${query.trim().toLowerCase()}`;
  const cached = catalogueCache.get(cacheKey);
  if (!token && cached && cached.expires > Date.now()) return cached.value as Product[];
  const result = await request<{ items: Product[] }>(`/products?query=${encodeURIComponent(query)}`, undefined, token);
  if (!token) catalogueCache.set(cacheKey, { expires: Date.now() + 30_000, value: result.items });
  return result.items;
}

export async function getProduct(productId: string) {
  const cacheKey = `product:${productId}`;
  const cached = catalogueCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) return cached.value as Product;
  const product = await request<Product>(`/products/${encodeURIComponent(productId)}`);
  catalogueCache.set(cacheKey, { expires: Date.now() + 60_000, value: product });
  return product;
}

export function getCategories() {
  return request<string[]>("/categories", { cache: "no-store" });
}

export function getCategorySummaries() {
  return request<CategorySummary[]>("/categories/summary", { cache: "no-store" });
}

export function sendChat(message: string, conversationId?: string, token?: string) {
  return request<ChatResponse>("/api/v1/chat", {
    method: "POST",
    body: JSON.stringify({ message, conversation_id: conversationId }),
  }, token);
}

export function getConversations(token?: string) {
  return request<ConversationSummary[]>("/conversations", undefined, token);
}

export function getConversation(conversationId: string, token?: string) {
  return request<ConversationDetail>(`/conversations/${conversationId}`, undefined, token);
}

export function createOrder(
  lines: CartLine[], delivery: { name: string; email: string; address: string }, token: string,
) {
  return request<Order>("/orders", {
    method: "POST",
    body: JSON.stringify({
      lines: lines.map((line) => ({ product_id: line.product.id, quantity: line.quantity })),
      delivery_name: delivery.name,
      delivery_email: delivery.email,
      delivery_address: delivery.address,
    }),
  }, token);
}

export function getOrders(token: string) {
  return request<Order[]>("/orders", undefined, token);
}

export function compareProducts(productIds: string[], token: string) {
  return request<CompareResponse>("/compare", { method: "POST", body: JSON.stringify({ product_ids: productIds }) }, token);
}

export function askSupport(question: string) {
  return request<SupportResponse>("/support", { method: "POST", body: JSON.stringify({ question }) });
}

export function trackOrder(orderId: string, token: string) {
  return request<TrackOrderResponse>("/orders/track", { method: "POST", body: JSON.stringify({ order_id: orderId }) }, token);
}

export function requestReturn(orderId: string, reason: string, token: string) {
  return request<ReturnResponse>("/returns", { method: "POST", body: JSON.stringify({ order_id: orderId, reason }) }, token);
}

export function submitFeedback(conversationId: string, rating: number, comment: string, token: string) {
  return request<FeedbackResponse>("/feedback", { method: "POST", body: JSON.stringify({
    conversation_id: conversationId, rating, comment: comment || null,
  }) }, token);
}

export function getAnalytics(token: string) {
  return request<AnalyticsResponse>("/analytics", undefined, token);
}

export function visualSearch(imageDataUrl: string, filename: string, token: string) {
  return request<VisualSearchResponse>("/search/visual", {
    method: "POST", body: JSON.stringify({ image_data_url: imageDataUrl, filename }),
  }, token);
}
