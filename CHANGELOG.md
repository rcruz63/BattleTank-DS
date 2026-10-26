# Changelog

Todos los cambios relevantes del proyecto se documentan en este fichero, siguiendo el espíritu
de [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y
[Versionado Semántico](https://semver.org/lang/es/). Se actualiza en el **mismo commit** que
introduce cada feature; ver [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md).

## [No publicado]

### Añadido

- Enemigos Panzer III y Tiger I con IA (percepción, alerta por visión o estampido, avance con A*,
  apuntado, disparo y recarga), línea de visión, daño cruzado con blindaje, modelos de tanque en
  polígonos con oclusión y ganchos de depuración `?seed=` y `window.__BT__`.
- Combate del jugador: recarga, proyectiles balísticos en subpasos, impactos contra coberturas
  destructibles e indestructibles, retroceso de cámara, fogonazo, marca de impacto y anillo de
  recarga; los escombros dejan pasar los proyectiles.
- Jugador jugable: entrada de teclado con disparo de flanco, movimiento solidario casco-mira,
  colisión con deslizamiento y subpasos, cámara de periscopio y overlay procedural (máscara, mira,
  cañón y casco). Composición en `src/game/game.ts` y arranque real en `main.ts`; verificado con
  captura headless.
- Mundo en rejilla de 4 m con materiales destructibles e indestructibles, borde cerrado y
  generación procedural determinista validada (alcanzabilidad, spawns con distancias mínimas).
- Escena de coberturas como prismas con culling, recorte, sombreado plano, niebla, rejilla de suelo
  y escombros bajos al destruirlas; demo visual temporal en `main.ts`.
- Pipeline de render: cámara de periscopio, proyección perspectiva, recorte de plano cercano,
  algoritmo del pintor por profundidad, utilidades de color y niebla, y adaptador de canvas; 21
  tests unitarios.
- Núcleo del juego: utilidades matemáticas (ángulos, interpolación, vectores 2D/3D), generador
  pseudoaleatorio determinista, bucle de simulación de paso fijo con interpolación de render y
  bus de eventos tipado, con 29 tests unitarios.
- Bootstrap del proyecto con Vite, TypeScript estricto, Vitest, ESLint y Prettier; scripts de
  desarrollo, build, test y puerta de calidad `npm run check`.
- Límites duros de tamaño y complejidad en ESLint, incluida la prohibición de bucles anidados.
- Shell del juego: canvas 16:9 con escalado, contenedor de HUD y pantalla de arranque.
- Documentación base: plan aprobado, diseño de juego, arquitectura, normas de desarrollo,
  decisiones, estrategia de pruebas, estado y guía para agentes.

### Decidido

- Vertical slice 0.1.0: primera persona de periscopio, polígonos planos, escenario procedural,
  tres misiones con dificultad creciente, audio sintetizado y cero assets externos.
