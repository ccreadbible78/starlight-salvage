// Starlight Salvage — deterministic staged scenes for screenshots.
// ?shot=start|play|upgrade|victory (with &seed=N) paints one scene and
// sets window.__shotReady, so a headless browser can capture the real
// game at its best: title, mid-play with HUD, upgrade choice, victory.
import { createPlayer, createShard, createAsteroid, createMine } from './entities.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, SCREEN_UPGRADE, SCREEN_VICTORY } from './render.js';
import { UPGRADE_DEFS, waveDef } from './waves.js';

function baseWorld(seed, w, h) {
  return {
    player: createPlayer(w / 2, h * 0.62),
    shards: [],
    asteroids: [],
    mines: [],
    powerups: [],
    particles: [],
    floaters: [],
    seed,
  };
}

// Staged asteroids spawn at the field's edges (they drift in during real
// play); a screenshot needs them visible, so pull them in-bounds.
function pullAsteroidsIn(world, rng, w, h) {
  for (const a of world.asteroids) {
    a.x = rng.range(90, w - 90);
    a.y = rng.range(110, h - 90);
  }
}

// On menu screens the drone sits behind the text; park it in a corner.
function parkPlayer(world, w, h) {
  world.player.x = w * 0.88;
  world.player.y = h * 0.82;
  world.player.vx = 0;
  world.player.vy = 0;
  world.player.trail = [];
}

export function stageShot(name, world, rng, w, h) {
  const view = {
    screen: SCREEN_TITLE,
    world,
    player: world.player,
    score: 0,
    best: 1250,
    wave: 1,
    collected: 0,
    quota: 8,
    combo: 0,
    comboTime: 0,
    choices: [],
    choiceRects: [],
    effects: [],
    time: 3.2,
    shake: 0,
    banner: null,
    bannerLife: 0,
    totalShards: 0,
    totalHits: 0,
    waveBonus: 0,
  };

  if (name === 'start') {
    view.screen = SCREEN_TITLE;
    view.best = 3420;
    parkPlayer(world, w, h);
    world.player.x = w * 0.12;
    world.player.y = h * 0.22;
    for (let i = 0; i < 7; i += 1) world.shards.push(createShard(rng, w, h));
    for (let i = 0; i < 3; i += 1) world.asteroids.push(createAsteroid(rng, w, h, 40, true));
    pullAsteroidsIn(world, rng, w, h);
    return view;
  }

  if (name === 'play') {
    view.screen = SCREEN_PLAY;
    view.score = 1870;
    view.best = 3420;
    view.wave = 3;
    view.collected = 7;
    view.quota = waveDef(3).quota;
    view.combo = 4;
    view.comboTime = 1.8;
    view.totalShards = 31;
    view.totalHits = 1;
    view.player.hull = 2;
    view.player.dashCd = 0.6;
    view.player.dashCdMax = 2.2;
    view.banner = 'WAVE 3';
    view.bannerLife = 1;
    for (let i = 0; i < 9; i += 1) world.shards.push(createShard(rng, w, h));
    for (let i = 0; i < 6; i += 1) world.asteroids.push(createAsteroid(rng, w, h, 58, true));
    pullAsteroidsIn(world, rng, w, h);
    world.mines.push(createMine(rng, w, h));
    world.floaters.push({ x: w / 2 + 60, y: h * 0.4, text: '+40', color: '#39e6c3', life: 0.8, maxLife: 1.1 });
    world.particles.push(
      { x: w / 2 - 80, y: h * 0.5, vx: 20, vy: -30, life: 0.5, maxLife: 0.7, size: 3, color: '#39e6c3' },
      { x: w / 2 - 80, y: h * 0.5, vx: -25, vy: 10, life: 0.5, maxLife: 0.7, size: 2.5, color: '#ffc95e' },
      { x: w / 2 - 80, y: h * 0.5, vx: 5, vy: 40, life: 0.4, maxLife: 0.7, size: 2, color: '#39e6c3' },
    );
    return view;
  }

  if (name === 'upgrade') {
    view.screen = SCREEN_UPGRADE;
    view.score = 2140;
    view.best = 3420;
    view.wave = 2;
    view.waveBonus = 150;
    view.collected = 12;
    view.quota = 12;
    view.totalShards = 22;
    view.player.hull = 3;
    view.choices = [UPGRADE_DEFS[0], UPGRADE_DEFS[1], UPGRADE_DEFS[3]];
    parkPlayer(world, w, h);
    for (let i = 0; i < 5; i += 1) world.shards.push(createShard(rng, w, h));
    for (let i = 0; i < 3; i += 1) world.asteroids.push(createAsteroid(rng, w, h, 50, true));
    pullAsteroidsIn(world, rng, w, h);
    return view;
  }

  if (name === 'victory') {
    view.screen = SCREEN_VICTORY;
    view.score = 9840;
    view.best = 3420;
    view.wave = 8;
    view.totalShards = 118;
    view.totalHits = 2;
    view.player.hull = 1;
    parkPlayer(world, w, h);
    for (let i = 0; i < 10; i += 1) world.shards.push(createShard(rng, w, h));
    return view;
  }

  if (name === 'end') {
    view.screen = SCREEN_OVER;
    view.score = 4310;
    view.best = 4310;
    view.wave = 5;
    view.totalShards = 54;
    view.totalHits = 3;
    view.player.hull = 0;
    parkPlayer(world, w, h);
    for (let i = 0; i < 4; i += 1) world.shards.push(createShard(rng, w, h));
    for (let i = 0; i < 3; i += 1) world.asteroids.push(createAsteroid(rng, w, h, 74, true));
    pullAsteroidsIn(world, rng, w, h);
    return view;
  }

  return view;
}
