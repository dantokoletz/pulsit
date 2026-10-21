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

### 1. Generar el keystore de firma

Si todavía no tenés un keystore para esta app, generá uno (guardalo en un lugar seguro, **fuera
del repositorio** — ver `.gitignore`):

```bash
keytool -genkey -v -keystore pulsit-release.keystore -alias pulsit -keyalg RSA -keysize 2048 -validity 10000
```

Vas a necesitar recordar: la contraseña del keystore, el alias (`pulsit` en el ejemplo) y la
contraseña de la clave. **Si se pierde este archivo o las contraseñas, no vas a poder volver a
actualizar la app con el mismo `applicationId`** salvo que uses Play App Signing (ver abajo).

### 2. Configurar la firma en Android Studio

Opción recomendada, vía la UI de Android Studio:

- `Build` → `Generate Signed Bundle / APK...`
- Elegir **Android App Bundle**.
- Seleccionar el keystore generado en el paso 1, o crear uno nuevo desde el mismo asistente.
- Elegir el build variant `release`.

Esto genera un `.aab` firmado en `android/app/release/` (o la ruta que indique Android Studio al
finalizar).

Alternativa (configuración manual vía Gradle): crear `android/keystore.properties` (ignorado por
git) con:

```properties
storeFile=../pulsit-release.keystore
storePassword=TU_PASSWORD
keyAlias=pulsit
keyPassword=TU_PASSWORD
```

y referenciarlo desde `android/app/build.gradle` en el bloque `signingConfigs` /
`buildTypes.release`. Esta app no trae esa configuración por defecto para no forzar un esquema de
firma específico; documentarla acá y en `PROJECT.md` si se adopta.

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

## Reemplazar el logo de CauquenLabs (placeholder)

`www/assets/logo-cauquenlabs.png` es un placeholder geométrico de 512×512 px generado
automáticamente, usado en la pantalla de inicio y en "Acerca de" para representar a la empresa
(distinto del ícono de la app, ver arriba). Para reemplazarlo una vez que CauquenLabs provea el
logo real:

1. Sobrescribir ese archivo (mantener el mismo nombre, mínimo 512×512 px, fondo transparente u
   opaco según el diseño final).
2. Correr `npx cap sync` para que se copie al proyecto Android.
3. Quitar la nota "logo provisorio, en diseño" de la pantalla "Acerca de" (`www/index.html`,
   sección `#screen-about`) y el texto equivalente del `alt` de la imagen.
