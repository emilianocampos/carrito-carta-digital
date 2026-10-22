import { createClient } from '@/lib/supabase/server';
import { canCreateProduct } from '@/features/billing/entitlements';

export interface PublicOption {
  id: string;
  name: string;
  extraPrice: number;
}

export interface PublicOptionGroup {
  id: string;
  name: string;
  minSelectable: number;
  maxSelectable: number;
  isRequired: boolean;
  options: PublicOption[];
}

export interface PublicProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  originalPrice: number | null;
  imageUrl: string | null;
  preparationTimeMinutes: number;
  isAvailable: boolean;
  isFeatured: boolean;
  isCombo: boolean;
  categoryId: string;
  categoryName?: string;
  optionGroups: PublicOptionGroup[];
  comboItems?: Array<{ name: string; quantity: number }>;
}

export interface PublicCategory {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  products: PublicProduct[];
}

export interface PublicMenuData {
  tenant: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    bannerUrl: string | null;
  };
  settings: {
    currency: string;
    currentPreparationTimeMinutes: number;
    isOrderingPaused: boolean;
    pauseReason: string | null;
    acceptsCash: boolean;
    acceptsMercadoPago: boolean;
    whatsappPhone: string | null;
    address: string | null;
    slogan: string | null;
    cardStyle: 'con_foto' | 'sin_foto' | 'vintage';
  };
  theme: {
    presetCode: string;
    tokens: Record<string, unknown>;
    layoutConfig: Record<string, unknown>;
  };
  categories: PublicCategory[];
}

/**
 * Consulta la carta digital pública por el slug del carrito.
 * Ejecutado en el servidor mediante React Server Component.
 * Totalmente seguro: solo expone productos y categorías activas de tenants activos.
 */
