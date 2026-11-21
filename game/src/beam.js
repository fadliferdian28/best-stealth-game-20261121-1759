// The lighthouse beam: a wide shaft of light that sweeps slowly around the island.
// Standing in it makes the player VISIBLE, like standing under a lamp — time your
// crossings to the beam's rotation.
import { BEAM_CFG } from './config.js';
import { angleDiff } from './config.js';

export function createBeam(levelIndex, x, y) {
  return {
    x, y,
    angle: -Math.PI / 2, // starts pointing up
    width: BEAM_CFG.width,
    range: BEAM_CFG.range,
    speed: BEAM_CFG.speed[levelIndex] || BEAM_CFG.speed[0],
  };
}

export function stepBeam(beam, dt) {
  beam.angle += beam.speed * dt;
  if (beam.angle > Math.PI) beam.angle -= Math.PI * 2;
}

export function pointInBeam(beam, x, y) {
  const dx = x - beam.x;
  const dy = y - beam.y;
  const d = Math.hypot(dx, dy);
  if (d > beam.range || d < 12) return false;
  return Math.abs(angleDiff(Math.atan2(dy, dx), beam.angle)) <= beam.width / 2;
}

// The beam's far edge, for drawing the wedge and for the "next sweep" HUD hint.
export function beamTip(beam) {
  return { x: beam.x + Math.cos(beam.angle) * beam.range, y: beam.y + Math.sin(beam.angle) * beam.range };
}
