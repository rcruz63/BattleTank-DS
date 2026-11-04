# Diseño de juego — BattleTank-DS

Documento de diseño del vertical slice **0.1.0**. Se deriva del plan aprobado
([`PLAN.md`](PLAN.md), fuente de verdad del alcance); si hay conflicto, manda el plan y se corrige
este documento. Estado: fases 0–10 y los bloques 6.5 (puntería con ratón), 6.6 (colisión entre
tanques), 7.5 (blindaje direccional) y el ajuste 7.5.1 (claridad/feedback) cerrados y la entrega
`0.1.0` preparada. Los bloques A (claridad de combate y onboarding) y A.1 (selector de misión y
aparición justa de enemigos) del pulido post-entrega están cerrados el 2026-11-04; el siguiente
trabajo es el bloque B (sensación y legibilidad). El detalle vivo está en [`STATUS.md`](STATUS.md).

**Balance de tanques:** los números concretos (PV, velocidad, giro, recarga, daño, blindaje y
velocidad de proyectil) viven en **`src/config/tanks.ts`**, que es la fuente de verdad. Este
documento describe roles y criterios de diseño; el ajuste fino de dificultad se hace en la fase 11.

- **Título provisional:** BATTLE TANK — PERISCOPIO.
- **Ambientación:** frente occidental, 1944. Jugador aliado con un M4 Sherman contra carros del Eje.
- **Cámara:** primera persona tipo periscopio, sin vista libre; casco y cámara solidarios, y el cañón
  apunta con el ratón dentro de un cono.
- **Formato:** partidas cortas de acción, campaña de 3 misiones encadenadas.
- **Plataforma:** navegador de escritorio, teclado, sin assets externos.

## 1. Concepto

El jugador está **dentro** del tanque y solo ve el sector al que apunta la mira. No hay mapa
completo ni vista en tercera persona: la información llega por el periscopio, el radar circular y la
barra de progreso. El escenario se genera en cada partida con coberturas que bloquean la visión y que,
en parte, son destruibles. Los enemigos permanecen al acecho hasta ver u oír al jugador; desde ahí
buscan línea de visión y disparan obedeciendo las mismas reglas de oclusión que el jugador.

La tensión nace de la **asimetría de información**: no sabes qué hay detrás de una cobertura hasta
que la flanqueas o la destruyes, pero el radar te avisa de que hay algo. Avanzar a ciegas, abrir una
línea de tiro a cañonazos y administrar la recarga son las decisiones del bucle.

### Pilares

1. **Ver poco, decidir mucho.** El periscopio limita el campo de visión y la cobertura oculta el
   escenario; la información táctica (radar, progreso, avisos) se da sin desvelar el mapa.
2. **La cobertura es el juego.** Bloquea vista y proyectiles, y las destructibles cambian el mapa:
   abrir una línea de tiro es una decisión ofensiva.
3. **Combate legible y justo.** Enemigos con línea de visión real, sin _aimbots_; feedback claro de
   impacto, recarga, daño y destrucción.
4. **Campaña corta con progresión.** Tres misiones que escalan en enemigos, densidad, precisión y
   agresividad, con récord y desbloqueo persistentes.

## 2. Bucle de juego

Bucle de una partida:

1. **Briefing** de misión (DOM): nombre, texto, objetivo, controles, pista de blindaje, selector de misión (1/2/3) y semilla; `ENTER` para desplegar.
2. El jugador **avanza** por el escenario generado sin mapa completo: periscopio, radar y barra de
   progreso (solo porcentaje, nunca número de enemigos restantes).
3. **Combate:** los enemigos acechan hasta detectar al jugador, toman línea de visión y disparan. Las
   coberturas bloquean visión y proyectiles; las destructibles se derriban a cañonazos y abren nuevas
   líneas de tiro. El blindaje premia maniobrar: el frontal reduce el daño a la mitad, el lateral es
   neutro y la espalda es vulnerable (bloque 7.5).
4. **Gestión de recursos:** recoger botiquín, mejora y potencia; administrar la recarga y el daño
   recibido.
5. Al destruir a todos los enemigos, **victoria de misión**: resumen de puntos, precisión, tiempo y
   daño recibido; `ENTER` pasa al briefing de la siguiente misión.
6. Al morir, **derrota**: resumen y `ENTER` reintenta desde el principio de la misión actual. Se
   conservan récord y misión desbloqueada; la puntuación de la partida se reinicia.

