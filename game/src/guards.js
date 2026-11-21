// Lampwarden AI: patrol waypoints, investigate odd sounds and half-seen shapes,
// chase a spotted salvager, search the last known spot, then calm down and go
// back to the route. Patrols are fixed and learnable; the chase gives you a
// chance to break line of sight and recover.
import { GUARD, DETECT } from './config.js';
import { moveCircle } from './world.js';
import { turnToward, dist, clamp } from './config.js';
import { updateGuardVision } from './detection.js';
import { playGuardStep } from './audio.js';

function moveToward(world, guard, tx, ty, speed, dt) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const d = Math.hypot(dx, dy);
  if (d < 2) return true;
  const step = Math.min(d, speed * dt);
  moveCircle(world, guard, (dx / d) * step, (dy / d) * step);
  guard.angle = turnToward(guard.angle, Math.atan2(dy, dx), GUARD.turnSpeed * dt);
  guard.stepTimer -= dt;
  if (guard.stepTimer <= 0) {
    guard.stepTimer = 0.42;
    playGuardStep(dist(guard.x, guard.y, world.player.x, world.player.y));
  }
  return d <= step + 1;
}

function patrolStep(world, guard, dt) {
  const target = guard.waypoints[guard.wp];
  if (guard.pause > 0) {
    guard.pause -= dt;
    // Look around while waiting: sweep the cone across the route.
    guard.angle += Math.sin(world.time * 1.4 + guard.id) * 0.35 * dt;
    return;
  }
  if (moveToward(world, guard, target[0], target[1], GUARD.patrolSpeed, dt)) {
    guard.wp = (guard.wp + 1) % guard.waypoints.length;
    guard.pause = GUARD.waypointPause;
  }
}

function investigateStep(world, guard, dt) {
  const target = guard.investigate;
  if (!target) { guard.state = 'patrol'; return; }
  if (moveToward(world, guard, target.x, target.y, GUARD.investigateSpeed, dt)) {
    guard.lookTimer += dt;
    guard.angle += Math.sin(world.time * 2.2 + guard.id * 2) * 1.1 * dt;
    if (guard.lookTimer > 2.2) {
      guard.investigate = null;
      guard.state = 'return';
      guard.suspicion = 0;
    }
  }
}

function alertStep(world, guard, dt) {
  const target = guard.lastKnown || { x: world.player.x, y: world.player.y };
  moveToward(world, guard, target.x, target.y, GUARD.chaseSpeed, dt);
  if (guard.loseTimer > DETECT.loseSightTime) {
    guard.state = 'search';
    guard.searchTimer = 0;
  }
}

function searchStep(world, guard, dt) {
  const target = guard.lastKnown || { x: guard.x, y: guard.y };
  guard.searchTimer += dt;
  if (dist(guard.x, guard.y, target.x, target.y) > 14) {
    moveToward(world, guard, target.x, target.y, GUARD.investigateSpeed, dt);
  } else {
    guard.angle += 1.6 * dt; // sweep the area, looking for the salvager
    if (guard.searchTimer > DETECT.searchTime) {
      guard.state = 'return';
      guard.suspicion = 0;
      guard.lastKnown = null;
    }
  }
}

function returnStep(world, guard, dt) {
  // Walk back to the nearest waypoint, then resume the patrol from there.
  let best = 0;
  let bestD = Infinity;
  guard.waypoints.forEach((w, i) => {
    const d = dist(guard.x, guard.y, w[0], w[1]);
    if (d < bestD) { bestD = d; best = i; }
  });
  const target = guard.waypoints[best];
  if (moveToward(world, guard, target[0], target[1], GUARD.patrolSpeed, dt)) {
    guard.wp = (best + 1) % guard.waypoints.length;
    guard.state = 'patrol';
  }
}

export function updateGuard(world, guard, dt) {
  const event = updateGuardVision(world, guard, dt);
  if (event === 'spotted') world.spotted += 1;
  switch (guard.state) {
    case 'patrol': patrolStep(world, guard, dt); break;
    case 'suspicious': investigateStep(world, guard, dt); break;
    case 'alert': alertStep(world, guard, dt); break;
    case 'search': searchStep(world, guard, dt); break;
    case 'return': returnStep(world, guard, dt); break;
    default: patrolStep(world, guard, dt);
  }
  guard.suspicion = clamp(guard.suspicion, 0, 1);
}

export function updateGuards(world, dt) {
  for (const g of world.guards) updateGuard(world, g, dt);
}

// An alerted guard who reaches the player catches them.
export function catchingGuard(world) {
  for (const g of world.guards) {
    if (g.state === 'alert' && dist(g.x, g.y, world.player.x, world.player.y) < GUARD.catchDistance) {
      return g;
    }
  }
  return null;
}
