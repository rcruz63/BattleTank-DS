# Estado del proyecto — BattleTank-DS

> **Actualizado:** 2026-10-27 · **Fase actual:** pausa de revisión; siguiente fase 8 (HUD)
> **Último commit:** `style(render): retirar el cañón 2D del periscopio`
>
> Este fichero es el punto de entrada para retomar el proyecto, sea otra persona, otro chat u
> otro modelo. Se actualiza en **cada commit**. La verdad sobre el alcance está en el plan.

## Cómo retomar

1. Lee [`docs/PLAN.md`](PLAN.md) (alcance y fases) y este estado.
2. `npm install` y `npm run check` para confirmar que la base está sana.
3. `npm run dev` y abre `http://localhost:5173`.
4. Lee «Incidencias conocidas» antes de elegir tarea: el siguiente trabajo es el HUD/radar (fase 8);
   pickups (7), blindaje direccional (7.5) y `BUG-001` (6.6) ya están cerrados.
5. Sigue el flujo de [`docs/DEVELOPMENT.md`](DEVELOPMENT.md): tests → `npm run check` → changelog
   → estado → commit.

## Hecho

- [x] **Ajuste de periscopio (2026-10-27).** Se retira el cañón 2D del overlay y su fogonazo (a
      petición del usuario): la puntería se lee solo con la retícula. Se mantienen máscara, marcas de
      rumbo y distancia, anillo de recarga y marca de impacto; el retroceso de cámara y el tracer
      conservan el feedback del disparo. QA visual en Chrome headless con capturas antes/después; sin
      cambios en el contrato de puntería ni en los tests (183 tests).
- [x] **Bloque 7.5 — Blindaje direccional y flanqueo.** El daño se clasifica por zona respecto al
      rumbo del blanco (frontal ×0,5, lateral ×1,0, trasera ×1,5) y se aplica después del blindaje
      base y de las mejoras, igual para jugador y enemigos; la IA solo dispara dentro de ±15° de su
      rumbo y no corrige el heading mientras recarga (ventana de flanqueo); los modelos enemigos
      llevan franja clara en el frente y roja en la espalda. `systems/armor.ts`, zona en
      `ProjectileEvent`, aplicación en `systems/damage.ts`, datos en `balance.ts` e IA en
      `systems/ai.ts`. 183 tests en 31 ficheros (15 nuevos) y QA en Chrome headless: trasero 60 /
      frontal 20, sin disparo fuera del arco y rumbo congelado al recargar.
- [x] **Fase 7 — Pickups.** Cuatro pickups por escenario (botiquín, mejora y potencia) repartidos de
      forma determinista en los spawns alcanzables; se recogen al pasar a menos de 2 m y aplican
      cura de +30 PV con tope, +20 de vida máxima con −10 % de daño recibido acumulable ×3, o daño
      ×1,75 y recarga −35 % durante 20 s (renovable). Efectos en `systems/loot.ts`, aplicación de
      daño en `systems/damage.ts`, modelo procedural con icono flotante en `render/pickupFaces.ts`
      y aviso/línea de estado en `render/statusOverlay.ts`. 168 tests en 30 ficheros (26 nuevos) y
      QA en Chrome headless vía CDP: los tres pickups se recogen con su efecto y el aviso visible.
- [x] **Bloque 6.6 — Colisión entre tanques (`BUG-001`).** `world/entityCollision.ts` trata cada
      tanque vivo como bloqueador circular con separación de seguridad de 0,15 m sobre la suma de
      radios; el movimiento del jugador y el avance de la IA usan `moveCircleAroundEntities`
      (rejilla + bloqueadores, con subpasos y deslizamiento) y `world/collision.ts` expone
      `moveCircleWith` para integrar comprobaciones extra sin duplicar el barrido. Los enemigos
      destruidos no bloquean y un tanque que empiece solapado (por ejemplo al recolocarlo en QA)
      puede separarse sin hundirse más. 142 tests en 25 ficheros (10 nuevos de regresión) y QA en
      Chrome headless vía CDP: a 6 m/s el jugador se detiene a 2,9 m del enemigo y no lo cruza.
- [x] **Bloque 6.5 — Puntería con ratón.** El cañón pivota sobre la mazorca en un cono de
      ±15° horizontal / ±4° vertical; la retícula sigue al puntero y el disparo sale en esa
      dirección (balística 3D, altura de blancos e impacto en suelo). Clic izquierdo o Espacio
      disparan; recarga, marca de impacto y cañón dibujado se orientaban a la retícula (el cañón
      2D se retiró después); el centro conserva una marca tenue del rumbo del casco. La cámara pasa
      a pitch 0° y el movimiento no cambia. Nuevo `systems/aim.ts`, entrada de ratón en `input.ts`,
      cableado en `main.ts` y
      README/GAME_DESIGN/ARCHITECTURE/TESTING sincronizados. 132 tests en verde; QA visual
      headless con ratón a la derecha y clic.
