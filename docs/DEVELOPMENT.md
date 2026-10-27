# Normas de desarrollo — BattleTank-DS

Reglas de trabajo del proyecto: código, git, changelog, estado, pruebas y definición de terminado.
Se derivan de [`PLAN.md`](PLAN.md) §9 y están alineadas con la configuración real del repositorio
(`eslint.config.js`, `tsconfig.json`, `.prettierrc.json`, `package.json`).

> Si este documento y la configuración discrepan, **manda la configuración** y se corrige este
> documento. Los límites no se cambian sin decisión explícita del Lead.

## 1. Principios de código

- Una responsabilidad por función y por fichero; nombres que digan lo que hacen.
- Sin bucles anidados: se extrae una función o se usa una utilidad ya encapsulada (`core/math`,
  búsquedas por índice, `flatMap`).
- Sin efectos secundarios ocultos: `systems` muta el estado de partida; `render`/`ui` solo leen;
  `world`/`core` son deterministas y puros.
- Los datos de configuración viven en `src/config/` como `as const`; ningún sistema lleva números de
  balance codificados.
- Comentarios en español, centrados en el **porqué**; código e identificadores en inglés.
- Sin `any`, sin `@ts-ignore` y sin desactivar reglas sin justificarlo y registrarlo.
- Sin código muerto, sin `TODO` sin dueño/fase y sin `console.log` de depuración permanente.
- La puntería es matemática pura (`systems/aim.ts`); el cableado DOM de teclado y ratón vive en
  `main.ts`, que inyecta un `InputState` en `createGame`. `game.ts` no enlaza eventos, para que los
  tests puedan inyectar entrada sin DOM.
- Antes de optimizar: respetar el presupuesto de rendimiento del renderer y medir con el contador de
  depuración (`F3`, previsto).

## 2. TypeScript

`tsconfig.json` activa, entre otras: `strict`, `noUncheckedIndexedAccess`, `noUnusedLocals`,
`noUnusedParameters`, `noFallthroughCasesInSwitch`, `isolatedModules`, `verbatimModuleSyntax`,
`forceConsistentCasingInFileNames`.

Consecuencias prácticas:

- Acceder a un array o a un índice de objeto puede devolver `undefined`: compruébalo o demuestra con
  tipos que no ocurre.
- Usa `import type { … }` para tipos (`consistent-type-imports` está activo); las importaciones de
  valores, normales.
- Nada de variables/parámetros sin usar: no los dejes «por si acaso».
- En las fronteras de módulo (tipos de `types.ts`, funciones públicas) los tipos son explícitos; en
  el interior se puede inferir.
- `unknown` + validación en vez de `any` cuando el dato viene de fuera (almacenamiento, DOM, eventos).
- Ficheros en `camelCase.ts`, en inglés, un concepto por fichero; los tipos compartidos de una capa
  van en su `types.ts`.

## 3. Reglas ESLint

Configuración actual en `eslint.config.js` (base `@eslint/js` + `typescript-eslint` recommended).
`npm run lint` ejecuta `eslint . --max-warnings 0` sobre **todo** el repositorio.

### `src/**/*.ts` (reglas de tamaño y complejidad)

| Regla | Configuración exacta | Objetivo de diseño |
|---|---|---|
| `max-lines` | `['error', { max: 300, skipBlankLines: true, skipComments: true }]` | 200 líneas por fichero |
| `max-lines-per-function` | `['error', { max: 60, skipBlankLines: true, skipComments: true }]` | 40 líneas por función |
| `complexity` | `['error', 10]` | complejidad ciclomática ≤ 10 |
| `max-depth` | `['error', 3]` | ≤ 3 bloques anidados |
| `max-params` | `['error', 4]` | ≤ 4 parámetros; si no, objeto de opciones |
| `max-statements` | `['error', 20]` | ≤ 20 sentencias por función |
| `no-restricted-syntax` | error: **bucles anidados prohibidos** (cualquier combinación de `for`, `for…of`, `for…in`, `while`, `do…while` dentro de otro bucle) | extraer función/utilidad |
| `@typescript-eslint/no-explicit-any` | error | usar `unknown` + validación |
| `@typescript-eslint/consistent-type-imports` | error | `import type` |

