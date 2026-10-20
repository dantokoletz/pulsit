# 6. Persistencia local

Pulsit guarda varias piezas de información en el dispositivo, de forma que sobrevivan a cerrar y
reabrir la app.

## 6.1 Qué se guarda

| Dato | Clave de almacenamiento | Formato | Valor por defecto |
|---|---|---|---|
| Fase de campaña más alta desbloqueada | `pulsit.campaignProgress` | entero (string) | `1` |
| Configuración de modo personalizado | `pulsit.customConfig` | JSON | ver [03-modo-personalizado.md](03-modo-personalizado.md) |
| Mejores puntajes (por fase de campaña y modo personalizado) | `pulsit.bestScores` | JSON (mapa clave → entero) | `{}` |
| Modo daltónico activado | `pulsit.colorblindMode` | `"true"` / `"false"` | `false` |
| Sonido y vibración activados (global, pantalla de Ajustes) | `pulsit.soundEnabled` | `"true"` / `"false"` | `true` |

## 6.2 Reglas de negocio

- El progreso de campaña **nunca retrocede**: si el jugador ya desbloqueó la fase 6 y por algún
  motivo se reintenta guardar la fase 3, el valor persistido sigue siendo 6. Lo mismo aplica a los
  mejores puntajes (ver [08-accesibilidad-y-rejugabilidad.md](08-accesibilidad-y-rejugabilidad.md)).
- La configuración personalizada se sobrescribe completa cada vez que el jugador guarda cambios
  (no es un merge parcial a nivel de usuario, aunque internamente se combina con valores por
  defecto si faltara algún campo en el dato guardado).
- Si el dato guardado está corrupto o no es parseable, la app debe recuperarse usando los valores
  por defecto, nunca debe romperse o bloquear el inicio de la app.

## 6.3 Dónde vive el dato (mecanismo de persistencia)

- En **desarrollo web** (navegador, `npm run dev`), se usa `localStorage`.
- En el **build empaquetado con Capacitor** (Android), se usa el plugin
  **`@capacitor/preferences`**, que persiste de forma más robusta que `localStorage` dentro de un
  WebView.
- La app detecta automáticamente qué backend usar (ver `www/js/storage.js`); el resto del código
  del juego no necesita saber cuál de los dos está activo.
