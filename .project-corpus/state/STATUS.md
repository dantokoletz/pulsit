# STATUS — estado verificado de Pulsit

Última actualización: 2026-10-20 (sesión 2: build Android + rediseño visual + háptica/accesibilidad/rejugabilidad)

## Estado verificado (confirmado en este entorno de desarrollo)

- `npm install` y `npm test` → 66/66 tests pasando (58 al inicio de la sesión + 8 nuevos del
  rediseño del tablero).
- `npx cap sync` corre sin errores.
- **Build Android verificado de punta a punta** (nuevo en esta sesión, con Android Studio ya
  instalado en la máquina):
  - `./gradlew assembleDebug` → `BUILD SUCCESSFUL`, genera
    `android/app/build/outputs/apk/debug/app-debug.apk`.
  - `./gradlew bundleRelease` → `BUILD SUCCESSFUL`, genera
    `android/app/build/outputs/bundle/release/app-release.aab` (sin firma de producción, ver
    bloqueador abajo).
  - El `.apk` de debug se instaló (`adb install`) y se ejecutó en el emulador
    `Medium_Phone_API_37.0`: pantalla de inicio (logo, título, botones) y modo campaña fase 1
    (3 botones de color) renderizan correctamente y responden al toque dentro del WebView nativo.
    Sin errores en `adb logcat`.
- Se rediseñaron los tonos de audio (`www/js/audio.js`) para que los botones suenen más
  distinguibles entre sí (terceras mayores en vez de escala pentatónica), a pedido del usuario tras
  probar el juego en el navegador.
- **Modo personalizado verificado en nativo**: se confirmó, leyendo directamente
  `/data/data/com.cauquenlabs.pulsit/shared_prefs/CapacitorStorage.xml` vía
  `adb shell run-as com.cauquenlabs.pulsit cat ...`, que la configuración personalizada persiste
  correctamente tras un `am force-stop` + relanzamiento completo de la app (no solo en el
  navegador). Es la forma más confiable de verificar persistencia nativa sin pelear con el timing
  de los taps simulados por `adb shell input tap` (el primer tap tras cada relanzamiento de la app
  suele perderse; conviene asumir eso y tolerar un reintento, o verificar vía el archivo de
  SharedPreferences directamente).
- **Rediseño visual del tablero y la pantalla de juego** (a pedido del usuario, verificado en
  navegador Y en el emulador Android con un rebuild completo):
  - Botones circulares agrupados en filas fijas por cantidad (`gameLogic.getRowLayout`).
  - Estímulo "ambos" combina color + número en cada botón (antes alternaba botones puros).
  - Número de fase luminoso, barra de progreso de la secuencia, y barra "Reiniciar nivel".
  - Fondo "futurista" estilo circuito, con los botones garantizados por encima (`z-index`
    explícito en `.screen`). El fondo activo final es `www/assets/background-circuit.webp` (foto
    de circuito real provista por el usuario, optimizada con `sharp` de 4.8MB a ~160KB);
    `background-circuit.svg` (generado por código) quedó como alternativa sin imagen externa.
