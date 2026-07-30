export type OrderItem = {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  image_url: string;
};

export type Order = {
  id: string;
  user_id: string;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "return_requested" | "returned" | "cancelled";
  total: number;
  items: OrderItem[];
  tracking_number?: string;
  delivery_name: string;
  delivery_email: string;
  delivery_address: string;
  return_reason?: string;
  return_requested_at?: string;
  created_at: string;
  updated_at: string;
};

export type TrackOrderResponse = { order: Order; summary: string };
export type ReturnResponse = { order: Order; message: string };
