// Test de integración: modo campaña.
// Ejercita juntos gameLogic + GameController + audio (AudioEngine) + render DOM real (jsdom)
// + StorageService, simulando clicks reales de usuario sobre el tablero, tal como lo haría app.js.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GameController, GAME_STATE, buildCampaignConfig, renderBoard, getNextPhase } from '../../www/js/game.js';
import { getPhaseConfig } from '../../www/js/gameLogic.js';
import { AudioEngine } from '../../www/js/audio.js';
import { StorageService } from '../../www/js/storage.js';
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

/** Juega una ronda completa ingresando la secuencia correcta a través de clicks reales en el DOM. */
async function playCorrectRound(controller, getButtons) {
  await waitFor(() => controller.state === GAME_STATE.AWAITING_INPUT);
  const sequence = [...controller.sequence];
  for (const value of sequence) {
    const position = controller.positionOf(value);
    clickButton(getButtons(), position);
  }
}

describe('Modo campaña — fase 1 (3 botones, colores, sin reposición)', () => {
  let container;
  let audioEngine;
  let storageService;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    audioEngine = new AudioEngine(); // sin AudioContext real disponible en jsdom: no-op seguro
    storageService = new StorageService(createMemoryBackend());
    vi.spyOn(audioEngine, 'playTone');
    vi.spyOn(audioEngine, 'playError');
  });

  it('renderiza 3 botones de color con las etiquetas accesibles correctas', () => {
    const phaseConfig = getPhaseConfig(1);
    expect(phaseConfig.buttons).toBe(3);

    const config = buildCampaignConfig(1, 10);
    let buttons = [];
    const controller = new GameController(config, {
      audioEngine,
      callbacks: {
        onLayoutChange(layout, buttonValues) {
          buttons = renderBoard(container, layout, buttonValues, () => {});
        },
      },
    });

    expect(buttons).toHaveLength(3);
    buttons.forEach((btn) => {
      expect(btn.className).toContain('game-button');
      expect(btn.getAttribute('aria-label')).toMatch(/color/i);
    });
    expect(controller.state).toBe(GAME_STATE.IDLE);
  });

  it('completa la fase (maxSequenceLength=3) jugando dos rondas correctas vía clicks reales', async () => {
    const config = buildCampaignConfig(1, 3); // acorta la fase para que el test sea rápido
    let buttons = [];
    let phaseClearedCalled = false;
    let lastRoundResult = null;

    const controller = new GameController(config, {
      audioEngine,
      callbacks: {
        onLayoutChange(layout, buttonValues) {
          buttons = renderBoard(container, layout, buttonValues, (position) =>
            controller.handlePlayerInput(position)
          );
        },
        onRoundResult(result) {
          lastRoundResult = result;
        },
        async onPhaseCleared() {
          phaseClearedCalled = true;
          await storageService.setCampaignProgress(getNextPhase(1));
        },
      },
    });

    controller.start();

    // Ronda 1: secuencia de longitud 2 (MIN_SEQUENCE_LENGTH), aún no completa la fase.
    await playCorrectRound(controller, () => buttons);
    await waitFor(() => lastRoundResult !== null);
    expect(lastRoundResult.sequenceLength).toBe(2);
    expect(controller.state).not.toBe(GAME_STATE.GAME_OVER);

    // Ronda 2: secuencia de longitud 3 === maxSequenceLength -> fase superada.
    await playCorrectRound(controller, () => buttons);
    await waitFor(() => controller.state === GAME_STATE.PHASE_CLEARED);

    expect(phaseClearedCalled).toBe(true);
    expect(controller.sequence).toHaveLength(3);
    expect(await storageService.getCampaignProgress()).toBe(2);
    expect(audioEngine.playTone).toHaveBeenCalled();
  });

  it('un click incorrecto termina la partida en GAME_OVER y reproduce el sonido de error', async () => {
    const config = buildCampaignConfig(1, 10);
    let buttons = [];
    let gameOverPayload = null;

    const controller = new GameController(config, {
      audioEngine,
      callbacks: {
        onLayoutChange(layout, buttonValues) {
          buttons = renderBoard(container, layout, buttonValues, (position) =>
            controller.handlePlayerInput(position)
          );
        },
        onGameOver(payload) {
          gameOverPayload = payload;
        },
      },
    });

    controller.start();
    await waitFor(() => controller.state === GAME_STATE.AWAITING_INPUT);

    const correctFirstValue = controller.sequence[0];
    const wrongPosition = controller.layout.findIndex((v) => v !== correctFirstValue);
    clickButton(buttons, wrongPosition);

    await waitFor(() => controller.state === GAME_STATE.GAME_OVER);
    expect(gameOverPayload).toEqual({ sequenceReached: 2 });
    expect(audioEngine.playError).toHaveBeenCalledTimes(1);
  });

  it('en fases con reposición (fase 5), el layout cambia tras una ronda correcta', async () => {
    const config = buildCampaignConfig(5, 4); // fase 5: 5 botones, colores, reposition=true
    let buttons = [];
    const layoutsSeen = [];

    const controller = new GameController(config, {
      audioEngine,
      callbacks: {
        onLayoutChange(layout, buttonValues) {
          layoutsSeen.push([...layout]);
          buttons = renderBoard(container, layout, buttonValues, (position) =>
            controller.handlePlayerInput(position)
          );
        },
      },
    });

    controller.start();
    await playCorrectRound(controller, () => buttons);
    await waitFor(() => layoutsSeen.length >= 2);

    expect(layoutsSeen).toHaveLength(2);
    // El layout es una permutación válida de los mismos 5 valores en ambos casos.
    expect([...layoutsSeen[1]].sort()).toEqual([0, 1, 2, 3, 4]);
  });
});
