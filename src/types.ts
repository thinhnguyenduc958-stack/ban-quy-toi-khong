export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category_id: string;
  is_available: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
}

export interface OrderItem {
  product_id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
  image_url: string;
}

export type PaymentStatus = 'PENDING' | 'AWAITING_MANUAL_CONFIRMATION' | 'PAID' | 'PAYMENT_REJECTED';

export interface Order {
  id: string;
  order_code: string;
  buyer_name: string;
  is_anonymous: boolean;
  friend_note: string;
  total_amount: number;
  payment_content: string;
  payment_status: PaymentStatus;
  items: OrderItem[];
  created_at: string;
  paid_at?: string;
  audit_note?: string;
}

export type PaymentQrMode = 'VIETQR_DYNAMIC' | 'UPLOADED_IMAGE' | 'HYBRID';

export interface BankSettings {
  id: string;
  bank_name: string;
  bank_id: string;
  bank_code: string;
  qr_template: string;
  account_number: string;
  account_name: string;
  is_active: boolean;
  custom_qr_image_url?: string;
  qr_mode?: PaymentQrMode;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  totalAmount: number;
  ordersCount: number;
  isAnonymous: boolean;
  badge: string;
}

export interface DashboardStats {
  totalOrders: number;
  awaitingConfirmationCount: number;
  paidCount: number;
  totalRevenue: number;
  recentOrders: Order[];
}

export interface AuditLog {
  id: string;
  order_id: string;
  order_code: string;
  admin_username: string;
  action: string;
  note: string;
  created_at: string;
}