export async function getPublicMenuBySlug(slug: string): Promise<PublicMenuData | null> {
  const supabase = await createClient();

  // 1. Obtener Tenant activo
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('id, name, slug, logo_url, banner_url, status')
    .eq('slug', slug)
    .eq('status', 'active')
    .single();

  if (tenantError || !tenant) {
    return null;
  }

  // 2. Obtener Settings y Menú Theme
  const [{ data: settings }, { data: theme }] = await Promise.all([
    supabase.from('tenant_settings').select('*').eq('tenant_id', tenant.id).single(),
    supabase.from('menu_themes').select('*').eq('tenant_id', tenant.id).single(),
  ]);

  // 3. Obtener Categorías activas
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, description, image_url, sort_order')
    .eq('tenant_id', tenant.id)
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true });

  if (!categories || categories.length === 0) {
    return {
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        logoUrl: tenant.logo_url,
        bannerUrl: tenant.banner_url,
      },
      settings: {
        currency: settings?.currency ?? 'ARS',
        currentPreparationTimeMinutes: settings?.current_preparation_time_minutes ?? 20,
        isOrderingPaused: settings?.is_ordering_paused ?? false,
        pauseReason: settings?.pause_reason ?? null,
        acceptsCash: settings?.accepts_cash ?? true,
        acceptsMercadoPago: settings?.accepts_mercadopago ?? false,
        whatsappPhone: settings?.whatsapp_phone ?? null,
        address: settings?.address ?? null,
        slogan: (settings as unknown as { slogan?: string })?.slogan ?? '¡Los mejores sabores al paso!',
        cardStyle: ((settings as unknown as { card_style?: 'con_foto' | 'sin_foto' | 'vintage' })?.card_style) ?? 'con_foto',
      },
      theme: {
        presetCode: theme?.preset_code ?? 'street_food_dark',
        tokens: (theme?.tokens as Record<string, unknown>) ?? {},
        layoutConfig: (theme?.layout_config as Record<string, unknown>) ?? {},
      },
      categories: [],
    };
  }

  // 4. Obtener Productos activos con sus opciones y combos
  const categoryIds = categories.map((c) => c.id);
  let products: Array<{
    id: string;
    category_id: string;
    name: string;
    description: string | null;
    price: number;
    original_price?: number | null;
    image_url: string | null;
    preparation_time_minutes: number;
    is_available: boolean;
    is_featured: boolean;
    is_combo?: boolean;
    sort_order: number;
  }> | null = null;

  const { data: prodsWithCombos, error: prodError } = await supabase
    .from('products')
    .select(`
      id,
      category_id,
      name,
      description,
      price,
      original_price,
      image_url,
      preparation_time_minutes,
      is_available,
      is_featured,
      is_combo,
      sort_order
    `)
    .eq('tenant_id', tenant.id)
    .in('category_id', categoryIds)
    .eq('is_available', true)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true });

  if (prodError || !prodsWithCombos) {
    // Fallback gracioso si aún no se corrió la migración de is_combo / original_price
    const { data: standardProds } = await supabase
      .from('products')
      .select(`
        id,
        category_id,
        name,
        description,
        price,
        image_url,
        preparation_time_minutes,
        is_available,
        is_featured,
        sort_order
      `)
      .eq('tenant_id', tenant.id)
      .in('category_id', categoryIds)
      .eq('is_available', true)
      .is('deleted_at', null)
      .order('sort_order', { ascending: true });

    products = (standardProds ?? []).map((p) => ({
      ...p,
      is_combo: false,
      original_price: null,
    }));
  } else {
    products = prodsWithCombos;
  }

  // 5. Obtener Grupos de opciones y Opciones
  const productIds = products ? products.map((p) => p.id) : [];
  let optionGroupsMap: Record<string, PublicOptionGroup[]> = {};
  let comboItemsMap: Record<string, Array<{ name: string; quantity: number }>> = {};

  // Resolver items de combos si existen
  const comboProductIds = (products ?? []).filter((p) => p.is_combo).map((p) => p.id);
  if (comboProductIds.length > 0) {
    try {
      const { data: rawComboItems } = await supabase
        .from('product_combo_items')
        .select('parent_product_id, item_product_id, quantity')
        .in('parent_product_id', comboProductIds)
        .order('sort_order', { ascending: true });

      if (rawComboItems && rawComboItems.length > 0) {
        const itemProductIds = rawComboItems.map((ci) => ci.item_product_id);
        const { data: itemProducts } = await supabase
          .from('products')
          .select('id, name')
          .in('id', itemProductIds);

        const itemProductNames = new Map<string, string>();
        itemProducts?.forEach((ip) => itemProductNames.set(ip.id, ip.name));

        rawComboItems.forEach((ci) => {
          if (!comboItemsMap[ci.parent_product_id]) comboItemsMap[ci.parent_product_id] = [];
          comboItemsMap[ci.parent_product_id].push({
            name: itemProductNames.get(ci.item_product_id) || 'Plato incluido',
            quantity: ci.quantity,
          });
        });
      }
    } catch {
      // Ignorar si la tabla product_combo_items aún no existe
    }
  }

  if (productIds.length > 0) {
    const { data: groups } = await supabase
      .from('product_option_groups')
      .select('id, product_id, name, min_selectable, max_selectable, is_required, sort_order')
      .in('product_id', productIds)
      .order('sort_order', { ascending: true });

    if (groups && groups.length > 0) {
      const groupIds = groups.map((g) => g.id);
      const { data: options } = await supabase
        .from('product_options')
        .select('id, group_id, name, extra_price, is_available, sort_order')
        .in('group_id', groupIds)
        .eq('is_available', true)
        .order('sort_order', { ascending: true });

      const optionsByGroup: Record<string, PublicOption[]> = {};
      options?.forEach((opt) => {
        if (!optionsByGroup[opt.group_id]) optionsByGroup[opt.group_id] = [];
        optionsByGroup[opt.group_id].push({
          id: opt.id,
          name: opt.name,
          extraPrice: Number(opt.extra_price),
        });
      });

      groups.forEach((g) => {
        if (!optionGroupsMap[g.product_id]) optionGroupsMap[g.product_id] = [];
        optionGroupsMap[g.product_id].push({
          id: g.id,
          name: g.name,
          minSelectable: g.min_selectable,
          maxSelectable: g.max_selectable,
          isRequired: g.is_required,
          options: optionsByGroup[g.id] ?? [],
        });
      });
    }
  }

  // 6. Armar árbol anidado de categorías con productos
  const categoriesWithProducts: PublicCategory[] = categories.map((cat) => {
    const catProducts = (products ?? [])
      .filter((p) => p.category_id === cat.id)
      .map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: Number(p.price),
        originalPrice: p.original_price ? Number(p.original_price) : null,
        imageUrl: p.image_url,
        preparationTimeMinutes: p.preparation_time_minutes,
        isAvailable: p.is_available,
        isFeatured: p.is_featured,
        isCombo: Boolean(p.is_combo),
        categoryId: p.category_id,
        optionGroups: optionGroupsMap[p.id] ?? [],
        comboItems: comboItemsMap[p.id] ?? [],
      }));

    return {
      id: cat.id,
      name: cat.name,
      description: cat.description,
      imageUrl: cat.image_url,
      sortOrder: cat.sort_order,
      products: catProducts,
    };
  });

  return {
    tenant: {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      logoUrl: tenant.logo_url,
      bannerUrl: tenant.banner_url,
    },
    settings: {
      currency: settings?.currency ?? 'ARS',
      currentPreparationTimeMinutes: settings?.current_preparation_time_minutes ?? 20,
      isOrderingPaused: settings?.is_ordering_paused ?? false,
      pauseReason: settings?.pause_reason ?? null,
      acceptsCash: settings?.accepts_cash ?? true,
      acceptsMercadoPago: settings?.accepts_mercadopago ?? false,
      whatsappPhone: settings?.whatsapp_phone ?? null,
      address: settings?.address ?? null,
      slogan: (settings as unknown as { slogan?: string })?.slogan ?? '¡Los mejores sabores al paso!',
      cardStyle: ((settings as unknown as { card_style?: 'con_foto' | 'sin_foto' | 'vintage' })?.card_style) ?? 'con_foto',
    },
    theme: {
      presetCode: theme?.preset_code ?? 'street_food_dark',
      tokens: (theme?.tokens as Record<string, unknown>) ?? {},
      layoutConfig: (theme?.layout_config as Record<string, unknown>) ?? {},
    },
    categories: categoriesWithProducts,
  };
}

