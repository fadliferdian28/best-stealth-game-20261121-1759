// Canvas drawing: the island, the beam, the cones, the wardens, the salvager.
// What you see is what the rules see — cones are drawn from the same raycast
// polygons the vision code uses, and light pools mark exactly where you are lit.
import { VIEW, PLAY, PALETTE, seededRandom } from './config.js';
import { conePolygon } from './vision.js';
import { pointInBeam } from './beam.js';

const speckleCache = new Map();

function specklesFor(levelIndex) {
  if (speckleCache.has(levelIndex)) return speckleCache.get(levelIndex);
  const rand = seededRandom(1000 + levelIndex * 77);
  const list = [];
  for (let i = 0; i < 340; i += 1) {
    list.push({
      x: PLAY.x + rand() * PLAY.w,
      y: PLAY.y + rand() * PLAY.h,
      r: 1 + rand() * 2.6,
      light: rand() > 0.5,
    });
  }
  for (let i = 0; i < 26; i += 1) {
    list.push({
      x: PLAY.x + rand() * PLAY.w, y: PLAY.y + rand() * PLAY.h,
      r: 4 + rand() * 7, light: false, stone: true,
    });
  }
  speckleCache.set(levelIndex, list);
  return list;
}

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawPath(ctx, x1, y1, x2, y2) {
  const d = Math.hypot(x2 - x1, y2 - y1);
  const steps = Math.ceil(d / 14);
  ctx.fillStyle = PALETTE.path;
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    ctx.beginPath();
    ctx.arc(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, 13, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawIsland(ctx, world) {
  const def = world.def;
  // Sea around the island.
  ctx.fillStyle = PALETTE.sea;
  ctx.fillRect(0, VIEW.topBar, VIEW.hudX, VIEW.height - VIEW.topBar);
  ctx.fillStyle = PALETTE.seaDeep;
  for (let i = 0; i < 8; i += 1) {
    ctx.beginPath();
    ctx.arc(PLAY.x + ((i * 173) % PLAY.w), PLAY.y + PLAY.h - 6 + (i % 3) * 4, 26, 0, Math.PI * 2);
    ctx.fill();
  }
  // Rocky island slab with a sandy shore.
  ctx.fillStyle = PALETTE.sand;
  roundRectPath(ctx, PLAY.x - 4, PLAY.y - 4, PLAY.w + 8, PLAY.h + 8, 26);
  ctx.fill();
  ctx.fillStyle = PALETTE.rock;
  roundRectPath(ctx, PLAY.x + 4, PLAY.y + 4, PLAY.w - 8, PLAY.h - 8, 20);
  ctx.fill();
  // Moonlit worn paths: start -> tower -> prize -> boat.
  drawPath(ctx, def.playerStart.x, def.playerStart.y, 490, 350);
  drawPath(ctx, 490, 350, def.objective.x, def.objective.y);
  drawPath(ctx, def.objective.x, def.objective.y, def.exit.x, def.exit.y);
  drawPath(ctx, 490, 350, def.exit.x, def.exit.y);
  // Speckles and stones.
  for (const s of specklesFor(world.levelIndex)) {
    ctx.fillStyle = s.stone ? PALETTE.rockDark : s.light ? PALETTE.rockLight : PALETTE.rockDark;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawLampPools(ctx, world) {
  for (const lamp of world.def.lamps) {
    const g = ctx.createRadialGradient(lamp.x, lamp.y, 4, lamp.x, lamp.y, lamp.r);
    g.addColorStop(0, 'rgba(255, 179, 71, 0.34)');
    g.addColorStop(1, 'rgba(255, 179, 71, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(lamp.x, lamp.y, lamp.r, 0, Math.PI * 2);
    ctx.fill();
    // The lamp post itself.
    ctx.fillStyle = '#2a2f3a';
    ctx.fillRect(lamp.x - 2, lamp.y - 2, 4, 4);
    ctx.fillStyle = PALETTE.lamp;
    ctx.beginPath();
    ctx.arc(lamp.x, lamp.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBushes(ctx, world) {
  for (const b of world.def.bushes) {
    ctx.fillStyle = PALETTE.bushDark;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.bush;
    for (let i = 0; i < 7; i += 1) {
      const a = (i / 7) * Math.PI * 2;
      const rr = b.r * 0.55;
      ctx.beginPath();
      ctx.arc(b.x + Math.cos(a) * rr * 0.6, b.y + Math.sin(a) * rr * 0.6, b.r * 0.42, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(120, 200, 120, 0.35)';
    ctx.beginPath();
    ctx.arc(b.x - b.r * 0.25, b.y - b.r * 0.25, b.r * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawHideSpots(ctx, world) {
  for (const s of world.def.hideSpots) {
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r + 4, 0, Math.PI * 2);
    ctx.fill();
    for (const [ox, oy] of [[-9, 4], [9, 6], [0, -9]]) {
      ctx.fillStyle = '#6e4f2a';
      ctx.beginPath();
      ctx.arc(s.x + ox, s.y + oy, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#3d2b16';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(s.x + ox, s.y + oy, 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = '#c9a86a';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(s.x + ox, s.y + oy, 6, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

function drawWalls(ctx, world) {
  for (const w of world.def.walls) {
    if (w.kind === 'tower') {
      // The lighthouse: stone drum, warm lamp room on top.
      ctx.fillStyle = '#3a4152';
      ctx.beginPath();
      ctx.arc(w.x + w.w / 2, w.y + w.h / 2, 36, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#4d566b';
      ctx.beginPath();
      ctx.arc(w.x + w.w / 2, w.y + w.h / 2, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffe9a8';
      ctx.beginPath();
      ctx.arc(w.x + w.w / 2, w.y + w.h / 2, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffb347';
      ctx.beginPath();
      ctx.arc(w.x + w.w / 2, w.y + w.h / 2, 6, 0, Math.PI * 2);
      ctx.fill();
      continue;
    }
    if (w.kind === 'fence') {
      ctx.fillStyle = '#5d4a2c';
      ctx.fillRect(w.x, w.y, w.w, w.h);
      ctx.fillStyle = '#7a6240';
      for (let x = w.x + 4; x < w.x + w.w; x += 18) ctx.fillRect(x, w.y - 3, 3, w.h + 6);
      continue;
    }
    if (w.kind === 'rock') {
      ctx.fillStyle = '#2c3446';
      roundRectPath(ctx, w.x, w.y, w.w, w.h, 12);
      ctx.fill();
      ctx.fillStyle = '#3d475e';
      roundRectPath(ctx, w.x + 6, w.y + 5, w.w - 12, w.h - 14, 9);
      ctx.fill();
      continue;
    }
    // Buildings: dark roof, pale rim, a door.
    ctx.fillStyle = '#232a38';
    ctx.fillRect(w.x - 2, w.y - 2, w.w + 4, w.h + 4);
    ctx.fillStyle = w.kind === 'cottage' ? '#5a4632' : w.kind === 'boathouse' ? '#3d4a5c' : '#4a3a2c';
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.strokeStyle = PALETTE.wallTop;
    ctx.lineWidth = 2;
    ctx.strokeRect(w.x + 1, w.y + 1, w.w - 2, w.h - 2);
    ctx.fillStyle = '#ffb347';
    ctx.fillRect(w.x + w.w / 2 - 8, w.y + w.h - 4, 16, 4);
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(w.x + 6, w.y + 6, w.w - 12, 10);
  }
}

function drawCrates(ctx, world) {
  for (const c of world.def.crates) {
    ctx.fillStyle = PALETTE.crateDark;
    ctx.fillRect(c.x - 1, c.y - 1, c.w + 2, c.h + 2);
    ctx.fillStyle = PALETTE.crate;
    ctx.fillRect(c.x, c.y, c.w, c.h);
    ctx.strokeStyle = '#4a3319';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(c.x, c.y); ctx.lineTo(c.x + c.w, c.y + c.h);
    ctx.moveTo(c.x + c.w, c.y); ctx.lineTo(c.x, c.y + c.h);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.14)';
    ctx.lineWidth = 1;
    ctx.strokeRect(c.x + 3, c.y + 3, c.w - 6, c.h - 6);
  }
}

function drawLasers(ctx, world) {
  for (const l of world.lasers) {
    const on = l.cooldown <= 0;
    ctx.strokeStyle = on ? 'rgba(255, 60, 60, 0.9)' : 'rgba(255, 60, 60, 0.25)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(l.x1, l.y1);
    ctx.lineTo(l.x2, l.y2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#ff3c3c';
    for (const [x, y] of [[l.x1, l.y1], [l.x2, l.y2]]) {
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawExit(ctx, world) {
  const e = world.def.exit;
  const active = world.objectiveTaken;
  ctx.fillStyle = active ? 'rgba(61, 220, 120, 0.25)' : 'rgba(120, 130, 140, 0.18)';
  ctx.beginPath();
  ctx.arc(e.x, e.y, 32, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = active ? PALETTE.exit : '#7d8aa0';
  ctx.lineWidth = 3;
  ctx.setLineDash([6, 5]);
  ctx.beginPath();
  ctx.arc(e.x, e.y, 32, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  // The boat: hull + mast.
  ctx.fillStyle = '#8a6a3d';
  ctx.beginPath();
  ctx.ellipse(e.x, e.y, 20, 10, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#a8824f';
  ctx.beginPath();
  ctx.ellipse(e.x, e.y - 2, 15, 6, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#d8c49a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(e.x, e.y - 2); ctx.lineTo(e.x + 2, e.y - 24);
  ctx.stroke();
  ctx.fillStyle = '#e8ecf4';
  ctx.beginPath();
  ctx.moveTo(e.x + 2, e.y - 24); ctx.lineTo(e.x + 2, e.y - 8); ctx.lineTo(e.x + 14, e.y - 8);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = active ? PALETTE.exit : '#aab6c8';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(active ? 'EXIT — BOAT' : 'BOAT (locked)', e.x, e.y - 42);
}

function drawObjective(ctx, world) {
  if (world.objectiveTaken) return;
  const o = world.def.objective;
  const pulse = 1 + Math.sin(world.time * 3) * 0.12;
  ctx.fillStyle = 'rgba(255, 217, 74, 0.22)';
  ctx.beginPath();
  ctx.arc(o.x, o.y, 26 * pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PALETTE.objective;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(o.x, o.y, 18 * pulse, 0, Math.PI * 2);
  ctx.stroke();
  // A brass compass rose.
  ctx.fillStyle = '#8a6a2a';
  ctx.beginPath();
  ctx.arc(o.x, o.y, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.objective;
  ctx.beginPath();
  ctx.moveTo(o.x, o.y - 9); ctx.lineTo(o.x + 3, o.y); ctx.lineTo(o.x, o.y + 9); ctx.lineTo(o.x - 3, o.y);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(o.x - 9, o.y); ctx.lineTo(o.x, o.y - 3); ctx.lineTo(o.x + 9, o.y); ctx.lineTo(o.x, o.y + 3);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PALETTE.objective;
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(world.def.objectiveName.toUpperCase(), o.x, o.y - 26);
}

function drawLoot(ctx, world) {
  for (const item of world.loot) {
    if (item.taken) continue;
    const bob = Math.sin(world.time * 2 + item.x) * 1.5;
    ctx.fillStyle = 'rgba(255, 217, 74, 0.25)';
    ctx.beginPath();
    ctx.arc(item.x, item.y + bob, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffd94a';
    ctx.beginPath();
    ctx.arc(item.x, item.y + bob, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff3b0';
    ctx.beginPath();
    ctx.arc(item.x - 1.5, item.y + bob - 1.5, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBeam(ctx, world) {
  const b = world.beam;
  const tip = { x: b.x + Math.cos(b.angle) * b.range, y: b.y + Math.sin(b.angle) * b.range };
  const left = b.angle - b.width / 2;
  const right = b.angle + b.width / 2;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = 'rgba(255, 233, 168, 0.15)';
  ctx.beginPath();
  ctx.moveTo(b.x, b.y);
  ctx.arc(b.x, b.y, b.range, left - 0.06, right + 0.06);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 233, 168, 0.24)';
  ctx.beginPath();
  ctx.moveTo(b.x, b.y);
  ctx.arc(b.x, b.y, b.range, left, right);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  // Beam edge lines and the lit patch where it lands.
  ctx.strokeStyle = 'rgba(255, 233, 168, 0.5)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(b.x, b.y);
  ctx.lineTo(b.x + Math.cos(left) * b.range, b.y + Math.sin(left) * b.range);
  ctx.moveTo(b.x, b.y);
  ctx.lineTo(b.x + Math.cos(right) * b.range, b.y + Math.sin(right) * b.range);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255, 233, 168, 0.20)';
  ctx.beginPath();
  ctx.ellipse(tip.x, tip.y, 60, 26, b.angle, 0, Math.PI * 2);
  ctx.fill();
}

function coneColors(state) {
  if (state === 'alert') return { fill: PALETTE.coneRed, edge: PALETTE.coneRedEdge };
  if (state === 'suspicious' || state === 'search') return { fill: PALETTE.coneGold, edge: PALETTE.coneGoldEdge };
  return { fill: PALETTE.coneCalm, edge: PALETTE.coneCalmEdge };
}

function drawCones(ctx, world) {
  for (const g of world.guards) {
    const poly = conePolygon(world, g.x, g.y, g.angle, 1.35, g.state === 'alert' ? 258 : 238);
    const c = coneColors(g.state);
    ctx.fillStyle = c.fill;
    ctx.beginPath();
    ctx.moveTo(poly[0].x, poly[0].y);
    for (let i = 1; i < poly.length; i += 1) ctx.lineTo(poly[i].x, poly[i].y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = c.edge;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  for (const cam of world.cameras) {
    const poly = conePolygon(world, cam.x, cam.y, cam.angle, cam.fov, cam.range);
    ctx.fillStyle = cam.suspicion > 0.3 ? 'rgba(255, 120, 120, 0.30)' : 'rgba(190, 130, 255, 0.22)';
    ctx.beginPath();
    ctx.moveTo(poly[0].x, poly[0].y);
    for (let i = 1; i < poly.length; i += 1) ctx.lineTo(poly[i].x, poly[i].y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(210, 160, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

function drawGuards(ctx, world) {
  for (const g of world.guards) {
    // Search ring at the last known spot.
    if (g.state === 'search' && g.lastKnown) {
      ctx.strokeStyle = 'rgba(255, 154, 61, 0.7)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.arc(g.lastKnown.x, g.lastKnown.y, 30 + Math.sin(world.time * 4) * 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    // Body: dark warden with a brass-trimmed lamp on the chest.
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(g.x, g.y + 4, 12, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.guard;
    ctx.beginPath();
    ctx.arc(g.x, g.y, g.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = g.state === 'alert' ? '#ff5a5a' : PALETTE.guardTrim;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(g.x, g.y, g.r, 0, Math.PI * 2);
    ctx.stroke();
    // Facing tick + lamp dot.
    ctx.strokeStyle = '#e8ecf4';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(g.x, g.y);
    ctx.lineTo(g.x + Math.cos(g.angle) * (g.r + 5), g.y + Math.sin(g.angle) * (g.r + 5));
    ctx.stroke();
    ctx.fillStyle = PALETTE.lamp;
    ctx.beginPath();
    ctx.arc(g.x + Math.cos(g.angle) * 5, g.y + Math.sin(g.angle) * 5, 3, 0, Math.PI * 2);
    ctx.fill();
    // Suspicion arc above the head.
    if (g.suspicion > 0.05 && g.state !== 'alert') {
      ctx.strokeStyle = 'rgba(255, 196, 66, 0.9)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(g.x, g.y, g.r + 7, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * g.suspicion);
      ctx.stroke();
    }
    // Markers: "?" when suspicious, "!" when alert.
    ctx.textAlign = 'center';
    if (g.state === 'alert') {
      ctx.font = 'bold 20px sans-serif';
      ctx.fillStyle = '#ff5a5a';
      ctx.fillText('!', g.x, g.y - 22);
    } else if (g.state === 'suspicious') {
      ctx.font = 'bold 18px sans-serif';
      ctx.fillStyle = '#ffc442';
      ctx.fillText('?', g.x, g.y - 22);
      ctx.font = 'bold 10px sans-serif';
      ctx.fillStyle = '#ffe1a0';
      ctx.fillText('WHAT WAS THAT?', g.x, g.y - 36);
    } else if (g.state === 'search') {
      ctx.font = 'bold 16px sans-serif';
      ctx.fillStyle = '#ff9a3d';
      ctx.fillText('?', g.x, g.y - 22);
    }
  }
}

function drawCameras(ctx, world) {
  for (const cam of world.cameras) {
    ctx.fillStyle = '#1a2030';
    ctx.beginPath();
    ctx.arc(cam.x, cam.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = cam.suspicion > 0.3 ? '#ff5a5a' : '#be82ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cam.x, cam.y, 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#e8ecf4';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cam.x, cam.y);
    ctx.lineTo(cam.x + Math.cos(cam.angle) * 13, cam.y + Math.sin(cam.angle) * 13);
    ctx.stroke();
    ctx.fillStyle = cam.suspicion > 0.3 ? '#ff5a5a' : '#ff3c3c';
    ctx.beginPath();
    ctx.arc(cam.x, cam.y, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPlayer(ctx, world) {
  const p = world.player;
  const hidden = p.hidden;
  ctx.save();
  if (hidden) ctx.globalAlpha = 0.55;
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + 4, 11, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  // Cloaked salvager: pale hood, dark cloak.
  ctx.fillStyle = '#2b3350';
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.player;
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.r - 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = p.inBeam || p.lit ? '#ffb347' : '#7d8aa0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = '#2b3350';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  ctx.lineTo(p.x + Math.cos(p.facing) * (p.r + 4), p.y + Math.sin(p.facing) * (p.r + 4));
  ctx.stroke();
  ctx.restore();
  if (hidden) {
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#7ddc8a';
    ctx.fillText('HIDDEN', p.x, p.y - 20);
  } else if (p.inBeam) {
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffe9a8';
    ctx.fillText('IN THE BEAM!', p.x, p.y - 20);
  }
}

function drawCoinsAndRings(ctx, world) {
  for (const coin of world.coins) {
    const t = Math.min(1, coin.t);
    // Dotted arc from the thrower's hand to the landing spot.
    ctx.strokeStyle = 'rgba(255, 217, 74, 0.55)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([2, 6]);
    ctx.beginPath();
    for (let s = 0; s <= 1.001; s += 0.08) {
      const ax = coin.sx + (coin.x - coin.sx) * s;
      const ay = coin.sy + (coin.y - coin.sy) * s - Math.sin(s * Math.PI) * 34;
      if (s === 0) ctx.moveTo(ax, ay); else ctx.lineTo(ax, ay);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    const x = coin.sx + (coin.x - coin.sx) * t;
    const y = coin.sy + (coin.y - coin.sy) * t - Math.sin(t * Math.PI) * 34;
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(coin.sx + (coin.x - coin.sx) * t, coin.sy + (coin.y - coin.sy) * t + 4, 6, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffd94a';
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff3b0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#fff3b0';
    ctx.beginPath();
    ctx.arc(x - 2, y - 2, 2, 0, Math.PI * 2);
    ctx.fill();
    // Landing marker.
    ctx.strokeStyle = 'rgba(255, 217, 74, 0.6)';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.arc(coin.x, coin.y, 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  for (const ring of world.rings) {
    const alpha = Math.max(0, 1 - ring.r / ring.maxR);
    ctx.strokeStyle = ring.kind === 'alarm'
      ? `rgba(255, 90, 90, ${alpha})`
      : `rgba(255, 217, 74, ${alpha * 0.9})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(ring.x, ring.y, ring.r, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawBeamWarning(ctx, world) {
  // A soft vignette pulse while the player stands in the beam.
  if (!world.player.inBeam || world.player.hidden) return;
  const g = ctx.createRadialGradient(490, 383, 200, 490, 383, 620);
  g.addColorStop(0, 'rgba(255, 233, 168, 0)');
  g.addColorStop(1, 'rgba(255, 233, 168, 0.10)');
  ctx.fillStyle = g;
  ctx.fillRect(0, VIEW.topBar, VIEW.hudX, VIEW.height - VIEW.topBar);
}

export function drawWorld(ctx, world) {
  drawIsland(ctx, world);
  drawLampPools(ctx, world);
  drawBushes(ctx, world);
  drawHideSpots(ctx, world);
  drawWalls(ctx, world);
  drawCrates(ctx, world);
  drawLasers(ctx, world);
  drawExit(ctx, world);
  drawObjective(ctx, world);
  drawLoot(ctx, world);
  drawBeam(ctx, world);
  drawCones(ctx, world);
  drawCameras(ctx, world);
  drawGuards(ctx, world);
  drawPlayer(ctx, world);
  drawCoinsAndRings(ctx, world);
  drawBeamWarning(ctx, world);
  // Play-field border.
  ctx.strokeStyle = 'rgba(255,255,255,0.10)';
  ctx.lineWidth = 2;
  roundRectPath(ctx, PLAY.x + 4, PLAY.y + 4, PLAY.w - 8, PLAY.h - 8, 20);
  ctx.stroke();
}

export { pointInBeam };