**Victoria:** 100 % de progreso (todos los enemigos del escenario destruidos).
**Derrota:** vida a 0. El plan cita también «salir del área jugable», pero el escenario está cerrado
por coberturas indestructibles, así que en la práctica solo se pierde por daño; ver
[§12](#12-pendientes-de-diseño-para-el-lead).

**Campaña:** 3 misiones encadenadas. Al terminar la tercera se muestra el resumen final de campaña.
La partida arranca en el briefing de la misión desbloqueada más alta (no hay menú inicial), con el
récord visible en los resúmenes y un selector de misión 1/2/3 entre las desbloqueadas. No hay
guardado a mitad de partida.

## 3. Controles

| Acción              | Entrada                    | Estado                                                                                                                                                 |
| ------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Avanzar             | `W` o `↑`                  | **Disponible.** Inercia ligera; el tanque avanza en la dirección de su rumbo.                                                                          |
| Retroceder          | `S` o `↓`                  | **Disponible.** Marcha atrás con el mismo control.                                                                                                     |
| Girar               | `A`/`D` o `←`/`→`          | **Disponible.** Gira el casco y con él la vista; no hay torreta independiente.                                                                         |
| Apuntar             | Ratón                      | **Disponible (bloque 6.5).** Mueve el cañón dentro de ±15° horizontal y ±4° vertical respecto al rumbo del tanque. **La cámara no gira con el ratón.** |
| Disparar            | `Espacio` o clic izquierdo | **Disponible.** Un disparo por pulsación; mantener no repite. Recarga de 2,4 s.                                                                        |
| Pausa               | `Esc`                      | **Disponible.** Congela la simulación y muestra la pantalla de pausa con controles y semilla.                                                          |
| Confirmar pantallas | `Enter`                    | **Disponible.** Avanza el briefing, el resumen de misión o el reintento.                                                                               |
| Cambiar de misión   | `1` / `2` / `3` (briefing) | **Disponible.** Cambia el briefing entre las misiones desbloqueadas; no borra récord ni desbloqueo.                                                    |
| Silenciar           | `M`                        | **Disponible.** Alterna mute; el estado se ve en el HUD y en pausa.                                                                                    |
| Volumen             | `−` / `+`                  | **Disponible.** Ajusta el volumen maestro; se muestra en el HUD/pausa.                                                                                 |
| Depuración          | `F3`                       | Previsto (fase 11): overlay con fps, caras, celdas visibles y entidades.                                                                               |

No hay free-look ni apuntado fuera del cono, ni torreta independiente, ni strafe, ni gamepad, ni
controles táctiles en 0.1.0. El cursor del sistema se oculta sobre el canvas. El arranque muestra el
briefing DOM con nombre, texto, objetivo y semilla; el HUD DOM cubre vida, avance, puntos, recarga,
efectos, audio y radar. **El arco de fuego enemigo replica este límite de ±15°** (bloque 7.5): si el
jugador no puede disparar de lado, ellos tampoco.

## 4. HUD y capas

### Elementos

- **Vida:** barra + valor numérico, arriba a la izquierda. Cambia de color según el porcentaje.
- **Viñeta de daño:** con la vida por debajo del 40 % aparece un tinte rojo sutil en los bordes
  (`#hud-damage-vignette`) que se intensifica al bajar la vida y desaparece al curarse; refuerza la
  lectura sin depender solo del color de la barra.
- **Avance del escenario:** barra superior centrada, solo porcentaje; sube al destruir enemigos y
  nunca muestra cuántos quedan.
- **Puntuación:** marcador arriba a la derecha; en pausa se muestra la semilla y los controles. El
  récord se ve en los resúmenes de victoria y fin de campaña, y la misión desbloqueada se persiste.
- **Radar:** circular, abajo a la derecha, centrado en el tanque y orientado con el rumbo; alcance
  45 m, barrido animado. Enemigos como triángulos rojos, pickups como rombos verdes y coberturas
  como trazos tenues. No muestra el detalle del mapa.
- **Recarga:** anillo de progreso alrededor de la retícula del cañón + segundos restantes («1,4 s»)
  mientras recarga; un destello indica que el arma está lista.
- **Efectos temporales:** iconos de potencia y de mejora activa con cuenta atrás.
- **Avisos de estado:** toast DOM breve con el efecto del pickup recogido («+30 PV», «Mejora ×2»,
  «Potencia 20 s»); los resultados de misión usan pantallas completas.
- **Zona de impacto:** aviso de daño flotante «FRONTAL / LATERAL / TRASERA» sobre el enemigo,
  ligado al blindaje direccional implementado.
- **Recarga enemiga:** barra fina bajo la barra de vida del enemigo visible mientras recarga; hace
  legible la ventana de flanqueo (bloque A post-0.1.0).
- **Daño recibido:** arco rojo direccional en el borde de la pantalla hacia el origen del impacto,
  junto al tinte y la viñeta; el cañonazo enemigo se oye con un timbre propio (bloque A).
- **Rumbo:** marca tenue del casco en el periscopio y radar orientado con el rumbo; una brújula
  dedicada no entra en 0.1.0.
- **Pantallas:** briefing, pausa, victoria, derrota y fin de campaña implementadas; no hay menú
  inicial completo, pero el briefing incluye un selector de misión 1/2/3 entre las desbloqueadas.

Estado actual (fases 8–11): el **HUD DOM** muestra arriba a la izquierda «M4 SHERMAN», barra y valor
de vida y recarga («LISTO» o segundos); arriba al centro, la misión y «AVANCE DE SECTOR» con
porcentaje; arriba a la derecha, puntuación y estado de audio; abajo a la derecha, radar circular de
45 m orientado con el rumbo (coberturas tenues, enemigos rojos y pickups verdes). Con vida baja se
activa la **viñeta roja de daño**. Los efectos de mejora/potencia aparecen bajo la vida y los avisos
de pickup usan un toast DOM (oculto mientras la partida está en pausa). `ESC` abre la pausa (congela
simulación). En el mundo se mantienen las **barras de vida con nombre**, el **daño flotante con
zona**, el **destello** de impacto y el **fogonazo del cañón enemigo**; el periscopio mantiene
retícula móvil, rumbo, anillo de recarga y marca de impacto. Pantallas DOM de briefing, victoria,
derrota y campaña completada; `ENTER` confirma y `ESC` pausa. El récord se muestra en los resúmenes y
la misión desbloqueada se persiste.

### Esquema ASCII (conceptual)

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ VIDA ██████████░░░░ 78/100        AVANCE [██████░░░░] 42 %     PUNTOS 1 250   │
│                                                                              │
│                                                                              │
│                          ╭─────────────────────╮                             │
│                          │    retícula ⊕       │   ← anillo de recarga       │
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

Las posiciones son orientativas: la retícula se mueve con el ratón y la composición exacta se ajustó
al implementar el HUD (fase 8). Los textos usan coma
decimal (español) y **no deben depender solo del color**: los estados llevan icono o forma.

### Capas de pantalla

1. Canvas 3D (1280×720 interno, escalado con letterboxing).
2. Overlay de periscopio (máscara, retícula móvil, casco y marcas; sin cañón dibujado). Se pinta en
   el canvas (`render/periscope.ts`) y encima van la **viñeta de periscopio** y la **viñeta de daño**
   en CSS (`#game-frame::after` y `#hud-damage-vignette` en `ui/styles.css`), bajo el HUD.
3. HUD en DOM/CSS (vida, progreso, puntuación, recarga, avisos, iconos) — implementado (fase 8).
4. Radar en un canvas pequeño independiente — implementado (fase 8).
5. Overlays de briefing/pausa/resumen/fin de campaña encima de todo — implementados (fases 8–9).

## 5. Visión de periscopio y oclusión

- Cámara a **1,7 m** de altura sobre el tanque, **yaw = rumbo del tanque** (sin retardo lógico),
  **pitch base 0°** (el plan hablaba de ligeramente hacia abajo; se subió a 0 para que la retícula
  centrada sea un tiro horizontal) y FOV horizontal ≈ **72°**.
- La imagen se enmarca con una máscara oscura pintada en el canvas (máscara inferior de **96 px**
  desde la fase 11, antes 118) y una **viñeta CSS** (`#game-frame::after`); el overlay de periscopio
  (`render/periscope.ts`) va en canvas y la viñeta en CSS (fase 8). En el primer plano se dibuja el
  borde del casco (sin cañón, decisión del usuario del 2026-10-27).
- Retroceso de cámara al disparar (implementado): sube el pitch y la cámara retrocede unos
  centímetros durante un instante. Al recibir daño se tiñe la pantalla de rojo; la sacudida de cámara
  por impacto queda como deuda. Todos son efectos **visuales**: nunca cambian el rumbo lógico ni la
  simulación.
- **La cámara no se mueve con el ratón**: apuntar es exclusivo del cañón. El centro de la pantalla
  marca el rumbo del casco con una cruz tenue; la retícula del cañón se desplaza por el cono.
- No hay vista por encima de las coberturas ni asomarse: la cámara está por debajo de la altura
  mínima de cobertura. La oclusión es **total mientras la cobertura está intacta**.
- Las coberturas destruidas dejan escombros bajos: se ve (y se dispara) a través de ellas.
- Los enemigos usan la misma línea de visión: no disparan a través de coberturas intactas. La
  oclusión es una regla simétrica, no una ventaja artificial del jugador.

### Puntería del cañón (bloque 6.5)

- El puntero se mapea por ángulo con la focal de la cámara: la retícula sigue al cursor 1:1 hasta
  el límite de un cono de **±15° horizontal y ±4° vertical** respecto al rumbo del tanque
  (`AIM_LIMITS`) y se recorta después. La cámara y el casco no giran: solo apunta el cañón.
- La retícula y las marcas de distancia se dibujan en la proyección del ángulo de puntería, no en la
  posición bruta del cursor; el cursor del sistema se oculta sobre el canvas.
- **No se dibuja el cañón:** la retícula y sus marcas son la referencia de puntería (decisión del
  usuario, 2026-10-27). El disparo sigue saliendo de la boca del cañón real; el retroceso de cámara y
  el tracer del proyectil dan el feedback del disparo.
- El disparo usa la **dirección 3D** del cañón: el cabeceo influye de verdad. El proyectil sale del
  pivote de la torreta más el tubo.
- Como el proyectil es 3D, un tiro elevado puede pasar por encima de un tanque y perderse, y los
  tiros bajos impactan en el suelo (`kind: 'ground'`). Los muros intactos siguen bloqueando.
- No hay torreta independiente ni free-look: el casco, la cámara y el movimiento siguen siendo
  solidarios.

## 6. Coberturas y materiales

El escenario está cerrado por un borde de coberturas **indestructibles** (hormigón en la
implementación actual). En el interior se colocan grupos de coberturas (paseos
aleatorios/habitaciones) con una densidad que depende de la misión. Cada celda de 4 m es vacía o una
cobertura con material, altura y vida.

| Material | Destructible | Impactos para destruir | Altura | Notas                                        |
| -------- | ------------ | ---------------------- | ------ | -------------------------------------------- |
| Madera   | Sí           | 1                      | 2,4 m  | Cobertura ligera; abre línea de tiro rápido. |
| Ladrillo | Sí           | 3                      | 3,0 m  | Resistencia media; obliga a gastar recarga.  |
| Hormigón | No           | —                      | 3,2 m  | Bloqueo permanente.                          |
| Acero    | No           | —                      | 3,4 m  | Bloqueo permanente, visualmente más oscuro.  |

- «Impactos» se mide en disparos del cañón del jugador, no en puntos de vida genéricos. Los valores
  actuales y las alturas viven en **`src/config/materials.ts`** (fuente de verdad).
- Alturas de cobertura **2,4–3,4 m**, siempre por encima de la cámara (1,7 m): garantizan oclusión
  total mientras están intactas.
- Las coberturas bloquean movimiento, visión y proyectiles. Al destruirse dejan **escombros bajos**
  (0,35–0,5 m según material) que no taparán la visión ni detendrán los proyectiles; tampoco
  bloquean el paso (`isBlocked` exige vida > 0).
- La destrucción de una cobertura es irreversible en la partida.

## 7. Pickups

| Pickup           | Efecto                                                                    | Visual                  |
| ---------------- | ------------------------------------------------------------------------- | ----------------------- |
| Botiquín (cura)  | +30 PV, sin superar el máximo                                             | Cruz blanca sobre caja  |
| Mejora (upgrade) | +20 PV máximos y −10 % de daño recibido durante la misión (acumulable ×3) | Llave inglesa/chevrones |
| Potencia (power) | Durante 20 s: daño ×1,75 y recarga −35 %                                  | Rayo amarillo           |

- Aparecen en celdas libres **alcanzables**: 4 unidades en las misiones 1 y 2 y 5 en la 3, con los
  tres tipos garantizados por reparto determinista.
- Se recogen al pasar por encima: radio de 2 m.
- No reaparecen. Al morir se pierden todos los acumulados de la misión.
- El HUD muestra icono y cuenta atrás de los efectos temporales; el aviso de recogida es un toast DOM
  (`ui/hud.ts`).
- **Implementado en la fase 7:** datos y balance en `config/pickups.ts`, reglas en `systems/loot.ts`
  y modelo procedural en `render/pickupFaces.ts`.
- La mejora acumulable ×3 implica hasta −30 % extra de daño recibido; supuesto implementado:
  reducciones **multiplicativas** sobre el blindaje base (ver §12).
- La reducción de la mejora y el multiplicador de zona se combinan de forma multiplicativa:
  `daño × (1 − armor) × 0,9^mejoras × zona`, aplicado en `systems/damage.ts` (bloque 7.5).

## 8. Enemigos e IA

Dos tipos de carro del Eje, con apariencia de polígonos planos por tipo y colores de facción. Los
stats concretos están en **`src/config/tanks.ts`** (fuente de verdad) y el ajuste fino llega en la
fase 11.

| Enemigo    | Clase  | Rol                                         |
| ---------- | ------ | ------------------------------------------- |
| Panzer III | Ligero | Rápido y numeroso; presiona y flanquea.     |
| Tiger I    | Pesado | Lento, mucha vida y daño; ancla posiciones. |

**Máquina de estados actual:** `idle → advance → attack`; la muerte se representa con
`alive = false` (el estado «muerto» no es un modo de IA).

- **Idle (acecho):** sin alerta. No patrulla todavía ni tiene línea de visión; espera.
- **Advance:** alertado pero sin línea de visión (o fuera de rango de ataque). Navega con A* de 4
  direcciones hacia la posición del jugador y se mueve con colisión deslizante contra la rejilla y
  contra otros tanques; recalcula la ruta periódicamente y al chocar.
- **Attack:** alertado, con línea de visión y dentro de rango. Gira la torreta/casco con velocidad
  limitada hacia el jugador, espera el tiempo de reacción y dispara con dispersión cuando está
  encarado y ha recargado; después vuelve a recargar.
- **Alerta:** se despiertan al ver al jugador (LOS + rango) o al oír un disparo del jugador a menos
  de **60 m** (`alertEnemiesNear`); un enemigo alertado ya no vuelve a idle mientras el jugador viva.
- **Muerte:** deja de simularse y de dibujarse; la puntuación de campaña y el progreso están
  implementados (fases 8–9).

Reglas de justicia y comportamiento:

- **Línea de visión por muestreo de la rejilla:** no disparan a través de coberturas intactas; los
  escombros no bloquean.
- **Sin _aimbot_:** el cañón gira con velocidad limitada, hay tiempo de reacción y el disparo lleva
  dispersión; acertar no está garantizado.
- **Fogonazo:** al disparar, el cañón enemigo muestra un destello breve (5 caras en `render/models.ts`
  mientras `enemy.muzzleFlash` está activo) que ayuda a leer el disparo sin alterar la simulación.
- **Escalado por misión:** reacción, dispersión y daño enemigo definidos en `config/missions.ts`
  sobre los valores base de `AI_TUNING` (`src/config/balance.ts`); implementado en la fase 9.
- **Aparición justa (bloque A.1 post-0.1.0):** al empezar la misión, cada enemigo se coloca en una
  celda **sin línea de visión** sobre el jugador y a la distancia mínima de la misión; los carros
  pesados ocupan los spawns más lejanos. Así el primer contacto llega al avanzar o al delatarse el
  jugador, no con varios enemigos disparando desde el spawn. Si un mapa no ofrece suficientes celdas
  ocultas, la generación relaja la condición antes que fallar.
- **Sin coordinación avanzada:** no hay flanqueo coordinado, reposición táctica ni uso inteligente de
  coberturas; solo A* básico y colisión. Es deuda planificada, no un fallo.
- **Daño mutuo con blindaje:** el daño base se reduce según `armor` del tanque (jugador y enemigos);
  con el cañón del Sherman y el blindaje direccional ya implementado, el Panzer III cae en **5/3/2**
  impactos y el Tiger I en **8/4/3** (frontal/lateral/trasero).

### Blindaje direccional y flanqueo (aprobado 2026-10-27 · bloque 7.5)

**Motivación:** antes del bloque 7.5 la IA giraba el casco hacia el jugador y el combate era
siempre frontal; el jugador no puede disparar por los lados (cono del cañón) y los enemigos tampoco
deberían. El objetivo es que maniobrar tenga valor y que atacar por el flanco o la espalda sea la
forma eficiente de matar.

**Estado: implementado en el bloque 7.5** (`systems/armor.ts`, zona en el evento de impacto,
aplicación en `systems/damage.ts`, arco de fuego y pausa de recarga en `systems/ai.ts`).

- **Zonas de impacto:** se calculan con el ángulo entre el rumbo del blanco y la dirección desde la
  que llega el proyectil. Frontal ±60°, lateral 60–120°, trasera >120°.
- **Multiplicadores de daño** (después de `armor` y de las mejoras): frontal ×0,5, lateral ×1,0,
  trasera ×1,5. Simétrico para jugador y enemigos. Datos en `src/config/balance.ts`.
- **Arco de fuego:** el jugador ya está limitado por el cono de ±15°; los enemigos solo disparan si
  el jugador está dentro de ±15° de su rumbo. Para apuntar deben girar el casco a velocidad limitada.
- **Ventanas de flanqueo:** mientras recargan no corrigen el rumbo; el giro limitado y la pausa de
  seguimiento permiten al jugador ganar el lado o la espalda. A validar con simulación.
- **Legibilidad:** marcas de orientación en el modelo (frontal vs trasera) y daño flotante con zona
  sobre el enemigo, además de la barra de vida; el radar no muestra la zona, solo contactos y
  coberturas.
- **Balance de referencia:** Sherman vs Panzer III **5/3/2** y vs Tiger I **8/4/3** (frontal/lateral/
  trasera), con el balance fino en la fase 11 sobre simulación headless.
- **Pruebas (implementadas):** clasificación de zona pura, multiplicadores por zona, arco de fuego
  enemigo, IA que no dispara fuera del arco y no corrige rumbo al recargar, simetría jugador/enemigos
  y balance 5/3/2 y 8/4/3; el daño flotante con zona ya está implementado.

## 9. Misiones y dificultad

**Implementado en la fase 9:** cada misión tiene su propio escenario (20×20, 22×22 y 24×24),
reparto de enemigos (3 ligeros; 4 ligeros + 1 Tiger; 4 ligeros + 2 Tigers), densidad de coberturas y
tuning de IA (reacción, dispersión y daño). La campaña arranca en el briefing de la misión
desbloqueada más alta.

Campaña de 3 misiones generadas con parámetros escalados, definidos como datos en
`src/config/missions.ts`:

| Misión | Nombre              | Enemigos              | Densidad coberturas | Distancia mín. | Reacción | Dispersión | Daño enemigo |
| ------ | ------------------- | --------------------- | ------------------- | -------------- | -------- | ---------- | ------------ |
| 1      | Avance por el valle | 3 ligeros             | 12 %                | 20 m           | 1,4 s    | 0,07 rad   | ×0,8         |
| 2      | Cruce de caminos    | 4 ligeros + 1 pesado  | 16 %                | 24 m           | 1,1 s    | 0,05 rad   | ×1,0         |
| 3      | Última línea        | 4 ligeros + 2 pesados | 20 %                | 28 m           | 0,9 s    | 0,035 rad  | ×1,2         |

La «precisión» de la IA no es una probabilidad de acierto: se compone de `reactionSeconds`,
`fireSpreadRadians` y `damageMultiplier` en `config/missions.ts`.

- **Arena:** 20×20 (80 m), 22×22 (88 m) y 24×24 (96 m) celdas de 4 m, según misión.
- **Reparto por misión:** definido en `src/config/missions.ts`; el Tiger entra en la misión 2.
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

| Acción                    | Puntos             |
| ------------------------- | ------------------ |
| Destruir un Panzer III    | 100                |
| Destruir un Tiger I       | 250                |
| Completar una misión      | +500               |
| Vida restante al terminar | +2 por PV restante |

- El récord y la misión máxima desbloqueada se guardan en `localStorage` bajo
  `battletank-ds.progression.v1`; no hay tabla de clasificación en red. Si el almacenamiento falla,
  el juego continúa sin persistencia.
- Al morir se pierden los puntos de la partida en curso (la campaña se reinicia), pero **no** el
  récord ya guardado.
- El resumen de misión muestra puntos, precisión (impactos/disparos), tiempo y daño recibido; el
  récord visible en los resúmenes de victoria y fin de campaña.
- La puntuación se acumula en `game/simulation.ts` (por derribo, con `SCORE_REWARDS`) y el bonus de
  misión —`MISSION_BONUS` + 2 por PV restante— lo calcula `systems/mission.ts`; HUD y render solo leen
  el resultado.

## 11. Audio

**Implementado en la fase 10.** Todo el sonido se **sintetiza con WebAudio**; no hay ficheros
de audio ni música en 0.1.0.

| Fuente            | Comportamiento                                                                 |
| ----------------- | ------------------------------------------------------------------------------ |
| Motor             | Oscilador con filtro; el pitch sube con la velocidad del tanque.               |
| Cañonazo          | Golpe corto y potente al disparar; sincronizado con el retroceso de cámara.    |
| Impacto/explosión | Distinto para impacto en cobertura, impacto recibido y destrucción de enemigo. |
| Recarga           | Sonido de arma lista al completar la recarga.                                  |
| Pickup            | Confirmación al recoger cura, mejora o potencia.                               |
| UI                | Cambios de pantalla, pausa, mute/volumen y avisos.                             |
| Cañón enemigo     | Disparo más apagado y distante que el del jugador, para localizar el fuego.    |
| Ambiente          | Viento filtrado de fondo.                                                      |

- El `AudioContext` se desbloquea con el primer gesto del usuario (política de los navegadores).
- `M` silencia y vuelve a activar; `−`/`+` ajustan el volumen maestro (también en pausa, con el
  porcentaje visible).
- Si WebAudio no está disponible, el juego funciona en silencio (degradación silenciosa).
- Módulo aislado tras una interfaz de audio sustituible por un doble en tests.

## 12. Pendientes de diseño para el Lead

- **Impactos y balance (resuelto para el lateral):** con los valores actuales de
  `src/config/tanks.ts` el Sherman hace **3 impactos laterales al Panzer III** (100 PV) y **4
  laterales al Tiger I** (140 PV y 10 % de blindaje), que es lo que fija el plan. Con el blindaje
  direccional (bloque 7.5) el frontal y la espalda cambian: 5/2 y 8/3 respectivamente. Cualquier
  ajuste de balance se hace en `tanks.ts` y se refleja aquí.
- **Fórmula de la bonificación por vida restante (implementada):** lineal,
  `MISSION_BONUS` (500) + `HEALTH_BONUS_PER_POINT` (2) × PV restantes, en `config/missions.ts` y
  `missionBonus()` de `systems/mission.ts`.
- **Combinación de reducciones de daño:** supuesto implementado: multiplicativas
  (`(1 − armor) × 0,9^mejoras`) y la zona direccional se aplica después
  (`× (1 − armor) × 0,9^mejoras × zona`); falta confirmarlo y decidir si hay tope con las mejoras.
- **Ventana de flanqueo de la IA (resuelto, bloque 7.5):** la IA mantiene el heading y no corrige el
  apuntado mientras recarga, y solo dispara dentro de ±15°; validar en la fase 11 si resulta demasiado
  generosa.
- **Feedback de zona de impacto (resuelto en 7.5.1 para canvas):** el evento lleva `zone` y ya se
  muestra el daño flotante con zona, además de barra de vida y destello; el HUD DOM recoge vida,
  avance, puntuación, recarga, efectos y radar.
- **Cadencia escalada por misión (pendiente de decisión):** el plan la menciona, pero en 0.1.0 no hay
  parámetro de cadencia en `config/missions.ts`: la IA usa la recarga de su tanque (`tanks.ts`).
  Decidir si se añade dato o se deja fuera de 0.1.0.
- **Significado exacto de «densidad de coberturas»:** supuesto de trabajo, porcentaje de celdas
  interiores ocupadas por cobertura; las misiones usan 12 %, 16 % y 20 % (`config/missions.ts`) y
  `ARENA_DEFAULTS` conserva 14 % como valor de reserva; confirmar la interpretación.
- **Precisión IA (implementada):** la IA usa arco de fuego (±15°), pausa de seguimiento al recargar,
  tiempo de reacción y dispersión (`AI_TUNING`), no una probabilidad de acierto; la tabla de misiones
  ya la traduce a `reactionSeconds`, `fireSpreadRadians` y `damageMultiplier` en
  `config/missions.ts`.
- **Pickup de cura con vida al máximo:** supuesto implementado en la fase 7: se puede recoger y se
  desperdicia, sin superar el máximo.
- **Cura de la mejora:** supuesto implementado: al subir +20 la vida máxima también se curan 20 PV
  actuales (con tope en el nuevo máximo).
- **Mejora con el tope alcanzado:** supuesto implementado: la cuarta mejora se recoge y se
  desperdicia sin sumar acumulaciones.
- **Potencia con efecto activo:** supuesto implementado: al recoger otra se renueva el temporizador
  de 20 s, no se acumula duración.
- **Escombros de cobertura destruida (resuelto):** altura por material en `materials.ts`
  (0,35–0,5 m); no bloquean visión, proyectiles ni el paso.
- **Derrota por salir del área jugable:** el plan la menciona, pero el borde es infranqueable; en la
  práctica solo se pierde por vida a 0. Confirmar si se elimina la mención o se implementa un
  mecanismo de fuera de límites (poco probable en 0.1.0).
- **Clave de `localStorage` (fijada):** `battletank-ds.progression.v1`, con
  `{bestScore, unlockedMission}` en `systems/progression.ts`.
- **Reposición y coordinación de la IA:** la máquina actual es `idle/advance/attack`; el estado de
  reposición y la coordinación de flanqueo de la IA quedan como deuda posterior. El flanqueo **del
  jugador** sí entra en 0.1.0 con el bloque 7.5.
- **Sacudida de cámara al recibir daño:** hoy se usan el tinte rojo y la viñeta de vida baja; la
  sacudida de cámara queda como deuda de feedback.
- **Viñeta de vida baja (implementada, fase 11):** tinte rojo en los bordes con opacidad progresiva
  (0 al 40 % de vida, hasta 0,5 al 0 %); se calcula en `ui/hudView.ts` y se pinta en la capa CSS
  `#hud-damage-vignette`. No sustituye a la sacudida de cámara.
- **Balance definitivo:** ajuste de dificultad previsto para la fase 11 sobre los valores de
  `tanks.ts` y `AI_TUNING`.
- **Sensibilidad del ratón:** el mapeo es angular con la focal (la retícula sigue al cursor 1:1
  hasta el límite del cono); no hay curvas ni ajuste de sensibilidad. Si el QA lo pide, se convierte
  en opción de datos.
- **Feedback direccional de daño (implementado, bloque A post-0.1.0):** arco en el borde y cañonazo
  enemigo audible; la marca de impacto solo se muestra al acertar a un enemigo (`BUG-002`).
- **Zonas de blindaje (implementadas, bloque 7.5):** el cilindro de impacto de 2,2 m se mantiene; las
  zonas frontal/lateral/trasera aplican ×0,5/×1,0/×1,5. No hay zonas por oruga ni torreta, ni daño
  direccional dentro de una misma cara.
- **Alineación fina retícula-disparo:** comprobada con QA visual headless; si aparecen desajustes en
  resoluciones escaladas, revisar el mapeo canvas→píxeles en `bindMouseInput`.
- **PLAN §7.7 describía el cañón dibujado:** el periscopio ya no lo pinta (decisión del usuario,
  2026-10-27); `PLAN.md` se sincronizó el 2026-10-30 con autorización del usuario (retirada del
  cañón, fila 7.5.1 y cierre de las fases 8–10).

## 13. Balance de tanques (Segunda Guerra Mundial)

**La fuente de verdad es `src/config/tanks.ts`.** Allí viven PV, velocidad, giro, recarga, daño,
blindaje, velocidad de proyectil y colores de cada carro; este documento resume los criterios y los
impactos, no sustituye al fichero. Los daños enemigos son **base**: el multiplicador de misión
(×0,8 / ×1,0 / ×1,2) se aplica encima (`damageMultiplier` de `config/missions.ts`, fase 9).

| Unidad               | Bando  | Rol de diseño                                           |
| -------------------- | ------ | ------------------------------------------------------- |
| M4 Sherman (jugador) | Aliado | Equilibrado y ágil; mejor cadencia y blindaje moderado. |
| Panzer III (ligero)  | Eje    | Rápido y numeroso; presiona y obliga a moverse.         |
| Tiger I (pesado)     | Eje    | Lento, duro y con blindaje; poca cadencia y mucho daño. |

Balance actual de referencia (leer siempre `tanks.ts` antes de ajustar):

- Panzer III: **100 PV**, daño 10, recarga 3 s. Con el Sherman (40 de daño) cae en **3 impactos
  laterales**; con el blindaje direccional, en 5 frontales y 2 traseros.
- Tiger I: **140 PV**, blindaje 10 %, daño 20, recarga 4 s. Con el blindaje, el Sherman necesita
  **4 impactos laterales**; 8 frontales y 3 traseros con el blindaje direccional.
- El blindaje se aplica como reducción de daño recibido: `daño × (1 − armor)`.
- **Blindaje direccional (aprobado, bloque 7.5):** después de `armor` se aplica el multiplicador
  de zona; el daño final es `daño × multiplicadorZona × (1 − armor)`.

| Zona    | Ángulo desde el frente | Multiplicador | Impactos Sherman vs Panzer III | vs Tiger I |
| ------- | ---------------------- | ------------- | ------------------------------ | ---------- |
| Frontal | ±60°                   | ×0,5          | 5                              | 8          |
| Lateral | 60°–120°               | ×1,0          | 3                              | 4          |
| Trasera | >120°                  | ×1,5          | 2                              | 3          |

Umbrales y multiplicadores están en `src/config/balance.ts` (`ARMOR_ZONES`); los impactos son el
balance de referencia y el ajuste fino queda para la fase 11.

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
- Pathfinding táctico avanzado y **coordinación de flanqueo de la IA** más allá de A* básico. El
  flanqueo del jugador y el blindaje direccional sí entran y ya están implementados (bloque 7.5).
- Vista libre o torreta independiente. La puntería con ratón dentro del cono **sí** está incluida (bloque 6.5).

Supuestos de alcance: una sola facción jugable (aliada), 3 misiones, título provisional y
navegadores modernos de escritorio.
