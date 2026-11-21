// The HUD: top bar (level, objective, time) and the right-side panel the winning
// entries all use — detection word, alarm / visibility / noise meters, loot,
// spotted count, goal, legend and controls — plus the title, pause, win and
// lose screens. Buttons are drawn here and their hit boxes are exported so the
// game loop can click them.
import { VIEW, PALETTE, SCORE } from './config.js';
import { detectionWord } from './detection.js';
import { LEVELS } from './levels.js';

const HUD_X = VIEW.hudX;
const HUD_W = VIEW.width - VIEW.hudX;

function fmtTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function meter(ctx, x, y, w, label, value, color) {
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillStyle = PALETTE.muted;
  ctx.fillText(label, x, y);
  ctx.textAlign = 'right';
  ctx.fillStyle = PALETTE.text;
  ctx.fillText(`${Math.round(value * 100)}%`, x + w, y);
  ctx.fillStyle = '#0b0f17';
  ctx.fillRect(x, y + 5, w, 9);
  ctx.fillStyle = color;
  ctx.fillRect(x, y + 5, Math.max(0, Math.min(1, value)) * w, 9);
  ctx.strokeStyle = PALETTE.hudLine;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 5.5, w, 9);
}

export function drawTopBar(ctx, game) {
  const world = game.world;
  ctx.fillStyle = PALETTE.hudBg;
  ctx.fillRect(0, 0, VIEW.width, VIEW.topBar);
  ctx.fillStyle = PALETTE.hudLine;
  ctx.fillRect(0, VIEW.topBar - 1, VIEW.width, 1);
  ctx.textAlign = 'left';
  ctx.font = 'bold 19px sans-serif';
  ctx.fillStyle = PALETTE.text;
  ctx.fillText(`LANTERN ROCK  ·  ${world.def.name.toUpperCase()}`, 14, 29);
  ctx.font = '12px sans-serif';
  ctx.fillStyle = PALETTE.muted;
  ctx.textAlign = 'center';
  const goal = world.objectiveTaken ? 'GOAL: REACH THE BOAT' : `OBJECTIVE: STEAL THE ${world.def.objectiveName.toUpperCase()}`;
  ctx.fillText(goal, 560, 29);
  ctx.textAlign = 'right';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillStyle = PALETTE.text;
  ctx.fillText(`TIME ${fmtTime(world.time)}`, VIEW.width - 14, 29);
  ctx.font = '12px sans-serif';
  ctx.fillStyle = PALETTE.gold;
  ctx.fillText(`SCORE ${game.totalScore + world.score}`, VIEW.width - 130, 29);
}

function section(ctx, x, y, title) {
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillStyle = PALETTE.gold;
  ctx.fillText(title, x, y);
  ctx.fillStyle = PALETTE.hudLine;
  ctx.fillRect(x, y + 5, HUD_W - 28, 1);
  return y + 20;
}

