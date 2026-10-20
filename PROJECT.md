# PROJECT.md — Estado del proyecto Pulsit

> Documento vivo. Actualizar en cada commit significativo. Ver también
> `.project-corpus/state/STATUS.md` para el estado de continuidad entre sesiones de agentes.

## Estado actual

### Funciona

- Lógica completa del modo campaña (10 fases, progresión 2→10, reposicionamiento según fase),
  implementada en `www/js/gameLogic.js` y orquestada por `www/js/game.js`.
- Modo personalizado completo: configuración de botones (3-9), tipo de estímulo (colores/números/
  ambos), reposicionamiento y longitud máxima de secuencia, con validación y persistencia (el
  sonido ya no es parte de esta config — ver pantalla de Ajustes más abajo).
- Audio 100% generado por Web Audio API: tono único por botón (independiente de su posición en
  pantalla), sonido de error, sonido de fase superada, y sonido de bienvenida en crescendo (~2s).
- Persistencia local vía `@capacitor/preferences` (con fallback a `localStorage` en desarrollo
  web): progreso de campaña y configuración personalizada sobreviven a cerrar/reabrir la app.
- Interfaz responsive (flexbox/grid + media queries), botones con tamaño mínimo táctil (48px).
- Proyecto Android generado con Capacitor (`npx cap add android`), `applicationId`
  `com.cauquenlabs.pulsit`, sincronizado correctamente (`npx cap sync` corrido sin errores).
- **Build Android verificado de punta a punta**: `./gradlew assembleDebug` y `./gradlew
  bundleRelease` compilan exitosamente (ver "Decisiones técnicas" sobre el ajuste de versión de
  Gradle que hizo falta). El `.apk` de debug se instaló y corrió en un emulador
  (`Medium_Phone_API_37.0`): pantalla de inicio, logo, y modo campaña (fase 1, 3 botones de color)
  renderizan y responden al toque correctamente dentro del WebView nativo, sin errores en logcat.
- Suite de tests: 58 tests (unitarios + integración) pasando, cubriendo reglas de negocio,
  persistencia, audio y los flujos completos de campaña y modo personalizado.
- Logo placeholder 512×512 generado para CauquenLabs (`www/assets/logo-cauquenlabs.png`).
- Tonos de botón rediseñados con mayor separación perceptible (terceras mayores en vez de grados
  de escala pentatónica), tras detectar en pruebas manuales que sonaban demasiado parecidos entre
  sí (ver `www/js/audio.js`).
- **Rediseño del tablero** (a pedido del usuario, verificado en navegador y en el emulador Android):
  botones circulares, agrupados siempre en filas fijas según la cantidad (`gameLogic.getRowLayout`:
  2-1, 2-2, 3-2, 3-3, 3-3-1, 3-3-2, 3-3-3 para 3 a 9 botones) en vez de una grilla que se ajusta
  libremente al ancho. El estímulo "ambos" ahora combina color de fondo + número en cada botón
  (antes alternaba botones puramente de color con puramente numéricos).
- **Pantalla de juego ampliada**: número de fase luminoso (solo campaña), barra de progreso visual
  de la secuencia actual, y una barra "Reiniciar nivel" para reintentar sin volver al menú.
- **Fondo visual "futurista" estilo circuito** en las 3 pantallas, con un pulso de resplandor en
  CSS por encima; todo el contenido de cada pantalla tiene `z-index` explícito para garantizar que
  quede por encima del fondo. El fondo activo es `www/assets/background-circuit.webp` (una foto de
  circuito impreso provista por el usuario, optimizada de 4K/4.8MB a 1600×900/~160KB con `sharp`);
  también existe `background-circuit.svg` (generado por código, 100% vectorial) como alternativa
  sin dependencia de ninguna imagen externa.
- **Feedback háptico** (`www/js/haptics.js`, `@capacitor/haptics`): vibración corta en cada toque
  correcto, patrón distinto en error, y vibración de éxito al superar fase/partida. Con fallback a
  `navigator.vibrate` fuera de la app nativa.
