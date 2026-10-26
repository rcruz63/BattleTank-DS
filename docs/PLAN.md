# Plan de desarrollo — BattleTank-DS

> **Estado:** propuesta para aprobación · **Fecha:** 2026-10-26 · **Versión objetivo:** `0.1.0`
>
> Este documento es el plan de referencia del proyecto. La verdad operativa del día a día
> (qué está hecho, qué se está haciendo, qué falta y qué deuda técnica hay) vive en
> [`docs/STATUS.md`](STATUS.md) y se actualiza en cada commit.

---

## 1. Resumen

Shooter de tanques en **primera persona tipo periscopio**, con geometría de polígonos planos
inspirada en el arcade clásico *Battle Tank / Battlezone* y en carros de la Segunda Guerra
Mundial. El jugador está dentro del tanque: solo ve el sector al que apunta la mira, y el
tanque (casco y torreta) gira y avanza solidariamente con ella. El escenario se genera en
cada partida, con coberturas que ocultan la visión y que en parte son destruibles. La campaña
escala en dificultad y la interfaz da información táctica sin desvelar el detalle del mapa.

Entrega `0.1.0`: **vertical slice jugable completo** con 3 misiones encadenadas.

---

## 2. Decisiones confirmadas

| Tema | Decisión |
|---|---|
| Perspectiva | Primera persona tipo periscopio, polígonos pseudo-3D planos (Canvas 2D) |
| Stack | TypeScript + Vite + Canvas 2D + Vitest, sin dependencias en runtime |
| Alcance 0.1.0 | Vertical slice: escenario generado, combate, IA, coberturas, pickups, HUD, misiones, audio |
| Controles | Escritorio con teclado: `W/S` avanzar/retroceder, `A/D` girar tanque+mira, `Espacio`/clic disparar, `Esc` pausa, `M` silenciar |
| Idioma | Interfaz y documentación en español; identificadores, tipos y nombres de fichero en inglés |
| Audio | Efectos sintetizados con WebAudio (sin ficheros de audio) |
| Assets | Cero assets externos: geometría, tipografía e iconos procedurales/CSS |
| Persistencia | `localStorage` solo para récord de puntos y misión máxima desbloqueada; sin guardado a mitad de partida |

**Supuestos** (corregibles sin tocar la arquitectura): título provisional
«BATTLE TANK — PERISCOPIO»; 3 misiones en 0.1.0; una sola facción jugable (aliada);
sin soporte móvil ni multijugador en 0.1.0; navegadores modernos de escritorio.

---

## 3. Concepto y bucle de juego

1. **Briefing** de misión (texto breve, objetivo, tecla para empezar).
2. El jugador avanza por un **escenario generado** sin mapa completo: solo periscopio, radar
   y barra de progreso.
3. Enemigos patrullan, toman línea de visión y disparan; las coberturas bloquean la visión
   y los proyectiles. Las coberturas destructibles se derriban a cañonazos y abren nuevas
   líneas de tiro.
4. El jugador recoge **botiquín**, **mejora** y **potencia**, administra la recarga y elimina
   a todos los enemigos.
5. Al completar la misión: resumen de puntuación y paso a la siguiente, con más enemigos
   y mayor agresividad. Al morir: derrota, resumen y reintento.
6. Se guardan récord y misión desbloqueada; la partida se puede reanudar desde el menú.

**Victoria:** 100 % de progreso (todos los enemigos del escenario destruidos).
**Derrota:** vida a 0 o salir del área jugable (el escenario está cerrado por coberturas).

---

## 4. Alcance de la entrega 0.1.0

### Dentro