Además, `typescript-eslint` recommended mantiene `@typescript-eslint/ban-ts-comment` en error:
`@ts-ignore` está prohibido; `@ts-expect-error` exige una descripción (mínimo 3 caracteres) y solo se
admite como último recurso justificado.

Notas:

- `max-lines-per-function` cuenta también callbacks y funciones flecha: si un callback crece, extrae
  una función con nombre.
- Los mensajes de error de ESLint indican fichero, línea y medida exacta. Corrige la causa; no
  desactives la regla.

### Exenciones de `tests/**/*.ts` y configuraciones

- `tests/**/*.ts`: `max-lines`, `max-lines-per-function`, `max-statements` y `max-depth` están
  **desactivadas**; `complexity` (≤ 10) y `max-params` (≤ 4) **siguen activas**.
- `*.config.ts` y `*.config.js`: `max-lines` y `no-explicit-any` desactivadas.
- `dist/`, `node_modules/` y `coverage/` están ignorados.

### Excepciones puntuales

Si de verdad no hay alternativa:

1. Usa `// eslint-disable-next-line <regla> -- <motivo>` en la línea concreta, nunca un
   `eslint-disable` de fichero.
2. Registra la excepción en `docs/STATUS.md` (fichero, regla, motivo y fase en la que se revisará)
   como deuda técnica.
3. Si la excepción afecta a arquitectura o rendimiento, añade ADR.

### Formato (Prettier)

`.prettierrc.json`: `semi: true`, `singleQuote: true`, `printWidth: 100`, `trailingComma: "all"`,
`arrowParens: "always"`. No se discute el formato en revisiones: se ejecuta `npm run format`.
**Prettier no forma parte de `npm run check`**; `npm run format:check` es una comprobación aparte que
conviene ejecutar antes del commit.

## 4. Git y Conventional Commits

- Rama única `main`; commits atómicos; **un commit por feature**, precedido por sus tests y con
  código + tests + documentación juntos.
- Formato: `tipo(scope): descripción en español, imperativa y corta` (≤ ~72 caracteres en la primera
  línea). Si hace falta explicar el porqué, cuerpo separado por una línea en blanco.
- Antes de commitear: `npm run check` en verde y `npm run format`. Nunca se deja `main` roto.
- No se commitea código generado: `dist/`, `node_modules/`, `coverage/`, `.npm-cache/`, `*.log`.
- No se reescribe historia ya compartida ni se hace `push --force` a `main`; no se enmendaría un
  commit que ya esté publicado.
- Al cerrar la fase 11: etiqueta anotada `v0.1.0`.
- Los commits los hace el Lead; los colaboradores/agentes entregan el cambio y el mensaje propuesto.

### Tipos permitidos

| Tipo | Uso |
|---|---|
| `feat` | Nueva funcionalidad visible o de motor. |
| `fix` | Corrección de un defecto de comportamiento. |
| `docs` | Documentación, README, comentarios de diseño, changelog. |
| `chore` | Andamiaje, configuración, dependencias de desarrollo, release. |
| `test` | Solo pruebas (nuevas o corregidas), sin cambio de comportamiento. |
| `refactor` | Reestructuración sin cambio de comportamiento. |
| `perf` | Mejora de rendimiento medible. |
| `style` | Formato/estilo sin cambio funcional (usar poco; Prettier lo hace). |

### Scopes preferidos

`core`, `render`, `world`, `player`, `combat`, `ai`, `loot`, `hud`, `mission`, `audio`, `docs`,
`test`, `config`, `build`, `release`. El scope debe coincidir con la capa o el área tocada.

### Ejemplos