export function drawHud(ctx, game) {
  const world = game.world;
  ctx.fillStyle = PALETTE.hudBg;
  ctx.fillRect(HUD_X, VIEW.topBar, HUD_W, VIEW.height - VIEW.topBar);
  ctx.fillStyle = PALETTE.hudLine;
  ctx.fillRect(HUD_X, VIEW.topBar, 1, VIEW.height - VIEW.topBar);
  const x = HUD_X + 14;
  const w = HUD_W - 28;
  let y = VIEW.topBar + 22;

  // Detection state.
  const det = detectionWord(world);
  y = section(ctx, x, y, 'DETECTION');
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillStyle = det.color;
  ctx.fillText(det.word, x, y + 6);
  y += 30;

  meter(ctx, x, y, w, 'ALARM', world.alarm, '#ff5a5a');
  y += 34;
  const visColor = world.player.visibility > 0.8 ? '#ffb347' : world.player.visibility > 0.4 ? '#ffc442' : '#3ddc78';
  meter(ctx, x, y, w, 'VISIBILITY', world.player.visibility, visColor);
  y += 34;
  meter(ctx, x, y, w, 'NOISE', world.noiseLevel, '#7db4ff');
  y += 26;

  y = section(ctx, x, y, 'HEIST');
  ctx.font = '14px sans-serif';
  ctx.fillStyle = PALETTE.text;
  ctx.fillText(`LOOT  ${world.lootCount} / ${world.loot.length}`, x, y + 6);
  ctx.fillText(`SPOTTED  ${world.spotted}`, x + 130, y + 6);
  y += 22;
  ctx.fillText(`CAUGHT  ${world.catches} / 3`, x, y + 6);
  ctx.fillText(`COINS  ${world.lures}`, x + 130, y + 6);
  y += 22;
  ctx.font = '13px sans-serif';
  ctx.fillStyle = world.objectiveTaken ? PALETTE.good : PALETTE.text;
  ctx.fillText(world.objectiveTaken ? `✓ ${world.def.objectiveName} stolen` : `○ Steal the ${world.def.objectiveName}`, x, y + 6);
  y += 20;
  ctx.fillStyle = world.objectiveTaken ? PALETTE.text : PALETTE.muted;
  ctx.fillText(world.objectiveTaken ? '○ Reach the green boat' : '○ Then reach the boat', x, y + 6);
  y += 26;

  y = section(ctx, x, y, 'LEGEND');
  const legend = [
    ['cone', 'Guard + vision cone'], ['bush', 'Scrub — hide here'], ['crate', 'Crate — blocks sight'],
    ['lamp', 'Lamp light — seen'], ['beam', 'Lighthouse beam — seen'], ['camera', 'Camera — sweeps'],
    ['laser', 'Tripwire laser'], ['prize', 'Prize to steal'], ['exit', 'Exit boat'],
  ];
  ctx.font = '12px sans-serif';
  for (const [kind, label] of legend) {
    drawLegendSwatch(ctx, x + 8, y - 3, kind);
    ctx.fillStyle = PALETTE.text;
    ctx.fillText(label, x + 28, y + 1);
    y += 19;
  }
  y += 8;

  y = section(ctx, x, y, 'CONTROLS');
  const controls = [
    ['WASD / Arrows', 'Move'], ['SHIFT', 'Sneak (silent)'], ['SPACE', 'Sprint (loud)'],
    ['E', 'Hide in barrels'], ['CLICK / Q', 'Throw coin lure'], ['ESC', 'Pause'], ['R', 'Restart'], ['M', 'Mute'],
  ];
  ctx.font = '12px sans-serif';
  for (const [key, label] of controls) {
    ctx.fillStyle = PALETTE.gold;
    ctx.fillText(key, x, y + 1);
    ctx.fillStyle = PALETTE.muted;
    ctx.fillText(label, x + 118, y + 1);
    y += 18;
  }

  // Beam hint at the bottom.
  ctx.font = 'italic 11px sans-serif';
  ctx.fillStyle = '#ffe9a8';
  ctx.fillText('The beam sweeps the island —', x, VIEW.height - 26);
  ctx.fillText('cross only when it has passed.', x, VIEW.height - 12);
}

