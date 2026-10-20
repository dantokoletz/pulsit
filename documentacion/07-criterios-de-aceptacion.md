# 7. Criterios de aceptación

Checklist funcional derivado de la especificación original del proyecto (`pulsit.md`, sección 6).
Cada ítem indica dónde verificarlo (manualmente y/o con qué test automatizado).

- [x] El juego inicia en la pantalla de bienvenida con el logo y el sonido crescendo.
      → Manual + `www/js/audio.js` (`playWelcomeCrescendo`).
- [x] El modo campaña respeta la progresión de fases especificada en la tabla de la sección 2.2.
      → `test/unit/gameLogic.test.js` (tabla `CAMPAIGN_PHASES`).
- [x] Los botones cambian de posición cuando la fase lo requiere.
      → `test/unit/gameLogic.test.js` (`generateLayout`) y
        `test/integration/campaign-flow.test.js` (fase 5, con reposición).
- [x] Cada botón tiene sonido propio.
      → `test/unit/audio.test.js` (`frequencyForValue`, tonos únicos por valor).
- [x] El modo personalizado permite todas las configuraciones descritas.
      → `test/integration/custom-mode-flow.test.js`.
- [x] El progreso y la configuración persisten tras cerrar y reabrir la app.
      → `test/unit/storage.test.js` (sección "persistencia entre instancias").
- [x] La interfaz es usable en teléfonos (pantalla pequeña) y tablets.
      → Manual (ver `www/css/styles.css`, media queries en 768px/1024px, botones ≥48px).
- [ ] El proyecto se abre en Android Studio sin errores de sincronización.
      → Manual, requiere Android Studio + JDK (no verificable desde este entorno de desarrollo).
- [ ] Se puede generar un `.aab` firmado desde Android Studio.
      → Manual, ver `README.md` (sección de publicación).
- [x] Existen `AGENTS.md` y `PROJECT.md` con el nivel de detalle especificado.
- [x] El historial de Git refleja el desarrollo de forma comprensible.

Los ítems marcados como "Manual" requieren Android Studio con el SDK/JDK instalados, que no están
disponibles en el entorno donde se generó este proyecto; quedan documentados como siguiente paso
en `PROJECT.md`.
