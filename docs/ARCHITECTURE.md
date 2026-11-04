# Arquitectura — BattleTank-DS

Arquitectura del vertical slice **0.1.0**. Se deriva de [`PLAN.md`](PLAN.md) §5–§7 y §11–§12; los
contratos descritos aquí son el acuerdo entre capas, no un inventario exhaustivo del código.

> **Convención de estado.** **«Implementado»** = existe y está cubierto por tests; **«previsto»** =
> diseñado y acordado, todavía sin escribir. A fecha 2026-10-30 las fases 0–10 y los bloques 6.5
> (puntería con ratón), 6.6 (colisión entre tanques), 7.5 (blindaje direccional) y 7.5.1
> (claridad/feedback) están cerrados; la siguiente es la fase 11 (pulido y entrega). El inventario
> vivo está en [`STATUS.md`](STATUS.md), no aquí.
>
> **Las firmas concretas no se fijan en prosa.** Cada capa cierra sus tipos en sus `types.ts` (o en
> el propio módulo); este documento fija responsabilidades, dependencias permitidas y flujo de datos.
> Si una firma real contradice esta prosa, manda el código y se corrige el documento.

## 1. Stack

| Pieza              | Decisión                                                                                                                                                                        |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lenguaje           | **TypeScript estricto**: `strict`, `noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `verbatimModuleSyntax`, `isolatedModules`. |
| Build y dev server | **Vite 8** (`base: './'`, `target: es2022`, `outDir: dist`, sourcemaps), puerto fijo 5273.                                                                                      |
| Gráficos           | **Canvas 2D** con resolución interna fija **1280×720** escalada por CSS con letterboxing (`index.html`).                                                                        |
| HUD                | **DOM/CSS** sobre el canvas + un **canvas pequeño independiente** para el radar (implementado).                                                                                 |
| Tests              | **Vitest** en entorno **Node** (`tests/**/*.test.ts`), sin jsdom; **239 tests en 40 ficheros**.                                                                                 |
| Calidad            | **ESLint** (tamaño/complejidad) + **Prettier**; puerta `npm run check`.                                                                                                         |
| Runtime            | **Cero dependencias** y **cero assets externos**: geometría procedural, tipografía del sistema, iconos CSS y audio WebAudio sintetizado.                                        |
| Persistencia       | `localStorage` solo para récord y misión desbloqueada, clave `battletank-ds.progression.v1` (fase 9).                                                                           |

Comandos (detalle en [`../README.md`](../README.md)): `npm run dev`, `npm run build`,
`npm run preview`, `npm test`, `npm run check`.

## 2. Principios arquitectónicos

1. **Dependencias en una sola dirección:** `main → game → {systems, render, ui, audio} → {world,
entities, core, config}`. Sin ciclos de importación.
2. **Un único dueño del estado mutable:** `game/game.ts` crea el estado y `systems` lo actualiza.
   Render y UI **solo leen**; audio no muta nada. El cableado DOM de la entrada (teclado y ratón)
   vive en `main.ts`, que inyecta un `InputState`; `game.ts` no enlaza eventos.
3. **Simulación separada del dibujado:** paso fijo determinista; el render no altera la simulación.
4. **Fronteras testeables:** `core`, `world`, la puntería y las funciones de caras son puras; solo
   el pintor toca el contrato gráfico; la parte pura de entrada e IA no toca el DOM; `ui`/`audio`
   son adaptadores sustituibles.
5. **Datos fuera de la lógica:** balance, tanques, materiales, paleta y misiones viven en
   `src/config/` como datos inmutables. **`src/config/tanks.ts` es la fuente de verdad del balance de
   tanques**; ningún sistema codifica esos números.
6. **Determinismo:** RNG sembrado (escenario y IA con semillas derivadas), sin `Math.random()` en el
   juego y sin depender del reloj o del tamaño de ventana en la simulación.

## 3. Estructura real de carpetas

Estructura a fecha de la fase 11 (los módulos previstos se añaden en su fase; el inventario vivo
está en [`STATUS.md`](STATUS.md)):

```text
BattleTank-DS/
├── index.html              # shell: canvas 1280×720 + #hud-root
├── src/
│   ├── main.ts             # arranque, entrada teclado+ratón, ?seed= y window.__BT__
│   ├── global.d.ts         # tipado de window.__BT__ (gancho de desarrollo)
│   ├── config/             # datos puros editables
│   │   ├── identity.ts     #   título, subtítulo, versión
│   │   ├── balance.ts      #   cámara, arena, render, combate, IA, puntuación, blindaje y puntería
│   │   ├── materials.ts    #   materiales: vida, altura, escombros, colores
│   │   ├── missions.ts     #   campaña: 3 misiones, enemigos, arena, IA y bonus
│   │   ├── pickups.ts      #   efectos, colores y reparto de botiquín, mejora y potencia
│   │   ├── palette.ts      #   colores del mundo y del HUD
│   │   └── tanks.ts        #   stats y colores de tanques; fuente de verdad del balance
│   ├── core/               # utilidades puras
│   │   ├── math.ts         #   vectores 2D/3D, ángulos, clamp/lerp, rotateTowards
│   │   ├── rng.ts          #   mulberry32 determinista
│   │   ├── loop.ts         #   bucle de paso fijo + alpha de interpolación
│   │   └── events.ts       #   bus de eventos tipado
│   ├── world/              # mundo y física del terreno, sin DOM
│   │   ├── types.ts        #   celdas, mundo, spawns, parámetros de generación
│   │   ├── grid.ts         #   consultas, daño de coberturas, alcanzabilidad
│   │   ├── geometry.ts     #   distancias y utilidades geométricas
│   │   ├── generate.ts     #   generación procedural validada
│   │   ├── spawns.ts       #   colocación de enemigos y pickups
│   │   ├── collision.ts    #   círculo vs rejilla con deslizamiento y subpasos
│   │   ├── entityCollision.ts # bloqueadores dinámicos entre tanques y separación de seguridad
│   │   ├── los.ts          #   línea de visión por muestreo (coberturas intactas bloquean)
│   │   └── pathfind.ts     #   A* de 4 direcciones con lista abierta ordenada
│   ├── render/             # pipeline pseudo-3D, sin mutar el estado
│   │   ├── types.ts        #   cámara, viewport, RenderFace, FaceCanvas
│   │   ├── canvas.ts       #   contexto 2D, escalado y overlayTint
│   │   ├── camera.ts       #   base de cámara, mundo→cámara y proyección
│   │   ├── playerCamera.ts #   cámara solidaria del jugador (periscopio)
│   │   ├── clip.ts         #   recorte de plano cercano (Sutherland–Hodgman)
│   │   ├── color.ts        #   sombreado plano, mezcla y niebla
│   │   ├── faces.ts        #   WorldFace + projectWorldFaces (culling, recorte, sombreado, niebla)
│   │   ├── worldFaces.ts   #   caras de coberturas y escombros (buildWallWorldFaces)
│   │   ├── boxes.ts        #   cajas opacas reutilizables (tanques y pickups)
│   │   ├── models.ts       #   cajas rotadas del tanque enemigo y fogonazo del cañón
│   │   ├── pickupFaces.ts  #   caja, marca de suelo e icono flotante de los pickups
│   │   ├── bulletFaces.ts  #   tracers de proyectiles (rombos billboard)
│   │   ├── background.ts   #   cielo, horizonte y rejilla del suelo
│   │   ├── painter.ts      #   ordenación y pintado de caras
│   │   ├── renderer.ts     #   composición: coberturas + tanques + pickups + proyectiles
│   │   ├── combatFeedback.ts # barras de vida (con recarga enemiga) y daño flotante con zona
│   │   ├── damageIndicator.ts # arco direccional del daño recibido en el borde
│   │   └── periscope.ts    #   overlay: máscara, retícula móvil, recarga y marca de impacto
│   ├── entities/           # datos y comportamiento local
│   │   ├── player.ts       #   estado del tanque del jugador
│   │   ├── bullet.ts       #   proyectil
│   │   ├── pickup.ts       #   estado del botiquín, la mejora y la potencia
│   │   └── enemy.ts        #   estado del Panzer III / Tiger I y su modo de IA
│   ├── systems/            # reglas de juego puras sobre el estado
│   │   ├── input.ts        #   entrada pura (teclado/ratón) + adaptadores DOM
│   │   ├── aim.ts          #   puntero normalizado → cono de cañón y punto de retícula
│   │   ├── movement.ts     #   giro solidario y avance con colisión contra rejilla y tanques
│   │   ├── combat.ts       #   recarga, disparo, proyectiles 3D y zona del impacto
│   │   ├── damage.ts       #   impacto: blindaje base, mejoras, zona direccional y muerte
│   │   ├── loot.ts         #   recogida, efectos y temporizadores de los pickups
│   │   ├── feedback.ts     #   visibilidad, marca de impacto, rumbo del daño y caducidad de popups
│   │   ├── armor.ts        #   clasificación de zona y multiplicadores de blindaje
│   │   ├── mission.ts      #   semillas, parámetros de arena, reparto y bonus de misión
│   │   ├── progression.ts  #   récord/misión desbloqueada con localStorage best-effort
│   │   └── ai.ts           #   percepción, alerta, avance, arco de fuego y ataque
│   ├── audio/
│   │   ├── audio.ts        #   bus WebAudio, unlock, volumen/mute y fallback silencioso
│   │   └── synth.ts        #   síntesis procedural de efectos y motor
│   ├── ui/
│   │   ├── styles.css      #   base, viñeta de periscopio, paneles, pausa y pantallas
│   │   ├── hud.ts          #   adaptador DOM: barras, viñeta de daño, efectos, avisos, pantallas y radar
│   │   ├── hudView.ts      #   modelo puro del HUD (vida/nivel, avance, recarga, efectos, audio, radar)
│   │   └── radar.ts        #   modelo puro de contactos + pintado del radar circular
│   └── game/
│       ├── game.ts         #   composición y API pública (getters de la sesión)
│       ├── session.ts      #   sesión de misión: arena, entidades y estadísticas
│       ├── simulation.ts   #   paso de simulación, impacto, fin de misión y cambio de pantalla
│       ├── state.ts        #   estado mutable de partida y efectos transitorios
│       ├── hudData.ts      #   adaptación del estado a los datos del HUD
│       └── render.ts       #   render del mundo + periscopio (el HUD DOM va aparte)
│
├── tests/                  # espejo de src/ (40 ficheros, 239 tests) + integración headless
├── docs/
└── dist/                   # build generado (no versionado)
```

**No existe `render/scene.ts`.** La composición del frame vive en `render/renderer.ts`: reúne las
caras de mundo de coberturas (`worldFaces.ts`) y tanques (`models.ts`), las proyecta en **una sola
pasada** con `faces.ts`, añade los tracers de proyectiles (`bulletFaces.ts`) y deja que `painter.ts`
ordene y pinte. `buildWorldFaces` sigue existiendo como atajo para tests de proyección.

A fecha 2026-10-30 las fases 0–10 y los bloques 6.5, 6.6, 7.5 y 7.5.1 están cerrados: el jugador se
mueve, apunta y dispara dentro del cono, no puede atravesar tanques, recoge pickups con sus efectos
y el combate premia el flanqueo; las coberturas se destruyen, los enemigos esperan/avanzan/atacan con
LOS y A* y solo disparan dentro de su arco frontal. El HUD DOM muestra vida, avance, misión,
puntuación, recarga, efectos, audio y radar; `ESC` pausa y `ENTER` confirma briefing/resúmenes. La
campaña tiene tres misiones, victoria/derrota y persistencia. El siguiente trabajo es el **pulido y la
entrega (fase 11)**; el audio ya está cerrado (fase 10).

### Responsabilidades por módulo

| Capa       | Responsabilidad                                                                                                            | Puede importar de                                                      | Prohibido                                                                   | Muta estado                               |
| ---------- | -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------- | ----------------------------------------- |
| `config`   | Datos puros: balance de tanques, materiales, pickups, misiones, arena/cámara/render/IA, paleta e identidad, `as const`.    | Nada del juego.                                                        | `systems`, `render`, lógica, DOM.                                           | No                                        |
| `core`     | Matemáticas, RNG, bucle, bus de eventos.                                                                                   | Nada del juego.                                                        | Canvas, DOM, estado de juego.                                               | Solo estado interno                       |
| `world`    | Rejilla, generación, spawns, geometría, colisión con rejilla y entre tanques, línea de visión y A*.                        | `core`, `config`.                                                      | Canvas, DOM, `render`, `ui`, `systems`.                                     | La rejilla al generarse y al recibir daño |
| `render`   | Cámara/proyección, caras de mundo, de tanques y de pickups, modelos, fondo, pintado y overlays.                            | `core` (math), `config`, `world/types`, `entities` (datos), sus tipos. | `systems`, `ui`, `audio`, mutar el estado, `Date.now`/`Math.random`.        | No                                        |
| `entities` | Datos y comportamiento local de jugador, proyectil, enemigo y pickup.                                                      | `core`, `config`, `world/types`.                                       | DOM, Canvas, `render`, `ui`.                                                | Sus propias entidades                     |
| `systems`  | Entrada, puntería, movimiento, combate, daño, blindaje direccional, pickups, IA, misión, bonus de puntuación y progresión. | `core`, `config`, `world`, `entities`.                                 | Canvas, `render`, `ui`, `audio`; el DOM solo en los adaptadores de entrada. | El estado de partida                      |
| `ui`       | HUD, radar y pantallas (DOM/CSS + canvas del radar).                                                                       | Datos ya calculados, `config`.                                         | Lógica de juego, mutar el estado.                                           | Solo su DOM/canvas                        |
| `audio`    | Síntesis y reproducción WebAudio tras una interfaz de audio.                                                               | Bus de eventos / llamadas del `game`.                                  | Estado de juego, DOM, render.                                               | Solo su estado interno                    |
| `game`     | Composición, dueño del estado, efectos, update/render/dispose y máquina de estados de campaña.                             | Todas las capas.                                                       | Dibujar a mano fuera de render/UI.                                          | Sí (dueño)                                |
| `main`     | Arranque, semilla desde URL, enlace de teclado/ratón, inyección del `InputState` y `window.__BT__`.                        | `game`, `render/canvas`, `systems/input`, estilos.                     | Lógica de juego.                                                            | No                                        |

**El cableado de la composición es `game/game.ts` y el de la entrada DOM es `main.ts`.** `main.ts`
crea el `InputState`, enlaza teclado y ratón, inyecta el estado y expone el gancho de depuración
tipado en `global.d.ts`; `game.ts` no enlaza eventos, de modo que los tests inyectan entrada pura.

## 4. Contratos entre capas

- **`entities` vs `systems`:** las entidades guardan su estado (`PlayerState`, `Bullet`,
  `EnemyState`); las reglas viven en `systems` (`updatePlayerMovement`, `updatePlayerWeapon`,
  `updateProjectiles`, `updateEnemies`). La IA no se implementa dentro del enemigo: `systems/ai.ts`
  lee y muta su estado.
- **Colisión en dos niveles:** `world/collision.ts` resuelve el círculo contra la rejilla y expone
  `moveCircleWith`, que admite una comprobación de ocupación adicional; `world/entityCollision.ts`
  añade los tanques **vivos** como bloqueadores circulares con separación de seguridad. El movimiento
  del jugador (`systems/movement`) y el avance de la IA (`systems/ai`) usan esa variante, así que
  ningún tanque atraviesa a otro; los destruidos dejan de bloquear.
- **`world` no sabe dibujar:** la rejilla no contiene colores ni caras. `render` deriva la geometría
  de las celdas, de los tanques y de los proyectiles a partir de los datos que recibe.
- **LOS y pathfinding compartidos:** `world/los.ts` y `world/pathfind.ts` son puros y deterministas;
  los usan la IA y (en el futuro) el jugador/UX. Una cobertura intacta bloquea; los escombros no.
- **`render` no muta:** recibe rejilla, cámara, viewport, enemigos, pickups y proyectiles; devuelve
  caras o pinta con ellas. No lee estado global, no avanza temporizadores y no modifica entidades. Paleta,
  materiales y valores de render son datos estáticos de `config/`.
- **Dos pasos de render:** (1) construir `WorldFace[]` con `buildWallWorldFaces`,
  `tankWorldFaces` y `pickupWorldFaces`; (2) proyectarlas todas juntas con `projectWorldFaces` y
  añadir los tracers. Así tanques, pickups y coberturas comparten el mismo orden de profundidad y la
  oclusión es coherente.
- **IA determinista:** `updateEnemies` recibe `rng` inyectado (derivado de la semilla del juego),
  lee el jugador y la rejilla y empuja balas a la lista; no toca DOM ni render. La percepción usa
  `hasLineOfSight`; el avance usa `findPath`. Parámetros en `AI_TUNING` (`balance.ts`): detección,
  alcance de ataque, reacción, arco de fuego (±15°), dispersión, intervalo de ruta y factor de
  velocidad; las misiones los ajustan en `config/missions.ts`. Mientras recarga mantiene el rumbo (no corrige el
  apuntado): es la ventana de flanqueo del bloque 7.5.
- **Alerta por estampido:** al disparar el jugador, `alertEnemiesNear` despierta a los enemigos a
  menos de 60 m (`FIRE_ALERT_RADIUS` en `game.ts`). Un enemigo alertado avanza si no ve al jugador.
- **Combate:** `systems/combat` calcula impactos con daño base; el proyectil del jugador sale del
  pivote de la torreta + 2,2 m de tubo y lleva la dirección 3D de la mira (el cabeceo cuenta). Hay
  impacto contra coberturas, contra tanques (cilindro de 2,2 m de alto) y **contra el suelo**; un
  disparo alto puede pasar por encima de un tanque. `game` filtra objetivos por facción (sin fuego
  amigo) y delega el daño en `systems/damage.ts`, que aplica el **blindaje base, las mejoras**
  (`(1 − armor) × 0,9^mejoras`) **y la zona direccional** (×0,5/×1,0/×1,5) y actualiza vida/muerte;
  `systems/combat` acepta multiplicadores de daño y recarga para la potencia y adjunta `zone` al
  evento de impacto. Los enemigos usan el mismo `Bullet` y las mismas colisiones.
- **Pickups y daño:** `entities/pickup.ts` guarda los pickups; `systems/loot.ts` recoge a 2 m,
  aplica cura/mejora/potencia, mantiene el temporizador y expone los multiplicadores de daño y
  recarga; `systems/damage.ts` aplica el impacto con blindaje base, mejoras y zona direccional y
  actualiza vida/muerte. `render` solo dibuja los pickups no recogidos.
- **Blindaje direccional:** `systems/armor.ts` clasifica la zona de impacto respecto al rumbo del
  blanco (frontal ≤60°, lateral ≤120°, trasera >120°) con la dirección del proyectil y devuelve
  ×0,5/×1,0/×1,5. `systems/combat` adjunta `zone` al `ProjectileEvent`; `systems/damage` aplica el
  multiplicador **después** del blindaje base y de las mejoras. Es simétrico para jugador y
  enemigos; el daño flotante ya muestra la zona. La IA solo dispara si el jugador está dentro de su
  arco de ±15° y no corrige el rumbo mientras recarga. Valores en `config/balance.ts`.
- **Dirección de dependencias permitida** (cada flecha es «importa a»; sin ciclos):

  ```text
  main → game → systems → entities → world → core
  game → render → {core, config, world/types, entities}
  game → ui, audio
  world, render, systems, ui → config (solo datos)
  ```

  `config` no importa a nadie; `render` no importa `systems`; `systems` no importa
  `render`/`ui`/`audio`.

## 5. Flujo de datos por frame

```text
main.ts: createInputState → bindKeyboardInput + bindMouseInput(canvas) → createGame({ seed, input })