- **Modo daltónico**: superpone una forma fija (círculo, cuadrado, triángulo, etc.) sobre cada botón
  de tipo "colores", para no depender solo del color (ver `gameLogic.shapeForValue`).
- **Mejor puntaje**: la pantalla de juego muestra `Secuencia: X / N · Mejor: B`, con el mejor
  guardado por fase de campaña y uno global para modo personalizado (`storage.getBestScore` /
  `setBestScore`, nunca retrocede).
- **Pantalla de Ajustes** (`screen-settings`, nueva): consolida dos preferencias GLOBALES —
  "Sonido y vibración activados" y "Modo daltónico" — accesible desde un botón en la pantalla de
  inicio. El sonido dejó de ser parte de la config de modo personalizado (antes ni siquiera existía
  forma de desactivarlo en campaña) y pasó a `storage.getSoundEnabled`/`setSoundEnabled`, cargado
  una sola vez al iniciar la app y aplicado tanto a `AudioEngine` como a `HapticsEngine`.
- **Rotación de pantalla verificada**: la app no fija orientación; al rotar, el CSS responsive
  reacomoda todo automáticamente. Se detectó y corrigió que, en horizontal con tableros de varias
  filas, el contenido podía no entrar en el alto disponible sin forma de scrollear — se agregó
  `overflow-y: auto` a `.screen`, verificado con un swipe real en el emulador rotado.
- **Verificado en tablet**: emulador `Pulsit_Tablet` (perfil "10.1in WXGA", 800×1280 @ 160dpi,
  creado a mano editando `config.ini` ya que no había `avdmanager` disponible en esta máquina — ver
  `.project-corpus/state/STATUS.md`). El contenido queda centrado y bien proporcionado gracias al
  `max-width` ya existente en `.screen`.
- **`Pulsit-debug.apk`** en la raíz del repo (no versionado, ver `.gitignore`): copia de
  conveniencia del último `app-debug.apk` generado, para instalar directamente en un teléfono
  físico sin tener que navegar `android/app/build/outputs/...`. Se regenera con
  `./gradlew assembleDebug` + copiar el archivo; no es parte del código fuente.

### En progreso / parcial

- Nada en progreso al momento de este commit; el proyecto está en un estado estable y completo
  funcionalmente según la especificación (`pulsit.md`), con el build nativo verificado y el
  rediseño visual aplicado también al APK nativo (no solo al navegador).

### Falta (ver también `.project-corpus/state/STATUS.md`)

- **Generación del `.aab` firmado para Play Store**: `bundleRelease` genera un `.aab` sin firma de
  producción (sin `signingConfig` de release configurado, a propósito — ver "Decisiones técnicas").
  Falta que el publicador genere su propio keystore y firme el bundle final, según el procedimiento
  de `README.md`.
- **Logo definitivo de CauquenLabs**: actualmente hay un placeholder geométrico en
  `www/assets/logo-cauquenlabs.png`. Debe reemplazarse por el logo real manteniendo el mismo
  nombre de archivo y dimensiones mínimas (512×512 px).
- **Iconos nativos de la app** (`android/app/src/main/res/mipmap-*/ic_launcher*.png`): Capacitor
  generó los íconos por defecto del template; deberían regenerarse a partir del logo definitivo de
  CauquenLabs una vez provisto (por ejemplo, con el Image Asset Studio de Android Studio). El
  usuario pidió explícitamente dejar esto pendiente hasta tener el logo real.
- **Pruebas en dispositivo físico**: todo lo verificado hasta ahora es en emuladores (teléfono y
  tablet); falta instalar `Pulsit-debug.apk` en un teléfono real (especialmente para confirmar por
  tacto el feedback háptico, que no se puede verificar desde el emulador/automatización).

## Decisiones técnicas tomadas

- **Capacitor sobre WebView manual**: elegido explícitamente por el prompt original para garantizar
  un proyecto Android real, mantenible y abrible en Android Studio sin herramientas de "un solo
  comando" que oculten la estructura nativa.
