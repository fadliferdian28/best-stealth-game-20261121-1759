// The world: builds a live level from a definition, holds every moving thing,
// and answers the physics questions — collision, cover, light — the other
// systems ask every frame.
import { PLAY, PLAYER, GUARD } from './config.js';
import { createBeam, pointInBeam } from './beam.js';
import { pointInRect } from './vision.js';

export function buildWorld(def, levelIndex) {
  const world = {
    def,
    levelIndex,
    time: 0,
    player: {
      x: def.playerStart.x, y: def.playerStart.y, r: PLAYER.radius,
      facing: -Math.PI / 2, moving: false, gait: 'walk',
      hidden: false, hiding: false, inBush: false, lit: false, inBeam: false,
      visibility: 0.35, stepTimer: 0, prevX: def.playerStart.x, prevY: def.playerStart.y,
    },
    guards: def.guards.map((g, i) => ({
      x: g.waypoints[0][0], y: g.waypoints[0][1], r: GUARD.radius,
      angle: Math.atan2(g.waypoints[1][1] - g.waypoints[0][1], g.waypoints[1][0] - g.waypoints[0][0]),
      waypoints: g.waypoints, wp: 1, pause: 0,
      state: 'patrol', suspicion: 0, lastKnown: null,
      investigate: null, lookTimer: 0, loseTimer: 0, searchTimer: 0,
      stepTimer: (i * 0.37) % 0.5, id: i,
    })),
    cameras: def.cameras.map((c) => ({ ...c, angle: c.baseAngle, suspicion: 0, phase: 0 })),
    lasers: def.lasers.map((l) => ({ ...l, cooldown: 0 })),
    loot: def.loot.map((p) => ({ ...p, taken: false })),
    coins: [], // thrown lures in flight
    rings: [], // expanding noise / search rings, visual only
    beam: createBeam(levelIndex, 490, 350),
    objectiveTaken: false,
    alarm: 0,
    noiseLevel: 0,
    spotted: 0,
    catches: 0,
    lures: PLAYER.lureCount,
    score: 0,
    lootCount: 0,
    caughtFlash: 0,
    levelComplete: false,
    levelFailed: false,
    winTimer: 0,
  };
  return world;
}

// Axis-separated circle-vs-rect movement: slide along walls instead of sticking.
export function moveCircle(world, entity, dx, dy) {
  const r = entity.r;
  const nx = entity.x + dx;
  if (!hitsSolid(world, nx, entity.y, r)) entity.x = nx;
  const ny = entity.y + dy;
  if (!hitsSolid(world, entity.x, ny, r)) entity.y = ny;
  entity.x = Math.max(PLAY.x + r, Math.min(PLAY.x + PLAY.w - r, entity.x));
  entity.y = Math.max(PLAY.y + r, Math.min(PLAY.y + PLAY.h - r, entity.y));
}

export function hitsSolid(world, x, y, r) {
  for (const w of world.def.walls) {
    if (circleHitsRect(x, y, r, w)) return true;
  }
  for (const c of world.def.crates) {
    if (circleHitsRect(x, y, r, c)) return true;
  }
  return false;
}

export function circleHitsRect(x, y, r, rect) {
  const cx = Math.max(rect.x, Math.min(x, rect.x + rect.w));
  const cy = Math.max(rect.y, Math.min(y, rect.y + rect.h));
  return (x - cx) * (x - cx) + (y - cy) * (y - cy) < r * r;
}

export function pointInBush(world, x, y) {
  return world.def.bushes.some((b) => Math.hypot(x - b.x, y - b.y) < b.r);
}
export function pointInLamp(world, x, y) {
  return world.def.lamps.some((l) => Math.hypot(x - l.x, y - l.y) < l.r);
}
export function hideSpotAt(world, x, y) {
  return world.def.hideSpots.find((s) => Math.hypot(x - s.x, y - s.y) < s.r + 14) || null;
}

// Recompute what the player looks like to a guard: hidden, lit, and the
// 0..1 visibility the HUD meter shows.
export function updateExposure(world) {
  const p = world.player;
  p.inBush = pointInBush(world, p.x, p.y);
  p.inBeam = pointInBeam(world.beam, p.x, p.y);
  const lampLit = pointInLamp(world, p.x, p.y);
  p.lit = lampLit || p.inBeam;
  p.hidden = p.hiding || p.inBush;
  if (p.hiding) p.visibility = 0.08;
  else if (p.inBush) p.visibility = 0.15;
  else if (p.inBeam) p.visibility = 1.0;
  else if (lampLit) p.visibility = 0.85;
  else p.visibility = 0.35;
  if (p.moving && p.gait === 'sprint' && !p.hidden) p.visibility = Math.max(p.visibility, 0.55);
}

export function resetGuardsToPatrol(world) {
  for (const g of world.guards) {
    g.x = g.waypoints[0][0];
    g.y = g.waypoints[0][1];
    g.wp = 1;
    g.angle = Math.atan2(g.waypoints[1][1] - g.waypoints[0][1], g.waypoints[1][0] - g.waypoints[0][0]);
    g.state = 'patrol';
    g.suspicion = 0;
    g.lastKnown = null;
    g.investigate = null;
    g.pause = 0;
  }
  for (const c of world.cameras) c.suspicion = 0;
  world.alarm = 0;
  world.coins = [];
}

export { pointInRect };
