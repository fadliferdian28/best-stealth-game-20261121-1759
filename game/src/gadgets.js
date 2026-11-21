// Gadgets: the coin lure. Click anywhere (or press Q) to toss a coin; it arcs to
// the spot, clinks, and every warden in earshot goes to look — a way to pull a
// guard off a route and slip past behind them.
import { PLAYER } from './config.js';
import { applyNoise } from './detection.js';
import { playCoinThrow, playCoinLand } from './audio.js';
import { clamp } from './config.js';

export function throwCoin(world, tx, ty) {
  if (world.lures <= 0 || world.levelComplete || world.levelFailed) return false;
  const p = world.player;
  const dx = tx - p.x;
  const dy = ty - p.y;
  const d = Math.hypot(dx, dy);
  const range = Math.min(d, PLAYER.lureRange);
  const landX = p.x + (d > 0 ? (dx / d) * range : 0);
  const landY = p.y + (d > 0 ? (dy / d) * range : 0);
  world.coins.push({
    sx: p.x, sy: p.y,
    x: clamp(landX, 20, 960), y: clamp(landY, 66, 700),
    t: 0, flight: PLAYER.lureFlight,
  });
  world.lures -= 1;
  playCoinThrow();
  return true;
}

export function updateCoins(world, dt) {
  for (let i = world.coins.length - 1; i >= 0; i -= 1) {
    const coin = world.coins[i];
    coin.t += dt / coin.flight;
    if (coin.t >= 1) {
      world.coins.splice(i, 1);
      playCoinLand();
      world.rings.push({ x: coin.x, y: coin.y, r: 6, maxR: PLAYER.lureNoise, kind: 'noise' });
      applyNoise(world, coin.x, coin.y, PLAYER.lureNoise);
    }
  }
}

export function updateRings(world, dt) {
  for (let i = world.rings.length - 1; i >= 0; i -= 1) {
    const ring = world.rings[i];
    ring.r += dt * 130;
    if (ring.r >= ring.maxR) world.rings.splice(i, 1);
  }
}
