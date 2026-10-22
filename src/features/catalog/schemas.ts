import { z } from 'zod';

export const categorySchema = z.object({
  name: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(50, 'Máximo 50 caracteres'),
  description: z.string().trim().max(255, 'Máximo 255 caracteres').optional().nullable(),
  imageUrl: z.string().optional().nullable().or(z.literal('')),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
});

export type CategoryInput = z.infer<typeof categorySchema>;

export const productOptionSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, 'El nombre de la opción es requerido').max(50),
  extraPrice: z.coerce.number().min(0, 'El precio adicional no puede ser negativo').default(0),
  isAvailable: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
});

export const productOptionGroupSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2, 'El nombre del grupo es requerido').max(50),
  minSelectable: z.coerce.number().int().min(0).default(0),
  maxSelectable: z.coerce.number().int().min(1).default(1),
  isRequired: z.boolean().default(false),
  sortOrder: z.coerce.number().int().default(0),
  options: z.array(productOptionSchema).default([]),
});

export const productSchema = z.object({
  name: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(80, 'Máximo 80 caracteres'),
  categoryId: z.string().uuid('Categoría inválida'),
  description: z.string().trim().max(500, 'Máximo 500 caracteres').optional().nullable(),
  price: z.coerce.number().min(0, 'El precio no puede ser negativo'),
  imageUrl: z.string().optional().nullable().or(z.literal('')),
  preparationTimeMinutes: z.coerce.number().int().min(0).max(180).default(15),
  isAvailable: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  sortOrder: z.coerce.number().int().default(0),
  optionGroups: z.array(productOptionGroupSchema).optional().default([]),
});

export type ProductInput = z.infer<typeof productSchema>;

export const comboItemSchema = z.object({
  id: z.string().uuid().optional(),
  productId: z.string().uuid('Producto inválido'),
  quantity: z.coerce.number().int().min(1, 'La cantidad debe ser al menos 1').default(1),
  sortOrder: z.coerce.number().int().default(0),
});

export type ComboItemInput = z.infer<typeof comboItemSchema>;

export const comboSchema = z.object({
  name: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(80, 'Máximo 80 caracteres'),
  categoryId: z.string().uuid('Categoría inválida'),
  description: z.string().trim().max(500, 'Máximo 500 caracteres').optional().nullable(),
  price: z.coerce.number().min(0, 'El precio no puede ser negativo'),
  originalPrice: z.coerce.number().min(0).optional().nullable(),
  imageUrl: z.string().optional().nullable().or(z.literal('')),
  preparationTimeMinutes: z.coerce.number().int().min(0).max(180).default(20),
  isAvailable: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  sortOrder: z.coerce.number().int().default(0),
  items: z.array(comboItemSchema).min(1, 'El combo debe contener al menos 1 producto'),
});

export type ComboInput = z.infer<typeof comboSchema>;
