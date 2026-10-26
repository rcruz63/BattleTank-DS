# Estrategia de pruebas — BattleTank-DS

Cómo se verifica el juego, qué se prueba en cada capa, cómo se prueba el renderer sin navegador y qué
se comprueba a mano antes de dar por buena la entrega. El objetivo es que la puerta de calidad
(`npm run check`) y el checklist manual cubran los criterios de aceptación de 0.1.0.

## 1. Estrategia por capas

La lógica se separa para poder probarla sin DOM y sin Canvas: `core` y `world` son puros, `systems`
son reglas deterministas sobre estado, los constructores de caras (`worldFaces`, `bulletFaces`)
producen datos y solo el pintor toca el contrato gráfico (`FaceCanvas`). La composición del frame
vive en `render/renderer.ts`; **no hay una escena unificada (`render/scene.ts`)**. La UI y el audio
son adaptadores finos que se sustituyen por dobles.

| Nivel | Qué cubre | Herramienta | Cuándo |
|---|---|---|---|
| Unitarias de lógica pura | `core`, `world`, `systems`, `entities`, helpers puros de `ui` | Vitest (Node) | En cada feature, antes de la implementación |
| Renderer con contexto simulado | Culling, caras de coberturas y proyectiles, orden de pintado, oclusión, presupuesto | Vitest + contexto gráfico falso | Fases 2–5 y cada cambio de render |
| Integración headless | Cadenas de sistemas y `game` con estado inicial fijo y N pasos, sin Canvas | Vitest | Fases 4–9 |
| Manual (QA) | Sensación, legibilidad, audio, oclusión visual, rendimiento, reinicio | Navegador + checklist | Cada checkpoint de demo y antes de la entrega |
| E2E de navegador | Flujo completo en un navegador automatizado | **Fuera de 0.1.0** (deuda conocida) | Se valora después |

No se prueba la implementación interna de un módulo por sus funciones privadas: se prueba el
comportamiento observable a través de su interfaz pública y de los contratos descritos en
[`ARCHITECTURE.md`](ARCHITECTURE.md).

## 2. Comandos

```bash
npm test                                     # toda la suite (vitest run)
npm run test:watch                           # modo vigilancia durante el desarrollo
npx vitest run tests/systems/input.test.ts    # un fichero
npm test -- tests/world/collision.test.ts     # equivalente usando el script npm
npx vitest run -t "misma semilla"             # filtrar por nombre de test
npm run check                                 # typecheck + lint + test + build (puerta obligatoria)
```

Entorno: **Node**, sin jsdom (`vitest.config.ts` incluye `tests/**/*.test.ts`). Si un test necesita
DOM o WebAudio, el diseño que se está probando no está separado: extrae la lógica pura o usa un doble.

## 3. Qué se prueba en cada módulo