requestAnimationFrame
└─ core/loop.advance(now): acumula tiempo y ejecuta N pasos fijos (con tope por frame)
   ├─ por paso: game.update(dt)
   │    ├─ systems/input.snapshot(): avance (W/S, ↑/↓), giro (A/D, ←/→), flanco de disparo,
   │    │  puntero normalizado (aimX/aimY) y flanco de pausa (ESC)
   │    ├─ systems/movement.updatePlayerMovement: giro solidario + avance con colisión deslizante
   │    │  contra la rejilla y contra los tanques enemigos vivos
   │    ├─ systems/aim.resolveAim: rumbo del casco + puntero → dirección 3D del cañón y punto de
   │    │  retícula en pantalla (cono de ±15° / ±4°; la cámara no gira)
   │    ├─ systems/combat.updatePlayerWeapon: recarga y disparo en la dirección de la mira; si
   │    │  dispara, alerta a ≤ 60 m, activa retroceso y suena el cañón
   │    ├─ systems/ai.updateEnemies: temporizadores, percepción por LOS, alerta, ataque (arco de
   │    │  fuego ±15°, sin corregir rumbo al recargar) o avance con A* y colisión; devuelve los
   │    │  disparos del paso y `game` suena `enemy-fire`
   │    ├─ systems/combat.updateProjectiles: subpasos con dirección 3D, impactos en coberturas,
   │    │  tanques (altura 2,2 m) o suelo, zona de blindaje, daño/destrucción y eventos
   │    ├─ systems/loot.updateLoot + collectPickups: temporizadores y recogida a 2 m con su efecto
   │    ├─ systems/damage.applyProjectileHit: blindaje base + mejoras + zona, vida/muerte y flash
   │    └─ game/simulation: puntuación por derribo (SCORE_REWARDS), victoria/derrota, bonus de
   │       misión, récord/desbloqueo y guardado best-effort de la progresión
   ├─ game.render(context)
   │    ├─ render/playerCamera.createPlayerCamera + retroceso de cámara (solo visual; sin aim)
   │    ├─ render/renderer.renderWorld: fondo y rejilla → caras de coberturas + tanques + pickups
   │    │  → projectWorldFaces (culling, recorte, sombreado, niebla) → tracers → painter
   │    ├─ render/periscope.drawPeriscope: máscara, retícula y marcas en el punto de mira, marca
   │    │  del rumbo del casco, anillo de recarga y marca de impacto (sin cañón dibujado)
   │    └─ render/combatFeedback: barras de vida y daños flotantes del mundo
   ├─ ui.hud.update(buildHudView(game.getHudData()))
   │    ├─ barras de vida/avance, misión, puntuación, recarga, efectos, audio y aviso (DOM/CSS)
   │    ├─ ui.radar: contactos a 45 m orientados con el rumbo y barrido animado (canvas)
   │    └─ pantallas: briefing, victoria, derrota y fin de campaña; pausa (ESC)
   └─ audio.play/setEngine/setMuted/setVolume (bus WebAudio sintetizado, fallback silencioso)
