import { describe, it, expect, beforeEach } from 'vitest';
import {
  StorageService,
  KEYS,
  DEFAULT_CUSTOM_CONFIG,
  campaignScoreKey,
  CUSTOM_SCORE_KEY,
} from '../../www/js/storage.js';

/** Backend en memoria que imita la interfaz get/set de Capacitor Preferences. */
function createMemoryBackend() {
  const store = new Map();
  return {
    async get({ key }) {
      return { value: store.has(key) ? store.get(key) : null };
    },
    async set({ key, value }) {
      store.set(key, value);
    },
    _store: store,
  };
}

describe('StorageService — progreso de campaña', () => {
  let backend;
  let storage;

  beforeEach(() => {
    backend = createMemoryBackend();
    storage = new StorageService(backend);
  });

  it('devuelve 1 por defecto si no hay progreso guardado', async () => {
    expect(await storage.getCampaignProgress()).toBe(1);
  });

  it('guarda y recupera el progreso', async () => {
    await storage.setCampaignProgress(3);
    expect(await storage.getCampaignProgress()).toBe(3);
    expect(backend._store.get(KEYS.CAMPAIGN_PROGRESS)).toBe('3');
  });

  it('nunca retrocede a una fase menor ya alcanzada', async () => {
    await storage.setCampaignProgress(5);
    await storage.setCampaignProgress(2);
    expect(await storage.getCampaignProgress()).toBe(5);
  });

  it('ignora valores corruptos y vuelve al valor por defecto', async () => {
    await backend.set({ key: KEYS.CAMPAIGN_PROGRESS, value: 'no-es-un-numero' });
    expect(await storage.getCampaignProgress()).toBe(1);
  });
});

describe('StorageService — configuración personalizada', () => {
  let backend;
  let storage;

  beforeEach(() => {
    backend = createMemoryBackend();
    storage = new StorageService(backend);
  });

  it('devuelve la configuración por defecto si no hay nada guardado', async () => {
    expect(await storage.getCustomConfig()).toEqual(DEFAULT_CUSTOM_CONFIG);
  });

  it('guarda y recupera una configuración personalizada completa', async () => {
    const config = {
      buttons: 7,
      stimulusType: 'numbers',
      reposition: true,
      maxSequenceLength: 12,
    };
    await storage.setCustomConfig(config);
    expect(await storage.getCustomConfig()).toEqual(config);
  });

  it('combina con los valores por defecto si el JSON guardado está incompleto', async () => {
    await backend.set({ key: KEYS.CUSTOM_CONFIG, value: JSON.stringify({ buttons: 6 }) });
    const config = await storage.getCustomConfig();
    expect(config.buttons).toBe(6);
    expect(config.stimulusType).toBe(DEFAULT_CUSTOM_CONFIG.stimulusType);
  });

  it('vuelve a los valores por defecto si el JSON guardado está corrupto', async () => {
    await backend.set({ key: KEYS.CUSTOM_CONFIG, value: '{not-json' });
    expect(await storage.getCustomConfig()).toEqual(DEFAULT_CUSTOM_CONFIG);
  });
});

describe('StorageService — mejores puntajes', () => {
  let backend;
  let storage;

  beforeEach(() => {
    backend = createMemoryBackend();
    storage = new StorageService(backend);
  });

  it('devuelve 0 si nunca se jugó esa clave', async () => {
    expect(await storage.getBestScore(campaignScoreKey(1))).toBe(0);
    expect(await storage.getBestScore(CUSTOM_SCORE_KEY)).toBe(0);
  });

  it('guarda y recupera el mejor puntaje de una fase de campaña', async () => {
    await storage.setBestScore(campaignScoreKey(3), 7);
    expect(await storage.getBestScore(campaignScoreKey(3))).toBe(7);
  });

  it('nunca retrocede a un puntaje menor ya alcanzado', async () => {
    await storage.setBestScore(CUSTOM_SCORE_KEY, 8);
    await storage.setBestScore(CUSTOM_SCORE_KEY, 5);
    expect(await storage.getBestScore(CUSTOM_SCORE_KEY)).toBe(8);
  });

  it('actualiza el puntaje si el nuevo valor es mayor', async () => {
    await storage.setBestScore(CUSTOM_SCORE_KEY, 4);
    await storage.setBestScore(CUSTOM_SCORE_KEY, 9);
    expect(await storage.getBestScore(CUSTOM_SCORE_KEY)).toBe(9);
  });

  it('mantiene claves de campaña y personalizado independientes entre sí', async () => {
    await storage.setBestScore(campaignScoreKey(1), 6);
    await storage.setBestScore(CUSTOM_SCORE_KEY, 9);
    expect(await storage.getBestScore(campaignScoreKey(1))).toBe(6);
    expect(await storage.getBestScore(campaignScoreKey(2))).toBe(0);
    expect(await storage.getBestScore(CUSTOM_SCORE_KEY)).toBe(9);
  });
});

describe('StorageService — modo daltónico', () => {
  let backend;
  let storage;

  beforeEach(() => {
    backend = createMemoryBackend();
    storage = new StorageService(backend);
  });

  it('está desactivado por defecto', async () => {
    expect(await storage.getColorblindMode()).toBe(false);
  });

  it('guarda y recupera el estado activado', async () => {
    await storage.setColorblindMode(true);
    expect(await storage.getColorblindMode()).toBe(true);
  });

  it('guarda y recupera el estado desactivado explícitamente', async () => {
    await storage.setColorblindMode(true);
    await storage.setColorblindMode(false);
    expect(await storage.getColorblindMode()).toBe(false);
  });
});

describe('StorageService — sonido global (y háptica)', () => {
  let backend;
  let storage;

  beforeEach(() => {
    backend = createMemoryBackend();
    storage = new StorageService(backend);
  });

  it('está activado por defecto', async () => {
    expect(await storage.getSoundEnabled()).toBe(true);
  });

  it('guarda y recupera el estado desactivado', async () => {
    await storage.setSoundEnabled(false);
    expect(await storage.getSoundEnabled()).toBe(false);
  });

  it('guarda y recupera el estado reactivado explícitamente', async () => {
    await storage.setSoundEnabled(false);
    await storage.setSoundEnabled(true);
    expect(await storage.getSoundEnabled()).toBe(true);
  });
});

describe('StorageService — persistencia entre instancias (simula reinicio de la app)', () => {
  it('una nueva instancia sobre el mismo backend ve los datos previamente guardados', async () => {
    const backend = createMemoryBackend();
    const firstSession = new StorageService(backend);
    await firstSession.setCampaignProgress(4);
    await firstSession.setCustomConfig({ ...DEFAULT_CUSTOM_CONFIG, buttons: 9 });

    const secondSession = new StorageService(backend);
    expect(await secondSession.getCampaignProgress()).toBe(4);
    expect((await secondSession.getCustomConfig()).buttons).toBe(9);
  });
});