```text
chore: bootstrap vite+ts, lint, tests y documentación base
feat(core): matemáticas, rng determinista y bucle de paso fijo
feat(render): pipeline de cámara, proyección, recorte y painter
feat(world): generación procedural determinista del escenario
feat(player): movimiento solidario, colisión y cámara de periscopio
feat(combat): disparo, recarga, proyectiles e impactos
feat(ai): enemigos con línea de visión y máquina de estados
feat(loot): pickups de cura, mejora y potencia
feat(hud): vida, progreso, puntuación, radar y recarga
feat(mission): misiones escaladas y progresión de campaña
feat(audio): efectos sintetizados con WebAudio
fix(combat): el daño no atraviesa coberturas intactas
test(world): conectividad y determinismo por semilla
docs(status): handoff tras fase 4
chore(release): 0.1.0
```

Un commit de feature puede incluir varios ficheros de una misma capa y sus tests; no mezcles capas
no relacionadas ni metas refactors ajenos «de paso».

## 5. CHANGELOG.md

- Formato [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/), en español.
- Se actualiza **en el mismo commit** que la feature, en `## [No publicado]`; no se aplaza al final de
  la fase.
- Secciones habituales: `### Añadido`, `### Cambiado`, `### Corregido`, `### Eliminado` (y
  `### Decidido` para decisiones de alcance, como en el bootstrap).
- Se escribe para quien lee el historial: qué cambia y por qué, en pasado («Añadido…»), sin ruido de
  refactors internos sin efecto visible.
- Al etiquetar `v0.1.0`, `[No publicado]` pasa a `[0.1.0] — AAAA-MM-DD` y se abre una sección nueva.

## 6. docs/STATUS.md

Es el punto de entrada para retomar el proyecto y se actualiza **en cada commit**:

- Cabecera: fecha, fase actual y **último commit**.
- `Hecho`: lo cerrado y verificado (no lo que «debería» estar).
- `En curso`: la tarea activa, concreta.
- `Pendiente`: tabla por fases.
- `Deuda técnica registrada`: excepciones de ESLint, limitaciones conocidas, decisiones pendientes.
- `Cómo retomar`, comandos de referencia y notas operativas (entorno, decisiones del día).

Regla de honestidad: si no sabes si algo está hecho, comprueba el código y `git log`; no lo anotes
como hecho por inercia. Los cambios de `STATUS.md` se hacen en el mismo commit que el trabajo que
describen.

## 7. Definición de terminado (por feature)

1. Implementación dentro de los límites de tamaño/complejidad.
2. Tests unitarios de la lógica nueva (y de regresión si aplica).
3. `npm run check` en verde (typecheck + lint + tests + build).
4. Prueba manual del flujo afectado (checklist de [`TESTING.md`](TESTING.md)).
5. `CHANGELOG.md` y `docs/STATUS.md` actualizados.
6. Commit convencional que incluye código + tests + docs.
7. Documentación de diseño/arquitectura actualizada si cambió un contrato o un número.

Sin los siete no está terminado; «funciona en local» no es la definición de terminado.

## 8. Plantilla de tarea/feature

```markdown
### feat(<scope>): <título corto en imperativo>

**Objetivo:** qué comportamiento/entrega se consigue.
**Contexto:** fase del PLAN y sección de referencia; enlace a la deuda o incidencia si la hay.
**Alcance:**
- [ ] ...
- [ ] ...

**Fuera de alcance:** lo que NO entra (para evitar scope creep).
**Criterios de aceptación:**
- [ ] Comportamiento observable y comprobable.
- [ ] Tests que lo demuestran (rutas de test).
- [ ] `npm run check` verde.

**Plan de tests:** unitarios / render con contexto simulado / integración headless / manual.
**Docs a actualizar:** CHANGELOG · STATUS · GAME_DESIGN · ARCHITECTURE · DECISIONS · TESTING.
**Riesgos:** rendimiento, oclusión, dificultad, determinismo…
**Notas de implementación:** contratos que se fijan, ficheros que se tocan.
```

