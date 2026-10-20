// Utilidades compartidas por los tests de integración.

/**
 * Espera (con temporizadores reales) a que `conditionFn` devuelva true, sondeando
 * periódicamente. Se usa para sincronizar con la lógica asíncrona de GameController
 * (reproducción de secuencias con retardos) sin depender de temporizadores falsos.
 */
export function waitFor(conditionFn, { timeout = 5000, interval = 15 } = {}) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      if (conditionFn()) {
        resolve();
        return;
      }
      if (Date.now() - start > timeout) {
        reject(new Error(`waitFor: tiempo de espera agotado (${timeout}ms)`));
        return;
      }
      setTimeout(check, interval);
    };
    check();
  });
}

/** Simula un click real de usuario sobre un botón del tablero renderizado. */
export function clickButton(buttons, position) {
  buttons[position].dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
}
