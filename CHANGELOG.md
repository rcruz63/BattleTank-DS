# Changelog

Todos los cambios relevantes del proyecto se documentan en este fichero, siguiendo el espíritu
de [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y
[Versionado Semántico](https://semver.org/lang/es/). Se actualiza en el **mismo commit** que
introduce cada feature; ver [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md).

## [No publicado]

### Añadido

- Audio sintetizado con WebAudio y sin assets: motor con pitch/volumen según velocidad, cañonazo,
  impactos/explosiones, daño, recarga lista, pickups, UI y viento de fondo. Bus inyectable con
  degradación silenciosa, desbloqueo en el primer gesto y fallback si WebAudio no existe. `M`
  silencia y `−`/`+` ajustan el volumen; el HUD muestra `SONIDO n %`/`SILENCIADO` y la pausa el
  volumen. Tests del bus/eventos y QA visual del HUD/pausa.
- Campaña de 3 misiones con dificultad creciente y tuning de IA propio: escenarios de 20×20, 22×22 y
  24×24, de 3 a 6 enemigos (Tiger desde la misión 2), coberturas más densas, reacción/dispersión/daño
  escalados. Briefing, resumen de misión, derrota, campaña completada y flujo con `ENTER`; puntuación
  de campaña (100/250 + 500 por misión + 2 por PV restante), precisión/tiempo/daño y persistencia
  best-effort de récord y misión desbloqueada en `localStorage`.
- HUD DOM de la fase 8: vida con barra y valor, avance de sector en %, puntuación (100 Panzer III /
  250 Tiger I), estado de recarga, efectos de mejora/potencia y avisos de pickup. Radar circular de
  45 m orientado con el rumbo (coberturas tenues, enemigos rojos, pickups verdes), pausa con `ESC`,
  pantalla de pausa con controles/semilla y viñeta CSS de periscopio. `ui/hudView` y `ui/radar` son
  modelos puros testeados; `ui/hud` es el adaptador DOM.
- Feedback de combate: nombre y barra de vida sobre enemigos visibles (respetando la línea de
  visión), números flotantes de daño con la zona del impacto («−20 FRONTAL») y destello del tanque
  al recibir un impacto; `systems/damage.ts` devuelve un `DamageResult` reutilizable.
- Blindaje direccional y flanqueo: el daño depende de la zona de impacto respecto al rumbo del
  blanco (frontal ×0,5, lateral ×1,0, trasera ×1,5) y se aplica después del blindaje base y de las
  mejoras, simétrico para jugador y enemigos; la IA solo dispara dentro de un arco de ±15° y
  mantiene el rumbo mientras recarga (ventana de flanqueo); los tanques enemigos llevan una franja
  clara en el frente y roja en la espalda. Lógica en `systems/armor.ts`, zona en el evento de
  impacto, aplicación en `systems/damage.ts`, IA en `systems/ai.ts` y datos en `config/balance.ts`;
  183 tests.
- Pickups de cura, mejora y potencia: 4 por escenario repartidos de forma determinista, recogida a
  2 m del jugador y efectos con feedback visual (caja e icono flotante, aviso «+30 PV»/«Mejora ×N»/
  «Potencia 20 s» y línea de estado temporal). El botiquín cura 30 PV sin superar el máximo, la
  mejora suma +20 de vida máxima y −10 % de daño recibido acumulable ×3, y la potencia da daño ×1,75
  y recarga −35 % durante 20 s (se renueva). Datos en `config/pickups.ts`, estado en
  `entities/pickup.ts`, reglas en `systems/loot.ts`, aplicación de daño en `systems/damage.ts`,
  modelo procedural en `render/pickupFaces.ts` y recogida cableada en `game.ts`; 168 tests.
- Puntería con ratón: el cañón pivota sobre la mazorca en un cono de ±15° horizontal y ±4°
  vertical, la retícula sigue al puntero y el disparo sale en esa dirección; clic izquierdo o
  Espacio disparan. Balística 3D con altura de blancos e impacto en suelo, recarga y marca de impacto
  en la retícula, y marca tenue del rumbo del casco. La cámara pasa a pitch 0° para que la retícula
  centrada coincida con el tiro horizontal. (El cañón 2D dibujado se retiró después; ver «Cambiado».)
- Enemigos Panzer III y Tiger I con IA (percepción, alerta por visión o estampido, avance con A*,
  apuntado, disparo y recarga), línea de visión, daño cruzado con blindaje, modelos de tanque en
  polígonos con oclusión y ganchos de depuración `?seed=` y `window.__BT__`.
- Combate del jugador: recarga, proyectiles balísticos en subpasos, impactos contra coberturas
  destructibles e indestructibles, retroceso de cámara, fogonazo, marca de impacto y anillo de
  recarga; los escombros dejan pasar los proyectiles.
- Jugador jugable: movimiento solidario casco-mira, colisión con deslizamiento y subpasos, cámara
  de periscopio y overlay procedural (máscara, mira, cañón y casco). Composición en
  `src/game/game.ts` y arranque real en `main.ts`; verificado con captura headless.
- Mundo en rejilla de 4 m con materiales destructibles e indestructibles, borde cerrado y
  generación procedural determinista validada (alcanzabilidad, spawns con distancias mínimas).
- Escena de coberturas como prismas con culling, recorte, sombreado plano, niebla, rejilla de suelo
  y escombros bajos al destruirlas.
- Pipeline de render: cámara de periscopio, proyección perspectiva, recorte de plano cercano,
  algoritmo del pintor por profundidad, utilidades de color y niebla, y adaptador de canvas.
- Núcleo del juego: utilidades matemáticas (ángulos, interpolación, vectores 2D/3D), generador
  pseudoaleatorio determinista, bucle de simulación de paso fijo con interpolación de render y
  bus de eventos tipado.
- Bootstrap del proyecto con Vite, TypeScript estricto, Vitest, ESLint y Prettier; scripts de
  desarrollo, build, test y puerta de calidad `npm run check`.
- Límites duros de tamaño y complejidad en ESLint, incluida la prohibición de bucles anidados.
- Shell del juego: canvas 16:9 con escalado, contenedor de HUD y pantalla de arranque.
- Documentación base: plan aprobado, diseño de juego, arquitectura, normas de desarrollo,
  decisiones, estrategia de pruebas, estado y guía para agentes.

### Cambiado

- Documentación sincronizada con el código real tras cerrar las fases 8–10: STATUS, README,
  ARCHITECTURE, GAME_DESIGN, TESTING y DECISIONS; `PLAN.md` se sincroniza aparte con autorización
  explícita del usuario (fila 7.5.1, retirada del cañón 2D y fases cerradas).
- Puertos del servidor de desarrollo y de preview: **5273** y **5274** respectivamente
  (antes 5173/4173) para poder convivir con otro desarrollo en paralelo.
- El panel temporal de canvas se elimina al entrar el HUD DOM; la pantalla de destrucción y los
  avisos pasan al HUD DOM y `render/statusOverlay.ts` desaparece. El aviso de pickup pasa de canvas
  al HUD y la visibilidad/caducidad de feedback se agrupa en `systems/feedback.ts`.
- El panel temporal de QA se reetiqueta: «Escenario #semilla · enemigos vivos X/Y», sin fase ni
  proyectiles internos, con leyenda de blindaje y efectos activos; el HUD definitivo llegó en la
  fase 8.
- El escenario por defecto pasa a **3 Panzer III** (sin Tiger) como arranque alineado con la misión
  1; la fase 9 fijó después el reparto por misión (3/5/6 enemigos, Tiger desde la 2).
- El cableado de entrada (teclado y ratón) se mueve de `game.ts` a `main.ts`; `createGame` acepta
  el estado de entrada inyectado y ya no enlaza eventos del DOM.
- La aplicación de daño sale de `game.ts` a `systems/damage.ts` y los overlays temporales de canvas
  (panel de estado, aviso de pickup y pantalla de destrucción) pasan a `render/statusOverlay.ts`
  (retirado después al llegar el HUD DOM); la geometría de cajas compartida se extrae a
  `render/boxes.ts`.
- La IA enemiga limita su fuego a un arco frontal de ±15° y deja de corregir el rumbo mientras
  recarga; `aimToleranceRadians` se sustituye por `fireArcDegrees`.
- El periscopio deja de dibujar el cañón 2D y su fogonazo: la puntería se lee solo con la retícula
  (decisión del usuario). Se mantienen la máscara, las marcas de rumbo y distancia, el anillo de
  recarga y la marca de impacto; el retroceso de cámara y el tracer conservan el feedback del
  disparo.

### Corregido

- `BUG-001`: el jugador ya no atraviesa tanques enemigos. El movimiento del jugador y el avance de
  la IA tratan los tanques vivos como bloqueadores circulares dinámicos
  (`world/entityCollision.ts`) con separación de seguridad de 0,15 m sobre la suma de radios; los
  enemigos destruidos dejan de bloquear y un tanque que empiece solapado puede separarse sin
  hundirse más. Tests de regresión a 6 m/s y 60 Hz (jugador↔enemigo, retroceso y enemigo↔enemigo)
  y QA en Chrome headless: el jugador se detiene a 2,9 m y no cruza.

### Decidido

- Vertical slice 0.1.0: primera persona de periscopio, polígonos planos, escenario procedural,
  tres misiones con dificultad creciente, audio sintetizado y cero assets externos.
- Puntería con ratón en un cono limitado sin torreta independiente ni free-look: mejora la
  jugabilidad sin romper la vista solidaria del periscopio.