```

- **Paso fijo:** la simulación avanza en incrementos idénticos (`core/loop.ts`, 1/60 s en el
  arranque). No hay interpolación aplicada al dibujado todavía; cuando se use, será **solo visual**.
- **Determinismo:** mismo estado + mismas intenciones + mismos RNG ⇒ mismo resultado. La IA usa un
  RNG derivado de la semilla (`seed ^ 0x9e3779b9`); la semilla del escenario puede fijarse con
  `?seed=` para reproducir una partida.
- **Protección de fondo:** el tiempo real acumulado por frame se recorta (`maxFrameSeconds`).
- **Ganchos de depuración:** `main.ts` lee `?seed=123` y expone `window.__BT__` (tipado en
  `global.d.ts`) para inspeccionar/recolocar estado desde la consola en desarrollo. No forman parte
  de la lógica ni de la API del juego.
- **Estado actual:** `main.ts` enlaza teclado/ratón, inyecta el `InputState` y arranca el bucle.
  `game.update` resuelve la puntería y cablea movimiento, IA, combate, pickups, daño, puntuación,
  campaña, audio y efectos; `game.render` compone cámara, mundo, tanques, pickups, proyectiles,
  periscopio (con la retícula en el punto de mira), feedback de combate y tinte de daño. El detalle
  exacto está en [`STATUS.md`](STATUS.md).

## 6. Cámara y proyección

- Sistema de coordenadas: plano de suelo `(x, z)`, altura `y`, unidad = metro.
- Cámara en la posición del tanque + **1,7 m**, `yaw` = rumbo del tanque (solidario), `pitch` base
  **0°** y FOV horizontal **72°** (`CAMERA_DEFAULTS` en `balance.ts`). El pitch base 0 hace que la
  retícula centrada corresponda a un tiro horizontal. **La cámara no gira con el ratón**: el ratón
  solo orienta el cañón dentro del cono.
- Transformación mundo→cámara y proyección perspectiva (`render/camera.ts`):
  `x' = f·x/z`, `y' = f·y/z`, con `f = (ancho/2) / tan(fov/2)`.
- **Recorte de plano cercano** `z ≥ 0,3` con **Sutherland–Hodgman** para polígonos y segmentos
  (`render/clip.ts`), antes de proyectar.
- **Culling:** distancia máxima de dibujado (82 m), caras traseras (`faces.ts` descarta si la normal
  mira en contra de la cámara) y caras de coberturas que tocan otra cobertura intacta. Los
  proyectiles se descartan si están detrás del plano cercano.
- **Retroceso:** `game` aplica un retroceso **temporal y visual** de la cámara al disparar
  (`COMBAT.recoilKickRadians` de pitch y 0,1 m hacia atrás, con desvanecimiento); nunca altera el
  rumbo lógico ni la simulación ni la dirección del disparo. La sacudida por daño se sustituye de
  momento por el overlay rojo (tinte al recibir impacto y viñeta de vida baja).
- **Puntería:** el cañón vive en un cono de ±15° de giro y ±4° de cabeceo respecto al casco
  (`AIM_LIMITS`). El desplazamiento del cursor en píxeles se convierte a ángulo con la focal de la
  cámara (`aimPointerFromCanvas`): la retícula se dibuja donde está el cursor hasta el límite del
  cono y se recorta después. El cursor del sistema se oculta sobre el canvas (`cursor: none`).
- **Escalado:** canvas interno fijo 1280×720 escalado por CSS con letterboxing. La UI vive en DOM
  encima y el radar usa su propio canvas.

## 7. Pipeline de render, paso a paso

El plan describe 5 macro-pasos (§6.3); este es el desglose real de la composición actual:

1. **Fondo y suelo.** Cielo, horizonte y **rejilla de suelo proyectada** se pintan primero como
   telón de fondo (`render/background.ts`); al ser lo más lejano, quedan detrás de todo.
2. **Generación de caras de mundo.** `buildWallWorldFaces` produce coberturas intactas (omitiendo
   caras que tocan otra cobertura) y escombros; `tankWorldFaces` produce el tanque enemigo como siete
   cajas rotadas (casco, 2 cadenas, torreta, cañón y franjas de orientación) sin cara inferior y
   añade cinco caras de fogonazo en la boca del cañón mientras `enemy.muzzleFlash` está activo;
   `pickupWorldFaces` produce la caja, la marca de suelo y el icono flotante de cada pickup no
   recogido.
3. **Proyección en una sola pasada** (`projectWorldFaces`): mundo→cámara, descarte de caras traseras,
   recorte de plano cercano, proyección con focal, cálculo de profundidad media, sombreado plano por
   normal y **niebla** de distancia.
4. **Proyectiles.** `bulletFaces.ts` proyecta los tracers (halo + núcleo) y les asigna profundidad;
   se añaden a la misma lista que las caras de mundo.
5. **Ordenación painter's algorithm.** `painter.ts` ordena de **mayor a menor profundidad** (lo más
   lejano primero) y pinta con el contexto (`fillStyle` + `fill`). Coberturas, tanques y tracers
   comparten orden: lo que está detrás de una cobertura intacta se pinta antes y queda tapado.
6. **Overlay de periscopio.** `render/periscope.ts` pinta en canvas la máscara, la **retícula y las
   marcas de distancia en el punto de mira**, la marca tenue del **rumbo del casco** en el centro, el
   **anillo de recarga** con segundos y la marca de impacto. **Sin cañón dibujado** (decisión del
   usuario, 2026-10-27): la retícula es la única referencia de puntería y se elimina el fogonazo del
   arma; el retroceso de cámara y el tracer conservan el feedback. El overlay va en canvas; la
   **viñeta de periscopio** (`#game-frame::after`) y la **viñeta roja de vida baja**
   (`#hud-damage-vignette`) son capas CSS con `radial-gradient` en `ui/styles.css`. La máscara
   inferior del canvas se redujo a 96 px en la fase 11 (antes 118) al no dibujarse el cañón; el HUD
   queda por encima (`z-index` 2 de `#hud-root`).
