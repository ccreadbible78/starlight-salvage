// Starlight Salvage — tuning constants. One place for every number the
// designers (us) tweak: speeds, scores, wave shape, upgrade strengths.
export const STEP = 1 / 60;
export const BEST_KEY = 'starlight-salvage-best';

// Playfield is the canvas itself; the game adapts to the window size.
export const PLAYER_RADIUS = 16;
export const PLAYER_THRUST = 2600; // px/s^2 keyboard acceleration
export const PLAYER_MAX_SPEED = 420; // px/s
export const PLAYER_DRAG = 3.2; // 1/s velocity damping
export const MOUSE_FOLLOW = 9.0; // steering strength toward the cursor

export const DASH_SPEED = 950;
export const DASH_TIME = 0.18; // seconds of dash
export const DASH_COOLDOWN = 2.2; // seconds between dashes
export const DASH_INVULN = 0.35; // brief grace while dashing

export const HULL_MAX = 3;
export const HULL_CAP = 5;
export const HIT_INVULN = 1.6; // seconds of mercy after a hit

export const COMBO_WINDOW = 2.5; // seconds to keep a chain alive
export const COMBO_MAX_MULT = 5;
export const SHARD_SCORE = 10;
export const GOLD_SHARD_SCORE = 50;
export const GOLD_CHANCE = 0.12;
export const WAVE_CLEAR_BONUS = 100;

// A wave: how many shards finish it, and what drifts in the field.
export const WAVES = [
  { quota: 8, asteroids: 5, mines: 0, splitters: 0, speed: 42, spawnEvery: 1.6 },
  { quota: 10, asteroids: 7, mines: 0, splitters: 0, speed: 50, spawnEvery: 1.5 },
  { quota: 12, asteroids: 8, mines: 2, splitters: 0, speed: 58, spawnEvery: 1.4 },
  { quota: 14, asteroids: 10, mines: 3, splitters: 0, speed: 66, spawnEvery: 1.3 },
  { quota: 16, asteroids: 10, mines: 3, splitters: 2, speed: 74, spawnEvery: 1.2 },
  { quota: 18, asteroids: 12, mines: 4, splitters: 3, speed: 82, spawnEvery: 1.1 },
  { quota: 20, asteroids: 13, mines: 5, splitters: 4, speed: 90, spawnEvery: 1.0 },
  { quota: 24, asteroids: 15, mines: 6, splitters: 5, speed: 100, spawnEvery: 0.9 },
];
export const TOTAL_WAVES = WAVES.length;

// Power-ups that drift in rarely: kind, chance per shard spawn, duration.
export const POWERUP_CHANCE = 0.06;
export const POWERUP_DURATION = 10; // seconds for timed effects

// Visual tuning.
export const STAR_COUNT = 130;
export const PARTICLE_MAX = 420;
export const SHAKE_MAX = 14; // px of screen shake on a hard hit
export const FLOATER_RISE = 46; // px a floating score text climbs
