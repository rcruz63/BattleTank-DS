/** Simulación de la partida: jugador, IA, combate, campaña y cambios de fase. */

import { SCORE_REWARDS, VIEWPORT } from '../config/balance';
import { clampVolume } from '../audio/audio';
import { MISSIONS } from '../config/missions';
import { PALETTE } from '../config/palette';
import { alertEnemiesNear, updateEnemies } from '../systems/ai';
import {
  buildProjectileTargets,
  updatePlayerWeapon,
  updateProjectiles,
} from '../systems/combat';
import type { ProjectileEvent } from '../systems/combat';
import { resolveProjectileHit } from '../systems/damage';
import { refreshEnemyVisibility, updateDamagePopups } from '../systems/feedback';
import type { InputSnapshot } from '../systems/input';
import {
  collectPickups,
  damageMultiplier,
  pickupEffectText,
  reloadMultiplier,
  updateLoot,
} from '../systems/loot';
import { missionBonus, nextMissionExists } from '../systems/mission';
import { updatePlayerMovement } from '../systems/movement';
import { recordVictory, saveProgression } from '../systems/progression';
import { resolveAim } from '../systems/aim';
import { createMissionSession } from './session';
import { createAiRng, createEffects, decayEffects } from './state';
import type { GameState } from './state';

const FIRE_ALERT_RADIUS = 60;

function collectLoot(state: GameState): void {
  const session = state.session;
  const collected = collectPickups(session.player, session.loot, session.pickups);
  const last = collected[collected.length - 1];
  if (!last) return;
  state.effects.pickupNotice = pickupEffectText(last.kind, session.loot);
  state.audio.play('pickup');
  state.effects.pickupColor =
    last.kind === 'health'
      ? PALETTE.pickupCura
      : last.kind === 'upgrade'
        ? PALETTE.pickupMejora
        : PALETTE.pickupPotencia;
  state.effects.pickupFlash = 1;
}

function awardKill(state: GameState, targetId: string): void {
  const enemy = state.session.enemies.find((item) => item.id === targetId);
  if (enemy) state.campaignScore += SCORE_REWARDS[enemy.type];
}

function applyImpact(state: GameState, impact: ProjectileEvent): boolean {
  const session = state.session;
  const result = resolveProjectileHit(impact, {
    player: session.player,
    enemies: session.enemies,
    loot: session.loot,
  });
  if (result.playerHit) {
    session.damageTaken += result.damage;
    state.audio.play('damage');
  }
  if (result.target === 'enemy' && result.damage > 0) {
    session.shotsHit += 1;
    state.audio.play(result.killed ? 'explosion' : 'impact');
    session.damagePopups.push({
      position: impact.position,
      amount: result.damage,
      zone: result.zone,
      killed: result.killed,
      age: 0,
    });
    if (result.killed && result.targetId) awardKill(state, result.targetId);
  }
  return result.playerHit;
}

function playCoverAudio(state: GameState, impacts: ProjectileEvent[]): void {
  if (impacts.some((impact) => impact.kind === 'cover' && impact.destroyedCover)) {
    state.audio.play('explosion');
    return;
  }
  if (impacts.some((impact) => impact.kind === 'cover')) state.audio.play('impact');
}

function resolveImpacts(state: GameState, impacts: ProjectileEvent[]): boolean {
  let playerHit = false;
  for (const impact of impacts) {
    if (applyImpact(state, impact)) playerHit = true;
  }
  playCoverAudio(state, impacts);
  if (impacts.some((impact) => impact.kind !== 'ground')) state.effects.hitMarker = 1;
  return playerHit;
}

function updatePlayerStep(state: GameState, snapshot: InputSnapshot, stepSeconds: number): void {
  const session = state.session;
  if (!session.player.alive) return;
  const wasReloading = session.player.reloadRemaining > 0;

  updatePlayerMovement({
    player: session.player,
    command: { forward: snapshot.forward, turn: snapshot.turn },
    stepSeconds,
    grid: session.arena.grid,
    enemies: session.enemies,
  });
  session.aim = resolveAim(session.player.yaw, VIEWPORT, {
    x: snapshot.aimX,
    y: snapshot.aimY,
  });

  const fired = updatePlayerWeapon({
    player: session.player,
    fireRequested: snapshot.fire,
    stepSeconds,
    bullets: session.bullets,
    direction: session.aim.direction,
    damageMultiplier: damageMultiplier(session.loot),
    reloadMultiplier: reloadMultiplier(session.loot),
  });
  if (fired) {
    session.shotsFired += 1;
    state.effects.recoil = 1;
    state.audio.play('fire');
    alertEnemiesNear(session.enemies, session.player.position, FIRE_ALERT_RADIUS);
  }
  if (wasReloading && session.player.reloadRemaining <= 0) state.audio.play('reload');
}

