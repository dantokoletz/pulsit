# 8. Accesibilidad, feedback háptico y rejugabilidad

Mejoras agregadas tras el lanzamiento inicial, a pedido del usuario.

Tanto el sonido como el modo daltónico y la háptica son preferencias **globales** del jugador,
configurables desde la pantalla de Ajustes (ver
[04-pantallas-y-flujo.md](04-pantallas-y-flujo.md)) y persistidas en el dispositivo — no son parte
de la configuración de una partida de modo personalizado, y aplican igual en campaña. (El sonido
originalmente era un parámetro por partida; se migró a un ajuste global porque, entre otras cosas,
el modo campaña no tenía forma de desactivarlo.)

## 8.1 Feedback háptico

Cada vez que el jugador toca un botón, el dispositivo vibra brevemente, reforzando el acierto o el
error sin depender solo de la vista/oído:

- **Toque correcto** (parcial o el que completa la ronda): vibración corta y suave.
- **Toque incorrecto** (fin de partida): patrón de vibración distinto, más marcado.
- **Fase/partida superada**: vibración de "éxito".

Reglas:
- Se activa/desactiva junto con el sonido, desde el casillero **"Sonido y vibración activados"**
  de la pantalla de Ajustes (ver [04-pantallas-y-flujo.md](04-pantallas-y-flujo.md)); no hay un
  control separado para la vibración.
- En un dispositivo o navegador sin soporte de vibración, simplemente no pasa nada (no genera
  errores).

Fuente de verdad en código: `www/js/haptics.js` (`HapticsEngine`).

## 8.2 Modo daltónico

Un casillero en la pantalla de Ajustes ("Modo daltónico (formas además de color)") hace que,
además del color, cada botón de tipo "colores" muestre una **forma fija** (círculo, cuadrado, triángulo,
rombo, estrella, cruz, triángulo invertido, hexágono, estrella de cuatro puntas — una por cada
valor posible, 0 a 8), para poder jugar sin depender de distinguir los colores de la paleta.

- Es una preferencia **global**, persistida en el dispositivo, independiente de si se está jugando
  en modo campaña o personalizado.
- Solo afecta a los botones de tipo "colores". Los de tipo "números" o "ambos" ya tienen un número
  como identificador independiente del color, así que no necesitan una forma adicional.
- El `aria-label` de cada botón también menciona el nombre de la forma, para lectores de pantalla.

Fuente de verdad en código: `www/js/gameLogic.js` (`shapeForValue`, `shapeNameForValue`),
`www/js/game.js` (`createButtonElement`).

## 8.3 Mejor puntaje

Durante la partida, la barra de estado muestra, junto al progreso de la secuencia actual, el mejor
resultado histórico para esa fase (o para el modo personalizado): `Secuencia: X / N · Mejor: B`.

- En modo campaña, el mejor puntaje se guarda **por fase** (la fase 3 tiene su propio mejor,
  independiente de la fase 5, por ejemplo).
- En modo personalizado, hay un único mejor puntaje global (no depende de la configuración elegida
  esa partida).
- "Mejor puntaje" significa la secuencia más larga que el jugador logró **repetir correctamente**
  (no cuenta la secuencia en la que falló).
- Nunca retrocede: si ya se alcanzó un 7, un intento posterior que llega a 5 no lo reemplaza.

Fuente de verdad en código: `www/js/storage.js` (`getBestScore`, `setBestScore`,
`campaignScoreKey`, `CUSTOM_SCORE_KEY`).

## 8.4 Comportamiento al rotar la pantalla

La app no fuerza una orientación fija: si el dispositivo rota a horizontal, la interfaz se
reacomoda automáticamente (es una página web responsive, no una vista nativa fija). La disposición
de los botones en filas (ver [01-concepto-y-mecanica.md](01-concepto-y-mecanica.md)) se mantiene
igual; lo que cambia es el tamaño disponible en pantalla.

Con configuraciones de muchos botones (varias filas) en horizontal, el contenido puede no entrar
completo en el alto disponible; para eso, cada pantalla permite hacer **scroll vertical acotado a
sí misma** (`.screen`, con `overflow-y: auto`) en vez de depender de que todo entre sin scroll.

- **Fix de contención** (reportado por el usuario: "la pantalla queda fuera del celular, puedo
  moverla"): `#app` originalmente usaba `min-height: 100dvh` (una mínima, no un máximo) y `.screen`
  dependía de `overflow-y: auto` sin acotar su propia altura. Como un ítem flex tiene
  `min-height: auto` por defecto, no se encogía por debajo del tamaño de su contenido, así que el
  scroll interno nunca llegaba a activarse: en vez de eso, `#app` (y con él toda la página) crecía
  más allá de la ventana visible, y el usuario terminaba "arrastrando" la página entera en lugar de
  hacer scroll dentro de la pantalla actual. El fix fija `#app` a `height: 100dvh` (un máximo real)
  y agrega `min-height: 0` a `.screen`, para que el scroll quede contenido donde corresponde.
  `html`/`body` llevan además `overflow: hidden` como respaldo, para que la página en sí nunca sea
  pannable.
- En orientación horizontal con poca altura disponible (`@media (orientation: landscape) and
  (max-height: 500px)`), se reduce el tamaño de elementos decorativos (logo, subtítulo, separación
  entre botones) para que la mayoría de las configuraciones entren sin necesitar scroll.
- Verificado manualmente achicando la ventana del navegador a proporciones de teléfono en
  horizontal: con 9 botones (3 filas), la página en sí no crece más allá de la ventana
  (`document.body.scrollHeight === window.innerHeight`); lo que no entra scrollea dentro de
  `.screen` únicamente.

Fuente de verdad en código: `www/css/styles.css` (`#app`, `.screen`, y la media query de
`orientation: landscape`).

## 8.5 Velocidad de la secuencia

Un control deslizante en la pantalla de Ajustes ("Velocidad de la secuencia") regula cuánto dura
cada paso de la secuencia que se muestra para memorizar (el resalte visual del botón más la pausa
hasta el siguiente paso), de 350ms (Rápida) a 1100ms (Lenta), por defecto 700ms — un poco más lento
que el valor fijo original (550ms) con el que arrancó el proyecto, a pedido del usuario tras probar
el modo campaña.

- Es una preferencia **global**, persistida en el dispositivo (`pulsit.sequenceSpeedMs`, ver
  [06-persistencia.md](06-persistencia.md)), aplica igual en campaña y en personalizado.
- El resalte visual del botón dura un poco menos que el paso completo (hay una pausa fija de 150ms
  entre el fin de un resalte y el comienzo del siguiente), para que siempre se note el "apagado"
  entre dos botones consecutivos aunque sean el mismo valor repetido.
- También se agregó un **halo luminoso** alrededor del botón activo durante la reproducción (además
  del brillo y la ligera ampliación ya existentes), para que el botón resaltado sea más fácil de
  distinguir a simple vista.

Fuente de verdad en código: `www/js/storage.js` (`getSequenceSpeedMs`/`setSequenceSpeedMs`),
`www/js/game.js` (`GameController._playCurrentSequence`).

## 8.6 Verificación en tablet

Además del emulador de teléfono, se verificó manualmente en un emulador de tablet (perfil "10.1in
WXGA", 800×1280 @ 160dpi): el contenido queda centrado dentro del ancho máximo de cada pantalla
(`max-width` en `.screen`, ver `www/css/styles.css`) en vez de estirarse de punta a punta, por lo
que el tablero, los botones y los textos mantienen proporciones razonables y no se ven ni
gigantes ni perdidos en una pantalla mucho más ancha que un teléfono.
