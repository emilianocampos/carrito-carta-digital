# 26 — KITCHEN DISPLAY SYSTEM (KDS) PARA COCINA MÓVIL
## Operación Táctil en Plancha, Alertas Sonoras y Coordinación de Tiempos

---

## 1. EL KDS COMO CENTRO NEVRÁLGICO DEL FOOD TRUCK

En un carrito de comida callejera no hay impresoras térmicas ni monitores de escritorio con mouse. El cocinero suele tener una tablet o un celular con funda protectora al lado de la plancha.

Por ello, [`KitchenKDSView.tsx`](../src/features/orders/components/KitchenKDSView.tsx) está optimizado bajo tres premisas:
1. **Botones de 1 Toque:** Áreas táctiles de más de 48px para operar con guantes o dedos húmedos.
2. **Pestañas por Estado:**
   * 🟡 **Pendientes:** Pedidos que requieren aceptación inmediata.
   * 👨‍🍳 **En Cocina:** Comandas marchando en plancha con cronómetro visual.
   * 🟢 **Listos:** Pedidos esperando ser retirados por el comensal en el mostrador.
   * 📅 **Programados:** Comandas para horarios futuros que se activan solas al llegar la hora.
3. **Campana Sonora Web Audio API:** Alerta acústica sin archivos MP3 externos que avisa de nuevos pedidos sin mirar la pantalla constantemente.

---

## 2. REGULACIÓN DINÁMICA DE TIEMPO ESTIMADO (ETA)

Durante horas pico (ej: 21:30 a 23:00hs), la cocina puede saturarse rápidamente. El cocinero cuenta con un regulador de tiempo en la barra superior:

* Botones `[-5m]` y `[+5m]` para modificar el ETA en tiempo real.
* El nuevo tiempo se propaga instantáneamente a la carta pública: los próximos clientes verán el tiempo de espera real antes de confirmar su compra.
* En caso de sobredemanda crítica, el botón `[Pausar]` suspende la recepción de nuevos pedidos con un motivo visible para el cliente (ej: *"Cocina con sobredemanda: volvemos a tomar pedidos en 20 minutos"*).
