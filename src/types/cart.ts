import { Product } from "./product";

export interface CartItem extends Product {
  quantity: number;
  calculatedPrice: number;
  discountPercentage: number;
  order_id: string;
  client_name: string;
  agent_id: string;
  changed_price: number;
  product_mrp: number;
  discount_percentage: number;
  discount: number;
  gst: number;
  gst_amount: number;
  transport_exclude: number;
}