7. **Feedback de pantalla.** `render/combatFeedback.ts` dibuja la barra de vida con nombre y la
   barra fina de recarga enemiga sobre enemigos visibles, y los números de daño con la zona del
   impacto; `overlayTint` tiñe de rojo al recibir daño; `render/damageIndicator.ts` pinta el arco
   direccional del último impacto recibido; el HUD DOM muestra el aviso de pickup y las pantallas de
   campaña cubren el resultado (victoria/derrota/campaña completada).
8. **HUD DOM.** `ui.hud` actualiza vida, avance, puntuación, recarga, efectos, avisos, audio, pausa,
   pantallas de campaña y la opacidad de la viñeta de daño (0 a 0,5 según la vida, siempre por debajo
   del 40 %); el radar se pinta en su canvas y el mundo (barras/daño flotante) sigue en canvas.

**Oclusión:** el test de `tests/render/occlusion.test.ts` comprueba que una cobertura intacta tapa al
enemigo en el centro de la mira y que, al destruirla, la línea queda despejada.

**Limitación conocida:** el painter's algorithm falla en intersecciones exactas de geometría. El
diseño lo evita (celdas disjuntas, sin solapes ni transparencias) y lo asume como deuda cosmética; no
hay z-buffer. Los empates de profundidad conservan el orden de entrada (el `sort` es estable).

