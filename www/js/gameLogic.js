// gameLogic.js
// Lógica pura del juego Pulsit: sin DOM, sin Web Audio, sin storage.
// Diseñado para ser 100% testeable de forma unitaria.

/**
 * Definición de las 10 fases del modo campaña (sección 2.2 de la spec).
 * `stimulusType`: 'colors' | 'numbers'
 * `reposition`: si true, los botones cambian de posición en pantalla tras cada ronda exitosa.
 */
export const CAMPAIGN_PHASES = [
  { phase: 1, buttons: 3, stimulusType: 'colors', reposition: false },
  { phase: 2, buttons: 3, stimulusType: 'numbers', reposition: false },
  { phase: 3, buttons: 4, stimulusType: 'colors', reposition: false },
  { phase: 4, buttons: 4, stimulusType: 'numbers', reposition: false },
  { phase: 5, buttons: 5, stimulusType: 'colors', reposition: true },
  { phase: 6, buttons: 5, stimulusType: 'numbers', reposition: true },
  { phase: 7, buttons: 6, stimulusType: 'colors', reposition: false },
  { phase: 8, buttons: 7, stimulusType: 'numbers', reposition: false },
  { phase: 9, buttons: 8, stimulusType: 'colors', reposition: true },
  { phase: 10, buttons: 9, stimulusType: 'numbers', reposition: true },
];

export const MIN_SEQUENCE_LENGTH = 2;
export const DEFAULT_MAX_SEQUENCE_LENGTH = 10;
export const MIN_CUSTOM_BUTTONS = 3;
export const MAX_CUSTOM_BUTTONS = 9;
export const TOTAL_CAMPAIGN_PHASES = CAMPAIGN_PHASES.length;

/**
 * Devuelve la configuración de una fase de campaña (1-indexada).
 * @param {number} phaseNumber
 * @returns {object|null}
 */
export function getPhaseConfig(phaseNumber) {
  return CAMPAIGN_PHASES.find((p) => p.phase === phaseNumber) || null;
}

/**
 * Número de fase siguiente, o null si `phaseNumber` es la última fase.
 */
export function getNextPhase(phaseNumber) {
  if (phaseNumber >= TOTAL_CAMPAIGN_PHASES) return null;
  return phaseNumber + 1;
}

/**
 * Genera las etiquetas lógicas de los botones (independientes de su posición en pantalla).
 * Cada "valor" (0..count-1) tiene un color y/o número fijo que lo identifica, y mantiene
 * siempre el mismo tono de sonido (ver audio.js), sin importar si luego se reposiciona.
 *
 * @param {number} count - cantidad de botones (3-9)
 * @param {'colors'|'numbers'|'both'} stimulusType
 * @returns {Array<{value:number, type:'colors'|'numbers', label:string|number}>}
 */
export function generateButtonValues(count, stimulusType) {
  if (count < MIN_CUSTOM_BUTTONS || count > MAX_CUSTOM_BUTTONS) {
    throw new RangeError(
      `count debe estar entre ${MIN_CUSTOM_BUTTONS} y ${MAX_CUSTOM_BUTTONS}`
    );
  }
  const values = [];
  for (let i = 0; i < count; i++) {
    let type = stimulusType;
    if (stimulusType === 'both') {
      // Alterna color/número de forma determinística para una distribución estable.
      type = i % 2 === 0 ? 'colors' : 'numbers';
    }
    values.push({
      value: i,
      type,
      label: type === 'numbers' ? i + 1 : i,
    });
  }
  return values;
}

/**
 * Fisher-Yates shuffle. No muta el array de entrada.
 * @param {Array} arr
 * @param {() => number} [rng] - generador de números aleatorios en [0,1). Inyectable para tests.
 */
