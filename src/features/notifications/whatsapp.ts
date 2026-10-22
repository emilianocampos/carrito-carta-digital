/**
 * Generador de URLs de WhatsApp con plantillas de mensajería comercial sin costos de API oficial.
 */

function sanitizePhoneNumber(phone: string): string {
  // Limpia cualquier caracter no numérico
  let cleaned = phone.replace(/[^0-9]/g, '');
  // Si comienza sin prefijo internacional en Argentina (+54), anteponerlo si es necesario
  if (cleaned.length === 10) {
    cleaned = `549${cleaned}`;
  }
  return cleaned;
}

export function buildOrderReadyWhatsAppUrl(params: {
  phone: string;
  customerName: string;
  orderNumber: number;
  tenantName: string;
  trackingUrl: string;
}): string {
  const cleanPhone = sanitizePhoneNumber(params.phone);
  const text = `¡Hola ${params.customerName}! 🍔 Tu pedido *#${params.orderNumber}* de *${params.tenantName}* está LISTO para retirar en el mostrador.

Seguí los detalles acá:
${params.trackingUrl}

¡Que lo disfrutes mucho!`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}

export function buildOrderConfirmedWhatsAppUrl(params: {
  phone: string;
  customerName: string;
  orderNumber: number;
  tenantName: string;
  estimatedMinutes: number;
  trackingUrl: string;
}): string {
  const cleanPhone = sanitizePhoneNumber(params.phone);
  const text = `¡Hola ${params.customerName}! Recibimos tu pedido *#${params.orderNumber}* en *${params.tenantName}*. 👨‍🍳

Tiempo estimado de elaboración: *${params.estimatedMinutes} minutos*.
Podés seguir el estado en vivo desde tu celular:
${params.trackingUrl}`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}

export function buildWhatsAppContactUrl(phone: string, tenantName: string): string {
  const cleanPhone = sanitizePhoneNumber(phone);
  const text = `Hola *${tenantName}*! Tengo una consulta sobre mi comanda.`;
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}
