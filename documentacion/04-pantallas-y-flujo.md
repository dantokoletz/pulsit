# 4. Pantallas y flujo de navegación

Pulsit es una app de una sola página (`index.html`) con cuatro pantallas que se muestran/ocultan
mediante CSS (clase `.active`), sin recarga de página.

## Diagrama de navegación

```
                    ┌────────────────────┐
                    │   Pantalla inicio   │◄───────────────────────────┐
                    │  (screen-start)     │◄───────────┐                │
                    └─────────┬───────────┘            │                │
          "Jugar" │  "Personalizado" │  "⚙ Ajustes"     │ "Volver"       │
                   ▼           │     ▼                  │                │
     ┌─────────────────┐       │   ┌──────────────────┐ │                │
     │  Pantalla juego  │       │   │ Pantalla Ajustes │─┘                │
     │  (screen-game)   │       │   │(screen-settings) │                  │
     │  modo: campaña   │       │   └──────────────────┘                  │
     └────────┬─────────┘       ▼                                        │
               │        ┌───────────────────────┐                        │
               │        │ Pantalla personalizado │                       │
               │        │   (screen-custom)      │                       │
               │        └───────────┬────────────┘                       │
               │               "Jugar" │     "Volver"                    │
               │                       ▼            │                    │
               │             ┌──────────────────┐   │                    │
               │             │  Pantalla juego   │   └────────────────────┘
               │             │  (screen-game)     │
               │   "Menú"    │  modo: personalizado│
               └────────────►└──────────┬──────────┘
                                          │ "Menú"
                                          └──────────────► (vuelve a screen-start)
```

(No se incluyó en el diagrama para no sobrecargarlo, pero desde la pantalla de inicio también se
puede entrar a **"ℹ Acerca de"** (`screen-about`, ver §4.3), que solo tiene un botón "Volver" hacia
el inicio — igual de simple que Ajustes.)

## 4.1 Pantalla de inicio (`screen-start`)

Contenido:
- Logo de CauquenLabs (`www/assets/logo-cauquenlabs.png`).
- Título "Pulsit".
- Botón **"Jugar"**: inicia el modo campaña en la fase más alta desbloqueada.
- Botón **"Personalizado"**: navega a la pantalla de configuración personalizada.
- Botón **"⚙ Ajustes"**: navega a la pantalla de ajustes globales (sonido/vibración, modo
  daltónico — ver abajo).
- Botón **"ℹ Acerca de"**: navega a la pantalla informativa con los datos de la empresa, el
  desarrollador y una descripción del juego (ver §4.3).
- Al primer toque/click del usuario en esta pantalla, se reproduce un sonido suave en crescendo
  (ver [05-audio.md](05-audio.md)), salvo que el sonido esté desactivado en Ajustes. Se dispara una
  sola vez por carga de la app, y no bloquea la interacción (el toque que lo dispara también puede,
  por ejemplo, presionar "Jugar").

> Nota técnica: el sonido de bienvenida se dispara recién tras la primera interacción táctil
> porque los navegadores y WebViews bloquean el audio autoreproducido sin gesto del usuario.

## 4.2 Pantalla de Ajustes (`screen-settings`)

Contenido:
- Casillero **"Sonido y vibración activados"**: ajuste global (ver
  [08-accesibilidad-y-rejugabilidad.md](08-accesibilidad-y-rejugabilidad.md)), aplica igual en
  campaña y en personalizado. Se guarda al instante, sin necesidad de un botón "Guardar".
- Casillero **"Modo daltónico (formas además de color)"**: también global e instantáneo.
- Control deslizante **"Velocidad de la secuencia"**: ajusta cuán rápido se muestra (resalte +
  sonido) cada paso de la secuencia a memorizar, de "Rápida" a "Lenta". También global e
  instantáneo; se persiste al soltar el control (ver
  [08-accesibilidad-y-rejugabilidad.md](08-accesibilidad-y-rejugabilidad.md)).
- Botón **"Volver"**: regresa a la pantalla de inicio.

Se puede entrar a esta pantalla desde el inicio en cualquier momento (no solo antes de jugar); los
cambios aplican de inmediato, incluso si se abre Ajustes en medio de una sesión y se vuelve a jugar
después.

## 4.3 Pantalla "Acerca de" (`screen-about`)

Contenido:
- Logo de CauquenLabs (mismo archivo que la pantalla de inicio, `www/assets/logo-cauquenlabs.png`),
  con una nota aclarando que es provisorio mientras la empresa no provea el diseño definitivo.
- Descripción corta del juego.
- **Empresa**: CauquenLabs.
- **Desarrollador**: Daniel Antokoletz.
- Botón **"Volver"**: regresa a la pantalla de inicio.

Es una pantalla puramente informativa, sin estado propio ni persistencia; se accede desde el botón
**"ℹ Acerca de"** de la pantalla de inicio.

## 4.4 Pantalla de modo personalizado (`screen-custom`)

Contenido: formulario con los campos descritos en
[03-modo-personalizado.md](03-modo-personalizado.md), más:
- Botón **"Jugar"** (submit del formulario): valida, guarda la configuración y comienza la partida.
- Botón **"Volver"**: regresa a la pantalla de inicio sin iniciar partida (puede o no haber
  guardado cambios, según si se llegó a enviar el formulario).

Al entrar a esta pantalla, el formulario se precompleta con la última configuración guardada (o
los valores por defecto si es la primera vez). El sonido **no** es parte de este formulario (ver
§4.2, Ajustes).

## 4.5 Pantalla de juego (`screen-game`)

Contenido:
- **Número de fase luminoso**: solo en modo campaña, muestra el número de fase actual (1-10) con
  un estilo de neón/glow. No se muestra en modo personalizado (no hay un "número de fase").
- Barra de estado: fase actual (o "Modo personalizado").
- **Barra de progreso**: indica visualmente cuánto falta de la secuencia actual para superar la
  fase/partida (`sequenceLength / maxSequenceLength`), además del texto `Secuencia: X / N`.
- Botón **"Menú"**: abandona la partida en curso y vuelve a la pantalla de inicio.
- Mensaje de estado: "Observa la secuencia...", "Tu turno", resultado de fase superada, o mensaje
  de derrota con la longitud de secuencia alcanzada.
- Tablero de botones (circulares, agrupados en filas fijas según la cantidad — ver
  [01-concepto-y-mecanica.md](01-concepto-y-mecanica.md)), con la cantidad y tipo de botones que
  indique la fase/configuración activa.
- **Barra "Reiniciar nivel"**: reinicia la partida actual desde una secuencia de longitud 2, con la
  misma configuración (fase o modo personalizado), sin volver al menú. Útil para intentar de nuevo
  sin perder tiempo navegando pantallas.

Esta misma pantalla sirve tanto para el modo campaña como para el modo personalizado; lo único que
cambia es la configuración del tablero, el texto de la barra de estado y si se muestra o no el
número de fase luminoso.

## 4.5 Fondo visual

Las cuatro pantallas comparten un fondo fijo de ambientación ("futurista", estilo circuito impreso:
líneas y nodos azules sobre fondo negro, con un pulso suave de resplandor encima). La imagen del
fondo vive en un **archivo de recurso reemplazable**, `www/assets/background-circuit.webp`, no está
embebida en el código: para cambiarla alcanza con reemplazar ese archivo (ver `AGENTS.md`).
