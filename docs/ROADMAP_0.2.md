# Hoja de ruta 0.2 — «Caza» (propuesta)

> **Estado:** propuesta de trabajo, **pendiente de aprobación del usuario**. No modifica
> [`PLAN.md`](PLAN.md) —la fuente de verdad del alcance aprobado de 0.1.0— ni compromete fechas.
> **Base:** 0.1.0 preparada + bloques A y A.1 cerrados (commits `d1fd5f6` y `a6775fb`), 239 tests.
> **Actualizado:** 2026-11-06.
>
> Este documento es el punto de entrada para las sesiones de 0.2: fija la visión, los hitos, los
> criterios de aceptación, las normas que no se relajan y **la pausa obligatoria al cerrar cada
> hito**. Si contradice a [`AGENTS.md`](../AGENTS.md), [`PLAN.md`](PLAN.md) o [`STATUS.md`](STATUS.md),
> mandan esos documentos y se corrige este.

---

## 0. Regla de oro: parar al cerrar cada hito

**Cada hito termina con una pausa.** No se empieza el siguiente hasta que el usuario lo pida
explícitamente con «continúa el hito B/D/E/F» o equivalente.

Un hito se considera cerrado solo cuando:

- [ ] Los tests del hito están escritos y pasan.
- [ ] `npm run check` está en verde (typecheck + lint + tests + build).
- [ ] Se ha hecho la prueba manual del flujo afectado (checklist de [`TESTING.md`](TESTING.md)).
- [ ] `CHANGELOG.md` y [`STATUS.md`](STATUS.md) están actualizados en el mismo commit.
- [ ] La tabla de estado y la bitácora de este documento están actualizadas.
- [ ] La documentación de diseño/arquitectura/pruebas afectada está actualizada.
- [ ] Hay commit convencional atómico.
- [ ] Se ha escrito el resumen de cierre y **se ha parado**.

Si el usuario no responde o la petición es ambigua, no se encadena el hito siguiente: se pregunta.

---

## 1. Punto de partida

- **Entrega:** 0.1.0 preparada, desplegada en <https://battletank-ds.rpublico.workers.dev>; el tag
  `v0.1.0` sigue pendiente solo de la QA manual de audio de oído.
- **Pulido ya cerrado:**
  - Bloque A: marca de impacto fiable (`BUG-002`), arco direccional de daño, cañonazo enemigo
    audible, recarga enemiga visible, buffer de disparo, briefing con controles/blindaje y puntería
    1:1 con el cursor.
  - Bloque A.1: selector de misión 1/2/3, enemigos sin línea de visión inicial, distancia mínima
    por misión (20/24/28 m) y pesados en los spawns más lejanos.
- **Calidad:** 239 tests en 40 ficheros, `npm run check` verde, repo limpio.
- **Deudas relevantes para 0.2:** IA sin patrulla ni desalerta, radar que revela enemigos a través de
  coberturas, mundo plano sin verticalidad, campaña de 3 misiones «mata a todos», sin menú inicial
  completo, audio pendiente de QA manual.
- **Arquitectura vigente:** [`ARCHITECTURE.md`](ARCHITECTURE.md); decisiones en
  [`DECISIONS.md`](DECISIONS.md) (ADR-004 fija el mundo plano; ADR-009, blindaje y flanqueo).

---

## 2. Visión 0.2

Pasar del **duelo de arena** a la **caza de tanques**: mapas más amplios, información limitada,
objetivos que no sean solo «mata a todos», paisaje que canalice rutas y un tanque que se sienta
pesado. La 0.1.0 no se rompe: queda como modo arcade/tutorial y conserva su tag.

### Pilares de 0.2

1. **Buscar, decidir, golpear.** La información es el recurso escaso: rutas, coberturas, ruido y
   contacto tardío. El radar deja de ser un mapa.
2. **Objetivos por encima de mata-todos.** Cada misión declara qué hay que hacer; eliminar enemigos
   es una herramienta, no la condición de victoria por defecto.