// ==============================================================================
// CONSULTA ADMINISTRATIVA DE PRODUCTOS & CATEGORÍAS (CRUD COMPLETO)
// ==============================================================================

export interface AdminProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  originalPrice?: number | null;
  imageUrl: string | null;
  preparationTimeMinutes: number;
  isAvailable: boolean;
  isFeatured: boolean;
  sortOrder: number;
  categoryId: string;
  categoryName: string;
  optionGroups: PublicOptionGroup[];
}

export interface AdminComboItem {
  id: string;
  productId: string;
  productName: string;
  productPrice: number;
  productImageUrl: string | null;
  quantity: number;
  sortOrder: number;
}

export interface AdminCombo {
  id: string;
  name: string;
  description: string | null;
  price: number;
  originalPrice: number | null;
  imageUrl: string | null;
  preparationTimeMinutes: number;
  isAvailable: boolean;
  isFeatured: boolean;
  sortOrder: number;
  categoryId: string;
  categoryName: string;
  items: AdminComboItem[];
  regularCalculatedPrice: number;
  savingsAmount: number;
  discountPercentage: number;
}

export interface AdminCategory {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  productsCount: number;
}

export interface AdminCatalogData {
  tenant: {
    id: string;
    name: string;
    slug: string;
  };
  currency: string;
  categories: AdminCategory[];
  products: AdminProduct[];
  combos: AdminCombo[];
  planLimit: {
    current: number;
    limit: number;
    allowed: boolean;
  };
}

