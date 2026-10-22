/**
 * Generador de vibración háptica en navegadores móviles para confirmación sensorial.
 */

export function triggerOrderReadyVibration() {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    // Patrón de doble pulso: vibra 200ms, pausa 100ms, vibra 300ms
    try {
      navigator.vibrate([200, 100, 300]);
    } catch {
      // Ignorar si el dispositivo bloquea la vibración en modo silencioso
    }
  }
}

export function triggerKitchenAlertVibration() {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    // Patrón triple de alerta de cocina: vibra 300ms, pausa 150ms, vibra 300ms, pausa 150ms, vibra 300ms
    try {
      navigator.vibrate([300, 150, 300, 150, 300]);
    } catch {
      // Ignorar
    }
  }
}
