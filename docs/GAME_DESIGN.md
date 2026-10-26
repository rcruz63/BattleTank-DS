# Diseño de juego — BattleTank-DS

Documento de diseño del vertical slice **0.1.0**. Se deriva del plan aprobado
([`PLAN.md`](PLAN.md), fuente de verdad del alcance); si hay conflicto, manda el plan y se corrige
este documento. Estado: fases 0–6 cerradas (bootstrap, núcleo, render, mundo, jugador, combate e
IA); la siguiente es la fase 7 (pickups). El detalle vivo está en [`STATUS.md`](STATUS.md).

**Balance de tanques:** los números concretos (PV, velocidad, giro, recarga, daño, blindaje y
velocidad de proyectil) viven en **`src/config/tanks.ts`**, que es la fuente de verdad. Este
documento describe roles y criterios de diseño; el ajuste fino de dificultad se hace en la fase 9.

- **Título provisional:** BATTLE TANK — PERISCOPIO.
- **Ambientación:** frente occidental, 1944. Jugador aliado con un M4 Sherman contra carros del Eje.
- **Cámara:** primera persona tipo periscopio, sin vista libre; casco y mira solidarios.
- **Formato:** partidas cortas de acción, campaña de 3 misiones encadenadas.
- **Plataforma:** navegador de escritorio, teclado, sin assets externos.

## 1. Concepto

El jugador está **dentro** del tanque y solo ve el sector al que apunta la mira. No hay mapa
completo ni vista en tercera persona: la información llega por el periscopio, el radar circular y la
barra de progreso. El escenario se genera en cada partida con coberturas que bloquean la visión y que,
en parte, son destruibles. Los enemigos patrullan, buscan línea de visión y disparan obedeciendo las
mismas reglas de oclusión que el jugador.

La tensión nace de la **asimetría de información**: no sabes qué hay detrás de una cobertura hasta
que la flanqueas o la destruyes, pero el radar te avisa de que hay algo. Avanzar a ciegas, abrir una
línea de tiro a cañonazos y administrar la recarga son las decisiones del bucle.

### Pilares

1. **Ver poco, decidir mucho.** El periscopio limita el campo de visión y la cobertura oculta el
   escenario; la información táctica (radar, progreso, avisos) se da sin desvelar el mapa.
2. **La cobertura es el juego.** Bloquea vista y proyectiles, y las destructibles cambian el mapa:
   abrir una línea de tiro es una decisión ofensiva.
3. **Combate legible y justo.** Enemigos con línea de visión real, sin *aimbots*; feedback claro de
   impacto, recarga, daño y destrucción.
4. **Campaña corta con progresión.** Tres misiones que escalan en enemigos, densidad, precisión y
   agresividad, con récord y desbloqueo persistentes.

## 2. Bucle de juego

Bucle de una partida:

1. **Briefing** de misión: texto breve, objetivo y semilla del escenario; una tecla para empezar.
2. El jugador **avanza** por el escenario generado sin mapa completo: periscopio, radar y barra de
   progreso (solo porcentaje, nunca número de enemigos restantes).
3. **Combate:** los enemigos patrullan, toman línea de visión y disparan. Las coberturas bloquean
   visión y proyectiles; las destructibles se derriban a cañonazos y abren nuevas líneas de tiro.
4. **Gestión de recursos:** recoger botiquín, mejora y potencia; administrar la recarga y el daño
   recibido.
5. Al destruir a todos los enemigos, **victoria de misión**: resumen de puntos, precisión, tiempo y
   daño recibido; paso a la siguiente misión.
6. Al morir, **derrota**: resumen y reintento desde el principio de la misión actual. Se conservan
   récord y misión desbloqueada.

