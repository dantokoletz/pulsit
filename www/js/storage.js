// storage.js
// Persistencia local de Pulsit: progreso de campaña y configuración personalizada.
//
// Usa Capacitor Preferences cuando la app corre empaquetada (window.Capacitor disponible
// y el plugin Preferences registrado); si no, cae a localStorage (desarrollo web / navegador).
// El backend es inyectable para permitir tests unitarios sin depender de localStorage global.

export const KEYS = {
  CAMPAIGN_PROGRESS: 'pulsit.campaignProgress',
  CUSTOM_CONFIG: 'pulsit.customConfig',
  BEST_SCORES: 'pulsit.bestScores',
  COLORBLIND_MODE: 'pulsit.colorblindMode',
  SOUND_ENABLED: 'pulsit.soundEnabled',
};

/** Clave de mejor puntaje para una fase de campaña dada. */
export function campaignScoreKey(phaseNumber) {
  return `campaign:${phaseNumber}`;
}

/** Clave de mejor puntaje del modo personalizado (un único valor global). */
export const CUSTOM_SCORE_KEY = 'custom';

/**
 * El sonido (y la háptica, que se activa/desactiva junto con él) es una preferencia GLOBAL del
 * jugador, ajustable desde la pantalla de Ajustes — no es parte de la configuración por partida
 * de modo personalizado, para que también aplique al modo campaña.
 */
export const DEFAULT_CUSTOM_CONFIG = {
  buttons: 4,
  stimulusType: 'colors',
  reposition: false,
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

  /**
   * Mapa completo de mejores puntajes guardados: { [clave]: mejorSecuenciaLograda }.
   * Ver `campaignScoreKey` y `CUSTOM_SCORE_KEY` para las claves usadas.
   */
  async getBestScores() {
    const { value } = await this.backend.get({ key: KEYS.BEST_SCORES });
    if (!value) return {};
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }

  /** Mejor secuencia lograda para una clave dada (0 si nunca se jugó). */
  async getBestScore(key) {
    const scores = await this.getBestScores();
    const value = scores[key];
    return Number.isInteger(value) && value > 0 ? value : 0;
  }

  /**
   * Guarda `value` como mejor puntaje de `key`, sin retroceder un valor ya guardado mayor.
   * Devuelve el mejor puntaje resultante (el guardado, sea el nuevo o el anterior).
   */
  async setBestScore(key, value) {
    const scores = await this.getBestScores();
    const current = Number.isInteger(scores[key]) ? scores[key] : 0;
    const best = Math.max(current, value);
    if (best !== current) {
      scores[key] = best;
      await this.backend.set({ key: KEYS.BEST_SCORES, value: JSON.stringify(scores) });
    }
    return best;
  }

  /** Modo daltónico: muestra una forma además del color en los botones de tipo 'colors'. */
  async getColorblindMode() {
    const { value } = await this.backend.get({ key: KEYS.COLORBLIND_MODE });
    return value === 'true';
  }

  async setColorblindMode(enabled) {
    await this.backend.set({ key: KEYS.COLORBLIND_MODE, value: String(Boolean(enabled)) });
    return Boolean(enabled);
  }

  /** Sonido (y háptica) activados globalmente. Por defecto, activado. */
  async getSoundEnabled() {
    const { value } = await this.backend.get({ key: KEYS.SOUND_ENABLED });
    return value !== 'false';
  }

  async setSoundEnabled(enabled) {
    await this.backend.set({ key: KEYS.SOUND_ENABLED, value: String(Boolean(enabled)) });
    return Boolean(enabled);
  }
}
