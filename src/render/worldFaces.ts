/**
 * Caras de mundo de las coberturas.
 *
 * Las coberturas intactas emiten solo sus caras exteriores (se omiten las que tocan otra cobertura
 * intacta); las destruidas emiten unos escombros bajos que ya no ocultan la visión.
 */

import { RENDER_DEFAULTS } from '../config/balance';
import { MATERIALS } from '../config/materials';
import { isBlocked } from '../world/grid';
import type { CellObstacle, WorldGrid } from '../world/types';
import { projectWorldFaces } from './faces';
import type { ProjectionOptions, WorldFace } from './faces';
import type { PerspectiveCamera, RenderFace } from './types';

interface CellBounds {
  readonly x0: number;
  readonly x1: number;
  readonly z0: number;
  readonly z1: number;
}

interface SideDefinition {
  readonly dx: number;
  readonly dz: number;
  readonly normal: WorldFace['normal'];
  readonly corners: (bounds: CellBounds, height: number) => WorldFace['points'];
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

/** Caras de mundo de todas las coberturas dentro de la distancia de dibujado. */
export function buildWallWorldFaces(
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

export interface WorldFacesOptions extends ProjectionOptions {
  readonly grid: WorldGrid;
  readonly maxDrawDistance?: number;
}

/** Atajo: caras de coberturas ya proyectadas y listas para el painter. */
export function buildWorldFaces(options: WorldFacesOptions): RenderFace[] {
  const wallFaces = buildWallWorldFaces(
    options.grid,
    options.camera,
    options.maxDrawDistance ?? RENDER_DEFAULTS.maxDrawDistance,
  );
  return projectWorldFaces(wallFaces, options);
}
