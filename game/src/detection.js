// Detection: suspicion, noise, cameras, lasers and the global alarm meter.
// A guard who only half-sees you grows suspicious and investigates; a guard who
// sees you clearly raises the alarm. Lose them and they calm back down — every
// near miss is a chance to recover.
import { DETECT, GUARD } from './config.js';
import { guardSeesPlayer, cameraSeesPlayer } from './vision.js';
import { playSuspicious, playAlert } from './audio.js';
import { dist } from './config.js';

// A sound at (x, y) heard out to `radius`: nearby patrolling guards turn
// suspicious and go look. Alerted guards ignore noise — they already have a target.
export function applyNoise(world, x, y, radius) {
  if (radius <= 0) return;
  world.noiseLevel = Math.min(1, world.noiseLevel + 0.5);
  for (const g of world.guards) {
    if (g.state === 'alert' || g.state === 'search') continue;
    if (dist(g.x, g.y, x, y) > radius) continue;
    if (g.state !== 'suspicious') playSuspicious();
    g.state = 'suspicious';
    g.suspicion = Math.max(g.suspicion, DETECT.hearSuspicion);
    g.investigate = { x, y };
    g.lookTimer = 0;
  }
}

// One guard's eyes, for one frame. Returns 'spotted' the moment this guard goes
// from suspicious to fully alert, so the caller can count it once.
export function updateGuardVision(world, guard, dt) {
  const { seen, distance } = guardSeesPlayer(world, guard, world.player);
  if (guard.state === 'alert') {
    if (seen) {
      guard.lastKnown = { x: world.player.x, y: world.player.y };
      guard.loseTimer = 0;
    } else {
      guard.loseTimer += dt;
    }
    return null;
  }
  if (seen) {
    let rate = DETECT.seeRate;
    if (world.player.lit) rate *= DETECT.litBonus;
    if (distance < GUARD.range * 0.45) rate *= DETECT.closeBonus;
    if (world.player.hidden) rate *= 0.35; // a half-glimpsed shape in the scrub
    guard.suspicion += rate * dt;
    guard.lastKnown = { x: world.player.x, y: world.player.y };
    if (guard.suspicion >= 1) {
      guard.state = 'alert';
      guard.suspicion = 1;
      guard.loseTimer = 0;
      playAlert();
      return 'spotted';
    }
    if (guard.state === 'patrol' && guard.suspicion > 0.25) {
      guard.state = 'suspicious';
      guard.investigate = { x: world.player.x, y: world.player.y };
      playSuspicious();
    }
  } else {
    guard.suspicion = Math.max(0, guard.suspicion - DETECT.decayRate * dt);
    if (guard.state === 'suspicious' && guard.suspicion <= 0 && !guard.investigate) {
      guard.state = 'patrol';
    }
  }
  return null;
}

// Cameras sweep and watch. One that stares at you long enough trips the alarm:
// every guard nearby is sent to your position.
export function updateCameras(world, dt) {
  for (const cam of world.cameras) {
    cam.phase += dt * cam.speed;
    cam.angle = cam.baseAngle + Math.sin(cam.phase) * cam.sweep;
    const { seen } = cameraSeesPlayer(world, cam, world.player);
    if (seen) {
      cam.suspicion += DETECT.cameraSeeRate * dt;
      if (cam.suspicion >= 1) {
        cam.suspicion = 0;
        world.spotted += 1;
        world.alarm = Math.min(1, world.alarm + 0.5);
        playAlert();
        for (const g of world.guards) {
          if (g.state !== 'alert') {
            g.state = 'suspicious';
            g.investigate = { x: world.player.x, y: world.player.y };
            g.suspicion = Math.max(g.suspicion, 0.8);
          }
        }
      }
    } else {
      cam.suspicion = Math.max(0, cam.suspicion - DETECT.decayRate * dt);
    }
  }
}

// Tripwire lasers: cross the line and the yard knows. One trip per cooldown.
export function updateLasers(world, dt) {
  const p = world.player;
  for (const laser of world.lasers) {
    laser.cooldown = Math.max(0, laser.cooldown - dt);
    if (laser.cooldown > 0) continue;
    if (segmentsCross(p.prevX, p.prevY, p.x, p.y, laser.x1, laser.y1, laser.x2, laser.y2)) {
      laser.cooldown = 3;
      world.alarm = Math.min(1, world.alarm + 0.45);
      world.spotted += 1;
      playAlert();
      let nearest = null;
      let best = Infinity;
      for (const g of world.guards) {
        const d = dist(g.x, g.y, p.x, p.y);
        if (d < best) { best = d; nearest = g; }
      }
      if (nearest && nearest.state !== 'alert') {
        nearest.state = 'suspicious';
        nearest.investigate = { x: p.x, y: p.y };
        nearest.suspicion = Math.max(nearest.suspicion, 0.8);
      }
      world.rings.push({ x: p.x, y: p.y, r: 8, maxR: 90, kind: 'alarm' });
    }
  }
}

function segmentsCross(ax, ay, bx, by, cx, cy, dx, dy) {
  const d1 = direction(cx, cy, dx, dy, ax, ay);
  const d2 = direction(cx, cy, dx, dy, bx, by);
  const d3 = direction(ax, ay, bx, by, cx, cy);
  const d4 = direction(ax, ay, bx, by, dx, dy);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}
function direction(px, py, qx, qy, rx, ry) {
  return (rx - px) * (qy - py) - (ry - py) * (qx - px);
}

// The global alarm meter: climbs while any guard is alert, bleeds away in the calm.
export function updateAlarm(world, dt) {
  const anyAlert = world.guards.some((g) => g.state === 'alert');
  if (anyAlert) world.alarm = Math.min(1, world.alarm + DETECT.alarmRise * dt);
  else world.alarm = Math.max(0, world.alarm - DETECT.alarmFall * dt);
  world.noiseLevel = Math.max(0, world.noiseLevel - dt * 1.4);
}

// The HUD's one-word detection state: the worst thing any guard is doing.
export function detectionWord(world) {
  if (world.guards.some((g) => g.state === 'alert')) return { word: 'ALERT', color: '#ff5a5a' };
  if (world.guards.some((g) => g.state === 'search')) return { word: 'SEARCHING', color: '#ff9a3d' };
  if (world.guards.some((g) => g.state === 'suspicious')) return { word: 'SUSPICIOUS', color: '#ffc442' };
  if (world.cameras.some((c) => c.suspicion > 0.3)) return { word: 'WATCHED', color: '#ffc442' };
  return { word: 'CALM', color: '#3ddc78' };
}
