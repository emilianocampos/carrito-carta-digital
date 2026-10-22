# 37 — FLUJOS COMPLETOS DE NEGOCIO Y OPERACIÓN
## Recorrido End-to-End: Del Escaneo del QR al Despacho en Cocina

---

## 1. FLUJO 1: AJUSTE RÁPIDO DE ETA (TIEMPO DE PREPARACIÓN)

En horas pico de un evento gastronómico (ej. 22:00 hs), los pedidos se acumulan rápidamente. Si el cocinero tarda 40 minutos pero la carta sigue diciendo "Listo en 15 min", los comensales se impacientan frente a la barra.

```text
Cocinero en Food Truck
          │  (Toca [+5 min] o elige [30 min] en el top bar del KDS)
          ▼
[Server Action: updatePreparationTimeAction(tenantId, 30)]
          │
          ├─► Actualiza PostgreSQL: tenant_settings.current_preparation_time_minutes = 30
          ├─► Revalida caché de Next.js: revalidatePath('/c/[slug]')
          └─► Revalida caché de KDS: revalidatePath('/admin/[tenantSlug]/orders')
          │
          ▼
Nuevos clientes que escaneen el QR ven:
"Listo en ~30 min" de forma reactiva instantánea.
```

---

## 2. FLUJO 2: PAUSA DE PEDIDOS POR SATURACIÓN DE PLANCHA

Cuando la cocina se queda sin insumos o la plancha no da abasto:

```text
Cocinero presiona [Pausar Pedidos] ➔ Selecciona "Plancha saturada"
          │
          ▼
[Server Action: toggleOrderPauseAction(tenantId, true, 'Plancha saturada')]
          │
          ▼
[PostgreSQL]
tenant_settings.is_ordering_paused = true
tenant_settings.pause_reason = 'Plancha saturada'
          │
          ├─► Carta Pública (/c/burger-house):
          │   - Sigue mostrando productos y fotos (no se pierde la visita).
          │   - Muestra banner rojo: "Pedidos pausados: Plancha saturada".
          │   - Deshabilita la barra flotante de agregar pedidos.
          │
          └─► Protección en Servidor:
              Si alguien intentara forzar la llamada a createOrderAction(),
              el servidor rechaza la petición con error antes de tocar la DB.
```

---

## 3. FLUJO 3: GESTIÓN DE PEDIDOS PROGRAMADOS

Un cliente pide a las 19:30 hs programando su retiro para las **21:30 hs**:

```text
Cliente envía pedido con scheduledFor: "2026-09-02T21:30:00Z"
                         │
                         ▼
[PostgreSQL: orders.order_type = 'pickup_scheduled']
                         │
                         ▼
[Comandera KDS de Cocina (/admin/burger-house/orders)]
                         │
        ¿now() >= 21:30 - prepMinutes (ej. 21:05)?
                         │
             ┌───────────┴───────────┐
           NO│                       │SÍ
             ▼                       ▼
    [Tab "Prog." (Futuros)]    [Tab "Nuevos / Cocina"]
    Permanece ordenado         Se destaca con alerta:
    por hora sin estorbar      "🚨 ¡HORA DE COCINAR!"
    en la plancha actual.
```

---

## 4. FLUJO 4: EL VIAJE COMPLETO CLIENTE ➔ COCINA

| Paso | Acción del Cliente | Acción en Base de Datos | Acción en Pantalla de Cocina |
| :---: | :--- | :--- | :--- |
| **1** | Escanea QR y navega la carta | Ninguna (lectura pura en caché) | Sin cambios |
| **2** | Personaliza hamburguesa con extras y confirma checkout | `INSERT orders`, `INSERT order_items` | **Campana sonoro-visual** Web Audio API; el pedido entra a la pestaña **Nuevos** |
| **3** | El cliente ve: `🟡 Pedido recibido` | `UPDATE orders SET order_status = 'preparing'` | Cocinero toca `[ACEPTAR Y PREPARAR]` |
| **4** | El cliente ve: `🔵 Cocinando tu pedido` | Cocinando en plancha | Comanda visible en la pestaña **Cocina** |
| **5** | El cliente recibe aviso y vibración táctil: `🟢 ¡LISTO PARA RETIRAR!` | `UPDATE orders SET order_status = 'ready'` | Cocinero toca `[MARCAR LISTO PARA RETIRAR]` |
| **6** | Cliente retira y paga en mostrador | `UPDATE orders SET order_status = 'picked_up'` | Staff toca `[ENTREGADO]` ➔ Pasa al **Historial** |
