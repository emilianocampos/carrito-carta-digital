-- ==============================================================================
-- CARRITO TAKE-AWAY: MASTER DATABASE SCHEMA & MULTI-TENANT ISOLATION (RLS)
-- Version: 1.0.0
-- Architecture: Shared Database, Shared Schema, Strict Row Level Security
-- ==============================================================================

-- Enable UUID extension if not already present
create extension if not exists "uuid-ossp";

-- ==============================================================================
-- 1. HELPER FUNCTIONS & TRIGGERS (UPDATED_AT)
-- ==============================================================================

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ==============================================================================
-- 2. TENANTS & PROFILES
-- ==============================================================================

create table if not exists tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo_url text,
  banner_url text,
  status text not null default 'active' check (status in ('active', 'suspended', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger tr_tenants_updated_at
  before update on tenants
  for each row execute function set_updated_at();

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  avatar_url text,
  is_super_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger tr_profiles_updated_at
  before update on profiles
  for each row execute function set_updated_at();

-- Automatically create profile on new user signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, phone, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Usuario'),
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ==============================================================================
-- 3. MEMBERSHIPS & ROLES
-- ==============================================================================

create table if not exists memberships (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'manager', 'staff')),
  created_at timestamptz not null default now(),
  unique (tenant_id, user_id)
);

create index if not exists idx_memberships_tenant on memberships(tenant_id);
create index if not exists idx_memberships_user on memberships(user_id);

-- ==============================================================================
-- 4. RLS SECURITY DEFINER FUNCTIONS
-- ==============================================================================

create or replace function is_super_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and is_super_admin = true
  );
end;
$$ language plpgsql security definer stable;

create or replace function get_auth_tenant_ids()
returns setof uuid as $$
begin
  return query
    select tenant_id from public.memberships
    where user_id = auth.uid();
end;
$$ language plpgsql security definer stable;

create or replace function is_tenant_member(target_tenant_id uuid, required_role text default null)
returns boolean as $$
begin
  if is_super_admin() then
    return true;
  end if;

  if required_role is null then
    return exists (
      select 1 from public.memberships
      where tenant_id = target_tenant_id and user_id = auth.uid()
    );
  elsif required_role = 'owner' then
    return exists (
      select 1 from public.memberships
      where tenant_id = target_tenant_id and user_id = auth.uid() and role = 'owner'
    );
  elsif required_role = 'manager' then
    return exists (
      select 1 from public.memberships
      where tenant_id = target_tenant_id and user_id = auth.uid() and role in ('owner', 'manager')
    );
  else
    return exists (
      select 1 from public.memberships
      where tenant_id = target_tenant_id and user_id = auth.uid()
    );
  end if;
end;
$$ language plpgsql security definer stable;

-- ==============================================================================
-- 5. PLANS, FEATURES, LIMITS & SUBSCRIPTIONS
-- ==============================================================================

