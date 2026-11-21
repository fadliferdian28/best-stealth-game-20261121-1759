// The salvager: WASD/arrows to move, SHIFT to sneak (slow, silent), SPACE to
// sprint (fast, loud — guards hear the boots), E to slip into a barrel hide spot.
// Loot and the prize are picked up by walking over them.
import { PLAYER, SCORE, PLAY } from './config.js';
import { moveCircle, hideSpotAt } from './world.js';
import { keyDown, keyPressed } from './input.js';
import { playFootstep, playPickup } from './audio.js';
import { applyNoise } from './detection.js';
import { dist } from './config.js';

export function updatePlayer(world, input, dt) {
  const p = world.player;
  p.prevX = p.x;
  p.prevY = p.y;

  let mx = 0;
  let my = 0;
  if (keyDown(input, 'w', 'ArrowUp')) my -= 1;
  if (keyDown(input, 's', 'ArrowDown')) my += 1;
  if (keyDown(input, 'a', 'ArrowLeft')) mx -= 1;
  if (keyDown(input, 'd', 'ArrowRight')) mx += 1;
  const wantMove = mx !== 0 || my !== 0;

  // E near a barrel cluster slips you inside; moving climbs back out.
  if (keyPressed(input, 'e')) {
    if (p.hiding) {
      p.hiding = false;
    } else if (hideSpotAt(world, p.x, p.y)) {
      p.hiding = true;
    }
  }
  if (wantMove) p.hiding = false;

  if (wantMove) {
    const len = Math.hypot(mx, my);
    mx /= len; my /= len;
    p.facing = Math.atan2(my, mx);
    p.moving = true;
    if (keyDown(input, 'Shift')) p.gait = 'sneak';
    else if (keyDown(input, ' ')) p.gait = 'sprint';
    else p.gait = 'walk';
    const speed = p.gait === 'sneak' ? PLAYER.sneakSpeed : p.gait === 'sprint' ? PLAYER.sprintSpeed : PLAYER.walkSpeed;
    moveCircle(world, p, mx * speed * dt, my * speed * dt);

    p.stepTimer -= dt;
    if (p.stepTimer <= 0) {
      p.stepTimer = PLAYER.footstepEvery[p.gait];
      if (p.gait !== 'sneak') {
        playFootstep(p.gait === 'sprint');
        const radius = PLAYER.noiseRadius[p.gait];
        if (radius > 0) applyNoise(world, p.x, p.y, radius);
        if (p.gait === 'sprint') {
          world.rings.push({ x: p.x, y: p.y, r: 6, maxR: 46, kind: 'noise' });
        }
      }
    }
  } else {
    p.moving = false;
  }
}

// Pick up loot and the prize by walking over them; returns what was collected.
export function collectPickups(world) {
  const p = world.player;
  const got = [];
  for (const item of world.loot) {
    if (!item.taken && dist(p.x, p.y, item.x, item.y) < p.r + 14) {
      item.taken = true;
      world.lootCount += 1;
      world.score += SCORE.loot;
      playPickup();
      got.push('loot');
    }
  }
  if (!world.objectiveTaken && dist(p.x, p.y, world.def.objective.x, world.def.objective.y) < p.r + 16) {
    world.objectiveTaken = true;
    world.score += SCORE.objective;
    playPickup();
    got.push('objective');
  }
  return got;
}

export function playerAtExit(world) {
  const p = world.player;
  return dist(p.x, p.y, world.def.exit.x, world.def.exit.y) < 34;
}

export function playerNearHideSpot(world) {
  return !world.player.hiding && hideSpotAt(world, world.player.x, world.player.y) !== null;
}
