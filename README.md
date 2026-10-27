# BATTLE TANK — PERISCOPIO

**BattleTank-DS** es un shooter de tanques en primera persona tipo periscopio, con geometría de
polígonos planos y ambientación de la Segunda Guerra Mundial. El jugador está dentro del tanque:
solo ve el sector al que apunta el cañón, el casco y la vista son solidarios, y el cañón se apunta
con el ratón dentro de un cono.
Cada partida genera un escenario con coberturas que bloquean la visión, algunas destructibles. La
campaña de 0.1.0 encadena tres misiones de dificultad creciente, con enemigos que patrullan, toman
línea de visión y disparan, pickups de curación/mejora/potencia, HUD táctico y audio sintetizado.

El repositorio es la fuente de verdad del proyecto: el alcance aprobado está en
[`docs/PLAN.md`](docs/PLAN.md) y el estado vivo (fase actual, último commit, pendientes y deuda
técnica) en [`docs/STATUS.md`](docs/STATUS.md).

## Estado

> **Versión objetivo: `0.1.0` (vertical slice jugable) — en desarrollo**, todavía no publicado.
> Al redactarse este README las fases 0–7 y los bloques 6.5 (puntería con ratón), 6.6 (colisión
> entre tanques) y 7.5 (blindaje direccional y flanqueo) están cerrados. El siguiente trabajo es el
> HUD/radar (fase 8). Ya hay un combate jugable:
> `WASD`/flechas mueven y giran el tanque, el ratón apunta el cañón dentro de un cono (la cámara y
> el casco **no** giran con él), y `Espacio` o el clic izquierdo disparan con 2,4 s de recarga. Las coberturas de madera y ladrillo se
> destruyen, los Panzer III y Tiger I esperan al acecho, detectan por línea de visión, avanzan con A*
> y disparan (el estampido de tu cañón alerta a los cercanos); el daño respeta el blindaje y la
> zona de impacto (frontal ×0,5, lateral ×1, trasera ×1,5), los enemigos solo disparan dentro de su
> arco frontal de ±15° y no giran mientras recargan, así que el flanqueo funciona; hay overlay rojo
> al recibir daño y una pantalla provisional de tanque destruido, y los tanques son sólidos: no se
> atraviesan entre sí. Ya hay pickups de cura, mejora y potencia que se recogen al pasar por encima,
> con aviso en pantalla. Faltan HUD funcional, misiones y audio. Consulta
> [`docs/STATUS.md`](docs/STATUS.md) para el estado exacto del día.

El título «BATTLE TANK — PERISCOPIO» es provisional y puede cambiarse en un commit de
documentación. La interfaz y la documentación van en español; los identificadores, tipos y nombres
de fichero del código, en inglés.

## Requisitos

- **Node.js 20 o superior** (`engines.node >= 20`); entorno de referencia: Node 24 / npm 11.
  Recomendable una versión LTS reciente.
- **npm** (incluido con Node). El proyecto usa npm; no se necesita pnpm.
- **Navegador moderno de escritorio** con Canvas 2D y WebAudio (Chrome, Edge, Firefox o Safari
  recientes). Sin soporte móvil/táctil ni gamepad en 0.1.0.
- No hay dependencias de runtime ni assets externos: `npm install` solo instala herramientas de
  desarrollo (Vite, TypeScript, Vitest, ESLint, Prettier).

## Instalación y ejecución

```bash
npm install      # instala dependencias de desarrollo
npm run dev      # servidor de desarrollo en http://localhost:5173
```

Para probar el build de producción:

```bash
npm run build    # genera dist/
npm run preview  # sirve dist/ para verificar el build
```

| Comando | Qué hace |
|---|---|
| `npm install` | Instala las dependencias de desarrollo. No hay dependencias de runtime. |
| `npm run dev` | Servidor de desarrollo con recarga en caliente en `http://localhost:5173` (puerto fijo). |
| `npm run build` | Compila el juego a `dist/` (con sourcemaps) para servirlo como estático. |
| `npm run preview` | Sirve el contenido de `dist/` para verificar el build. |
| `npm test` | Ejecuta toda la suite de Vitest una vez (entorno Node). |
| `npm run test:watch` | Vitest en modo vigilancia durante el desarrollo. |
| `npm run typecheck` | Comprobación de tipos con `tsc --noEmit`. |
| `npm run lint` | ESLint sobre todo el repositorio, sin warnings permitidos. |
| `npm run format` / `npm run format:check` | Formatea con Prettier / comprueba el formato sin escribir. |
| `npm run check` | **Puerta de calidad**: typecheck + lint + tests + build. Obligatoria antes de cada commit. |

