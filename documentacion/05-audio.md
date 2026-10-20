# 5. Diseño sonoro

Todo el audio de Pulsit se genera **programáticamente** con la Web Audio API (osciladores), sin
archivos de audio externos. Esto evita problemas de peso de assets y de licencias, y permite que
el sonido se adapte dinámicamente a cualquier cantidad de botones (3 a 9).

## 5.1 Sonido por botón

- Cada botón tiene una **identidad lógica** (valor 0 a 8, ver
  [01-concepto-y-mecanica.md](01-concepto-y-mecanica.md)).
- A cada valor lógico se le asigna una nota fija de una escala pentatónica mayor, de forma que:
  - Los 9 tonos posibles son todos distinguibles entre sí.
  - El sonido de un botón **no depende de su posición en pantalla**: si el botón "rojo" suena una
    nota determinada, seguirá sonando esa misma nota aunque la fase reposicione los botones.
- El tono se reproduce tanto cuando el sistema muestra la secuencia como cuando el jugador pulsa un
  botón (para dar retroalimentación inmediata).

## 5.2 Sonido de bienvenida (crescendo)

- Al entrar a la pantalla de inicio, se reproduce un acorde suave que entra con un **fade-in
  gradual de aproximadamente 2 segundos** (crescendo), usando una rampa de ganancia exponencial.
- Se dispara en el primer toque del usuario sobre la pantalla (ver
  [04-pantallas-y-flujo.md](04-pantallas-y-flujo.md) para la razón técnica).

## 5.3 Sonidos de feedback de partida

- **Error**: tono grave y corto (onda diente de sierra) cuando el jugador pulsa un botón
  incorrecto.
- **Fase superada**: una pequeña progresión ascendente de 4 notas, para marcar un logro.

## 5.4 Control de sonido

- En el modo personalizado, el jugador puede desactivar completamente el sonido (`sound: false`).
- Con el sonido desactivado, no debe reproducirse ningún tono, ni los de secuencia/feedback ni el
  de bienvenida de la fase de juego (la pantalla de inicio siempre reproduce su crescendo, ya que
  ese ajuste solo aplica a la partida en sí).
