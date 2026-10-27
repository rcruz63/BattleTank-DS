# Estrategia de pruebas — BattleTank-DS

Cómo se verifica el juego, qué se prueba en cada capa, cómo se prueba el renderer sin navegador y qué
se comprueba a mano antes de dar por buena la entrega. El objetivo es que la puerta de calidad
(`npm run check`) y el checklist manual cubran los criterios de aceptación de 0.1.0.

## 1. Estrategia por capas

La lógica se separa para poder probarla sin DOM y sin Canvas: `core` y `world` son puros, `systems`
son reglas deterministas sobre estado, los constructores de caras (`worldFaces`, `models`,
`bulletFaces`) producen datos, `faces` los proyecta y solo el pintor toca el contrato gráfico
(`FaceCanvas`). La composición del frame vive en `render/renderer.ts`; **no hay una escena unificada
(`render/scene.ts`)**. La UI y el audio son adaptadores finos que se sustituyen por dobles. Estado:
**183 tests en 31 ficheros** con las fases 0–7 y los bloques 6.5 (puntería con ratón), 6.6
(colisión entre tanques) y 7.5 (blindaje direccional) cerrados.

| Nivel | Qué cubre | Herramienta | Cuándo |
|---|---|---|---|
| Unitarias de lógica pura | `core`, `world`, `systems`, `entities`, helpers puros de `ui` | Vitest (Node) | En cada feature, antes de la implementación |
| Renderer con contexto simulado | Culling, caras de coberturas/tanques/proyectiles, orden de pintado, oclusión, presupuesto | Vitest + contexto gráfico falso | Fases 2–6 y cada cambio de render |
| Integración headless | Cadenas de sistemas, IA y `game` con estado inicial fijo y N pasos, sin Canvas | Vitest | Fases 4–9 |
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
| `config` | Datos válidos y coherentes: stats de tanque positivas (`tanks.ts` es la fuente de verdad), materiales con vida/altura coherentes, paleta completa y datos de pickups (tres tipos con etiqueta/color y reglas de efecto positivas y coherentes). Sin lógica que probar. |
| `core/math` | `clamp`, `lerp`, `wrapAngle`, diferencia angular, vectores, límites y ángulos negativos/vueltas completas. |
| `core/rng` | Misma semilla ⇒ misma secuencia; semillas distintas ⇒ secuencias distintas; rangos de `next`/`int`/`range`; extremos de `chance`; error con `pick([])` y rangos inválidos. |
| `core/loop` | Número de pasos fijos para un tiempo dado; acumulador; recorte de `maxFrameSeconds`; `alpha` de interpolación en rango; `reset`; no se pierden pasos tras un frame largo. |
| `core/events` | Alta/baja de oyentes, `emit` con payload, `clear`, `listenerCount`, baja durante la emisión. |
| `world/generate` | Determinismo por semilla; conectividad de spawns y pickups (*flood fill*); borde cerrado; sin solapamientos; distancias mínimas; reintentos acotados. |
| `world/grid` | Conversión mundo↔celda, límites, consultas de ocupación, daño de coberturas, altura de escombros y alcanzabilidad. |
| `world/collision` | Círculo contra celda vacía/cobertura, deslizamiento por ejes, no atravesar coberturas (incluido desplazamiento grande), bordes del mundo, estabilidad en esquinas. |
| `world/entityCollision` | Separación mínima = radios + margen; holgura respecto al bloqueador más cercano; el movimiento se detiene sin invadir a otro tanque a 6 m/s y 60 Hz; deslizamiento por el eje libre; escape sin agravar un solape inicial. |
| `world/los` | Línea despejada en celdas libres; cobertura intacta bloquea; cobertura fuera de la línea no bloquea; escombros no bloquean; fuera del mapa no hay visión. |
| `world/pathfind` | Ruta recta con celdas contiguas; rodeo de una cobertura; `null` con destino bloqueado/encerrado; origen igual a destino; rechazo de origen bloqueado o fuera del mapa. |
| `entities/player` | Creación desde `tanks.ts` y el spawn; rumbo solidario, velocidad, recarga, blindaje y vida inicial. Cubierto de forma indirecta por `movement` y `game`; test directo previsto. |
| `entities/bullet` | Normalización de la dirección, valores por defecto de radio, dueño, daño y ciclo de vida inicial. |
| `entities/enemy` | Creación del Panzer III/Tiger I desde `tanks.ts` y el spawn; vida, blindaje, radios y modo de IA inicial. |
| `entities/pickup` | Un pickup por spawn con id estable, tipos rotando en orden determinista y posición independiente del objeto de spawn. |
| `systems/input` | **W/S y ↑/↓** para el avance; **A/D y ←/→** para el giro; el puntero normalizado (`setPointer`, limitado a ±1) y el disparo como flanco (`Espacio`, `requestFire`); `clear` libera teclas, disparo y puntero. Los adaptadores DOM evitan el scroll con flechas y convierten coordenadas del canvas escalado y clic izquierdo. |
| `systems/aim` | `resolveAim`: centro → tiro horizontal y retícula en el centro; derecha → giro máximo y retícula a la derecha; elevación → cabeceo y retícula arriba; puntero fuera de rango se limita al cono; gira con el rumbo del tanque; dirección siempre normalizada. |
| `systems/movement` | Avance en el sentido de la mira, retroceso más lento, giro del casco y la mira a la vez, sin entrada no cambia nada, se detiene ante cobertura, normalización del ángulo; no atraviesa enemigos a 6 m/s y 60 Hz ni al retroceder, la cámara no queda dentro del modelo y un enemigo destruido no bloquea (`BUG-001`). |
| `systems/combat` | `isWeaponReady`/`reloadProgress`; recarga de 2,4 s y `reloadDuration` para la recarga acortada por potencia; multiplicadores de daño y recarga en el disparo; `buildProjectileTargets` con los vivos de cada facción; no dispara durante la recarga; el disparo sale del pivote de la torreta + 2,2 m de tubo, con la dirección 3D de la mira; los proyectiles avanzan en subpasos, impactan en coberturas por altura, en tanques (cilindro de 2,2 m) **y en el suelo**, aplican daño y destruyen madera (1 impacto) y ladrillo (3); un disparo alto pasa por encima de un tanque; caducidad; filtrado por facción. |
| `systems/ai` | Dispara con LOS, dentro de su arco de ±15° y tras recargar; no dispara a 90° ni por la espalda; no corrige el rumbo mientras recarga (ventana de flanqueo); no dispara a través de cobertura intacta; alertado sin LOS avanza con A*; se queda quieto si el jugador está destruido; `alertEnemiesNear` despierta solo a los cercanos al estampido; el avance no solapa con otro tanque. |
| `render/camera` | Transformación mundo→cámara con yaw/posición conocidos; proyección del centro; focal según FOV; puntos detrás de cámara. |
| `render/faces` | `projectWorldFaces`: descarte de caras traseras, recorte de plano cercano, proyección, profundidad media, sombreado por normal y niebla; cubierto vía `worldFaces`, `models` y la prueba de oclusión. |
| `render/clip` | Polígono delante sin cambios; parcialmente detrás recortado a `z ≥ 0,3`; totalmente detrás descartado; polígonos con varios vértices. |
| `render/color` | Sombreado plano por normal, mezcla de colores y niebla; extremos de la mezcla. |
| `render/worldFaces` | `buildWallWorldFaces`: caras de coberturas desde una rejilla fija, omisión de caras que tocan otra cobertura intacta, culling por distancia; cobertura destruida sin caras altas (solo escombros); `buildWorldFaces` como atajo de test. |
| `render/models` | Caras de casco, cadenas, torreta, cañón y franjas de orientación del enemigo (7 cajas, 35 caras); todas las caras entre el suelo y la altura del tanque; orientación según el rumbo; franja clara delante y roja detrás; colores de `tanks.ts`. La geometría de cajas compartida vive en `render/boxes`. |
| `render/pickupFaces` | Caja, marca de suelo e icono flotante para los tres tipos; caras de cuatro puntos con coordenadas finitas y por encima del suelo; centrado sobre la posición y flotación; un pickup recogido no genera caras. |
| `render/bulletFaces` | Tracers de proyectiles: descarte detrás del plano cercano, dos caras por proyectil (halo y núcleo), profundidad para el painter y radio visual mínimo. |
| `render/background` | Fondo, horizonte y rejilla de suelo proyectada con una cámara fija. |
| `render/painter` | Orden **de mayor a menor profundidad** (lo más lejano primero), desempate estable, secuencia de operaciones en el contexto simulado, no muta la entrada, presupuesto con el fixture denso. |
| `render/renderer` | Composición del frame: fondo y rejilla antes que las caras; coberturas + tanques + pickups en una sola proyección + proyectiles añadidos; devuelve el número de caras pintadas. Test con contexto falso previsto. |
| `render/periscope` | Validación manual/visual (usa el contexto completo, no solo `FaceCanvas`): retícula y marcas en `aimScreenX/Y`, cañón orientable sin tapar la zona útil, marca de rumbo del casco, anillo de recarga, fogonazo y marca de impacto. La posición de la retícula se prueba por separado en `systems/aim`. |
| `render/statusOverlay` | Validación manual/visual (contexto completo): panel temporal con semilla, vida, recarga y efectos; aviso flotante de pickup con desvanecimiento; pantalla provisional de destruido. |
| `systems/loot` | Recogida solo a 2 m y una sola vez; cura 30 PV con tope; mejora +20 de vida máxima (y 20 PV) con reducción de daño multiplicativa acumulable ×3 y tope; potencia de 20 s que se renueva, con multiplicadores de daño ×1,75 y recarga ×0,65 y reversión al agotarse; texto del aviso; un jugador destruido no recoge. |
| `systems/damage` | Impacto al jugador con blindaje base, mejoras acumuladas y zona direccional; impacto a enemigos con su blindaje y zona; balance 5/3/2 (Panzer III) y 8/4/3 (Tiger I) por frontal/lateral/trasero; muerte al llegar a 0; objetivos desconocidos o ya destruidos se ignoran. |
| `systems/armor` | Clasificación frontal/lateral/trasera con umbrales inclusivos ±60°/120°, giro con el rumbo del blanco y multiplicadores ×0,5/×1,0/×1,5; el arco de fuego enemigo coincide con el cono del jugador (`AIM_LIMITS`). |
| `systems/mission` / `systems/score` / `systems/progression` (fase 9) | Validación de misiones, progreso, victoria/derrota, puntuación y persistencia con almacenamiento falso. |
| `ui` (parte pura, fase 8) | Formateo de segundos/puntos/porcentajes, umbrales de color de vida, matemática del radar, cuenta atrás de efectos. El DOM real no se prueba en unitarias. |
| `audio` (fase 10) | Con un doble de `AudioBus`: mapeo de eventos a efectos, mute/volumen, no lanzar si no hay WebAudio. |
| `game` | `createGame` con semilla e `InputState` inyectado: expone arena, jugador, enemigos, pickups, loot y proyectiles; `update` responde a avance/giro y resuelve la puntería con el puntero; el disparo sale con la dirección 3D del cañón (el ratón orienta el tiro); mueve la IA; el jugador no atraviesa a un enemigo colocado delante (`BUG-001`); recoge pickups con su efecto (cura, vida máxima/reducción y potencia con recarga acortada), que no reaparecen; el mismo disparo hace 60 por la espalda y 20 de frente a un Panzer III (zona + blindaje); `dispose` limpia la entrada. En fases posteriores: máquina de estados, pausa y reinicio. |

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