- [x] **Fase 6 — Enemigos e IA.** Panzer III y Tiger I con estado propio; percepción por muestreo
      de 1 m (las coberturas intactas bloquean), alerta visual y por estampido a 60 m, avance con A*
      rodeando muros, apuntado con giro limitado, disparo con dispersión y recarga, daño cruzado
      con blindaje, modelo de tanque por cajas (casco/cadenas/torreta/cañón) con oclusión por el
      painter, overlay de daño y pantalla provisional de destrucción. Ganchos `?seed=` y
      `window.__BT__` para QA. Verificado con captura headless. 121 tests en verde.
- [x] **Fase 5 — Combate.** Disparo con recarga de 2,4 s y flanco, proyectiles en subpasos con
      colisión contra coberturas y blancos, daño por material (madera 1 impacto, ladrillo 3,
      hormigón/acero inmunes), escombros que dejan pasar los proyectiles, retroceso de cámara,
      fogonazo, marca de impacto y anillo de recarga con segundos. 100 tests en verde.
- [x] **Fase 4 — Jugador.** Entrada de teclado (WASD/flechas, disparo de flanco), movimiento
      solidario con giro del casco, colisión círculo-rejilla con deslizamiento y subpasos, cámara de
      periscopio y overlay procedural (máscara, mira, cañón y casco); `createGame` cablea el bucle.
      Verificado con captura headless de Chrome. 88 tests en verde.
- [x] **Fase 3 — Mundo y escena.** Rejilla de celdas, materiales (madera/ladrillo/hormigón/acero),
      generación procedural determinista con borde cerrado, validación de alcanzabilidad y spawns
      con distancias mínimas; escena de prismas con culling, recorte, sombreado, niebla, rejilla de
      suelo y escombros al destruir; demo visual en `main.ts`. 72 tests en verde.
- [x] **Fase 2 — Render.** Cámara con base ortonormal y proyección, recorte de plano cercano para
      polígonos y segmentos, painter's algorithm, mezcla de colores/niebla y adaptador de canvas;
      21 tests en `tests/render/`.
- [x] **Fase 1 — Núcleo.** `src/core/math.ts` (ángulos, vectores 2D/3D), `src/core/rng.ts`
      (mulberry32 determinista), `src/core/loop.ts` (paso fijo con interpolación y protección
      anti-espiral) y `src/core/events.ts` (bus tipado); 29 tests unitarios en `tests/core/`.
- [x] **Fase 0 — Bootstrap.** Vite + TypeScript estricto + Vitest + ESLint + Prettier; canvas y
      HUD base en `index.html`/`src/ui/styles.css`; scripts `dev/build/preview/typecheck/lint/test/check`;
      límites duros de tamaño/complejidad activos en ESLint, incluida la prohibición de bucles anidados.
- [x] Plan aprobado en `docs/PLAN.md` (16 secciones, alcance cerrado de 0.1.0).
- [x] Documentación inicial: `README.md`, `AGENTS.md`, `docs/GAME_DESIGN.md`,
      `docs/ARCHITECTURE.md`, `docs/DEVELOPMENT.md`, `docs/DECISIONS.md`, `docs/TESTING.md`.

## En curso

- Ninguna tarea en curso: **pausa acordada**. Próximo trabajo: **fase 8** (HUD, radar, avisos de
  zona de impacto y pantallas).

## Incidencias conocidas

- Ninguna abierta. `BUG-001` (el jugador atravesaba tanques enemigos) quedó resuelto en el bloque
  6.6: ver «Hecho» y [`ARCHITECTURE.md`](ARCHITECTURE.md) §8.

## Pendiente (por fases)

| Fase | Contenido | Estado |
|---|---|---|
| 1 | Núcleo: matemáticas, RNG, bucle de paso fijo y bus de eventos | Completada |
| 2 | Render: canvas, cámara, proyección, recorte, painter y niebla | Completada |
| 3 | Mundo: rejilla, generación procedural validada, escena de prismas | Completada |
| 4 | Jugador: movimiento solidario, colisión, cámara de periscopio | Completada |
| 5 | Combate: disparo, recarga, proyectiles, impactos y escombros | Completada |
| 6 | Enemigos: modelos, IA con LOS/A*, dificultad por parámetros | Completada |
| 6.5 | Puntería con ratón (cañón cónico, balística 3D) | Completada |
| 6.6 | Colisión entre tanques (`BUG-001`) | Completada |
| 7 | Pickups: cura, mejora y potencia | Completada |
| 7.5 | Blindaje direccional y flanqueo | Completada |
| 8 | HUD: vida, progreso, puntuación, radar, recarga y pantallas | **Pendiente (siguiente)** |
| 9 | Misiones: campaña de 3, escalado, victoria/derrota y persistencia | Pendiente |
| 10 | Audio: efectos sintetizados WebAudio, volumen y mute | Pendiente |
| 11 | Pulido, QA, rendimiento, documentación final y tag `v0.1.0` | Pendiente |