3. **Tanque con peso.** Inercia, motor, colisión y audio coherentes; conducir y maniobrar importa.
4. **Campaña extensible por datos.** 6–8 misiones con verbos variados; añadir una misión debe ser
   datos + tests, no programar un sistema.
5. **Legibilidad y rendimiento.** 60 fps, feedback claro, sin depender solo del color y sin
   desvelar el escenario.

### Fuera de alcance de 0.2 (salvo aprobación explícita)

Multijugador, móvil/táctil, gamepad, assets externos, dependencias de runtime, editor de mapas,
localización, campaña de más de 8 misiones, guardado a mitad de partida, alturas reales del terreno
antes del hito G (spike) y cualquier cambio de `PLAN.md` sin autorización.

---

## 3. Fusión: qué se conserva, qué cambia y qué se aparca

| Pieza previa                                           | Decisión en 0.2                                                                                                                                                                                                                       |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bloque A (claridad de combate)                         | **Se conserva.** Es la base de legibilidad; en mapas amplios hace aún más falta.                                                                                                                                                      |
| Bloque A.1 (aparición justa y selector)                | **Se conserva.** El contacto tardío y la selección de misión son prerrequisitos. El selector 1/2/3 se sustituye por una lista escalable en el hito D.                                                                                 |
| Bloque B (inercia, colisión, motor, barras/radar)      | **Se hace como hito B.** Independiente del enfoque y necesario para la sensación de caza.                                                                                                                                             |
| Bloque C (balance de misión 2/3, TTK, radio de alerta) | **Se absorbe en el hito E.** No se recalibra dos veces el mismo combate; las palancas siguen en `config/`.                                                                                                                            |
| «Mata a todos»                                         | Pasa a ser **un tipo de objetivo** para tutoriales o misiones concretas.                                                                                                                                                              |
| Mapa pequeño y combate inmediato                       | Se sustituye en el hito E por mapa amplio, patrullas y contacto tardío.                                                                                                                                                               |
| Radar omnisciente de 45 m                              | Se rediseña en E: contactos alertados, en movimiento, disparando o última posición conocida.                                                                                                                                          |
| Tres misiones actuales                                 | Decisión pendiente: adaptarlas como prólogo/tutorial o dejarlas como «clásico». Por defecto: **una sola campaña de 6–8 misiones**, con las tres primeras reescritas como tutorial. El 0.1.0 sigue intacto en la historia y en su tag. |
| Terreno con alturas                                    | **Aparcado** al hito G; primero setos/taludes y niebla en F.                                                                                                                                                                          |

---

## 4. Hitos

Cada hito tiene alcance cerrado, criterios de aceptación y un commit de cierre. **Al terminar, se
para y se pide revisión.**

### Hito B — Sensación y legibilidad (base)

**Objetivo:** que conducir y combatir se sientan bien antes de ampliar el juego.

**Alcance**

- Aceleración y frenada del jugador (inercia real, sin cambiar el giro solidario) y motor con
  pitch/volumen ligados a la velocidad real.
- Feedback de colisión (golpe seco + sacudida pequeña) usando el `CollisionResult` que hoy se ignora.
- Barras y etiquetas de enemigos sin solaparse (apilar/limitar), y radar más limpio (paredes menos
  ruidosas).
- Audio direccional del daño/disparo enemigo si no entra en el hito D.
- Ajustar la documentación que hoy dice «inercia ligera» sin que exista.

**Fuera:** mapa grande, IA, objetivos, terreno, cambios de balance.

**Criterios de aceptación**

- [ ] El tanque acelera hasta la velocidad máxima y frena con una curva perceptible, sin tirones.
- [ ] El motor suena distinto al acelerar, mantener y frenar; el silencio del motor es coherente.
- [ ] Chocar contra una cobertura produce feedback visual/sonoro y no cambia la simulación.
- [ ] Hasta 3 enemigos visibles no generan etiquetas solapadas ni recortadas en el borde.
- [ ] El radar se lee sin convertirse en una nube de puntos; las coberturas no tapan los contactos.
- [ ] `npm run check` verde y sin regresiones en los tests existentes.

