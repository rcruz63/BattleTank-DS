# AGENTS.md — Cómo retomar BattleTank-DS

Este fichero es el punto de entrada para cualquier persona o agente de IA que retome el proyecto.
No contiene el estado del día (eso vive en [`docs/STATUS.md`](docs/STATUS.md)): contiene las reglas
estables para trabajar sin romper nada. Si el código contradice este documento, manda el código, se
corrige el documento y se anota la discrepancia.

- Repositorio: `BattleTank-DS` · juego **BATTLE TANK — PERISCOPIO** (título provisional).
- Versión objetivo: **`0.1.0`** (vertical slice jugable de 3 misiones). Ver
  [`docs/PLAN.md`](docs/PLAN.md).
- Idioma: interfaz, comentarios y documentación en **español**; identificadores, tipos y nombres de
  fichero en **inglés**.

## 1. Lectura obligatoria antes de tocar nada

En este orden; no empieces a programar sin haber leído los tres primeros:

1. [`docs/STATUS.md`](docs/STATUS.md) — estado real: fase actual, último commit, qué está hecho, qué
   está en curso, pendientes y deuda técnica registrada. Es la fuente de verdad operativa.
2. [`docs/PLAN.md`](docs/PLAN.md) — alcance aprobado y fases (fuente de verdad del **qué**).
3. [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) — normas de código, ESLint, git, changelog y
   definición de terminado.