## 9. Cómo añadir contenido

### Añadir una misión

1. Añade una entrada en `src/config/missions.ts` con nombre, composición de enemigos, densidad de
   coberturas, precisión, tiempo de reacción, multiplicador de daño y cualquier parámetro nuevo.
2. Añade o amplía el **test de contrato** que recorre todas las misiones y valida: identificadores
   únicos, composición coherente, valores en rango, y que la generación del escenario valida con
   varias semillas fijas.
3. Si la misión necesita un objetivo distinto (defender una posición, escoltar, límite de tiempo), ya
   no es «añadir un dato»: es una feature de diseño que requiere decisión del usuario, tests propios
   y, si cambia el contrato de misión, actualización de `ARCHITECTURE.md` (y ADR si afecta a
   decisiones).
4. Añade la fila a la tabla de [`GAME_DESIGN.md`](GAME_DESIGN.md#9-misiones-y-dificultad), y actualiza
   `CHANGELOG.md` y `STATUS.md`.
5. Ejecuta `npm run check` y prueba la dificultad a mano (checklist de QA).

Recordatorio del plan: **ampliar misiones debe ser añadir datos, no tocar sistemas**; el test de
contrato lo garantiza.

### Añadir un tanque

1. Añade sus stats y colores a `src/config/tanks.ts` (PV, velocidad, giro, recarga, daño, blindaje,
   velocidad de proyectil, colores de casco/torreta/cadenas/cañón y bando); es la fuente de verdad.
2. Si es enemigo, inclúyelo en la composición de la misión (`src/config/missions.ts`, fase 9) y usa
   los parámetros de IA existentes (`AI_TUNING` en `balance.ts`).
3. Crea su modelo de cajas/polígonos en `src/render/models.ts`; mantén el número de caras dentro del
   presupuesto de rendimiento.
4. Tests: validación de los datos de configuración, test de caras del modelo (tipos de caja y orden)
   y comportamiento de daño/muerte/IA si cambia.
5. Actualiza el resumen de balance de [`GAME_DESIGN.md`](GAME_DESIGN.md#13-balance-de-tanques-segunda-guerra-mundial),
   el `CHANGELOG.md` y `STATUS.md`.
6. Si el tanque necesita una mecánica nueva (torreta independiente, blindaje por ángulo, tipo de
   proyectil…), no es un dato: es feature + diseño + ADR si cambia contratos.

### Añadir un pickup

1. Define tipo y números en configuración (efecto, duración, acumulación, límite) y, si aplica, su
   probabilidad de aparición por misión.
2. Aplica la regla en `src/systems/loot.ts` (recogida, efecto, caducidad, topes) sin tocar el HUD.
3. Añade modelo en `src/render/models.ts`, icono/estilo en `src/ui/` y cuenta atrás en el HUD solo si
   el efecto es temporal.
4. Tests: efecto exacto, topes, acumulación y caducidad; formateo del HUD si es lógica pura.
5. Actualiza [`GAME_DESIGN.md`](GAME_DESIGN.md#7-pickups), `CHANGELOG.md` y `STATUS.md`.
6. Un efecto que requiera una regla nueva de simulación (marcar enemigos, invulnerabilidad, etc.)
   necesita decisión de diseño y tests de esa regla; no lo metas como dato suelto.

## 10. Dependencias y assets

- **Cero dependencias de runtime y cero assets externos** en 0.1.0. Esto es una decisión de
  arquitectura ([`DECISIONS.md`](DECISIONS.md)), no una preferencia.
- Una dependencia **de desarrollo** nueva exige:
  1. ADR nuevo con contexto, necesidad real, alternativas sin dependencia, licencia, tamaño y
     mantenimiento del paquete;
  2. aprobación explícita del usuario/Lead antes de instalar;
  3. actualización de `package.json`/lockfile, `README.md` (stack) y `DECISIONS.md`;
  4. `npm run check` en verde y revisión del impacto en build.
- Assets (imágenes, fuentes, audio, modelos) tampoco entran sin decisión explícita: primero se agota
  la alternativa procedural (polígonos, CSS, fuentes del sistema, WebAudio sintetizado). Si en el
  futuro se aprueba un asset, necesitará ADR con procedencia y licencia.
- No se añaden dependencias para tests (p. ej. jsdom) sin pasar por el mismo proceso; los dobles se
  escriben a mano.

## 11. Estilo de tests

Detalle completo en [`TESTING.md`](TESTING.md); resumen de convenciones:

- **Vitest** en entorno Node; `npm test` = `vitest run`, `npm run test:watch` para desarrollo.
- Ficheros `tests/<capa>/<modulo>.test.ts`, espejo de `src/`; integración en `tests/integration/`.
- `describe` con el área/módulo; `it` en español, en presente y describiendo el comportamiento
  («genera el mismo mapa con la misma semilla»).
- Estructura arrange–act–assert; una intención por test; aserciones explícitas.
- Deterministas: semillas fijas, sin red, sin esperas reales (`vi.useFakeTimers()` cuando haga falta).
  Nada de depender del reloj o del orden de ejecución.
- Sin DOM real ni jsdom: la UI se prueba con funciones puras extraídas; el renderer, con un contexto
  2D simulado y fixtures de rejilla/cámara/caras; la IA, con rejilla, jugador y RNG inyectados.
- Helpers compartidos en `tests/helpers/` (previsto) para no duplicar fixtures.
- Los tests son código: también se leen, se refactorizan y no se dejan comentados.
- Estado actual: **183 tests en 31 ficheros** (`tests/core`, `tests/world`, `tests/render`,
  `tests/systems`, `tests/game`, `tests/config` y `tests/entities`), incluidas las pruebas de
  puntería, LOS, A*, IA, modelos, oclusión, colisión entre tanques, pickups y blindaje direccional.

## 12. Si falla `npm run check`

El orden de la puerta es: `typecheck → lint → test → build`. Ataca el primer fallo; los siguientes
pueden ser consecuencia.

| Paso | Qué hacer | Causas típicas |
|---|---|---|
| `typecheck` (`tsc --noEmit`) | Lee `fichero:línea` y corrige el tipo. | Índices posiblemente `undefined` (`noUncheckedIndexedAccess`), imports de tipo sin `import type`, variables/parámetros sin usar, uniones no exhaustivas. |
| `lint` (ESLint) | Corrige la causa. | Fichero > 300 o función > 60 líneas, > 20 sentencias, complejidad > 10, anidamiento > 3, bucle anidado, > 4 parámetros, `any`, imports de tipo. |
| `test` (Vitest) | Ejecuta el fichero suelto: `npx vitest run tests/world/generate.test.ts` (o `npm test -- tests/world/generate.test.ts`). | Supuesto del test desactualizado, RNG/estado compartido entre tests, tiempo real. |
| `build` (Vite) | Revisa el error de resolución/HTML. | Import a fichero inexistente, ruta mal escrita, dependencia no instalada, error en `index.html`. |

Después de corregir, vuelve a ejecutar `npm run check` completo. Si un fallo no se puede resolver en
un tiempo razonable: no commitees en rojo, anota el problema en `STATUS.md` (deuda/pendiente) y
comunícalo al Lead. No se arregla un test borrándolo ni una regla desactivándola sin justificación
registrada.

## 13. Pendientes y supuestos detectados (para el Lead)

Decisiones que este documento ha tenido que asumir; conviene cerrarlas y corregir la doc si cambian:

- **Versión de Node:** el `PLAN` cita Node 24 / npm 11 como entorno; `package.json` declara
  `engines.node >= 20` y `STATUS.md` menciona Node 24 / npm 11. [`README.md`](../README.md) requiere
  «Node 20+» y recomienda un LTS reciente. Decidir si el requisito oficial es ≥ 20 o ≥ 22/24.
- **Orden de lectura para agentes:** el `PLAN` §9.3 sugiere `STATUS → DEVELOPMENT → PLAN`; este
  repositorio usa `STATUS → PLAN → DEVELOPMENT → ARCHITECTURE` (más útil: alcance antes que normas).
  Si el Lead prefiere el orden del plan, hay que actualizar `AGENTS.md` y `README.md`.
- **ESLint:** la configuración real añade `no-explicit-any`, `consistent-type-imports`, exenciones
  parciales en `tests/` y opciones `skipBlankLines`/`skipComments` que el plan no detallaba. Este
  documento replica la configuración; mantenerlo sincronizado si cambia.
- **Prettier fuera de `check`:** la puerta no comprueba formato. Valorar añadir `format:check` al
  script `check` (requiere tocar `package.json`, propiedad del Lead).
- **Sin CI:** la calidad se verifica solo en local. Si se añade integración continua, documentar el
  flujo aquí y en `README.md`.
- **Licencia:** no declarada; pendiente de decisión del usuario.
- **Balance fase 6:** el balance real está en `src/config/tanks.ts` (Panzer III 100 PV; Tiger I
  140 PV y 10 % de blindaje); el ajuste de dificultad por misión queda para la fase 9.
- **Puntería:** el cono de ratón (±15° / ±4°) y el mapeo lineal están en `AIM_LIMITS`/`aim.ts`; no
  hay sensibilidad configurable ni curvas (ver GAME_DESIGN §12). El cursor se oculta con CSS.
- **Pendientes de diseño:** ver [`GAME_DESIGN.md`](GAME_DESIGN.md#12-pendientes-de-diseño-para-el-lead)
  (fórmula de puntuación, reducciones de daño de pickups, balance de misiones, reposición de IA,
  modelo de impacto de tanques…).

## 14. Ganchos de depuración

Herramientas de desarrollo y QA; no forman parte de la API del juego ni deben usarse desde la lógica:

- **`?seed=<entero>`** en la URL (`http://localhost:5173/?seed=123`): `main.ts` la lee y la pasa a
  `createGame`. Reproduce escenario, spawns y reparto de enemigos; sin parámetro se usa la hora
  actual. Es la forma recomendada de adjuntar un caso reproducible a un bug o comparar balance.
- **`window.__BT__`**: `main.ts` expone la instancia `Game` (tipada en `src/global.d.ts`) para
  inspeccionarla desde la consola:
  `__BT__.seed`, `__BT__.player`, `__BT__.enemies`, `__BT__.bullets`, `__BT__.arena`. Permite leer
  estado y recolocarlo para QA manual. No es estable entre fases y no debe referenciarse desde
  `src/` (salvo el propio `main.ts`/tipos).
- Para tests automáticos, usa las APIs inyectables: semilla en `createGame({ seed })` e `InputState`
  propio; no dependas de la URL ni de `window`.
- Sigue prohibido el `console.log` de depuración permanente: estos dos ganchos son la vía sancionada.


## 15. Registro de incidencias (bugs)

- Todo fallo confirmado recibe un identificador `BUG-NNN` y se documenta en
  [`STATUS.md`](STATUS.md) con: síntoma, reproducción, causa raíz, arreglo propuesto, criterios de
  aceptación y bloque/fase donde se resuelve.
- La corrección se hace con un commit `fix(scope): ...`, incluye un test de regresión que falla antes
  y pasa después, actualiza `CHANGELOG.md` (sección `Corregido`) y `STATUS.md`.
- La incidencia no se borra al cerrarla: se marca como resuelta con el hash del commit, para que
  quede trazabilidad de lo que pasó.
- Si el arreglo cambia un contrato de capas o una decisión de diseño, se actualizan
  `ARCHITECTURE.md`/`DECISIONS.md` y se avisa al Lead.
