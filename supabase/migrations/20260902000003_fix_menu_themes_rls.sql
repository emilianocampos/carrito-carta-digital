-- ==============================================================================
-- Migration: Corregir Políticas RLS para menu_themes y tenant_settings
-- ==============================================================================

-- 1. MENU THEMES (Permitir UPSERT / INSERT a los managers)
drop policy if exists "Managers can update menu themes" on menu_themes;
drop policy if exists "Managers can insert menu themes" on menu_themes;
drop policy if exists "Managers can manage menu themes" on menu_themes;

create policy "Managers can manage menu themes" on menu_themes
  for all
  using (is_tenant_member(tenant_id, 'manager') or is_super_admin())
  with check (is_tenant_member(tenant_id, 'manager') or is_super_admin());

-- 2. TENANT SETTINGS (Permitir UPSERT / INSERT a los managers)
drop policy if exists "Managers can update tenant settings" on tenant_settings;
drop policy if exists "Managers can insert tenant settings" on tenant_settings;
drop policy if exists "Managers can manage tenant settings" on tenant_settings;

create policy "Managers can manage tenant settings" on tenant_settings
  for all
  using (is_tenant_member(tenant_id, 'manager') or is_super_admin())
  with check (is_tenant_member(tenant_id, 'manager') or is_super_admin());
