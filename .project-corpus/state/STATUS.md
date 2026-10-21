# STATUS — estado verificado de Pulsit

Última actualización: 2026-10-21 (sesión 3: fix de verdad del bug de rotación horizontal, pantalla
"Acerca de" nueva, ícono nativo de la app rediseñado — ver "Última acción completada")

## ✅ Continuidad: qué pasa si se reinicia el equipo

`git log --oneline -1` debería mostrar `2b2be6a Agrega halo en el botón activo y velocidad de
secuencia configurable` (o uno posterior) **si ya se commiteó el trabajo de la sesión actual** —
ver "Siguiente acción exacta" antes de asumir que está commiteado: al momento de escribir esto
todavía NO lo está (ver abajo). Un `git status --short` muestra el detalle de qué falta guardar.
Nada de lo importante depende de un proceso en memoria:

- Los emuladores Android (`Medium_Phone_API_37.0` y `Pulsit_Tablet`) están **apagados**; no hace
  falta nada especial para reiniciar el equipo, simplemente no van a estar corriendo al volver.
- `npm install` ya se corrió (hay `node_modules/`, no versionado); si se reinicia y se vuelve a
  clonar/mover el repo, correr `npm install` de nuevo alcanza para reconstruir todo. **Nota**: en
  esta sesión se instaló `sharp` temporalmente con `npm install --no-save sharp` para generar el
  ícono nuevo (ver más abajo); no quedó en `package.json`/`package-lock.json`, así que un `npm
  install` limpio no lo trae — solo hace falta si se vuelve a regenerar el ícono.
- Quedan archivos **sin commitear a propósito** en la raíz del repo (`git status` los muestra como
  `??`):
  - `pcb_wallpaper_4k.png`: imagen original de 4K/4.8MB que el usuario puso en la raíz; ya está
    procesada y en uso como `www/assets/background-circuit.webp`. No se tocó por no ser un archivo
    que yo haya creado (ver próximo paso si se quiere limpiar).
  - `Pulsit-debug.apk`: copia de conveniencia del build de debug más reciente, para instalar en un
    teléfono físico. Está en `.gitignore` (`*.apk`/`*.aab`) porque es un artefacto regenerable, no
    código fuente — se recrea con `./gradlew assembleDebug` (ver `README.md`). **Ya está
    actualizado** con el ícono nuevo, "Acerca de" y el fix de rotación de esta sesión.

**Para retomar el trabajo en una sesión nueva**: leer este archivo, `PROJECT.md` y `AGENTS.md`, y
seguir la sección "Siguiente acción exacta" más abajo.

## Estado verificado (confirmado en este entorno de desarrollo)

- `npm install` y `npm test` → **97/97 tests pasando**.
- `npx cap sync` corre sin errores (plugins detectados: `@capacitor/haptics@8.0.2`,
  `@capacitor/preferences@8.0.1`).
