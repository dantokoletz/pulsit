import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AudioEngine, frequencyForValue } from '../../www/js/audio.js';

/**
 * Mock mínimo de Web Audio API (jsdom no la implementa).
 * Registra osciladores/gains creados para poder hacer aserciones sobre su uso.
 */
function createMockAudioContext() {
  const createdOscillators = [];
  const createdGains = [];

  class MockGainParam {
    constructor() {
      this.value = 0;
      this.calls = [];
    }
    setValueAtTime(v) {
      this.value = v;
      this.calls.push(['setValueAtTime', v]);
    }
    linearRampToValueAtTime(v) {
      this.value = v;
      this.calls.push(['linearRampToValueAtTime', v]);
    }
    exponentialRampToValueAtTime(v) {
      this.value = v;
      this.calls.push(['exponentialRampToValueAtTime', v]);
    }
  }

  class MockOscillator {
    constructor() {
      this.type = 'sine';
      this.frequency = { setValueAtTime: vi.fn() };
      this.started = false;
      this.stopped = false;
      this.connectedTo = null;
      createdOscillators.push(this);
    }
    connect(node) {
      this.connectedTo = node;
    }
    start() {
      this.started = true;
    }
    stop() {
      this.stopped = true;
    }
  }

  class MockGain {
    constructor() {
      this.gain = new MockGainParam();
      this.connectedTo = null;
      createdGains.push(this);
    }
    connect(node) {
      this.connectedTo = node;
    }
  }

  function MockAudioContextClass() {
    this.state = 'running';
    this.currentTime = 0;
    this.destination = { id: 'destination' };
    this.resume = vi.fn();
    this.createOscillator = () => new MockOscillator();
    this.createGain = () => new MockGain();
  }

  return { MockAudioContextClass, createdOscillators, createdGains };
}

describe('frequencyForValue', () => {
  it('asigna una frecuencia distinta a cada valor dentro de la escala', () => {
    const freqs = new Set([0, 1, 2, 3, 4, 5, 6, 7, 8].map(frequencyForValue));
    expect(freqs.size).toBe(9);
  });

  it('hace wrap-around si el valor excede el tamaño de la escala', () => {
    expect(frequencyForValue(9)).toBe(frequencyForValue(0));
  });
});

describe('AudioEngine', () => {
  let mock;
  let engine;

  beforeEach(() => {
    mock = createMockAudioContext();
    engine = new AudioEngine({ AudioContextClass: mock.MockAudioContextClass });
  });

  it('no crea el AudioContext hasta la primera reproducción', () => {
    expect(engine.ctx).toBeNull();
    engine.playTone(0);
    expect(engine.ctx).not.toBeNull();
  });

  it('reutiliza el mismo AudioContext entre llamadas', () => {
    engine.playTone(0);
    const ctxRef = engine.ctx;
    engine.playTone(1);
    expect(engine.ctx).toBe(ctxRef);
  });

  it('playTone conecta oscillator -> gain -> destination y lo inicia', () => {
    engine.playTone(2);
    const osc = mock.createdOscillators[0];
    const gain = mock.createdGains[0];
    expect(osc.connectedTo).toBe(gain);
    expect(gain.connectedTo).toEqual({ id: 'destination' });
    expect(osc.started).toBe(true);
  });

  it('no suena si está deshabilitado (setEnabled(false))', () => {
    engine.setEnabled(false);
    engine.playTone(0);
    expect(mock.createdOscillators).toHaveLength(0);
  });

  it('playError genera un oscilador de tipo sawtooth', () => {
    engine.playError();
    expect(mock.createdOscillators[0].type).toBe('sawtooth');
  });

  it('playPhaseCleared reproduce varias notas en diferido sin lanzar errores', () => {
    vi.useFakeTimers();
    engine.playPhaseCleared();
    vi.runAllTimers();
    expect(mock.createdOscillators.length).toBeGreaterThan(1);
    vi.useRealTimers();
  });

  it('playWelcomeCrescendo crea un acorde de 3 notas con fade-in', () => {
    engine.playWelcomeCrescendo(2000);
    expect(mock.createdOscillators).toHaveLength(3);
    mock.createdGains.forEach((gain) => {
      expect(gain.gain.calls[0][0]).toBe('setValueAtTime');
      expect(
        gain.gain.calls.some((call) => call[0] === 'exponentialRampToValueAtTime')
      ).toBe(true);
    });
  });
});
