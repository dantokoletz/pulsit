// game.js
// Orquestación de la partida: conecta gameLogic (reglas puras), audio.js (sonido) y el DOM.
// No contiene reglas de negocio propias; delega en gameLogic para que éstas sigan siendo testeables.

import {
  getPhaseConfig,
  getNextPhase,
  generateButtonValues,
  generateLayout,
  generateSequence,
  extendSequence,
  evaluateInput,
  isPhaseCleared,
  getRowLayout,
  shapeForValue,
  shapeNameForValue,
  MIN_SEQUENCE_LENGTH,
  TOTAL_CAMPAIGN_PHASES,
} from './gameLogic.js';

const COLOR_PALETTE = [
  '#e63946', '#f1c453', '#2a9d8f', '#457b9d', '#9b5de5',
  '#f4845f', '#43aa8b', '#577590', '#ff8fa3',
];

export const GAME_STATE = {
  IDLE: 'idle',
  PLAYING_SEQUENCE: 'playing-sequence',
  AWAITING_INPUT: 'awaiting-input',
  ROUND_WON: 'round-won',
  PHASE_CLEARED: 'phase-cleared',
  GAME_OVER: 'game-over',
};

/**
 * Controlador de una partida (campaña o personalizada).
 *
 * `config` debe tener: { buttons, stimulusType, reposition, maxSequenceLength }
 * `callbacks` (todas opcionales):
 *   - onStateChange(state, data)
 *   - onLayoutChange(layout, buttonValues)
 *   - onHighlight(position)
 *   - onRoundResult({ correct, sequenceLength })
 *   - onPhaseCleared()
 *   - onGameOver({ sequenceReached })
 */
export class GameController {
  constructor(config, { audioEngine, hapticsEngine, rng = Math.random, callbacks = {} } = {}) {
    this.config = config;
    this.audioEngine = audioEngine;
    this.hapticsEngine = hapticsEngine;
    this.rng = rng;
    this.callbacks = callbacks;

    this.buttonValues = generateButtonValues(config.buttons, config.stimulusType);
    this.layout = generateLayout(config.buttons, config.reposition, null, this.rng);
    this.sequence = [];
    this.playerInput = [];
    this.state = GAME_STATE.IDLE;

    this._emitLayout();
  }

  _setState(state, data) {
    this.state = state;
    this.callbacks.onStateChange?.(state, data);
  }

  _emitLayout() {
    this.callbacks.onLayoutChange?.(this.layout, this.buttonValues);
  }

  /** Posición en pantalla (índice) de un valor lógico de botón dado. */
  positionOf(value) {
    return this.layout.indexOf(value);
  }

  /** Valor lógico del botón ubicado en una posición de pantalla dada. */
  valueAt(position) {
    return this.layout[position];
  }

  /** Comienza la partida: genera la primera secuencia de longitud mínima y la reproduce. */
  start() {
    this.sequence = generateSequence(MIN_SEQUENCE_LENGTH, this.config.buttons, this.rng);
    this._playCurrentSequence();
  }

  async _playCurrentSequence() {
    this.playerInput = [];
    this._setState(GAME_STATE.PLAYING_SEQUENCE, { sequence: this.sequence });

    for (const value of this.sequence) {
      const position = this.positionOf(value);
      this.callbacks.onHighlight?.(position);
      this.audioEngine?.playTone(value);
      await delay(550);
    }

    this._setState(GAME_STATE.AWAITING_INPUT, { expectedLength: this.sequence.length });
  }

  /**
   * Registra la pulsación del jugador sobre una posición de pantalla.
   * Debe llamarse solo mientras el estado sea AWAITING_INPUT.
   */
  handlePlayerInput(position) {
    if (this.state !== GAME_STATE.AWAITING_INPUT) return;

    const value = this.valueAt(position);
    this.playerInput.push(value);
    this.audioEngine?.playTone(value);

    const result = evaluateInput(this.sequence, this.playerInput);

    if (result.status === 'wrong') {
      this.audioEngine?.playError();
      this.hapticsEngine?.notifyError();
      this._setState(GAME_STATE.GAME_OVER, { sequenceReached: this.sequence.length });
      this.callbacks.onGameOver?.({ sequenceReached: this.sequence.length });
      return;
    }

    this.hapticsEngine?.impactLight();

    if (result.status === 'correct-partial') {
      return;
    }

    // correct-complete: la ronda se ganó.
    this.callbacks.onRoundResult?.({ correct: true, sequenceLength: this.sequence.length });

    if (isPhaseCleared(this.sequence.length, this.config.maxSequenceLength)) {
      this._setState(GAME_STATE.PHASE_CLEARED, { sequenceLength: this.sequence.length });
      this.callbacks.onPhaseCleared?.();
      return;
    }

    this._setState(GAME_STATE.ROUND_WON, { sequenceLength: this.sequence.length });
    this._advanceRound();
  }

