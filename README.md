# Pulsit

Juego de memoria y concentración tipo "Simón", de **CauquenLabs**, para Android.

> Especificación funcional completa en [`pulsit.md`](pulsit.md) y
> [`documentacion/`](documentacion/README.md). Estado técnico y decisiones en
> [`PROJECT.md`](PROJECT.md). Guía para agentes de IA en [`AGENTS.md`](AGENTS.md).

## Requisitos

- [Node.js](https://nodejs.org/) 18+ y npm.
- Para compilar/publicar la app Android: [Android Studio](https://developer.android.com/studio)
  (incluye el SDK de Android) y JDK 17+.

## Instalación

```bash
npm install
```

## Desarrollo (en el navegador, sin Android)

```bash
npm run dev
```

Abre `http://localhost:8080` en el navegador. Es la forma más rápida de iterar sobre la lógica del
juego, sin necesidad de Android Studio. El audio requiere un primer toque/click del usuario (lo
exigen las políticas de autoplay de los navegadores).

## Tests

```bash
npm test                 # toda la suite (unitarios + integración)
npm run test:watch       # modo watch durante desarrollo
```

Ver [`test/README.md`](test/README.md) para el detalle de cobertura.

## Compilar y correr en Android

1. Sincronizar los cambios de `www/` hacia el proyecto nativo:
   ```bash
   npx cap sync
   ```
2. Abrir el proyecto en Android Studio:
   ```bash
   npx cap open android
   ```
3. Dentro de Android Studio, esperar la sincronización de Gradle y presionar **Run ▶** sobre un
   emulador o dispositivo conectado.

### Probar en un teléfono físico (sin Android Studio)

Si solo querés instalar un build de prueba en un teléfono real:

1. Generar el `.apk` de debug desde la terminal:
   ```bash
   npx cap sync
   cd android && ./gradlew assembleDebug
   ```
   El archivo queda en `android/app/build/outputs/apk/debug/app-debug.apk` (una copia de
   conveniencia puede vivir como `Pulsit-debug.apk` en la raíz del repo — no se versiona, ver
   `.gitignore`).
2. En el teléfono: `Ajustes` → activar "Orígenes desconocidos" / "Instalar apps desconocidas" para
   la app que vaya a usarse para transferir el archivo (navegador, Drive, cable, etc.).
3. Instalar el `.apk`:
   - Por cable con el teléfono en modo depuración USB: `adb install -r app-debug.apk` (con el
     teléfono conectado y detectado por `adb devices`), o
   - Transfiriendo el archivo al teléfono (USB, Drive, etc.) y abriéndolo desde un explorador de
     archivos para instalarlo manualmente.

Este `.apk` de debug sirve para probar la app, pero **no** es el artefacto para publicar en Play
Store (ver la sección siguiente, que requiere un `.aab` firmado con una clave de producción).

Repite el paso 1 cada vez que modifiques algo en `www/` — Android Studio no ve esos cambios hasta
que se sincroniza.

## Publicar en Google Play Store

### 1. Keystore de firma — YA GENERADO

Ya existe un keystore de release para esta app, generado el 2026-10-21:

- Archivo: `pulsit-release.keystore`, guardado **fuera del repositorio** (en una carpeta hermana
  del proyecto, no dentro de `Pulsit/`), para que nunca corra riesgo de subirse a git por error.
- Alias: `pulsit`.
- Validez: 10.000 días (vence en 2054).
- Las contraseñas (storePassword y keyPassword, iguales entre sí) las eligió el usuario — **no
  están en ningún archivo versionado**, solo en `android/keystore.properties` (ignorado por git,
  ver `.gitignore`) y en la memoria del usuario.

**Backup crítico**: si se pierde el archivo del keystore o la contraseña, nunca más se va a poder
subir una actualización de la app con el mismo `applicationId` (salvo que ya se haya habilitado
Play App Signing — ver sección 3 — en cuyo caso Google conserva la clave final, pero la "upload
key" local se seguiría necesitando para firmar cada subida). **El usuario debe guardar una copia
del archivo `.keystore` y de la contraseña en un lugar seguro y duradero** (gestor de contraseñas,
backup cifrado, etc.) fuera de esta máquina — no depender de que siga ahí.

Si en el futuro hace falta regenerar el keystore desde cero (por ejemplo, en otra máquina, sin el
archivo original):

```bash
keytool -genkey -v -keystore pulsit-release.keystore -alias pulsit -keyalg RSA -keysize 2048 -validity 10000
```

Esto **invalida la posibilidad de actualizar la app ya publicada** con el keystore anterior, salvo
que se use Play App Signing (ver sección 3).

### 2. Configurar la firma — YA CONFIGURADO vía Gradle

`android/app/build.gradle` ya tiene el bloque `signingConfigs.release`, que lee
`android/keystore.properties` (no versionado):

```properties
storeFile=<ruta absoluta al .keystore, fuera del repo>
storePassword=<la contraseña elegida>
keyAlias=pulsit
keyPassword=<la misma contraseña>
```

Si ese archivo no existe (por ejemplo, al clonar el repo en otra máquina sin el keystore), el
build simplemente genera un `.aab`/`.apk` de release **sin firmar**, sin romper el build — hay que
recrear `keystore.properties` ahí (con el keystore real, ver sección 1) para volver a tener
firma automática.

Para generar el bundle firmado:

```bash
cd android && ./gradlew bundleRelease
```

El resultado queda en `android/app/build/outputs/bundle/release/app-release.aab` (y se copia a
`Pulsit-release.aab` en la raíz del repo, no versionado, por conveniencia — mismo patrón que
`Pulsit-debug.apk`).

Alternativa (vía la UI de Android Studio, sin tocar Gradle): `Build` → `Generate Signed Bundle /
APK...` → **Android App Bundle** → seleccionar el keystore → build variant `release`.

### 3. Play App Signing (recomendado por Google)

Al crear la app en [Play Console](https://play.google.com/console) y subir el primer `.aab`,
aceptar que Google gestione la clave de firma de la app (**Play App Signing**). Vos seguís
firmando tus builds de subida con tu propio keystore ("upload key"), pero Google re-firma el
artefacto final con una clave que gestiona de forma segura — esto permite recuperar el acceso si
perdés tu upload key, a diferencia del esquema 100% manual.

### 4. Datos de la app

- `applicationId`: `com.cauquenlabs.pulsit` (no cambiar una vez publicada: identifica la app de
  forma permanente en la Play Store).
- Ícono y nombre: ver `android/app/src/main/res/` y `android/app/src/main/res/values/strings.xml`.
  El ícono ya es el diseño definitivo de Pulsit (ver "Ícono de la app" más abajo) — no depende del
  logo de CauquenLabs ni de ningún paso pendiente.

## Ícono de la app

El ícono nativo (`android/app/src/main/res/mipmap-*/ic_launcher*.png`) es un diseño propio de
Pulsit (un anillo de 4 colores, los mismos que usan los botones del juego, alrededor de un punto
central brillante), no depende del logo de CauquenLabs. Su fuente vectorial versionada es
`www/assets/icon-pulsit-source.svg` (hay también `icon-pulsit-preview.png`, una vista previa
de referencia a 512×512 px, no usada por la app).

Para modificarlo: editar el SVG (o rehacer su generador, ver el historial de commits de
`www/assets/icon-pulsit-source.svg` para un script de referencia que usa `sharp`) y regenerar los
PNG de cada densidad (`mipmap-mdpi` a `mipmap-xxxhdpi`: `ic_launcher.png`, `ic_launcher_round.png`,
`ic_launcher_foreground.png`, `ic_launcher_background.png`) — o, más simple, usar el **Image Asset
Studio** de Android Studio (clic derecho sobre `res/` → `New` → `Image Asset`) apuntando al SVG.

## Logo de CauquenLabs

`www/assets/logo-cauquenlabs.png` es el logo definitivo de CauquenLabs (512×512 px, fondo
transparente, texto negro), usado en la pantalla de inicio y en "Acerca de" (distinto del ícono de
la app, ver arriba). Como el texto es negro, el CSS (`.logo`, `.about-logo`) lo muestra sobre una
placa clara redondeada para que no se pierda contra el fondo oscuro. Para cambiarlo, sobrescribir
el archivo manteniendo el nombre y correr `npx cap sync`.

## Material de la ficha de Play Store (`store-listing/`)

- `feature-graphic.png`: gráfico destacado de 1024×500 px, PNG de 24 bits sin alfa (como exige
  Play Console). Se regenera con `node store-listing/gen-feature-graphic.mjs` (requiere `sharp`:
  `npm install --no-save sharp`).
- `screenshots/`: capturas de teléfono 1080×2400 para la ficha. Se regeneran con
  `node store-listing/capture-screenshots.cjs` (Chrome headless sobre `npm run dev`; requiere
  `npm install --no-save puppeteer-core`).

Vive fuera de `www/` a propósito: todo lo que está en `www/` se copia al APK en cada `cap sync`.
