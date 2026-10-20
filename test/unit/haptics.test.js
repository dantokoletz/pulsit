import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HapticsEngine } from '../../www/js/haptics.js';

function createMockNativeHaptics() {
  return {
    impact: vi.fn().mockResolvedValue(undefined),
    notification: vi.fn().mockResolvedValue(undefined),
  };
}

describe('HapticsEngine — con plugin nativo disponible', () => {
  let nativeHaptics;
  let engine;

  beforeEach(() => {
    nativeHaptics = createMockNativeHaptics();
    engine = new HapticsEngine({ nativeHaptics, vibrateFn: vi.fn() });
  });

  it('impactLight llama a impact con estilo LIGHT', () => {
    engine.impactLight();
    expect(nativeHaptics.impact).toHaveBeenCalledWith({ style: 'LIGHT' });
  });

  it('notifyError llama a notification con tipo ERROR', () => {
    engine.notifyError();
    expect(nativeHaptics.notification).toHaveBeenCalledWith({ type: 'ERROR' });
  });

  it('notifySuccess llama a notification con tipo SUCCESS', () => {
    engine.notifySuccess();
    expect(nativeHaptics.notification).toHaveBeenCalledWith({ type: 'SUCCESS' });
  });

  it('no usa el fallback de navigator.vibrate cuando hay plugin nativo', () => {
    engine.impactLight();
    expect(engine.vibrateFn).not.toHaveBeenCalled();
  });

  it('no dispara nada si está deshabilitado', () => {
    engine.setEnabled(false);
    engine.impactLight();
    engine.notifyError();
    expect(nativeHaptics.impact).not.toHaveBeenCalled();
    expect(nativeHaptics.notification).not.toHaveBeenCalled();
  });

  it('un rechazo del plugin nativo no lanza ni interrumpe el juego', async () => {
    nativeHaptics.impact.mockRejectedValueOnce(new Error('no soportado'));
    expect(() => engine.impactLight()).not.toThrow();
    await Promise.resolve(); // deja asentar el .catch() interno
  });
});

describe('HapticsEngine — fallback a navigator.vibrate (sin plugin nativo)', () => {
  let vibrateFn;
  let engine;

  beforeEach(() => {
    vibrateFn = vi.fn();
    engine = new HapticsEngine({ nativeHaptics: null, vibrateFn });
  });

  it('impactLight vibra con un patrón corto', () => {
    engine.impactLight();
    expect(vibrateFn).toHaveBeenCalledWith(10);
  });

  it('notifyError vibra con un patrón distinto al de impactLight', () => {
    engine.notifyError();
    expect(vibrateFn).toHaveBeenCalledWith([30, 40, 30]);
  });

  it('notifySuccess vibra con su propio patrón', () => {
    engine.notifySuccess();
    expect(vibrateFn).toHaveBeenCalledWith(15);
  });

  it('no vibra si está deshabilitado', () => {
    engine.setEnabled(false);
    engine.impactLight();
    expect(vibrateFn).not.toHaveBeenCalled();
  });
});

describe('HapticsEngine — sin plugin nativo ni navigator.vibrate', () => {
  it('no lanza al invocar cualquier método', () => {
    const engine = new HapticsEngine({ nativeHaptics: null, vibrateFn: null });
    expect(() => engine.impactLight()).not.toThrow();
    expect(() => engine.notifyError()).not.toThrow();
    expect(() => engine.notifySuccess()).not.toThrow();
  });
});
