// Starlight Salvage — what each wave throws at the player, and the three
// upgrade cards offered between waves. The wave table lives in config.js;
// this file turns a wave number into a field, and a random draw into a
// choice the player actually makes.
import { POWERUP_CHANCE, WAVES } from './config.js';
import { createAsteroid, createMine, createPowerup, createShard } from './entities.js';

export function waveDef(n) {
  return WAVES[Math.min(n - 1, WAVES.length - 1)];
}

// Fill the field for wave n: the quota of shards, its asteroids, mines
// and splitters (small fast asteroids), plus a rare power-up.
export function spawnWave(rng, n, w, h) {
  const def = waveDef(n);
  const shards = [];
  for (let i = 0; i < def.quota + 2; i += 1) shards.push(createShard(rng, w, h));
  const asteroids = [];
  for (let i = 0; i < def.asteroids; i += 1) {
    asteroids.push(createAsteroid(rng, w, h, def.speed, true));
  }
  for (let i = 0; i < def.splitters; i += 1) {
    asteroids.push(createAsteroid(rng, w, h, def.speed * 1.5, false));
  }
  const mines = [];
  for (let i = 0; i < def.mines; i += 1) mines.push(createMine(rng, w, h));
  const powerups = [];
  if (rng.chance(POWERUP_CHANCE * 4)) powerups.push(createPowerup(rng, w, h));
  return { shards, asteroids, mines, powerups, quota: def.quota };
}

// One extra shard drifts in while the wave runs, so the field never runs
// dry before the quota is met. Sometimes it is a power-up instead.
export function trickleSpawn(rng, world, w, h) {
  if (rng.chance(POWERUP_CHANCE)) world.powerups.push(createPowerup(rng, w, h));
  else world.shards.push(createShard(rng, w, h));
}

// --- upgrades -------------------------------------------------------------

export const UPGRADE_DEFS = [
  {
    id: 'magnet',
    name: 'Long-Range Magnet',
    desc: 'Pickup radius +45%. Shards fly to you from farther away.',
    apply(p) {
      p.magnet *= 1.45;
    },
  },
  {
    id: 'hull',
    name: 'Reinforced Hull',
    desc: 'Repair +1 hull, and raise max hull by 1 (up to 5).',
    apply(p) {
      p.maxHull = Math.min(5, p.maxHull + 1);
      p.hull = Math.min(p.maxHull, p.hull + 1);
    },
  },
  {
    id: 'dash',
    name: 'Ion Dash Coils',
    desc: 'Dash recharges 30% faster. Dash through danger more often.',
    apply(p) {
      p.dashCdMax = (p.dashCdMax ?? 2.2) * 0.7;
    },
  },
  {
    id: 'lucky',
    name: 'Lucky Charm',
    desc: 'All points +25%. Combos pay out even more.',
    apply(p) {
      p.scoreMult *= 1.25;
    },
  },
  {
    id: 'aegis',
    name: 'Aegis Shield',
    desc: 'Gain a shield that absorbs the next hit, free of charge.',
    apply(p) {
      p.shield = true;
    },
  },
];

// Three different cards, drawn at random, skipping ones that stopped
// mattering (a second shield while one is already up).
export function drawUpgrades(rng, player) {
  const pool = UPGRADE_DEFS.filter((u) => !(u.id === 'aegis' && player.shield));
  const picked = [];
  const bag = [...pool];
  while (picked.length < 3 && bag.length > 0) {
    const i = Math.floor(rng.next() * bag.length);
    picked.push(bag.splice(i, 1)[0]);
  }
  return picked;
}
