/** Render del mundo y del periscopio; el HUD DOM se actualiza desde main.ts. */

import { COMBAT, VIEWPORT } from '../config/balance';
import { PALETTE } from '../config/palette';
import { playerForward } from '../entities/player';
import type { PlayerState } from '../entities/player';
import { overlayTint } from '../render/canvas';
import { drawCombatFeedback } from '../render/combatFeedback';
import { drawPeriscope } from '../render/periscope';
import { createPlayerCamera } from '../render/playerCamera';
import { renderWorld } from '../render/renderer';
import type { PerspectiveCamera } from '../render/types';
import { isWeaponReady, reloadProgress } from '../systems/combat';
import type { GameState } from './state';

function cameraWithRecoil(
  camera: PerspectiveCamera,
  player: PlayerState,
  recoil: number,
): PerspectiveCamera {
  if (recoil <= 0) return camera;
  const forward = playerForward(player);
  return {
    ...camera,
    pitch: camera.pitch + COMBAT.recoilKickRadians * recoil,
    position: {
      x: camera.position.x - forward.x * 0.1 * recoil,
      y: camera.position.y,
      z: camera.position.z - forward.z * 0.1 * recoil,
    },
  };
}

export function renderGame(state: GameState, context: CanvasRenderingContext2D): void {
  const session = state.session;
  const { player, arena, bullets, enemies, pickups, aim } = session;
  const { effects } = state;
  const camera = cameraWithRecoil(
    createPlayerCamera(player.position, player.yaw),
    player,
    effects.recoil,
  );

  renderWorld(context, { grid: arena.grid, camera, bullets, enemies, pickups });
  drawCombatFeedback(context, {
    camera,
    viewport: VIEWPORT,
    enemies,
    popups: session.damagePopups,
  });
  drawPeriscope(context, VIEWPORT, {
    reloadProgress: reloadProgress(player),
    reloadRemaining: player.reloadRemaining,
    ready: isWeaponReady(player),
    hitMarker: effects.hitMarker,
    aimScreenX: aim.screenX,
    aimScreenY: aim.screenY,
  });

  if (effects.damageFlash > 0) {
    overlayTint(context, PALETTE.destelloDano, 0.28 * effects.damageFlash);
  }
}