| Módulo | Se prueba |
|---|---|
| `config` | Datos válidos y coherentes: stats de tanque positivas (`tanks.ts` es la fuente de verdad), materiales con vida/altura coherentes, paleta completa. Sin lógica que probar. |
| `core/math` | `clamp`, `lerp`, `wrapAngle`, diferencia angular, vectores, límites y ángulos negativos/vueltas completas. |
| `core/rng` | Misma semilla ⇒ misma secuencia; semillas distintas ⇒ secuencias distintas; rangos de `next`/`int`/`range`; extremos de `chance`; error con `pick([])` y rangos inválidos. |
| `core/loop` | Número de pasos fijos para un tiempo dado; acumulador; recorte de `maxFrameSeconds`; `alpha` de interpolación en rango; `reset`; no se pierden pasos tras un frame largo. |
| `core/events` | Alta/baja de oyentes, `emit` con payload, `clear`, `listenerCount`, baja durante la emisión. |
| `world/generate` | Determinismo por semilla; conectividad de spawns y pickups (*flood fill*); borde cerrado; sin solapamientos; distancias mínimas; reintentos acotados. |
| `world/grid` | Conversión mundo↔celda, límites, consultas de ocupación, daño de coberturas, altura de escombros y alcanzabilidad. |
| `world/collision` | Círculo contra celda vacía/cobertura, deslizamiento por ejes, no atravesar coberturas (incluido desplazamiento grande), bordes del mundo, estabilidad en esquinas. |
| `entities/player` | Creación desde `tanks.ts` y el spawn; rumbo solidario, velocidad, recarga, blindaje y vida inicial. Cubierto de forma indirecta por `movement` y `game`; test directo previsto. |
| `entities/bullet` (fase 5) | Normalización de la dirección, valores por defecto de radio, dueño, daño y ciclo de vida inicial. Tests previstos al cerrar la fase. |
| `systems/input` | **W/S y ↑/↓** para el avance; **A/D y ←/→** para el giro; el disparo (`Espacio`) es un flanco que se consume; `clear` libera teclas y disparo pendiente. El adaptador de teclado evita el scroll con las flechas. |
| `systems/movement` | Avance en el sentido de la mira, retroceso más lento, giro del casco y la mira a la vez, sin entrada no cambia nada, se detiene ante cobertura, normalización del ángulo. |
| `systems/combat` (fase 5) | `isWeaponReady`/`reloadProgress`; recarga de 2,4 s; no dispara durante la recarga; un disparo crea un proyectil en la boca del cañón alineado con la mira; los proyectiles avanzan en subpasos, impactan en coberturas por altura y en objetivos, aplican daño y destruyen madera (1 impacto) y ladrillo (3); caducidad del proyectil. Tests previstos al cerrar la fase. |
| `render/camera` | Transformación mundo→cámara con yaw/posición conocidos; proyección del centro; focal según FOV; puntos detrás de cámara. |
| `render/clip` | Polígono delante sin cambios; parcialmente detrás recortado a `z ≥ 0,3`; totalmente detrás descartado; polígonos con varios vértices. |
| `render/color` | Sombreado plano por normal, mezcla de colores y niebla; extremos de la mezcla. |
| `render/worldFaces` | Caras de coberturas desde una rejilla fija: culling por distancia, caras traseras, recorte, sombreado y niebla; cobertura destruida sin caras altas (solo escombros); orden determinista. |
| `render/bulletFaces` (fase 5) | Tracers de proyectiles: descarte detrás del plano cercano, dos caras por proyectil (halo y núcleo), profundidad para el painter y radio visual mínimo. Tests previstos al cerrar la fase. |
| `render/background` | Fondo, horizonte y rejilla de suelo proyectada con una cámara fija. |
| `render/painter` | Orden **de mayor a menor profundidad** (lo más lejano primero), desempate estable, secuencia de operaciones en el contexto simulado, no muta la entrada, presupuesto con el fixture denso. |
| `render/renderer` | Composición del frame: fondo y rejilla antes que las caras, caras del mundo + proyectiles antes del pintor; devuelve el número de caras pintadas. Test con contexto falso previsto. |
| `render/periscope` | Validación manual/visual (usa el contexto completo, no solo `FaceCanvas`): máscara, mira, cañón y casco no tapan la zona útil. |
| `render/models` (previsto, fase 6) | Caras y vértices de cada modelo de tanque/pickup dentro de lo esperado; colores de la paleta. |
| `systems/ai` (fase 6) | Transiciones de la máquina de estados; patrulla sin LOS; ataca con LOS; no dispara a través de coberturas; A* al perder LOS; reposiciona; muere. |
| `systems/loot` (fase 7) | Efectos de pickups, topes, acumulación, caducidad y pérdida al morir. |
| `systems/mission` / `systems/score` / `systems/progression` (fase 9) | Validación de misiones, progreso, victoria/derrota, puntuación y persistencia con almacenamiento falso. |
| `ui` (parte pura, fase 8) | Formateo de segundos/puntos/porcentajes, umbrales de color de vida, matemática del radar, cuenta atrás de efectos. El DOM real no se prueba en unitarias. |
| `audio` (fase 10) | Con un doble de `AudioBus`: mapeo de eventos a efectos, mute/volumen, no lanzar si no hay WebAudio. |
| `game` | `createGame` con semilla e `InputState` inyectado: expone arena, jugador y estado; `update` responde a avance/giro y (fase 5) disparo; `dispose` desengancha la entrada; en fases posteriores, máquina de estados, pausa y reinicio. |

## 4. Renderer con contexto simulado

### Contexto falso

El pintor usa un subconjunto pequeño de Canvas 2D, formalizado en la interfaz `FaceCanvas` de
`src/render/types.ts`. El doble de test implementa esos métodos y **registra una secuencia de
operaciones** (tipo + argumentos + color) para poder afirmar sobre ella:

- propiedad `fillStyle` (lectura/escritura);
- trazado: `beginPath`, `moveTo`, `lineTo`, `closePath`;
- pintado: `fill`.

Si el pintor empieza a usar otra operación (`stroke`, `save`/`restore`, `arc`…), primero se amplía el
contrato `FaceCanvas` y después el doble; no se simula Canvas entero. El overlay de periscopio y el
futuro HUD no entran en este contrato: usan el contexto completo y se validan a mano.

Nada de píxeles reales ni `getImageData`: se comprueba **qué se pinta y en qué orden**, que es donde
están los errores de culling, proyección y oclusión.