- **JavaScript vanilla con ES Modules, sin framework ni bundler**: se priorizó simplicidad y
  mantenibilidad (requisito explícito de la spec) sobre las ventajas de un framework. Al ser un
  juego de interacción relativamente simple (un tablero de botones + máquina de estados), un
  framework como Vue/React habría agregado complejidad de build sin beneficio claro. Esto también
  simplifica la carga en el WebView de Capacitor (no requiere paso de bundling antes de
  `cap sync`).
- **Separación `gameLogic.js` (puro) vs. `game.js` (orquestación con DOM)**: decisión de
  arquitectura para que las reglas de negocio (progresión de fases, generación de secuencias,
  validación de entrada, shuffle de layout) sean 100% testeables sin DOM ni temporizadores reales.
  `game.js` es una capa delgada de "pegamento" entre `gameLogic.js`, `audio.js` y el DOM.
- **Identidad del botón ligada al valor lógico, no a la posición en pantalla**: tanto el color/
  número como el tono de sonido de un botón dependen de su "valor" (0..N-1), no de su posición en
  la grilla. El reposicionamiento (`reposition: true`) solo baraja qué posición de pantalla
  muestra cada valor. Esto es necesario para que el jugador pueda seguir memorizando la secuencia
  por identidad del botón aun cuando la fase mueve los botones de lugar.
- **Tonos de botón con escala pentatónica mayor**: se usó una escala pentatónica (en vez de
  frecuencias arbitrarias) para que las combinaciones de notas sean agradables al oído incluso en
  secuencias largas, evitando dobles sostenidos pero manteniendo 9 tonos claramente distinguibles
  (una nota por cada botón posible, 3 a 9).
- **AudioContext se crea de forma perezosa** (`AudioEngine.ensureContext`), no en el constructor:
  los navegadores/WebViews exigen que el `AudioContext` se cree o reanude tras un gesto del
  usuario; crearlo antes fallaría silenciosamente en algunos entornos.
- **StorageService con backend inyectable**: detecta automáticamente Capacitor Preferences vs.
  `localStorage`, pero permite inyectar un backend arbitrario (usado extensivamente en los tests
  unitarios e integración) para no depender de un entorno real de almacenamiento en los tests.
- **El progreso de campaña nunca retrocede**: `StorageService.setCampaignProgress` toma el máximo
  entre el valor guardado y el nuevo valor. Decisión tomada para blindar contra una llamada
  accidental con un número de fase menor (por ejemplo, si en el futuro se agregara un modo
  "rejugar fase X" que no debería poder desbloquear menos de lo ya alcanzado).
- **`android/` se versiona en Git, salvo artefactos de build**: a diferencia de otros proyectos
  Capacitor donde se ignora todo `android/`, acá se commitea el proyecto nativo completo (menos
  `build/`, `.gradle/`, `local.properties`, `.idea/`) porque la spec exige que el repo contenga un
  "proyecto Android funcional" listo para abrir, no solo regenerable vía `cap add android`.
- **Nunca versionar el keystore de firma**: `.gitignore` excluye `*.keystore`, `*.jks` y
  `keystore.properties`. El proceso de generación queda documentado en `README.md`, pero el
  archivo de firma en sí es responsabilidad de quien publique la app, no se incluye en el repo.