**Tests:** `systems/movement`, `game/audio`, `render/combatFeedback`, `ui/hudView`, `ui/radar`,
integración de `game`. **Docs:** `GAME_DESIGN`, `ARCHITECTURE`, `TESTING`, `README`, `CHANGELOG`,
`STATUS`, esta hoja. **Riesgo:** subjetivo; ajustar con playtest. **Esfuerzo:** 1–2 semanas.

**Estado:** pendiente de aprobación y ejecución.

---

### Hito D — Objetivos y finales de misión

**Objetivo:** que la victoria dependa de datos y no de «quedan enemigos», y preparar la campaña
extensible.

**Alcance**

- `MissionDefinition` con objetivos declarativos y, si aplica, zona de salida.
- Tipos iniciales: `eliminate` (objetivo concreto, tipo o número), `destroy` (estructura/cobertura
  designada), `reach` (zona de extracción) y `survive` (tiempo) si el alcance cabe; los tres
  primeros son obligatorios.
- Estado de objetivos en `MissionSession`; `evaluateMission` deja de mirar solo `enemies.every(!alive)`.
- La salida se activa al cumplir el objetivo principal; victoria al alcanzarla si la misión define
  salida (configurable por datos).
- Objetivos opcionales con puntos; resumen y puntuación de misión adaptados.
- HUD: lista de objetivos (principal + opcionales) con estado; la barra de avance pasa a medir
  objetivos cumplidos, no enemigos restantes. Aviso al completar objetivo.
- Marcadores: baliza/icono procedural en el mundo y en el radar para salida y objetivo; sin depender
  solo del color.
- Briefing con objetivos y selector de misión escalable (lista con flechas/ENTER en lugar de solo
  `1/2/3`).
- Una **misión de demostración** (misión 4 o una de las existentes) con «destruye X y sal por el
  norte» para validar el flujo. No se reescribe la campaña entera todavía.

**Fuera:** mapa amplio, IA de patrulla, paisaje, contenido de 6–8 misiones, alturas.

**Criterios de aceptación**

- [ ] Se puede definir por datos una misión con objetivo principal, opcional y salida.
- [ ] La misión termina al cumplir el principal y salir; si se sale antes, no hay victoria (o se
      avisa según la regla elegida).
- [ ] El HUD muestra los objetivos y su estado sin desvelar el mapa.
- [ ] El radar y el mundo muestran la salida y el objetivo de forma legible y no solo por color.
- [ ] La puntuación suma principal + opcionales + bajas; el resumen los muestra.
- [ ] El selector permite elegir cualquier misión desbloqueada con una lista, no solo tres dígitos.
- [ ] Las tres misiones actuales siguen jugables durante el hito.

**Tests:** `systems/objectives` (nuevo), `systems/mission`, `game/session`, `game/campaign`,
`game/game`, `ui/hudView`, `ui/radar`, `config/missions`. **Docs:** `GAME_DESIGN`, `ARCHITECTURE`
(contrato de misión), `TESTING`, `README`, `CHANGELOG`, `STATUS`, esta hoja. **Riesgo:** UI
sobrecargada, condiciones de victoria ambiguas, selector. **Esfuerzo:** 2–3 semanas.

**Estado:** pendiente.

---

### Hito E — Prototipo «Caza»: mapa amplio e IA

**Objetivo:** demostrar con una misión jugable que la caza funciona: buscar, elegir ruta, evitar o
golpear y extraer.

**Alcance**

- Arena de **36–40 celdas** (144–160 m) para la misión de caza; densidad de obstáculos 8–10 %,
  niebla/distancia de dibujado ajustadas y presupuesto de caras verificado.
- IA: patrulla con waypoints, cono de visión (±60°), oído (disparo y motor), pérdida de rastro y
  desalerta tras 5–8 s sin contacto, investigación de última posición y vuelta a patrulla.
- Radar rediseñado: contactos solo si están alertados, disparando, moviéndose o última posición
  conocida; sin visión a través de coberturas.
- Reparto: 5–7 enemigos en 2–3 patrullas, un Tiger como objetivo, sin LOS inicial, distancias
  mínimas y pesados lejos (lo ya implementado se mantiene).
