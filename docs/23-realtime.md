# 23 — SUPABASE REALTIME Y WEBSOCKETS
## Actualizaciones en Tiempo Real en Cocina y Notificaciones de Despacho

---

## 1. ¿CÓMO FUNCIONA SUPABASE REALTIME INTERNAMENTE?

Tradicionalmente, para que una pantalla se actualice cuando cambia un dato se usaba **polling** (consultar a la API cada 3 segundos). Esto satura los servidores con miles de peticiones innecesarias y gasta la batería del celular.

**Supabase Realtime** utiliza los registros de replicación lógica de **PostgreSQL (WAL — Write-Ahead Log)**:
1. Cuando se ejecuta un `INSERT` o `UPDATE` en la tabla `orders`, PostgreSQL escribe el cambio en su WAL.
2. El servidor de Realtime de Supabase lee ese cambio instantáneamente.
3. Lo transmite a través de un canal **WebSocket** a todos los clientes suscritos en menos de 100 milisegundos.

```text
Cocinero presiona [MARCAR LISTO]
               │
               ▼ (Server Action ejecuta UPDATE orders SET order_status='ready')
          [PostgreSQL]
               │  (Escribe en WAL Log)
               ▼
     [Supabase Realtime Engine]
               │  (Publica evento WebSocket)
               ▼
[Celular del Cliente: /c/burger-house/track/123]
               │
               ├─► React actualiza el badge a verde brillante ("¡LISTO!")
               └─► navigator.vibrate() hace vibrar el teléfono en el bolsillo
```

---

## 2. CANALES Y FILTROS IMPLEMENTADOS

Para evitar que los datos de un carrito lleguen al celular de otro, Supabase Realtime permite **filtros a nivel de fila**:

### En el Panel de Cocina (`src/features/orders/components/KitchenKDSView.tsx`):
```typescript
const channel = supabase
  .channel(`kitchen_kds_${tenantId}`)
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'orders',
      filter: `tenant_id=eq.${tenantId}`, // Solo escucha pedidos de este carrito
    },
    (payload) => { ... }
  )
  .subscribe();
```

### En el Seguimiento del Cliente (`src/features/orders/components/OrderTrackingView.tsx`):
```typescript
const channel = supabase
  .channel(`order_track_${orderId}`)
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'orders',
      filter: `id=eq.${orderId}`, // Solo escucha cambios en su comanda
    },
    (payload) => { ... }
  )
  .subscribe();
```

---

## 3. FEEDBACK SONORO EN COCINA CON WEB AUDIO API

En un food truck con extractores de aire, planchas calientes y música ambiental, un operador no puede mirar la pantalla cada 10 segundos.

En lugar de cargar pesados archivos `.mp3` externos que pueden fallar por problemas de red, implementamos un oscilador de audio nativo mediante la **Web Audio API** del navegador:

```typescript
function playOrderChime() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  // Doble tono agudo característico de cocina comercial (Re 5 -> La 5)
  osc.frequency.setValueAtTime(587.33, now);
  osc.frequency.setValueAtTime(880, now + 0.15);

  gain.gain.setValueAtTime(0.3, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.6);
}
```

### Ventajas:
1. **0 bytes de descarga:** Carga instantánea.
2. **Latencia cero:** El timbre suena exactamente en el milisegundo en que entra el pedido.
3. **Control del operador:** Un botón en pantalla permite silenciar o reactivar el sonido con un solo tap.