## Controles

| Acción | Entrada | Estado |
|---|---|---|
| Avanzar / retroceder | `W` / `S` o `↑` / `↓` | **Disponible.** Con inercia ligera; el tanque no se desplaza de lado. |
| Girar | `A` / `D` o `←` / `→` | **Disponible.** Gira el casco y con él la vista (sin torreta independiente). |
| Apuntar | Ratón sobre el canvas | **Disponible.** Mueve el cañón dentro de un cono de ±15° horizontal y ±4° vertical respecto al rumbo del tanque. La cámara no gira con el ratón. |
| Disparar | `Espacio` o clic izquierdo | **Disponible.** Un disparo por pulsación, sin fuego automático; recarga de 2,4 s. |
| Pausa | `Esc` | Previsto (fase 8): menú de pausa, volumen y récord. |
| Silenciar | `M` | Previsto (fase 10). |
| Depuración | `F3` | Previsto: overlay con fps, caras, celdas visibles y entidades. |

No hay free-look (la cámara sigue al casco), ni torreta independiente, ni gamepad/móvil en 0.1.0.
El cursor del sistema se oculta sobre el canvas; la retícula es la única referencia de puntería (el
periscopio no dibuja el cañón) y en el centro queda una marca tenue del rumbo del casco. Mientras
llega el HUD definitivo (fase 8),
la pantalla muestra un texto temporal con semilla, enemigos vivos, proyectiles, vida y estado de
recarga. Todos los detalles de diseño están en [`docs/GAME_DESIGN.md`](docs/GAME_DESIGN.md).

## Depuración

- **Escenario reproducible:** arranca con `npm run dev` y abre
  `http://localhost:5173/?seed=123`. La misma semilla genera el mismo escenario, reparto de enemigos
  y spawns; sin el parámetro se usa la hora actual. Sirve para reproducir un bug o comparar cambios
  de balance.
- **Inspección desde la consola:** `main.ts` expone `window.__BT__` con la instancia del juego
  (`Game`): `__BT__.seed`, `__BT__.player`, `__BT__.enemies`, `__BT__.bullets`, `__BT__.arena`. Es un
  gancho de depuración/QA, no una API estable del juego; puede cambiar entre fases.

Ambos ganchos son solo para desarrollo y pruebas: la lógica del juego no debe depender de ellos.

## Estructura resumida

```text
BattleTank-DS/
├── index.html          # shell: canvas 1280×720 + contenedor del HUD
├── src/
│   ├── main.ts         # arranque: canvas, entrada (teclado + ratón), createGame y bucle
│   ├── config/         # datos puros: balance, materiales, tanques, paleta, pickups e identidad
│   ├── core/           # matemáticas, RNG determinista, bucle de paso fijo, eventos
│   ├── world/          # rejilla, generación, spawns, geometría, colisión, LOS y A*
│   ├── render/         # cámara, caras, modelos de tanques y pickups, painter, overlays y periscopio
│   ├── entities/       # jugador, proyectil, enemigo y pickup
│   ├── systems/        # entrada, puntería, movimiento, combate, IA, loot, daño y blindaje (misión y puntuación después)
│   ├── ui/             # estilos base; HUD, radar y pantallas en la fase 8
│   ├── audio/          # efectos sintetizados con WebAudio (fase 10)
│   └── game/           # composición actual (createGame); máquina de estados en fases 8-9
├── tests/              # espejo de src/ (183 tests en 31 ficheros) + integración headless
├── docs/               # plan, estado y documentación del proyecto
└── dist/               # build generado (no versionado)
```