4. [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — capas, contratos y pipeline de render.

Después, según lo que vayas a hacer: [`docs/GAME_DESIGN.md`](docs/GAME_DESIGN.md) para diseño,
números y contenido; [`docs/TESTING.md`](docs/TESTING.md) para pruebas y QA;
[`docs/DECISIONS.md`](docs/DECISIONS.md) para entender por qué está decidido lo que está decidido;
[`CHANGELOG.md`](CHANGELOG.md) para el historial.

## 2. Puesta a punto

```bash
git status && git log --oneline -5   # ¿hay trabajo a medias? ¿cuál es el último commit?
npm install                          # solo si falta node_modules
npm run check                        # línea base: typecheck + lint + tests + build
npm run dev                          # http://localhost:5173 para ver el juego
```

Si `npm run check` no está en verde antes de empezar, **no añadas código encima**: arregla el fallo
o anótalo y coméntalo; `main` nunca debe quedar roto. Los fallos y limitaciones se tratan según
`docs/DEVELOPMENT.md`.

## 3. Límites duros (no negociables)

| Norma | Límite | Dónde se comprueba |
|---|---|---|
| Fichero | 200 líneas objetivo, **300 error** (tests y configs exentos) | ESLint `max-lines` |
| Función | 40 líneas objetivo, **60 error** | ESLint `max-lines-per-function` |
| Complejidad ciclomática | ≤ 10 | ESLint `complexity` |
| Anidamiento de bloques | ≤ 3 | ESLint `max-depth` |
| Bucles anidados | **prohibidos** (`for`/`while` dentro de otro bucle) | ESLint `no-restricted-syntax` |
| Parámetros | ≤ 4 (si no, objeto de opciones) | ESLint `max-params` |
| Sentencias por función | ≤ 20 | ESLint `max-statements` |
| Tipos | sin `any`, sin `@ts-ignore`; `unknown` + validación si hace falta | TypeScript + ESLint |

El detalle exacto de las reglas (opciones reales en `eslint.config.js`), las exenciones de `tests/` y
el procedimiento de excepción están en [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md#3-reglas-eslint).

Reglas de arquitectura que también son duras:

- `src/config/*` son datos puros: no importan de `systems` ni de `render` y no contienen lógica.
- `src/core/*` no conoce el juego; `src/world/*` no conoce Canvas ni DOM; `src/render/*` no muta el
  estado; `src/systems/*` no toca Canvas ni DOM; `src/ui/*` y `src/audio/*` son adaptadores.
- Solo `src/game/game.ts` cablea módulos; `src/main.ts` solo arranca. Sin ciclos de importación.
- Sin `Math.random()` en el juego (usar el RNG sembrado) y sin leer el estado global desde el
  renderer (recibe los datos que necesita como parámetros). En el render se evitan asignaciones
  innecesarias por frame: es un objetivo del presupuesto de rendimiento, no una licencia para
  optimizar antes de medir.

## 4. Prohibiciones

- **No tocar [`docs/PLAN.md`](docs/PLAN.md)** sin aprobación explícita del usuario: es el alcance
  aprobado. Los cambios de alcance se proponen, no se improvisan.
- **No añadir dependencias de runtime.** El juego es TypeScript + Vite + Canvas 2D + Vitest, sin
  librerías en runtime. Una dependencia de desarrollo nueva requiere ADR y aprobación
  ([`docs/DECISIONS.md`](docs/DECISIONS.md)).
- **No añadir assets externos** (imágenes, fuentes, audio, modelos): geometría, tipografía e iconos
  son procedurales/CSS y el audio se sintetiza con WebAudio.
- No usar `any` ni `@ts-ignore`; `@ts-expect-error` solo con descripción y justificación, y como
  último recurso.
- No anidar bucles; no superar los límites de tamaño/complejidad; no desactivar ESLint sin registrar
  la excepción en `docs/STATUS.md`.
- No dejar `TODO`/`FIXME` sin fase ni dueño, ni marcadores vacíos tipo «TBD». Si algo no está
  decidido: aplica el supuesto por defecto del plan y **anótalo como pendiente** donde corresponda.
- No hacer commits sin `npm run check` en verde ni dejar `main` roto. No commitear `node_modules/`
  ni `dist/`. No reescribir historia ya compartida.
- No cambiar un contrato entre capas ni una decisión de arquitectura sin actualizar
  `docs/ARCHITECTURE.md`/`docs/DECISIONS.md` y avisar. No cambiar números de balance en `systems/`:
  van en `src/config/`.
- No usar `console.log` como depuración permanente; para eso está el overlay `F3` (previsto).
- No inventar APIs, firmas ni ficheros: lee los `types.ts` y el código real antes de escribir.

## 5. Mapa de ficheros y responsabilidades

| Zona | Contenido | Responsable habitual |
|---|---|---|
| `src/**` | Implementación por capas (ver tabla inferior). | Lead / desarrollo |
| `src/config/**` | Balance y contenido editable: identidad, tanques, misiones, paleta, balance. | Lead |
| `src/core/**` | Matemáticas, RNG, bucle, bus de eventos. Puro y testeable. | Lead |
| `src/world/**` | Rejilla, generación procedural, colisión, LOS, A*. Sin DOM. | Lead |
| `src/render/**` | Cámara, proyección, recorte, caras, painter, escena. Sin mutar estado. | Lead |
| `src/entities/**`, `src/systems/**` | Entidades y reglas de juego (combate, IA, loot, misión, puntuación, progresión, input). | Lead |
| `src/ui/**`, `src/audio/**` | Adaptadores: DOM/CSS/canvas del radar y WebAudio. | Lead |
| `src/game/**`, `src/main.ts` | Composición, máquina de estados y arranque. | Lead |
| `tests/**` | Espejo de `src/` + integración headless; checklist manual en `TESTING.md`. | QA / desarrollo |
| `docs/**`, `README.md`, `AGENTS.md`, `CHANGELOG.md` | Documentación viva y handoff. | Documentación |
| `docs/STATUS.md` | Estado exacto tras cada commit. | Documentación / Lead |
| `index.html`, `package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `eslint.config.js`, `.prettierrc.json` | Andamiaje y configuración. | Lead |

Regla de convivencia: escrituras disjuntas por rol; si hay varias personas/agentes, cada uno escribe
solo en su zona y las interfaces se fijan antes en `src/*/types.ts`. Los commits los hace el Lead.
Si trabajas solo, mantén los commits separados por naturaleza (código + tests + docs en el mismo
commit de feature, como manda el plan).

## 6. Flujo obligatorio por feature

1. Lee `STATUS` y la fase/tarea del `PLAN` que toca; confirma que no está ya hecha.
2. Identifica la capa correcta y los contratos que toca (`ARCHITECTURE`).
3. Escribe o actualiza los **tests primero** (si la lógica es nueva, deben fallar antes).
4. Implementa en la capa correcta, dentro de los límites.
5. `npm run check` hasta verde (typecheck + lint + tests + build).
6. Prueba manual del flujo afectado (checklist de [`docs/TESTING.md`](docs/TESTING.md)).
7. Actualiza `CHANGELOG.md` (sección «No publicado») **y** `docs/STATUS.md` en el mismo commit.
8. Si cambió un contrato, un número de diseño o una decisión: actualiza
   `ARCHITECTURE.md`/`GAME_DESIGN.md`/`DECISIONS.md`/`TESTING.md` según toque.
9. Commit convencional atómico: `tipo(scope): descripción en español, imperativa y corta`.

Si una fase se puede paralelizar (p. ej. render y gameplay), fija antes las interfaces en
`src/render/types.ts` y `src/world/types.ts` y evita solapar escrituras.

## 7. Estilo de código y de commits

- TypeScript estricto (`strict`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`): usa
  `import type` para tipos; sin `any` implícito.
- Funciones y ficheros pequeños, una responsabilidad y nombre que la diga. Si algo anida demasiado,
  extrae una función; no añadas `eslint-disable` sin motivo registrado.
- Datos de configuración inmutables (`as const`), tipos explícitos en las fronteras de módulo.
- Comentarios en español y centrados en el **por qué**; el **qué** lo dice el código.
- Nada de efectos secundarios ocultos: los sistemas mutan el estado, render/UI solo leen; usa el bus
  de eventos para desacoplar feedback (audio, HUD, puntuación).
- Antes de commitear: `npm run check` verde y Prettier aplicado (`npm run format`).
- Commits: `feat`, `fix`, `docs`, `chore`, `test`, `refactor`, `perf`, `style`; scope del módulo
  (`core`, `render`, `world`, `player`, `combat`, `ai`, `loot`, `hud`, `mission`, `audio`, `docs`,
  `release`). Ejemplos en [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md#4-git-y-conventional-commits).

## 8. Documentación viva y handoff

- `CHANGELOG.md`: Keep a Changelog, en español, actualizado en el mismo commit que la feature.
- `docs/STATUS.md`: se actualiza en **cada** commit; debe decir la verdad sobre el último commit,
  la fase, lo hecho, lo que queda y la deuda técnica, e incluir cómo ejecutar y cómo retomar.
- La documentación se escribe durante el desarrollo, no al final: si el código cambió y la doc no,
  la doc está mal.
- Los ADR son cortos y numerados; se añade uno nuevo cuando se toma una decisión que limita el
  futuro (dependencia, asset, contrato, desviación del plan). No se reescribe un ADR aceptado: se
  marca como sustituido y se añade otro.

### Checklist al terminar una sesión de trabajo

- [ ] `npm run check` en verde.
- [ ] Tests nuevos o actualizados para todo comportamiento nuevo.
- [ ] `CHANGELOG.md` actualizado en «No publicado».
- [ ] `docs/STATUS.md` exacto: último commit, fase, hecho / en curso / pendiente / deuda.
- [ ] Docs de diseño/arquitectura/pruebas actualizadas si cambió un contrato o un número.
- [ ] Sin ficheros temporales, sin `node_modules/`/`dist/` añadidos, sin cambios fuera de alcance.
- [ ] Commit convencional hecho (o cambios comunicados al Lead si no eres quien commitea).
- [ ] Dudas y contradicciones anotadas como pendientes, no resueltas en silencio.

## 9. Si encuentras una contradicción o una ambigüedad

1. No improvises un cambio de alcance ni de arquitectura.
2. Prioridad: **código real** para el estado operativo; **PLAN** para el alcance aprobado;
   **STATUS** para qué está hecho; **este documento y DEVELOPMENT** para las normas.
3. Aplica el supuesto por defecto del plan ([`docs/PLAN.md`](docs/PLAN.md) §16) y anótalo como
   pendiente para el Lead (preferiblemente en `docs/STATUS.md` o en la tarea correspondiente).
4. Si bloquea el trabajo, comunícalo antes de tocar código que dependa de esa decisión.
