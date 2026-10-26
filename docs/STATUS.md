# Estado del proyecto — BattleTank-DS

> **Actualizado:** 2026-10-26 · **Fase actual:** 2 — Render
> **Último commit:** `feat(core): matemáticas, rng determinista y bucle de paso fijo`
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

- [ ] **Fase 2 — Render.** Canvas escalado, cámara, proyección, recorte de plano cercano,
      sombreado plano, niebla y painter's algorithm (`src/render/`).

## Pendiente (por fases)

| Fase | Contenido | Estado |
|---|---|---|
| 1 | Núcleo: matemáticas, RNG, bucle de paso fijo y bus de eventos | Completada |
| 2 | Render: canvas, cámara, proyección, recorte, painter y niebla | En curso |
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

- Ninguna todavía. Las excepciones a las normas deberán anotarse aquí con fichero y motivo.

## Decisiones y notas operativas

- No hay `pnpm` instalado en la máquina; se usa **npm** (Node 24 / npm 11).
- El audio se sintetiza con WebAudio: no habrá ficheros de audio ni assets externos.
- La interfaz y la documentación van en español; los identificadores del código, en inglés.
- `main.ts` dibuja todavía una pantalla de arranque; se sustituirá por el bucle real en la fase 1.

## Comandos de referencia

```bash
npm install
npm run dev        # http://localhost:5173
npm run check      # typecheck + lint + test + build (obligatorio antes de commit)
npm run build      # build de producción en dist/
```