No existe una carpeta `render/scene.ts`: la composición del frame vive en `render/renderer.ts`, que
junta coberturas (`worldFaces.ts`), tanques enemigos (`models.ts`) y proyectiles (`bulletFaces.ts`),
proyecta una sola lista de caras (`faces.ts`) y la pinta con el painter. La puntería es matemática
pura en `systems/aim.ts`; `main.ts` enlaza teclado y ratón y `game.ts` recibe el `InputState`
inyectado. El estado por fase y el inventario exacto están en [`docs/STATUS.md`](docs/STATUS.md); la
estructura completa, los contratos entre capas y el pipeline de render, en
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Persistencia

Se usa `localStorage` solo para dos datos: el **récord de puntos** y la **misión máxima
desbloqueada**. No hay guardado a mitad de partida: al morir se pierden la partida y los pickups
acumulados, y se reintenta desde el principio de la misión actual. Si el navegador bloquea el
almacenamiento, el juego debe seguir funcionando sin persistencia (degradación silenciosa).

## Limitaciones conocidas y siguiente paso

- **HUD y avisos definitivos (fase 8):** los efectos de los pickups y la zona de impacto
  (frontal/lateral/trasera) ya existen, pero sus iconos, avisos y cuenta atrás viven en el panel
  temporal del canvas hasta el HUD.
- **`BUG-001` corregido en el bloque 6.6:** el jugador y los enemigos ya no se atraviesan; cada
  tanque vivo bloquea el paso del otro con la suma de radios más 0,15 m de separación de seguridad.
  Detalle y tests en [`docs/STATUS.md`](docs/STATUS.md) y [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) §8.

## Documentación

| Documento | Propósito |
|---|---|
| [`docs/PLAN.md`](docs/PLAN.md) | Plan aprobado: alcance, arquitectura, fases y criterios de aceptación. Es la fuente de verdad del alcance. |
| [`docs/STATUS.md`](docs/STATUS.md) | Estado vivo: hecho, en curso, pendiente, deuda técnica y cómo retomar. |
| [`docs/GAME_DESIGN.md`](docs/GAME_DESIGN.md) | Diseño de juego: bucle, controles, HUD, coberturas, pickups, enemigos, misiones, balance. |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Módulos, contratos entre capas, flujo por frame y pipeline pseudo-3D. |
| [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) | Normas de código, ESLint, git, changelog, definición de terminado y plantillas. |
| [`docs/DECISIONS.md`](docs/DECISIONS.md) | ADRs cortos: decisiones tomadas, porqué y consecuencias. |
| [`docs/TESTING.md`](docs/TESTING.md) | Estrategia de pruebas, convenciones y checklist manual de QA. |
| [`AGENTS.md`](AGENTS.md) | Cómo retomar el proyecto (humano o IA): orden de lectura, comandos y límites. |
| [`CHANGELOG.md`](CHANGELOG.md) | Historial de cambios por versión y feature (Keep a Changelog, en español). |

## Normas de commits y changelog

- **Conventional Commits**, un commit atómico por feature, con tests y documentación en el mismo
  commit: `tipo(scope): descripción en español, imperativa y corta`.
  Tipos: `feat`, `fix`, `docs`, `chore`, `test`, `refactor`, `perf`, `style`.
  Ejemplos: `feat(render): pipeline de cámara, recorte y painter`,
  `feat(ai): enemigos con línea de visión y máquina de estados`,
  `docs(status): handoff tras fase 4`.
- Antes de cada commit, **`npm run check` en verde**. Nunca se deja `main` roto. Los commits los
  hace el Lead para mantener la historia limpia.
- [`CHANGELOG.md`](CHANGELOG.md) y [`docs/STATUS.md`](docs/STATUS.md) se actualizan **en el mismo
  commit** que la feature; no se aplazan al final de la fase.
- Al cerrar la fase 11 se etiqueta `v0.1.0`.
- Las normas completas (límites de código, plantillas de tarea, flujo de trabajo) están en
  [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md). Para agentes de IA, el punto de entrada es
  [`AGENTS.md`](AGENTS.md).

## Licencia

Todavía no hay licencia declarada en el repositorio; queda pendiente de decisión del usuario. No se
asume ninguna licencia por defecto sobre el código ni sobre el nombre del juego.