## 8. Modelo de mundo, colisión, LOS y oclusión total

- **Rejilla de celdas de 4 m** sobre `(x, z)`. Por defecto 20×20 celdas (80 m); el diseño admite
  16×16 a 24×24 (64–96 m). Cada celda es vacía o una cobertura con material, altura y vida.
- Las coberturas son **prismas de 4 caras verticales**. Sus alturas (2,4–3,4 m según material) superan
  la altura de cámara (1,7 m); no hay forma de mirar por encima y las caras superiores no se pintan.
- **Por qué la oclusión es total mientras están intactas:** geometría opaca, cámara por debajo de la
  altura mínima, sin vista libre/movimiento vertical, painter que pinta la cobertura delantera
  después, y una línea de visión (`world/los.ts`) que usa la misma rejilla: lo que no se ve no se
  puede disparar.
- **Coberturas destruidas:** `damageObstacle` reduce su vida; al llegar a 0 `isBlocked` deja de
  bloquear el paso y solo quedan escombros bajos (0,35–0,5 m según material, `materials.ts`). La
  visión, los proyectiles y el paso siguen a través de ellos.
- **Colisión del tanque:** círculo de radio propio (jugador 1,35 m; enemigos 1,4 m) contra celdas y
  contra otros tanques. `canCircleOccupy` comprueba la ocupación de la rejilla; `moveCircleWith`
  avanza por ejes separados con subpasos de 0,25 m como máximo, con deslizamiento y detección de
  bloqueo, aplicando la comprobación de ocupación que recibe. `world/entityCollision.ts` añade los
  tanques vivos como bloqueadores circulares (`EntityBlocker`): `minEntityDistance` es la suma de
  radios más `ENTITY_SEPARATION` (0,15 m) y `entityClearance` mide la holgura. Si un tanque empieza
  solapado (por ejemplo al recolocarlo desde `window.__BT__` en QA) puede alejarse, pero ningún
  movimiento puede agravar el solape. Los tanques destruidos ya no bloquean. El movimiento del
  jugador y el avance de la IA comparten el mismo mecanismo; los spawns generados respetan
  distancias muy superiores (20 m jugador↔enemigo, 8 m entre enemigos), así que no aparecen
  solapados. Tests: `tests/world/entityCollision.test.ts`, `tests/systems/movement.test.ts`,
  `tests/systems/ai.test.ts` y `tests/game/game.test.ts`.
