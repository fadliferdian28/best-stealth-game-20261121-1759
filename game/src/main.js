// Lantern Rock — game loop and state machine. Screens: title, play, paused,
// complete, failed. ?shot=cover|patrol|lure|alarm stages a frozen screenshot
// state; ?level=0|1|2 jumps straight into a heist (handy for testing).
import { VIEW, SCORE } from './config.js';
import { createInput, keyPressed, consumeClick, endFrame } from './input.js';
import { buildWorld, updateExposure, resetGuardsToPatrol } from './world.js';
import { LEVELS } from './levels.js';
import { stepBeam } from './beam.js';
import { updatePlayer, collectPickups, playerAtExit } from './player.js';
import { updateGuards, catchingGuard } from './guards.js';
import { updateCameras, updateLasers, updateAlarm } from './detection.js';
import { throwCoin, updateCoins, updateRings } from './gadgets.js';
import { drawWorld } from './render.js';
import {
  drawTopBar, drawHud, drawTitle, drawPause, drawLevelComplete, drawFailed,
  drawCaughtFlash, titleButtons, pauseButtons, completeButtons, failedButtons,
} from './hud.js';
import { stageShot } from './shots.js';
import {
  ensureAudio, setMuted, isMuted, playCaught, playWin, playLose, playClick,
} from './audio.js';

const canvas = document.getElementById('game');
canvas.width = VIEW.width;
canvas.height = VIEW.height;
const ctx = canvas.getContext('2d');
const input = createInput(canvas);

const game = {
  screen: 'title',
  levelIndex: 0,
  unlocked: 1,
  completed: [false, false, false],
  totalScore: 0,
  completeScore: 0,
  world: buildWorld(LEVELS[0], 0),
  frozen: false,
  shotName: null,
};

// One fixed simulation step. Used by the live loop and by the screenshot
// staging, so staged frames obey the same rules as play.
export function stepWorld(world, dt) {
  world.time += dt;
  stepBeam(world.beam, dt);
  updateExposure(world);
  updateCoins(world, dt);
  updateGuards(world, dt);
  updateCameras(world, dt);
  updateLasers(world, dt);
  updateAlarm(world, dt);
  updateRings(world, dt);
  world.caughtFlash = Math.max(0, world.caughtFlash - dt * 0.8);
}

function startLevel(index) {
  game.levelIndex = index;
  game.world = buildWorld(LEVELS[index], index);
  game.screen = 'play';
  game.frozen = false;
}

function onCaught() {
  const world = game.world;
  world.catches += 1;
  world.caughtFlash = 1;
  playCaught();
  if (world.catches >= 3) {
    world.levelFailed = true;
    game.screen = 'failed';
    playLose();
    return;
  }
  world.player.x = world.def.playerStart.x;
  world.player.y = world.def.playerStart.y;
  world.player.hiding = false;
  resetGuardsToPatrol(world);
}

function onLevelComplete() {
  const world = game.world;
  world.levelComplete = true;
  game.completed[game.levelIndex] = true;
  game.unlocked = Math.max(game.unlocked, Math.min(3, game.levelIndex + 2));
  game.screen = 'complete';
  playWin();
}

function updatePlay(dt) {
  const world = game.world;
  // Pause / restart / mute.
  if (keyPressed(input, 'Escape')) { game.screen = 'paused'; playClick(); return; }
  if (keyPressed(input, 'r')) { startLevel(game.levelIndex); return; }
  if (keyPressed(input, 'm')) { setMuted(!isMuted()); }
  if (keyPressed(input, 'q')) {
    throwCoin(world, world.player.x + Math.cos(world.player.facing) * 200,
      world.player.y + Math.sin(world.player.facing) * 200);
  }
  const click = consumeClick(input);
  if (click && click.x < VIEW.hudX && click.y > VIEW.topBar) {
    ensureAudio();
    throwCoin(world, click.x, click.y);
  }

  updatePlayer(world, input, dt);
  stepWorld(world, dt);
  collectPickups(world);

  const catcher = catchingGuard(world);
  if (catcher) { onCaught(); return; }

  if (world.objectiveTaken && playerAtExit(world)) {
    const timeBonus = Math.max(0, Math.round((SCORE.timePar - world.time) * 3));
    const ghost = world.spotted === 0 ? SCORE.ghost : 0;
    game.completeScore = world.score + timeBonus + ghost;
    game.totalScore += game.completeScore;
    onLevelComplete();
  }
}

function clickIn(rect, click) {
  return click && click.x >= rect.x && click.x <= rect.x + rect.w
    && click.y >= rect.y && click.y <= rect.y + rect.h;
}

