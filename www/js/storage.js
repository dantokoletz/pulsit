// storage.js
// Persistencia local de Pulsit: progreso de campaña y configuración personalizada.
//
// Usa Capacitor Preferences cuando la app corre empaquetada (window.Capacitor disponible
// y el plugin Preferences registrado); si no, cae a localStorage (desarrollo web / navegador).
// El backend es inyectable para permitir tests unitarios sin depender de localStorage global.

export const KEYS = {
  CAMPAIGN_PROGRESS: 'pulsit.campaignProgress',
  CUSTOM_CONFIG: 'pulsit.customConfig',
};

export const DEFAULT_CUSTOM_CONFIG = {
  buttons: 4,
  stimulusType: 'colors',
  reposition: false,
  sound: true,
  maxSequenceLength: 10,
};

/**
 * Adaptador sobre localStorage que cumple la misma interfaz mínima que usamos
 * de Capacitor Preferences: get({key}) / set({key, value}).
 */
function createLocalStorageBackend() {
  return {
    async get({ key }) {
      const value = window.localStorage.getItem(key);
      return { value: value === null ? null : value };
    },
    async set({ key, value }) {
      window.localStorage.setItem(key, value);
    },
  };
}

/**
 * Resuelve el backend de persistencia a usar.
 * Permite inyección explícita (tests) o detección automática de Capacitor.
 */
function resolveBackend(explicitBackend) {
  if (explicitBackend) return explicitBackend;
  if (typeof window !== 'undefined' && window.Capacitor?.Plugins?.Preferences) {
    return window.Capacitor.Plugins.Preferences;
  }
  if (typeof window !== 'undefined' && window.localStorage) {
    return createLocalStorageBackend();
  }
  throw new Error('No hay backend de almacenamiento disponible (ni Capacitor ni localStorage).');
}

export class StorageService {
  constructor(backend = null) {
    this.backend = resolveBackend(backend);
  }

  /**
   * Fase más alta desbloqueada en modo campaña. 1 si no hay progreso guardado.
   */
  async getCampaignProgress() {
    const { value } = await this.backend.get({ key: KEYS.CAMPAIGN_PROGRESS });
    const parsed = parseInt(value, 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
  }

  /**
   * Guarda la fase desbloqueada más alta. Nunca retrocede un valor ya guardado mayor.
   */
  async setCampaignProgress(phase) {
    const current = await this.getCampaignProgress();
    const next = Math.max(current, phase);
    await this.backend.set({ key: KEYS.CAMPAIGN_PROGRESS, value: String(next) });
    return next;
  }

  /**
   * Configuración de modo personalizado guardada, o los valores por defecto.
   */
  async getCustomConfig() {
    const { value } = await this.backend.get({ key: KEYS.CUSTOM_CONFIG });
    if (!value) return { ...DEFAULT_CUSTOM_CONFIG };
    try {
      return { ...DEFAULT_CUSTOM_CONFIG, ...JSON.parse(value) };
    } catch {
      return { ...DEFAULT_CUSTOM_CONFIG };
    }
  }

  async setCustomConfig(config) {
    await this.backend.set({ key: KEYS.CUSTOM_CONFIG, value: JSON.stringify(config) });
    return config;
  }
}
