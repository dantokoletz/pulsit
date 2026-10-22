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

**Importante al agregar un nuevo plugin de Capacitor** (como `@capacitor/preferences` o
`@capacitor/haptics`): al no haber bundler, **no se puede** `import` el paquete npm como módulo ES
en `www/js/` (el navegador no resuelve specifiers como `@capacitor/haptics`). El patrón que ya usan
`storage.js` y `haptics.js` es acceder al plugin en runtime vía
`window.Capacitor?.Plugins?.<NombrePlugin>` (disponible solo dentro de la app empaquetada), con un
fallback para desarrollo web (`localStorage`, `navigator.vibrate`, etc.). El paquete npm sigue
siendo necesario como dependencia (`npm install @capacitor/...` + `npx cap sync`) para que el
plugin nativo se registre en el proyecto Android, aunque el JS de `www/` nunca lo importe
directamente.

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
│   │   ├── haptics.js         # feedback háptico (Haptics / navigator.vibrate)
│   │   ├── storage.js         # persistencia (Preferences / localStorage)
│   │   └── custom.js          # formulario de modo personalizado
│   └── assets/
│       ├── logo-cauquenlabs.png    # logo definitivo de CauquenLabs (fondo transparente)
│       ├── background-circuit.webp # fondo ACTIVO de las 3 pantallas — reemplazable (ver abajo)
│       ├── background-circuit.svg  # alternativa vectorial generada por código (no referenciada)
│       ├── icon-pulsit-source.svg  # fuente del ícono nativo de la app (ver README.md)
│       └── icon-pulsit-preview.png # vista previa 512×512 del ícono, no usada por la app
├── android/                   # proyecto Android generado por Capacitor
│   └── ...                    # NO MODIFICAR A MANO salvo config nativa justificada (ver §5)
├── store-listing/             # material de la ficha de Play Store (NO va en el APK, fuera de www/)
├── documentacion/             # documentación FUNCIONAL (qué hace la app, para humanos y agentes)
├── test/                      # tests unitarios e integración (Vitest)
└── .project-corpus/           # estado de continuidad entre sesiones de agentes de IA
    ├── state/
    │   ├── PROJECT.md
    │   └── STATUS.md
    └── reports/
```

**Ícono nativo de la app** (`android/app/src/main/res/mipmap-*/ic_launcher*.png`): es un diseño
propio de Pulsit (no depende del logo de CauquenLabs), con fuente vectorial versionada en
`www/assets/icon-pulsit-source.svg`. Ver la sección "Ícono de la app" de `README.md` para cómo
regenerarlo si se modifica.

**Assets reemplazables**: `www/assets/logo-cauquenlabs.png` (logo definitivo de CauquenLabs,
usado en la pantalla de inicio y en "Acerca de" — distinto del ícono de la app) y
`www/assets/background-circuit.webp` (fondo activo de las 3 pantallas, foto de circuito impreso)
están pensados para sobrescribirse sin tocar código: el CSS los referencia por nombre de archivo
(`www/css/styles.css` → `.cosmic-bg`), así que basta con reemplazar el archivo (manteniendo el
nombre, o actualizando la referencia si cambia) y correr `npx cap sync`. `background-circuit.svg`
es una alternativa 100% vectorial generada por código (no depende de ninguna imagen externa); para
usarla en vez del `.webp`, cambiar el `background-image` de `.cosmic-bg` en `styles.css`.

Si se reemplaza el fondo por otra foto/imagen de alta resolución, conviene optimizarla antes
(reducir a ~1600px de ancho y convertir a WebP) para no inflar el tamaño del APK/bundle; se puede
hacer con el paquete `sharp` (`npm install --no-save sharp`, no es una dependencia permanente del
proyecto):

```js
require('sharp')('mi-imagen.png')
  .resize(1600, 900, { fit: 'cover' })
  .webp({ quality: 78 })
  .toFile('www/assets/background-circuit.webp');
```

## 4. Convenciones de código

- **Idioma**: comentarios y documentación en español; nombres de variables/funciones en inglés
  (convención estándar de JS). Mensajes de UI visibles al jugador, en español rioplatense con **voseo** (`Memorizá`, `Observá`,
  `Superá`), nunca tuteo — aplica también a la ficha de Play Store (`store-listing/`).
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

### Compilar desde la línea de comandos (sin abrir la UI de Android Studio)

```bash
cd android
export JAVA_HOME="/c/Program Files/Android/Android Studio/jbr"   # o tu JDK 17/21
export ANDROID_HOME="$HOME/AppData/Local/Android/Sdk"            # ajustar a tu instalación
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$PATH"
./gradlew assembleDebug     # genera app/build/outputs/apk/debug/app-debug.apk
./gradlew bundleRelease     # genera app/build/outputs/bundle/release/app-release.aab (sin firmar)
```

El Gradle wrapper está fijado a la **versión 9.5.1** (no la última disponible): si la única JDK a
mano en la máquina es la JBR que trae Android Studio (frecuentemente muy reciente), Gradle
8.14.3 puede fallar con `Unsupported class file major version ...`, y las versiones 9.6+ rompen la
compatibilidad con AGP 8.x. 9.5.1 es la última serie 9.x todavía compatible con AGP 8.x — ver
`PROJECT.md` ("Decisiones técnicas") antes de cambiar esta versión.

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
