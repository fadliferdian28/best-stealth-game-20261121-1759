// Vision cones and line of sight. A guard sees the player only when the player is
// inside the cone, in range, and no tall wall or crate blocks the line between them.
// Cones are drawn as a fan of rays clipped by the same occluders, so what you see
// is exactly what the guard sees.
import { GUARD } from './config.js';
import { angleDiff } from './config.js';

const RAY_STEP = 6;
const CONE_RAYS = 26;

export function pointInRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

// Tall geometry blocks sight: walls and crates. Bushes, fences and lamps do not.
export function blocksSightAt(world, x, y) {
  for (const w of world.def.walls) if (w.tall !== false && pointInRect(x, y, w)) return true;
  for (const c of world.def.crates) if (pointInRect(x, y, c)) return true;
  return false;
}

export function lineOfSight(world, x1, y1, x2, y2) {
  const d = Math.hypot(x2 - x1, y2 - y1);
  const steps = Math.ceil(d / RAY_STEP);
  for (let i = 1; i < steps; i += 1) {
    const t = i / steps;
    if (blocksSightAt(world, x1 + (x2 - x1) * t, y1 + (y2 - y1) * t)) return false;
  }
  return true;
}

// Cast one ray from (x, y) along `angle` until it hits tall geometry or `range`.
export function castRay(world, x, y, angle, range) {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  let t = RAY_STEP;
  while (t < range) {
    const px = x + dx * t;
    const py = y + dy * t;
    if (blocksSightAt(world, px, py)) break;
    t += RAY_STEP;
  }
  return { x: x + dx * Math.min(t, range), y: y + dy * Math.min(t, range) };
}

// The visible cone as a polygon: origin plus the clipped ray endpoints.
export function conePolygon(world, x, y, angle, fov, range) {
  const pts = [{ x, y }];
  for (let i = 0; i <= CONE_RAYS; i += 1) {
    const a = angle - fov / 2 + (fov * i) / CONE_RAYS;
    pts.push(castRay(world, x, y, a, range));
  }
  return pts;
}

// Can this guard see the player right now? Returns { seen, distance }.
export function guardSeesPlayer(world, guard, player) {
  const dx = player.x - guard.x;
  const dy = player.y - guard.y;
  const distance = Math.hypot(dx, dy);
  const range = player.lit ? GUARD.range : GUARD.shadowRange;
  if (distance > range) return { seen: false, distance };
  const angleTo = Math.atan2(dy, dx);
  if (Math.abs(angleDiff(angleTo, guard.angle)) > GUARD.fov / 2) return { seen: false, distance };
  if (!lineOfSight(world, guard.x, guard.y, player.x, player.y)) return { seen: false, distance };
  // Hidden in scrub or a hide spot: invisible unless the guard is right on top of you.
  if (player.hidden && distance > GUARD.closeSpot) return { seen: false, distance };
  return { seen: true, distance };
}

export function cameraSeesPlayer(world, camera, player) {
  const dx = player.x - camera.x;
  const dy = player.y - camera.y;
  const distance = Math.hypot(dx, dy);
  if (distance > camera.range) return { seen: false, distance };
  const angleTo = Math.atan2(dy, dx);
  if (Math.abs(angleDiff(angleTo, camera.angle)) > camera.fov / 2) return { seen: false, distance };
  if (!lineOfSight(world, camera.x, camera.y, player.x, player.y)) return { seen: false, distance };
  if (player.hidden && distance > GUARD.closeSpot) return { seen: false, distance };
  return { seen: true, distance };
}
