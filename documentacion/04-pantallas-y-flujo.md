# 4. Pantallas y flujo de navegación

Pulsit es una app de una sola página (`index.html`) con tres pantallas que se muestran/ocultan
mediante CSS (clase `.active`), sin recarga de página.

## Diagrama de navegación

```
                    ┌────────────────────┐
                    │   Pantalla inicio   │◄───────────────────────────┐
                    │  (screen-start)     │                             │
                    └─────────┬───────────┘                             │
                 "Jugar"      │          "Personalizado"                │
                    ▼         │                ▼                        │
        ┌─────────────────┐   │    ┌───────────────────────┐            │
        │  Pantalla juego  │   │    │ Pantalla personalizado │           │
        │  (screen-game)   │   │    │   (screen-custom)      │           │
        │  modo: campaña   │   │    └───────────┬────────────┘           │
        └────────┬─────────┘   │        "Jugar" │     "Volver"           │
                  │             │                ▼            │          │
                  │             │      ┌──────────────────┐   │          │
                  │             └─────►│  Pantalla juego   │   └──────────┘
                  │                    │  (screen-game)     │
                  │   "Menú"           │  modo: personalizado│
                  └───────────────────►└──────────┬──────────┘
                                                    │ "Menú"
                                                    └──────────────┐
                                                                   ▼
                                                        (vuelve a screen-start)
```

## 4.1 Pantalla de inicio (`screen-start`)

Contenido:
- Logo de CauquenLabs (`www/assets/logo-cauquenlabs.png`).
- Título "Pulsit".
- Botón **"Jugar"**: inicia el modo campaña en la fase más alta desbloqueada.
- Botón **"Personalizado"**: navega a la pantalla de configuración personalizada.
- Al primer toque/click del usuario en esta pantalla, se reproduce un sonido suave en crescendo
  (ver [05-audio.md](05-audio.md)). Se dispara una sola vez por carga de la app, y no bloquea la
  interacción (el toque que lo dispara también puede, por ejemplo, presionar "Jugar").

> Nota técnica: el sonido de bienvenida se dispara recién tras la primera interacción táctil
> porque los navegadores y WebViews bloquean el audio autoreproducido sin gesto del usuario.

## 4.2 Pantalla de modo personalizado (`screen-custom`)

Contenido: formulario con los campos descritos en
[03-modo-personalizado.md](03-modo-personalizado.md), más:
- Botón **"Jugar"** (submit del formulario): valida, guarda la configuración y comienza la partida.
- Botón **"Volver"**: regresa a la pantalla de inicio sin iniciar partida (puede o no haber
  guardado cambios, según si se llegó a enviar el formulario).

Al entrar a esta pantalla, el formulario se precompleta con la última configuración guardada (o
los valores por defecto si es la primera vez).

## 4.3 Pantalla de juego (`screen-game`)

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

## 4.4 Fondo visual

Las tres pantallas comparten un fondo fijo de ambientación ("futurista", estilo circuito: líneas y
nodos azules/violeta sobre un degradé oscuro, con un pulso suave de resplandor). La imagen del
fondo vive en un **archivo de recurso reemplazable**, `www/assets/background-circuit.svg`, no está
embebida en el código: para cambiarla alcanza con reemplazar ese archivo (ver `AGENTS.md`).
