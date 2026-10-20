// Test de integración: modo personalizado.
// Ejercita juntos custom.js (formulario) + gameLogic (validación) + storage.js (persistencia)
// + game.js/GameController, simulando el flujo real: configurar -> guardar -> jugar.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CustomModeForm } from '../../www/js/custom.js';
import { StorageService, DEFAULT_CUSTOM_CONFIG } from '../../www/js/storage.js';
import { GameController, GAME_STATE, renderBoard } from '../../www/js/game.js';
import { AudioEngine } from '../../www/js/audio.js';
import { waitFor, clickButton } from './helpers.js';

function createMemoryBackend() {
  const store = new Map();
  return {
    async get({ key }) {
      return { value: store.has(key) ? store.get(key) : null };
    },
    async set({ key, value }) {
      store.set(key, value);
    },
  };
}

function buildCustomFormDom() {
  const form = document.createElement('form');

  const buttonsInput = document.createElement('input');
  buttonsInput.type = 'number';

  const stimulusTypeSelect = document.createElement('select');
  ['colors', 'numbers', 'both'].forEach((value) => {
    const option = document.createElement('option');
    option.value = value;
    stimulusTypeSelect.appendChild(option);
  });

  const repositionCheckbox = document.createElement('input');
  repositionCheckbox.type = 'checkbox';

  const soundCheckbox = document.createElement('input');
  soundCheckbox.type = 'checkbox';

  const maxLengthInput = document.createElement('input');
  maxLengthInput.type = 'number';

  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';

  form.append(buttonsInput, stimulusTypeSelect, repositionCheckbox, soundCheckbox, maxLengthInput, submitBtn);
  document.body.appendChild(form);

  return { form, buttonsInput, stimulusTypeSelect, repositionCheckbox, soundCheckbox, maxLengthInput, submitBtn };
}

describe('Modo personalizado — configuración y persistencia', () => {
  let storageService;
  let elements;

  beforeEach(() => {
    document.body.innerHTML = '';
    storageService = new StorageService(createMemoryBackend());
    elements = buildCustomFormDom();
  });

  it('carga los valores por defecto en el formulario cuando no hay configuración previa', async () => {
    const onSave = vi.fn();
    const formController = new CustomModeForm(elements, storageService, onSave);
    const loaded = await formController.load();

    expect(loaded).toEqual(DEFAULT_CUSTOM_CONFIG);
    expect(elements.buttonsInput.value).toBe(String(DEFAULT_CUSTOM_CONFIG.buttons));
    expect(elements.stimulusTypeSelect.value).toBe(DEFAULT_CUSTOM_CONFIG.stimulusType);
  });

  it('guarda la configuración editada y la persiste para la próxima sesión', async () => {
    const onSave = vi.fn();
    const formController = new CustomModeForm(elements, storageService, onSave);
    await formController.load();

    elements.buttonsInput.value = '7';
    elements.stimulusTypeSelect.value = 'both';
    elements.repositionCheckbox.checked = true;
    elements.soundCheckbox.checked = false;
    elements.maxLengthInput.value = '6';

    elements.form.dispatchEvent(new window.Event('submit', { cancelable: true }));
    // El submit handler es async; esperamos a que el guardado se complete.
    await waitFor(() => onSave.mock.calls.length > 0);

    const expectedConfig = {
      buttons: 7,
      stimulusType: 'both',
      reposition: true,
      sound: false,
      maxSequenceLength: 6,
    };
    expect(onSave).toHaveBeenCalledWith(expectedConfig);

    // Simula reinicio de la app: una nueva sesión de StorageService sobre el mismo backend.
    const persisted = await storageService.getCustomConfig();
    expect(persisted).toEqual(expectedConfig);
  });

  it('no guarda ni invoca onSave si la configuración es inválida', async () => {
    const onSave = vi.fn();
    const formController = new CustomModeForm(elements, storageService, onSave);
    await formController.load();

    elements.buttonsInput.value = '20'; // fuera de rango (máximo 9)

    await expect(formController.save()).rejects.toThrow(RangeError);
    expect(onSave).not.toHaveBeenCalled();
    expect(await storageService.getCustomConfig()).toEqual(DEFAULT_CUSTOM_CONFIG);
  });
});

describe('Modo personalizado — partida con la configuración guardada', () => {
  let storageService;
  let container;
  let audioEngine;

  beforeEach(async () => {
    document.body.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);
    storageService = new StorageService(createMemoryBackend());
    audioEngine = new AudioEngine();
    vi.spyOn(audioEngine, 'playTone');

    await storageService.setCustomConfig({
      buttons: 6,
      stimulusType: 'both',
      reposition: true,
      sound: false,
      maxSequenceLength: 3,
    });
  });

  it('respeta sound:false silenciando el motor de audio durante toda la partida', async () => {
    const config = await storageService.getCustomConfig();
    audioEngine.setEnabled(config.sound !== false);
    expect(audioEngine.enabled).toBe(false);

    let buttons = [];
    const controller = new GameController(config, {
      audioEngine,
      callbacks: {
        onLayoutChange(layout, buttonValues) {
          buttons = renderBoard(container, layout, buttonValues, (position) =>
            controller.handlePlayerInput(position)
          );
        },
      },
    });

    controller.start();
    await waitFor(() => controller.state === GAME_STATE.AWAITING_INPUT);
    controller.sequence.forEach((value) => clickButton(buttons, controller.positionOf(value)));
    await waitFor(() => controller.state === GAME_STATE.PHASE_CLEARED || controller.state === GAME_STATE.ROUND_WON);

    // playTone puede ser invocado por el GameController, pero al estar deshabilitado
    // no debe llegar a crear ningún AudioContext ni producir sonido real.
    expect(audioEngine.playTone).toHaveBeenCalled();
    expect(audioEngine.ctx).toBeNull();
  });

  it('cada botón combina color de fondo y número cuando stimulusType es "both"', () => {
    const config = { buttons: 6, stimulusType: 'both', reposition: false, maxSequenceLength: 10 };
    let buttons = [];
    new GameController(config, {
      audioEngine,
      callbacks: {
        onLayoutChange(layout, buttonValues) {
          buttons = renderBoard(container, layout, buttonValues, () => {});
        },
      },
    });

    expect(buttons).toHaveLength(6);
    buttons.forEach((btn) => {
      expect(btn.classList.contains('game-button--number')).toBe(true);
      expect(btn.style.backgroundColor).not.toBe('');
      expect(btn.textContent).toMatch(/^[1-6]$/);
    });
    const labels = buttons.map((b) => b.textContent).sort();
    expect(labels).toEqual(['1', '2', '3', '4', '5', '6']);
  });
});
