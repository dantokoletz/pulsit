# Identidad del proyecto

- **Nombre**: Pulsit
- **Propietario**: CauquenLabs
- **Tipo**: Juego de memoria/concentración tipo "Simón" para Android.
- **Repositorio**: este mismo repositorio (raíz = carpeta `pulsit/`).

## Stack

- Frontend del juego: HTML5 + CSS3 + JavaScript vanilla (ES Modules), en `www/`.
- Audio: Web Audio API pura (sin assets de audio).
- Empaquetado nativo: Capacitor 8.x → proyecto Android real en `android/`.
- Persistencia: `@capacitor/preferences` (fallback `localStorage` en desarrollo web).
- Tests: Vitest + jsdom, en `test/`.
- `applicationId` Android: `com.cauquenlabs.pulsit`.

## Documentos de referencia (en orden de lectura recomendado)

1. `AGENTS.md` (raíz) — convenciones y comandos.
2. `PROJECT.md` (raíz) — estado, decisiones técnicas, próximos pasos.
3. `.project-corpus/state/STATUS.md` — último estado verificado y siguiente acción exacta.
4. `documentacion/` — contrato funcional detallado.
5. `test/README.md` — qué cubre la suite de tests.