export async function getAdminCatalogData(slug: string): Promise<AdminCatalogData | null> {
  const supabase = await createClient();

  // 1. Obtener Tenant
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('id, name, slug')
    .eq('slug', slug)
    .single();

  if (tenantError || !tenant) return null;

  // 2. Settings (Moneda) y Límites de Plan
  const [{ data: settings }, planLimit] = await Promise.all([
    supabase.from('tenant_settings').select('currency').eq('tenant_id', tenant.id).maybeSingle(),
    canCreateProduct(tenant.id),
  ]);

  const currency = settings?.currency ?? 'ARS';

  // 3. Obtener todas las categorías (no eliminadas)
  const { data: rawCategories } = await supabase
    .from('categories')
    .select('id, name, description, image_url, sort_order, is_active')
    .eq('tenant_id', tenant.id)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true });

  const categoriesList = rawCategories ?? [];

  // 4. Obtener todos los productos y combos (no eliminados)
  let rawProducts: Array<{
    id: string;
    category_id: string;
    name: string;
    description: string | null;
    price: number;
    original_price?: number | null;
    image_url: string | null;
    preparation_time_minutes: number;
    is_available: boolean;
    is_featured: boolean;
    is_combo?: boolean;
    sort_order: number;
  }> | null = null;

  const { data: prodsData, error: prodsErr } = await supabase
    .from('products')
    .select(`
      id,
      category_id,
      name,
      description,
      price,
      original_price,
      image_url,
      preparation_time_minutes,
      is_available,
      is_featured,
      is_combo,
      sort_order
    `)
    .eq('tenant_id', tenant.id)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true });

  if (prodsErr || !prodsData) {
    const { data: standardData } = await supabase
      .from('products')
      .select(`
        id,
        category_id,
        name,
        description,
        price,
        image_url,
        preparation_time_minutes,
        is_available,
        is_featured,
        sort_order
      `)
      .eq('tenant_id', tenant.id)
      .is('deleted_at', null)
      .order('sort_order', { ascending: true });

    rawProducts = (standardData ?? []).map((p) => ({
      ...p,
      is_combo: false,
      original_price: null,
    }));
  } else {
    rawProducts = prodsData;
  }

  const allItems = rawProducts ?? [];
  const normalProductsList = allItems.filter((p) => !p.is_combo);
  const combosRawList = allItems.filter((p) => p.is_combo);

  // Mapa rápido de productos por ID (para calcular precios de combos)
  const productPriceMap = new Map<string, { name: string; price: number; imageUrl: string | null }>();
  allItems.forEach((p) => {
    productPriceMap.set(p.id, {
      name: p.name,
      price: Number(p.price),
      imageUrl: p.image_url,
    });
  });

  // 5. Obtener grupos de opciones y opciones para los productos normales
  const normalProductIds = normalProductsList.map((p) => p.id);
  const optionGroupsMap: Record<string, PublicOptionGroup[]> = {};

  if (normalProductIds.length > 0) {
    const { data: groups } = await supabase
      .from('product_option_groups')
      .select('id, product_id, name, min_selectable, max_selectable, is_required, sort_order')
      .in('product_id', normalProductIds)
      .order('sort_order', { ascending: true });

    if (groups && groups.length > 0) {
      const groupIds = groups.map((g) => g.id);
      const { data: options } = await supabase
        .from('product_options')
        .select('id, group_id, name, extra_price, is_available, sort_order')
        .in('group_id', groupIds)
        .order('sort_order', { ascending: true });

      const optionsByGroup: Record<string, PublicOption[]> = {};
      options?.forEach((opt) => {
        if (!optionsByGroup[opt.group_id]) optionsByGroup[opt.group_id] = [];
        optionsByGroup[opt.group_id].push({
          id: opt.id,
          name: opt.name,
          extraPrice: Number(opt.extra_price),
        });
      });

      groups.forEach((g) => {
        if (!optionGroupsMap[g.product_id]) optionGroupsMap[g.product_id] = [];
        optionGroupsMap[g.product_id].push({
          id: g.id,
          name: g.name,
          minSelectable: g.min_selectable,
          maxSelectable: g.max_selectable,
          isRequired: g.is_required,
          options: optionsByGroup[g.id] ?? [],
        });
      });
    }
  }

  // 6. Obtener items de combos
  const comboIds = combosRawList.map((c) => c.id);
  const comboItemsMap: Record<string, AdminComboItem[]> = {};

  if (comboIds.length > 0) {
    const { data: comboItemsRaw } = await supabase
      .from('product_combo_items')
      .select('id, parent_product_id, item_product_id, quantity, sort_order')
      .in('parent_product_id', comboIds)
      .order('sort_order', { ascending: true });

    (comboItemsRaw ?? []).forEach((ci) => {
      if (!comboItemsMap[ci.parent_product_id]) comboItemsMap[ci.parent_product_id] = [];
      const prodData = productPriceMap.get(ci.item_product_id);
      comboItemsMap[ci.parent_product_id].push({
        id: ci.id,
        productId: ci.item_product_id,
        productName: prodData?.name || 'Plato',
        productPrice: prodData?.price || 0,
        productImageUrl: prodData?.imageUrl || null,
        quantity: ci.quantity,
        sortOrder: ci.sort_order,
      });
    });
  }

  // Mapa de nombres de categorías
  const categoryNameMap = new Map<string, string>();
  categoriesList.forEach((c) => categoryNameMap.set(c.id, c.name));

  // 7. Formatear productos normales
  const products: AdminProduct[] = normalProductsList.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    price: Number(p.price),
    originalPrice: p.original_price ? Number(p.original_price) : null,
    imageUrl: p.image_url,
    preparationTimeMinutes: p.preparation_time_minutes,
    isAvailable: p.is_available,
    isFeatured: p.is_featured,
    sortOrder: p.sort_order,
    categoryId: p.category_id,
    categoryName: categoryNameMap.get(p.category_id) || 'Sin Categoría',
    optionGroups: optionGroupsMap[p.id] ?? [],
  }));

  // 8. Formatear combos con cálculo de ahorro
  const combos: AdminCombo[] = combosRawList.map((c) => {
    const items = comboItemsMap[c.id] ?? [];
    const regularCalculatedPrice = items.reduce(
      (sum, item) => sum + item.productPrice * item.quantity,
      0
    );
    const comboPrice = Number(c.price);
    const referencePrice = c.original_price ? Number(c.original_price) : regularCalculatedPrice;
    const savingsAmount = Math.max(0, referencePrice - comboPrice);
    const discountPercentage =
      referencePrice > 0 ? Math.round((savingsAmount / referencePrice) * 100) : 0;

    return {
      id: c.id,
      name: c.name,
      description: c.description,
      price: comboPrice,
      originalPrice: c.original_price ? Number(c.original_price) : null,
      imageUrl: c.image_url,
      preparationTimeMinutes: c.preparation_time_minutes,
      isAvailable: c.is_available,
      isFeatured: c.is_featured,
      sortOrder: c.sort_order,
      categoryId: c.category_id,
      categoryName: categoryNameMap.get(c.category_id) || 'Combos & Promos',
      items,
      regularCalculatedPrice,
      savingsAmount,
      discountPercentage,
    };
  });

  // 9. Formatear categorías con conteo de productos y combos
  const categories: AdminCategory[] = categoriesList.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    imageUrl: c.image_url,
    sortOrder: c.sort_order,
    isActive: c.is_active,
    productsCount: allItems.filter((p) => p.category_id === c.id).length,
  }));

  return {
    tenant: {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
    },
    currency,
    categories,
    products,
    combos,
    planLimit,
  };
}

