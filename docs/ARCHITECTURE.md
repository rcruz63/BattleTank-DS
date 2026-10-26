# Arquitectura — BattleTank-DS

Arquitectura del vertical slice **0.1.0**. Se deriva de [`PLAN.md`](PLAN.md) §5–§7 y §11–§12; los
contratos descritos aquí son el acuerdo entre capas, no un inventario exhaustivo del código.

> **Convención de estado.** **«Implementado»** = existe y está cubierto por tests; **«previsto»** =
> diseñado y acordado, todavía sin escribir. A fecha de redacción las fases 0–4 están cerradas y la
> fase 5 (combate) está en curso; el inventario cambia rápido y el estado operativo exacto vive en
> [`STATUS.md`](STATUS.md), no aquí.
>
> **Las firmas concretas no se fijan en prosa.** Cada capa cierra sus tipos en sus `types.ts` (o en
> el propio módulo); este documento fija responsabilidades, dependencias permitidas y flujo de datos.
> Si una firma real contradice esta prosa, manda el código y se corrige el documento.

## 1. Stack

| Pieza | Decisión |
|---|---|
| Lenguaje | **TypeScript estricto**: `strict`, `noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `verbatimModuleSyntax`, `isolatedModules`. |
| Build y dev server | **Vite 8** (`base: './'`, `target: es2022`, `outDir: dist`, sourcemaps), puerto fijo 5173. |
| Gráficos | **Canvas 2D** con resolución interna fija **1280×720** escalada por CSS con letterboxing (`index.html`). |
| HUD | **DOM/CSS** sobre el canvas + un **canvas pequeño independiente** para el radar (fase 8). |
| Tests | **Vitest** en entorno **Node** (`tests/**/*.test.ts`), sin jsdom. |
| Calidad | **ESLint** (reglas de tamaño/complejidad) + **Prettier**; puerta `npm run check`. |
| Runtime | **Cero dependencias** y **cero assets externos**: geometría procedural, tipografía del sistema, iconos CSS y audio WebAudio sintetizado. |
| Persistencia | `localStorage` solo para récord y misión desbloqueada (fase 9). |

Comandos (detalle en [`../README.md`](../README.md)): `npm run dev`, `npm run build`,
`npm run preview`, `npm test`, `npm run check`.

## 2. Principios arquitectónicos

1. **Dependencias en una sola dirección:** `main → game → {systems, render, ui, audio} → {world,
   entities, core, config}`. Sin ciclos de importación.
2. **Un único dueño del estado mutable:** `game/game.ts` crea el estado y `systems` lo actualiza.
   Render y UI **solo leen**; audio no muta nada.
3. **Simulación separada del dibujado:** paso fijo determinista; el render interpola y no altera la
   simulación.
4. **Fronteras testeables:** `core` y `world` son puros; los constructores de caras devuelven datos;
   solo el pintor toca el contexto gráfico; la parte pura de la entrada no toca el DOM; `ui`/`audio`
   son adaptadores sustituibles.
5. **Datos fuera de la lógica:** balance, tanques, materiales, paleta y misiones viven en
   `src/config/` como datos inmutables. **`src/config/tanks.ts` es la fuente de verdad del balance de
   tanques**; ningún sistema codifica esos números.
6. **Sin `Math.random()` en el juego** (RNG sembrado) ni efectos secundarios ocultos. En el render se
   evitan asignaciones innecesarias por frame; es un objetivo del presupuesto (ver §11).

## 3. Estructura real de carpetas

Estructura a fecha de la fase 5 (los módulos previstos se añaden en su fase; el inventario vivo está
en [`STATUS.md`](STATUS.md)):

```text
BattleTank-DS/
├── index.html              # shell: canvas 1280×720 + #hud-root
├── src/
│   ├── main.ts             # arranque: obtiene canvas, crea game, arranca el bucle
│   ├── config/             # datos puros editables
│   │   ├── identity.ts     #   título, subtítulo, versión
│   │   ├── balance.ts      #   viewport, cámara, arena, render, combate, luz, radio del jugador
│   │   ├── materials.ts    #   materiales: vida, altura, escombros, colores
│   │   ├── palette.ts      #   colores del mundo y del HUD
│   │   └── tanks.ts        #   stats de tanques; fuente de verdad del balance
│   ├── core/               # utilidades puras
│   │   ├── math.ts         #   vectores 2D/3D, ángulos, clamp/lerp
│   │   ├── rng.ts          #   mulberry32 determinista
│   │   ├── loop.ts         #   bucle de paso fijo + alpha de interpolación
│   │   └── events.ts       #   bus de eventos tipado
│   ├── world/              # mundo y física del terreno, sin DOM
│   │   ├── types.ts        #   celdas, mundo, spawns, parámetros de generación
│   │   ├── grid.ts         #   consultas, daño de coberturas, alcanzabilidad
│   │   ├── geometry.ts     #   distancias y utilidades geométricas
│   │   ├── generate.ts     #   generación procedural validada
│   │   ├── spawns.ts       #   colocación de enemigos y pickups
│   │   └── collision.ts    #   círculo vs rejilla con deslizamiento y subpasos
│   ├── render/             # pipeline pseudo-3D, sin mutar el estado
│   │   ├── types.ts        #   cámara, viewport, RenderFace, FaceCanvas
│   │   ├── canvas.ts       #   contexto 2D y escalado del viewport
│   │   ├── camera.ts       #   base de cámara, mundo→cámara y proyección
│   │   ├── playerCamera.ts #   cámara solidaria del jugador (periscopio)
│   │   ├── clip.ts         #   recorte de plano cercano (Sutherland–Hodgman)
│   │   ├── color.ts        #   sombreado plano, mezcla y niebla
│   │   ├── worldFaces.ts   #   caras de coberturas y escombros
│   │   ├── bulletFaces.ts  #   tracers de proyectiles (rombos billboard)
│   │   ├── background.ts   #   cielo, horizonte y rejilla del suelo
│   │   ├── painter.ts      #   ordenación y pintado de caras
│   │   ├── renderer.ts     #   composición del frame
│   │   └── periscope.ts    #   overlay de periscopio (máscara, mira, cañón, casco)
│   ├── entities/           # datos y comportamiento local
│   │   ├── player.ts       #   estado del tanque del jugador
│   │   └── bullet.ts       #   proyectil
│   ├── systems/            # reglas de juego puras sobre el estado
│   │   ├── input.ts        #   estado de entrada puro + conexión al teclado
│   │   ├── movement.ts     #   giro solidario y avance con colisión
│   │   └── combat.ts       #   recarga, disparo, proyectiles, impactos y daño a coberturas
│   ├── ui/
│   │   └── styles.css      #   estilos base del shell y el HUD
│   └── game/
│       └── game.ts         #   composición: arena, jugador, entrada, update y render
│
│   (previstos: config/missions.ts, render/models.ts, world/los.ts, world/pathfind.ts,
│    entities/enemy.ts, entities/pickup.ts, systems/ai.ts, systems/loot.ts, systems/mission.ts,
│    systems/score.ts, systems/progression.ts, ui/hud.ts, ui/radar.ts, ui/screens.ts,
│    audio/synth.ts, audio/audio.ts, game/state.ts)
├── tests/                  # espejo de src/ + integración headless
├── docs/
└── dist/                   # build generado (no versionado)
```

**No existe `render/scene.ts`.** La composición del frame está en `render/renderer.ts`; cada módulo
construye sus propias caras (`worldFaces.ts` para coberturas y escombros, `bulletFaces.ts` para
proyectiles) y `painter.ts` las ordena y pinta. `render/models.ts` (modelos de tanques y pickups) es
previsto para la fase 6.

A fecha de redacción: fases 0–4 cerradas (bootstrap, núcleo, render, mundo y jugador) y fase 5
(combate) en curso. `main.ts` crea el juego y ejecuta el bucle; el jugador se mueve y gira con
colisión, dispara proyectiles y destruye coberturas. Enemigos, pickups, HUD, misiones y audio siguen
previstos.

### Responsabilidades por módulo

| Capa | Responsabilidad | Puede importar de | Prohibido | Muta estado |
|---|---|---|---|---|
| `config` | Datos puros: balance de tanques, materiales, arena/cámara/render, paleta e identidad, `as const`. | Nada del juego. | `systems`, `render`, lógica, DOM. | No |
| `core` | Matemáticas, RNG, bucle de paso fijo, bus de eventos. | Nada del juego. | Canvas, DOM, estado de juego. | Solo estado interno del bucle/RNG |
| `world` | Rejilla, generación, spawns, geometría y colisión. | `core`, `config`. | Canvas, DOM, `render`, `ui`, `systems`. | La rejilla al generarse y al recibir daño |
| `render` | Cámara/proyección/recorte, caras del mundo y de proyectiles, fondo, pintado y overlay de periscopio. | `core` (math), `config` (paleta, materiales, balance), `world/types`, `entities` (solo datos), sus tipos. | `systems`, `ui`, `audio`, mutar el estado, `Date.now`/`Math.random`. | No |
| `entities` | Datos y comportamiento **local** del jugador y del proyectil. | `core`, `config`, `world/types`. | DOM, Canvas, `render`, `ui`. | Sus propias entidades |
| `systems` | Entrada, movimiento y combate (y, en fases posteriores, IA, loot, misión, puntuación y progresión). | `core`, `config`, `world`, `entities`. | Canvas, `render`, `ui`, `audio`; el DOM solo en el adaptador de entrada. | El estado de partida |
| `ui` | HUD, radar y pantallas (DOM/CSS + canvas del radar). | Datos ya calculados, `config`. | Lógica de juego, mutar el estado. | Solo su DOM/canvas |
| `audio` | Síntesis y reproducción WebAudio tras una interfaz de audio. | Bus de eventos / llamadas del `game`. | Estado de juego, DOM, render. | Solo su estado interno |
| `game` | Composición, dueño del estado, update/render/dispose y (más adelante) máquina de estados. | Todas las capas. | Dibujar a mano fuera de render/UI. | Sí (dueño) |
| `main` | Arranque: canvas, creación del juego y bucle. | `game`, `render/canvas`, estilos. | Lógica de juego. | No |

**El único punto de cableado es `game/game.ts`.** `main.ts` solo arranca; ningún otro módulo
construye dependencias cruzadas.

## 4. Contratos entre capas

- **`entities` vs `systems`:** las entidades guardan su estado (`PlayerState`, `Bullet`); las reglas
  viven en `systems` (`updatePlayerMovement`, `updatePlayerWeapon`, `updateProjectiles`). Si un
  comportamiento necesita coordinación entre entidades, pertenece a `systems`.
- **`world` no sabe dibujar:** la rejilla no contiene colores ni caras. `render` deriva la geometría
  de las celdas y de los proyectiles a partir de los datos que recibe.
- **`render` no muta:** recibe rejilla, cámara, viewport y proyectiles; devuelve caras
  (`RenderFace[]`) o pinta con ellas. No lee estado global, no avanza temporizadores y no modifica
  entidades. La paleta y los materiales son datos estáticos de `config/`.
- **`systems` no sabe dibujar ni sonar:** emite datos/resultados que el `game` consume; en fases
  posteriores usará el bus de eventos (`disparo`, `impacto`, `explosion`, `pickup`, `recarga`, …)
  para HUD y audio, sin mutar el estado desde los oyentes.
- **Entrada:** `systems/input.ts` separa la parte pura (`createInputState`, testeable sin DOM) del
  adaptador `bindKeyboardInput` (única pieza de `systems` que toca el DOM). El disparo es de flanco:
  se consume al consultarlo; mantener pulsado no repite.
- **Frontera render:** no hay una escena unificada. Hoy `renderWorld` recibe `WorldView` (rejilla +
  cámara); la fase 5 amplía la composición con los proyectiles para que `bulletFaces` los dibuje.
  Cuando existan enemigos y pickups (fases 6–7), la entrada del renderer se ampliará con esos datos;
  el renderer nunca recibe referencias mutables del estado de simulación más allá de los datos que
  necesita leer.
- **Dirección de dependencias permitida** (cada flecha es «importa a»; sin ciclos):

  ```text
  main → game → systems → entities → world → core
  game → render → {core, config, world/types, entities}
  game → ui, audio (fases 8/10)
  world, render, systems, ui → config (solo datos)
  ```

  `config` no importa a nadie; `render` no importa `systems`; `systems` no importa
  `render`/`ui`/`audio`.

## 5. Flujo de datos por frame

```text
requestAnimationFrame
└─ core/loop.advance(now): acumula tiempo y ejecuta N pasos fijos (con tope por frame)
   ├─ por paso: game.update(dt)
   │    ├─ systems/input.snapshot(): avance (W/S, ↑/↓), giro (A/D, ←/→) y flanco de disparo
   │    ├─ systems/movement.updatePlayerMovement: giro solidario + avance con colisión deslizante
   │    ├─ systems/combat.updatePlayerWeapon: recarga y disparo (crea proyectil)
   │    ├─ systems/combat.updateProjectiles: avance en subpasos, impactos en coberturas y
   │    │  objetivos, daño/destrucción de coberturas y caducidad de proyectiles
   │    └─ (fases 6–9: IA, loot, misión, puntuación y progresión)
   ├─ game.render(context)
   │    ├─ render/playerCamera.createPlayerCamera: posición, yaw y retroceso visual
   │    ├─ render/renderer.renderWorld: fondo y rejilla del suelo → caras del mundo
   │    │  (worldFaces) + tracers (bulletFaces) → painter ordena y pinta
   │    ├─ render/periscope.drawPeriscope: máscara, mira, cañón y casco en canvas
   │    └─ texto de estado temporal (hasta que exista el HUD en la fase 8)
   └─ (fase 8: HUD/radar DOM; fase 10: audio consume eventos)
