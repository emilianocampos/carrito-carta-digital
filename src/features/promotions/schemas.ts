import { z } from 'zod';

export const couponSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3, 'El código debe tener al menos 3 caracteres')
    .max(20, 'Máximo 20 caracteres')
    .regex(/^[A-Z0-9_-]+$/, 'Solo letras mayúsculas, números y guiones')
    .transform((val) => val.toUpperCase()),
  discountType: z.enum(['percentage', 'fixed_amount']),
  discountValue: z.coerce.number().positive('El valor de descuento debe ser mayor a 0'),
  minOrderAmount: z.coerce.number().nonnegative('El monto mínimo no puede ser negativo').default(0),
  maxDiscountAmount: z.coerce.number().positive().optional().nullable(),
  maxUses: z.coerce.number().int().positive().optional().nullable(),
  validFrom: z.string().datetime().optional().nullable(),
  validUntil: z.string().datetime().optional().nullable(),
}).refine(
  (data) => {
    if (data.discountType === 'percentage' && data.discountValue > 100) {
      return false;
    }
    return true;
  },
  {
    message: 'El porcentaje de descuento no puede superar el 100%',
    path: ['discountValue'],
  }
);

export type CouponInput = z.infer<typeof couponSchema>;

export const validateCouponSchema = z.object({
  tenantSlug: z.string().min(1),
  code: z.string().trim().min(1),
  subtotal: z.number().nonnegative(),
});

export type ValidateCouponInput = z.infer<typeof validateCouponSchema>;
