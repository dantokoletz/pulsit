# STATUS — estado verificado de Pulsit

Última actualización: 2026-10-20 (sesión 2, continuada: build Android + rediseño visual +
háptica/accesibilidad/rejugabilidad + pantalla de Ajustes + verificación en tablet)

## ✅ Continuidad: qué pasa si se reinicia el equipo

**Todo el código está commiteado.** `git log --oneline -1` debería mostrar
`659dd31 Documenta la pantalla de Ajustes, el sonido global y la tablet` (o uno posterior). Un
`git status --short` limpio (salvo lo listado abajo) confirma que no hay trabajo en progreso sin
guardar. Nada de lo importante depende de un proceso en memoria:

- Los emuladores Android (`Medium_Phone_API_37.0` y `Pulsit_Tablet`) están **apagados**; no hace
  falta nada especial para reiniciar el equipo, simplemente no van a estar corriendo al volver.
- `npm install` ya se corrió (hay `node_modules/`, no versionado); si se reinicia y se vuelve a
  clonar/mover el repo, correr `npm install` de nuevo alcanza para reconstruir todo.
- Quedan dos archivos **sin commitear a propósito** en la raíz del repo (`git status` los muestra
  como `??`):
  - `pcb_wallpaper_4k.png`: imagen original de 4K/4.8MB que el usuario puso en la raíz; ya está
    procesada y en uso como `www/assets/background-circuit.webp`. No se tocó por no ser un archivo
    que yo haya creado (ver próximo paso si se quiere limpiar).
  - `Pulsit-debug.apk`: copia de conveniencia del build de debug más reciente, para instalar en un
    teléfono físico. Está en `.gitignore` (`*.apk`/`*.aab`) porque es un artefacto regenerable, no
    código fuente — se recrea con `./gradlew assembleDebug` (ver `README.md`).

**Para retomar el trabajo en una sesión nueva**: leer este archivo, `PROJECT.md` y `AGENTS.md`, y
seguir la sección "Siguiente acción exacta" más abajo.

## Estado verificado (confirmado en este entorno de desarrollo)

- `npm install` y `npm test` → **93/93 tests pasando**.
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
- No se cuenta con el logo definitivo de CauquenLabs (se usó un placeholder geométrico). El usuario
  pidió explícitamente **dejar el ícono de la app pendiente hasta tener el logo real** — no
  retomarlo antes de que lo provea.
- El feedback háptico no se confirmó por tacto real (solo por ausencia de errores en logcat/tests);
  falta verificación sensorial en un dispositivo físico — justo lo que el `Pulsit-debug.apk`
  generado en esta sesión permite hacer.
- Todo lo verificado hasta ahora es en emuladores; falta un dispositivo físico real para la
  confirmación final (audio, háptica, rendimiento real, tamaño de pantalla real).

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

Se agregó una pantalla de Ajustes que consolida sonido/vibración y modo daltónico como
preferencias globales (antes el sonido era parte de la config de modo personalizado y el modo
campaña no tenía forma de silenciarse). Se verificó el responsive en un emulador de tablet creado
para la ocasión. Se generó `Pulsit-debug.apk` en la raíz del repo para que el usuario lo instale en
un teléfono físico. Todo commiteado; 93/93 tests pasando.

## Siguiente acción exacta

1. **(Pedido explícito pendiente)** El usuario va a instalar `Pulsit-debug.apk` en un teléfono
   físico — si continúa la sesión, preguntar cómo salió (especialmente el feedback háptico, que no
   se pudo verificar por tacto desde este entorno) y ayudar a resolver cualquier problema que
   aparezca ahí que no se haya visto en el emulador.
2. Generar el keystore de firma de producción siguiendo `README.md` (sección "Publicar en Google
   Play Store") — el usuario mencionó que lo haría él mismo "mañana" en una sesión anterior.
3. Re-ejecutar `./gradlew bundleRelease` con la firma configurada y verificar que el `.aab`
   resultante esté correctamente firmado, subiéndolo a Play Console como build interno de prueba.
4. Cuando CauquenLabs provea el logo definitivo (no antes, fue pedido explícito del usuario):
   reemplazar `www/assets/logo-cauquenlabs.png`, correr `npx cap sync`, regenerar los íconos
   nativos con el Image Asset Studio, y recién ahí retomar el ícono de la app.
5. Etiquetar `v0.2.0` una vez firmado y subido el primer build de prueba a Play Console.
