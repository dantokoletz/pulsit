# Prompt para Agente de Desarrollo — Proyecto "Pulsit"

## 1. Contexto y Rol

Eres un agente de desarrollo de software senior. Tu tarea es construir desde cero una aplicación Android llamada **Pulsit**, propiedad de **CauquenLabs**. El proyecto debe ser entregado como un proyecto completo que pueda abrirse en **Android Studio** y publicarse en **Google Play Store**. El código debe ser mantenido en un repositorio Git con un historial de commits claro y documentado, de modo que otro agente de IA (en otra máquina) pueda clonar el repositorio y continuar el desarrollo sin depender de memoria de conversación.

**Decisión técnica obligatoria:** Construye la lógica del juego como una **aplicación web (HTML5 + CSS3 + JavaScript vanilla o framework ligero)** y envuélvela con **Capacitor** para generar el proyecto Android nativo. Esto garantiza que el proyecto se abra en Android Studio  y que el juego sea responsive de forma natural. No uses WebView manual ni herramientas de un solo comando que oculten la estructura del proyecto; necesitamos un proyecto Android real y mantenible.

---

## 2. Especificación Funcional del Juego

### 2.1 Concepto central

Pulsit es un juego de memoria y concentración basado en el mecanismo de "Simón": el sistema muestra una secuencia de estímulos (visuales y sonoros), y el jugador debe repetirla en el mismo orden. La particularidad de Pulsit es la **progresión de complejidad**: no solo crece la longitud de la secuencia, sino también la **cantidad de botones** y el **tipo de estímulo**.

### 2.2 Progresión de niveles (modo historia/campaña)

La progresión debe seguir esta estructura, avanzando de menor a mayor dificultad:

| Fase | Botones | Estímulo visual | Estímulo sonoro | Secuencia |
|------|---------|-----------------|-----------------|-----------|
| 1 | 3 | Colores fijos | Sí | 2 → 10 |
| 2 | 3 | Números fijos | Sí | 2 → 10 |
| 3 | 4 | Colores fijos | Sí | 2 → 10 |
| 4 | 4 | Números fijos | Sí | 2 → 10 |
| 5 | 5 | Colores que cambian de posición | Sí | 2 → 10 |
| 6 | 5 | Números que cambian de posición | Sí | 2 → 10 |
| 7 | 6 | Colores fijos | Sí | 2 → 10 |
| 8 | 7 | Números fijos | Sí | 2 → 10 |
| 9 | 8 | Colores que cambian de posición | Sí | 2 → 10 |
| 10 | 9 | Números que cambian de posición | Sí | 2 → 10 |

**Reglas clave:**
- Cada fase comienza con secuencias de longitud 2 y avanza hasta 10 (o hasta que el jugador falle).
- "Cambian de posición" significa que, tras cada ronda exitosa, los botones se reordenan aleatoriamente en la pantalla antes de mostrar la siguiente secuencia.
- Cada botón (sin importar si es color o número) debe tener un **sonido único y distinguible**.
- El jugador debe completar la secuencia de 10 para considerar la fase superada y desbloquear la siguiente.

### 2.3 Pantalla de inicio

Debe contener:
- Logo de **CauquenLabs** (proporcionado por el cliente; si no se proporciona, usa un placeholder y documenta la ruta donde debe reemplazarse).
- Botón **"Jugar"** (inicia el modo campaña desde la fase desbloqueada más alta).
- Botón **"Personalizado"** (abre la configuración de modo personalizado).
- Un **sonido suave en crescendo** que se reproduce al entrar en la pantalla de inicio (usa Web Audio API con un fade-in gradual de ~2 segundos).

### 2.4 Modo personalizado

El jugador debe poder configurar:
- **Cantidad de botones:** de 3 a 9.
- **Tipo de estímulo:** solo colores / solo números / ambos.
- **¿Cambian de posición?** Sí / No.
- **Sonido:** activado / desactivado.
- **Longitud máxima de secuencia:** configurable (por defecto 10).

La configuración debe guardarse en el dispositivo y restaurarse al volver a abrir la app.

### 2.5 Persistencia local

Usa **`localStorage`** (o el equivalente de Capacitor Preferences si se necesita persistencia más robusta) para almacenar:
- **Nivel completado:** la fase más alta desbloqueada en el modo campaña .
- **Configuración personalizada:** todos los parámetros del modo personalizado .

Al reiniciar la app, el jugador debe encontrar su progreso y configuración intactos.

### 2.6 Responsive

La interfaz debe adaptarse a teléfonos y tablets. Usa CSS con unidades relativas, flexbox/grid y media queries. Los botones deben ser lo suficientemente grandes para interacción táctil (mínimo 48dp).

---

## 3. Especificación Técnica

### 3.1 Stack

- **Frontend del juego:** HTML5, CSS3, JavaScript (puedes usar un framework ligero como Vue o React si lo consideras necesario, pero prioriza simplicidad y mantenibilidad).
- **Audio:** Web Audio API para generar los tonos de los botones y el sonido de bienvenida. No dependas de archivos de audio externos; genera los tonos programáticamente (osciladores) para evitar problemas de assets.
- **Empaquetado Android:** Capacitor .
- **Android Studio:** El proyecto generado por Capacitor debe abrirse directamente en Android Studio y compilar sin pasos manuales adicionales más allá de la sincronización estándar.

### 3.2 Estructura del proyecto (obligatoria)

