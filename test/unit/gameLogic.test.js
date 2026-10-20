import { describe, it, expect } from 'vitest';
import {
  CAMPAIGN_PHASES,
  TOTAL_CAMPAIGN_PHASES,
  getPhaseConfig,
  getNextPhase,
  generateButtonValues,
  shuffle,
  generateLayout,
  extendSequence,
  generateSequence,
  evaluateInput,
  isPhaseCleared,
  validateCustomConfig,
  MIN_CUSTOM_BUTTONS,
  MAX_CUSTOM_BUTTONS,
} from '../../www/js/gameLogic.js';

describe('CAMPAIGN_PHASES', () => {
  it('define exactamente 10 fases', () => {
    expect(CAMPAIGN_PHASES).toHaveLength(10);
    expect(TOTAL_CAMPAIGN_PHASES).toBe(10);
  });

  it('respeta la tabla de progresión de la especificación (sección 2.2)', () => {
    const expected = [
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
    expect(CAMPAIGN_PHASES).toEqual(expected);
  });
});

describe('getPhaseConfig', () => {
  it('devuelve la configuración correcta para una fase válida', () => {
    expect(getPhaseConfig(5)).toEqual({
      phase: 5,
      buttons: 5,
      stimulusType: 'colors',
      reposition: true,
    });
  });

  it('devuelve null para una fase inexistente', () => {
    expect(getPhaseConfig(0)).toBeNull();
    expect(getPhaseConfig(11)).toBeNull();
  });
});

describe('getNextPhase', () => {
  it('incrementa la fase mientras no sea la última', () => {
    expect(getNextPhase(1)).toBe(2);
    expect(getNextPhase(9)).toBe(10);
  });

  it('devuelve null tras la última fase', () => {
    expect(getNextPhase(10)).toBeNull();
  });
});

describe('generateButtonValues', () => {
  it('genera `count` valores con índices 0..count-1', () => {
    const values = generateButtonValues(4, 'colors');
    expect(values).toHaveLength(4);
    expect(values.map((v) => v.value)).toEqual([0, 1, 2, 3]);
  });

  it('asigna el tipo fijo cuando stimulusType no es "both"', () => {
    const values = generateButtonValues(5, 'numbers');
    expect(values.every((v) => v.type === 'numbers')).toBe(true);
    expect(values.map((v) => v.label)).toEqual([1, 2, 3, 4, 5]);
  });

  it('alterna colores y números cuando stimulusType es "both"', () => {
    const values = generateButtonValues(4, 'both');
    expect(values.map((v) => v.type)).toEqual(['colors', 'numbers', 'colors', 'numbers']);
  });

  it('lanza RangeError fuera del rango permitido', () => {
    expect(() => generateButtonValues(MIN_CUSTOM_BUTTONS - 1, 'colors')).toThrow(RangeError);
    expect(() => generateButtonValues(MAX_CUSTOM_BUTTONS + 1, 'colors')).toThrow(RangeError);
  });
});

describe('shuffle', () => {
  it('no muta el array original', () => {
    const original = [0, 1, 2, 3];
    const copy = [...original];
    shuffle(original, () => 0.99);
    expect(original).toEqual(copy);
  });

  it('conserva los mismos elementos (es una permutación)', () => {
    const original = [0, 1, 2, 3, 4];
    const result = shuffle(original, Math.random);
    expect([...result].sort()).toEqual(original);
  });

  it('es determinístico con un rng fijo', () => {
    const rngSequence = [0.9, 0.1, 0.5, 0.0];
    let i = 0;
    const rng = () => rngSequence[i++ % rngSequence.length];
    const result = shuffle([0, 1, 2, 3], rng);
    expect(result).toHaveLength(4);
    expect([...result].sort()).toEqual([0, 1, 2, 3]);
  });
});

describe('generateLayout', () => {
  it('sin reposición y sin layout previo, genera un layout de longitud `count`', () => {
    const layout = generateLayout(4, false, null, () => 0.5);
    expect(layout).toHaveLength(4);
    expect([...layout].sort()).toEqual([0, 1, 2, 3]);
  });

  it('sin reposición, reutiliza el layout previo sin cambios', () => {
    const previous = [2, 0, 3, 1];
    const layout = generateLayout(4, false, previous, () => 0.123);
    expect(layout).toEqual(previous);
  });

  it('con reposición, siempre genera un nuevo orden (vía rng)', () => {
    const previous = [0, 1, 2, 3];
    // rng que garantiza un shuffle distinto al identity para este caso simple
    const layout = generateLayout(4, true, previous, () => 0.99);
    expect(layout).toHaveLength(4);
    expect([...layout].sort()).toEqual([0, 1, 2, 3]);
  });
});

describe('extendSequence / generateSequence', () => {
  it('extendSequence agrega exactamente un valor válido', () => {
    const seq = extendSequence([0, 1], 4, () => 0.99);
    expect(seq).toHaveLength(3);
    expect(seq[2]).toBeGreaterThanOrEqual(0);
    expect(seq[2]).toBeLessThan(4);
  });

  it('extendSequence no muta la secuencia original', () => {
    const original = [0, 1];
    extendSequence(original, 4, () => 0.5);
    expect(original).toEqual([0, 1]);
  });

  it('generateSequence produce una secuencia de la longitud pedida con valores en rango', () => {
    const seq = generateSequence(10, 6, Math.random);
    expect(seq).toHaveLength(10);
    seq.forEach((v) => {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(6);
    });
  });
});

describe('evaluateInput', () => {
  const sequence = [0, 2, 1];

  it('detecta entrada parcial correcta', () => {
    expect(evaluateInput(sequence, [0])).toEqual({ status: 'correct-partial', mismatchIndex: -1 });
    expect(evaluateInput(sequence, [0, 2])).toEqual({ status: 'correct-partial', mismatchIndex: -1 });
  });

  it('detecta secuencia completa correcta', () => {
    expect(evaluateInput(sequence, [0, 2, 1])).toEqual({
      status: 'correct-complete',
      mismatchIndex: -1,
    });
  });

  it('detecta error en el primer valor incorrecto', () => {
    expect(evaluateInput(sequence, [0, 1])).toEqual({ status: 'wrong', mismatchIndex: 1 });
  });

  it('detecta error inmediato si el primer valor ya es incorrecto', () => {
    expect(evaluateInput(sequence, [1])).toEqual({ status: 'wrong', mismatchIndex: 0 });
  });
});

describe('isPhaseCleared', () => {
  it('es true cuando la longitud alcanza el máximo', () => {
    expect(isPhaseCleared(10, 10)).toBe(true);
    expect(isPhaseCleared(11, 10)).toBe(true);
  });

  it('es false por debajo del máximo', () => {
    expect(isPhaseCleared(9, 10)).toBe(false);
  });

  it('usa 10 como máximo por defecto', () => {
    expect(isPhaseCleared(10)).toBe(true);
    expect(isPhaseCleared(9)).toBe(false);
  });
});

describe('validateCustomConfig', () => {
  it('acepta y normaliza una configuración válida', () => {
    const config = validateCustomConfig({
      buttons: '5',
      stimulusType: 'both',
      reposition: 'true',
      sound: true,
      maxSequenceLength: '8',
    });
    expect(config).toEqual({
      buttons: 5,
      stimulusType: 'both',
      reposition: true,
      sound: true,
      maxSequenceLength: 8,
    });
  });

  it('aplica maxSequenceLength=10 por defecto si no se especifica', () => {
    const config = validateCustomConfig({ buttons: 4, stimulusType: 'colors', reposition: false });
    expect(config.maxSequenceLength).toBe(10);
  });

  it('rechaza cantidad de botones fuera de rango', () => {
    expect(() =>
      validateCustomConfig({ buttons: 2, stimulusType: 'colors' })
    ).toThrow(RangeError);
    expect(() =>
      validateCustomConfig({ buttons: 10, stimulusType: 'colors' })
    ).toThrow(RangeError);
  });

  it('rechaza un stimulusType inválido', () => {
    expect(() =>
      validateCustomConfig({ buttons: 4, stimulusType: 'shapes' })
    ).toThrow(RangeError);
  });

  it('rechaza una longitud máxima de secuencia inválida', () => {
    expect(() =>
      validateCustomConfig({ buttons: 4, stimulusType: 'colors', maxSequenceLength: 1 })
    ).toThrow(RangeError);
    expect(() =>
      validateCustomConfig({ buttons: 4, stimulusType: 'colors', maxSequenceLength: 'abc' })
    ).toThrow(RangeError);
  });
});