El contexto se inyecta en el pintor; no se busca el canvas del DOM. Cámara, viewport, rejilla y
proyectiles se pasan como parámetros; paleta, materiales y balance son datos estáticos de `config/`.
El renderer no debe usar `Date.now()` ni `Math.random()`: un test que repite el render dos veces con
la misma entrada debe dar exactamente la misma lista de operaciones.

### Aserción de oclusión (la prueba clave)

Fixture fijo, cámara mirando al frente:

1. Una cobertura **intacta** delante (p. ej. a 12 m) y otra geometría **detrás** (otra cobertura a
   20 m; cuando existan enemigos, un tanque), alineadas con la cámara.
2. `worldFaces` (y `bulletFaces` para proyectiles) genera las caras; se localiza la cara frontal de
   la cobertura delantera y la cara de lo que está detrás.
3. Se afirma que:
   - ambas caras existen (no se ha culled la cobertura que ocluye);
   - la profundidad de la cobertura es menor que la de lo que hay detrás;
   - en el orden de pintado, lo de detrás aparece **antes** que la cobertura.
4. Se repite con la cobertura destruida en la rejilla:
   - ya no existe la cara alta que tapaba;
   - el objeto de detrás sigue pintándose y no queda oculto.
5. Se repite con la cobertura fuera del frustum/detrás de la cámara: no debe colarse en la lista de
   caras ni romper la proyección.
6. Con proyectiles: un tracer detrás de una cobertura debe pintarse antes que la cobertura; uno
   delante, después.

Se comprueba además que la entrada no se ha mutado (congelada con `Object.freeze` o comparada
antes/después) y, en el fixture denso, que no se superan las 1 500 caras ni las 500 operaciones de
dibujo.

> **Nota de alcance:** los enemigos aún no existen (fase 6). Hasta entonces la oclusión se ejercita
> con **dos coberturas** y con proyectiles; la prueba con tanque enemigo se añade cuando exista
> `systems/ai` y `render/models.ts`.

## 5. Integración headless

Simulación de **N pasos fijos** sin Canvas ni DOM, con estado inicial y semilla fijos; los sistemas
avanzan como en el juego real y se afirman invariantes. Escenarios mínimos:

| Escenario | Qué demuestra |
|---|---|
| Movimiento y colisión | Con `InputState` inyectado: avanzar, girar, retroceder; se desliza y no atraviesa coberturas; el borde del mundo no se cruza. |
| Disparo y recarga | Un disparo listo crea un proyectil; durante 2,4 s el arma no dispara; el flanco de entrada no repite fuego al mantener la tecla. |
| Proyectil e impacto | Un proyectil avanza en subpasos, impacta en una cobertura y le aplica daño; madera cae al primer impacto y ladrillo al tercero; la cobertura destruida deja de bloquear el paso y los proyectiles pasan por encima de los escombros. |
| Caducidad | Un proyectil que no impacta desaparece al superar su vida útil y no se simula para siempre. |
| Determinismo | Misma semilla + misma secuencia de intenciones ⇒ mismo estado final, sin depender del reloj real. |
| Enemigos y victoria (fase 6+) | Destruir enemigos sube el progreso; al 100 % se dispara la victoria con puntuación. |
| Derrota y reintento (fase 9) | Vida a 0 provoca derrota; el reintento reinicia la misión actual. |
| Pickups (fase 7) | Recoger aplica efecto, respeta topes y caduca. |

Los fixtures se construyen con los helpers de `tests/helpers/` (previsto) para no duplicar escenarios.
Los valores de estado se comparan con aserciones explícitas, no con snapshots largos y frágiles.

## 6. Convenciones de nombres y organización

- `tests/<capa>/<modulo>.test.ts` espejo de `src/` (ej.: `tests/systems/movement.test.ts`,
  `tests/world/collision.test.ts`); integración en `tests/integration/*.test.ts`; fixtures y dobles
  compartidos en `tests/helpers/` (previsto).
- `describe` con el área o módulo; `it` en **español**, en presente y describiendo comportamiento:
  «avanza en el sentido de la mira», «no dispara si el arma está recargando».
- Estructura **arrange–act–assert**; una intención por test; aserciones explícitas y mensajes claros.
- Deterministas: semillas fijas, sin red, sin `setTimeout` reales (usar pasos del bucle o
  `vi.useFakeTimers()`), sin dependencia del orden de ejecución ni de la zona horaria.
- Sin DOM real ni jsdom. La UI se prueba por sus funciones puras; el renderer, con el contexto falso;
  el audio, con un doble; la entrada, con la parte pura (`createInputState`) y eventos simulados.