- **Línea de visión:** `hasLineOfSight` muestrea el segmento cada **1 m** (suficiente para celdas de
  4 m), devuelve `false` si sale del mapa o si encuentra una celda bloqueada. Los escombros no
  bloquean; las coberturas intactas sí.
- **Pathfinding:** `findPath` implementa _*A* de 4 direcciones_* sobre la rejilla con lista abierta
  ordenada por coste, heurística Manhattan y reconstrucción de ruta; devuelve `null` si el destino
  está bloqueado, fuera del mapa o es inalcanzable.
- **Borde del mundo:** cerrado por coberturas indestructibles (hormigón); no se puede salir.
- **Tanques:** el jugador y los enemigos son estados con posición, rumbo, vida/armadura, recarga y
  comportamiento; los enemigos añaden modo de IA, ruta, temporizadores y fogonazo. El modelo visual
  es una composición de cajas (`models.ts`) con franja clara en el frente y roja en la espalda para
  leer la orientación; la simulación usa círculos y la rejilla.
- **Pickups:** cuatro o cinco por escenario (botiquín, mejora y potencia) en celdas libres alcanzables; se
  recogen al pasar a menos de 2 m, no reaparecen y no bloquean el movimiento. Los datos y efectos
  están en `config/pickups.ts`; `systems/loot` aplica la cura (+30 PV), la mejora (+20 de vida
  máxima, +20 PV y −10 % de daño recibido acumulable ×3) y la potencia (20 s de daño ×1,75 y recarga
  ×0,65, renovable). El aviso de pickup y los efectos temporales se muestran en el HUD DOM.
- **Proyectiles:** `Bullet` lleva dirección 3D normalizada; el del jugador sale del pivote de la
  torreta (1,55 m de alto, 1,1 m al frente) más 2,2 m de tubo, en la dirección de la mira. Los
  impactos pueden ser contra cobertura, contra tanque (cilindro de 2,2 m de alto) o contra el suelo;
  un disparo elevado puede pasar por encima de un tanque. La dirección de la cámara no interviene.
  El evento de impacto incluye la **zona de blindaje** cuando golpea a un tanque.
- **Blindaje direccional (bloque 7.5):** `systems/armor.ts` clasifica la zona respecto al rumbo del
  blanco (frontal ≤60°, lateral ≤120°, trasera >120°) y devuelve ×0,5/×1,0/×1,5, aplicado después
  del blindaje base y de las mejoras; es simétrico para jugador y enemigos. La IA solo dispara dentro
  de ±15° de su rumbo y no corrige el heading mientras recarga (ventana de flanqueo); los modelos
  llevan franjas de orientación. Valores en `config/balance.ts`.
- **Limitación:** sin verticalidad real (rampas, puentes, tejados, voladizos), agua ni
  transparencias; requiere cambiar el contrato de mundo y un ADR.

## 9. Generación procedural

Pasos, todos deterministas a partir de una semilla (implementados en la fase 3):

1. **Semilla** desde `Date.now()` o desde `?seed=` (RNG `mulberry32`). Los tests usan semillas fijas.
2. **Borde cerrado** de coberturas indestructibles (hormigón).
3. **Grupos interiores** de coberturas con densidad por misión: 12 % / 16 % / 20 %.
4. **Validación con _flood fill_:** las zonas alcanzables deben incluir el spawn del jugador, los
   spawns de enemigos y los pickups; no puede haber zonas aisladas inalcanzables.
5. **Colocación** de jugador, enemigos y pickups con distancias mínimas y una zona de seguridad
   alrededor del jugador, con el RNG sembrado. Los enemigos se colocan en celdas **sin línea de
   visión** sobre el jugador (con relajación si el mapa no da suficientes) y a la distancia mínima
   de la misión (20/24/28 m).
6. **Reintentos acotados** (máx. 30); la política de fallback al agotarlos sigue pendiente (hoy se
   muestra un error en pantalla).
7. **Reparto de enemigos:** definido por misión en `config/missions.ts` (ligeros/pesados y tuning
   de IA); `buildMissionRoster` lo asigna a los spawns generados y reserva los más lejanos para los
   carros pesados, para que un Tiger no pueda aparecer encima al empezar.
8. **Salida:** rejilla de celdas + spawns + semilla; sin Canvas ni DOM.

Los tests comprueban determinismo por semilla, conectividad, ausencia de solapamientos y distancias
mínimas.

## 10. Testabilidad del renderer

No hay escena unificada: construir caras es una función pura, proyectarlas es otra y el pintor es la
única pieza que escribe en el contexto.

- **Constructores y proyección puros:** `worldFaces`/`models` devuelven `WorldFace[]`; `faces`
  (`projectWorldFaces`) aplica culling, recorte, sombreado y niebla y devuelve `RenderFace[]`;
  `bulletFaces` proyecta los tracers. Todo se ejecuta en Node con fixtures fijos (cámara, rejilla,
  enemigo de prueba).
- **Modelo enemigo y fogonazo:** `tests/render/models.test.ts` valida las 35 caras base (7 cajas), las
  franjas de orientación y las 5 caras extra de fogonazo mientras `muzzleFlash` está activo.