- **Gradle wrapper fijado a 9.5.1 (no al 8.14.3 que trae el template de Capacitor por defecto)**:
  la única JDK disponible en la máquina de build era la JBR empaquetada con Android Studio
  (JDK 25). Gradle 8.14.3 no puede *ejecutarse* sobre JDK 25 ("Unsupported class file major version
  69"). Gradle 9.8.2 (la última en ese momento) sí corre sobre JDK 25, pero rompe la compatibilidad
  con AGP 8.x (usa una API interna de Gradle removida en 9.6). El propio mensaje de error de Gradle
  recomendó 9.5 como la última versión 9.x todavía compatible con AGP 8.x; se fijó `9.5.1` (último
  patch de esa serie) en `gradle-wrapper.properties`. Si en el futuro se actualiza a una JDK más
  convencional (17/21) para el build, este pin puede revisarse, pero 9.5.1 funciona correctamente
  con el AGP 8.13.0 actual y no requiere tocar nada más.
- **Tonos de botón con pasos de tercera mayor (4 semitonos) en vez de escala pentatónica**:
  la escala pentatónica original agrupaba las 9 notas en ~1.3 octavas con pasos de apenas 2-3
  semitonos, lo que las hacía sonar parecidas entre sí en reproducciones cortas (350ms). Se
  rediseñó `frequencyForValue` para espaciar las notas en terceras mayores a lo largo de 3 octavas
  (A3 a ~D6), maximizando la distinción perceptible entre cualquier par de botones.
- **Filas fijas por cantidad de botones (`getRowLayout`) en vez de grid auto-ajustable**: a pedido
  explícito del usuario, con una figura exacta por cantidad (ver `documentacion/
  01-concepto-y-mecanica.md`). Se implementó como función pura en `gameLogic.js` (regla: filas de 2
  si `count<=4`, filas de 3 en caso contrario, con la última fila completando el resto) para que
  `game.js` solo tenga que agrupar el DOM en filas, sin decidir la regla de negocio.
- **Estímulo "ambos" combina color+número por botón, no alterna botones puros**: cambio de diseño a
  pedido del usuario. Simplificó `generateButtonValues` (ya no necesita alternar `type` por índice)
  a costa de que `game.js` deba aplicar tanto `backgroundColor` como `textContent` cuando
  corresponde; se agregó `text-shadow` a `.game-button--number` para mantener legibilidad del
  número sobre fondos de color claro (amarillo, rosa) de la paleta.
- **Fondo como archivo SVG reemplazable, no CSS embebido**: el usuario pidió explícitamente poder
  reemplazar el fondo como un recurso (igual que el logo), así que se generó
  `www/assets/background-circuit.svg` en vez de mantener el enfoque anterior (gradientes 100% CSS).
  El pulso de resplandor se mantuvo como capa CSS aparte (`::before`/`::after`), de modo que sigue
  funcionando aunque se reemplace el SVG por otra imagen. Se usó SVG (vectorial) y no PNG/JPG para
  que se vea nítido en cualquier densidad de pantalla Android sin generar variantes mdpi/hdpi/xhdpi.
- **Fondo final: foto real optimizada, no el SVG generado**: el usuario proveyó una foto de circuito
  impreso de alta calidad (4K, 4.8MB) para usar como fondo real. Se optimizó con `sharp`
  (reescalado a 1600×900 + conversión a WebP, calidad 78) quedando en ~160KB, y se convirtió en el
  `background-image` activo de `.cosmic-bg`. El SVG generado por código se conservó como alternativa
  sin dependencia de archivos de imagen externos, pero ya no es el que se usa por defecto.
- **`z-index` explícito en `.screen`**: aunque el apilamiento ya funcionaba correctamente por
  herencia de `#app` (`z-index: 1`) sobre `.cosmic-bg` (`z-index: 0`), se agregó `position: relative;
  z-index: 1` directamente en `.screen` para que la garantía de "los botones quedan por encima del
  fondo" sea explícita y no dependa implícitamente de la estructura del DOM.
- **Haptics/Preferences sin `import` de npm**: siguiendo el patrón ya usado por `storage.js`,
  `haptics.js` accede al plugin vía `window.Capacitor?.Plugins?.Haptics` en vez de
  `import { Haptics } from '@capacitor/haptics'`, porque este proyecto no usa bundler y el
  navegador no puede resolver ese specifier. El paquete sigue siendo una dependencia npm real
  (necesaria para que `cap sync` registre el plugin nativo), solo que el JS de `www/` nunca lo
  importa directamente. Documentado en `AGENTS.md` para que futuros plugins sigan el mismo patrón.
- **Vibración ligada al mismo casillero que el sonido, sin control propio**: se evaluó agregar un
  toggle separado para la vibración, pero se descartó para no sumar una opción más; el casillero
  "Sonido y vibración activados" ya representa "feedback sensorial activado" en la práctica.
- **Sonido migrado de "parámetro de modo personalizado" a "ajuste global" + pantalla de Ajustes
  nueva**: a pedido del usuario ("junta sonido y modo daltónico en una pantalla de ajustes"). Se
  sacó `sound` de `validateCustomConfig`/`DEFAULT_CUSTOM_CONFIG` y se agregó
  `storage.getSoundEnabled`/`setSoundEnabled`, cargado una sola vez en `app.js:init()` (antes de
  cablear cualquier pantalla, para que hasta el sonido de bienvenida lo respete) en vez de leerse
  por partida. Efecto colateral deseado: el modo campaña, que nunca tuvo forma de silenciarse,
  ahora sí respeta el ajuste.
- **AVD de tablet creado a mano, sin `avdmanager`**: esta máquina solo tiene el SDK embebido de
  Android Studio (sin `cmdline-tools`/`avdmanager` instalados). Se creó
  `~/.android/avd/Pulsit_Tablet.avd/config.ini` directamente, clonando el del teléfono existente y
  cambiando `hw.lcd.*`/`skin.*` al perfil clásico "10.1in WXGA" (800×1280 @ 160dpi) — el emulador
  no necesita que el AVD haya sido creado por `avdmanager`, solo un `config.ini` válido.
- **Modo daltónico aplica solo a botones tipo "colores"**: los de tipo "números"/"ambos" ya tienen
  un número como identificador independiente del color, así que agregarles también una forma sería
  ruido visual sin beneficio de accesibilidad real.
- **Mejor puntaje = longitud de la última ronda completada con éxito**, no la secuencia en la que
  se falló: es la interpretación más natural de "qué tan lejos llegaste" y se calcula reusando el
  callback `onRoundResult` que ya existía, sin tocar la lógica de `GameController`.
- **`overflow-y: auto` en `.screen`**: se detectó al verificar la pregunta del usuario sobre
  rotación de pantalla — en horizontal, con tableros de varias filas, el contenido podía exceder el
  alto disponible y quedar parcialmente inalcanzable (sin fix, no había ninguna forma de scroll).
  Se agregó scroll vertical a nivel de pantalla y se confirmó con un swipe real en el emulador
  rotado a horizontal.

## Problemas conocidos / limitaciones

- El `.aab` de `bundleRelease` no está firmado con una clave de producción (no hay
  `signingConfig` de release definido a propósito, ver "Decisiones técnicas"); falta el paso de
  firma documentado en `README.md` antes de poder subirlo a Play Console.
- El logo de CauquenLabs es un placeholder geométrico generado programáticamente, no el logo real
  de marca (pendiente a propósito, por pedido explícito del usuario).
- No hay pruebas automatizadas de UI/responsive más allá de lo verificado manualmente (emuladores
  de teléfono y tablet, ver `documentacion/07-criterios-de-aceptacion.md`); falta un dispositivo
  físico real.
- El feedback háptico se verificó por ausencia de errores (logcat limpio, sin excepciones JS) y por
  los tests unitarios de `HapticsEngine`, pero no se puede confirmar por tacto real desde este
  entorno de desarrollo automatizado; falta una confirmación sensorial humana en un teléfono físico.

## Próximos pasos concretos

1. Instalar `Pulsit-debug.apk` (raíz del repo) en un teléfono físico vía USB/`adb install` o
   transfiriendo el archivo, y confirmar: feedback háptico real, audio, persistencia, y que todo
   el rediseño visual se vea bien fuera del emulador.
2. Cuando CauquenLabs provea el logo definitivo: reemplazar `www/assets/logo-cauquenlabs.png`,
   correr `npx cap sync`, regenerar los íconos nativos de `android/app/src/main/res/mipmap-*/`, y
   recién ahí abordar el ícono de la app (explícitamente pospuesto hasta tener el logo real).
3. Generar el keystore de firma siguiendo `README.md` y configurar Play App Signing.
4. Generar el `.aab` de release firmado (con keystore real) y subirlo a Play Console como build
   interno de prueba.
5. Etiquetar la siguiente versión (`git tag v0.2.0`) una vez firmado y subido el primer build de
   prueba.
