# 31 — SISTEMA DE CLIENTES, FIDELIZACIÓN Y PUNTOS
## Retención Gastronómica, CRM Progresivo y Libro Mayor de Puntos

---

## 1. EL DESAFÍO DE LA RECURRENCIA EN UN FOOD TRUCK

Un cliente que compra en un food truck o carrito callejero suele ser un transeúnte de paso. Si la experiencia termina al entregar la hamburguesa, el carrito compite únicamente por precio o ubicación física.

### El CRM Progresivo de Carrito Take-Away:
1. **Cero barreras de entrada:** El cliente no crea usuario ni contraseña (fricción cero).
2. **Identificación unívoca:** Al ingresar su teléfono/WhatsApp en el checkout, el sistema lo asocia automáticamente a su registro histórico en la tabla `customers`.
3. **Métricas de cliente:** Con cada compra, el carrito acumula:
   * Cantidad de pedidos (`total_orders`).
   * Gasto acumulado en la vida del cliente (`total_spent`).
   * Saldo de puntos de fidelidad (`points_balance`).
   * Fecha de última visita (`last_order_at`).

---

## 2. MECÁNICA DE ACUMULACIÓN Y AUDITORÍA DE PUNTOS

En [`src/features/orders/actions.ts`](../src/features/orders/actions.ts), cada vez que se crea un pedido:

$$\text{Puntos Ganados} = \left\lfloor \frac{\text{Total Abonado}}{100} \right\rfloor$$

### ¿Por qué existe `customer_points_ledger`?
Nunca se debe modificar un saldo contable sin un asiento de partida doble o registro histórico.  
La tabla `customer_points_ledger` almacena cada movimiento de puntos:
```sql
create table customer_points_ledger (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  customer_id uuid not null references customers(id),
  points integer not null,           -- Ej: +160 puntos
  reason text not null,              -- 'order_reward'
  order_id uuid references orders(id)
);
```
Esto permite auditar exactamente de qué pedido provino cada punto y previene fraudes de saldo.

---

## 3. SEGMENTACIÓN VIP Y CONTACTO DIRECTO POR WHATSAPP

En la vista de clientes ([`src/features/promotions/components/CustomersView.tsx`](../src/features/promotions/components/CustomersView.tsx)):
* Los compradores con 5 o más pedidos reciben automáticamente el badge **VIP**.
* Cada tarjeta de cliente incluye un botón con icono de teléfono que genera un enlace directo a WhatsApp (`https://wa.me/...`).
* El dueño del carrito puede felicitar a sus clientes VIP o enviarles promociones personalizadas con un solo toque desde su propio teléfono celular.