- **Pintor:** `painter.ts` pinta `RenderFace[]` sobre el contrato mínimo `FaceCanvas` (`fillStyle`,
  `beginPath`, `moveTo`, `lineTo`, `closePath`, `fill`). Un contexto simulado registra las
  operaciones y permite afirmar orden y contenido.
- **Oclusión:** `tests/render/occlusion.test.ts` usa `buildWallWorldFaces`, `tankWorldFaces` y
  `projectWorldFaces` para comprobar que la cobertura intacta cubre el centro de la mira y que, tras
  destruirla, la línea queda despejada.
- **Puntería:** `resolveAim` es pura y se prueba sin DOM (`tests/systems/aim.test.ts`): centro,
  derecha, elevación, límites del cono, giro con el tanque y normalización de la dirección. El punto
  de retícula también es matemática pura; su dibujo se valida a mano.
- **Periscopio:** usa el `CanvasRenderingContext2D` completo (`fillRect`, `strokeRect`, `arc`…), así
  que su validación es manual/visual; no entra en el contrato del pintor.
- El renderer no usa `Date.now()`/`Math.random()` ni muta entidades; la paleta, materiales y valores
  de render son datos estáticos de `config/`.
- **Simulación:** puntería, LOS, A* y la IA son funciones puras/deterministas (`grid`, `player`,
  `rng`, `bullets` y puntero inyectados); `game` permite inyectar `InputState` en tests headless y
  el `main.ts` es el único que enlaza teclado y ratón.

## 11. Presupuesto de rendimiento

- **Objetivo:** 60 fps a 1280×720 en un portátil moderno.
- **Presupuesto:** ≤ **1 500 caras visibles** y ≤ **500 operaciones de dibujo por frame**. Una
  «operación de dibujo» es una primitiva (`fill`, `stroke`, `fillRect`, `strokeRect`, `arc`,
  `drawImage`); la construcción del path (`beginPath`/`moveTo`/`lineTo`/`closePath`) no cuenta.
- **Coste de los enemigos:** cada tanque son 7 cajas × 5 caras = 35 caras nominales; con la
  formación actual (3–6 enemigos según la misión, `config/missions.ts`) son ~105–210 caras, dentro
  del presupuesto.
- **Coste de los pickups:** ~30 caras por pickup (marca, caja e icono) y 4–5 unidades ⇒ ~120–150
  caras, también dentro del presupuesto.
- **Medición fase 11 (Chrome headless, 1280×720, semilla 42):** 60 fps estables (p50 16,7 ms; 0
  frames >33 ms en 2890); caras visibles p50 193 (misión 1) / 343 (misión 3) y máx 457; primitivas
  p50 255 / 407 y pico 536 en la ventana extrema de la misión 3 (~6 % sobre el objetivo, sin caída
  de FPS). Se mantiene el objetivo; si el pico crece, la palanca es culling/distancia de dibujado.
- **Depuración:** `F3` con fps, caras, celdas visibles y entidades sigue **previsto** (fase 11); hoy
  el HUD DOM muestra vida, avance, misión, puntos, recarga, efectos, audio y radar, sin fps ni
  contador de caras.
- **Degradación:** si se excede, primero distancia de dibujado y culling más agresivo; después,
  reutilizar arreglos. El presupuesto es una restricción de diseño.
- Canvas interno fijo (no HiDPI variable), escalado por CSS; sin imágenes ni filtros.

## 12. Límites de tamaño y complejidad