`tests/render/occlusion.test.ts` es la prueba de referencia; monta una cámara fija en el centro de la
mira, una cobertura de ladrillo y un enemigo detrás:

1. **Cobertura intacta:** `buildWallWorldFaces` y `tankWorldFaces` generan las caras; se proyectan y
   se comprueba que hay caras del enemigo y que alguna cara de la cobertura cubre el punto central de
   la pantalla (la mira).
2. **Cobertura destruida:** se aplica `damageObstacle` hasta 0 y se repite la proyección; la cobertura
   ya no cubre el centro de la mira y la línea hacia el enemigo queda despejada.
3. **Orden de pintado:** los tests del `painter` cubren el orden de mayor a menor profundidad; como
   coberturas, tanques y proyectiles comparten lista y profundidad, una cobertura intacta se pinta
   después de lo que está detrás y lo tapa.
4. **Proyectiles:** los tracers (`bulletFaces`) entran en la misma lista con su profundidad; un tracer
   detrás de una cobertura se pinta antes y queda oculto.
5. **Culling y recorte:** cubiertos en `worldFaces`, `faces` y `clip` (caras traseras, fuera de
   distancia, detrás del plano cercano).

Se comprueba además que la entrada no se muta y, en el fixture denso, que no se superan las 1 500
caras ni las 500 operaciones de dibujo.

