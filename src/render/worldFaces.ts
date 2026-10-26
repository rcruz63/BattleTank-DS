/**
 * Construcción de caras del mundo (coberturas) para el painter.
 *
 * Culling por distancia, backface culling, recorte de plano cercano, sombreado plano por normal y
 * niebla. Las coberturas intactas emiten sus caras; las destruidas, solo escombros bajos.
 */

import { clamp, dot3, normalize3, scale3 } from '../core/math';
import type { Vec3 } from '../core/math';
import { RENDER_DEFAULTS } from '../config/balance';
import { MATERIALS } from '../config/materials';
import { PALETTE } from '../config/palette';
import { isBlocked } from '../world/grid';
import type { CellObstacle, WorldGrid } from '../world/types';
import { createCameraFrame, projectCameraPoint, worldToCamera } from './camera';
import type { CameraFrame } from './camera';
import { clipPolygonNearPlane } from './clip';
import { mixHexColors, shadeHexColor } from './color';
import type { PerspectiveCamera, RenderFace, ScreenPoint, Viewport } from './types';

interface WorldFace {
  readonly points: readonly Vec3[];
  readonly normal: Vec3;
  readonly color: string;
}

interface CellBounds {
  readonly x0: number;
  readonly x1: number;
  readonly z0: number;
  readonly z1: number;
}

interface SideDefinition {
  readonly dx: number;
  readonly dz: number;
  readonly normal: Vec3;
  readonly corners: (bounds: CellBounds, height: number) => Vec3[];
}

const SIDE_DEFINITIONS: readonly SideDefinition[] = [
  {
    dx: 0,
    dz: -1,
    normal: { x: 0, y: 0, z: -1 },
    corners: (b, h) => [
      { x: b.x0, y: 0, z: b.z0 },
      { x: b.x1, y: 0, z: b.z0 },
      { x: b.x1, y: h, z: b.z0 },
      { x: b.x0, y: h, z: b.z0 },
    ],
  },
  {
    dx: 0,
    dz: 1,
    normal: { x: 0, y: 0, z: 1 },
    corners: (b, h) => [
      { x: b.x1, y: 0, z: b.z1 },
      { x: b.x0, y: 0, z: b.z1 },
      { x: b.x0, y: h, z: b.z1 },
      { x: b.x1, y: h, z: b.z1 },
    ],
  },
  {
    dx: -1,
    dz: 0,
    normal: { x: -1, y: 0, z: 0 },
    corners: (b, h) => [
      { x: b.x0, y: 0, z: b.z0 },
      { x: b.x0, y: 0, z: b.z1 },
      { x: b.x0, y: h, z: b.z1 },
      { x: b.x0, y: h, z: b.z0 },
    ],
  },
  {
    dx: 1,
    dz: 0,
    normal: { x: 1, y: 0, z: 0 },
    corners: (b, h) => [
      { x: b.x1, y: 0, z: b.z1 },
      { x: b.x1, y: 0, z: b.z0 },
      { x: b.x1, y: h, z: b.z0 },
      { x: b.x1, y: h, z: b.z1 },
    ],
  },
];

export interface WorldFacesOptions {
  readonly grid: WorldGrid;
  readonly camera: PerspectiveCamera;
  readonly viewport: Viewport;
  readonly maxDrawDistance?: number;
  readonly fogStart?: number;
  readonly fogEnd?: number;
  readonly fogColor?: string;
  readonly lightDirection?: Vec3;
}

interface ProjectionSettings {
  readonly frame: CameraFrame;
  readonly fogStart: number;
  readonly fogEnd: number;
  readonly fogColor: string;
  readonly lightDirection: Vec3;
}

function cellBounds(grid: WorldGrid, x: number, z: number): CellBounds {
  const x0 = x * grid.cellSize;
  const z0 = z * grid.cellSize;
  return { x0, x1: x0 + grid.cellSize, z0, z1: z0 + grid.cellSize };
}

function topFace(bounds: CellBounds, height: number, color: string): WorldFace {
  return {
    normal: { x: 0, y: 1, z: 0 },
    color,
    points: [
      { x: bounds.x0, y: height, z: bounds.z0 },
      { x: bounds.x1, y: height, z: bounds.z0 },
      { x: bounds.x1, y: height, z: bounds.z1 },
      { x: bounds.x0, y: height, z: bounds.z1 },
    ],
  };
}

function sideFace(
  definition: SideDefinition,
  bounds: CellBounds,
  height: number,
  color: string,
): WorldFace {
  return { points: definition.corners(bounds, height), normal: definition.normal, color };
}

interface WallFacesOptions {
  readonly grid: WorldGrid;
  readonly x: number;
  readonly z: number;
  readonly height: number;
  readonly color: string;
}

/** Caras exteriores de una cobertura intacta; se omiten las que tocan otra cobertura intacta. */
function wallFaces(options: WallFacesOptions): WorldFace[] {
  const { grid, x, z, height, color } = options;
  const bounds = cellBounds(grid, x, z);
  return SIDE_DEFINITIONS.filter(
    (definition) => !isBlocked(grid, x + definition.dx, z + definition.dz),
  ).map((definition) => sideFace(definition, bounds, height, color));
}

