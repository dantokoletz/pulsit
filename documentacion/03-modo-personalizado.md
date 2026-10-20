# 3. Modo personalizado

El modo personalizado permite al jugador configurar su propia partida, fuera de la progresión
fija del modo campaña.

## Parámetros configurables

| Parámetro | Rango / valores | Por defecto |
|---|---|---|
| Cantidad de botones | 3 a 9 | 4 |
| Tipo de estímulo | `colores` / `números` / `ambos` | colores |
| ¿Cambian de posición? | Sí / No | No |
| Sonido | Activado / Desactivado | Activado |
| Longitud máxima de secuencia | Entero ≥ 2 | 10 |

### Tipo de estímulo "ambos"

Cuando el jugador elige "ambos", **cada botón combina los dos estímulos a la vez**: tiene un color
de fondo y además muestra su número, en vez de alternar botones puramente de color con botones
puramente numéricos. Esto aumenta la dificultad (el jugador puede apoyarse en cualquiera de los
dos estímulos para memorizar) sin dejar ningún botón "a medias". Cada botón conserva su color y
número fijos durante toda la partida; lo que puede cambiar (si está activado el reposicionamiento)
es su posición en pantalla.

## Validación

Antes de guardar o iniciar una partida personalizada, la configuración se valida:

- `buttons` debe ser un entero entre 3 y 9.
- `stimulusType` debe ser uno de `colors`, `numbers`, `both`.
- `maxSequenceLength` debe ser un entero mayor o igual a 2.

Si la validación falla, la app debe informar el error al jugador y **no** debe guardar la
configuración inválida ni iniciar la partida.

## Persistencia

La configuración personalizada se guarda en el dispositivo (ver
[06-persistencia.md](06-persistencia.md)) y se restaura automáticamente la próxima vez que el
jugador abre la pantalla de modo personalizado, de modo que no tenga que volver a configurarla
desde cero.

## Condición de fin de partida

Igual que en el modo campaña: la partida termina en victoria al completar correctamente una
secuencia de longitud igual a `maxSequenceLength`, o en derrota en el momento en que el jugador
pulsa un botón incorrecto.
