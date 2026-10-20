# Tests de Pulsit

Suite de tests automatizados sobre el código de `www/js/`, usando **Vitest** + **jsdom**.

## Estructura

```
test/
├── unit/                  # Tests unitarios: un módulo a la vez, sin dependencias reales
│   ├── gameLogic.test.js  # Reglas puras del juego (fases, secuencias, validación)
│   ├── storage.test.js    # Persistencia, con backend en memoria inyectado
│   └── audio.test.js      # AudioEngine, con AudioContext mockeado
└── integration/           # Tests de integración: varios módulos trabajando juntos + DOM real
    ├── helpers.js                   # Utilidades compartidas (espera asíncrona, clicks)
    ├── campaign-flow.test.js        # Partida completa de modo campaña vía clicks reales
    └── custom-mode-flow.test.js     # Formulario -> persistencia -> partida personalizada
```

## Cómo correr los tests

```bash
npm install        # una sola vez
npm test           # corre toda la suite (unit + integration) una vez
npm run test:watch       # modo watch, útil en desarrollo
npm run test:unit        # solo unit/
npm run test:integration # solo integration/
```

## Qué cubre cada nivel

### Unit (`test/unit/`)

Prueban funciones puras o clases con dependencias inyectables, sin DOM real ni temporizadores:

- **`gameLogic.test.js`**: la tabla de las 10 fases de campaña, generación de secuencias y
  layouts, shuffle, evaluación de la entrada del jugador, condición de fase superada, y
  validación de la configuración personalizada.
- **`storage.test.js`**: lectura/escritura de progreso de campaña y configuración personalizada
  sobre un backend en memoria (mismo contrato que Capacitor Preferences), incluyendo manejo de
  datos corruptos y la regla de que el progreso nunca retrocede.
- **`audio.test.js`**: generación de tonos (frecuencia única por botón), conexión correcta de
  nodos de Web Audio API (oscillator → gain → destination), respeto del flag de sonido
  activado/desactivado, y la forma del sonido de bienvenida en crescendo.

### Integration (`test/integration/`)

Prueban el flujo real tal como lo viviría un jugador, combinando varios módulos y un DOM real
(jsdom), incluyendo clicks simulados sobre los botones renderizados:

- **`campaign-flow.test.js`**: renderizado del tablero de una fase, una partida completa jugada
  correctamente hasta superar la fase (con persistencia del progreso), una partida perdida por un
  click incorrecto, y el reposicionamiento de botones en una fase que lo requiere.
- **`custom-mode-flow.test.js`**: carga de valores por defecto en el formulario, guardado y
  persistencia de una configuración editada, rechazo de una configuración inválida sin persistir
  cambios, el modo "ambos" estímulos en el tablero, y que `sound:false` efectivamente impide
  cualquier reproducción de audio real.

## Notas de diseño de los tests

- Los tests de integración usan temporizadores **reales** (no fake timers) junto con un helper
  `waitFor` que sondea el estado del `GameController`, en lugar de intentar sincronizar
  manualmente con los `setTimeout` internos de la reproducción de secuencias. Es más lento
  (segundos, no milisegundos) pero mucho más robusto frente a cambios de timing internos.
- El `AudioEngine` no requiere mocks obligatorios para los tests de integración: en jsdom no existe
  `AudioContext`, así que el motor de audio real ya se comporta como no-op de forma segura (nunca
  lanza, nunca crea nodos). Los tests unitarios de `audio.js` sí inyectan una clase
  `AudioContext` simulada para poder verificar el detalle de las conexiones de nodos.
- `gameLogic.js` expone funciones puras con un parámetro `rng` inyectable precisamente para poder
  escribir tests deterministas sin parchear `Math.random`.

## Qué falta cubrir (fuera del alcance de esta suite)

- Tests end-to-end sobre el APK/AAB real en un dispositivo o emulador Android (requiere Android
  Studio + un entorno con SDK, no disponible al generar este proyecto). Ver `PROJECT.md` para el
  estado de este pendiente.
- Pruebas visuales/responsive automatizadas (la responsividad se valida manualmente, ver
  `documentacion/07-criterios-de-aceptacion.md`).
