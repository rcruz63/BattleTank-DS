# Estado del proyecto — BattleTank-DS

> **Actualizado:** 2026-10-27 · **Fase actual:** pausa de revisión antes de 7 — Pickups
> **Último commit:** `feat(aim): puntería con ratón y cañón cónico`
>
> Este fichero es el punto de entrada para retomar el proyecto, sea otra persona, otro chat u
> otro modelo. Se actualiza en **cada commit**. La verdad sobre el alcance está en el plan.

## Cómo retomar

1. Lee [`docs/PLAN.md`](PLAN.md) (alcance y fases) y este estado.
2. `npm install` y `npm run check` para confirmar que la base está sana.
3. `npm run dev` y abre `http://localhost:5173`.
4. Elige la primera tarea pendiente de la sección «Pendiente» y sigue el flujo de
   [`docs/DEVELOPMENT.md`](DEVELOPMENT.md): tests → `npm run check` → changelog → estado → commit.

## Hecho

- [x] **Bloque 6.5 — Puntería con ratón.** El cañón pivota sobre la mazorca en un cono de
      ±15° horizontal / ±4° vertical; la retícula sigue al puntero y el disparo sale en esa
      dirección (balística 3D, altura de blancos e impacto en suelo). Clic izquierdo o Espacio
      disparan; recarga, marca de impacto y cañón dibujado se orientan a la retícula; el centro
      conserva una marca tenue del rumbo del casco. La cámara pasa a pitch 0° y el movimiento no
      cambia. Nuevo `systems/aim.ts`, entrada de ratón en `input.ts`, cableado en `main.ts` y
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

- Ninguna tarea en curso: **pausa acordada** para revisión antes de la fase 7.

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
| 7 | Pickups: cura, mejora y potencia | Pendiente |
| 3 | Mundo: rejilla, generación procedural validada, escena de prismas | Pendiente |
| 4 | Jugador: movimiento solidario, colisión, cámara de periscopio | Pendiente |
| 5 | Combate: disparo, recarga, proyectiles, impactos y escombros | Pendiente |
| 6 | Enemigos: modelos, IA con LOS/A*, dificultad por parámetros | Pendiente |
| 7 | Pickups: cura, mejora y potencia | Pendiente |
| 8 | HUD: vida, progreso, puntuación, radar, recarga y pantallas | Pendiente |
| 9 | Misiones: campaña de 3, escalado, victoria/derrota y persistencia | Pendiente |
| 10 | Audio: efectos sintetizados WebAudio, volumen y mute | Pendiente |
| 11 | Pulido, QA, rendimiento, documentación final y tag `v0.1.0` | Pendiente |

## Deuda técnica registrada

- IA sin patrulla ni coordinación de flanqueo: los enemigos permanecen al acecho hasta ver u oír al
  jugador. Suficiente para 0.1.0; ampliable tras la entrega.
- Reparto provisional de tipos de enemigo (`3 ligeros + 1 pesado`); la fase 9 lo sustituirá por el
  reparto de cada misión.
- Pantalla de destrucción y texto de estado son provisionales (fases 8-9).
- El cañón del jugador es un overlay 2D que pivota desde la mazorca; no hay modelo 3D del arma
  en primera persona. Es suficiente para 0.1.0 y se puede mejorar tras la entrega.

## Decisiones y notas operativas

- **Flujo de trabajo acordado con el usuario:** pausa al cerrar cada fase para revisión/intervención. Se retoma con «continúa la fase N».
- No hay `pnpm` instalado en la máquina; se usa **npm** (Node 24 / npm 11).
- El audio se sintetiza con WebAudio: no habrá ficheros de audio ni assets externos.
- La interfaz y la documentación van en español; los identificadores del código, en inglés.
- `main.ts` arranca el juego real (`createGame`): WASD/flechas para moverse, Espacio para disparar.
  El HUD funcional y la pantalla de resultados llegan en las fases 8-9; el texto de estado actual es temporal.
- Depuración: `?seed=42` reproduce un escenario; `window.__BT__` expone el estado del juego en consola.
- Controles: W/S avanzar/retroceder, A/D girar tanque y vista, ratón para apuntar en el cono,
  clic izquierdo o Espacio disparar.
- `main.ts` dibuja todavía una pantalla de arranque; se sustituirá por el bucle real en la fase 1.

## Comandos de referencia

```bash
npm install
npm run dev        # http://localhost:5173
npm run check      # typecheck + lint + test + build (obligatorio antes de commit)
npm run build      # build de producción en dist/
```
