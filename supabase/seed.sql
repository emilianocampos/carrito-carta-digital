-- ==============================================================================
-- CARRITO TAKE-AWAY: SYSTEM SEED DATA
-- Features Catalog, Plans Definition & Default Feature Limits
-- (Sin datos mock/demo: los negocios y cartas se crean dinámicamente)
-- ==============================================================================

-- 1. FEATURES CATALOG
insert into features (code, name, description) values
  ('digital_menu', 'Carta Digital Móvil', 'Acceso a carta digital pública para clientes vía link o QR'),
  ('orders', 'Recepción de Pedidos', 'Capacidad de recibir pedidos desde la carta digital'),
  ('realtime_orders', 'Pedidos en Tiempo Real', 'Actualización instantánea por WebSocket sin refrescar pantalla'),
  ('qr_generator', 'Generador de Códigos QR', 'Descarga de códigos QR en alta resolución para mesas o mostrador'),
  ('scheduled_orders', 'Pedidos Programados', 'Permite a los clientes elegir horario de retiro futuro'),
  ('payments_online', 'Pagos Online (Mercado Pago)', 'Cobro automatizado con tarjeta, débito y dinero en cuenta'),
  ('customers_crm', 'CRM de Clientes', 'Base de datos de clientes con historial de consumo y pedidos'),
  ('loyalty_points', 'Programa de Puntos y Fidelización', 'Acumulación de puntos por compras canjeables por descuentos'),
  ('coupons', 'Cupones de Descuento', 'Gestión de promociones porcentuales o de monto fijo'),
  ('analytics_basic', 'Estadísticas Básicas', 'Reporte de ventas del día, ticket promedio y pedidos'),
  ('analytics_advanced', 'Estadísticas Avanzadas', 'Horarios de mayor demanda, ranking de productos y retención'),
  ('custom_themes', 'Personalización Visual Completa', 'Acceso a todos los presets y personalización de colores'),
  ('ai_descriptions', 'Descripciones con IA', 'Generación automática de descripciones persuasivas con IA'),
  ('ai_menu_import', 'Importación de Carta con IA', 'Digitalización de cartas a partir de fotos, PDF o planillas')
on conflict (code) do nothing;

-- 2. PLANS DEFINITION
insert into plans (id, code, name, price, currency, billing_cycle, is_active) values
  ('11111111-1111-1111-1111-111111111111', 'basic', 'Plan Básico Food Truck', 45000.00, 'ARS', 'monthly', true),
  ('22222222-2222-2222-2222-222222222222', 'pro', 'Plan Profesional', 85000.00, 'ARS', 'monthly', true),
  ('33333333-3333-3333-3333-333333333333', 'premium', 'Plan Premium Gastronómico', 140000.00, 'ARS', 'monthly', true)
on conflict (code) do nothing;

-- 3. PLAN FEATURES & LIMITS MAPPING
-- BASIC PLAN (50 productos, 5 categorías, sin IA, pagos opcionales)
insert into plan_features (plan_id, feature_id, value)
select '11111111-1111-1111-1111-111111111111', id, 
  case 
    when code = 'max_products' then '50'::jsonb
    when code = 'max_categories' then '5'::jsonb
    when code in ('digital_menu', 'orders', 'realtime_orders', 'qr_generator', 'analytics_basic') then 'true'::jsonb
    else 'false'::jsonb
  end
from features
on conflict (plan_id, feature_id) do nothing;

-- PRO PLAN (200 productos, cupones, programados, fidelización)
insert into plan_features (plan_id, feature_id, value)
select '22222222-2222-2222-2222-222222222222', id, 
  case 
    when code = 'max_products' then '200'::jsonb
    when code = 'max_categories' then '15'::jsonb
    when code in ('ai_menu_import') then 'false'::jsonb
    else 'true'::jsonb
  end
from features
on conflict (plan_id, feature_id) do nothing;

-- PREMIUM PLAN (ilimitado, todo habilitado)
insert into plan_features (plan_id, feature_id, value)
select '33333333-3333-3333-3333-333333333333', id, 
  case 
    when code = 'max_products' then '9999'::jsonb
    when code = 'max_categories' then '999'::jsonb
    else 'true'::jsonb
  end
from features
on conflict (plan_id, feature_id) do nothing;