- **Build Android verificado de punta a punta**: `./gradlew assembleDebug` y `./gradlew
  bundleRelease` compilan exitosamente (ver "Detalle técnico" sobre el ajuste de versión de
  Gradle). El `.apk` de debug se instaló y corrió correctamente en:
  - Emulador de teléfono `Medium_Phone_API_37.0` (1080×2400).
  - Emulador de tablet `Pulsit_Tablet`, creado a mano para esta verificación (perfil "10.1in
    WXGA", 800×1280 @ 160dpi) — ver "Detalle técnico" para cómo recrearlo si no existe.
  - En ambos, sin errores en `adb logcat`, contenido centrado y bien proporcionado.
- **Modo personalizado y persistencia verificados a nivel de archivo nativo**: se confirmó leyendo
  directamente `/data/data/com.cauquenlabs.pulsit/shared_prefs/CapacitorStorage.xml` que la
  configuración sobrevive a un `am force-stop` + relanzamiento completo.
- **Rediseño visual completo**, verificado en navegador y en builds reales reinstalados en
  emulador:
  - Audio: tonos de botón más distinguibles (terceras mayores en vez de escala pentatónica).
  - Tablero: botones circulares en filas fijas por cantidad (`gameLogic.getRowLayout`); estímulo
    "ambos" combina color + número en cada botón.
  - Pantalla de juego: número de fase luminoso, barra de progreso, barra "Reiniciar nivel".
  - Fondo: foto real de circuito (`www/assets/background-circuit.webp`, optimizada con `sharp` de
    4.8MB a ~160KB), con pulso de resplandor en CSS y `z-index` explícito en `.screen`.
  - Rotación: la disposición SÍ se reacomoda al rotar (CSS responsive); se corrigió un bug real
    donde el contenido podía quedar inalcanzable en horizontal (`overflow-y: auto` en `.screen`).
  - Feedback háptico (`www/js/haptics.js`), modo daltónico (formas sobre botones de color), y
    mejor puntaje (`Secuencia: X / N · Mejor: B`), con sus respectivos tests.
  - **Pantalla de Ajustes** (`screen-settings`) nueva: consolida sonido+vibración y modo daltónico
    como preferencias globales (antes el sonido era por partida personalizada y ni existía forma de
    silenciar el modo campaña).
- `Pulsit-debug.apk` generado y copiado a la raíz del repo para que el usuario lo instale en un
  teléfono físico (pedido explícito, ver "Siguiente acción exacta").

## Bloqueadores

- **`.aab` sin firma de producción**: `bundleRelease` no tiene un `signingConfig` de release
  configurado (a propósito, ver `PROJECT.md`). Falta que quien publique la app genere su propio
  keystore y firme el bundle, siguiendo `README.md`. El usuario indicó que lo haría él mismo.
- No se cuenta con el logo definitivo de CauquenLabs (se usó un placeholder geométrico), usado en
  la pantalla de inicio y en "Acerca de". **Esto ya NO bloquea el ícono nativo de la app** — desde
  esta sesión el ícono es un diseño propio de Pulsit, independiente del logo de CauquenLabs (ver
  "Última acción completada").
- El feedback háptico no se confirmó por tacto real (solo por ausencia de errores en logcat/tests);
  falta verificación sensorial en un dispositivo físico.
- Todo lo verificado hasta ahora es en emuladores y en el navegador de escritorio; falta un
  dispositivo físico real para la confirmación final (audio, háptica, rendimiento real, tamaño de
  pantalla real, y específicamente el fix de rotación horizontal de esta sesión).

## Detalle técnico relevante para el próximo agente

**JDK/Gradle**: el entorno de build tiene una sola JDK disponible: la JBR empaquetada con Android
Studio (`C:\Program Files\Android\Android Studio\jbr`, JDK 25). El Gradle wrapper del template de
Capacitor (8.14.3) no puede ejecutarse sobre JDK 25; se fijó **Gradle 9.5.1** en
`android/gradle/wrapper/gradle-wrapper.properties` (última 9.x compatible con AGP 8.x). Variables
de entorno para buildear manualmente desde la terminal:

```bash
export JAVA_HOME="/c/Program Files/Android/Android Studio/jbr"
export ANDROID_HOME="/c/Users/Usuario/AppData/Local/Android/Sdk"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$PATH"
cd android && ./gradlew assembleDebug
```

`android/local.properties` (gitignorado) apunta `sdk.dir` al SDK local; se regenera
automáticamente si falta, o se recrea con una línea `sdk.dir=<ruta al SDK>`.

**Emuladores disponibles** (listar con `"$ANDROID_HOME/emulator/emulator.exe" -list-avds`):
- `Medium_Phone_API_37.0` (teléfono, 1080×2400).
- `Pulsit_Tablet` (tablet, 800×1280 @ 160dpi). **No fue creado con `avdmanager`** (no está
  instalado en esta máquina, solo el SDK embebido de Android Studio): se armó a mano un
  `~/.android/avd/Pulsit_Tablet.avd/config.ini` clonando el del teléfono y cambiando
  `hw.lcd.width/height/density` y `skin.name/path` al perfil clásico "10.1in WXGA". Si este AVD no
  existiera (por ejemplo, en otra máquina), se puede recrear así o crear cualquier otro perfil de
  tablet desde el AVD Manager de Android Studio.

**Taps simulados por `adb shell input tap`**: el primer tap justo después de relanzar la app suele
perderse (parece un tema de foco/ventana, no un bug de la app). Conviene asumirlo y re-intentar el
tap, o verificar estado vía `adb shell run-as ... cat .../shared_prefs/...` en vez de depender de
una secuencia larga de taps encadenados. Importante también: las coordenadas de capturas de
pantalla en este flujo de trabajo vienen en una resolución "mostrada" distinta a la nativa del
dispositivo (factor ~1.2 en el teléfono de 1080×2400); conviene recalcular contra `adb shell wm
size` antes de tapear, no asumir que la imagen mostrada está 1:1.

## Última acción completada

**Sesión 2026-10-21 (continuación), a pedido del usuario** — tres cambios, todos verificados en
emulador Android real además de navegador (código sin commitear todavía, ver "Siguiente acción
exacta"):

1. **Fix de verdad del bug de rotación horizontal**: el usuario reportó que, en horizontal, "la
   pantalla queda fuera del celular, puedo moverla" — el fix de la sesión anterior
   (`overflow-y: auto` en `.screen`) resultó insuficiente. Causa raíz: `#app` usaba `min-height`
   (sin tope) y `.screen` no podía encogerse (`min-height: auto` por defecto en flex), así que el
   scroll interno nunca se activaba y era la PÁGINA ENTERA la que crecía más allá de la ventana y
   quedaba pannable. Fix real: `#app` pasa a `height: 100dvh` + `.screen` suma `min-height: 0`
   (`www/css/styles.css`), más `overflow: hidden` en `html`/`body` como respaldo. También se agregó
   una media query de `orientation: landscape` para achicar elementos decorativos en poca altura.
   **Verificado en emulador real** con un tablero de 9 botones en horizontal: el contenido extra
   ahora scrollea correctamente adentro de la pantalla en vez de desplazar toda la página.
2. **Pantalla "Acerca de" nueva** (`screen-about`): descripción del juego, Empresa (CauquenLabs),
   Desarrollador (Daniel Antokoletz), y el logo de CauquenLabs (mismo placeholder que la pantalla
   de inicio) con nota de que está en diseño. Accesible desde un botón nuevo en el menú de inicio.
3. **Ícono nativo de la app rediseñado**: el ícono anterior era literalmente la plantilla default
   de Capacitor/Android Studio (nunca se había personalizado, sin relación con CauquenLabs). Se
   reemplazó por un diseño propio generado por código (SVG + `sharp`): un anillo de 4 colores — los
   mismos de `COLOR_PALETTE` en `game.js` — alrededor de un punto brillante, sobre fondo oscuro con
   resplandor. Adaptive icon completo (foreground + background + legacy + round, 5 densidades),
   fuente versionada en `www/assets/icon-pulsit-source.svg`. **No depende del logo de CauquenLabs**
   (que sigue pendiente, sin cambios ahí). Verificado en el launcher del emulador — se ve bien
   incluso en el tamaño más chico (48dp).

Verificado: 97/97 tests pasando (sin cambios de este bloque, ya estaban en 97 desde la sesión
anterior), `npx cap sync` + `./gradlew assembleDebug` sin errores, instalado y probado en el
emulador `Medium_Phone_API_37.0` (ícono en el launcher, pantalla "Acerca de", y el tablero de 9
botones en horizontal con scroll funcionando). `Pulsit-debug.apk` en la raíz del repo ya está
actualizado con estos tres cambios.

## Siguiente acción exacta

1. **Preguntar al usuario si commitear los cambios de esta sesión** (no se hizo todavía — no fue
   pedido explícitamente, a diferencia de la sesión anterior). Archivos modificados/nuevos:
   `AGENTS.md`, `README.md`, `documentacion/04-pantallas-y-flujo.md`,
   `documentacion/08-accesibilidad-y-rejugabilidad.md`, `www/css/styles.css`, `www/index.html`,
   `www/js/app.js`, `www/assets/icon-pulsit-source.svg` (nuevo), `www/assets/icon-pulsit-preview.png`
   (nuevo), y en `android/app/src/main/res/`: los XML de `mipmap-anydpi-v26/`, los PNG de las 5
   densidades `mipmap-*/` (incluye `ic_launcher_background.png` nuevo en cada una), y la
   eliminación de `drawable/ic_launcher_background.xml`, `drawable-v24/ic_launcher_foreground.xml`
   y `values/ic_launcher_background.xml` (quedaron sin uso).
2. Instalar el `Pulsit-debug.apk` recién regenerado en el teléfono físico del usuario y confirmar
   que el fix de rotación, "Acerca de" y el ícono nuevo se ven bien ahí también.
3. Generar el keystore de firma de producción siguiendo `README.md` (sección "Publicar en Google
   Play Store") — el usuario mencionó que lo haría él mismo.
4. Re-ejecutar `./gradlew bundleRelease` con la firma configurada y verificar que el `.aab`
   resultante esté correctamente firmado, subiéndolo a Play Console como build interno de prueba.
5. Cuando CauquenLabs provea el logo definitivo: reemplazar `www/assets/logo-cauquenlabs.png`
   (usado en inicio y "Acerca de"), correr `npx cap sync`, y quitar la nota "provisorio, en diseño"
   de `www/index.html` (`#screen-about`). El ícono de la app NO necesita tocarse en este paso (ya
   no depende del logo de CauquenLabs).
6. Etiquetar `v0.2.0` una vez firmado y subido el primer build de prueba a Play Console.