export function shuffle(arr, rng = Math.random) {
  const result = arr.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Genera el layout (posición en pantalla -> valor lógico del botón).
 * Si `reposition` es false y se pasa un `previousLayout` válido del mismo tamaño, se reutiliza
 * (los botones no deben moverse). Si `reposition` es true, siempre se genera un nuevo orden aleatorio.
 *
 * @param {number} count
 * @param {boolean} reposition
 * @param {number[]|null} previousLayout
 * @param {() => number} [rng]
 * @returns {number[]} array de longitud `count` con los valores lógicos en cada posición
 */
export function generateLayout(count, reposition, previousLayout = null, rng = Math.random) {
  const base = Array.from({ length: count }, (_, i) => i);
  if (!reposition && previousLayout && previousLayout.length === count) {
    return previousLayout.slice();
  }
  return shuffle(base, rng);
}

/**
 * Añade un paso aleatorio (valor lógico de botón) a la secuencia.
 * @param {number[]} sequence
 * @param {number} buttonCount
 * @param {() => number} [rng]
 */
export function extendSequence(sequence, buttonCount, rng = Math.random) {
  const nextValue = Math.floor(rng() * buttonCount);
  return [...sequence, nextValue];
}

/**
 * Genera una secuencia nueva de la longitud indicada.
 */
export function generateSequence(length, buttonCount, rng = Math.random) {
  let seq = [];
  for (let i = 0; i < length; i++) {
    seq = extendSequence(seq, buttonCount, rng);
  }
  return seq;
}

/**
 * Compara la entrada parcial o total del jugador contra la secuencia esperada.
 * @returns {{status: 'correct-partial'|'correct-complete'|'wrong', mismatchIndex: number}}
 *   - 'correct-partial': lo ingresado hasta ahora es correcto, pero falta para completar.
 *   - 'correct-complete': el jugador completó la secuencia correctamente.
 *   - 'wrong': se detectó un valor incorrecto en `mismatchIndex`.
 */
export function evaluateInput(sequence, input) {
  for (let i = 0; i < input.length; i++) {
    if (input[i] !== sequence[i]) {
      return { status: 'wrong', mismatchIndex: i };
    }
  }
  if (input.length === sequence.length) {
    return { status: 'correct-complete', mismatchIndex: -1 };
  }
  return { status: 'correct-partial', mismatchIndex: -1 };
}

/**
 * Indica si, al completar una ronda de longitud `sequenceLength`, la fase queda superada.
 */
export function isPhaseCleared(sequenceLength, maxSequenceLength = DEFAULT_MAX_SEQUENCE_LENGTH) {
  return sequenceLength >= maxSequenceLength;
}

/**
 * Valida y normaliza una configuración de modo personalizado.
 * Lanza RangeError si algún valor es inválido.
 */
export function validateCustomConfig(config) {
  const buttons = Number(config.buttons);
  const stimulusType = config.stimulusType;
  const reposition = Boolean(config.reposition);
  const sound = config.sound !== false;
  const maxSequenceLength = Number(
    config.maxSequenceLength ?? DEFAULT_MAX_SEQUENCE_LENGTH
  );

  if (
    !Number.isInteger(buttons) ||
    buttons < MIN_CUSTOM_BUTTONS ||
    buttons > MAX_CUSTOM_BUTTONS
  ) {
    throw new RangeError(
      `buttons debe ser un entero entre ${MIN_CUSTOM_BUTTONS} y ${MAX_CUSTOM_BUTTONS}`
    );
  }
  if (!['colors', 'numbers', 'both'].includes(stimulusType)) {
    throw new RangeError("stimulusType debe ser 'colors', 'numbers' o 'both'");
  }
  if (!Number.isInteger(maxSequenceLength) || maxSequenceLength < MIN_SEQUENCE_LENGTH) {
    throw new RangeError(`maxSequenceLength debe ser un entero >= ${MIN_SEQUENCE_LENGTH}`);
  }

  return { buttons, stimulusType, reposition, sound, maxSequenceLength };
}