  async _advanceRound() {
    this.layout = generateLayout(this.config.buttons, this.config.reposition, this.layout, this.rng);
    this._emitLayout();
    this.sequence = extendSequence(this.sequence, this.config.buttons, this.rng);
    await delay(700);
    this._playCurrentSequence();
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Construye la configuración de juego para una fase de campaña dada. */
export function buildCampaignConfig(phaseNumber, maxSequenceLength = 10) {
  const phase = getPhaseConfig(phaseNumber);
  if (!phase) throw new Error(`Fase de campaña inválida: ${phaseNumber}`);
  return {
    buttons: phase.buttons,
    stimulusType: phase.stimulusType,
    reposition: phase.reposition,
    maxSequenceLength,
  };
}

export { COLOR_PALETTE, getNextPhase, TOTAL_CAMPAIGN_PHASES };

/**
 * Renderiza el tablero de botones dentro de un contenedor DOM dado, agrupado en filas según
 * `getRowLayout` (en vez de un grid que se ajusta libremente al ancho disponible), para que la
 * disposición sea siempre la misma figura (ver gameLogic.getRowLayout) sin importar el tamaño de
 * pantalla.
 *
 * Devuelve un array PLANO de elementos <button>, en el mismo orden que `layout` (índice =
 * posición de pantalla), independientemente de cómo estén anidados en filas en el DOM.
 *
 * @param {boolean} [colorblindMode] - si es true, los botones de tipo 'colors' muestran además
 *   una forma fija (ver gameLogic.shapeForValue) para no depender solo del color.
 */
export function renderBoard(container, layout, buttonValues, onPress, colorblindMode = false) {
  container.innerHTML = '';

  const rowSizes = getRowLayout(layout.length);
  const buttons = [];
  let position = 0;

  rowSizes.forEach((rowSize) => {
    const row = document.createElement('div');
    row.className = 'game-board-row';

    for (let i = 0; i < rowSize; i++) {
      const value = layout[position];
      const def = buttonValues[value];
      const btn = createButtonElement(value, def, position, onPress, colorblindMode);
      row.appendChild(btn);
      buttons.push(btn);
      position++;
    }

    container.appendChild(row);
  });

  return buttons;
}

function createButtonElement(value, def, position, onPress, colorblindMode) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'game-button';
  btn.dataset.position = String(position);
  btn.dataset.value = String(value);

  const color = COLOR_PALETTE[value % COLOR_PALETTE.length];
  let ariaLabel;

  if (def.type === 'colors' || def.type === 'both') {
    btn.style.backgroundColor = color;
  }
  if (def.type === 'numbers' || def.type === 'both') {
    btn.textContent = String(def.label);
    btn.classList.add('game-button--number');
  }

  if (def.type === 'both') {
    ariaLabel = `Botón número ${def.label} de color ${value + 1}`;
  } else if (def.type === 'colors') {
    ariaLabel = `Botón de color ${value + 1}`;
    if (colorblindMode) {
      btn.textContent = shapeForValue(value);
      btn.classList.add('game-button--shape');
      ariaLabel += ` (forma: ${shapeNameForValue(value)})`;
    }
  } else {
    ariaLabel = `Botón número ${def.label}`;
  }

  btn.setAttribute('aria-label', ariaLabel);
  btn.addEventListener('click', () => onPress(position));
  return btn;
}

/** Aplica/retira la clase de resaltado visual sobre el botón de una posición. */
export function highlightButton(buttons, position, durationMs = 400) {
  const btn = buttons[position];
  if (!btn) return;
  btn.classList.add('game-button--active');
  setTimeout(() => btn.classList.remove('game-button--active'), durationMs);
}