- Pickups (4–6) en posiciones que obliguen a decidir ruta; caches opcionales con riesgo.
- Misión «Caza al Tigre y sal por el norte»: matar al Tiger, opcional eliminar ligeros, extraer.
  Duración objetivo 6–10 minutos.
- Balance de combate para el nuevo ritmo: alcance de detección, radio de estampido, TTK, daño
  recibido, curación y puntuación.
- HUD/UX: objetivos, brújula/radar de salida, avisos de alerta, sin mapa completo.

**Fuera:** alturas reales, bocage completo, campaña de 6–8, menú completo, nuevas clases de enemigo.

**Criterios de aceptación**

- [ ] La misión se puede jugar de principio a fin en 6–10 minutos.
- [ ] Es posible evitar parte de la escolta y elegir ruta; el sigilo por ruptura de LOS funciona.
- [ ] Huir es viable: la IA pierde el rastro y vuelve a patrullar.
- [ ] El radar no revela el mapa ni a los enemigos no detectados.
- [ ] El objetivo y la salida se leen sin ambigüedad.
- [ ] 60 fps estables en la misión de caza; presupuesto de caras y operaciones dentro de lo medido.
- [ ] Tests de patrulla, visión, oído, desalerta, radar y flujo de objetivos.

**Tests:** `systems/ai` (patrulla/visión/oído/desalerta), `world/generate`, `ui/radar`,
`systems/objectives`, `game/campaign`, `game/game`. **Docs:** `GAME_DESIGN`, `ARCHITECTURE`,
`TESTING`, `BALANCE`/`DEPENDENCIAS` si aplica, `CHANGELOG`, `STATUS`, esta hoja.
**Riesgo:** alto (mapa vacío, IA compleja, rendimiento, balance). **Esfuerzo:** 3–5 semanas.

**Estado:** pendiente.

---

### Hito F — Paisaje y contenido (0.2)

**Objetivo:** convertir el prototipo en una campaña de 6–8 misiones con identidad visual y rutas
reales, sin tocar todavía las alturas del terreno.

**Alcance**

- **Bocage**: setos, taludes y lindes como materiales/celdas procedurales que bloquean visión y
  canalizan rutas (sin altura de terreno); reducción de cajas genéricas.
- Geometría/colores procedurales para distinguir seto, terraplén, bosquecillo y edificio; sin assets.
- Campaña de 6–8 misiones con verbos variados (eliminar, destruir, recuperar, extraer, aguantar).
- Reescribir las misiones 1–3 como prólogo/tutorial con objetivos; añadir 3–5 nuevas.
- Objetivos opcionales, puntuación y récord por misión/campaña; resumen final.
- Selector de misión escalable y menú mínimo de campaña; ajustes de audio/sensibilidad si el
  playtest los pide.
- QA completa, documentación final y tag `v0.2.0` cuando el usuario lo apruebe.

**Fuera:** alturas reales, multijugador, móvil, assets, editor.

**Criterios de aceptación**

- [ ] 6–8 misiones jugables, cada una con objetivo principal y al menos una con opcional.
- [ ] El paisaje crea rutas y ocultación sin convertirse en un laberinto.
- [ ] La campaña se puede completar y reiniciar; progresión persistente correcta.
- [ ] `npm run check` verde, QA manual completa, documentación sincronizada.
- [ ] El 0.1.0 sigue jugable (histórico) y el 0.2 tiene su propio tag cuando se apruebe.

**Tests:** contrato de misiones, flujo de campaña, generación con setos, objetivos, selector, HUD,
radar, audio. **Docs:** todas las de handoff. **Riesgo:** coste de contenido y de QA.
**Esfuerzo:** 2–4 semanas. **Estado:** pendiente.

---

### Hito G — Spike de alturas reales (opcional, no comprometido)

**Objetivo:** decidir con datos si el terreno con subidas y bajadas es viable en este motor.

