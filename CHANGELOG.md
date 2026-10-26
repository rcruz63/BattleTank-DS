# Changelog

Todos los cambios relevantes del proyecto se documentan en este fichero, siguiendo el espíritu
de [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y
[Versionado Semántico](https://semver.org/lang/es/). Se actualiza en el **mismo commit** que
introduce cada feature; ver [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md).

## [No publicado]

### Añadido

- Bootstrap del proyecto con Vite, TypeScript estricto, Vitest, ESLint y Prettier; scripts de
  desarrollo, build, test y puerta de calidad `npm run check`.
- Límites duros de tamaño y complejidad en ESLint, incluida la prohibición de bucles anidados.
- Shell del juego: canvas 16:9 con escalado, contenedor de HUD y pantalla de arranque.
- Documentación base: plan aprobado, diseño de juego, arquitectura, normas de desarrollo,
  decisiones, estrategia de pruebas, estado y guía para agentes.

### Decidido

- Vertical slice 0.1.0: primera persona de periscopio, polígonos planos, escenario procedural,
  tres misiones con dificultad creciente, audio sintetizado y cero assets externos.