```
pulsit/
├── AGENTS.md                    # Instrucciones para agentes de IA
├── PROJECT.md                   # Estado actual del proyecto (ver sección 5)
├── README.md                    # Instrucciones de build y ejecución
├── package.json
├── capacitor.config.json
├── www/                         # Código fuente web del juego
│   ├── index.html
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   ├── app.js               # Inicialización y navegación
│   │   ├── game.js              # Lógica del juego (secuencias, niveles)
│   │   ├── audio.js             # Web Audio API
│   │   ├── storage.js           # Persistencia (localStorage)
│   │   └── custom.js            # Modo personalizado
│   └── assets/
│       └── logo-cauquenlabs.png # Placeholder o logo proporcionado
├── android/                     # Proyecto Android generado por Capacitor
│   └── ...                      # No modificar manualmente salvo config nativa
└── .project-corpus/             # Estado para continuidad de agentes IA
    ├── state/
    │   ├── PROJECT.md
    │   └── STATUS.md
    └── reports/
```

### 3.3 Requisitos para publicar en Play Store

- El proyecto debe compilar un **Android App Bundle (.aab)** firmado.
- Configura el **applicationId** como `com.cauquenlabs.pulsit`.
- Documenta en el README el proceso de generación del keystore y la configuración de firma en Android Studio .
- Asegúrate de que el proyecto use Play App Signing (recomendado por Google) o documenta el manejo manual del keystore .

---

## 4. Requisitos de Historial para Continuidad de IA

El repositorio debe contener un sistema de documentación que permita a otro agente de IA retomar el proyecto sin contexto previo. Implementa lo siguiente:

### 4.1 Archivo `AGENTS.md` (raíz del proyecto)

Debe contener:
- Descripción del proyecto y stack.
- Convenciones de código (nombres de archivos, estructura de commits, estilo).
- Instrucciones sobre cómo ejecutar el proyecto en desarrollo (`npm run dev` o similar).
- Instrucciones sobre cómo sincronizar con Android Studio (`npx cap sync` y `npx cap open android`).
- Advertencia: **no modificar archivos dentro de `android/` manualmente** salvo configuración nativa justificada; los cambios de lógica van en `www/`.

### 4.2 Archivo `PROJECT.md` (raíz del proyecto)

Un documento vivo que debe actualizarse en cada commit significativo. Debe contener:
- **Estado actual:** qué funciona, qué está en progreso, qué falta.
- **Decisiones técnicas tomadas:** por qué se eligió Capacitor, cómo se generan los sonidos, cómo funciona el reordenamiento de botones.
- **Problemas conocidos:** bugs identificados, limitaciones.
- **Próximos pasos:** tareas concretas pendientes.

### 4.3 Estructura de `.project-corpus/` (opcional pero recomendada)

Basado en el enfoque de "Project Corpus" , incluye:
- `.project-corpus/state/PROJECT.md`: identidad del proyecto y stack.
- `.project-corpus/state/STATUS.md`: estado verificado, bloqueadores, última acción completada y siguiente acción exacta.
- `.project-corpus/reports/`: reportes de sesiones de desarrollo anteriores (qué se hizo, qué se verificó).

El prompt de carga para un nuevo agente sería: *"Lee AGENTS.md, PROJECT.md y .project-corpus/state/STATUS.md. Luego continúa desde la siguiente acción exacta indicada."*

### 4.4 Historial de Git

- Commits atómicos con mensajes descriptivos en español o inglés (sé consistente).
- Cada commit que modifique funcionalidad debe actualizar `PROJECT.md` si el estado cambia.
- Etiqueta las versiones estables (`v0.1.0`, `v0.2.0`, etc.).

---

## 5. Entregables

Al finalizar, el repositorio debe contener:

1. **Código fuente completo** del juego en `www/`.
2. **Proyecto Android funcional** en `android/`, abrible en Android Studio y compilable como `.aab` firmado .
3. **Documentación completa:** `AGENTS.md`, `PROJECT.md`, `README.md`.
4. **Placeholder del logo de CauquenLabs** en `www/assets/logo-cauquenlabs.png` con dimensiones mínimas 512x512 px, documentando que debe ser reemplazado por el logo definitivo.
5. **Instrucciones claras** para generar el keystore y publicar en Play Store .

---

## 6. Criterios de Aceptación

- [ ] El juego inicia en la pantalla de bienvenida con el logo y el sonido crescendo.
- [ ] El modo campaña respeta la progresión de fases especificada en la tabla de la sección 2.2.
- [ ] Los botones cambian de posición cuando la fase lo requiere.
- [ ] Cada botón tiene sonido propio.
- [ ] El modo personalizado permite todas las configuraciones descritas.
- [ ] El progreso y la configuración persisten tras cerrar y reabrir la app.
- [ ] La interfaz es usable en teléfonos (pantalla pequeña) y tablets.
- [ ] El proyecto se abre en Android Studio sin errores de sincronización.
- [ ] Se puede generar un `.aab` firmado desde Android Studio.
- [ ] Existen `AGENTS.md` y `PROJECT.md` con el nivel de detalle especificado.
- [ ] El historial de Git refleja el desarrollo de forma comprensible.

---

**Nota final para el agente:** Si encuentras ambigüedades en la especificación, documenta la decisión tomada en `PROJECT.md` bajo "Decisiones técnicas" y procede. No dejes el proyecto en un estado intermedio sin registrar el siguiente paso exacto en `PROJECT.md`.