function drawLegendSwatch(ctx, x, y, kind) {
  ctx.save();
  if (kind === 'cone') {
    ctx.fillStyle = 'rgba(64, 170, 220, 0.5)';
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 12, y - 7); ctx.lineTo(x + 12, y + 7); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#10141f'; ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
  } else if (kind === 'bush') {
    ctx.fillStyle = PALETTE.bush; ctx.beginPath(); ctx.arc(x + 4, y, 8, 0, Math.PI * 2); ctx.fill();
  } else if (kind === 'crate') {
    ctx.fillStyle = PALETTE.crate; ctx.fillRect(x - 3, y - 7, 14, 14);
  } else if (kind === 'lamp') {
    ctx.fillStyle = 'rgba(255, 179, 71, 0.4)'; ctx.beginPath(); ctx.arc(x + 4, y, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = PALETTE.lamp; ctx.beginPath(); ctx.arc(x + 4, y, 3, 0, Math.PI * 2); ctx.fill();
  } else if (kind === 'beam') {
    ctx.fillStyle = 'rgba(255, 233, 168, 0.5)';
    ctx.beginPath(); ctx.moveTo(x - 4, y); ctx.lineTo(x + 13, y - 6); ctx.lineTo(x + 13, y + 6); ctx.closePath(); ctx.fill();
  } else if (kind === 'camera') {
    ctx.fillStyle = '#be82ff'; ctx.beginPath(); ctx.arc(x + 4, y, 5, 0, Math.PI * 2); ctx.fill();
  } else if (kind === 'laser') {
    ctx.strokeStyle = '#ff3c3c'; ctx.lineWidth = 2; ctx.setLineDash([3, 2]);
    ctx.beginPath(); ctx.moveTo(x - 4, y); ctx.lineTo(x + 13, y); ctx.stroke(); ctx.setLineDash([]);
  } else if (kind === 'prize') {
    ctx.fillStyle = PALETTE.objective; ctx.beginPath(); ctx.arc(x + 4, y, 5, 0, Math.PI * 2); ctx.fill();
  } else if (kind === 'exit') {
    ctx.strokeStyle = PALETTE.exit; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x + 4, y, 7, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();
}

// ---- Buttons: drawn here, hit-tested by the game loop. ----
export function button(ctx, rect, label, opts = {}) {
  const { disabled = false, accent = false } = opts;
  ctx.fillStyle = disabled ? '#1a2130' : accent ? '#3a2f12' : PALETTE.hudPanel;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.strokeStyle = disabled ? '#2c3648' : accent ? PALETTE.gold : PALETTE.hudLine;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(rect.x + 0.5, rect.y + 0.5, rect.w - 1, rect.h - 1);
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = disabled ? '#5a6a80' : accent ? PALETTE.gold : PALETTE.text;
  ctx.fillText(label, rect.x + rect.w / 2, rect.y + rect.h / 2 + 5);
}

export function titleButtons(game) {
  const buttons = [];
  LEVELS.forEach((level, i) => {
    buttons.push({
      id: `level-${i}`,
      x: 340, y: 330 + i * 62, w: 600, h: 48,
      label: `${i + 1}. ${level.name} — ${level.objectiveName}${game.completed[i] ? '  ✓' : ''}`,
      disabled: i >= game.unlocked,
    });
  });
  return buttons;
}

export function drawTitle(ctx, game) {
  ctx.fillStyle = 'rgba(5, 8, 14, 0.72)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffe9a8';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('A NIGHT HEIST ON A LIGHTHOUSE ISLAND', 640, 108);
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 64px sans-serif';
  ctx.fillText('LANTERN ROCK', 640, 172);
  ctx.font = '16px sans-serif';
  ctx.fillStyle = PALETTE.muted;
  ctx.fillText('Steal the keeper’s prize from each zone — and reach the boat unseen.', 640, 206);
  ctx.fillText('The lighthouse beam sweeps the island. Cross only when it has passed.', 640, 230);
  ctx.fillStyle = '#ffc442';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('PICK A HEIST', 640, 300);
  for (const b of titleButtons(game)) {
    button(ctx, b, b.label, { disabled: b.disabled, accent: !b.disabled && b.id === `level-${game.unlocked - 1}` });
    if (b.disabled) {
      ctx.font = '11px sans-serif';
      ctx.fillStyle = '#5a6a80';
      ctx.fillText('LOCKED — finish the previous heist', b.x + b.w / 2, b.y + b.h - 8);
    }
  }
  ctx.font = '13px sans-serif';
  ctx.fillStyle = PALETTE.muted;
  ctx.fillText('WASD move  ·  SHIFT sneak  ·  SPACE sprint  ·  E hide  ·  CLICK throw a coin lure', 640, 560);
  ctx.fillText('Hide in scrub, slip behind crates, and never stand in the beam.', 640, 584);
  ctx.fillStyle = PALETTE.gold;
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('Press ENTER to start  ·  M mute', 640, 616);
}

export function pauseButtons() {
  return [
    { id: 'resume', x: 490, y: 330, w: 300, h: 48, label: 'RESUME  (ESC)' },
    { id: 'restart', x: 490, y: 390, w: 300, h: 48, label: 'RESTART LEVEL  (R)' },
    { id: 'menu', x: 490, y: 450, w: 300, h: 48, label: 'BACK TO MENU' },
  ];
}

export function drawPause(ctx) {
  ctx.fillStyle = 'rgba(5, 8, 14, 0.72)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 44px sans-serif';
  ctx.fillText('PAUSED', 640, 250);
  ctx.font = '15px sans-serif';
  ctx.fillStyle = PALETTE.muted;
  ctx.fillText('The wardens wait. The beam does not — plan your crossing.', 640, 282);
  for (const b of pauseButtons()) button(ctx, b, b.label);
}

export function completeButtons(game) {
  const buttons = [];
  if (game.levelIndex < LEVELS.length - 1) {
    buttons.push({ id: 'next', x: 490, y: 430, w: 300, h: 48, label: 'NEXT HEIST  (ENTER)' });
  }
  buttons.push({ id: 'replay', x: 490, y: 490, w: 300, h: 48, label: 'REPLAY LEVEL  (R)' });
  buttons.push({ id: 'menu', x: 490, y: 550, w: 300, h: 48, label: 'BACK TO MENU' });
  return buttons;
}

export function drawLevelComplete(ctx, game) {
  const world = game.world;
  const timeBonus = Math.max(0, Math.round((SCORE.timePar - world.time) * 3));
  const ghost = world.spotted === 0 ? SCORE.ghost : 0;
  const total = world.score + timeBonus + ghost;
  ctx.fillStyle = 'rgba(5, 8, 14, 0.78)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.good;
  ctx.font = 'bold 40px sans-serif';
  ctx.fillText('HEIST COMPLETE', 640, 200);
  ctx.font = '16px sans-serif';
  ctx.fillStyle = PALETTE.text;
  ctx.fillText(`You stole the ${world.def.objectiveName} and slipped away by boat.`, 640, 236);
  if (world.spotted === 0) {
    ctx.fillStyle = PALETTE.gold;
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('GHOST — never spotted. The keeper will never know you were there.', 640, 266);
  }
  ctx.font = '15px sans-serif';
  ctx.fillStyle = PALETTE.text;
  const rows = [
    [`Loot + prize`, world.score],
    [`Time bonus (${fmtTime(world.time)})`, timeBonus],
    [`Ghost bonus`, ghost],
  ];
  let y = 316;
  for (const [label, value] of rows) {
    ctx.textAlign = 'left';
    ctx.fillText(label, 460, y);
    ctx.textAlign = 'right';
    ctx.fillText(`+${value}`, 820, y);
    y += 28;
  }
  ctx.fillStyle = PALETTE.hudLine;
  ctx.fillRect(460, y - 8, 360, 1);
  ctx.font = 'bold 18px sans-serif';
  ctx.fillStyle = PALETTE.gold;
  ctx.textAlign = 'left';
  ctx.fillText('LEVEL SCORE', 460, y + 18);
  ctx.textAlign = 'right';
  ctx.fillText(`${total}`, 820, y + 18);
  for (const b of completeButtons(game)) button(ctx, b, b.label, { accent: b.id === 'next' });
  game.completeScore = total;
}

export function failedButtons() {
  return [
    { id: 'retry', x: 490, y: 400, w: 300, h: 48, label: 'TRY AGAIN  (R)' },
    { id: 'menu', x: 490, y: 460, w: 300, h: 48, label: 'BACK TO MENU' },
  ];
}

export function drawFailed(ctx, game) {
  ctx.fillStyle = 'rgba(20, 5, 8, 0.80)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.danger;
  ctx.font = 'bold 40px sans-serif';
  ctx.fillText('CAUGHT THREE TIMES', 640, 240);
  ctx.font = '16px sans-serif';
  ctx.fillStyle = PALETTE.text;
  ctx.fillText('The wardens know your face now. The heist is blown — for tonight.', 640, 276);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '14px sans-serif';
  ctx.fillText('Tip: sneak through the scrub, toss a coin to pull a warden off his route,', 640, 306);
  ctx.fillText('and never cross open ground while the beam is on you.', 640, 328);
  for (const b of failedButtons()) button(ctx, b, b.label, { accent: b.id === 'retry' });
}

export function drawCaughtFlash(ctx, game) {
  const a = game.world.caughtFlash;
  if (a <= 0) return;
  ctx.fillStyle = `rgba(255, 40, 40, ${0.25 * a})`;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.textAlign = 'center';
  ctx.font = 'bold 44px sans-serif';
  ctx.fillStyle = `rgba(255, 90, 90, ${a})`;
  ctx.fillText('CAUGHT!', 490, 300);
  ctx.font = '16px sans-serif';
  ctx.fillStyle = `rgba(232, 236, 244, ${a})`;
  ctx.fillText(`The warden drags you back to the shore.  (${game.world.catches} / 3)`, 490, 332);
}

export { fmtTime };
