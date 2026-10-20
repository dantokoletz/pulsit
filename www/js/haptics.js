// haptics.js
// Feedback háptico (vibración corta) en cada toque, acierto y error.
//
// Igual que storage.js, no importa el paquete @capacitor/haptics como módulo ES (este proyecto no
// usa bundler, ver AGENTS.md): en su lugar, cuando la app corre empaquetada con Capacitor, el
// plugin nativo queda expuesto en window.Capacitor.Plugins.Haptics. En el navegador (desarrollo
// web, o si el plugin no está disponible) se usa como fallback la Vibration API estándar
// (navigator.vibrate), y si ninguna de las dos existe, las llamadas simplemente no hacen nada.

function resolveNativeHaptics() {
  return (typeof window !== 'undefined' && window.Capacitor?.Plugins?.Haptics) || null;
}

function resolveVibrateFn() {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return null;
  return navigator.vibrate.bind(navigator);
}

export class HapticsEngine {
  /**
   * @param {object} [options]
   * @param {object} [options.nativeHaptics] - plugin Haptics inyectable (tests/mocks).
   * @param {(pattern: number|number[]) => void} [options.vibrateFn] - navigator.vibrate inyectable.
   */
  constructor({ nativeHaptics, vibrateFn } = {}) {
    this.nativeHaptics = nativeHaptics !== undefined ? nativeHaptics : resolveNativeHaptics();
    this.vibrateFn = vibrateFn !== undefined ? vibrateFn : resolveVibrateFn();
    this.enabled = true;
  }

  setEnabled(enabled) {
    this.enabled = enabled;
  }

  _trigger(nativeCall, fallbackPattern) {
    if (!this.enabled) return;
    if (this.nativeHaptics) {
      try {
        Promise.resolve(nativeCall(this.nativeHaptics)).catch(() => {});
      } catch {
        // Ignorar: un plugin nativo ausente o con error no debe interrumpir el juego.
      }
      return;
    }
    this.vibrateFn?.(fallbackPattern);
  }

  /** Vibración breve y suave: cada toque correcto, propio o de la secuencia. */
  impactLight() {
    this._trigger((h) => h.impact({ style: 'LIGHT' }), 10);
  }

  /** Patrón distintivo para un toque incorrecto / fin de partida. */
  notifyError() {
    this._trigger((h) => h.notification({ type: 'ERROR' }), [30, 40, 30]);
  }

  /** Vibración corta y animada para una fase/partida superada. */
  notifySuccess() {
    this._trigger((h) => h.notification({ type: 'SUCCESS' }), 15);
  }
}
