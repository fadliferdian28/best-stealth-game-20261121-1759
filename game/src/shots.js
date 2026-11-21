// Scripted screenshot states behind ?shot=cover|patrol|lure|alarm. Each one plays
// the real rules forward from a fresh world for a fixed number of steps (or stages
// exact positions the rules could reach), so every screenshot is a real render of
// the game's own code — never edited, composited or borrowed. The frame is frozen
// after staging so the capture is deterministic.
import { buildWorld } from './world.js';
import { LEVELS } from './levels.js';

function freshGame(game, levelIndex) {
  game.levelIndex = levelIndex;
  game.world = buildWorld(LEVELS[levelIndex], levelIndex);
  game.screen = 'play';
  game.totalScore = 0;
  game.frozen = true;
}

function aimBeamAt(world, x, y) {
  world.beam.angle = Math.atan2(y - world.beam.y, x - world.beam.x);
}

// The cover: level 3 mid-action. The salvager hides in the scrub beside the
// Fresnel Lens while a suspicious warden's gold cone sweeps past and the beam
// crosses the scene. The boat waits at the shore.
function stageCover(game) {
  freshGame(game, 2);
  const world = game.world;
  const p = world.player;
  p.x = 614; p.y = 138; // inside the scrub at (620, 130)
  p.facing = Math.PI;
  world.loot[0].taken = true;
  world.lootCount = 1;
  world.score = 100;
  world.time = 74;
  const warden = world.guards[1];
  warden.x = 655; warden.y = 270;
  warden.angle = Math.atan2(150 - warden.y, 560 - warden.x);
  warden.state = 'suspicious';
  warden.suspicion = 0.62;
  warden.investigate = { x: 640, y: 170 };
  const patroller = world.guards[0];
  patroller.x = 240; patroller.y = 330;
  patroller.angle = 0.4;
  const towerGuard = world.guards[4];
  towerGuard.x = 560; towerGuard.y = 380;
  towerGuard.angle = -2.2;
  aimBeamAt(world, 620, 150);
  world.rings.push({ x: 640, y: 170, r: 30, maxR: 90, kind: 'noise' });
}

// Level 1, calm: blue cones on patrol, scrub to hide in, loot glinting, the
// HUD readable. The game as a new player first meets it.
function stagePatrol(game, stepWorld) {
  freshGame(game, 0);
  const world = game.world;
  world.player.x = 320; world.player.y = 620; // hidden in the shore scrub
  world.player.facing = 0;
  // Let the patrols walk a few seconds so the cones sit mid-route.
  for (let i = 0; i < 150; i += 1) stepWorld(world, 1 / 30);
  aimBeamAt(world, 250, 200);
  world.time = 31;
}

// The gadget moment: a coin lure arcs through the air toward a warden's route
// while he turns toward the clink, gold "?" over his head.
function stageLure(game) {
  freshGame(game, 1);
  const world = game.world;
  const p = world.player;
  p.x = 300; p.y = 600; // in the scrub at (300, 620), clear of the tripwire
  p.facing = 0.5;
  world.loot[0].taken = true;
  world.loot[3].taken = true;
  world.lootCount = 2;
  world.score = 200;
  world.lures = 4;
  world.time = 96;
  world.coins.push({ sx: p.x, sy: p.y, x: 520, y: 500, t: 0.55, flight: 0.55 });
  world.rings.push({ x: 520, y: 500, r: 26, maxR: 200, kind: 'noise' });
  const warden = world.guards[2];
  warden.x = 620; warden.y = 540;
  warden.angle = Math.atan2(500 - warden.y, 520 - warden.x);
  warden.state = 'suspicious';
  warden.suspicion = 0.55;
  warden.investigate = { x: 520, y: 500 };
  const patroller = world.guards[0];
  patroller.x = 200; patroller.y = 380;
  patroller.angle = -0.5;
  aimBeamAt(world, 520, 500);
}

// The near miss: a warden has the scent and is sweeping the last known spot,
// search ring on the ground, alarm half up, the beam crossing the yard.
function stageAlarm(game) {
  freshGame(game, 2);
  const world = game.world;
  const p = world.player;
  p.x = 430; p.y = 590; // just slipped out of the light, sprinting for the scrub
  p.facing = Math.PI;
  p.gait = 'sprint';
  world.objectiveTaken = true;
  world.score = 500;
  world.spotted = 1;
  world.alarm = 0.62;
  world.time = 128;
  const hunter = world.guards[2];
  hunter.x = 520; hunter.y = 520;
  hunter.angle = Math.atan2(p.y - hunter.y, p.x - hunter.x);
  hunter.state = 'search';
  hunter.suspicion = 1;
  hunter.lastKnown = { x: 470, y: 560 };
  hunter.searchTimer = 1.5;
  const chaser = world.guards[4];
  chaser.x = 620; chaser.y = 430;
  chaser.angle = Math.atan2(560 - chaser.y, 470 - chaser.x);
  chaser.state = 'alert';
  chaser.suspicion = 1;
  chaser.lastKnown = { x: 470, y: 560 };
  world.rings.push({ x: 470, y: 560, r: 40, maxR: 120, kind: 'alarm' });
  aimBeamAt(world, 470, 560);
}

export function stageShot(name, game, stepWorld) {
  if (name === 'cover') stageCover(game);
  else if (name === 'patrol') stagePatrol(game, stepWorld);
  else if (name === 'lure') stageLure(game);
  else if (name === 'alarm') stageAlarm(game);
  else stagePatrol(game, stepWorld);
}