function updateEnemyStep(state: GameState, stepSeconds: number): void {
  const session = state.session;
  updateEnemies(session.enemies, {
    grid: session.arena.grid,
    player: session.player,
    stepSeconds,
    rng: state.aiRng,
    bullets: session.bullets,
    tuning: {
      reactionSeconds: session.mission.ai.reactionSeconds,
      fireSpreadRadians: session.mission.ai.fireSpreadRadians,
      damageMultiplier: session.mission.ai.damageMultiplier,
    },
  });
}

function advanceSimulation(
  state: GameState,
  snapshot: InputSnapshot,
  stepSeconds: number,
): void {
  const session = state.session;
  updatePlayerStep(state, snapshot, stepSeconds);
  updateLoot(session.loot, stepSeconds);
  collectLoot(state);
  updateEnemyStep(state, stepSeconds);

  const impacts = updateProjectiles({
    bullets: session.bullets,
    stepSeconds,
    grid: session.arena.grid,
    targets: buildProjectileTargets(session.player, session.enemies),
  });
  if (resolveImpacts(state, impacts)) state.effects.damageFlash = 1;

  refreshEnemyVisibility(session.arena.grid, session.player, session.enemies);
  updateDamagePopups(session.damagePopups, stepSeconds);
  decayEffects(state.effects, stepSeconds);
}

function startMission(state: GameState, missionIndex: number, phase: 'briefing' | 'playing'): void {
  state.session = createMissionSession(missionIndex, state.baseSeed);
  state.session.phase = phase;
  state.aiRng = createAiRng(state.session);
  state.effects = createEffects();
  state.paused = false;
}

function finishVictory(state: GameState): void {
  const session = state.session;
  state.campaignScore += missionBonus(session.player.health);
  state.progression = recordVictory(
    state.progression,
    session.missionIndex,
    state.campaignScore,
    MISSIONS.length - 1,
  );
  saveProgression(state.progression);
  session.phase = 'victory';
}

function advanceScreen(state: GameState): void {
  const session = state.session;
  switch (session.phase) {
    case 'briefing':
      session.phase = 'playing';
      return;
    case 'victory':
      if (nextMissionExists(session.missionIndex)) {
        startMission(state, session.missionIndex + 1, 'briefing');
      } else {
        session.phase = 'campaign-complete';
      }
      return;
    case 'defeat':
      state.campaignScore = 0;
      startMission(state, session.missionIndex, 'briefing');
      return;
    case 'campaign-complete':
      state.campaignScore = 0;
      startMission(state, 0, 'briefing');
      return;
    case 'playing':
      return;
  }
}

function evaluateMission(state: GameState): void {
  const session = state.session;
  if (!session.player.alive) {
    session.phase = 'defeat';
    return;
  }
  if (session.enemies.every((enemy) => !enemy.alive)) finishVictory(state);
}

/** Avanza la partida un paso de simulación o resuelve una pantalla de campaña. */
function applyAudioInput(state: GameState, snapshot: InputSnapshot): void {
  if (snapshot.mute) {
    state.audioMuted = !state.audioMuted;
    state.audio.setMuted(state.audioMuted);
    state.audio.play('ui');
  }
  if (snapshot.volumeDelta !== 0) {
    state.audioVolume = clampVolume(state.audioVolume + snapshot.volumeDelta * 0.1);
    state.audio.setVolume(state.audioVolume);
    state.audio.play('ui');
  }
}

export function stepCombat(state: GameState, stepSeconds: number): void {
  const snapshot = state.input.snapshot();
  const session = state.session;
  applyAudioInput(state, snapshot);

  if (session.phase !== 'playing') {
    state.audio.setEngine(0);
    if (snapshot.confirm) {
      state.audio.play('ui');
      advanceScreen(state);
    }
    return;
  }

  if (snapshot.pause) {
    state.paused = !state.paused;
    state.audio.play('ui');
  }
  if (state.paused) {
    state.audio.setEngine(0);
    return;
  }

  session.elapsedSeconds += stepSeconds;
  advanceSimulation(state, snapshot, stepSeconds);
  evaluateMission(state);
  state.audio.setEngine(session.player.alive && session.phase === 'playing' ? Math.abs(snapshot.forward) : 0);
}
