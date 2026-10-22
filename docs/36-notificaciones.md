# 36 — SISTEMA DE NOTIFICACIONES MULTICANAL
## WhatsApp Direct Links, Web Audio API, Vibración Háptica y Realtime

---

## 1. MATRIZ DE CANALES DE NOTIFICACIÓN

Para mantener informado al comensal sin incurrir en costos mensuales prohibitivos de SMS o APIs oficiales de WhatsApp Business, **Carrito Take-Away** combina cuatro tecnologías complementarias:

| Canal | Destinatario | Momento de Activación | Costo |
| :--- | :--- | :--- | :--- |
| **Supabase Realtime** | Comensal en tracking | Cambio de estado de la orden | $0 |
| **Vibración Háptica** | Celular del comensal | Cuando la orden pasa a `ready` | $0 |
| **Web Audio API** | Cocinero (KDS) | Entrada de comanda o pago aprobado | $0 |
| **WhatsApp Direct Link** | Comensal / Carrito | Aviso de comanda lista o dudas | $0 |

---

## 2. AVISO DIRECTO POR WHATSAPP SIN COSTO POR MENSAJE

Cuando una comanda está lista, el operador puede tocar el botón de WhatsApp en la comanda. La aplicación genera un enlace codificado:

```typescript
// Generador en src/features/notifications/whatsapp.ts
export function buildOrderReadyWhatsAppUrl(params) {
  const cleanPhone = sanitizePhoneNumber(params.phone);
  const text = `¡Hola ${params.customerName}! 🍔 Tu pedido #${params.orderNumber} de ${params.tenantName} está LISTO para retirar...`;
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}
```

Al tocar el botón, se abre WhatsApp con el mensaje formateado listo para enviar en 1 toque.