- Motor pseudo-3D: cámara de periscopio, proyección, recorte de plano cercano, pintado por
  profundidad (painter's algorithm), niebla de distancia y oclusión por coberturas.
- Escenario procedural determinista (semilla) con validación de conectividad y spawns seguros.
- Tanque del jugador: avance/retroceso, giro solidario, colisión con deslizamiento, retroceso
  de cámara al disparar y sacudida al recibir daño.
- Combate: proyectiles, recarga con indicador, impactos, daño, destrucción de coberturas,
  puntuación.
- Enemigos: 2 tipos (ligero y pesado), línea de visión, máquina de estados, disparo con
  precisión escalada y evitación básica de obstáculos.
- Pickups: curación, mejora (blindaje/HP máximo) y potencia (daño y recarga temporales).
- HUD: vida, barra de progreso del escenario (% sin detalle), puntuación, radar circular,
  indicador de recarga (anillo + segundos) y avisos de estado.
- 3 misiones con dificultad creciente y progresión persistente mínima.
- Audio sintetizado (motor, cañonazo, impacto, recarga, pickup, UI) con volumen y mute.
- Documentación completa de handoff y normas de desarrollo.

### Fuera (deuda planificada, no se implementa en 0.1.0)

- Multijugador, móvil/táctil, gamepad, mando analógico.
- Modelos/texturas importados, animaciones esqueléticas, música.
- Editor de escenarios, mapas manuales, más de 3 misiones, campaña larga.
- Guardado a mitad de partida, tabla de clasificación en red, localización a otros idiomas.
- Efectos avanzados (sombras dinámicas, partículas GPU, post-proceso).
- Pathfinding táctico avanzado (flanqueo coordinado, coberturas inteligentes) más allá de A* básico.

---

## 5. Arquitectura técnica

### 5.1 Stack y comandos

- **TypeScript** estricto (`strict`, `noUncheckedIndexedAccess`), **Vite** para desarrollo y build.
- **Canvas 2D**, resolución interna fija 1280×720 escalada con CSS (letterboxing); HUD en DOM/CSS
  y radar en un canvas pequeño independiente.
- **Vitest** (entorno Node) para lógica pura y renderer con contexto gráfico simulado.
- **ESLint + typescript-eslint** con reglas de tamaño/complejidad y Prettier para formato.
- Node 24 / npm 11 (no hay pnpm instalado; no lo necesitamos).

```
npm run dev        # servidor de desarrollo
npm run build      # build estático en dist/
npm run preview    # sirve el build
npm run typecheck  # tsc --noEmit
npm run lint       # eslint + comprobación de normas
npm test           # vitest run
npm run check      # typecheck + lint + test + build (puerta de calidad)
```

### 5.2 Estructura de carpetas

```
BattleTank-DS/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
├── eslint.config.js
├── .gitignore
├── README.md
├── AGENTS.md                  # instrucciones para retomar el proyecto con IA
├── CHANGELOG.md
├── docs/
│   ├── PLAN.md                # este documento
│   ├── STATUS.md              # estado vivo: hecho / en curso / pendiente / deuda
│   ├── GAME_DESIGN.md         # concepto, controles, HUD, balance, misiones
│   ├── ARCHITECTURE.md        # módulos, contratos, flujo de datos, pipeline de render
│   ├── DEVELOPMENT.md         # normas de código, commits, changelog, definición de terminado
│   ├── DECISIONS.md           # ADRs cortos (decisiones y porqué)
│   └── TESTING.md             # estrategia de pruebas y checklist manual de QA
├── src/
│   ├── main.ts                # arranque: canvas, input, game
│   ├── config/                # datos de balance y contenido, sin lógica
│   │   ├── balance.ts
│   │   ├── tanks.ts
│   │   ├── missions.ts
│   │   └── palette.ts
│   ├── core/                  # utilidades puras y bucle
│   │   ├── loop.ts
│   │   ├── math.ts
│   │   ├── rng.ts
│   │   └── events.ts
│   ├── world/                 # escenario y física del terreno
│   │   ├── types.ts
│   │   ├── generate.ts
│   │   ├── grid.ts
│   │   ├── collision.ts
│   │   ├── los.ts
│   │   └── pathfind.ts
│   ├── render/                # pipeline gráfico
│   │   ├── types.ts
│   │   ├── canvas.ts
│   │   ├── camera.ts
│   │   ├── clip.ts
│   │   ├── painter.ts
│   │   ├── models.ts          # construcción de tanques/objetos con polígonos
│   │   └── scene.ts           # estado del juego -> lista de caras a pintar
│   ├── entities/
│   │   ├── player.ts
│   │   ├── enemy.ts
│   │   ├── bullet.ts
│   │   └── pickup.ts
│   ├── systems/
│   │   ├── input.ts
│   │   ├── combat.ts
│   │   ├── ai.ts
│   │   ├── loot.ts
│   │   ├── mission.ts
│   │   ├── score.ts
│   │   └── progression.ts
│   ├── ui/
│   │   ├── hud.ts
│   │   ├── radar.ts
│   │   ├── screens.ts
│   │   └── periscope.ts
│   ├── audio/
│   │   ├── synth.ts
│   │   └── audio.ts
│   └── game/
│       ├── game.ts            # composición y máquina de estados
│       └── state.ts           # estado serializable de una partida
└── tests/                     # espejo de src/ + escenarios de integración
```

### 5.3 Contratos y separación de responsabilidades

- `src/config/*` no importa nada de `src/systems` ni `src/render`: son datos puros editables.
- `src/core/*` no conoce el juego: matemáticas, azar y bucle, 100 % testeables.
- `src/world/*` no conoce Canvas ni DOM: solo rejilla, colisión, línea de visión y pathfinding.
- `src/render/*` no muta el estado: recibe una instantánea (`WorldSnapshot`) y produce caras +
  operaciones de pintado. Se puede probar con un contexto simulado.
- `src/systems/*` contiene reglas de juego puras sobre el estado (sin Canvas ni DOM).
- `src/ui/*` y `src/audio/*` son adaptadores: DOM, CSS y WebAudio.
- `src/game/game.ts` es el único que cablea todo; `main.ts` solo arranca.

### 5.4 Límites de tamaño y complejidad (hard limits)

| Norma | Límite | Herramienta |
|---|---|---|
| Fichero | 200 líneas objetivo, **300 error** (tests y config aparte) | ESLint `max-lines` |
| Función | 40 líneas objetivo, **60 error** | ESLint `max-lines-per-function` |
| Complejidad ciclomática | ≤ 10 | ESLint `complexity` |
| Anidamiento de bloques | ≤ 3 | ESLint `max-depth` |
| Bucles anidados | **prohibido `for`/`while` dentro de `for`/`while`**; usar funciones auxiliares, `flatMap`, recorridos por índice o búsquedas ya encapsuladas | ESLint `no-restricted-syntax` |
| Parámetros | ≤ 4 (si no, objeto de opciones) | ESLint `max-params` |
| Sentencias por función | ≤ 20 | ESLint `max-statements` |
| Tipos | sin `any` implícito ni `@ts-ignore`; `unknown` + validación si hace falta | TypeScript + ESLint |

Las excepciones puntuales se justifican con `// eslint-disable-next-line <regla> -- motivo` y se
registran en `docs/STATUS.md` como deuda técnica.

---

## 6. Motor pseudo-3D

### 6.1 Modelo de mundo

- Mundo 3D simplificado: plano de suelo `(x, z)`, altura `y`. Unidad = metro.
- **Rejilla de celdas** de 4 m (arena 64–96 m de lado, 16×16 a 24×24 celdas). Cada celda es
  vacía o una **cobertura** con material, altura y vida.
- Las coberturas son prismas de 4 caras verticales; el jugador no ve por encima de ellas
  (alturas 2,4–3,4 m > altura de cámara 1,7 m), así que **la oclusión es total mientras están
  intactas**. Al destruirlas quedan escombros bajos y se ve a través.
- Tanques, pickups y proyectiles son objetos con posición y orientación en el plano.

### 6.2 Cámara y proyección

- Cámara en la posición del tanque + 1,7 m de altura, `yaw` = rumbo del tanque (solidario),
  `pitch` fijo ligeramente hacia abajo. FOV horizontal ≈ 72°.
- Transformación mundo → cámara (giro por `yaw` + traslación), proyección perspectiva
  `x' = f·x/z`, `y' = f·y/z`, con `f = (ancho/2)/tan(fov/2)`.
- **Recorte de plano cercano** (`z ≥ 0,3`) con Sutherland–Hodgman antes de proyectar.
- Sacudida/retroceso: desplazamientos pequeños y temporales de `yaw`/pitch/posición; nunca
  alteran el rumbo lógico del tanque.

### 6.3 Pipeline de render y oclusión

1. Culling por celda (distancia máxima + frustum por ángulo) y de objetos.
2. Generación de caras (polígonos con color plano y normal) desde las coberturas, tanques,
   pickups, proyectiles y suelo (rejilla proyectada).
3. Sombreado plano por normal + **niebla de distancia** (mezcla al color del horizonte) que da
   profundidad y oculta el borde del mundo.
4. Ordenación **painter's algorithm** por profundidad media y pintado con Canvas 2D.
   Las coberturas intactas tapan lo que hay detrás; al destruirse, dejan de aportar caras.
5. Overlay de periscopio: viñeta, mira con marcas de distancia, silueta del cañón y del casco
   (polígonos en primer plano), destello de impacto y feedback de recarga.

Limitación conocida: el painter's algorithm puede producir artefactos en cruces exactos de
geometría; el diseño evita intersecciones (celdas disjuntas) y lo asume como deuda cosmética.

### 6.4 Presupuesto de rendimiento

- Objetivo 60 fps a 1280×720 en un portátil moderno.
- Presupuesto: ≤ 1 500 caras visibles, ≤ 500 operaciones de dibujo por frame; contador de
  depuración con `F3` (fps, caras, celdas visibles, entidades).
- Si se excede: reducir distancia de dibujado, culling más agresivo, resolver el paso de
  renderizado con arreglos reutilizados (sin asignaciones por frame).

---

## 7. Sistemas de juego

### 7.1 Generación del escenario

- RNG determinista (`mulberry32`) sembrado con `Date.now()` y visible en el briefing
  (permite reproducir un escenario para depurar).
- Algoritmo: borde cerrado de coberturas indestructibles → colocación de grupos de coberturas
  (paseos aleatorios / habitaciones) con densidad por misión → validación con *flood fill*
  de que las zonas de spawn y pickups son alcanzables → colocación de jugador, enemigos y
  pickups con distancias mínimas → reintentos acotados (máx. 30) con validación de reglas.
- Variedad de materiales: madera (destructible, 1 impacto), ladrillo (destructible, 3 impactos),
  hormigón y acero (indestructibles). Alturas 2,4–3,4 m para garantizar oclusión.
- Tests: determinismo por semilla, conectividad, ausencia de solapamientos, distancias mínimas.

### 7.2 Movimiento y colisión

- Física 2D en el plano: el tanque avanza/retrocede a lo largo de su rumbo; `A/D` giran casco
  y mira a la vez (sin torreta independiente, fiel a «solidario con la mira»).
- Colisión círculo vs. celdas con **deslizamiento** por ejes; sin atravesar coberturas.
- Límites del escenario cerrados. Inercia ligera y aceleración corta para dar peso.
- Cámara con pequeña inercia visual; nada que rompa la solidaridad lógica.

### 7.3 Combate

- Proyectiles balísticos discretos (no hitscan) con velocidad, gravedad visual y vida útil;
  colisión con coberturas (daño) y tanques.
- Recarga: 2,4 s base; anillo alrededor de la mira + segundos restantes en el HUD. La tecla de
  disparo no se repite automáticamente: hay que volver a pulsar.
- Daño del jugador: 40 por impacto (3 impactos a un ligero, 4 a un pesado con blindaje).
- Feedback: fogonazo, retroceso de cámara, sacudida, marca de impacto, números flotantes de
  daño/puntos, escombros al destruir una cobertura.
- La barra de progreso sube con enemigos destruidos; jamás muestra cuántos quedan.

### 7.4 Enemigos e IA

- Dos tipos: **Panzer III** (ligero, rápido, dispara más) y **Tiger I** (pesado, lento, pega
  fuerte). Apariencia de polígonos por tipo y colores de facción.
- Máquina de estados: `idle/patrulla → avanzar → atacar → reposicionar → muerto`.
- Línea de visión por *raycast* de rejilla (DDA): no disparan a través de coberturas intactas.
- Si no hay LOS, avanzan con A* de rejilla hacia el jugador (mapa pequeño, coste bajo) y
  evitación local entre enemigos.
- Precisión, tiempo de reacción y cadencia escalan por misión. No hay *aimbot*: dispersión
  dependiente de la distancia y del tiempo de apuntado.

### 7.5 Pickups

| Pickup | Efecto | Visual |
|---|---|---|
| Botiquín (cura) | +30 PV, sin superar el máximo | Cruz blanca sobre caja |
| Mejora (upgrade) | +20 PV máx. y −10 % daño recibido durante la misión (acumulable ×3) | Llave inglesa/chevrones |
| Potencia (power) | 20 s: daño ×1,75 y recarga −35 % | Rayo amarillo |

- Aparecen en celdas libres alcanzables; 3–5 por misión; se recogen al pasar por encima
  (radio 2 m). HUD con icono y cuenta atrás de los efectos temporales.
- No reaparecen; al morir se pierden los acumulados de la misión.

### 7.6 Misiones y dificultad

Campaña de 3 misiones generadas con parámetros escalados (en `src/config/missions.ts`):

| Misión | Nombre | Enemigos | Densidad coberturas | Precisión IA | Reacción | Daño enemigo |
|---|---|---|---|---|---|---|
| 1 | Avance por el valle | 3 ligeros | 12 % | 25 % | 1,4 s | ×0,8 |
| 2 | Cruce de caminos | 4 ligeros + 1 pesado | 16 % | 35 % | 1,1 s | ×1,0 |
| 3 | Última línea | 4 ligeros + 2 pesados | 20 % | 45 % | 0,9 s | ×1,2 |

- Victoria: todos los enemigos destruidos. Derrota: vida 0.
- Resumen de misión: puntos, precisión, tiempo, daño recibido; récord persistente.
- Progresión: desbloqueo de misión y récord en `localStorage`; reintento desde el menú.
- Ampliar misiones = añadir una entrada de datos, sin tocar sistemas (test de contrato).

### 7.7 HUD, radar y periscopio

- **Vida**: barra + valor numérico (arriba a la izquierda). Cambia de color según el porcentaje.
- **Avance del escenario**: barra superior centrada, solo porcentaje (oculta el detalle).
- **Puntuación**: marcador arriba a la derecha; récord visible en pausa/resumen.
- **Radar**: circular, abajo a la derecha, centrado en el tanque y orientado con el rumbo;
  enemigos como triángulos rojos, pickups como rombos verdes, coberturas como trazos tenues.
  Alcance 45 m con barrido animado.
- **Recarga**: anillo de progreso alrededor de la mira + «1,4 s» si está recargando; el arma
  lista se marca con un destello.
- Capas: canvas 3D → viñeta de periscopio (CSS) → HUD DOM → overlays de menú/briefing/resultados.
- Accesibilidad mínima: textos legibles, contraste alto, sin depender solo del color (iconos).

### 7.8 Audio

- WebAudio 100 % sintetizado: motor (oscilador con filtro y pitch por velocidad), cañonazo,
  impacto/explosión, recarga, pickup, UI y ambiente de viento filtrado.
- Desbloqueo de `AudioContext` al primer input; `M` silencia; volumen maestro en pausa.
- Módulo aislado con interfaz `AudioBus`; en tests se sustituye por un doble.
- Sin música en 0.1.0 (deuda anotada).

---

## 8. Contenido y balance inicial (carros de la Segunda Guerra Mundial)

| Unidad | Bando | PV | Velocidad | Giro | Recarga | Daño | Notas |
|---|---|---|---|---|---|---|---|
| M4 Sherman (jugador) | Aliado | 100 | 6 m/s | 90°/s | 2,4 s | 40 | 10 % de reducción de daño base |
| Panzer III (ligero) | Eje | 60 | 4,5 m/s | 70°/s | 3,0 s | 10 | Más numeroso |
| Tiger I (pesado) | Eje | 140 | 3,2 m/s | 50°/s | 4,0 s | 20 | Poca cadencia, mucho daño |

- Puntuación: 100 por ligero, 250 por pesado, +500 por misión, bonificación por vida restante.
- Valores centralizados en `src/config/tanks.ts` y `src/config/balance.ts` para ajuste rápido.

---

## 9. Normas de desarrollo

### 9.1 Código

- Funciones pequeñas, con **una sola responsabilidad** y nombre que lo diga.
- Ficheros pequeños: 200 líneas objetivo, 300 máximo; un fichero = un concepto relacionado.
- Prohibido anidar bucles; si hace falta, extraer función o usar utilidades ya encapsuladas.
- Sin efectos secundarios ocultos en lógica; renderer y UI **no** mutan el estado.
- Tipos explícitos en fronteras de módulo; datos de configuración inmutables (`as const`).
- Comentarios en español, código en inglés; comentar el *porqué*, no el *qué*.
- Sin `any`, `@ts-ignore` ni dependencias nuevas sin justificar en un ADR.

### 9.2 Git y conventional commits

- Rama `main` con commits atómicos; **un commit por feature**, precedido de sus tests.
- Mensajes `tipo(scope): descripción en español, imperativa y corta`; tipos: `feat`, `fix`,
  `docs`, `chore`, `test`, `refactor`, `perf`, `style`.
- Ejemplos: `feat(render): pipeline de cámara, recorte y painter`,
  `feat(ai): enemigos con línea de visión y máquina de estados`,
  `docs(status): handoff tras fase 4`.
- Antes de cada commit: `npm run check` en verde. Commits pequeños y funcionales; nunca
  dejar `main` roto.
- Etiqueta `v0.1.0` al final de la fase 11.

### 9.3 Changelog y estado (handoff continuo)

- `CHANGELOG.md` (formato Keep a Changelog, en español) se actualiza **en el mismo commit** que
  la feature, sin esperar al final.
- `docs/STATUS.md` es el punto de entrada para cualquier persona/IA que retome el proyecto:
  estado actual, último commit, qué se está haciendo, pendientes, deuda técnica, cómo
  ejecutar y cómo retomar. Se actualiza en **cada** commit.
- `AGENTS.md` indicará a futuros agentes: leer `STATUS.md` → `DEVELOPMENT.md` → `PLAN.md`,
  correr `npm run check` y actualizar estado antes de terminar.

### 9.4 Definición de terminado (por feature)

1. Implementación dentro de los límites de tamaño/complejidad.
2. Tests unitarios de la lógica nueva (y de regresión si aplica).
3. `npm run check` en verde.
4. Prueba manual del flujo afectado.
5. `CHANGELOG.md` y `docs/STATUS.md` actualizados.
6. Commit convencional que incluye código + tests + docs.
7. Documentación de diseño/arquitectura actualizada si cambió un contrato.

---

## 10. Documentación y handoff

| Fichero | Propósito |
|---|---|
| `README.md` | Qué es, cómo instalarlo/ejecutarlo, controles, enlaces |
| `AGENTS.md` | Cómo retomar el trabajo (humano o IA), orden de lectura, comandos, normas |
| `docs/PLAN.md` | Plan maestro y alcance (este documento) |
| `docs/STATUS.md` | Estado vivo, pendientes, deuda técnica, cómo continuar |
| `docs/GAME_DESIGN.md` | Diseño de juego, controles, HUD, pickups, balance, misiones |
| `docs/ARCHITECTURE.md` | Módulos, contratos, flujo de datos, pipeline de render, decisiones |
| `docs/DEVELOPMENT.md` | Normas de código, git, changelog, pruebas, plantillas de tarea |
| `docs/DECISIONS.md` | ADRs numerados con contexto, decisión y consecuencias |
| `docs/TESTING.md` | Estrategia de pruebas, comandos y checklist manual |
| `CHANGELOG.md` | Historial por versión y feature |

La documentación se escribe durante el desarrollo, no al final; cada fase actualiza su parte.

---

## 11. Pruebas y verificación

- **Unitarias (Vitest)**: matemáticas y ángulos, cámara/proyección/recorte (incluido el
  near-plane), RNG determinista, generación y validación de escenarios, colisión y
  deslizamiento, raycast de LOS, daño y muerte, escalado de misiones, cálculo de progreso,
  efectos de pickups, puntuación, máquina de estados de IA (con estado simulado).
- **Renderer con contexto simulado**: lista de caras, orden de pintado, culling y oclusión de
  una cobertura intacta (assert de que una cara enemiga se pinta antes que la cobertura
  delantera), y desaparición de esa oclusión al destruirla.
- **Integración ligera**: simulación headless de N ticks con estado inicial fijo (sin Canvas):
  avance, impacto, muerte de enemigo, subida de progreso, victoria.
- **Manual (checklist en TESTING.md)**: sensación de movimiento, oclusión visual, legibilidad
  del HUD, radar, audio, dificultad, rendimiento y reinicio de partida.
- **Puerta de calidad**: `npm run check` debe pasar antes de cada commit; build de producción
  verificado con `npm run preview`.
- E2E de navegador (Playwright) queda fuera de 0.1.0; se valora en la siguiente iteración.

---

## 12. Fases, commits y checkpoints

Cada fase termina con `npm run check`, changelog + estado actualizados y **commit convencional**.

| # | Fase | Entregable | Commit de cierre |
|---|---|---|---|
| 0 | Bootstrap | Vite+TS+Vitest+ESLint, `index.html`, docs iniciales, `.gitignore` | `chore: bootstrap vite+ts, lint, tests y documentación base` |
| 1 | Núcleo | Bucle de paso fijo, matemáticas 2D/3D, RNG, bus de eventos + tests | `feat(core): matemáticas, rng determinista y bucle de paso fijo` |
| 2 | Render base | Canvas escalado, cámara, proyección, recorte, painter y niebla | `feat(render): pipeline de cámara, proyección, recorte y painter` |
| 3 | Mundo y escena | Rejilla, generación procedural validada, prismas y rejilla de suelo | `feat(world): generación procedural determinista del escenario` |
| 4 | Jugador | Movimiento solidario, colisión con deslizamiento, cámara de periscopio | `feat(player): movimiento solidario, colisión y cámara de periscopio` |
| 5 | Combate | Disparo, recarga, proyectiles, impactos, daño y escombros | `feat(combat): disparo, recarga, proyectiles e impactos` |
| 6 | Enemigos | Modelos, IA con LOS y A*, dificultad por parámetros | `feat(ai): enemigos con línea de visión y máquina de estados` |
| 7 | Pickups | Cura, mejora y potencia con efectos y feedback | `feat(loot): pickups de cura, mejora y potencia` |
| 8 | HUD | Vida, progreso, puntuación, radar, recarga, pantallas y viñeta | `feat(hud): vida, progreso, puntuación, radar y recarga` |
| 9 | Misiones | Campaña de 3 misiones, escalado, victoria/derrota y persistencia | `feat(mission): misiones escaladas y progresión de campaña` |
| 10 | Audio | Efectos sintetizados, volumen y mute | `feat(audio): efectos sintetizados con WebAudio` |
| 11 | Pulido y handoff | QA, rendimiento, documentación final, tag | `docs: documentación de handoff y guía de desarrollo` · `chore(release): 0.1.0` |

Dependencias: 0→1→2→3→4→5→6→7→8→9→10→11. La documentación (GAME_DESIGN, ARCHITECTURE,
STATUS, CHANGELOG) se redacta en paralelo desde la fase 1; las pruebas independientes de QA
se incorporan desde la fase 4.

**Checkpoints de demo jugable:** fin de fase 4 (te mueves por el escenario), fin de fase 5
(disparas y destruyes), fin de fase 7 (bucle de combate con mejoras), fin de fase 9 (campaña
completa), fin de fase 11 (entrega).

---

## 13. Criterios de aceptación de la entrega 0.1.0

1. `npm run dev` abre un juego jugable y `npm run build` genera un `dist/` servible.
2. `npm run check` (typecheck + lint + tests + build) pasa sin errores.
3. Se puede jugar la campaña de 3 misiones con dificultad creciente y reiniciar tras morir.
4. La cámara es solidaria con el tanque; no se puede mirar libremente y solo se ve el
   periscopio con viñeta.
5. El escenario es procedural, reproducible por semilla, con coberturas destructibles e
   indestructibles; **no se ve a través de las intactas** y sí a través de las destruidas.
6. El HUD muestra vida, porcentaje de avance, puntuación, radar y tiempo/estado de recarga.
7. Los tres pickups existen, se recogen y su efecto es perceptible y visible en el HUD.
8. Hay efectos de sonido sintetizados, volumen y silencio.
9. Documentación completa y `docs/STATUS.md` exacto en el momento de la entrega.
10. Historial de commits convencionales, limpio y con changelog coherente; etiqueta `v0.1.0`.

---

## 14. Riesgos y deuda técnica prevista

| Riesgo | Mitigación |
|---|---|
| Artefactos del painter's algorithm en cruces de geometría | Celdas disjuntas, orden por profundidad, recorte; se documenta como limitación cosmética |
| Coste de caras en escenarios densos | Culling por celda/distancia, límite de densidad, contador de rendimiento |
| Desorientación del jugador en primera persona | Rejilla de suelo, niebla, radar, marcas de distancia y brújula en el HUD |
| IA que se engancha en esquinas | A* de rejilla + evitación local + pruebas de simulación con semillas fijas |
| Dificultad mal calibrada | Datos centralizados, simulación headless para comparar y ajuste rápido |
| Scope creep | Alcance cerrado de 0.1.0 y lista explícita de lo que queda fuera |
| «No ver a través» percibido como injusto | Enemigos también respetan LOS; coberturas destructibles y radar compensan |
| Audio bloqueado por el navegador | Desbloqueo en el primer input; degradación silenciosa si no hay WebAudio |

**Deuda técnica anunciada:** sin E2E de navegador, sin música, sin soporte móvil ni gamepad,
sin guardado a mitad de partida, sin localización, artefactos cosméticos del painter, IA sin
coordinación de flanqueo, sin editor de mapas.

---

## 15. Organización del trabajo

- **Lead (yo)**: arquitectura, contratos, motor de render, gameplay, integración, revisión de
  código, commits y criterios de aceptación.
- **Documentación/handoff** (colaborador): mantiene `CHANGELOG.md`, `docs/STATUS.md`,
  `README.md` y `docs/GAME_DESIGN.md` al día, contrastando con el código real. Escribe solo en
  `docs/` y `CHANGELOG.md`/`README.md`/`AGENTS.md`.
- **QA/tests** (colaborador): pruebas unitarias independientes en `tests/`, auditoría de las
  normas (tamaño, complejidad, bucles) y checklist manual. Escribe solo en `tests/` y
  `docs/TESTING.md`.
- Escrituras disjuntas por persona; los commits los hace el Lead para mantener la historia
  limpia. Si una fase se puede paralelizar (render vs. gameplay), se fijan antes las
  interfaces en `src/render/types.ts` y `src/world/types.ts`.
- Estado compartido siempre en `docs/STATUS.md` y en el tablero de tareas del equipo.

---

## 16. Preguntas abiertas menores (con supuesto por defecto)

| Pregunta | Supuesto si no dices lo contrario |
|---|---|
| ¿Título definitivo? | «BATTLE TANK — PERISCOPIO» (provisional, cambiable en un commit de docs) |
| ¿3 misiones son suficientes para 0.1.0? | Sí; el sistema queda preparado para añadir más como datos |
| ¿Reintento tras morir? | Sí, desde el principio de la misión actual |
| ¿Récord y desbloqueo persistente? | Sí, en `localStorage`, sin guardado a mitad de partida |
| ¿Soporte móvil/gamepad? | Fuera de 0.1.0 |
| ¿Idioma del código? | Identificadores en inglés; comentarios, UI y docs en español |

---

*Plan aprobado el: ________ · Aprobado por: ________*
