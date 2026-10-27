# Decisiones de arquitectura (ADR) — BattleTank-DS

Registro corto de las decisiones que limitan el futuro del proyecto: qué se decidió, por qué y qué
se acepta a cambio. Se derivan del plan aprobado ([`PLAN.md`](PLAN.md)); las firmas y los detalles de
implementación no van aquí, solo las decisiones.

## Cómo se usa este registro

- Un ADR se añade cuando se toma una decisión que condiciona el futuro: **dependencia** (de runtime o
  de desarrollo), **asset externo**, **contrato entre capas**, **desviación del alcance del plan**, o
  cambio de **persistencia, entrada o arquitectura**.
- Numeración correlativa `ADR-NNN`. Un ADR aceptado **no se reescribe**: si cambia la decisión, se
  marca el anterior como «Sustituida por ADR-XXX» y se añade uno nuevo.
- Formato: contexto, decisión y consecuencias (positivas, negativas, riesgos y cuándo revisar).
  Media página; sin código ni firmas.

---

## ADR-001 — TypeScript + Vite + Canvas 2D + Vitest, sin dependencias de runtime

- **Estado:** aceptada · **Fecha:** 2026-10-26 · **Fuente:** PLAN §2, §5.1
- **Contexto:** juego de navegador, sin backend, con estética de polígonos planos y necesidad de
  iteración rápida y tests deterministas. El plan cierra el alcance de 0.1.0 y prohíbe dependencias
  en runtime.
- **Decisión:** TypeScript estricto como lenguaje, Vite para desarrollo y build estático, Canvas 2D
  como backend gráfico y Vitest (entorno Node) para las pruebas. Cero dependencias de runtime; solo
  herramientas de desarrollo (Vite, TypeScript, Vitest, ESLint, Prettier).
- **Consecuencias:**
  - (+) Build estático y ligero, sin cadena de dependencias en producción; tests rápidos en Node;
    una sola toolchain conocida.
  - (−) Motor gráfico propio: cámara, proyección, recorte y painter se escriben a mano; el HUD vive
    fuera del canvas (ADR-003); la verificación de tipos exige disciplina.
  - Riesgo: si algún día se necesitan shaders o 3D real, Canvas 2D no sirve; requeriría otro ADR y
    probablemente WebGL, no un parche.
  - Revisar si el presupuesto de render (≤ 1 500 caras / ≤ 500 operaciones) no se cumple.

## ADR-002 — Pseudo-3D con painter's algorithm y sus límites

- **Estado:** aceptada · **Fecha:** 2026-10-26 · **Fuente:** PLAN §6.2, §6.3, §14
- **Contexto:** la referencia es el arcade *Battle Tank/Battlezone*: geometría plana, cámara de
  periscopio, sin texturas ni modelos. Se busca la solución más simple y testeable que dé profundidad
  convincente.
