// audio.js
// Generación de sonido 100% programática con Web Audio API (sin assets externos).
//
// Cada "valor" lógico de botón (0..8) tiene asignada una nota fija, de modo que el sonido de
// cada botón es único, claramente distinguible al oído, y permanece ligado al valor del botón
// (no a su posición en pantalla) para que el reposicionamiento de fases avanzadas no rompa la
// asociación sonido-identidad que el jugador memoriza.
//
// Las notas están separadas por terceras mayores (4 semitonos) en vez de por grados de una escala
// pentatónica (2-3 semitonos): con pasos tan chicos, botones consecutivos sonaban demasiado
// parecidos entre sí, sobre todo en reproducciones cortas. Con terceras mayores, las 9 notas se
// extienden a lo largo de 3 octavas (A3 a ~D6), maximizando la separación perceptible entre
// cualquier par de botones mientras se mantiene un patrón armónico consistente (acorde aumentado).
const BASE_FREQUENCY = 220; // A3
const SEMITONES_PER_STEP = 4; // tercera mayor
const NOTE_FREQUENCIES = Array.from({ length: 9 }, (_, i) =>
  BASE_FREQUENCY * Math.pow(2, (i * SEMITONES_PER_STEP) / 12)
);

export function frequencyForValue(value) {
  return NOTE_FREQUENCIES[value % NOTE_FREQUENCIES.length];
}

export class AudioEngine {
  /**
   * @param {object} [options]
   * @param {typeof AudioContext} [options.AudioContextClass] - inyectable para tests/mocks.
   */
  constructor({ AudioContextClass } = {}) {
    this.AudioContextClass =
      AudioContextClass ||
      (typeof window !== 'undefined' ? window.AudioContext || window.webkitAudioContext : null);
    this.ctx = null;
    this.enabled = true;
  }

  /**
   * Crea (o reutiliza) el AudioContext. Debe llamarse tras una interacción del usuario
   * para cumplir las políticas de autoplay de los navegadores/WebView.
   */
  ensureContext() {
    if (!this.ctx && this.AudioContextClass) {
      this.ctx = new this.AudioContextClass();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  setEnabled(enabled) {
    this.enabled = enabled;
  }

  /**
   * Reproduce el tono asociado a un valor de botón.
   * @param {number} value
   * @param {number} [durationMs]
   */
  playTone(value, durationMs = 350) {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const frequency = frequencyForValue(value);
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    const now = ctx.currentTime;
    const duration = durationMs / 1000;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.35, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
  }

  /** Tono corto y grave para marcar un error. */
  playError() {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(110, ctx.currentTime);

    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.42);
  }

  /** Acorde ascendente para marcar que se superó una fase. */
  playPhaseCleared() {
    if (!this.enabled) return;
    [0, 2, 4, 7].forEach((value, i) => {
      setTimeout(() => this.playTone(value, 300), i * 120);
    });
  }

  /**
   * Sonido suave en crescendo para la pantalla de inicio: un acorde que entra con
   * fade-in gradual de ~2 segundos (sección 2.3 de la spec).
   * @param {number} [durationMs]
   */
  playWelcomeCrescendo(durationMs = 2000) {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const duration = durationMs / 1000;
    const chordValues = [0, 2, 4]; // tríada agradable sobre la escala base

    chordValues.forEach((value) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequencyForValue(value), now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.18, now + duration);
      gain.gain.linearRampToValueAtTime(0, now + duration + 0.8);

      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(now);
      oscillator.stop(now + duration + 0.9);
    });
  }
}
