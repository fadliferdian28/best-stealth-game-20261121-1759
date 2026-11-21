// Lantern Rock — tuning constants. One place for every number the game balances on:
// canvas layout, movement speeds, guard senses, detection rates and the palette.
export const VIEW = { width: 1280, height: 720, topBar: 46, hudX: 980 };
export const PLAY = { x: 10, y: 56, w: 960, h: 654 }; // playable island bounds (canvas coords)

export const PLAYER = {
  radius: 10,
  walkSpeed: 150,
  sneakSpeed: 86,
  sprintSpeed: 242,
  footstepEvery: { sneak: 0.55, walk: 0.34, sprint: 0.22 }, // seconds between steps
  noiseRadius: { sneak: 0, walk: 46, sprint: 170 }, // how far guards hear each gait
  lureCount: 5,
  lureRange: 270,
  lureFlight: 0.55,
  lureNoise: 200,
};

export const GUARD = {
  radius: 11,
  patrolSpeed: 68,
  investigateSpeed: 96,
  chaseSpeed: 158,
  fov: 1.35, // radians, ~77 degrees
  range: 238, // sight range in the light
  shadowRange: 148, // sight range in darkness
  turnSpeed: 3.4, // radians per second
  waypointPause: 1.6,
  catchDistance: 21,
  closeSpot: 52, // inside this, even a hidden player is noticed
};

export const DETECT = {
  seeRate: 1.15, // suspicion per second while the guard has a clear look
  litBonus: 1.7, // multiplier when the player stands in light or the beam
  closeBonus: 1.5, // multiplier when the player is near
  decayRate: 0.30, // suspicion per second while unseen
  hearSuspicion: 0.55, // suspicion a heard noise grants
  loseSightTime: 2.4, // seconds unseen before an alerted guard starts searching
  searchTime: 4.5, // seconds a guard hunts the last known spot
  alarmRise: 0.55, // global alarm meter rise per second while any guard is alert
  alarmFall: 0.16,
  cameraSeeRate: 0.9,
};

export const BEAM_CFG = {
  width: 0.46, // radians, ~26 degrees
  range: 780,
  speed: [0.22, 0.30, 0.38], // radians per second per level
};

export const SCORE = { loot: 100, objective: 500, ghost: 300, catchPenalty: 150, timePar: 150 };

export const PALETTE = {
  sea: '#0a1626',
  seaDeep: '#071020',
  rock: '#1c2436',
  rockLight: '#252f47',
  rockDark: '#151c2b',
  path: '#3a3f52',
  sand: '#4a4234',
  grass: '#22331f',
  bush: '#2e5230',
  bushDark: '#1e3a22',
  wall: '#4b5568',
  wallTop: '#6b7688',
  crate: '#7a5a33',
  crateDark: '#5d4426',
  lamp: '#ffb347',
  beam: '#ffe9a8',
  coneCalm: 'rgba(64, 170, 220, 0.28)',
  coneCalmEdge: 'rgba(96, 200, 255, 0.55)',
  coneGold: 'rgba(255, 196, 66, 0.38)',
  coneGoldEdge: 'rgba(255, 210, 110, 0.8)',
  coneRed: 'rgba(255, 84, 84, 0.42)',
  coneRedEdge: 'rgba(255, 120, 120, 0.85)',
  exit: '#3ddc78',
  objective: '#ffd94a',
  player: '#f2e8d5',
  guard: '#10141f',
  guardTrim: '#e8b23a',
  hudBg: '#10151f',
  hudPanel: '#171e2c',
  hudLine: '#2c3648',
  text: '#e8ecf4',
  muted: '#93a0b5',
  danger: '#ff5a5a',
  gold: '#ffc442',
  good: '#3ddc78',
};

// Deterministic pseudo-random generator (mulberry32) so the island's speckles and
// decorative stones look the same on every load and every screenshot.
export function seededRandom(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}
export function turnToward(angle, target, maxStep) {
  const d = angleDiff(target, angle);
  if (Math.abs(d) <= maxStep) return target;
  return angle + Math.sign(d) * maxStep;
}
export function dist(x1, y1, x2, y2) { return Math.hypot(x2 - x1, y2 - y1); }