**Alcance:** prototipo acotado (2 semanas máximo) de heightfield con cámara, LOS, colisión,
proyectiles, renderer y presupuesto; informe de riesgos y coste. **No se fusiona sin aprobación.**
**Criterio de decisión:** solo se acomete si E/F demuestran que la caza funciona y el usuario
considera las alturas imprescindibles. **Estado:** no iniciado; fuera de 0.2 por defecto.

---

## 5. Sistema de objetivos (diseño de referencia)

La misión declara datos; el motor evalúa estado. Ejemplo conceptual:

```ts
objectives: [
  { kind: 'eliminate', targetId: 'tiger-1', label: 'Destruye el Tiger' },
  { kind: 'reach', zoneId: 'north-exit', label: 'Sal por el norte', requires: 'primary' },
],
optional: [{ kind: 'destroy', targetId: 'supply-cache', label: 'Destruye el suministro', points: 300 }],
```

Reglas:

- **Principal** obligatorio; **opcionales** suman puntos y pueden fallarse.
- La **salida** se abre al cumplir los principales; si la misión no declara salida, la victoria
  llega al cumplirlos.
- Progreso = objetivos principales cumplidos (no enemigos restantes).
- Los marcadores usan forma + texto, no solo color.
- El «mata a todos» queda como `eliminate` con `count = total`.
- El resumen de misión muestra objetivos, precisión, tiempo, daño y puntos.

## 6. IA de caza (diseño de referencia)

Estados: `idle → patrol → alert/investigate → attack → search → return`.

- **Visión:** cono horizontal (±60°), alcance por misión, LOS real.
- **Oído:** disparo y motor; radio por misión; el jugador puede evitar el ruido.
- **Memoria:** última posición conocida; sin LOS durante N segundos → search → return.
- **Patrulla:** waypoints por grupos; no todos van a por el jugador a la vez.
- **Radar:** contactos solo con alerta, movimiento, disparo o última posición.
- **Datos:** todos los rangos en `config/` (`balance.ts`, `missions.ts`); nada codificado en `systems`.

## 7. Contenido de campaña (propuesta)

| #   | Misión                   | Objetivo principal                              | Opcional                 | Coste |
| --- | ------------------------ | ----------------------------------------------- | ------------------------ | ----- |
| 1   | El valle                 | Destruye el puesto de mando y sal               | Sin bajas                | Bajo  |
| 2   | Cruce de caminos         | Caza al Tiger y sal                             | Destruye los suministros | Medio |
| 3   | El edificio rojo         | Destruye la estación de radio y sal             | Elimina al oficial       | Medio |
| 4   | La granja                | Recupera el equipo y vuelve al punto de entrada | Sin ser detectado        | Bajo  |
| 5   | Emboscada                | Destruye el convoy antes de que cruce           | Sin bajas                | Alto  |
| 6   | Última línea             | Aguanta el asalto y extrae                      | Destruye los dos Tigers  | Medio |
| 7–8 | A definir con el usuario | —                                               | —                        | —     |

Añadir una misión debe ser **datos + test de contrato**, no un sistema nuevo. La excepción es un
verbo nuevo (por ejemplo, escoltar), que exige diseño y tests propios.

## 8. Decisiones pendientes

Mientras el usuario no diga lo contrario, se aplican estos supuestos y se anotan en `STATUS.md`:

| Pregunta                           | Supuesto por defecto                                                           |
| ---------------------------------- | ------------------------------------------------------------------------------ |
| Duración objetivo por misión       | 6–10 min; 8 min como referencia                                                |
| ¿La salida es obligatoria?         | Sí cuando la misión declara salida; si no, victoria al cumplir el principal    |
| ¿Se conserva «mata a todos»?       | Sí, como tipo de objetivo/tutorial, no como defecto                            |
| ¿Campaña nueva o reescribir las 3? | Una campaña de 6–8; las 3 pasan a tutorial/prologo; 0.1.0 queda en la historia |
| Selector de misión                 | Lista con flechas/ENTER en D; los dígitos quedan como atajo si hay ≤9          |
| Sigilo y ruido                     | Oído de motor y disparo; sin tecla de apagar motor en el primer prototipo      |
| Radar                              | Solo contactos detectados/última posición; nada a través de coberturas         |
| Tamaño de arena para caza          | 36–40 celdas (144–160 m) en E; el resto de misiones se adapta en F             |
| Terreno con alturas                | No en 0.2; setos/taludes en F; spike G solo con aprobación                     |
| Guardado a mitad de partida        | No; misiones de 6–10 min; revisar si el playtest lo hace frustrante            |
| Cambios de `PLAN.md`               | Prohibidos sin autorización explícita; este documento es propuesta             |

