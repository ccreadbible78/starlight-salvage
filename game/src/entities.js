// Starlight Salvage — every moving thing in the field: the salvage drone,
// star shards, asteroids, mines, power-ups, particles and floating score
// text. Factories make them, updaters move them; none of them touch the
// DOM. Collisions are plain circle tests in main.js.
import {
  DASH_COOLDOWN,
  DASH_INVULN,
  DASH_SPEED,
  DASH_TIME,
  GOLD_CHANCE,
  GOLD_SHARD_SCORE,
  HULL_MAX,
  MOUSE_FOLLOW,
  PARTICLE_MAX,
  PLAYER_DRAG,
  PLAYER_MAX_SPEED,
  PLAYER_RADIUS,
  PLAYER_THRUST,
  SHARD_SCORE,
} from './config.js';

export function createPlayer(x, y) {
  return {
    x,
    y,
    vx: 0,
    vy: 0,
    r: PLAYER_RADIUS,
    hull: HULL_MAX,
    maxHull: HULL_MAX,
    invuln: 0,
    dashTime: 0,
    dashCd: 0,
    dashCdMax: DASH_COOLDOWN, // upgrades can shorten this
    dashX: 1,
    dashY: 0,
    magnet: 1, // multiplier on pickup radius
    scoreMult: 1, // multiplier on points
    shield: false, // one free hit
    angle: -Math.PI / 2, // nose direction, for drawing
    trail: [], // recent positions, drawn as a fading wake
  };
}

export function createShard(rng, w, h) {
  const gold = rng.chance(GOLD_CHANCE);
  return {
    kind: 'shard',
    gold,
    value: gold ? GOLD_SHARD_SCORE : SHARD_SCORE,
    x: rng.range(40, w - 40),
    y: rng.range(70, h - 40),
    r: gold ? 13 : 10,
    phase: rng.range(0, Math.PI * 2),
    bob: rng.range(0.6, 1.4),
    vx: rng.range(-12, 12),
    vy: rng.range(-12, 12),
  };
}

export function createAsteroid(rng, w, h, speed, big = true) {
  const angle = rng.angle();
  const r = big ? rng.range(22, 40) : rng.range(12, 18);
  const edge = rng.int(0, 3);
  let x;
  let y;
  if (edge === 0) {
    x = rng.range(0, w);
    y = -50;
  } else if (edge === 1) {
    x = rng.range(0, w);
    y = h + 50;
  } else if (edge === 2) {
    x = -50;
    y = rng.range(0, h);
  } else {
    x = w + 50;
    y = rng.range(0, h);
  }
  const verts = [];
  const n = rng.int(7, 10);
  for (let i = 0; i < n; i += 1) {
    verts.push(rng.range(0.72, 1.18));
  }
  return {
    kind: 'asteroid',
    x,
    y,
    vx: Math.cos(angle) * speed * rng.range(0.5, 1.1),
    vy: Math.sin(angle) * speed * rng.range(0.5, 1.1),
    r,
    rot: rng.angle(),
    spin: rng.range(-1.2, 1.2),
    verts,
    big,
  };
}

export function createMine(rng, w, h) {
  return {
    kind: 'mine',
    x: rng.range(60, w - 60),
    y: rng.range(90, h - 60),
    vx: rng.range(-16, 16),
    vy: rng.range(-16, 16),
    r: 17,
    phase: rng.range(0, Math.PI * 2),
    chase: 0.35, // how hard it leans toward the player
  };
}

export function createPowerup(rng, w, h) {
  const kind = rng.pick(['shield', 'slow', 'double']);
  return {
    kind: 'powerup',
    power: kind,
    x: rng.range(50, w - 50),
    y: rng.range(80, h - 50),
    r: 14,
    phase: rng.range(0, Math.PI * 2),
    vx: rng.range(-10, 10),
    vy: rng.range(-10, 10),
  };
}

export function createParticle(x, y, color, count, speed, life = 0.7) {
  const out = [];
  for (let i = 0; i < count; i += 1) {
    const a = Math.random() * Math.PI * 2;
    const s = speed * (0.3 + Math.random() * 0.7);
    out.push({
      x,
      y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      life: life * (0.6 + Math.random() * 0.6),
      maxLife: life,
      size: 1.5 + Math.random() * 3,
      color,
    });
  }
  return out;
}

export function createFloater(x, y, text, color) {
  return { x, y, text, color, life: 1.1, maxLife: 1.1 };
}

// --- updaters -------------------------------------------------------------

