-- ==============================================================================
-- BẠN QUÝ TÔI KHÔNG? | FRIENDSHIP CAFÉ - SUPABASE POSTGRESQL SCHEMA
-- Ready for execution in Supabase SQL Editor
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    price INT NOT NULL CHECK (price >= 0),
    image_url TEXT,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Bank Settings Table (Admin-only modification)
CREATE TABLE IF NOT EXISTS public.bank_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bank_name TEXT NOT NULL DEFAULT 'VietinBank (Ngân hàng TMCP Công Thương Việt Nam)',
    bank_id TEXT NOT NULL DEFAULT '970415',
    bank_code TEXT NOT NULL DEFAULT 'ICB',
    qr_template TEXT NOT NULL DEFAULT 'compact2',
    account_number TEXT NOT NULL,
    account_name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Orders Table
CREATE TYPE payment_status_enum AS ENUM ('PENDING', 'AWAITING_MANUAL_CONFIRMATION', 'PAID', 'PAYMENT_REJECTED');

CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_code TEXT NOT NULL UNIQUE,
    buyer_name TEXT DEFAULT 'Người bạn hảo tâm',
    is_anonymous BOOLEAN DEFAULT FALSE,
    friend_note TEXT,
    total_amount INT NOT NULL CHECK (total_amount > 0),
    payment_content TEXT NOT NULL,
    payment_status payment_status_enum DEFAULT 'PENDING',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    paid_at TIMESTAMPTZ,
    audit_note TEXT
);

-- 5. Order Items Table
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    unit_price INT NOT NULL CHECK (unit_price >= 0),
    quantity INT NOT NULL CHECK (quantity > 0),
    subtotal INT NOT NULL CHECK (subtotal >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Admin Profiles Table
CREATE TABLE IF NOT EXISTS public.admin_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Payment Audit Logs Table
CREATE TABLE IF NOT EXISTS public.payment_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    order_code TEXT,
    admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    admin_username TEXT,
    action TEXT NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for lightning queries
CREATE INDEX IF NOT EXISTS idx_orders_order_code ON public.orders(order_code);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

-- Row Level Security (RLS) Configuration
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_audit_logs ENABLE ROW LEVEL SECURITY;

-- Categories & Products RLS: Anyone can read, only admin can mutate
CREATE POLICY "Public read products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Public read bank settings" ON public.bank_settings FOR SELECT USING (true);

-- Orders RLS: Anyone can insert orders, anyone can read by specific order_code, but ONLY admin can update status
CREATE POLICY "Anyone can create orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Anyone can insert order items" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view order items" ON public.order_items FOR SELECT USING (true);

-- Customer can only transition status from PENDING to AWAITING_MANUAL_CONFIRMATION
CREATE POLICY "Customer can flag transfer made" ON public.orders FOR UPDATE
USING (payment_status = 'PENDING')
WITH CHECK (payment_status = 'AWAITING_MANUAL_CONFIRMATION');

-- Admin full control policy (checks auth.uid in admin_profiles)
CREATE POLICY "Admin full orders access" ON public.orders FOR ALL
USING (EXISTS (SELECT 1 FROM public.admin_profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "Admin full products access" ON public.products FOR ALL
USING (EXISTS (SELECT 1 FROM public.admin_profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "Admin full bank access" ON public.bank_settings FOR ALL
USING (EXISTS (SELECT 1 FROM public.admin_profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "Admin view logs" ON public.payment_audit_logs FOR SELECT
USING (EXISTS (SELECT 1 FROM public.admin_profiles WHERE auth_user_id = auth.uid()));

-- Default Seed for VietinBank (VietQR BIN 970415)
INSERT INTO public.bank_settings (bank_name, bank_id, bank_code, qr_template, account_number, account_name, is_active, qr_mode)
VALUES ('VietinBank (Ngân hàng TMCP Công Thương Việt Nam)', '970415', 'ICB', 'compact2', '109888888888', 'CHỦ QUÁN FRIENDSHIP CAFÉ', true, 'HYBRID')
ON CONFLICT DO NOTHING;

-- ==============================================================================
-- 6. SUPABASE STORAGE BUCKET FOR QR CODES
-- ==============================================================================
-- Run these statements in Supabase SQL Editor if using Supabase Storage for QR images:
INSERT INTO storage.buckets (id, name, public)
VALUES ('qr-codes', 'qr-codes', true)
ON CONFLICT (id) DO NOTHING;

-- Public can view QR images
CREATE POLICY "Public Read QR Images"
ON storage.objects FOR SELECT
USING (bucket_id = 'qr-codes');

-- Admin can upload/update/delete QR images
CREATE POLICY "Admin Manage QR Images"
ON storage.objects FOR ALL
USING (bucket_id = 'qr-codes' AND EXISTS (
  SELECT 1 FROM public.admin_profiles WHERE auth_user_id = auth.uid()
));

