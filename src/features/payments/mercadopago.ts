export interface CreatePreferenceInput {
  orderId: string;
  orderNumber: number;
  tenantSlug: string;
  customerName: string;
  customerPhone: string;
  total: number;
  currency: string;
  accessToken: string | null;
  appUrl: string;
  items: Array<{
    title: string;
    unitPrice: number;
    quantity: number;
  }>;
}

export interface MercadoPagoPreferenceResult {
  preferenceId: string;
  initPoint: string;
}

/**
 * Crea una preferencia de pago en Mercado Pago Checkout Pro.
 * Si el food truck no configuró Access Token real, genera un link simulado seguro para pruebas.
 */
export async function createMercadoPagoPreference(
  input: CreatePreferenceInput
): Promise<MercadoPagoPreferenceResult> {
  const token = input.accessToken || process.env.MERCADOPAGO_ACCESS_TOKEN;

  // Si no hay token de Mercado Pago configurado, generar fallback de prueba
  if (!token) {
    const simulatedInitPoint = `${input.appUrl}/c/${input.tenantSlug}/track/${input.orderId}?simulated_payment=true`;
    return {
      preferenceId: `sim_pref_${input.orderId.slice(0, 8)}`,
      initPoint: simulatedInitPoint,
    };
  }

  const successUrl = `${input.appUrl}/c/${input.tenantSlug}/track/${input.orderId}?payment=success`;
  const failureUrl = `${input.appUrl}/c/${input.tenantSlug}/track/${input.orderId}?payment=failure`;
  const pendingUrl = `${input.appUrl}/c/${input.tenantSlug}/track/${input.orderId}?payment=pending`;
  const webhookUrl = `${input.appUrl}/api/webhooks/mercadopago`;

  const payload = {
    items: input.items.map((item) => ({
      title: item.title,
      unit_price: Math.max(item.unitPrice, 1),
      quantity: item.quantity,
      currency_id: input.currency === 'ARS' ? 'ARS' : 'USD',
    })),
    payer: {
      name: input.customerName,
      phone: {
        number: input.customerPhone,
      },
    },
    back_urls: {
      success: successUrl,
      failure: failureUrl,
      pending: pendingUrl,
    },
    auto_return: 'approved',
    external_reference: input.orderId,
    notification_url: webhookUrl,
    statement_descriptor: 'CARRITO TAKEAWAY',
  };

  const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Mercado Pago Error (${response.status}): ${errBody}`);
  }

  const data = await response.json();

  return {
    preferenceId: data.id,
    initPoint: data.init_point || data.sandbox_init_point,
  };
}
