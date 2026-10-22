import { z } from 'zod';

export const orderItemInputSchema = z.object({
  productId: z.string().uuid('ID de producto inválido'),
  quantity: z.coerce.number().int().min(1, 'La cantidad debe ser al menos 1'),
  selectedOptionIds: z.array(z.string().uuid()).default([]),
  notes: z.string().trim().max(120, 'Máximo 120 caracteres').optional(),
});

export const createOrderSchema = z.object({
  tenantId: z.string().uuid('ID de carrito inválido'),
  customerName: z.string().trim().min(2, 'Ingresá tu nombre').max(50, 'Máximo 50 caracteres'),
  customerPhone: z
    .string()
    .trim()
    .min(8, 'Ingresá un número de teléfono válido')
    .max(20, 'Máximo 20 caracteres')
    .regex(/^[0-9+\s()-]+$/, 'Formato de teléfono no válido'),
  orderType: z.enum(['takeaway', 'pickup_scheduled']).default('takeaway'),
  scheduledFor: z.string().datetime().optional().nullable(),
  paymentMethod: z.enum(['cash_on_pickup', 'mercadopago']).default('cash_on_pickup'),
  couponCode: z.string().trim().max(20).optional().nullable(),
  notes: z.string().trim().max(255, 'Máximo 255 caracteres').optional().nullable(),
  items: z.array(orderItemInputSchema).min(1, 'El pedido debe contener al menos un producto'),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type OrderItemInput = z.infer<typeof orderItemInputSchema>;