- Nombres orientativos de dobles: `createRecordingContext`, `createFakeAudioBus`, `makeWorld`,
  `createInputState`; se centralizan para no reinventarlos en cada test.
- Los tests pequeños también aplican buenas prácticas de código: legibles, sin duplicación y sin
  `only`/`skip` olvidados.
- Cobertura: no hay umbral numérico configurado en 0.1.0 (deuda/pendiente); la exigencia es cubrir
  los comportamientos de la tabla §3 y los escenarios de §5.

## 7. Checklist manual de QA

Se ejecuta con `npm run dev` (y antes de la entrega también con `npm run build && npm run preview`).
Marcar cada punto en el navegador; anotar semilla, fase y navegador usado. Los puntos marcados
**(fase N)** aún no se pueden probar en la fase 5; quedan aquí para la QA de 0.1.0.

### Preparación

- [ ] `npm run check` en verde; sin errores ni warnings en la consola del navegador.
- [ ] Canvas 16:9 sin deformación ni recortes en ventanas grandes y pequeñas (letterboxing).
- [ ] El arranque muestra semilla y texto de estado temporal; `F3` completo cuando exista.

### Movimiento y controles (fase 4)

- [ ] `W`/`S` y `↑`/`↓` avanzan y retroceden con inercia; `A`/`D` y `←`/`→` giran tanque y mira a
      la vez.
- [ ] Las flechas no hacen scroll de la página.
- [ ] No se puede mirar libremente ni asomarse: la cámara es solidaria.
- [ ] Colisión con coberturas y bordes: se desliza, no atraviesa, no se queda clavado en esquinas.
- [ ] Al disparar, la cámara retrocede un instante y vuelve; el rumbo lógico no cambia.
- [ ] `Esc` pausa y `M` silencia **(fases 8/10)**.

### Combate (fase 5)

- [ ] `Espacio` dispara una vez por pulsación; mantener pulsado no repite fuego.
- [ ] La recarga dura 2,4 s; el indicador definitivo llegará con el HUD **(fase 8)**.
- [ ] El proyectil es visible (tracer) y respeta la oclusión: no atraviesa coberturas intactas, y
      los escombros no lo detienen.
- [ ] Madera cae con 1 impacto; ladrillo con 3; hormigón y acero no se destruyen.
- [ ] Al destruir una cobertura se ve y se dispara a través; se puede pasar por la celda.
- [ ] No se experimentan tirones ni errores al disparar o destruir varias coberturas seguidas.

### Oclusión

- [ ] No se ve ni se dispara a través de una cobertura intacta (madera, ladrillo, hormigón y acero).
- [ ] A través de una cobertura destruida sí se ve y se dispara; los escombros no tapan la vista.
- [ ] No se ve por encima de ninguna cobertura.
- [ ] En esquinas y con la cobertura pegada a la cámara no aparecen huecos ni artefactos graves.
- [ ] Enemigos que respetan la misma oclusión y radar **(fases 6/8)**.

### HUD (fase 8)

- [ ] Vida con barra y número, color según porcentaje, legible; no tapa la mira.
- [ ] Progreso solo en porcentaje y sube al destruir enemigos; nunca muestra cuántos quedan.
- [ ] Puntuación visible y correcta; récord en pausa/resumen.
- [ ] Recarga: anillo y segundos restantes; destello al estar lista.
- [ ] Iconos y cuenta atrás de potencia/mejora; avisos de estado legibles.
- [ ] Contraste alto y estados distinguibles sin depender solo del color.

### Radar (fase 8)

- [ ] Circular, abajo a la derecha, centrado en el tanque y orientado con el rumbo.
- [ ] Alcance 45 m y barrido animado; enemigos, pickups y coberturas con los símbolos previstos.
- [ ] No desvela el detalle del escenario ni la posición exacta fuera de alcance.

### Audio (fase 10)

- [ ] Se desbloquea en el primer input y no hay errores de autoplay.
- [ ] Motor con pitch según velocidad; cañonazo, impacto/explosión, recarga, pickup y UI audibles.
- [ ] `M` silencia y reactiva; volumen maestro en pausa; sin saturación.
- [ ] Si se bloquea WebAudio, el juego sigue en silencio sin romperse.

### Enemigos e IA (fase 6)

- [ ] Patrullan, detectan, apuntan y disparan; no disparan a través de coberturas.
- [ ] Rodean obstáculos con A* y no se quedan atascados en una partida larga.
- [ ] La dificultad crece entre misiones y el balance de `config/tanks.ts` se siente justo.
- [ ] No hay comportamientos absurdos (aimbot perfecto, disparos a través de muros, temblores).

