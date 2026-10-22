-- ==============================================================================
-- FASE 8: CREDENCIALES DE MERCADO PAGO Y CONCILIACIÓN DE PAGOS POR TENANT
-- ==============================================================================

alter table tenant_settings 
  add column if not exists mercadopago_access_token text,
  add column if not exists mercadopago_public_key text,
  add column if not exists mercadopago_sandbox_mode boolean not null default true;

-- Columna para almacenar el ID de pago de la pasarela y la URL del punto de inicio
alter table orders 
  add column if not exists gateway_payment_id text,
  add column if not exists gateway_preference_id text,
  add column if not exists gateway_init_point text;

create index if not exists idx_orders_gateway_payment on orders(gateway_payment_id);
create index if not exists idx_orders_gateway_preference on orders(gateway_preference_id);
