-- ==============================================================================
-- FASE 9: SISTEMA DE COMBOS, SUPABASE STORAGE, ESTILOS DE CARTA Y SORTEOS PREMIUM
-- ==============================================================================

-- 1. EXTENSIÓN DE PRODUCTOS PARA COMBOS
alter table products 
  add column if not exists is_combo boolean not null default false,
  add column if not exists original_price numeric(12,2) check (original_price is null or original_price >= 0);

create index if not exists idx_products_is_combo on products(tenant_id, is_combo);

-- 2. TABLA DE PRODUCTOS DENTRO DEL COMBO (product_combo_items)
create table if not exists product_combo_items (
  id uuid primary key default gen_random_uuid(),
  parent_product_id uuid not null references products(id) on delete cascade,
  item_product_id uuid not null references products(id) on delete cascade,
  quantity integer not null default 1 check (quantity > 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_combo_items_parent on product_combo_items(parent_product_id);
create index if not exists idx_combo_items_item on product_combo_items(item_product_id);

-- RLS para product_combo_items
alter table product_combo_items enable row level security;

create policy "Public can view combo items" on product_combo_items
  for select using (true);

create policy "Staff can manage combo items" on product_combo_items
  for all using (
    exists (
      select 1 from products p
      where p.id = product_combo_items.parent_product_id
      and is_tenant_member(p.tenant_id, 'staff')
    )
  );

-- 3. PERSONALIZACIÓN DE CARTA Y ESTILO DE CARDS
alter table tenant_settings
  add column if not exists slogan text default '¡Los mejores sabores al paso!',
  add column if not exists card_style text not null default 'con_foto' check (card_style in ('con_foto', 'sin_foto', 'vintage'));

-- 4. BUCKET DE SUPABASE STORAGE PARA ASSETS GASTRONÓMICOS
insert into storage.buckets (id, name, public)
values ('menu-assets', 'menu-assets', true)
on conflict (id) do update set public = true;

-- Políticas de Supabase Storage para menu-assets
create policy "Public can view menu-assets" on storage.objects
  for select using (bucket_id = 'menu-assets');

create policy "Authenticated users can upload menu-assets" on storage.objects
  for insert with check (bucket_id = 'menu-assets');

create policy "Authenticated users can update menu-assets" on storage.objects
  for update using (bucket_id = 'menu-assets');

create policy "Authenticated users can delete menu-assets" on storage.objects
  for delete using (bucket_id = 'menu-assets');

-- 5. TABLAS DE SORTEOS Y CONCURSOS (EXCLUSIVO PLAN PREMIUM)
create table if not exists raffles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  title text not null,
  description text,
  prize text not null,
  image_url text,
  end_date timestamptz,
  status text not null default 'active' check (status in ('active', 'completed', 'cancelled')),
  winner_name text,
  winner_email text,
  winner_drawn_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_raffles_tenant on raffles(tenant_id);
create index if not exists idx_raffles_status on raffles(tenant_id, status);

create table if not exists raffle_entries (
  id uuid primary key default gen_random_uuid(),
  raffle_id uuid not null references raffles(id) on delete cascade,
  tenant_id uuid not null references tenants(id) on delete cascade,
  customer_id uuid references customers(id) on delete set null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  created_at timestamptz not null default now(),
  constraint uq_raffle_entry_email unique (raffle_id, customer_email)
);

create index if not exists idx_raffle_entries_raffle on raffle_entries(raffle_id);
create index if not exists idx_raffle_entries_tenant on raffle_entries(tenant_id);

-- RLS para Sorteos
alter table raffles enable row level security;
alter table raffle_entries enable row level security;

create policy "Staff can manage raffles" on raffles
  for all using (is_tenant_member(tenant_id, 'staff'));

create policy "Public can view active or completed raffles" on raffles
  for select using (status in ('active', 'completed'));

create policy "Staff can view raffle entries" on raffle_entries
  for select using (is_tenant_member(tenant_id, 'staff'));

create policy "Public can insert raffle entry" on raffle_entries
  for insert with check (true);

-- 6. AGREGAR FEATURE 'raffles' AL SISTEMA DE PLANES
insert into features (code, name, description) values
  ('raffles', 'Sorteos y Concursos', 'Gestión de sorteos exclusivos para captación y fidelización de clientes con ruleta al azar')
on conflict (code) do nothing;

-- Habilitar sorteos en Plan Premium y permitir en período de prueba
insert into plan_features (plan_id, feature_id, value)
select p.id, f.id, 'true'::jsonb
from plans p, features f
where p.code = 'premium' and f.code = 'raffles'
on conflict (plan_id, feature_id) do update set value = 'true'::jsonb;
