# 2. Progresión de niveles — Modo campaña

El modo campaña consiste en 10 fases fijas, de dificultad creciente. El jugador avanza
linealmente: debe superar la fase `N` para desbloquear la fase `N+1`.

## Tabla de fases

| Fase | Botones | Estímulo visual | Estímulo sonoro | ¿Cambian de posición? | Secuencia |
|------|---------|-----------------|------------------|------------------------|-----------|
| 1  | 3 | Colores  | Sí | No  | 2 → 10 |
| 2  | 3 | Números  | Sí | No  | 2 → 10 |
| 3  | 4 | Colores  | Sí | No  | 2 → 10 |
| 4  | 4 | Números  | Sí | No  | 2 → 10 |
| 5  | 5 | Colores  | Sí | Sí  | 2 → 10 |
| 6  | 5 | Números  | Sí | Sí  | 2 → 10 |
| 7  | 6 | Colores  | Sí | No  | 2 → 10 |
| 8  | 7 | Números  | Sí | No  | 2 → 10 |
| 9  | 8 | Colores  | Sí | Sí  | 2 → 10 |
| 10 | 9 | Números  | Sí | Sí  | 2 → 10 |

Fuente de verdad en código: `www/js/gameLogic.js`, constante `CAMPAIGN_PHASES`.

## Reglas de una fase

1. Al entrar a una fase, la secuencia comienza en **longitud 2**.
2. Cada vez que el jugador repite correctamente la secuencia, esta crece en un elemento y se
   vuelve a reproducir (con un paso adicional) tras un breve intervalo.
3. Si la fase indica "cambian de posición", los botones se reordenan aleatoriamente en pantalla
   **después de cada ronda exitosa**, antes de mostrar la siguiente secuencia. Si no, los botones
   permanecen en el mismo lugar durante toda la fase.
4. La fase se considera **superada** cuando el jugador completa correctamente una secuencia de
   **longitud 10**.
5. Si el jugador falla en cualquier momento, la partida de esa fase termina. El progreso guardado
   (fase más alta desbloqueada) no se pierde, pero debe reintentar la fase actual desde una
   secuencia de longitud 2.

## Desbloqueo de fases

- El progreso se mide como "la fase más alta desbloqueada", persistida en el dispositivo (ver
  [06-persistencia.md](06-persistencia.md)).
- El botón **"Jugar"** de la pantalla de inicio siempre lleva a la fase desbloqueada más alta.
- Superar la fase 10 completa la campaña; el juego debe comunicarlo con un mensaje de felicitación.
