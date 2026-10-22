# STATUS — estado verificado de Pulsit

Última actualización: 2026-10-22 (sesión 4: 28 fases, legibilidad, logo definitivo, voseo, capturas
nuevas y build 0.2.0 / versionCode 2 firmado, listo para subir a Play Console)

## ✅ Continuidad: qué pasa si se reinicia el equipo

Todo el trabajo está commiteado (`git log --oneline -3`). Nada depende de un proceso en memoria.

- **Keystore de producción**: `D:UsersdantoDocumentsProjectsPulsit-keystorepulsit-release.keystore`
  (alias `pulsit`, fuera del repo). Contraseña en `android/keystore.properties` (gitignorado).
  Sin ambos no se puede volver a firmar un `.aab` compatible — el usuario debe tener un backup.
- Archivos sin commitear a propósito en la raíz: `pcb_wallpaper_4k.png` (original del fondo, ya
  procesado a `www/assets/background-circuit.webp`), `Pulsit-debug.apk` y `Pulsit-release.aab`
  (gitignorados, regenerables). Ambos builds son la versión **0.2.0 (versionCode 2)**, con todos los cambios de la sesión 4.
- `sharp` y `puppeteer-core` no son dependencias del proyecto: `sharp` se instala con
  `npm install --no-save sharp` solo para regenerar el ícono o el feature graphic.

**Para retomar**: leer este archivo, `PROJECT.md` y `AGENTS.md`, y seguir "Siguiente acción exacta".

## Estado verificado (confirmado en este entorno de desarrollo)

- `npm install` y `npm test` → **98/98 tests pasando**.
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

- No se cuenta con el logo definitivo de CauquenLabs (se usó un placeholder geométrico), usado en
  la pantalla de inicio y en "Acerca de". **Esto NO bloquea el ícono nativo de la app** — es un
  diseño propio de Pulsit, independiente del logo de CauquenLabs.
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

**Keystore de release y firma automática**: `android/app/build.gradle` lee
`android/keystore.properties` (gitignorado) al evaluar el proyecto; si el archivo existe, arma
`signingConfigs.release` y lo aplica a `buildTypes.release` (variable `hasSigningConfig`). Si no
existe (clon nuevo del repo, otra máquina), el build no falla — simplemente no firma. El keystore
real vive en `D:\Users\danto\Documents\Projects\Pulsit-keystore\pulsit-release.keystore` (alias
`pulsit`, fuera del repo). Para regenerar `keystore.properties` en una máquina nueva que SÍ tenga
una copia del `.keystore` y la contraseña:

```properties
storeFile=<ruta absoluta al .keystore>
storePassword=<la contraseña>
keyAlias=pulsit
keyPassword=<la misma contraseña>
```

**Taps simulados por `adb shell input tap`**: el primer tap justo después de relanzar la app suele
perderse (parece un tema de foco/ventana, no un bug de la app). Conviene asumirlo y re-intentar el
tap, o verificar estado vía `adb shell run-as ... cat .../shared_prefs/...` en vez de depender de
una secuencia larga de taps encadenados. Importante también: las coordenadas de capturas de
pantalla en este flujo de trabajo vienen en una resolución "mostrada" distinta a la nativa del
dispositivo (factor ~1.2 en el teléfono de 1080×2400); conviene recalcular contra `adb shell wm
size` antes de tapear, no asumir que la imagen mostrada está 1:1.

## Última acción completada

**Sesión 2026-10-22** (a pedido del usuario):

1. **Progresión de campaña corregida** (`gameLogic.CAMPAIGN_PHASES`): ahora son 28 fases. Para
   cada cantidad de botones de 3 a 9 se repite el ciclo colores fijos → números fijos → colores
   que se mueven → números que se mueven. Reemplaza la tabla de 10 fases de `pulsit.md` §2.2.
   Tests y `documentacion/02-progresion-niveles.md` actualizados. Nota: un progreso guardado con
   la tabla vieja (fase N) ahora apunta a otra configuración; no importa porque la app no se
   publicó todavía.
2. **Barra de estado legible**: "Fase X / 28", el número de fase, "Secuencia: X / 10 · Mejor: B" y
   "Reiniciar nivel" van sobre un panel oscuro translúcido (antes se perdían en el fondo de
   circuito). Verificado con captura en Chrome headless (412×915).
3. **Logo definitivo de CauquenLabs** en `www/assets/logo-cauquenlabs.png` (texto negro y fondo
   transparente → se muestra sobre una placa clara). Se quitó la nota "provisorio" de "Acerca de".
4. **Material de la tienda** movido a `store-listing/` (fuera de `www/`, para no inflar el APK).
   El feature graphic se regeneró a 1024×500 RGB sin alfa (antes salía 5461×2667 con alfa, que Play
   rechazaría) y con el lema "Memorizá. Repetí. Superá cada fase.".
5. Textos de la app unificados en **voseo** a pedido del usuario (inicio: "Memorizá. Repetí. Superá
cada fase."; juego: "Observá la secuencia..."). Convención agregada a `AGENTS.md`.
6. Paneles translúcidos también en los formularios de Ajustes y Modo personalizado.
7. Capturas de la tienda rehechas (1080×2400, Chrome headless, script
   `store-listing/capture-screenshots.cjs`).
8. Versión subida a **0.2.0 / versionCode 2**; `Pulsit-debug.apk` y `Pulsit-release.aab`
   regenerados, `.aab` verificado con `jarsigner` y `aapt2 dump badging`. Tag `v0.2.0`.
9. `npm test` → 98/98; `npx cap sync` OK.

## Siguiente acción exacta

1. **Lo hace el usuario (el agente no tiene acceso a Play Console)**: crear la app en Play Console,
   subir `Pulsit-release.aab` a prueba interna, aceptar Play App Signing y cargar la ficha
   (`store-listing/feature-graphic.png`, `store-listing/screenshots/`, URL de la política de
   privacidad en GitHub Pages).
2. Hacer push de `master` y del tag `v0.2.0` a `origin` si el usuario lo confirma.
3. Probar `Pulsit-debug.apk` en el teléfono físico del usuario.
4. Recordarle al usuario que respalde el keystore y la contraseña fuera de esta máquina.
5. Para la próxima subida: incrementar `versionCode` en `android/app/build.gradle`.
