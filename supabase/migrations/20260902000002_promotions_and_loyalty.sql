-- ==============================================================================
-- FASE 6: MIGRACIÓN DE CUPONES DE DESCUENTO Y AUDITORÍA DE PUNTOS DE FIDELIZACIÓN
-- ==============================================================================

-- 1. Tabla de Cupones de Descuento
create table if not exists coupons (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  code text not null,
  discount_type text not null check (discount_type in ('percentage', 'fixed_amount')),
  discount_value numeric(12,2) not null check (discount_value > 0),
  min_order_amount numeric(12,2) not null default 0 check (min_order_amount >= 0),
  max_discount_amount numeric(12,2),
  max_uses integer check (max_uses is null or max_uses > 0),
  current_uses integer not null default 0,
  valid_from timestamptz not null default now(),
  valid_until timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint uq_tenant_coupon_code unique (tenant_id, code)
);

create index if not exists idx_coupons_tenant on coupons(tenant_id);
create index if not exists idx_coupons_code on coupons(code);

-- 2. Vincular cupón en tabla orders
alter table orders add column if not exists coupon_id uuid references coupons(id) on delete set null;

-- 3. Tabla de Asientos de Puntos (Ledger)
create table if not exists customer_points_ledger (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  customer_id uuid not null references customers(id) on delete cascade,
  points integer not null,
  reason text not null,
  order_id uuid references orders(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_ledger_tenant_customer on customer_points_ledger(tenant_id, customer_id);

-- 4. RLS y Políticas de Seguridad
alter table coupons enable row level security;
alter table customer_points_ledger enable row level security;

-- Políticas para Cupones
create policy "Staff can manage coupons" on coupons
  for all using (is_tenant_member(tenant_id, 'staff'));

create policy "Public can view active coupons" on coupons
  for select using (is_active = true);

-- Políticas para Ledger de Puntos
create policy "Staff can view customer points ledger" on customer_points_ledger
  for select using (is_tenant_member(tenant_id, 'staff'));

create policy "Service or member can insert points ledger" on customer_points_ledger
  for insert with check (true);
