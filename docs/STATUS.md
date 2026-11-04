# Estado del proyecto — BattleTank-DS

> **Actualizado:** 2026-11-04 · **Fase actual:** 11 cerrada salvo QA de oído y tag (`0.1.0` preparado)
> **Último commit:** `chore(build): fijar workers_dev y preview_urls`
>
> Este fichero es el punto de entrada para retomar el proyecto, sea otra persona, otro chat u
> otro modelo. Se actualiza en **cada commit**. La verdad sobre el alcance está en el plan.

## Cómo retomar

1. Lee [`docs/PLAN.md`](PLAN.md) (alcance y fases) y este estado.
2. `npm install` y `npm run check` para confirmar que la base está sana.
3. `npm run dev` y abre `http://localhost:5273`.
4. Lee «Incidencias conocidas» antes de elegir tarea: el release `0.1.0` está preparado; quedan la
   QA manual de oído y crear el tag `v0.1.0`. Audio (10), campaña (9), HUD/radar (8), pickups (7),
   blindaje direccional (7.5) y `BUG-001` (6.6) ya están cerrados.
5. Sigue el flujo de [`docs/DEVELOPMENT.md`](DEVELOPMENT.md): tests → `npm run check` → changelog
   → estado → commit.

## Hecho

- [x] **Despliegue en Cloudflare Workers (2026-11-04).** `wrangler.jsonc` publica `dist/` como
      assets del Worker `battletank-ds` (assets-only, sin script de servidor, variables ni bindings).
      Primer deploy real correcto en <https://battletank-ds.rpublico.workers.dev> (HTTP 200 con los
      assets hasheados; versión `c56389ae-a073-47d9-9e5c-4e740ddf42ae`); `workers_dev` y
      `preview_urls` quedan explícitos para que el build no emita avisos. Wrangler 4.157.0 se instala
      con `npx` (sin pin en `package.json`). El tag `v0.1.0` sigue pendiente de la QA manual de audio.
- [x] **Release `0.1.0` preparado (2026-10-31).** `package.json`/`package-lock.json` a `0.1.0`,
      `CHANGELOG` con `[0.1.0] — 2026-10-31`, README y STATUS finales y build de producción verificado.
      **No se ha creado el tag:** queda pendiente de la QA manual de audio de oído, y no se ha hecho
      push.
- [x] **Fase 11 — pulido UX (2026-10-30).** Viñeta roja sutil con vida baja (empieza al 40 % y llega
      a 0,5 de opacidad al 0 %; lógica pura en `ui/hudView.ts` y capa `#hud-damage-vignette`),
      fogonazo del cañón enemigo (5 caras en `render/models.ts` mientras `enemy.muzzleFlash` está
      activo), aviso de pickup oculto durante la pausa (`INC-02`) y máscara inferior del periscopio
      reducida de 118 a 96 px. Tests nuevos de la vista del HUD y del modelo enemigo; **214 tests en
      38 ficheros** y QA headless de los cambios visuales.
- [x] **Fase 10 — Audio sintetizado.** Bus WebAudio sin assets: motor con pitch/volumen ligados a la
      velocidad, cañonazo, impactos/explosiones, daño recibido, recarga lista, pickups, UI y viento
      de fondo. El `AudioContext` se desbloquea con el primer gesto; si WebAudio no existe se usa un
      bus silencioso. `M` silencia y `−`/`+` ajustan el volumen (visible en el HUD y en pausa);
      `AudioBus` es inyectable, así que los tests usan un doble. 211 tests en 38 ficheros y QA visual
      del indicador/pausa.
- [x] **Fase 9 — Campaña, briefing y resultados.** Tres misiones con dificultad creciente (3, 5 y 6
      enemigos; el Tiger entra en la 2 y la 3), escenario propio por misión y tuning de IA por
      misión (reacción, dispersión y daño). Flujo de fases: briefing → partida → victoria/derrota →
      resumen. Pantallas DOM de briefing, misión cumplida, tanque destruido y campaña completada;
      `ENTER` confirma y `ESC` pausa. Puntuación de campaña (100/250 por tipo + 500 de misión + 2 por
      PV restante), precisión, tiempo y daño recibido. Persistencia best-effort en `localStorage`
      (`bestScore` y `unlockedMission`); al arrancar se muestra el briefing de la misión desbloqueada
      más alta. Tests de generación, progresión y flujo de campaña; **203 tests en 36 ficheros** y QA
      visual headless de briefing, partida y victoria.
