import { describe, it, expect, beforeEach } from 'vitest';
import { StorageService, KEYS, DEFAULT_CUSTOM_CONFIG } from '../../www/js/storage.js';

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
      sound: false,
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