## 5. Integración headless

Simulación de **N pasos fijos** sin Canvas ni DOM, con estado inicial y semilla fijos; los sistemas
avanzan como en el juego real y se afirman invariantes. Escenarios mínimos:

| Escenario | Qué demuestra |
|---|---|
| Movimiento y colisión | Con `InputState` inyectado: avanzar, girar, retroceder; se desliza y no atraviesa coberturas; el borde del mundo no se cruza. |
| Colisión entre tanques (`BUG-001`) | A 6 m/s y 60 Hz el jugador se detiene a la distancia de separación (≥ suma de radios), nunca cruza al enemigo ni queda dentro de su modelo; el retroceso también respeta la colisión; dos enemigos no se solapan al avanzar; un enemigo destruido deja de bloquear. |
| Pickups (fase 7) | El juego expone 4 pickups con los tres tipos; al pasar por encima se recogen una sola vez y aplican cura con tope, mejora de vida máxima con reducción de daño y potencia (daño ×1,75 y recarga ×0,65); no reaparecen. |
| Disparo y recarga | Un disparo listo crea un proyectil; durante 2,4 s el arma no dispara; el flanco de entrada no repite fuego al mantener la tecla. |
| Puntería | El puntero a la derecha inclina el cañón y el proyectil sale con dirección 3D coherente con `resolveAim`; el centro apunta al frente; la cámara no cambia de rumbo con el ratón. |
| Tiro alto/suelo | Un disparo elevado puede pasar por encima de un tanque; uno bajo impacta en el suelo (`kind: 'ground'`) y no daña a nadie. |
| Proyectil e impacto | Un proyectil avanza en subpasos, impacta en una cobertura y le aplica daño; madera cae al primer impacto y ladrillo al tercero; la cobertura destruida deja de bloquear el paso y los proyectiles pasan por encima de los escombros. |
| Caducidad | Un proyectil que no impacta desaparece al superar su vida útil y no se simula para siempre. |
| IA: percepción y ataque | Un enemigo con LOS, encarado y recargado dispara; sin LOS avanza con A*; no dispara a través de cobertura intacta; el estampido alerta solo a los enemigos a ≤ 60 m. |
| Daño, zona y blindaje | Con los valores de `tanks.ts`, el Sherman destruye un Panzer III en 5/3/2 y un Tiger I en 8/4/3 (frontal/lateral/trasero); el blindaje base y las mejoras reducen el daño y la zona se aplica después; al llegar a 0 el tanque muere y deja de simularse. |
| Arco de fuego y flanqueo (7.5) | La IA no dispara con el jugador a 90° ni por la espalda, sí dentro de ±15°; mantiene el rumbo mientras recarga y el jugador puede ganar el flanco; los disparos reales del juego hacen 60 por la espalda y 20 de frente. |
| Determinismo | Misma semilla + misma secuencia de intenciones ⇒ mismo estado final, sin depender del reloj real. |
| Victoria y derrota (fase 9) | Destruir enemigos sube el progreso; al 100 % victoria; vida a 0 derrota y reintento. |

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
**(fase N)** aún no se pueden probar en la fase 6; quedan aquí para la QA de 0.1.0.