## Deuda técnica registrada

- **Supuestos de pickups pendientes de validar:** la mejora cura también los 20 PV al subir el
  máximo, las reducciones de daño son multiplicativas y recoger una mejora con el tope ×3 la consume
  sin efecto. Confirmar en la fase 9.
- **Feedback de pickups y de zona de impacto provisional:** el evento de impacto ya lleva la zona
  (`front`/`side`/`rear`), pero los avisos viven en el canvas temporal hasta el HUD de la fase 8.
- **Balance del blindaje pendiente de la fase 9:** multiplicadores y umbrales en `balance.ts`; hay
  que validar 5/3/2 y 8/4/3 y si la ventana de recarga de la IA resulta demasiado generosa.
- **IA sin corregir rumbo al recargar:** implementado como ventana de flanqueo; revisar en la fase 9
  si hay que acortarla o mantenerla.
- IA sin patrulla ni coordinación de flanqueo: los enemigos permanecen al acecho hasta ver u oír al
  jugador. Suficiente para 0.1.0; ampliable tras la entrega.
- Reparto provisional de tipos de enemigo (`3 ligeros + 1 pesado`); la fase 9 lo sustituirá por el
  reparto de cada misión.
- Pantalla de destrucción y texto de estado son provisionales (fases 8-9).
- **Sin cañón visible:** la puntería se lee solo con la retícula y no hay fogonazo en el cañón
  (decisión del usuario, 2026-10-27); no hay modelo 3D del arma en primera persona. El retroceso de
  cámara, la marca de impacto y el tracer mantienen el feedback del disparo.
- **PLAN §7.7 sigue describiendo el cañón dibujado:** el cambio se ha registrado aquí, en
  `CHANGELOG` y en `GAME_DESIGN`, pero `PLAN.md` no se toca sin autorización explícita; queda pendiente
  sincronizarlo cuando el usuario lo apruebe.

## Decisiones y notas operativas

- **Flujo de trabajo acordado con el usuario:** pausa al cerrar cada fase para revisión/intervención. Se retoma con «continúa la fase N» o «continúa el bloque N».
- **Cambios aprobados 2026-10-27:** corregir `BUG-001` (6.6) y añadir blindaje direccional/flanqueo (7.5). Registrados en `PLAN.md` §2/§12 y `DECISIONS.md` ADR-009. Ambos bloques y la fase 7 están cerrados; el siguiente trabajo es el HUD (fase 8).
- **QA del bloque 6.6:** además de los tests de regresión, se condujo el juego real en Chrome headless vía CDP (sin dependencias nuevas) para avanzar contra un enemigo: el jugador se detiene a 2,9 m (suma de radios 2,75 m + margen 0,15 m) y no lo cruza.
- **QA de la fase 7:** se recogieron los tres pickups en Chrome headless vía CDP (botiquín de 40 a 70 PV, mejora de 100 a 120 de vida máxima, potencia con recarga de 1,56 s) y se verificaron con capturas el icono en el mundo, el aviso flotante y la línea de estado.
- **QA del bloque 7.5:** en Chrome headless vía CDP, disparos al mismo Panzer III hicieron 60 de daño por la espalda y 20 de frente; la IA no disparó con el jugador a 90° del rumbo, mantuvo el heading durante 0,5 s de recarga y disparó al entrar en el arco de ±15°; se comprobaron las franjas de orientación (clara delante, roja detrás) con capturas.
- **QA del ajuste de periscopio:** playtest en Chrome headless con capturas antes y después; la vista central queda despejada, la retícula sigue siendo legible y no hay errores de consola.
- No hay `pnpm` instalado en la máquina; se usa **npm** (Node 24 / npm 11).
- El audio se sintetiza con WebAudio: no habrá ficheros de audio ni assets externos.
- La interfaz y la documentación van en español; los identificadores del código, en inglés.
- `main.ts` arranca el juego real (`createGame`): WASD/flechas para moverse, ratón para apuntar,
  clic o Espacio para disparar. El HUD funcional y la pantalla de resultados llegan en las fases
  8-9; el texto de estado actual es temporal.
- Depuración: `?seed=42` reproduce un escenario; `window.__BT__` expone el estado del juego en consola.
- Controles: W/S avanzar/retroceder, A/D girar tanque y vista, ratón para apuntar en el cono,
  clic izquierdo o Espacio disparar.

## Comandos de referencia

```bash
npm install
npm run dev        # http://localhost:5173
npm run check      # typecheck + lint + test + build (obligatorio antes de commit)
npm run build      # build de producción en dist/
```
