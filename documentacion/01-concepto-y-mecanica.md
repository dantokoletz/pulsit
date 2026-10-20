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

## Condición de victoria y derrota de una ronda

- Una **ronda** es un intento de repetir una secuencia de longitud `N`.
- El jugador gana la ronda si reproduce los `N` pasos en el orden correcto.
- El jugador pierde (fin de partida) en el momento exacto en que pulsa un botón que no coincide
  con el paso esperado de la secuencia — no se permite reintentar ese paso.