### Preparación

- [ ] `npm run check` en verde; sin errores ni warnings en la consola del navegador.
- [ ] Canvas 16:9 sin deformación ni recortes en ventanas grandes y pequeñas (letterboxing).
- [ ] El arranque muestra semilla y texto de estado temporal; `F3` completo cuando exista.
- [ ] `?seed=123` reproduce el mismo escenario y reparto de enemigos; sin parámetro la semilla cambia.
- [ ] `window.__BT__` expone el estado en la consola (`seed`, `player`, `enemies`, `bullets`, `arena`).

### Movimiento y controles (fase 4)

- [ ] `W`/`S` y `↑`/`↓` avanzan y retroceden con inercia; `A`/`D` y `←`/`→` giran tanque y vista a
      la vez.
- [ ] Las flechas no hacen scroll de la página.
- [ ] El ratón mueve el cañón dentro del cono (±15° / ±4°) y la cámara **no** gira: el centro queda
      en el rumbo del casco.
- [ ] La retícula sigue al puntero y el cañón dibujado apunta hacia ella; el cursor del sistema está
      oculto sobre el canvas.
- [ ] El clic izquierdo y `Espacio` disparan; el tiro sale en la dirección de la retícula.
- [ ] No se puede mirar libremente ni asomarse: la cámara es solidaria.
- [ ] Colisión con coberturas y bordes: se desliza, no atraviesa, no se queda clavado en esquinas.
- [ ] Colisión con tanques enemigos: al avanzar contra uno el casco se detiene a la distancia de
      separación, no lo atraviesa y la cámara no entra en su modelo; retroceder tampoco lo cruza
      (`BUG-001`, bloque 6.6).