/** Escombros bajos de una cobertura destruida: ya no ocultan la visión. */
interface RubbleFacesOptions {
  readonly grid: WorldGrid;
  readonly x: number;
  readonly z: number;
  readonly color: string;
  readonly height: number;
}

function rubbleFaces(options: RubbleFacesOptions): WorldFace[] {
  const { grid, x, z, color, height } = options;
  const bounds = cellBounds(grid, x, z);
  const sides = SIDE_DEFINITIONS.map((definition) =>
    sideFace(definition, bounds, height, color),
  );
  return [...sides, topFace(bounds, height, color)];
}

function obstacleFaces(
  grid: WorldGrid,
  x: number,
  z: number,
  obstacle: CellObstacle,
): WorldFace[] {
  const material = MATERIALS[obstacle.material];
  if (obstacle.health <= 0) {
    return rubbleFaces({
      grid,
      x,
      z,
      color: material.rubbleColor,
      height: material.rubbleHeight,
    });
  }
  return wallFaces({ grid, x, z, height: material.height, color: material.color });
}

function faceCenter(points: readonly Vec3[]): Vec3 {
  const sum = points.reduce<Vec3>(
    (total, point) => ({
      x: total.x + point.x,
      y: total.y + point.y,
      z: total.z + point.z,
    }),
    { x: 0, y: 0, z: 0 },
  );
  return scale3(sum, 1 / Math.max(1, points.length));
}

function projectFace(face: WorldFace, settings: ProjectionSettings): RenderFace | null {
  const { frame } = settings;
  const camera = frame.camera;
  const center = faceCenter(face.points);
  const toFace: Vec3 = {
    x: center.x - camera.position.x,
    y: center.y - camera.position.y,
    z: center.z - camera.position.z,
  };
  if (dot3(face.normal, toFace) >= 0) return null;

  const cameraPoints = face.points.map((point) =>
    worldToCamera(point, camera, frame.basis),
  );
  const clipped = clipPolygonNearPlane(cameraPoints, camera.near);
  if (clipped.length < 3) return null;

  const screenPoints: ScreenPoint[] = [];
  let depthSum = 0;
  for (const point of clipped) {
    const projected = projectCameraPoint(point, camera, frame.viewport, frame.focal);
    if (!projected) return null;
    screenPoints.push(projected);
    depthSum += point.z;
  }

  const depth = depthSum / clipped.length;
  const fog = clamp(
    (depth - settings.fogStart) / Math.max(1, settings.fogEnd - settings.fogStart),
    0,
    1,
  );
  const light = Math.max(0, dot3(face.normal, settings.lightDirection));
  const lit = shadeHexColor(face.color, 0.58 + 0.42 * light);
  return { points: screenPoints, depth, color: mixHexColors(lit, settings.fogColor, fog) };
}

function createProjectionSettings(options: WorldFacesOptions): ProjectionSettings {
  return {
    frame: createCameraFrame(options.camera, options.viewport),
    fogStart: options.fogStart ?? RENDER_DEFAULTS.fogStart,
    fogEnd: options.fogEnd ?? RENDER_DEFAULTS.fogEnd,
    fogColor: options.fogColor ?? PALETTE.niebla,
    lightDirection: normalize3(options.lightDirection ?? { x: 0.35, y: 0.85, z: 0.25 }),
  };
}

function collectWorldFaces(
  grid: WorldGrid,
  camera: PerspectiveCamera,
  maxDrawDistance: number,
): WorldFace[] {
  const worldFaces: WorldFace[] = [];
  for (let index = 0; index < grid.obstacles.length; index += 1) {
    const obstacle = grid.obstacles[index];
    if (!obstacle) continue;
    const x = index % grid.width;
    const z = Math.floor(index / grid.width);
    const cellX = (x + 0.5) * grid.cellSize;
    const cellZ = (z + 0.5) * grid.cellSize;
    const distance = Math.hypot(cellX - camera.position.x, cellZ - camera.position.z);
    if (distance > maxDrawDistance + grid.cellSize) continue;
    worldFaces.push(...obstacleFaces(grid, x, z, obstacle));
  }
  return worldFaces;
}

function projectWorldFaces(
  worldFaces: readonly WorldFace[],
  settings: ProjectionSettings,
): RenderFace[] {
  const projected: RenderFace[] = [];
  for (const face of worldFaces) {
    const rendered = projectFace(face, settings);
    if (rendered) projected.push(rendered);
  }
  return projected;
}

/** Caras visibles del mundo, listas para el painter (sin ordenar). */
export function buildWorldFaces(options: WorldFacesOptions): RenderFace[] {
  const maxDrawDistance = options.maxDrawDistance ?? RENDER_DEFAULTS.maxDrawDistance;
  const worldFaces = collectWorldFaces(options.grid, options.camera, maxDrawDistance);
  return projectWorldFaces(worldFaces, createProjectionSettings(options));
}