## 9. Normas de trabajo (no se relajan)

Recordatorio de [`AGENTS.md`](../AGENTS.md) y [`DEVELOPMENT.md`](DEVELOPMENT.md):

- Tests primero; `npm run check` antes de cada commit; `main` nunca rota.
- Sin `any`, sin `@ts-ignore`, sin bucles anidados; límites de tamaño/complejidad de ESLint.
- Capas: `config` datos puros; `core` sin juego; `world` sin Canvas/DOM; `render` no muta;
  `systems` sin Canvas/DOM; `ui`/`audio` adaptadores; solo `game` cablea; sin `Math.random()`.
- Cero dependencias de runtime y cero assets externos; audio WebAudio sintetizado.
- `CHANGELOG.md` y `STATUS.md` en el mismo commit que el cambio.
- Commits convencionales, en español, atómicos; documentación en español, identificadores en inglés.
- Sin `console.log` permanente; sin ficheros temporales; `F3` sigue pendiente.
- **No tocar `PLAN.md` sin aprobación explícita.**
- **No encadenar hitos:** al cerrar uno, parar y pedir revisión.

### Checklist por sesión

1. Leer `STATUS.md`, esta hoja y el hito activo.
2. `git status` / `git log`; `npm run check` para confirmar base sana.
3. Confirmar que el trabajo pertenece a **un solo hito** y no invade el siguiente.
4. Escribir/actualizar tests antes de la lógica nueva.
5. Implementar en la capa correcta, dentro de los límites.
6. `npm run check` verde + prueba manual del flujo (checklist de `TESTING.md`).
7. Actualizar `CHANGELOG`, `STATUS`, documentación de diseño/pruebas y esta hoja (estado y bitácora).
8. Commit atómico.
9. **Parar, resumir y pedir revisión.**

## 10. Estado y bitácora

| Hito                        | Estado                  | Commit | Notas                                  |
| --------------------------- | ----------------------- | ------ | -------------------------------------- |
| B — Sensación y legibilidad | Pendiente de aprobación | —      | Debe cerrarse antes de ampliar el mapa |
| D — Objetivos y finales     | Pendiente               | —      | Puede empezar tras B                   |
| E — Prototipo Caza          | Pendiente               | —      | Requiere D; el más arriesgado          |
| F — Paisaje y contenido     | Pendiente               | —      | Requiere E                             |
| G — Spike alturas           | No iniciado             | —      | Solo con aprobación                    |

| Fecha      | Hito | Sesión    | Resultado                                    | Commit |
| ---------- | ---- | --------- | -------------------------------------------- | ------ |
| 2026-11-06 | —    | Propuesta | Hoja de ruta creada; pendiente de aprobación | —      |

## 11. Documentos relacionados

- [`PLAN.md`](PLAN.md) — alcance aprobado de 0.1.0 (no modificar sin autorización).
- [`STATUS.md`](STATUS.md) — estado operativo y cómo retomar.
- [`AGENTS.md`](../AGENTS.md) — reglas de trabajo y orden de lectura.
- [`GAME_DESIGN.md`](GAME_DESIGN.md) — diseño del juego y números de contenido.
- [`ARCHITECTURE.md`](ARCHITECTURE.md) — capas y contratos.
- [`TESTING.md`](TESTING.md) — estrategia y checklist manual.
- [`DECISIONS.md`](DECISIONS.md) — ADR; cualquier cambio de contrato o alcance exige uno nuevo.
- [`DEVELOPMENT.md`](DEVELOPMENT.md) — normas de código, git y definición de terminado.