- [ ] Al disparar, la cámara retrocede un instante y vuelve; el rumbo lógico no cambia.
- [ ] Al recibir daño se ve el tinte rojo; al morir aparece la pantalla provisional «TANQUE DESTRUIDO».
- [ ] `Esc` pausa y `M` silencia **(fases 8/10)**.

### Combate (fase 5)

- [ ] `Espacio` dispara una vez por pulsación; mantener pulsado no repite fuego.
- [ ] La recarga dura 2,4 s; el indicador definitivo llegará con el HUD **(fase 8)**.
- [ ] El proyectil es visible (tracer) y respeta la oclusión: no atraviesa coberturas intactas, y
      los escombros no lo detienen.
- [ ] Un tiro alto por encima de un tanque pasa de largo y cae al suelo; un tiro centrado impacta.
- [ ] Recarga: anillo y segundos junto a la retícula; el anillo se dibuja en el punto de mira.
- [ ] Madera cae con 1 impacto; ladrillo con 3; hormigón y acero no se destruyen.
- [ ] Al destruir una cobertura se ve y se dispara a través; se puede pasar por la celda.
- [ ] Los proyectiles enemigos hacen daño al jugador y el blindaje se nota (comparar Panzer III y
      Tiger I).
- [ ] El daño depende de la zona: mismo cañón, más daño por la espalda que de frente (×0,5 frontal,
      ×1 lateral, ×1,5 trasera); el enemigo muestra la orientación con franja clara delante y roja
      detrás.
- [ ] El anillo de recarga, los segundos, el fogonazo y la marca de impacto se ven y no tapan la
      mira.
- [ ] No se experimentan tirones ni errores al disparar o destruir varias coberturas seguidas.

### Oclusión

- [ ] No se ve ni se dispara a través de una cobertura intacta (madera, ladrillo, hormigón y acero).
- [ ] A través de una cobertura destruida sí se ve y se dispara; los escombros no tapan la vista.
- [ ] No se ve por encima de ninguna cobertura.
- [ ] En esquinas y con la cobertura pegada a la cámara no aparecen huecos ni artefactos graves.
- [ ] Los enemigos quedan ocultos tras una cobertura intacta y son visibles al destruirla.
- [ ] Los enemigos respetan la misma oclusión: no disparan a través de coberturas intactas.
- [ ] Radar **(fase 8)**.

### HUD (fase 8)

- [ ] Vida con barra y número, color según porcentaje, legible; no tapa la mira.
- [ ] Progreso solo en porcentaje y sube al destruir enemigos; nunca muestra cuántos quedan.
- [ ] Puntuación visible y correcta; récord en pausa/resumen.
- [ ] Recarga: anillo y segundos restantes (ya visibles en el periscopio); destello al estar lista
      y HUD completo **(fase 8)**.
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

- [ ] Los enemigos están al acecho hasta ver al jugador o hasta oír un disparo cercano (≤ 60 m).
- [ ] Con línea de visión avanzan a atacar; apuntan con giro limitado, esperan la reacción y disparan
      con dispersión y recarga.
- [ ] Solo disparan si el jugador está dentro de ±15° de su rumbo: no disparan a 90° ni por detrás.
- [ ] Mientras recargan mantienen el rumbo (no giran hacia el jugador): se puede ganar el flanco.
- [ ] Sin línea de visión avanzan con A* rodeando coberturas y no se quedan atascados.
- [ ] No disparan a través de coberturas intactas; los escombros sí dejan pasar.
- [ ] Se ven con su modelo de cajas (casco, cadenas, torreta y cañón) y con la oclusión correcta.
- [ ] El balance de `config/tanks.ts` se siente justo (5/3/2 al ligero y 8/4/3 al pesado, frontal/lateral/trasero).
- [ ] No hay comportamientos absurdos (aimbot perfecto, disparos a través de muros, temblores).
- [ ] La dificultad escalada por misión y el estado de reposición **(fases 9/deuda)**.