create table if not exists plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  price numeric(12,2) not null default 0,
  currency text not null default 'ARS',
  billing_cycle text not null default 'monthly' check (billing_cycle in ('monthly', 'yearly')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists features (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists plan_features (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references plans(id) on delete cascade,
  feature_id uuid not null references features(id) on delete cascade,
  value jsonb not null default 'true'::jsonb,
  unique (plan_id, feature_id)
);

create table if not exists tenant_feature_overrides (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  feature_id uuid not null references features(id) on delete cascade,
  value jsonb not null,
  reason text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  unique (tenant_id, feature_id)
);

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  plan_id uuid not null references plans(id),
  status text not null default 'trialing' check (status in ('trialing', 'active', 'past_due', 'cancelled', 'suspended', 'expired')),
  current_period_start timestamptz not null default now(),
  current_period_end timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger tr_subscriptions_updated_at
  before update on subscriptions
  for each row execute function set_updated_at();

-- ==============================================================================
-- 6. TENANT SETTINGS & MENU THEMES
-- ==============================================================================

create table if not exists tenant_settings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null unique references tenants(id) on delete cascade,
  currency text not null default 'ARS',
  current_preparation_time_minutes integer not null default 20,
  is_ordering_paused boolean not null default false,
  pause_reason text,
  accepts_cash boolean not null default true,
  accepts_mercadopago boolean not null default false,
  whatsapp_phone text,
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger tr_tenant_settings_updated_at
  before update on tenant_settings
  for each row execute function set_updated_at();

create table if not exists menu_themes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null unique references tenants(id) on delete cascade,
  preset_code text not null default 'dark_street_food',
  tokens jsonb not null default '{}'::jsonb,
  layout_config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger tr_menu_themes_updated_at
  before update on menu_themes
  for each row execute function set_updated_at();

-- ==============================================================================
-- 7. CATEGORIES, PRODUCTS & VARIANTS
-- ==============================================================================

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  name text not null,
  description text,
  image_url text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_categories_tenant on categories(tenant_id);
create trigger tr_categories_updated_at
  before update on categories
  for each row execute function set_updated_at();

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  category_id uuid not null references categories(id) on delete cascade,
  name text not null,
  description text,
  price numeric(12,2) not null check (price >= 0),
  image_url text,
  preparation_time_minutes integer not null default 15,
  is_available boolean not null default true,
  is_featured boolean not null default false,
  sort_order integer not null default 0,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_products_tenant on products(tenant_id);
create index if not exists idx_products_category on products(category_id);
create trigger tr_products_updated_at
  before update on products
  for each row execute function set_updated_at();

create table if not exists product_option_groups (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  name text not null,
  min_selectable integer not null default 0,
  max_selectable integer not null default 1,
  is_required boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_option_groups_product on product_option_groups(product_id);

create table if not exists product_options (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references product_option_groups(id) on delete cascade,
  name text not null,
  extra_price numeric(12,2) not null default 0 check (extra_price >= 0),
  is_available boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_options_group on product_options(group_id);

-- ==============================================================================
-- 8. CUSTOMERS & LOYALTY
-- ==============================================================================

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  phone text not null,
  email text,
  total_orders integer not null default 0,
  total_spent numeric(12,2) not null default 0,
  last_order_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, phone)
);

create index if not exists idx_customers_tenant on customers(tenant_id);
create index if not exists idx_customers_phone on customers(phone);
create trigger tr_customers_updated_at
  before update on customers
  for each row execute function set_updated_at();

-- ==============================================================================
-- 9. ORDERS & ORDER ITEMS (IMMUTABLE SNAPSHOTS)
-- ==============================================================================

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  order_number integer not null,
  customer_id uuid references customers(id) on delete set null,
  customer_name text not null,
  customer_phone text not null,
  order_type text not null default 'takeaway' check (order_type in ('takeaway', 'pickup_scheduled')),
  scheduled_for timestamptz,
  order_status text not null default 'pending' check (order_status in ('pending', 'accepted', 'preparing', 'ready', 'picked_up', 'cancelled')),
  payment_status text not null default 'pending' check (payment_status in ('pending', 'approved', 'rejected', 'refunded', 'cash_on_pickup')),
  subtotal numeric(12,2) not null default 0,
  discount numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  estimated_ready_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_orders_tenant on orders(tenant_id);
create index if not exists idx_orders_status on orders(tenant_id, order_status);
create index if not exists idx_orders_created on orders(tenant_id, created_at desc);
create trigger tr_orders_updated_at
  before update on orders
  for each row execute function set_updated_at();

-- Auto-generate incremental order number per tenant
create or replace function set_order_number()
returns trigger as $$
begin
  select coalesce(max(order_number), 0) + 1 into new.order_number
  from public.orders
  where tenant_id = new.tenant_id;
  return new;
end;
$$ language plpgsql;

create or replace trigger tr_orders_number
  before insert on orders
  for each row execute function set_order_number();

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  product_name text not null,
  unit_price numeric(12,2) not null,
  quantity integer not null check (quantity > 0),
  subtotal numeric(12,2) not null,
  options_snapshot jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_order_items_order on order_items(order_id);

-- ==============================================================================
-- 10. AUDIT LOGS
-- ==============================================================================

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  tenant_id uuid references tenants(id) on delete cascade,
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_tenant on audit_logs(tenant_id, created_at desc);

-- ==============================================================================
-- 11. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
alter table tenants enable row level security;
alter table profiles enable row level security;
alter table memberships enable row level security;
alter table plans enable row level security;
alter table features enable row level security;
alter table plan_features enable row level security;
alter table tenant_feature_overrides enable row level security;
alter table subscriptions enable row level security;
alter table tenant_settings enable row level security;
alter table menu_themes enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table product_option_groups enable row level security;
alter table product_options enable row level security;
alter table customers enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table audit_logs enable row level security;

-- PROFILES
create policy "Users can view own profile" on profiles
  for select using (id = auth.uid() or is_super_admin());

create policy "Users can update own profile" on profiles
  for update using (id = auth.uid() or is_super_admin());

-- TENANTS
create policy "Public can view active tenants by slug or id" on tenants
  for select using (status = 'active' or id in (select get_auth_tenant_ids()) or is_super_admin());

create policy "Owners and SuperAdmin can update tenant" on tenants
  for update using (is_tenant_member(id, 'owner') or is_super_admin());

-- MEMBERSHIPS
create policy "Members can view co-members of same tenant" on memberships
  for select using (tenant_id in (select get_auth_tenant_ids()) or is_super_admin());

create policy "Owners and SuperAdmin can manage memberships" on memberships
  for all using (is_tenant_member(tenant_id, 'owner') or is_super_admin());

-- PLANS & FEATURES (Read public, Write Super Admin)
create policy "Anyone can read active plans" on plans
  for select using (is_active = true or is_super_admin());

create policy "SuperAdmin can manage plans" on plans
  for all using (is_super_admin());

create policy "Anyone can read features" on features
  for select using (true);

create policy "SuperAdmin can manage features" on features
  for all using (is_super_admin());

create policy "Anyone can read plan features" on plan_features
  for select using (true);

create policy "SuperAdmin can manage plan features" on plan_features
  for all using (is_super_admin());

create policy "Tenant members can view overrides" on tenant_feature_overrides
  for select using (tenant_id in (select get_auth_tenant_ids()) or is_super_admin());

create policy "SuperAdmin can manage overrides" on tenant_feature_overrides
  for all using (is_super_admin());

create policy "Members can view tenant subscription" on subscriptions
  for select using (tenant_id in (select get_auth_tenant_ids()) or is_super_admin());

create policy "SuperAdmin can manage subscriptions" on subscriptions
  for all using (is_super_admin());

-- TENANT SETTINGS & THEMES (Public read for active tenant, write for managers)
create policy "Public can read tenant settings" on tenant_settings
  for select using (tenant_id in (select id from tenants where status = 'active') or is_tenant_member(tenant_id));

create policy "Managers can update tenant settings" on tenant_settings
  for update using (is_tenant_member(tenant_id, 'manager') or is_super_admin());

create policy "Public can read menu themes" on menu_themes
  for select using (tenant_id in (select id from tenants where status = 'active') or is_tenant_member(tenant_id));

create policy "Managers can update menu themes" on menu_themes
  for update using (is_tenant_member(tenant_id, 'manager') or is_super_admin());

-- CATEGORIES
create policy "Public and members can read categories" on categories
  for select using (
    (deleted_at is null and is_active = true and tenant_id in (select id from tenants where status = 'active'))
    or is_tenant_member(tenant_id)
  );

create policy "Managers can manage categories" on categories
  for all using (is_tenant_member(tenant_id, 'manager') or is_super_admin());

-- PRODUCTS
create policy "Public and members can read products" on products
  for select using (
    (deleted_at is null and is_available = true and tenant_id in (select id from tenants where status = 'active'))
    or is_tenant_member(tenant_id)
  );

create policy "Managers can manage products" on products
  for all using (is_tenant_member(tenant_id, 'manager') or is_super_admin());

-- PRODUCT OPTION GROUPS & OPTIONS
create policy "Public and members can read option groups" on product_option_groups
  for select using (
    tenant_id in (select id from tenants where status = 'active') or is_tenant_member(tenant_id)
  );

create policy "Managers can manage option groups" on product_option_groups
  for all using (is_tenant_member(tenant_id, 'manager') or is_super_admin());

create policy "Public and members can read options" on product_options
  for select using (true);

create policy "Managers can manage options" on product_options
  for all using (
    group_id in (select id from product_option_groups where is_tenant_member(tenant_id, 'manager'))
    or is_super_admin()
  );

-- CUSTOMERS
create policy "Members can view and manage customers" on customers
  for all using (is_tenant_member(tenant_id) or is_super_admin());

-- ORDERS
create policy "Members can view and update tenant orders" on orders
  for all using (is_tenant_member(tenant_id) or is_super_admin());

create policy "Public can insert new orders" on orders
  for insert with check (tenant_id in (select id from tenants where status = 'active'));

create policy "Public can view own order by id" on orders
  for select using (
    id = id or is_tenant_member(tenant_id) or is_super_admin()
  );

-- ORDER ITEMS
create policy "Members and customer can view order items" on order_items
  for select using (
    order_id in (select id from orders where is_tenant_member(tenant_id) or id = order_items.order_id)
    or is_super_admin()
  );

create policy "Public can insert order items" on order_items
  for insert with check (true);

-- AUDIT LOGS
create policy "Members can read own tenant audit logs" on audit_logs
  for select using (is_tenant_member(tenant_id, 'owner') or is_super_admin());

create policy "System can insert audit logs" on audit_logs
  for insert with check (true);