- **Decisión:** proyección perspectiva con cámara a 1,7 m, FOV ≈ 72°, recorte de plano cercano
  (Sutherland–Hodgman), sombreado plano por normal, niebla de distancia y pintado de lejos a cerca
  (painter's algorithm) sin z-buffer.
- **Consecuencias:**
  - (+) Barato, determinista y verificable con un contexto 2D simulado; no requiere GPU ni shaders.
  - (−) El orden por profundidad media falla en intersecciones exactas de geometría; no hay
    transparencias ni verticalidad real; el coste crece con el número de caras.
  - Mitigación aceptada: celdas disjuntas y sin solapes, criterio de desempate estable y límite de
    caras. Los artefactos cosméticos quedan como deuda conocida.
  - Revisar si aparecen artefactos visibles en juego o si se necesita geometría que se cruce.

## ADR-003 — HUD en DOM/CSS y radar en un canvas independiente

- **Estado:** aceptada · **Fecha:** 2026-10-26 · **Fuente:** PLAN §5.1, §7.7
- **Contexto:** el HUD es texto, barras, iconos y avisos; el radar exige dibujo circular, giro y
  barrido animado. El canvas principal está ocupado por la vista 3D.
- **Decisión:** HUD y pantallas en DOM/CSS sobre el canvas 3D; radar en un canvas pequeño propio; los
  overlays de menú/briefing/pausa/resumen también en DOM. El HUD es de solo lectura: no contiene
  lógica de juego.
- **Consecuencias:**
  - (+) Texto legible y escalable, accesibilidad básica y estilos baratos; separación clara entre
    render 3D y UI; el radar se puede probar con matemáticas puras.
  - (−) Dos sistemas de dibujo que coordinar; riesgo de que la UI mute estado si no se respeta el
    contrato; la composición exacta (capas, tamaños) se ajusta en la fase 8.
  - Revisar si el rendimiento del DOM por frame se vuelve un problema (no debería con actualizaciones
    puntuales).

## ADR-004 — Mundo en rejilla de celdas de 4 m con oclusión total por coberturas

- **Estado:** aceptada · **Fecha:** 2026-10-26 · **Fuente:** PLAN §6.1, §7.1, §7.3
- **Contexto:** hacen falta colisión, línea de visión, pathfinding y generación procedural con poca
  complejidad; la condición de diseño es que **no se pueda ver a través de las coberturas intactas**
  sin recurrir a un z-buffer.
- **Decisión:** rejilla de celdas de 4 m (arena 16×16 a 24×24 celdas) donde cada celda es vacía o una
  cobertura con material, altura (2,4–3,4 m) y vida; prismas de 4 caras verticales; borde cerrado
  indestructible; al destruir una cobertura quedan escombros bajos. La cámara (1,7 m) está siempre
  por debajo de la altura mínima de cobertura, así que la oclusión es total mientras la celda está
  intacta.
- **Consecuencias:**
  - (+) Oclusión garantizada por geometría + orden de pintado, no por trucos; DDA de LOS y A* de
    rejilla simples; generación validable por *flood fill*; reglas simétricas para el jugador y la IA.
  - (−) Movimiento en rejilla de 4 m puede sentirse grueso; sin alturas, rampas ni voladizos; las
    coberturas ocupan celdas completas; destruir una cobertura abre un hueco de celda entera.
  - Revisar si el diseño necesita verticalidad o coberturas de tamaño libre: exigiría cambiar el
    contrato de mundo y un ADR nuevo.

## ADR-005 — Generación procedural determinista con validación

- **Estado:** aceptada · **Fecha:** 2026-10-26 · **Fuente:** PLAN §7.1
- **Contexto:** cada misión se genera en la partida, pero se necesita poder reproducir un escenario
  para depurar y para escribir tests estables; además, no debe haber zonas inalcanzables ni spawns
  injustos.
- **Decisión:** RNG determinista `mulberry32` sembrado con `Date.now()` y semilla visible en el
  briefing; generación por pasos (borde → grupos de coberturas → validación de conectividad con
  *flood fill* → colocación de jugador/enemigos/pickups con distancias mínimas) y reintentos
  acotados (máx. 30). Los tests usan semillas fijas.
- **Consecuencias:**
  - (+) Escenarios reproducibles y testables, sin mapas hechos a mano; validación automática de
    conectividad y seguridad de spawns; depuración guiada por semilla.
  - (−) La generación puede fallar o tardar; el fallback al agotar reintentos está pendiente de
    decidir; los tests de generación corren varias semillas y cuestan más.
  - Revisar la política de fallback y los parámetros de validación en la fase 3.

## ADR-006 — Cero assets externos y audio sintetizado con WebAudio

- **Estado:** aceptada · **Fecha:** 2026-10-26 · **Fuente:** PLAN §2, §7.8, §9.1
- **Contexto:** el proyecto no tiene pipeline de arte ni de audio; se quiere un build pequeño, sin
  licencias de terceros y coherente con la estética de polígonos planos.
- **Decisión:** toda la geometría se construye por código; tipografía del sistema e iconos CSS;
  ningún fichero de imagen, fuente o audio. Los efectos se sintetizan con WebAudio (motor, cañonazo,
  impacto, recarga, pickup, UI y viento) tras una interfaz de audio sustituible en tests. El
  `AudioContext` se desbloquea en el primer input y, si no hay WebAudio, el juego funciona en
  silencio.
- **Consecuencias:**
  - (+) Carga instantánea, bundle mínimo, sin licencias ni assets que versionar; estilo visual
    homogéneo; audio testeable con un doble.
  - (−) Menor fidelidad visual/sonora y más código sintetizador; el audio depende de la política de
    autoplay del navegador; no hay música en 0.1.0.
  - Cualquier asset futuro exigirá ADR con procedencia, licencia y estrategia de carga.

## ADR-007 — Persistencia mínima con localStorage

- **Estado:** aceptada · **Fecha:** 2026-10-26 · **Fuente:** PLAN §2, §7.6
- **Contexto:** se quiere progresión simple (récord y desbloqueo de misión) sin backend, cuentas ni
  infraestructura.
- **Decisión:** `localStorage` solo para el récord de puntos y la misión máxima desbloqueada. No hay
  guardado a mitad de partida; al morir se reinicia la misión actual. La lectura/escritura es
  best-effort: si el almacenamiento falla o está bloqueado, el juego sigue sin persistencia.
- **Consecuencias:**
  - (+) Cero infraestructura y cero latencia; implementación pequeña y aislada en
    `systems/progression`; fácil de sustituir por un doble en tests.
  - (−) Los datos no viajan entre dispositivos; se pierden al limpiar el navegador o en modo privado;
    solo hay dos claves (pendientes de fijar en la fase 9); un guardado a mitad de partida no está
    soportado y no debe simularse.
  - Revisar solo si se añaden cuentas, clasificación en red o guardado de partida (fuera de 0.1.0).

## ADR-008 — Sin móvil ni gamepad en 0.1.0

- **Estado:** aceptada · **Fecha:** 2026-10-26 · **Fuente:** PLAN §2, §4, §16
- **Contexto:** el diseño de periscopio y la economía de tiempo del vertical slice piden un único
  esquema de control bien probado: teclado de escritorio y clic para disparar.
- **Decisión:** 0.1.0 solo soporta navegadores modernos de escritorio con teclado y ratón (clic para
  disparar). Sin controles táctiles, sin gamepad, sin mando analógico y sin vista libre con el ratón.
  El canvas se adapta con letterboxing 16:9, sin diseño responsive específico.
- **Consecuencias:**
  - (+) Alcance controlado y controles coherentes con el diseño solidario del tanque; menos matrices
    de pruebas y de UI.
  - (−) Sin público móvil ni mandos; una futura adaptación requerirá abstracción de entrada, UI
    táctil y un ADR propio.
  - Revisar después de 0.1.0 si se decide ampliar plataformas.


## ADR-009 — Blindaje direccional y arco de fuego simétrico (implementada en el bloque 7.5)

- **Estado:** aceptada e implementada en el bloque 7.5 (2026-10-27) · **Fecha:** 2026-10-27 ·
  **Fuente:** petición del usuario; PLAN §2, §7.3, §7.4 y §12
- **Contexto:** la IA gira el casco hacia el jugador y el combate acaba siendo siempre frontal. El
  jugador no puede disparar fuera de su cono de ±15°, así que los enemigos tampoco deberían poder
  hacerlo. Sin zonas de blindaje, maniobrar no aporta ventaja y la sensación es que todos los
  tanques «están de frente».
- **Decisión:**
  - Daño por zona respecto al rumbo del blanco, después de `armor`: frontal ×0,5, lateral ×1,0 y
    trasera ×1,5; umbrales ±60°/120°. Simétrico para jugador y enemigos.
  - Arco de fuego enemigo de ±15° respecto a su rumbo: no disparan por los lados ni por detrás.
  - Mientras recargan no corrigen el rumbo (ventana de flanqueo), además del giro limitado.
  - Marcas de orientación en el modelo enemigo y feedback de zona de impacto en el HUD (fase 8).
  - Implementación en el bloque 7.5, después de `BUG-001` (6.6) y de pickups (7).
- **Consecuencias:**
  - (+) El flanqueo pasa a ser la respuesta eficiente al frontal; el combate gana profundidad y la
    IA deja de ser un tirador que siempre encara.
  - (+) Los valores quedan como datos (`balance.ts`), por lo que el ajuste no toca la lógica.
  - (−) El daño frontal combinado con `armor` alarga los duelos; hay que recalibrar en la fase 9 con
    simulación headless.
  - (−) La IA expuesta mientras recarga puede resultar demasiado fácil; se valida con simulación y se
    ajusta la ventana si hace falta.
- **Valores abiertos:** multiplicadores, umbrales y duración de la pausa de seguimiento son
  configurables; el balance definitivo es de la fase 9.