- [x] **Fase 8 — HUD y radar.** HUD DOM superpuesto al canvas: vida con barra y valor que cambia
      de color, avance de sector en % (sin revelar enemigos restantes), puntuación (100 Panzer III /
      250 Tiger I), estado de recarga, efectos activos y avisos de pickup. Radar circular de 45 m
      orientado con el rumbo: coberturas tenues, enemigos como triángulos y pickups como rombos.
      Pausa con `ESC` que congela la simulación; pantalla de pausa con controles y semilla.
      Se retira el panel temporal de canvas y el aviso de pickup pasa a DOM. Viñeta CSS de
      periscopio. 194 tests en 33 ficheros y QA visual headless (HUD y pausa).
- [x] **Ajuste de claridad y arranque (2026-10-28).** Panel temporal reetiquetado («Escenario
      #semilla · enemigos vivos X/Y», sin números internos de fase ni proyectiles) con leyenda de
      blindaje (frente ×0,5 / lateral ×1 / espalda ×1,5). Arranque alineado con la misión 1:
      **3 Panzer III, sin Tiger**; la fase 9 fijó después el reparto por misión en
      `config/missions.ts` (3/5/6 enemigos, Tiger desde la 2). Feedback de combate: nombre y barra de
      vida sobre enemigos visibles (LOS, sin atravesar coberturas), números flotantes de daño con
      zona («−20 FRONTAL») y destello del tanque al recibir impacto; `systems/damage.ts` devuelve un
      `DamageResult` para desacoplar el feedback.
      184 tests en 31 ficheros y QA visual headless.
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
      y aviso/línea de estado en `render/statusOverlay.ts` (el aviso pasó al toast del HUD en la
      fase 8 y `render/statusOverlay.ts` se retiró). 168 tests en 30 ficheros (26 nuevos) y QA en
      Chrome headless vía CDP: los tres pickups se recogen con su efecto y el aviso visible.
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
      painter, overlay de daño y pantalla de destrucción (hoy pantalla real de derrota, fase 9).
      Ganchos `?seed=` y `window.__BT__` para QA. Verificado con captura headless. 121 tests en verde.
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

- **Fase 11 — release preparado (2026-10-31).** Documentación y `PLAN.md` sincronizados con
  autorización explícita, mejoras UX implementadas y revalidadas (viñeta de vida baja, fogonazo
  enemigo, máscara inferior de 96 px y aviso de pickup oculto en pausa), QA headless **APTO**
  (85/85 + 41/41, 0 errores de consola, 60 fps estables, 457 caras máx) y release `0.1.0` preparado
  sin tag. Quedan la QA manual de oído y, después, el tag anotado `v0.1.0` (sin push).

## Incidencias conocidas

- Ninguna abierta. `BUG-001` quedó resuelto en el bloque 6.6. La confusión del panel temporal
  («fase 7 / enemigos 3/4 / proyectiles 0») se resolvió el 2026-10-28 reetiquetándolo; era el HUD
  temporal de QA, no el HUD final.

## Pendiente (por fases)

| Fase  | Contenido                                                         | Estado                                          |
| ----- | ----------------------------------------------------------------- | ----------------------------------------------- |
| 1     | Núcleo: matemáticas, RNG, bucle de paso fijo y bus de eventos     | Completada                                      |
| 2     | Render: canvas, cámara, proyección, recorte, painter y niebla     | Completada                                      |
| 3     | Mundo: rejilla, generación procedural validada, escena de prismas | Completada                                      |
| 4     | Jugador: movimiento solidario, colisión, cámara de periscopio     | Completada                                      |
| 5     | Combate: disparo, recarga, proyectiles, impactos y escombros      | Completada                                      |
| 6     | Enemigos: modelos, IA con LOS/A*, dificultad por parámetros       | Completada                                      |
| 6.5   | Puntería con ratón (cañón cónico, balística 3D)                   | Completada                                      |
| 6.6   | Colisión entre tanques (`BUG-001`)                                | Completada                                      |
| 7     | Pickups: cura, mejora y potencia                                  | Completada                                      |
| 7.5   | Blindaje direccional y flanqueo                                   | Completada                                      |
| 7.5.1 | Claridad de impacto y arranque inicial (hotfix)                   | Completada                                      |
| 8     | HUD: vida, progreso, puntuación, radar, recarga y pausa           | Completada                                      |
| 9     | Campaña: 3 misiones, briefing, resultados y persistencia          | Completada                                      |
| 10    | Audio: efectos sintetizados WebAudio, volumen y mute              | Completada                                      |
| 11    | Pulido, QA, rendimiento, documentación final y tag `v0.1.0`       | **Casi completa** (tag pendiente de QA de oído) |

## Deuda técnica registrada

- **Supuestos de pickups pendientes de validar:** la mejora cura también los 20 PV al subir el
  máximo, las reducciones de daño son multiplicativas y recoger una mejora con el tope ×3 la consume
  sin efecto. Confirmar en la fase 11 (pulido).
- **Pantallas de campaña mínimas:** briefing, resumen, derrota y fin de campaña están
  implementados; no hay menú inicial ni selector de misión (se arranca en la desbloqueada más alta).
- **Balance del blindaje pendiente de la fase 11:** multiplicadores y umbrales ya están en
  `balance.ts`; hay que validar 5/3/2 y 8/4/3 y si la ventana de recarga de la IA resulta demasiado
  generosa (fase 11).
- **IA sin corregir rumbo al recargar:** implementado como ventana de flanqueo; revisar en la fase 11
  si hay que acortarla o mantenerla.
- IA sin patrulla ni coordinación de flanqueo: los enemigos permanecen al acecho hasta ver u oír al
  jugador. Suficiente para 0.1.0; ampliable tras la entrega.
- **Reparto por misión fijado en `config/missions.ts`** (fase 9): 3/5/6 enemigos y Tiger desde la
  misión 2; ya no hay reparto provisional.
- **Feedback de fase 11 implementado:** viñeta roja con vida baja, fogonazo del enemigo al disparar
  y máscara inferior del periscopio de 96 px; `INC-02` (aviso de pickup en pausa) corregido.
- **Sin cañón propio visible:** la puntería se lee solo con la retícula y el jugador no ve un cañón
  en primera persona (decisión del usuario, 2026-10-27). El fogonazo del enemigo sí se dibuja desde
  la fase 11; el retroceso de cámara, la marca de impacto y el tracer mantienen el feedback propio.
- **PLAN §7.7 describía el cañón dibujado:** sincronizado el 2026-10-30 con autorización del usuario
  en el commit `docs(plan)` (fila 7.5.1 aprobada, cañón 2D retirado y fases 8–10 cerradas).

## Decisiones y notas operativas

- **Flujo de trabajo acordado con el usuario:** pausa al cerrar cada fase para revisión/intervención. Se retoma con «continúa la fase N» o «continúa el bloque N».
- **Cambios aprobados 2026-10-27:** corregir `BUG-001` (6.6) y añadir blindaje direccional/flanqueo (7.5). Registrados en `PLAN.md` §2/§12 y `DECISIONS.md` ADR-009. Bloques 6.6/7.5 y fases 7, 8, 9 y 10 cerrados; siguiente: pulido/entrega (fase 11).
- **QA del bloque 6.6:** además de los tests de regresión, se condujo el juego real en Chrome headless vía CDP (sin dependencias nuevas) para avanzar contra un enemigo: el jugador se detiene a 2,9 m (suma de radios 2,75 m + margen 0,15 m) y no lo cruza.
- **QA de la fase 7:** se recogieron los tres pickups en Chrome headless vía CDP (botiquín de 40 a 70 PV, mejora de 100 a 120 de vida máxima, potencia con recarga de 1,56 s) y se verificaron con capturas el icono en el mundo, el aviso flotante y la línea de estado.
- **QA del bloque 7.5:** en Chrome headless vía CDP, disparos al mismo Panzer III hicieron 60 de daño por la espalda y 20 de frente; la IA no disparó con el jugador a 90° del rumbo, mantuvo el heading durante 0,5 s de recarga y disparó al entrar en el arco de ±15°; se comprobaron las franjas de orientación (clara delante, roja detrás) con capturas.
- **QA del ajuste de periscopio:** playtest en Chrome headless con capturas antes y después; la vista central queda despejada, la retícula sigue siendo legible y no hay errores de consola.
- No hay `pnpm` instalado en la máquina; se usa **npm** (Node 24 / npm 11).
- Puertos propios para evitar conflictos con otros desarrollos en paralelo: **dev 5273** y
  **preview 5274** (antes 5173). Se pueden sobreescribir con `npm run dev -- --port 5280`.
- El audio se sintetiza con WebAudio: no hay ficheros de audio ni assets externos. El bus es
  inyectable y cae a silencio si el navegador no lo permite. La escucha final en un navegador real
  queda como QA manual de la fase 11 (el QA headless solo comprueba HUD/eventos).
- La interfaz y la documentación van en español; los identificadores del código, en inglés.
- `main.ts` arranca el juego real (`createGame`): WASD/flechas para moverse, ratón para apuntar,
  clic o Espacio para disparar. El HUD DOM, las pantallas de campaña (briefing, victoria, derrota y
  campaña completada) y la persistencia están implementados; el overlay `F3` sigue pendiente.
- **Sincronización documental 2026-10-30:** se contrastó toda la documentación con el código real
  (`config/missions.ts`, `balance.ts`, `systems/progression.ts`, `ui/hudView.ts`, `render/periscope.ts`
  y `game/simulation.ts`) y se corrigieron las referencias obsoletas de STATUS, README, CHANGELOG,
  ARCHITECTURE, GAME_DESIGN, TESTING y DECISIONS; `PLAN.md` se sincronizó con autorización explícita
  del usuario.
- **QA de fase 11 (2026-10-30):** sesión headless por CDP sobre las 3 misiones: 85/85 comprobaciones
  OK, 0 errores de consola, pausa que congela la simulación, campaña 3/5/6, derrota/reintento y
  persistencia (`{"bestScore":2140,"unlockedMission":2}`). Rendimiento: 60 fps estables (p50 16,7 ms;
  0 frames >33 ms en 2890), caras visibles p50 193/343 y máx 457 (≤1500). **INC-01:** el presupuesto
  de «operaciones de dibujo» era ambiguo; se documenta como primitivas (`fill`, `stroke`, `fillRect`,
  `strokeRect`, `arc`, `drawImage`): p50 255/407 y pico 536 en la ventana extrema de la misión 3, sin
  caída de FPS. **INC-02:** el toast de pickup se quedaba visible en pausa; corregido. La
  revalidación de las mejoras UX (41/41 comprobaciones) confirma la viñeta (opacidad 0→0,438 a 5 PV),
  el fogonazo enemigo (2 de las 5 caras visibles por culling, +2 caras pintadas por tanque), la
  máscara de 96 px y el aviso oculto en pausa, sin regresión de rendimiento (457 caras máx y cero
  frames por encima de 33 ms). El audio queda como QA manual de oído en un navegador real (el
  headless solo comprueba HUD y eventos).
- **Release 0.1.0 preparado (2026-10-31):** versión `0.1.0` en `package.json`/lockfile, `CHANGELOG`
  con `[0.1.0] — 2026-10-31`, README/STATUS finales y build de producción verificado. Pendiente la
  QA manual de oído y, después, el tag anotado `v0.1.0`; no se ha hecho push.
- Depuración: `?seed=42` reproduce un escenario; `window.__BT__` expone el estado del juego en consola.
- Controles: W/S avanzar/retroceder, A/D girar tanque y vista, ratón para apuntar en el cono,
  clic izquierdo o Espacio disparar.

## Comandos de referencia

```bash
npm install
npm run dev        # http://localhost:5273
npm run check      # typecheck + lint + test + build (obligatorio antes de commit)
npm run build      # build de producción en dist/
```
