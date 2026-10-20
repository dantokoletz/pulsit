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
- Suite de tests: 58 tests (unitarios + integración) pasando, cubriendo reglas de negocio,
  persistencia, audio y los flujos completos de campaña y modo personalizado.
- Logo placeholder 512×512 generado para CauquenLabs (`www/assets/logo-cauquenlabs.png`).

### En progreso / parcial

- Nada en progreso al momento de este commit; el proyecto está en un estado estable y completo
  funcionalmente según la especificación (`pulsit.md`).

### Falta (ver también `.project-corpus/state/STATUS.md`)

- **Build real en Android Studio**: el entorno donde se generó este proyecto no tiene JDK ni
  Android SDK instalados, por lo que `npx cap sync` se verificó, pero **no se compiló** el
  proyecto Android (`./gradlew assembleDebug` / `bundleRelease`). Debe verificarse abriendo el
  proyecto en Android Studio con las herramientas instaladas.
- **Generación del `.aab` firmado**: no realizada por el motivo anterior. Ver `README.md` para el
  procedimiento documentado.
- **Logo definitivo de CauquenLabs**: actualmente hay un placeholder geométrico en
  `www/assets/logo-cauquenlabs.png`. Debe reemplazarse por el logo real manteniendo el mismo
  nombre de archivo y dimensiones mínimas (512×512 px).
- **Pruebas en dispositivo/emulador real**: no realizadas (requiere Android Studio).
- **Iconos nativos de la app** (`android/app/src/main/res/mipmap-*/ic_launcher*.png`): Capacitor
  generó los íconos por defecto del template; deberían regenerarse a partir del logo definitivo de
  CauquenLabs una vez provisto (por ejemplo, con el Image Asset Studio de Android Studio).

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

## Problemas conocidos / limitaciones

- No se verificó la compilación real de Gradle (`assembleDebug`/`bundleRelease`) por falta de JDK/
  Android SDK en el entorno de desarrollo original. Es el principal riesgo pendiente: es posible
  (aunque poco probable, dado que Capacitor generó el proyecto de forma estándar) que aparezcan
  ajustes menores de versión de Gradle/AGP/SDK al abrir el proyecto por primera vez en una máquina
  con Android Studio instalado.
- El logo de CauquenLabs es un placeholder geométrico generado programáticamente, no el logo real
  de marca.
- No hay pruebas automatizadas de UI/responsive (solo verificación manual documentada en
  `documentacion/07-criterios-de-aceptacion.md`).

## Próximos pasos concretos

1. Abrir `android/` en Android Studio en una máquina con JDK 17+ y Android SDK instalados;
   dejar que Android Studio sincronice Gradle y resuelva cualquier ajuste de versión automático.
2. Compilar un build de debug (`Run ▶`) y probar el juego en un emulador o dispositivo físico,
   verificando especialmente: audio, persistencia tras cerrar la app, y responsive en al menos un
   tamaño de teléfono y uno de tablet.
3. Reemplazar `www/assets/logo-cauquenlabs.png` por el logo definitivo de CauquenLabs (mínimo
   512×512 px) cuando el cliente lo provea, y regenerar los íconos nativos de `android/app/src/
   main/res/mipmap-*/` a partir de él.
4. Generar el keystore de firma siguiendo `README.md` y configurar Play App Signing.
5. Generar el `.aab` de release firmado desde Android Studio (`Build > Generate Signed Bundle`).
6. Etiquetar la primera versión estable (`git tag v0.1.0`) una vez verificado el build real.
