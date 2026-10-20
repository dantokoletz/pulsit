# AGENTS.md — Instrucciones para agentes de IA

> **Prompt de carga rápida para un nuevo agente:**
> *"Lee AGENTS.md, PROJECT.md y .project-corpus/state/STATUS.md. Luego continúa desde la
> siguiente acción exacta indicada en STATUS.md."*

## 1. Qué es este proyecto

**Pulsit** es un juego de memoria tipo "Simón" para Android, propiedad de **CauquenLabs**. La
especificación funcional completa original está en `pulsit.md` (raíz del repo); la documentación
funcional viva y más legible está en `documentacion/`.

## 2. Stack técnico

- **Lógica del juego**: HTML5 + CSS3 + JavaScript vanilla (ES Modules), en `www/`.
- **Audio**: Web Audio API pura (osciladores programáticos), sin archivos de audio externos.
- **Empaquetado nativo**: **Capacitor** (`android/` es un proyecto Android real generado por
  `npx cap add android`, abrible directamente en Android Studio).
- **Persistencia**: `@capacitor/preferences` (fallback a `localStorage` en desarrollo web).
- **Tests**: Vitest + jsdom (`test/`).

No hay bundler/transpilador: los módulos de `www/js/` son ES Modules nativos del navegador,
cargados vía `<script type="module" src="js/app.js">` en `www/index.html`. Esto simplifica el
proyecto a costa de no poder usar sintaxis que el navegador/WebView objetivo no soporte
nativamente (evitar JSX, TypeScript sin compilar, etc.).

## 3. Estructura de carpetas

```
pulsit/
├── AGENTS.md                # este archivo
├── PROJECT.md                # estado vivo del proyecto
├── README.md                 # cómo correr, buildear y publicar
├── pulsit.md                  # especificación funcional original (no editar)
├── package.json
├── capacitor.config.json
├── vitest.config.js
├── www/                       # código fuente del juego (ESTO es lo que se edita)
│   ├── index.html
│   ├── css/styles.css
│   ├── js/
│   │   ├── app.js             # navegación entre pantallas, wiring de eventos
│   │   ├── gameLogic.js       # reglas puras del juego (sin DOM) — testear acá primero
│   │   ├── game.js            # GameController: orquesta gameLogic + audio + render DOM
│   │   ├── audio.js           # Web Audio API (tonos, crescendo de bienvenida)
│   │   ├── storage.js         # persistencia (Preferences / localStorage)
│   │   └── custom.js          # formulario de modo personalizado
│   └── assets/
│       └── logo-cauquenlabs.png   # PLACEHOLDER — reemplazar por el logo real de CauquenLabs
├── android/                   # proyecto Android generado por Capacitor
│   └── ...                    # NO MODIFICAR A MANO salvo config nativa justificada (ver §5)
├── documentacion/             # documentación FUNCIONAL (qué hace la app, para humanos y agentes)
├── test/                      # tests unitarios e integración (Vitest)
└── .project-corpus/           # estado de continuidad entre sesiones de agentes de IA
    ├── state/
    │   ├── PROJECT.md
    │   └── STATUS.md
    └── reports/
```

## 4. Convenciones de código

- **Idioma**: comentarios y documentación en español; nombres de variables/funciones en inglés
  (convención estándar de JS). Mensajes de UI visibles al jugador, en español.
- **Nombres de archivo**: `camelCase.js` para módulos JS, `kebab-case.md` para documentación.
- **Módulos**: `gameLogic.js` debe permanecer libre de referencias a `document`/`window`/Web Audio;
  toda regla de negocio nueva va ahí primero, testeada unitariamente, y luego se conecta desde
  `game.js`/`app.js`.
- **Commits**: mensajes descriptivos en español, en imperativo (`Agrega...`, `Corrige...`,
  `Refactoriza...`). Un commit = un cambio lógico atómico. Si el commit cambia el estado del
  proyecto de forma significativa, actualizar `PROJECT.md` en el mismo commit.
- **Versionado**: etiquetar versiones estables con `git tag vX.Y.Z`.

## 5. Cómo ejecutar el proyecto en desarrollo

```bash
npm install          # instala dependencias (una sola vez, o tras cambiar package.json)
npm run dev          # sirve www/ en http://localhost:8080 (http-server)
```

Abrir `http://localhost:8080` en un navegador de escritorio o móvil para probar el juego sin
necesidad de compilar para Android. El audio requiere una primera interacción (click/tap) del
usuario por las políticas de autoplay del navegador — esto es esperado, no un bug.

## 6. Cómo sincronizar y abrir en Android Studio

Tras cualquier cambio en `www/`:

```bash
npx cap sync          # copia www/ a android/app/src/main/assets/public y sincroniza plugins
npx cap open android  # abre el proyecto en Android Studio (requiere tenerlo instalado)
```

`npm run cap:sync` y `npm run cap:open:android` son atajos equivalentes definidos en
`package.json`.

**Advertencia importante:** no modifiques archivos dentro de `android/` manualmente, salvo que se
trate de configuración nativa justificada y documentada (por ejemplo: permisos en
`AndroidManifest.xml`, ícono de la app, configuración de firma para release). Cualquier cambio de
**lógica del juego** va siempre en `www/`, nunca directamente en
`android/app/src/main/assets/public/` (esos archivos se sobrescriben en cada `cap sync`).

## 7. Tests

```bash
npm test                 # toda la suite (unit + integration)
npm run test:watch       # modo watch
npm run test:unit        # solo test/unit
npm run test:integration # solo test/integration
```

Ver `test/README.md` para el detalle de qué cubre cada archivo de test. Regla general: toda nueva
regla de negocio en `gameLogic.js` debe llevar su test unitario; todo flujo nuevo entre pantallas
o módulos debe llevar (o extender) un test de integración.

## 8. Documentación funcional

`documentacion/` describe el comportamiento esperado de la app para cualquier lector (humano o
agente) sin necesidad de leer el código. Si cambias una regla de negocio (progresión de fases,
validación del modo personalizado, reglas de audio o persistencia), **actualiza también el
documento correspondiente en `documentacion/`** en el mismo commit.

## 9. Publicación en Google Play

Ver la sección "Publicar en Google Play Store" de `README.md` para el proceso completo de generar
el keystore, configurar la firma en Android Studio y generar el `.aab`.