```

- **Paso fijo:** la simulación avanza en incrementos idénticos (`core/loop.ts`, 1/60 s en el
  arranque); el render recibe el factor de interpolación entre los dos últimos estados. La
  interpolación es **solo visual**: nunca se usa para reglas ni colisiones.
- **Determinismo:** mismo estado + mismas intenciones + mismo RNG ⇒ mismo resultado. Nada del flujo
  de simulación depende del tiempo de render, del tamaño de ventana ni de `Math.random()`.
- **Protección de fondo:** el tiempo real acumulado por frame se recorta (`maxFrameSeconds`) para
  evitar avalanchas de pasos al volver de una pestaña en segundo plano.
- **Pausa/menú (previsto):** no se simula; se pinta la última escena congelada y el overlay
  correspondiente.
- **Estado actual:** `main.ts` → `createGame` → bucle. `game.update` cablea entrada y movimiento, y
  la fase 5 está incorporando el combate; `game.render` compone cámara, mundo, proyectiles y
  periscopio. El detalle exacto de la integración en curso está en [`STATUS.md`](STATUS.md).

## 6. Cámara y proyección

- Sistema de coordenadas: plano de suelo `(x, z)`, altura `y`, unidad = metro.
- Cámara en la posición del tanque + **1,7 m** (`CAMERA_DEFAULTS.eyeHeight`), `yaw` = rumbo del
  tanque (solidario), `pitch` fijo de **−4°** (`CAMERA_DEFAULTS.pitchDegrees`) y FOV horizontal
  **72°**. Valores en `src/config/balance.ts`.
- Transformación mundo→cámara: traslación por la posición de la cámara y giro por `-yaw`. Se
  proyecta con perspectiva: `x' = f·x/z`, `y' = f·y/z`, con `f = (ancho/2) / tan(fov/2)`
  (`render/camera.ts`).
- **Recorte de plano cercano** `z ≥ 0,3` mediante **Sutherland–Hodgman** en espacio de cámara antes
  de proyectar, para polígonos y segmentos (`render/clip.ts`). Evita divisiones por cero y polígonos
  que cruzan el plano.
- **Culling:** distancia máxima de dibujado (82 m por defecto) y descarte de caras traseras
  (`render/worldFaces.ts`); los proyectiles se descartan si están detrás del plano cercano
  (`render/bulletFaces.ts`). El culling por frustum/ángulo y el de objetos completos es previsto.
- **Retroceso y sacudida:** el retroceso al disparar está configurado en
  `COMBAT.recoilKickRadians` y se aplica como desplazamiento **temporal y visual** de la cámara
  (sube y vuelve); nunca altera el rumbo lógico ni la simulación. La sacudida al recibir daño llega
  con el combate contra enemigos (fase 6).
- **Escalado:** canvas interno fijo 1280×720 escalado por CSS con letterboxing. La UI vive en DOM
  encima y el radar tendrá su propio canvas (fase 8).

## 7. Pipeline de render, paso a paso

El plan describe 5 macro-pasos (§6.3); este es el desglose real de la composición actual:

1. **Culling.** Descartar caras fuera de la distancia máxima y caras traseras en `worldFaces`;
   descartar proyectiles detrás del plano cercano en `bulletFaces`. El culling por frustum/ángulo
   con margen y de objetos completos es previsto.
2. **Fondo y suelo.** Cielo, horizonte y **rejilla de suelo proyectada** se pintan primero como
   telón de fondo (`render/background.ts`); al ser lo más lejano, quedan detrás de todo.
3. **Generación de caras.** `worldFaces.ts` construye los polígonos (posición + color plano + normal)
   de coberturas intactas y escombros; `bulletFaces.ts` construye los rombos de los proyectiles
   (dos caras por proyectil: halo y núcleo). En fases posteriores se añaden tanques y pickups
   (`render/models.ts`, previsto).
4. **Mundo → cámara.** Trasladar y girar los vértices al espacio de cámara (`camera.ts`).
5. **Recorte de plano cercano** (`z ≥ 0,3`) con Sutherland–Hodgman; descartar caras completamente
   detrás de la cámara.
6. **Proyección** a coordenadas de pantalla con la distancia focal calculada del FOV.
7. **Sombreado plano y niebla.** Color por normal y **niebla de distancia** hacia el color del
   horizonte; los proyectiles usan colores de la paleta con alfa para el halo.
8. **Ordenación painter's algorithm.** Orden de **mayor a menor profundidad** (lo más lejano
   primero) y pintado con el contexto (`fillStyle` + `fill`) a través de `painter.ts`. Coberturas y
   proyectiles comparten orden: un tracer detrás de una cobertura se pinta antes y queda tapado.
9. **Overlay de periscopio.** `render/periscope.ts` pinta en el canvas la máscara oscura, la mira con
   marcas de distancia, la silueta del cañón y el borde del casco. **Decisión actual:** el overlay
   está en canvas, no es una viñeta CSS; el plan preveía CSS y se revisará en la fase 8 si el HUD lo
   requiere. Después se dibuja el texto de estado temporal hasta que exista el HUD DOM.

**Limitación conocida:** el painter's algorithm falla en intersecciones exactas de geometría. El
diseño lo evita (celdas disjuntas, sin solapes ni transparencias) y lo asume como deuda cosmética; no
hay z-buffer. Los empates de profundidad conservan el orden de entrada (el `sort` de JavaScript es
estable); si aparecen parpadeos se añadirá un criterio de desempate explícito.

## 8. Modelo de mundo, colisión y oclusión total

- **Rejilla de celdas de 4 m** sobre el plano `(x, z)`. La generación usa por defecto una arena de
  20×20 celdas (80 m); el diseño admite 16×16 a 24×24 (64–96 m). Cada celda es **vacía** o una
  **cobertura** con material, altura y vida.
- Las coberturas son **prismas de 4 caras verticales**. Sus alturas (2,4–3,4 m según material) superan
  siempre la altura de cámara (1,7 m); no hay forma de mirar por encima. Las caras superiores no son
  visibles desde abajo y no se pintan.
- **Por qué la oclusión es total mientras están intactas:**
  1. la geometría es **opaca** (sin transparencias ni recortes);
  2. la cámara está **por debajo** de la altura mínima de cobertura;
  3. no hay vista libre ni movimiento vertical de cámara;
  4. el painter pinta la cobertura delantera **después** de lo que hay detrás;
  5. cuando exista, la línea de visión de la simulación (`world/los.ts`, fase 6) usará la misma
     rejilla, de modo que lo que no se ve tampoco se puede disparar.
- **Coberturas destruidas:** `damageObstacle` reduce su vida; al llegar a 0 dejan de bloquear el paso
  (`isBlocked` exige vida > 0) y emiten solo escombros bajos (0,35–0,5 m según material,
  `materials.ts`). La visión y los proyectiles pasan por encima de los escombros; la destrucción es
  irreversible en la partida.
- **Colisión del tanque:** círculo de radio `PLAYER_RADIUS` (1,35 m) contra celdas. `world/collision`
  comprueba la ocupación (`canCircleOccupy`), mueve por **ejes separados** con **subpasos** de 0,25 m
  como máximo (`moveCircle`) y devuelve si hubo bloqueo; así el tanque desliza al chocar en diagonal
  y no atraviesa coberturas en desplazamientos grandes.
- **Borde del mundo:** cerrado por coberturas indestructibles (hormigón); no se puede salir.
- **Objetos:** tanques y proyectiles tienen posición y orientación en el plano. El proyectil es un
  `Bullet` con posición 3D, dirección, velocidad, daño, radio y edad; la simulación se hace en
  `systems/combat.ts`. Enemigos y pickups llegan en fases 6–7.
- **Limitación:** no hay verticalidad real (sin rampas, puentes, tejados ni voladizos), ni agua, ni
  transparencias. Si una fase futura los necesita, cambia el contrato de mundo y requiere ADR.

## 9. Generación procedural

Pasos, todos deterministas a partir de una semilla (implementados en la fase 3):

1. **Semilla** con `Date.now()` (RNG `mulberry32`), visible en el arranque/depuración para reproducir
   el escenario. Los tests usan semillas fijas.
2. **Borde cerrado** de coberturas indestructibles (hormigón).
3. **Grupos interiores** de coberturas con densidad por defecto del 14 % (`ARENA_DEFAULTS`);
   las misiones (fase 9) fijarán 12 % / 16 % / 20 %.
4. **Validación con _flood fill_:** las zonas alcanzables deben incluir el spawn del jugador, los
   spawns de enemigos y los pickups; no puede haber zonas aisladas inalcanzables.
5. **Colocación** del jugador, enemigos y pickups con distancias mínimas y una zona de seguridad
   alrededor del jugador, usando el RNG sembrado.
6. **Reintentos acotados** (máx. 30): si una colocación viola las reglas, se reintenta; la política
   de fallback al agotarlos sigue pendiente (hoy se muestra un error en pantalla).
7. **Salida:** rejilla de celdas + spawns iniciales + semilla; sin Canvas, sin DOM.

El coste es bajo y se ejecuta una vez por partida. Los tests comprueban determinismo por semilla,
conectividad, ausencia de solapamientos y distancias mínimas.

## 10. Testabilidad del renderer

No hay escena unificada: los constructores de caras son funciones puras y el pintor es la única pieza
que escribe en el contexto.

- **Constructores puros:** `camera`, `clip`, `color`, `worldFaces` y `bulletFaces` reciben datos
  (rejilla, cámara, viewport, proyectiles) y devuelven `RenderFace[]`. Se ejecutan en Node con
  fixtures fijos.
- **Pintor:** `painter.ts` recibe una lista de `RenderFace` y la pinta en el contrato mínimo
  `FaceCanvas` de `render/types.ts` (`fillStyle`, `beginPath`, `moveTo`, `lineTo`, `closePath`,
  `fill`). Un contexto simulado registra las operaciones y permite afirmar orden y contenido.
- **Periscopio:** usa el `CanvasRenderingContext2D` completo (`fillRect`, `strokeRect`, `arc`…), así
  que su validación es manual/visual; no entra en el contrato del pintor.
- El renderer **no** lee estado global, no usa `Date.now()`/`Math.random()` y no muta entidades. La
  paleta, materiales y valores de render son datos estáticos de `config/`.
- El detalle del contexto simulado y de la aserción de oclusión está en [`TESTING.md`](TESTING.md).
- La simulación es testeable sin Canvas: los tests de `game` inyectan `InputState` (sin teclado) y
  avanzan pasos fijos.

## 11. Presupuesto de rendimiento

- **Objetivo:** 60 fps a 1280×720 en un portátil moderno.
- **Presupuesto:** ≤ **1 500 caras visibles** y ≤ **500 operaciones de dibujo por frame**.
- **Depuración:** `F3` con fps, caras, celdas visibles y entidades es previsto; hoy el arranque
  muestra semilla y datos de estado temporales.
- **Asignaciones:** se evitan asignaciones innecesarias por frame en el render; es un objetivo del
  presupuesto que se persigue cuando las mediciones lo exigen.
- **Degradación ordenada:** si se excede, primero distancia de dibujado y culling más agresivo;
  después, reutilizar arreglos. El presupuesto es una restricción de diseño.
- El canvas interno es fijo (no HiDPI variable); el escalado es CSS. No hay imágenes ni filtros.

## 12. Límites de tamaño y complejidad

Aplicados por ESLint y obligatorios en `src/` (los tests y configs tienen exenciones parciales;
detalle exacto en [`DEVELOPMENT.md`](DEVELOPMENT.md#3-reglas-eslint)):

| Norma | Límite |
|---|---|
| Fichero | 200 líneas objetivo, **300 error** |
| Función | 40 líneas objetivo, **60 error** |
| Complejidad ciclomática | ≤ 10 |
| Anidamiento de bloques | ≤ 3 |
| Bucles anidados | prohibidos |
| Parámetros | ≤ 4 |
| Sentencias por función | ≤ 20 |

Consecuencia arquitectónica: el pipeline de render, la colisión y el combate se dividen en funciones
pequeñas (`camera`, `clip`, `color`, `worldFaces`, `bulletFaces`, `background`, `painter`;
`collision`; `combat` con recarga, disparo e impactos separados) en lugar de un fichero «gordo».

## 13. Riesgos técnicos y deuda prevista

| Riesgo | Mitigación | Estado |
|---|---|---|
| Artefactos del painter's algorithm en cruces de geometría | Celdas disjuntas, sin transparencias, orden estable por profundidad; deuda cosmética asumida | Aceptado como deuda |
| Proyectiles que atraviesan coberturas a gran velocidad | Avance en subpasos de 0,5 m y comprobación de altura de celda | Mitigado (fase 5) |
| Tracers mal ordenados respecto a coberturas | `bulletFaces` devuelve caras con profundidad y pasa por el mismo painter | Mitigado (fase 5) |
| Coste de caras en escenarios densos | Culling por distancia, límite de densidad, presupuesto de caras/operaciones | Parcial |
| Desorientación en primera persona sin vista libre | Rejilla de suelo, niebla, radar, marcas de distancia y brújula (fase 8) | Parcial |
| IA que se engancha en esquinas | A* de rejilla + evitación local + tests con semillas fijas | Previsto (fase 6) |
| Dificultad mal calibrada | Balance centralizado en `config/tanks.ts`, simulación headless y ajuste rápido | Previsto (fase 6) |
| Oclusión percibida como injusta | Enemigos con la misma LOS; coberturas destructibles y radar compensan | Diseño |
| Audio bloqueado por el navegador | Desbloqueo en el primer input; degradación silenciosa | Previsto (fase 10) |
| `localStorage` bloqueado | Persistencia best-effort; el juego sigue sin récord | Previsto (fase 9) |
| Reintentos de generación agotados | Política de fallback pendiente (relajar densidad o regenerar con otra semilla) | **Pendiente** |
| Pestaña en segundo plano acumula tiempo | `maxFrameSeconds` en `core/loop.ts` recorta el tiempo real por frame | Implementado |
| Scope creep | Alcance cerrado de 0.1.0 y lista explícita de lo que queda fuera | Diseño |

## 14. Estado de implementación

- **Fase 0 (bootstrap): cerrada.** Vite + TypeScript estricto + Vitest + ESLint + Prettier, shell,
  estilos base y documentación.
- **Fase 1 (núcleo): cerrada.** `core/math`, `core/rng`, `core/loop`, `core/events` con tests.
- **Fase 2 (render): cerrada.** Cámara, proyección, recorte, painter, color/niebla y canvas.
- **Fase 3 (mundo): cerrada.** Rejilla, materiales, generación validada, spawns, caras de
  coberturas, fondo/rejilla de suelo y daño a coberturas.
- **Fase 4 (jugador): cerrada.** Entrada de teclado, movimiento solidario, colisión deslizante,
  cámara de periscopio y overlay procedural.
- **Fase 5 (combate): en curso.** `entities/bullet`, `systems/combat` y `render/bulletFaces`
  implementan recarga, disparo, proyectiles, impactos y destrucción de coberturas; se está cerrando
  la integración y el feedback (retroceso, destellos, anillo de recarga) en `game`.
- **Fases 6–11: previstas.** Enemigos/IA, pickups, HUD, misiones, audio y pulido.

El inventario real, commit a commit, está en [`STATUS.md`](STATUS.md); el orden y los entregables de
cada fase, en [`PLAN.md`](PLAN.md) §12.
