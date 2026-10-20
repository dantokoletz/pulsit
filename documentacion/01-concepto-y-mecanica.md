# 1. Concepto y mecánica central

**Pulsit** es un juego de memoria y concentración, propiedad de **CauquenLabs**, basado en el
mecanismo clásico de "Simón":

1. El sistema muestra una **secuencia de estímulos** (visuales y sonoros) pulsando botones en un
   orden determinado.
2. El jugador debe **repetir la secuencia** pulsando los mismos botones, en el mismo orden.
3. Si el jugador lo hace correctamente, la secuencia crece en un paso y se repite el ciclo.
4. Si el jugador se equivoca, la partida termina (en esa fase/sesión).

## Qué distingue a Pulsit de un "Simón" tradicional

La dificultad no crece únicamente alargando la secuencia. También varían, a lo largo del modo
campaña:

- **La cantidad de botones en pantalla** (de 3 a 9).
- **El tipo de estímulo visual**: colores sólidos o números.
- **Si los botones cambian de posición** en pantalla entre rondas, obligando al jugador a
  identificar el botón por su color/número y no por su ubicación memorizada.

## Identidad del botón vs. posición en pantalla

Cada botón tiene una **identidad lógica** fija (p. ej. "el botón rojo" o "el número 3"), que
siempre:

- Se ve igual (mismo color o mismo número).
- Suena igual (mismo tono, ver [05-audio.md](05-audio.md)).

Lo único que puede cambiar es su **posición en la grilla** cuando la fase indica reposicionamiento.
Esto es intencional: el jugador memoriza "la secuencia es rojo, verde, azul", no "arriba-izquierda,
centro, abajo-derecha".

## Disposición del tablero

Los botones son circulares y se agrupan siempre en filas fijas según la cantidad total (no en una
grilla que se ajusta libremente al ancho de pantalla), para que la "figura" del tablero sea
consistente en cualquier dispositivo:

| Botones | Filas |
|---|---|
| 3 | 2 arriba, 1 abajo centrado |
| 4 | 2 arriba, 2 abajo |
| 5 | 3 arriba, 2 abajo centrados |
| 6 | 3 arriba, 3 abajo |
| 7 | 3 arriba, 3 en el medio, 1 abajo centrado |
| 8 | 3 arriba, 3 en el medio, 2 abajo centrados |
| 9 | 3 arriba, 3 en el medio, 3 abajo |

Fuente de verdad en código: `www/js/gameLogic.js`, función `getRowLayout`.

## Condición de victoria y derrota de una ronda

- Una **ronda** es un intento de repetir una secuencia de longitud `N`.
- El jugador gana la ronda si reproduce los `N` pasos en el orden correcto.
- El jugador pierde (fin de partida) en el momento exacto en que pulsa un botón que no coincide
  con el paso esperado de la secuencia — no se permite reintentar ese paso.
