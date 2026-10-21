# STATUS — estado verificado de Pulsit

Última actualización: 2026-10-21 (sesión 3, continuada: fix de verdad del bug de rotación
horizontal + "Acerca de" + ícono nuevo — commiteado — y luego keystore de release + bundle
firmado — ver "Última acción completada")

## ✅ Continuidad: qué pasa si se reinicia el equipo

`git log --oneline -1` debería mostrar `562644a Corrige el bug de rotación horizontal, agrega
"Acerca de" y rediseña el ícono` (o uno posterior) **si ya se commiteó el trabajo de firma de esta
sesión** — ver "Siguiente acción exacta" antes de asumir que ESO está commiteado: la config de
Gradle para firmar (`android/app/build.gradle`) todavía no lo está al momento de escribir esto. Un
`git status --short` muestra el detalle de qué falta guardar. Nada de lo importante depende de un
proceso en memoria:

- **El keystore de firma de producción YA EXISTE**: `pulsit-release.keystore` (alias `pulsit`),
  guardado en `D:\Users\danto\Documents\Projects\Pulsit-keystore\` — **fuera del repo por
  completo**, no solo gitignorado. La contraseña (storePassword = keyPassword) la eligió el
  usuario en el chat; queda en `android/keystore.properties` (gitignorado) y en la memoria del
  usuario, nunca en un archivo versionado. **Sin esta carpeta y esta contraseña, no se puede volver
  a generar un `.aab` firmado compatible con el mismo keystore** — recomendarle al usuario que haga
  un backup externo (gestor de contraseñas, backup cifrado) si todavía no lo hizo.

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
    código fuente — se recrea con `./gradlew assembleDebug` (ver `README.md`). Actualizado con el
    ícono nuevo, "Acerca de" y el fix de rotación.
  - `Pulsit-release.aab`: **bundle de release firmado**, recién generado (`./gradlew
    bundleRelease`), verificado con `jarsigner -verify` → "jar verified". Listo para subir a Play
    Console. También en `.gitignore`, se recrea con el keystore + `keystore.properties` (ver
    "Detalle técnico").

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

**Sesión 2026-10-21, dos bloques de trabajo:**

**Bloque 1 (ya commiteado, `562644a`)** — fix de verdad del bug de rotación horizontal, pantalla
"Acerca de" nueva, ícono nativo de la app rediseñado. Ver el mensaje del commit para el detalle;
resumen: `#app` pasó de `min-height` a `height: 100dvh` y `.screen` sumó `min-height: 0` (el fix
anterior, solo `overflow-y: auto`, no alcanzaba porque un flex item no se encoge por defecto); se
agregó `screen-about` con Empresa/Desarrollador/descripción/logo de CauquenLabs; se reemplazó el
ícono default de plantilla de Capacitor por un diseño propio (anillo de 4 colores de
`COLOR_PALETTE` alrededor de un punto brillante), generado por SVG + `sharp` como adaptive icon
completo. Todo verificado en emulador Android real.

**Bloque 2 (sin commitear todavía)** — a pedido explícito del usuario ("¿Tu puedes crear el bundle
firmado?" → "Por favor"): se generó el keystore de release y se firmó el primer `.aab`:

1. Se intentó generar las contraseñas del keystore automáticamente (`openssl rand`), pero el
   entorno lo bloqueó (clasificador de "Credential Materialization" en el permiso de Bash) — correcto:
   un secreto de firma de producción no debe materializarlo el agente por su cuenta. Se le preguntó
   al usuario y eligió la contraseña él mismo en el chat (misma contraseña para store y key).
2. Se generó `pulsit-release.keystore` (alias `pulsit`, RSA 2048, validez 10.000 días) con
   `keytool`, guardado **fuera del repo** en `D:\Users\danto\Documents\Projects\Pulsit-keystore\`.
3. Se creó `android/keystore.properties` (gitignorado) con la ruta y la contraseña, y se agregó
   `signingConfigs.release` a `android/app/build.gradle`, aplicado condicionalmente a
   `buildTypes.release` solo si ese archivo existe (no rompe el build en otra máquina sin el
   keystore).
4. `./gradlew bundleRelease` generó `app-release.aab` firmado; se verificó con `jarsigner -verify`
   → "jar verified" (las advertencias de cert self-signed/sin CA/sin timestamp son normales y
   esperadas para firma de apps Android, no un problema). Copiado a `Pulsit-release.aab` en la raíz
   del repo (no versionado, mismo patrón que `Pulsit-debug.apk`).
5. Se actualizó `README.md` (sección "Publicar en Google Play Store", ahora describe el estado
   real en vez de instrucciones genéricas) y `PROJECT.md`.

**Nada de esto se subió a Play Console todavía** — eso sigue siendo responsabilidad manual del
usuario (crear la app, subir el `.aab`, aceptar Play App Signing).

## Siguiente acción exacta

1. **Preguntar al usuario si commitear el bloque 2** (keystore/firma): `android/app/build.gradle`
   (agrega `signingConfigs`), `README.md`, `PROJECT.md`. **Nunca** agregar
   `android/keystore.properties` ni `Pulsit-release.aab` — ya están gitignorados, pero confirmar
   con `git status` antes de cualquier `git add` amplio que no se hayan colado.
2. **Recordarle al usuario que respalde el keystore y la contraseña** fuera de esta máquina (gestor
   de contraseñas, backup cifrado) — es la pieza más crítica e irrecuperable de todo este trabajo.
3. Instalar `Pulsit-debug.apk` en el teléfono físico del usuario y confirmar que el fix de
   rotación, "Acerca de" y el ícono nuevo se ven bien ahí también (no probado aún fuera de
   emulador/navegador).
4. Crear la app en Play Console, subir `Pulsit-release.aab` (ya firmado, en la raíz del repo) como
   build interno de prueba, y aceptar Play App Signing.
5. Cuando CauquenLabs provea el logo definitivo: reemplazar `www/assets/logo-cauquenlabs.png`
   (usado en inicio y "Acerca de"), correr `npx cap sync`, y quitar la nota "provisorio, en diseño"
   de `www/index.html` (`#screen-about`). El ícono de la app NO necesita tocarse (ya no depende del
   logo de CauquenLabs).
6. Etiquetar `v0.2.0` una vez subido el primer build de prueba a Play Console.
