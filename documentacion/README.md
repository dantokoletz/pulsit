# Documentación funcional de Pulsit

Este directorio contiene la documentación **funcional** del juego (qué hace la app y por qué),
independiente de la documentación técnica para agentes de IA que vive en la raíz del repositorio
(`AGENTS.md`, `PROJECT.md`) y de la documentación de tests (`/test/README.md`).

## Índice

| Documento | Contenido |
|---|---|
| [01-concepto-y-mecanica.md](01-concepto-y-mecanica.md) | Qué es Pulsit, mecánica base tipo "Simón" |
| [02-progresion-niveles.md](02-progresion-niveles.md) | Las 10 fases del modo campaña, reglas de avance |
| [03-modo-personalizado.md](03-modo-personalizado.md) | Parámetros configurables por el jugador |
| [04-pantallas-y-flujo.md](04-pantallas-y-flujo.md) | Pantallas de la app y navegación entre ellas |
| [05-audio.md](05-audio.md) | Diseño sonoro: tonos por botón, crescendo de bienvenida |
| [06-persistencia.md](06-persistencia.md) | Qué se guarda en el dispositivo y cuándo |
| [07-criterios-de-aceptacion.md](07-criterios-de-aceptacion.md) | Checklist funcional de la especificación original |
| [08-accesibilidad-y-rejugabilidad.md](08-accesibilidad-y-rejugabilidad.md) | Háptica, modo daltónico, mejor puntaje, rotación de pantalla |

## Audiencia

Este directorio está pensado para cualquier persona (humana o agente de IA) que necesite entender
**qué debe hacer la app** sin leer el código fuente: diseño, QA manual, soporte, o un agente que
vaya a escribir nuevos tests o features y necesite el contrato funcional exacto.

Para el *cómo* está implementado (arquitectura de módulos, decisiones técnicas), ver `PROJECT.md`
en la raíz del proyecto.