function updateTitle() {
  ensureAudio();
  if (keyPressed(input, 'Enter')) {
    const next = game.completed.findIndex((c) => !c);
    startLevel(next === -1 ? 0 : Math.min(next, game.unlocked - 1));
    playClick();
    return;
  }
  if (keyPressed(input, 'm')) setMuted(!isMuted());
  const click = consumeClick(input);
  if (!click) return;
  for (const b of titleButtons(game)) {
    if (!b.disabled && clickIn(b, click)) {
      playClick();
      startLevel(Number(b.id.split('-')[1]));
      return;
    }
  }
}

function updatePaused() {
  if (keyPressed(input, 'Escape')) { game.screen = 'play'; playClick(); return; }
  if (keyPressed(input, 'r')) { startLevel(game.levelIndex); return; }
  if (keyPressed(input, 'm')) setMuted(!isMuted());
  const click = consumeClick(input);
  if (!click) return;
  for (const b of pauseButtons()) {
    if (!clickIn(b, click)) continue;
    playClick();
    if (b.id === 'resume') game.screen = 'play';
    if (b.id === 'restart') startLevel(game.levelIndex);
    if (b.id === 'menu') { game.screen = 'title'; game.world = buildWorld(LEVELS[0], 0); }
    return;
  }
}

function updateComplete() {
  if (keyPressed(input, 'Enter') && game.levelIndex < LEVELS.length - 1) {
    startLevel(game.levelIndex + 1);
    return;
  }
  if (keyPressed(input, 'r')) { startLevel(game.levelIndex); return; }
  const click = consumeClick(input);
  if (!click) return;
  for (const b of completeButtons(game)) {
    if (!clickIn(b, click)) continue;
    playClick();
    if (b.id === 'next') startLevel(game.levelIndex + 1);
    if (b.id === 'replay') startLevel(game.levelIndex);
    if (b.id === 'menu') { game.screen = 'title'; game.world = buildWorld(LEVELS[0], 0); }
    return;
  }
}

function updateFailed() {
  if (keyPressed(input, 'r')) { startLevel(game.levelIndex); return; }
  const click = consumeClick(input);
  if (!click) return;
  for (const b of failedButtons()) {
    if (!clickIn(b, click)) continue;
    playClick();
    if (b.id === 'retry') startLevel(game.levelIndex);
    if (b.id === 'menu') { game.screen = 'title'; game.world = buildWorld(LEVELS[0], 0); }
    return;
  }
}

function render() {
  ctx.clearRect(0, 0, VIEW.width, VIEW.height);
  if (game.screen === 'title') {
    drawWorld(ctx, game.world);
    drawTopBar(ctx, game);
    drawHud(ctx, game);
    drawTitle(ctx, game);
    return;
  }
  drawWorld(ctx, game.world);
  drawTopBar(ctx, game);
  drawHud(ctx, game);
  drawCaughtFlash(ctx, game);
  if (game.screen === 'paused') drawPause(ctx);
  if (game.screen === 'complete') drawLevelComplete(ctx, game);
  if (game.screen === 'failed') drawFailed(ctx, game);
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!game.frozen) {
    if (game.screen === 'play') updatePlay(dt);
    else if (game.screen === 'title') updateTitle();
    else if (game.screen === 'paused') updatePaused();
    else if (game.screen === 'complete') updateComplete();
    else if (game.screen === 'failed') updateFailed();
    // The title backdrop idles: beam sweeps, patrols walk.
    if (game.screen === 'title') stepWorld(game.world, dt);
  }
  render();
  endFrame(input);
  requestAnimationFrame(frame);
}

// Boot: screenshot mode, level jump, or the title screen.
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const levelParam = params.get('level');
if (shot) {
  setMuted(true);
  game.shotName = shot;
  stageShot(shot, game, stepWorld);
  updateExposure(game.world);
} else if (levelParam !== null) {
  const index = Math.max(0, Math.min(LEVELS.length - 1, Number(levelParam) || 0));
  game.unlocked = 3;
  startLevel(index);
}

// Auto-pause when the tab is hidden or the window loses focus: a stealth
// game must never keep running (and get the player caught) while the
// player is away. Uses the same 'paused' screen as ESC, so ESC resumes.
function autoPause() {
  if (game.screen === 'play') { game.screen = 'paused'; playClick(); }
}
document.addEventListener('visibilitychange', () => { if (document.hidden) autoPause(); });
window.addEventListener('blur', autoPause);

// Test hook: lets automated play-tests drive and inspect the live game.
window.__lantern = { game, startLevel, stepWorld };
requestAnimationFrame(frame);
