export interface Product {
  product_id: number;
  dealer_id: number;
  category: string;
  product_name: string;
  short_description: string;
  about_product: string;
  mrp: number;
  sell_mrp: number;
  commission_percentage: number;
  commission_amount: number;
  gst_percentage: number;
  gst_exclude: number;
  gst_amount: number;
  transportation_cost: number;
  transport_exclude: number;
  base_mrp: number;
  final_product_cost: number;
  showroom_stock?: number;
  is_active: number;
  created_at: string;
  updated_at: string;
  manufacturer_name: string;
  manufacturer_email: string;
  manufacturer_phone: string;
  company_name: string;
  manufacturer_address: string;
  product_type?: "sqft" | "unit";
  images: Array<{
    image_id: number;
    image_url: string;
    image_alt_text: string;
    is_primary: boolean;
    sort_order: number;
  }>;
  composite_gst_scheme?: number;
  showroom_stock_number: string;
defect_stock: string;
}