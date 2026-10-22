import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combina clases condicionales de Tailwind resolviendo conflictos de especificidad.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formatea valores numéricos a moneda local (por defecto ARS).
 */
export function formatCurrency(amount: number, currency: string = 'ARS'): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Genera un slug seguro para URLs a partir del nombre del carrito.
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remueve acentos
    .replace(/\s+/g, '-') // Reemplaza espacios con guiones
    .replace(/[^\w-]+/g, '') // Elimina caracteres no alfanuméricos
    .replace(/--+/g, '-'); // Elimina guiones duplicados
}

/**
 * Convierte un texto a formato Nombre Propio / Title Case (D D) con mayúscula inicial por palabra.
 */
export function toTitleCase(value: string): string {
  if (!value) return '';
  return value.replace(/(?:^|\s)\S/g, (char) => char.toUpperCase());
}

