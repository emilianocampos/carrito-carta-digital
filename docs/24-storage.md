# 24 — SUPABASE STORAGE Y GESTIÓN DE FOTOS
## Almacenamiento de Imágenes, Buckets Públicos y Rendimiento CDN

---

## 1. ¿POR QUÉ NUNCA GUARDAR IMÁGENES DENTRO DE POSTGRESQL?

Guardar imágenes como texto en Base64 o binarios (`bytea`) dentro de la base de datos es un grave error de arquitectura:
1. **Multiplica el tamaño de la base de datos por 10x.**
2. **Ralentiza los backups y las consultas SQL.**
3. **Satura la memoria RAM de PostgreSQL.**

En **Carrito Take-Away**, PostgreSQL únicamente almacena la **URL pública** (`image_url: text`), mientras que los archivos binarios (imágenes JPG, PNG, WebP) se almacenan en **Supabase Storage**.

---

## 2. ARQUITECTURA DE BUCKETS EN SUPABASE

Supabase Storage está construido sobre **S3** con una capa de aceleración CDN global:

```text
[Navegador / Admin Carrito]
           │  (Sube foto de hamburguesa)
           ▼
[Bucket: menu-assets / {tenantId}/products/{uuid}.webp]
           │
           ▼ (CDN Cache automático)
[URL Pública: https://...supabase.co/storage/v1/object/public/menu-assets/...]
           │
           ▼ (Se almacena solo el enlace de texto)
[PostgreSQL: products.image_url]
```

### Configuración del Bucket `menu-assets`:
* **Público (`public = true`):** Permite que cualquier cliente que cargue la carta digital descargue las fotos a máxima velocidad sin tokens firmados temporales.
* **Límite de tamaño por archivo:** 2 MB (suficiente para fotos optimizadas de gastronomía).
* **MIME Types permitidos:** `image/jpeg`, `image/png`, `image/webp`.

---

## 3. POLÍTICAS DE ACCESO RLS EN STORAGE (`storage.objects`)

De la misma manera que las tablas SQL están protegidas por RLS, los buckets de Supabase Storage tienen sus propias políticas:

```sql
-- 1. Lectura pública de imágenes de la carta
create policy "Public can view menu images" on storage.objects
  for select using (bucket_id = 'menu-assets');

-- 2. Solo los miembros autorizados del tenant pueden subir fotos a su carpeta
create policy "Tenant members can upload images" on storage.objects
  for insert with check (
    bucket_id = 'menu-assets'
    and (storage.foldername(name))[1]::uuid in (select get_auth_tenant_ids())
  );
```

### Consecuencia de Seguridad:
El dueño del Carrito A no puede sobrescribir, alterar ni borrar los banners o fotos de productos del Carrito B, porque el nombre de la carpeta debe coincidir con su `tenant_id` verificado en `memberships`.