**Victoria:** 100 % de progreso (todos los enemigos del escenario destruidos).
**Derrota:** vida a 0. El plan cita también «salir del área jugable», pero el escenario está cerrado
por coberturas indestructibles, así que en la práctica solo se pierde por daño; ver
[§12](#12-pendientes-de-diseño-para-el-lead).

**Campaña:** 3 misiones encadenadas. Al terminar la tercera se muestra el resumen final de campaña.
El menú permite reanudar desde la misión desbloqueada más alta, con el récord visible en pausa y en
los resúmenes. No hay guardado a mitad de partida.

## 3. Controles

| Acción | Entrada | Estado |
|---|---|---|
| Avanzar | `W` o `↑` | **Disponible.** Inercia ligera; el tanque avanza en la dirección de su rumbo. |
| Retroceder | `S` o `↓` | **Disponible.** Marcha atrás con el mismo control. |
| Girar | `A`/`D` o `←`/`→` | **Disponible.** Giran casco **y** mira a la vez; la cámara es solidaria, sin torreta independiente. |
| Disparar | `Espacio` | **Disponible (fase 5).** Un disparo por pulsación; mantener no repite. Recarga de 2,4 s. |
| Pausa | `Esc` | Previsto (fase 8): congela la simulación y abre el menú. |
| Silenciar | `M` | Previsto (fase 10). |
| Depuración | `F3` | Previsto: overlay con fps, caras, celdas visibles y entidades. |

No hay clic para disparar ni apuntado libre con el ratón, ni strafe, ni gamepad, ni controles
táctiles en 0.1.0. Mientras no exista el HUD, la pantalla muestra un texto temporal con semilla,
teclas y vida.

## 4. HUD y capas

### Elementos

- **Vida:** barra + valor numérico, arriba a la izquierda. Cambia de color según el porcentaje.
- **Avance del escenario:** barra superior centrada, solo porcentaje; sube al destruir enemigos y
  nunca muestra cuántos quedan.
- **Puntuación:** marcador arriba a la derecha. El récord aparece en pausa y en los resúmenes.
- **Radar:** circular, abajo a la derecha, centrado en el tanque y orientado con el rumbo; alcance
  45 m, barrido animado. Enemigos como triángulos rojos, pickups como rombos verdes y coberturas
  como trazos tenues. No muestra el detalle del mapa.
- **Recarga:** anillo de progreso alrededor de la mira + segundos restantes («1,4 s») mientras
  recarga; un destello indica que el arma está lista.
- **Efectos temporales:** iconos de potencia y de mejora activa con cuenta atrás.
- **Avisos de estado:** mensajes breves (objetivo cumplido, daño crítico, recarga completada).
- **Rumbo:** indicador discreto de orientación (brújula) para mitigar la desorientación en primera
  persona; previsto, se fija en la fase 8.
- **Pantallas:** menú, briefing, pausa, resumen de misión y derrota/final de campaña.

Estado actual (fase 6): hay un HUD **temporal** con semilla, enemigos vivos, proyectiles, vida y
recarga. Ya existen en el periscopio el anillo de recarga con segundos, el fogonazo, la marca de
impacto y el retroceso de cámara; el overlay rojo de daño y la pantalla provisional «TANQUE
DESTRUIDO» están implementados. El HUD/radar definitivos llegan en la fase 8.

### Esquema ASCII (conceptual)

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ VIDA ██████████░░░░ 78/100        AVANCE [██████░░░░] 42 %     PUNTOS 1 250   │
│                                                                              │
│                                                                              │
│                          ╭─────────────────────╮                             │
│                          │      mira ⊕         │   ← anillo de recarga       │
│                          │      1,4 s          │                             │
│                          ╰─────────────────────╯                             │
│                                                                              │
│      [POTENCIA 12 s]   [MEJORA ×2]                     ╭──────────────────╮   │
│                                                        │ RADAR (45 m)     │   │
│                                                        │   ▲ enemigo      │   │
│                                                        │   ◆ pickup       │   │
│                                                        ╰──────────────────╯   │
└──────────────────────────────────────────────────────────────────────────────┘
```

Las posiciones son orientativas: la composición exacta se ajusta en la fase 8. Los textos usan coma
decimal (español) y **no deben depender solo del color**: los estados llevan icono o forma.

### Capas de pantalla

1. Canvas 3D (1280×720 interno, escalado con letterboxing).
2. Overlay de periscopio (máscara, mira, cañón y casco). **Decisión actual:** se pinta en el propio
   canvas (`render/periscope.ts`), no como viñeta CSS; el plan preveía CSS y se revisará en la fase 8
   si el HUD lo requiere.
3. HUD en DOM/CSS (vida, progreso, puntuación, recarga, avisos, iconos) — fase 8.
4. Radar en un canvas pequeño independiente — fase 8.
5. Overlays de menú/briefing/pausa/resumen encima de todo — fases 8-9.

## 5. Visión de periscopio y oclusión

- Cámara a **1,7 m** de altura sobre el tanque, **yaw = rumbo del tanque** (sin retardo lógico),
  **pitch fijo** ligeramente hacia abajo y FOV horizontal ≈ **72°**.
- La imagen se enmarca con una máscara oscura pintada en el canvas; la mira tiene marcas de
  distancia y en el primer plano se dibujan la silueta del cañón y el borde del casco. **El overlay
  está en canvas, no en CSS** (decisión actual desde la fase 4).
- Retroceso de cámara al disparar (implementado): sube el pitch y la cámara retrocede unos
  centímetros durante un instante. Al recibir daño se tiñe la pantalla de rojo; la sacudida de cámara
  por impacto queda como deuda. Todos son efectos **visuales**: nunca cambian el rumbo lógico ni la
  simulación.
- No hay vista por encima de las coberturas ni asomarse: la cámara está por debajo de la altura
  mínima de cobertura. La oclusión es **total mientras la cobertura está intacta**.
- Las coberturas destruidas dejan escombros bajos: se ve (y se dispara) a través de ellas.
- Los enemigos usan la misma línea de visión: no disparan a través de coberturas intactas. La
  oclusión es una regla simétrica, no una ventaja artificial del jugador.

## 6. Coberturas y materiales

El escenario está cerrado por un borde de coberturas **indestructibles** (hormigón en la
implementación actual). En el interior se colocan grupos de coberturas (paseos
aleatorios/habitaciones) con una densidad que depende de la misión. Cada celda de 4 m es vacía o una
cobertura con material, altura y vida.

| Material | Destructible | Impactos para destruir | Altura | Notas |
|---|---|---|---|---|
| Madera | Sí | 1 | 2,4 m | Cobertura ligera; abre línea de tiro rápido. |
| Ladrillo | Sí | 3 | 3,0 m | Resistencia media; obliga a gastar recarga. |
| Hormigón | No | — | 3,2 m | Bloqueo permanente. |
| Acero | No | — | 3,4 m | Bloqueo permanente, visualmente más oscuro. |

- «Impactos» se mide en disparos del cañón del jugador, no en puntos de vida genéricos. Los valores
  actuales y las alturas viven en **`src/config/materials.ts`** (fuente de verdad).
- Alturas de cobertura **2,4–3,4 m**, siempre por encima de la cámara (1,7 m): garantizan oclusión
  total mientras están intactas.
- Las coberturas bloquean movimiento, visión y proyectiles. Al destruirse dejan **escombros bajos**
  (0,35–0,5 m según material) que no taparán la visión ni detendrán los proyectiles; tampoco
  bloquean el paso (`isBlocked` exige vida > 0).
- La destrucción de una cobertura es irreversible en la partida.

## 7. Pickups

| Pickup | Efecto | Visual |
|---|---|---|
| Botiquín (cura) | +30 PV, sin superar el máximo | Cruz blanca sobre caja |
| Mejora (upgrade) | +20 PV máximos y −10 % de daño recibido durante la misión (acumulable ×3) | Llave inglesa/chevrones |
| Potencia (power) | Durante 20 s: daño ×1,75 y recarga −35 % | Rayo amarillo |

- Aparecen en celdas libres **alcanzables**, con 3–5 unidades por misión.
- Se recogen al pasar por encima: radio de 2 m.
- No reaparecen. Al morir se pierden todos los acumulados de la misión.
- El HUD muestra icono y cuenta atrás de los efectos temporales.
- La mejora acumulable ×3 implica hasta −30 % extra de daño recibido; cómo se combina con la
  reducción base del Sherman (aditiva o multiplicativa) está pendiente (ver §12).

## 8. Enemigos e IA

Dos tipos de carro del Eje, con apariencia de polígonos planos por tipo y colores de facción. Los
stats concretos están en **`src/config/tanks.ts`** (fuente de verdad) y el ajuste fino llega en la fase 9.

| Enemigo | Clase | Rol |
|---|---|---|
| Panzer III | Ligero | Rápido y numeroso; presiona y flanquea. |
| Tiger I | Pesado | Lento, mucha vida y daño; ancla posiciones. |

**Máquina de estados actual (fase 6):** `idle → advance → attack`; la muerte se representa con
`alive = false` (el estado «muerto» no es un modo de IA).

- **Idle (acecho):** sin alerta. No patrulla todavía ni tiene línea de visión; espera.
- **Advance:** alertado pero sin línea de visión (o fuera de rango de ataque). Navega con A* de 4
  direcciones hacia la posición del jugador y se mueve con colisión deslizante; recalcula la ruta
  periódicamente y al chocar.
- **Attack:** alertado, con línea de visión y dentro de rango. Gira la torreta/casco con velocidad
  limitada hacia el jugador, espera el tiempo de reacción y dispara con dispersión cuando está
  encarado y ha recargado; después vuelve a recargar.
- **Alerta:** se despiertan al ver al jugador (LOS + rango) o al oír un disparo del jugador a menos
  de **60 m** (`alertEnemiesNear`); un enemigo alertado ya no vuelve a idle mientras el jugador viva.
- **Muerte:** deja de simularse y de dibujarse; la puntuación/progreso llega en las fases 8-9.

Reglas de justicia y comportamiento:

- **Línea de visión por muestreo de la rejilla:** no disparan a través de coberturas intactas; los
  escombros no bloquean.
- **Sin *aimbot*:** el cañón gira con velocidad limitada, hay tiempo de reacción y el disparo lleva
  dispersión; acertar no está garantizado.
- **Escalado por misión:** precisión, reacción, daño y composición de enemigos (fase 9); los valores
  base de la IA viven en `AI_TUNING` (`src/config/balance.ts`) y se ajustarán allí.
- **Sin coordinación avanzada:** no hay flanqueo coordinado, reposición táctica ni uso inteligente de
  coberturas; solo A* básico y colisión. Es deuda planificada, no un fallo.
- **Daño mutuo con blindaje:** el daño base se reduce según `armor` del tanque (jugador y enemigos);
  el Panzer III cae en 3 impactos y el Tiger I en 4 con el cañón del Sherman.

## 9. Misiones y dificultad

Campaña de 3 misiones generadas con parámetros escalados, definidos como datos en
`src/config/missions.ts`:

| Misión | Nombre | Enemigos | Densidad coberturas | Precisión IA | Reacción | Daño enemigo |
|---|---|---|---|---|---|---|
| 1 | Avance por el valle | 3 ligeros | 12 % | 25 % | 1,4 s | ×0,8 |
| 2 | Cruce de caminos | 4 ligeros + 1 pesado | 16 % | 35 % | 1,1 s | ×1,0 |
| 3 | Última línea | 4 ligeros + 2 pesados | 20 % | 45 % | 0,9 s | ×1,2 |

- **Arena:** 64–96 m de lado (rejilla de 16×16 a 24×24 celdas de 4 m); la generación actual usa
  20×20 (80 m) por defecto.
- **Reparto provisional:** en la fase 6 `game.ts` reparte Panzer III y Tiger I de forma provisional;
  la composición exacta por misión llega con estos datos en la fase 9.
- **Semilla:** cada misión usa una semilla visible en el briefing; la misma semilla reproduce el
  mismo escenario (útil para depurar y para repetir una partida).
- **Progreso:** porcentaje de enemigos destruidos. No se muestra el número restante.
- **Victoria:** todos los enemigos destruidos. **Derrota:** vida a 0.
- **Resumen:** puntos, precisión, tiempo y daño recibido; récord persistente.
- **Progresión:** desbloqueo de misión y récord en `localStorage`; reintento desde el principio de
  la misión actual. Sin guardado a mitad de partida.
- **Añadir una misión** es añadir una entrada de datos y su test de contrato, no tocar sistemas
  (procedimiento en [`DEVELOPMENT.md`](DEVELOPMENT.md#añadir-una-misión)).

La dificultad crece por cuatro vías a la vez: más enemigos, mezcla más pesada, más coberturas (más
oclusión y pasillos) y una IA más precisa, rápida y letal.

## 10. Puntuación y progresión

| Acción | Puntos |
|---|---|
| Destruir un Panzer III | 100 |
| Destruir un Tiger I | 250 |
| Completar una misión | +500 |
| Vida restante al terminar | Bonificación (fórmula pendiente) |

- El récord y la misión máxima desbloqueada se guardan en `localStorage`; no hay tabla de
  clasificación en red.
- Al morir se pierden los puntos de la partida en curso, pero **no** el récord ya guardado.
- El resumen de misión muestra puntos, precisión (impactos/disparos), tiempo y daño recibido; el
  récord visible en pausa y resúmenes.
- La puntuación se calcula en un sistema puro, separado del HUD y del render.

## 11. Audio

Todo el sonido se **sintetiza con WebAudio**; no hay ficheros de audio ni música en 0.1.0.

| Fuente | Comportamiento |
|---|---|
| Motor | Oscilador con filtro; el pitch sube con la velocidad del tanque. |
| Cañonazo | Golpe corto y potente al disparar; sincronizado con el retroceso de cámara. |
| Impacto/explosión | Distinto para impacto en cobertura, impacto recibido y destrucción de enemigo. |
| Recarga | Sonido de arma lista al completar la recarga. |
| Pickup | Confirmación al recoger cura, mejora o potencia. |
| UI | Clics de menú, pausa y avisos. |
| Ambiente | Viento filtrado de fondo. |

- El `AudioContext` se desbloquea en el primer input del usuario (política de los navegadores).
- `M` silencia y vuelve a activar; el volumen maestro se ajusta en la pausa.
- Si WebAudio no está disponible, el juego funciona en silencio (degradación silenciosa).
- Módulo aislado tras una interfaz de audio sustituible por un doble en tests.

## 12. Pendientes de diseño para el Lead

- **Impactos y balance (resuelto):** con los valores actuales de `src/config/tanks.ts` el Sherman
  hace **3 impactos al Panzer III** (100 PV) y **4 al Tiger I** (140 PV y 10 % de blindaje), que es
  lo que fija el plan. Cualquier ajuste de balance se hace en `tanks.ts` y se refleja aquí.
- **Fórmula de la bonificación por vida restante:** no definida; proponer una lineal sobre la vida
  máxima del jugador (definida en `src/config/tanks.ts`) y fijarla en `config/balance.ts`.
- **Combinación de reducciones de daño:** reducción base del Sherman (10 %) + mejoras (−10 % ×3);
  falta decidir si son aditivas o multiplicativas y si hay tope.
- **Cadencia escalada por misión:** el plan la menciona, pero la tabla de misiones no tiene
  parámetro; decidir si se añade columna/dato o se deja fuera de 0.1.0.
- **Significado exacto de «densidad de coberturas»:** supuesto de trabajo, porcentaje de celdas
  interiores ocupadas por cobertura; la generación actual usa 14 % por defecto en `balance.ts` y la
  misión lo ajustará; confirmar la interpretación.
- **Precisión IA (actualizada):** la IA usa tolerancia de apuntado, tiempo de reacción y
  dispersión (`AI_TUNING`), no una probabilidad de acierto; la tabla de misiones traducirá su
  «precisión %» a estos parámetros en la fase 9.
- **Pickup de cura con vida al máximo:** no está definido si se puede recoger (y se desperdicia) o
  si se ignora; supuesto: se puede recoger y no supera el máximo.
- **Potencia con efecto activo:** supuesto, al recoger otra se renueva el temporizador de 20 s, no se
  acumula duración.
- **Escombros de cobertura destruida (resuelto):** altura por material en `materials.ts`
  (0,35–0,5 m); no bloquean visión, proyectiles ni el paso.
- **Derrota por salir del área jugable:** el plan la menciona, pero el borde es infranqueable; en la
  práctica solo se pierde por vida a 0. Confirmar si se elimina la mención o se implementa un
  mecanismo de fuera de límites (poco probable en 0.1.0).
- **Claves de `localStorage`:** sin fijar; decisión de la fase 9.
- **Reposición y coordinación de la IA:** la máquina actual es `idle/advance/attack`; el estado de
  reposición y el flanqueo del plan quedan como deuda posterior (no bloquean 0.1.0).
- **Sacudida de cámara al recibir daño:** hoy se usa tinte rojo; la sacudida queda como deuda de
  feedback.
- **Balance definitivo:** ajuste de dificultad previsto para la fase 9 sobre los valores de
  `tanks.ts` y `AI_TUNING`.

## 13. Balance de tanques (Segunda Guerra Mundial)

**La fuente de verdad es `src/config/tanks.ts`.** Allí viven PV, velocidad, giro, recarga, daño,
blindaje, velocidad de proyectil y colores de cada carro; este documento resume los criterios y los
impactos, no sustituye al fichero. Los daños enemigos son **base**: el multiplicador de misión
(×0,8 / ×1,0 / ×1,2) se aplicará encima (fase 9).

| Unidad | Bando | Rol de diseño |
|---|---|---|
| M4 Sherman (jugador) | Aliado | Equilibrado y ágil; mejor cadencia y blindaje moderado. |
| Panzer III (ligero) | Eje | Rápido y numeroso; presiona y obliga a moverse. |
| Tiger I (pesado) | Eje | Lento, duro y con blindaje; poca cadencia y mucho daño. |

Balance actual de referencia (leer siempre `tanks.ts` antes de ajustar):

- Panzer III: **100 PV**, daño 10, recarga 3 s. Con el Sherman (40 de daño) cae en **3 impactos**,
  como fija el plan.
- Tiger I: **140 PV**, blindaje 10 %, daño 20, recarga 4 s. Con el blindaje, el Sherman necesita
  **4 impactos**.
- El blindaje se aplica como reducción de daño recibido: `daño × (1 − armor)`.

Criterios de diseño:

- El Sherman gana por movilidad, cadencia e información (radar), no por vida ni daño bruto.
- El Panzer III muere rápido pero presiona; el Tiger I obliga a usar coberturas y flanqueo.
- El objetivo es una partida de 2–5 minutos por misión, ajustada con simulación headless.
- Todos los valores son datos: ningún sistema codifica números de balance.

## 14. Fuera de alcance de 0.1.0

No se implementa en esta entrega (deuda planificada, no olvido):

- Multijugador, móvil/táctil, gamepad o mando analógico.
- Modelos o texturas importados, animaciones esqueléticas, música.
- Editor de escenarios, mapas manuales, más de 3 misiones o campaña larga.
- Guardado a mitad de partida, tabla de clasificación en red, localización a otros idiomas.
- Efectos avanzados: sombras dinámicas, partículas GPU, post-proceso.
- Pathfinding táctico avanzado (flanqueo coordinado, uso inteligente de coberturas) más allá de A*
  básico.
- Vista libre, torreta independiente o apuntado con ratón.

Supuestos de alcance: una sola facción jugable (aliada), 3 misiones, título provisional y
navegadores modernos de escritorio.