### Pickups (fase 7)

- [ ] Aparecen 3–5 por misión, en zonas alcanzables; se recogen con el radio previsto.
- [ ] Los tres efectos son perceptibles y visibles en el HUD; los temporales caducan.
- [ ] Topes y acumulación correctos; al morir se pierden los acumulados.

### Rendimiento

- [ ] 60 fps estables a 1280×720 en la misión más densa (misión 3).
- [ ] Contador de depuración dentro del presupuesto (≤ 1 500 caras, ≤ 500 operaciones por frame).
- [ ] Sin tirones al girar rápido, disparar, destruir coberturas ni entrar en combate.
- [ ] Volver de una pestaña en segundo plano no produce saltos ni avalancha de simulación.

### Reinicio, derrota y persistencia (fase 9)

- [ ] Morir muestra derrota/resumen y permite reintentar desde el principio de la misión actual.
- [ ] Victoria encadena la misión siguiente y desbloquea progreso.
- [ ] Recargar el navegador conserva récord y misión desbloqueada; no hay guardado a mitad de partida.
- [ ] Con `localStorage` bloqueado o corrupto, el juego arranca sin persistencia y sin romperse.

### Cierre

- [ ] Partida completa de las 3 misiones sin errores en consola.
- [ ] `npm run build` genera `dist/` y `npm run preview` sirve el juego correctamente.
- [ ] Cambios documentados en `CHANGELOG.md` y `docs/STATUS.md` antes del commit.

## 8. Criterios de aceptación de 0.1.0

La entrega se acepta cuando se cumplen los diez criterios del plan
([`PLAN.md`](PLAN.md) §13); resumen y verificación:

| # | Criterio | Verificación |
|---|---|---|
| 1 | `npm run dev` da un juego jugable y `npm run build` un `dist/` servible. | Manual + `npm run preview`. |
| 2 | `npm run check` pasa sin errores. | Puerta local; obligatoria antes del tag. |
| 3 | Campaña de 3 misiones con dificultad creciente y reinicio tras morir. | Integración + QA manual. |
| 4 | Cámara solidaria con el tanque, sin vista libre, solo periscopio. | QA manual + test de cámara. |
| 5 | Escenario procedural reproducible por semilla, con coberturas destructibles e indestructibles; no se ve a través de las intactas y sí de las destruidas. | Tests de generación/colisión + aserción de oclusión del renderer + QA manual. |
| 6 | HUD con vida, porcentaje de avance, puntuación, radar y estado de recarga. | Tests de helpers + QA manual. |
| 7 | Los tres pickups existen, se recogen y su efecto es perceptible y visible en el HUD. | Tests de loot + QA manual. |
| 8 | Efectos de sonido sintetizados, volumen y silencio. | Tests del adaptador + QA manual. |
| 9 | Documentación completa y `docs/STATUS.md` exacto en la entrega. | Revisión del Lead sobre la documentación. |
| 10 | Historial de commits convencionales y changelog coherente; etiqueta `v0.1.0`. | Revisión de `git log`, `CHANGELOG.md` y el tag. |

## 9. Deuda conocida en pruebas (0.1.0)

- **Sin E2E de navegador** (Playwright u otro): no hay pruebas automatizadas de flujo completo en un
  navegador real; hay verificación manual y capturas headless puntuales. Se valora en la siguiente
  iteración.
- **Sin CI**: la puerta de calidad se ejecuta en local; no hay verificación automática por commit.
- **Sin jsdom**: la UI DOM se valida a mano y por sus funciones puras; no hay tests de DOM.
- **Periscopio y overlay**: al usar el contexto completo, no se cubren con el `FaceCanvas` simulado.
- **Sin verificación de audio real**: solo se prueba el adaptador con dobles; el timbre y la mezcla
  son QA manual.
- **Sin umbral de cobertura** configurado ni benchmark de rendimiento automatizado.
- **Sin matriz de navegadores automatizada**: se prueba en un navegador de escritorio moderno.
- **Artefactos cosméticos del painter's algorithm**: limitación aceptada ([`DECISIONS.md`](DECISIONS.md),
  ADR-002); no se eliminan con tests, solo se acotan con fixtures.
- **Fuera de alcance, sin pruebas**: móvil/táctil, gamepad, multijugador, guardado a mitad de partida,
  localización y música.

Las decisiones pendientes que afectan a pruebas (umbral de cobertura, CI, herramienta E2E futura) se
anotan en [`DEVELOPMENT.md`](DEVELOPMENT.md#13-pendientes-y-supuestos-detectados-para-el-lead).