- **Tres mejoras agregadas a pedido del usuario** ("¿se puede mejorar/ampliar?" → "agrega los
  tres"), verificadas en navegador y con rebuild + reinstalación completa en el emulador Android:
  - **Feedback háptico** (`www/js/haptics.js`, `@capacitor/haptics`): vibración en cada toque
    (distinta para acierto/error/éxito), ligada al flag `sound`. Verificado por logcat limpio (sin
    excepciones); no se puede confirmar por tacto real desde este entorno automatizado.
  - **Modo daltónico**: toggle global en pantalla de inicio, forma fija superpuesta en botones de
    color (9 formas distintas). Verificado visualmente en navegador y en el emulador.
  - **Mejor puntaje**: `Secuencia: X / N · Mejor: B` en la barra de estado, por fase de campaña y
    uno global para personalizado, nunca retrocede. Verificado jugando una ronda real.
- **Rotación de pantalla verificada y corregida**: al pedir confirmación el usuario sobre si la
  disposición cambia al rotar, se probó forzando landscape vía
  `adb shell settings put system user_rotation 1` en el emulador. La disposición SÍ se reacomoda
  (CSS responsive, sin orientación fija en el manifest), pero se detectó que con tableros de varias
  filas el contenido podía exceder el alto disponible sin forma de hacer scroll. Se corrigió
  agregando `overflow-y: auto` a `.screen`, confirmado con un `adb shell input swipe` real que
  reveló la barra "Reiniciar nivel" antes inalcanzable.

## Bloqueadores

- **`.aab` sin firma de producción**: `bundleRelease` no tiene un `signingConfig` de release
  configurado (a propósito, ver `PROJECT.md`). Falta que quien publique la app genere su propio
  keystore y firme el bundle, siguiendo `README.md`.
- No se cuenta con el logo definitivo de CauquenLabs (se usó un placeholder generado
  programáticamente).
- No se verificó el responsive en un tamaño de tablet (solo se probó en el emulador de teléfono
  `Medium_Phone_API_37.0`).
- El feedback háptico no se confirmó por tacto real (solo por ausencia de errores); falta
  verificación sensorial en un dispositivo físico.

## Detalle técnico relevante para el próximo agente

El entorno de build tiene **una sola JDK disponible**: la JBR empaquetada con Android Studio
(`C:\Program Files\Android\Android Studio\jbr`, JDK 25). El Gradle wrapper que trae el template de
Capacitor por defecto (8.14.3) **no puede ejecutarse sobre JDK 25**. Se resolvió fijando el wrapper
a **Gradle 9.5.1** en `android/gradle/wrapper/gradle-wrapper.properties` (la última versión 9.x que
sigue siendo compatible con AGP 8.x; Gradle 9.6+ rompe esa compatibilidad). Variables de entorno
usadas para buildear manualmente desde la terminal:

```bash
export JAVA_HOME="/c/Program Files/Android/Android Studio/jbr"
export ANDROID_HOME="/c/Users/Usuario/AppData/Local/Android/Sdk"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$PATH"
cd android && ./gradlew assembleDebug
```

`android/local.properties` (gitignorado) apunta `sdk.dir` al SDK local; se regenera
automáticamente si falta, o puede recrearse con una línea `sdk.dir=<ruta al SDK>`.

Emulador disponible: `Medium_Phone_API_37.0` (API 37). Listarlo con
`"$ANDROID_HOME/emulator/emulator.exe" -list-avds`.

## Última acción completada

Se verificó por primera vez el build Android real (debug APK + release AAB sin firmar) y se corrió
la app en un emulador. Luego, a pedido del usuario, en una secuencia de iteraciones: se mejoró el
diseño sonoro, se verificó la persistencia del modo personalizado a nivel de archivo nativo, se
aplicó un rediseño visual completo (tablero en filas fijas con botones redondos, estímulo "ambos"
combinado, número de fase luminoso, barra de progreso, barra de reinicio de nivel), se reemplazó el
fondo generado por código por una foto real de circuito optimizada, y finalmente se agregaron
háptica, modo daltónico y mejor puntaje, además de corregir un problema real de scroll descubierto
al verificar el comportamiento en rotación horizontal. Todo verificado tanto en navegador como en
builds reales reinstalados en el emulador Android. 90/90 tests pasando. Se actualizó `PROJECT.md`,
`AGENTS.md` y la documentación funcional con las decisiones tomadas.

## Siguiente acción exacta

1. Generar el keystore de firma de producción siguiendo `README.md` (sección "Publicar en Google
   Play Store") y configurar `signingConfigs.release` en `android/app/build.gradle` o usar el
   asistente de Android Studio (`Build > Generate Signed Bundle`).
2. Re-ejecutar `./gradlew bundleRelease` con la firma configurada y verificar que el `.aab`
   resultante esté correctamente firmado (`jarsigner -verify` o el propio Play Console al subirlo
   como build interno de prueba).
3. Verificar responsive en un emulador de tablet (ej. crear un AVD `Pixel Tablet` desde Android
   Studio) antes de dar por completo el ítem correspondiente de
   `documentacion/07-criterios-de-aceptacion.md`.
4. Cuando CauquenLabs provea el logo definitivo, reemplazar `www/assets/logo-cauquenlabs.png`,
   correr `npx cap sync`, y regenerar los íconos nativos con el Image Asset Studio.
5. Confirmar por tacto real (en un dispositivo físico, no solo el emulador) que el feedback háptico
   se siente bien calibrado (intensidad/duración de los patrones de acierto/error/éxito).
6. Etiquetar `v0.2.0` una vez firmado y subido el primer build de prueba a Play Console.
