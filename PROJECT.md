# PROJECT.md — Estado del proyecto Pulsit

> Documento vivo. Actualizar en cada commit significativo. Ver también
> `.project-corpus/state/STATUS.md` para el estado de continuidad entre sesiones de agentes.

## Estado actual

### Funciona

- Lógica completa del modo campaña (10 fases, progresión 2→10, reposicionamiento según fase),
  implementada en `www/js/gameLogic.js` y orquestada por `www/js/game.js`.
- Modo personalizado completo: configuración de botones (3-9), tipo de estímulo (colores/números/
  ambos), reposicionamiento, sonido on/off y longitud máxima de secuencia, con validación y
  persistencia.
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

### En progreso / parcial

- Nada en progreso al momento de este commit; el proyecto está en un estado estable y completo
  funcionalmente según la especificación (`pulsit.md`), y con el build nativo ya verificado.

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
  CauquenLabs una vez provisto (por ejemplo, con el Image Asset Studio de Android Studio).
- **Verificación manual en tablet**: se probó en un emulador de teléfono; falta verificar
  responsive en un tamaño de tablet real o emulado.

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

## Problemas conocidos / limitaciones

- El `.aab` de `bundleRelease` no está firmado con una clave de producción (no hay
  `signingConfig` de release definido a propósito, ver "Decisiones técnicas"); falta el paso de
  firma documentado en `README.md` antes de poder subirlo a Play Console.
- El logo de CauquenLabs es un placeholder geométrico generado programáticamente, no el logo real
  de marca.
- No hay pruebas automatizadas de UI/responsive más allá de lo verificado manualmente; se probó en
  un emulador de teléfono (`Medium_Phone_API_37.0`) pero no en un tamaño de tablet (ver
  `documentacion/07-criterios-de-aceptacion.md`).

## Próximos pasos concretos

1. Verificar responsive en un emulador/tablet de pantalla grande (ej. `Pixel Tablet` o similar),
   además del teléfono ya verificado.
2. Reemplazar `www/assets/logo-cauquenlabs.png` por el logo definitivo de CauquenLabs (mínimo
   512×512 px) cuando el cliente lo provea, y regenerar los íconos nativos de `android/app/src/
   main/res/mipmap-*/` a partir de él.
3. Generar el keystore de firma siguiendo `README.md` y configurar Play App Signing.
4. Generar el `.aab` de release firmado (con keystore real) y subirlo a Play Console como build
   interno de prueba.
5. Etiquetar la siguiente versión (`git tag v0.2.0`) una vez firmado y subido el primer build de
   prueba.