export function updatePlayer(p, input, dt, w, h) {
  // Keyboard thrust, mouse steering, then drag. The drone always moves
  // toward the cursor when the mouse is inside; keys override the axis.
  const mv = input.moveVector();
  if (mv.x !== 0 || mv.y !== 0) {
    p.vx += mv.x * PLAYER_THRUST * dt;
    p.vy += mv.y * PLAYER_THRUST * dt;
  } else if (input.mouse.inside) {
    const dx = input.mouse.x - p.x;
    const dy = input.mouse.y - p.y;
    const d = Math.hypot(dx, dy);
    if (d > 6) {
      const pull = Math.min(1, d / 90) * MOUSE_FOLLOW;
      p.vx += (dx / d) * pull * PLAYER_THRUST * dt * 0.45;
      p.vy += (dy / d) * pull * PLAYER_THRUST * dt * 0.45;
    }
  }
  const drag = Math.exp(-PLAYER_DRAG * dt);
  p.vx *= drag;
  p.vy *= drag;
  const speed = Math.hypot(p.vx, p.vy);
  const cap = p.dashTime > 0 ? DASH_SPEED : PLAYER_MAX_SPEED;
  if (speed > cap) {
    p.vx = (p.vx / speed) * cap;
    p.vy = (p.vy / speed) * cap;
  }
  p.x += p.vx * dt;
  p.y += p.vy * dt;
  p.x = Math.max(p.r, Math.min(w - p.r, p.x));
  p.y = Math.max(p.r + 44, Math.min(h - p.r, p.y));
  if (speed > 24) p.angle = Math.atan2(p.vy, p.vx);
  if (p.invuln > 0) p.invuln -= dt;
  if (p.dashCd > 0) p.dashCd -= dt;
  if (p.dashTime > 0) p.dashTime -= dt;
  p.trail.push({ x: p.x, y: p.y });
  if (p.trail.length > 14) p.trail.shift();
}

export function tryDash(p, input) {
  if (p.dashCd > 0 || p.dashTime > 0) return false;
  let dx = input.moveVector().x;
  let dy = input.moveVector().y;
  if (dx === 0 && dy === 0) {
    dx = Math.cos(p.angle);
    dy = Math.sin(p.angle);
  }
  const len = Math.hypot(dx, dy) || 1;
  p.dashX = dx / len;
  p.dashY = dy / len;
  p.vx = p.dashX * DASH_SPEED;
  p.vy = p.dashY * DASH_SPEED;
  p.dashTime = DASH_TIME;
  p.dashCd = p.dashCdMax ?? DASH_COOLDOWN;
  p.invuln = Math.max(p.invuln, DASH_INVULN);
  return true;
}

export function updateShard(s, p, dt, time) {
  // A shard bobs, drifts, and slides toward the drone inside the magnet.
  s.phase += dt * s.bob;
  s.x += s.vx * dt;
  s.y += s.vy * dt + Math.sin(s.phase * 2.4) * 8 * dt;
  const dx = p.x - s.x;
  const dy = p.y - s.y;
  const d = Math.hypot(dx, dy);
  const magnetR = 110 * p.magnet;
  if (d < magnetR && d > 1) {
    const pull = (1 - d / magnetR) * 620;
    s.x += (dx / d) * pull * dt;
    s.y += (dy / d) * pull * dt;
  }
  return time;
}

export function updateAsteroid(a, dt, w, h) {
  a.x += a.vx * dt;
  a.y += a.vy * dt;
  a.rot += a.spin * dt;
  // Drift off one edge, come back on the opposite one.
  if (a.x < -70) a.x = w + 60;
  if (a.x > w + 70) a.x = -60;
  if (a.y < -70) a.y = h + 60;
  if (a.y > h + 70) a.y = -60;
}

export function updateMine(m, p, dt, w, h) {
  m.phase += dt * 3;
  const dx = p.x - m.x;
  const dy = p.y - m.y;
  const d = Math.hypot(dx, dy);
  if (d < 260 && d > 1) {
    m.vx += (dx / d) * m.chase * 60 * dt;
    m.vy += (dy / d) * m.chase * 60 * dt;
  }
  const sp = Math.hypot(m.vx, m.vy);
  if (sp > 95) {
    m.vx = (m.vx / sp) * 95;
    m.vy = (m.vy / sp) * 95;
  }
  m.x += m.vx * dt;
  m.y += m.vy * dt;
  if (m.x < m.r) m.vx = Math.abs(m.vx);
  if (m.x > w - m.r) m.vx = -Math.abs(m.vx);
  if (m.y < m.r + 44) m.vy = Math.abs(m.vy);
  if (m.y > h - m.r) m.vy = -Math.abs(m.vy);
}

export function updateParticles(list, dt) {
  for (let i = list.length - 1; i >= 0; i -= 1) {
    const pt = list[i];
    pt.life -= dt;
    if (pt.life <= 0) {
      list.splice(i, 1);
      continue;
    }
    pt.x += pt.vx * dt;
    pt.y += pt.vy * dt;
    pt.vx *= 0.98;
    pt.vy *= 0.98;
  }
  if (list.length > PARTICLE_MAX) list.splice(0, list.length - PARTICLE_MAX);
}

export function updateFloaters(list, dt) {
  for (let i = list.length - 1; i >= 0; i -= 1) {
    const f = list[i];
    f.life -= dt;
    f.y -= 46 * dt;
    if (f.life <= 0) list.splice(i, 1);
  }
}

export function circlesHit(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const r = a.r + b.r;
  return dx * dx + dy * dy < r * r;
}