### Pickups (fase 7)

- [ ] Aparecen 4 por escenario, en celdas libres alcanzables y con los tres tipos garantizados; se
      recogen al pasar a menos de 2 m y no reaparecen.
- [ ] Botiquín cura 30 PV sin superar el máximo; la mejora sube +20 la vida máxima y reduce el daño
      recibido (acumulable ×3); la potencia da daño ×1,75 y recarga −35 % durante 20 s (se renueva).
- [ ] El aviso flotante y la línea de estado muestran el efecto y el temporizador (HUD definitivo en
      la fase 8); al morir se pierden los acumulados.
- [ ] Los pickups respetan la oclusión y desaparecen al recogerse.

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

La entrega se acepta cuando se cumplen los doce criterios del plan
([`PLAN.md`](PLAN.md) §13); resumen y verificación:

| # | Criterio | Verificación |
|---|---|---|
| 1 | `npm run dev` da un juego jugable y `npm run build` un `dist/` servible. | Manual + `npm run preview`. |
| 2 | `npm run check` pasa sin errores. | Puerta local; obligatoria antes del tag. |
| 3 | Campaña de 3 misiones con dificultad creciente y reinicio tras morir. | Integración + QA manual. |
| 4 | Cámara solidaria con el tanque, sin vista libre, solo periscopio. | QA manual + test de cámara. |
| 5 | Escenario procedural reproducible por semilla, con coberturas destructibles e indestructibles; no se ve a través de las intactas y sí de las destruidas. | Tests de generación/colisión + aserción de oclusión del renderer + QA manual. |
| 6 | HUD con vida, porcentaje de avance, puntuación, radar y estado de recarga. | Tests de helpers + QA manual. |
| 7 | Los tres pickups existen, se recogen y su efecto es perceptible y visible en el HUD. | Tests de `config/pickups`, `entities/pickup`, `systems/loot`, `systems/damage`, `render/pickupFaces` e integración de `game` + QA manual. **Implementado en la fase 7; el HUD definitivo llega en la fase 8.** |
| 8 | Efectos de sonido sintetizados, volumen y silencio. | Tests del adaptador + QA manual. |
| 9 | Documentación completa y `docs/STATUS.md` exacto en la entrega. | Revisión del Lead sobre la documentación. |
| 10 | Historial de commits convencionales y changelog coherente; etiqueta `v0.1.0`. | Revisión de `git log`, `CHANGELOG.md` y el tag. |
| 11 | El jugador no atraviesa tanques enemigos ni queda dentro de su modelo (`BUG-001`). | Tests de colisión entre entidades (`world/entityCollision`, `systems/movement`, `systems/ai`, `game`) + QA manual. **Cubierto en el bloque 6.6.** |
| 12 | Daño por zona (frontal ×0,5, lateral ×1,0, trasera ×1,5) y enemigos sin disparar fuera de su arco de ±15°. | Tests de `systems/armor`, `systems/damage`, `systems/combat` y de arco de fuego en `systems/ai` + QA. **Cubierto en el bloque 7.5.** |

## 9. Deuda conocida en pruebas (0.1.0)

- **Sin E2E de navegador** (Playwright u otro): no hay pruebas automatizadas de flujo completo en un
  navegador real; hay verificación manual, capturas headless y conducciones puntuales vía CDP (sin
  dependencias nuevas) para validar `BUG-001`, los pickups y el blindaje direccional. Se valora un
  E2E formal en la siguiente iteración.
- **Sin CI**: la puerta de calidad se ejecuta en local; no hay verificación automática por commit.
- **Sin jsdom**: la UI DOM se valida a mano y por sus funciones puras; no hay tests de DOM.
- **Periscopio y overlay**: al usar el contexto completo, no se cubren con el `FaceCanvas` simulado.
- **Sin verificación de audio real**: solo se prueba el adaptador con dobles; el timbre y la mezcla
  son QA manual.
- **Sin umbral de cobertura** configurado ni benchmark de rendimiento automatizado.
- **LOS por muestreo de 1 m:** aproximación suficiente para celdas de 4 m, pero no un DDA exacto; se
  revisa si aparece un fallo de esquina en QA.