Aplicados por ESLint y obligatorios en `src/` (tests y configs con exenciones parciales; detalle en
[`DEVELOPMENT.md`](DEVELOPMENT.md#3-reglas-eslint)):

| Norma                   | Límite                             |
| ----------------------- | ---------------------------------- |
| Fichero                 | 200 líneas objetivo, **300 error** |
| Función                 | 40 líneas objetivo, **60 error**   |
| Complejidad ciclomática | ≤ 10                               |
| Anidamiento de bloques  | ≤ 3                                |
| Bucles anidados         | prohibidos                         |
| Parámetros              | ≤ 4                                |
| Sentencias por función  | ≤ 20                               |

Consecuencia: render (`faces`, `worldFaces`, `models`, `bulletFaces`, `renderer`), IA, combate y
colisión se dividen en funciones pequeñas; si una regla no cabe sin anidar, se extrae utilidad.

## 13. Riesgos técnicos y deuda prevista

| Riesgo                                                            | Mitigación                                                                                                                            | Estado                                      |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| Artefactos del painter's algorithm en cruces de geometría         | Celdas/tanques disjuntos, sin transparencias, orden estable por profundidad; deuda cosmética asumida                                  | Aceptado como deuda                         |
| Proyectiles que atraviesan coberturas a gran velocidad            | Avance en subpasos de 0,5 m y comprobación de altura de celda                                                                         | Mitigado                                    |
| Tracers mal ordenados respecto a coberturas/tanques               | Comparten la lista de caras y la profundidad del painter                                                                              | Mitigado                                    |
| LOS imprecisa en esquinas por muestreo de 1 m                     | Suficiente para celdas de 4 m; si aparecen fallos, DDA exacto                                                                         | Aceptado (revisar con QA)                   |
| IA que se engancha en esquinas                                    | A* + deslizamiento + recálculo de ruta al chocar; test de avance con obstáculo                                                        | Parcial; revisar en QA (fase 11)            |
| IA sin estado de reposición/coordinación                          | Máquina `idle/advance/attack`; reposicionar y flanqueo coordinado quedan como deuda                                                   | Deuda planificada                           |
| La pausa de recarga hace a la IA demasiado fácil                  | Ventana configurable (`AI_TUNING`); simulación de flanqueo                                                                            | Revisable (fase 11)                         |
| **Bug:** jugador atraviesa tanques (`BUG-001`)                    | Bloqueadores circulares dinámicos + separación de 0,15 m, tests a 6 m/s y 60 Hz (jugador↔enemigo y enemigo↔enemigo) y QA en navegador | Mitigado (bloque 6.6)                       |
| Blindaje direccional desequilibra la dificultad                   | Multiplicadores/umbrales en `balance.ts`; tests de impactos por zona                                                                  | Implementado (7.5); balance a validar en QA |
| IA demasiado precisa encarando al jugador                         | Arco de fuego ±15°, giro limitado y pausa de seguimiento al recargar                                                                  | Mitigado (7.5)                              |
| Dificultad mal calibrada                                          | Balance en `config/tanks.ts`, IA por misión y simulación headless con `?seed=`                                                        | Implementado; balance a validar en QA       |
| Oclusión percibida como injusta                                   | Enemigos con la misma LOS; coberturas destructibles y radar                                                                           | Implementado                                |
| Retícula/puntería descuadrada respecto a la dirección del disparo | `resolveAim` unitario; mapeo angular 1:1 con el cursor y QA visual de la retícula (ya no hay cañón dibujado)                          | Mitigado (bloque 6.5 y A)                   |
| Cono de puntería demasiado estrecho o amplio                      | ±15° / ±4° en `AIM_LIMITS`, revisable con QA y ajuste de datos                                                                        | Revisable (fase 11)                         |
| Cursor del sistema visible distrayendo                            | Oculto sobre el canvas con CSS; la retícula es la referencia                                                                          | Implementado                                |
| Audio bloqueado por el navegador                                  | Desbloqueo en el primer gesto; degradación silenciosa                                                                                 | Implementado (fase 10)                      |
| `localStorage` bloqueado                                          | Persistencia best-effort; el juego sigue sin récord                                                                                   | Implementado (fase 9)                       |
| Reintentos de generación agotados                                 | Política de fallback pendiente (relajar densidad o regenerar con otra semilla)                                                        | **Pendiente**                               |
| Pestaña en segundo plano acumula tiempo                           | `maxFrameSeconds` en `core/loop.ts`                                                                                                   | Implementado                                |
| Scope creep                                                       | Alcance cerrado de 0.1.0 y lista explícita de lo que queda fuera                                                                      | Diseño                                      |

## 14. Estado de implementación

- **Fases 0–2:** bootstrap, núcleo (math/RNG/loop/eventos) y render base (cámara, proyección,
  recorte, painter, color/niebla) cerradas.
- **Fase 3:** mundo cerrado — rejilla, materiales, generación validada, spawns, colisión y caras de
  coberturas.
- **Fase 4:** jugador cerrado — entrada de teclado, movimiento solidario, colisión deslizante,
  cámara de periscopio y overlay.
- **Fase 5:** combate cerrado — recarga, disparo, proyectiles, impactos, destrucción de coberturas,
  retroceso, anillo de recarga y marca de impacto (el fogonazo del cañón se retiró con el cañón 2D,
  ajuste de periscopio del 2026-10-27).
- **Fase 6:** IA cerrada — LOS por muestreo, A*, enemigos Panzer III/Tiger I con modelos de cajas,
  percepción/alerta, avance, apuntado con giro limitado y disparo con dispersión; daño con blindaje,
  alerta por estampido a 60 m, overlay rojo de daño, pantalla de derrota (título «TANQUE
  DESTRUIDO», pantalla real desde la fase 9), ocultación por coberturas y ganchos de depuración.
- **Bloque 6.5:** puntería con ratón cerrada — `systems/aim`, puntero en `InputState`, cableado de
  entrada en `main.ts`, proyectiles con dirección 3D, impactos en suelo y retícula móvil en el
  periscopio, cámara con pitch base 0° y cursor oculto. El cañón 2D dibujado se retiró después
  (ajuste de periscopio del 2026-10-27).
- **Bloque 6.6:** colisión entre tanques cerrada — `world/entityCollision.ts` con bloqueadores
  circulares, `moveCircleWith` en `world/collision.ts`, integración en el movimiento del jugador y
  en el avance de la IA, separación de seguridad y tests de regresión de `BUG-001`.
- **Fase 7:** pickups cerrada — `config/pickups.ts`, `entities/pickup.ts`, `systems/loot.ts`,
  `systems/damage.ts` y `render/pickupFaces.ts`; recogida a 2 m y efectos de cura/mejora/potencia.
  El aviso de pickup pasó al toast DOM del HUD en la fase 8 (se retiró el panel temporal de canvas);
  no existe `render/statusOverlay.ts`.
- **Bloque 7.5:** blindaje direccional y flanqueo cerrados — `systems/armor.ts`, zona en el evento
  de impacto, aplicación en `systems/damage.ts`, arco de fuego y pausa de recarga en `systems/ai.ts`
  y franjas de orientación en `render/models.ts`.
- **Ajuste 7.5.1:** panel temporal reetiquetado, arranque con 3 Panzer III, barra/nombre de enemigo
  visible por LOS, daño flotante con zona y destello de impacto; `systems/damage.ts` devuelve
  `DamageResult` y `systems/feedback.ts` centraliza visibilidad y caducidad de daños. **184 tests en
  31 ficheros.**
- **Fase 8:** HUD/radar cerrada — HUD DOM con vida, avance, misión, puntuación, recarga, efectos,
  audio y avisos; radar de 45 m; pausa con ESC; puntuación por tipo de enemigo; viñeta CSS de
  periscopio (`#game-frame::after`).
- **Fase 9:** campaña cerrada — 3 misiones (3/5/6 enemigos, Tiger desde la 2), briefing/resultados,
  victoria/derrota, puntuación de campaña y persistencia (`battletank-ds.progression.v1`).
- **Fase 10:** audio cerrado — bus WebAudio inyectable con motor, cañón, impactos, recarga, pickups,
  UI y viento; mute/volumen y HUD. **211 tests en 38 ficheros.**
- **Fase 11:** pulido cerrado — documentación y `PLAN.md` sincronizados con autorización del usuario,
  mejoras UX (viñeta de vida baja, fogonazo del enemigo, máscara inferior de 96 px, aviso de pickup
  oculto en pausa) y QA headless APTO; quedan la QA de audio de oído y el tag `v0.1.0`.
- **Bloque A post-0.1.0:** claridad de combate y onboarding — marca de impacto fiable (`BUG-002`),
  arco direccional de daño, cañonazo enemigo audible, recarga enemiga visible, buffer de disparo,
  briefing con controles/blindaje y puntería 1:1 con el cursor.
- **Bloque A.1 post-0.1.0:** selector de misión 1/2/3 en el briefing (solo desbloqueadas) y
  aparición justa de enemigos (sin LOS inicial, distancia mínima por misión y pesados en los
  spawns más lejanos). **239 tests en 40 ficheros.**

El inventario real, commit a commit, está en [`STATUS.md`](STATUS.md); el orden y entregables de
cada fase, en [`PLAN.md`](PLAN.md) §12.
