# STATUS — estado verificado de Pulsit

Última actualización: 2026-10-20 (sesión 2: verificación de build Android)

## Estado verificado (confirmado en este entorno de desarrollo)

- `npm install` y `npm test` → 58/58 tests pasando.
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

## Bloqueadores

- **`.aab` sin firma de producción**: `bundleRelease` no tiene un `signingConfig` de release
  configurado (a propósito, ver `PROJECT.md`). Falta que quien publique la app genere su propio
  keystore y firme el bundle, siguiendo `README.md`.
- No se cuenta con el logo definitivo de CauquenLabs (se usó un placeholder generado
  programáticamente).
- No se verificó el responsive en un tamaño de tablet (solo se probó en el emulador de teléfono
  `Medium_Phone_API_37.0`).

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

Se verificó por primera vez el build Android real (debug APK + release AAB sin firmar), se corrió
la app en un emulador confirmando que funciona correctamente de punta a punta, y se mejoró el
diseño sonoro de los botones a pedido del usuario. Se actualizó `PROJECT.md` con las decisiones
técnicas del ajuste de versión de Gradle.

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
5. Etiquetar `v0.2.0` una vez firmado y subido el primer build de prueba a Play Console.