- **IA sin reposición/coordinación:** la máquina es `idle/advance/attack`; no hay flanqueo ni
  coberturas inteligentes (deuda planificada).
- **Ganchos de depuración** (`?seed`, `window.__BT__`): no forman parte de la API del juego y no se
  prueban como contrato; sí se usan en QA manual.
- **Alineación retícula-cañón en pantalla:** la posición de la retícula es matemática pura y tiene
  tests; el cañón dibujado y el cursor oculto son QA visual (headless y navegador), no unitario.
- **Sensibilidad y mapeo del ratón:** lineal contra el canvas; sin curvas ni opciones; a revisar con
  QA.
- **Sin matriz de navegadores automatizada**: se prueba en un navegador de escritorio moderno.
- **Artefactos cosméticos del painter's algorithm**: limitación aceptada ([`DECISIONS.md`](DECISIONS.md),
  ADR-002); no se eliminan con tests, solo se acotan con fixtures.
- **Fuera de alcance, sin pruebas**: móvil/táctil, gamepad, multijugador, guardado a mitad de partida,
  localización y música.

Las decisiones pendientes que afectan a pruebas (umbral de cobertura, CI, herramienta E2E futura) se
anotan en [`DEVELOPMENT.md`](DEVELOPMENT.md#13-pendientes-y-supuestos-detectados-para-el-lead).


## 10. Pruebas de los bloques 6.6, 7 y 7.5 (implementadas)

- **Colisión entre tanques (bloque 6.6, implementado):** `tests/world/entityCollision.test.ts`
  comprueba la separación mínima (radios + 0,15 m), la holgura, el deslizamiento y el escape sin
  agravar un solape; `tests/systems/movement.test.ts` simula 300 pasos a 6 m/s y 60 Hz y verifica que
  el jugador nunca queda más cerca de la suma de radios, que no cruza al enemigo, que la cámara no
  queda dentro del modelo, que retrocediendo tampoco lo atraviesa y que un enemigo destruido no
  bloquea; `tests/systems/ai.test.ts` comprueba que el avance de un enemigo se frena ante otro;
  `tests/game/game.test.ts` integra el flujo real con `seed=42`. QA adicional: juego real en Chrome
  headless vía CDP, avance contra un enemigo y captura; el jugador se detiene a 2,9 m.
- **Pickups (fase 7, implementado):** datos y colores de los tres tipos; reparto determinista por
  spawn; recogida solo dentro de 2 m y una sola vez; cura con tope; mejora +20 de vida máxima y
  reducción multiplicativa acumulable hasta ×3 (la cuarta se consume sin efecto); potencia de 20 s
  que se renueva, multiplicadores ×1,75 de daño y ×0,65 de recarga y reversión al agotarse; texto
  del aviso; daño después del blindaje base y con las mejoras; juego real con `seed=42` (recoger
  los tres, potencia en el disparo y no reaparición); modelo por tipo y pickup recogido sin caras.
  QA adicional en Chrome headless vía CDP con capturas de la recogida y los avisos.
- **Blindaje direccional (7.5, implementado):** `tests/systems/armor.test.ts` cubre la clasificación
  frontal/lateral/trasera con umbrales inclusivos ±60°/120°, el giro con el rumbo y los
  multiplicadores; `tests/systems/combat.test.ts` comprueba que el evento de impacto lleva `zone`;
  `tests/systems/damage.test.ts` aplica zona + blindaje + mejoras, la simetría jugador/enemigos y el
  balance 5/3/2 y 8/4/3; `tests/game/game.test.ts` integra disparos reales desde atrás y de frente
  (60 y 20 de daño).
- **Arco de fuego y ventana de recarga (7.5, implementado):** la IA no dispara con el jugador a 90° ni
  por la espalda, sí dentro de ±15°; mantiene el rumbo y no corrige el apuntado mientras recarga; el
  arco coincide con `AIM_LIMITS` (simetría). QA en Chrome headless: sin disparo a 90°, rumbo
  congelado 0,5 s y disparo al entrar en el arco.
- **Marcas de orientación (7.5, implementado):** `tests/render/models.test.ts` comprueba las 35 caras
  (7 cajas), que las franjas clara y roja giran con el rumbo y quedan en el frente y la espalda.
- **HUD (fase 8, pendiente):** la zona de impacto se muestra con el daño correcto y no solo por color.
