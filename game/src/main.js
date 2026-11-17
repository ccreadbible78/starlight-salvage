// Starlight Salvage — boot and the one loop: input is read every frame,
// the world advances in fixed 1/60 s steps, and the renderer paints what
// is there. Screens: title, play, upgrade, paused, victory, game over.
//
// ?seed=N fixes the field. ?shot=start|play|upgrade|victory|end (with
// &seed=N) stages that scene instead of running the loop, paints it twice
// and sets window.__shotReady for a screenshot. ?selftest=1 plays a
// scripted run in the browser and writes the result into #test-result.
import {
  BEST_KEY,
  COMBO_MAX_MULT,
  COMBO_WINDOW,
  DASH_COOLDOWN,
  HIT_INVULN,
  POWERUP_DURATION,
  SHAKE_MAX,
  STEP,
  TOTAL_WAVES,
  WAVE_CLEAR_BONUS,
} from './config.js';
import { createRandom } from './random.js';
import { createAudio } from './audio.js';
import {
  ACTION_CONFIRM,
  ACTION_DASH,
  ACTION_MUTE,
  ACTION_PAUSE,
  ACTION_RESTART,
  createInput,
} from './input.js';
import {
  circlesHit,
  createFloater,
  createParticle,
  createPlayer,
  tryDash,
  updateAsteroid,
  updateFloaters,
  updateMine,
  updateParticles,
  updatePlayer,
  updateShard,
} from './entities.js';
import { drawUpgrades, spawnWave, trickleSpawn, waveDef } from './waves.js';
import {
  SCREEN_OVER,
  SCREEN_PAUSED,
  SCREEN_PLAY,
  SCREEN_TITLE,
  SCREEN_UPGRADE,
  SCREEN_VICTORY,
  createRenderer,
} from './render.js';
import { stageShot } from './shots.js';

const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);
const selftest = params.get('selftest') === '1';

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const testResult = document.getElementById('test-result');
const rng = createRandom(seed);
const audio = createAudio();
const renderer = createRenderer(canvas);

// --- world + run state ------------------------------------------------------

function freshWorld() {
  return {
    player: createPlayer(renderer.w / 2, renderer.h * 0.62),
    shards: [],
    asteroids: [],
    mines: [],
    powerups: [],
    particles: [],
    floaters: [],
  };
}

const run = {
  screen: SCREEN_TITLE,
  world: freshWorld(),
  score: 0,
  best: 0,
  wave: 1,
  collected: 0,
  quota: 0,
  combo: 0,
  comboTime: 0,
  totalShards: 0,
  totalHits: 0,
  slowTime: 0,
  doubleTime: 0,
  trickle: 0,
  banner: null,
  bannerLife: 0,
  shake: 0,
  time: 0,
  choices: [],
  choiceRects: [],
  waveBonus: 0,
};

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off: the best score then lasts this visit only.
  }
}

function effectsText() {
  const out = [];
  if (run.slowTime > 0) out.push(`SLOW ${Math.ceil(run.slowTime)}s`);
  if (run.doubleTime > 0) out.push(`DOUBLE ×2 ${Math.ceil(run.doubleTime)}s`);
  if (run.world.player.shield) out.push('SHIELD');
  return out;
}

function view() {
  return {
    screen: run.screen,
    world: run.world,
    player: run.world.player,
    score: run.score,
    best: run.best,
    wave: run.wave,
    collected: run.collected,
    quota: run.quota,
    combo: run.combo,
    comboTime: run.comboTime,
    choices: run.choices,
    choiceRects: run.choiceRects,
    effects: effectsText(),
    time: run.time,
    shake: run.shake,
    banner: run.banner,
    bannerLife: run.bannerLife,
    totalShards: run.totalShards,
    totalHits: run.totalHits,
    waveBonus: run.waveBonus,
  };
}

function announce(text) {
  status.textContent = text;
}

// --- run flow ---------------------------------------------------------------

function startWave(n) {
  const field = spawnWave(rng, n, renderer.w, renderer.h);
  run.world.shards = field.shards;
  run.world.asteroids = field.asteroids;
  run.world.mines = field.mines;
  run.world.powerups = field.powerups;
  run.quota = field.quota;
  run.collected = 0;
  run.trickle = 0;
  run.banner = `WAVE ${n}`;
  run.bannerLife = 1.6;
}

function startRun() {
  run.world = freshWorld();
  run.score = 0;
  run.wave = 1;
  run.combo = 0;
  run.comboTime = 0;
  run.totalShards = 0;
  run.totalHits = 0;
  run.slowTime = 0;
  run.doubleTime = 0;
  run.shake = 0;
  run.choices = [];
  startWave(1);
  run.screen = SCREEN_PLAY;
  announce('Wave 1. Collect the star shards, dodge the rocks.');
}

function waveClear() {
  const bonus = WAVE_CLEAR_BONUS + 25 * run.wave;
  run.score += bonus;
  run.waveBonus = bonus;
  audio.waveClear();
  if (run.wave >= TOTAL_WAVES) {
    run.screen = SCREEN_VICTORY;
    if (run.score > run.best) {
      run.best = run.score;
      saveBest(run.best);
    }
    audio.victory();
    announce(`You win! Final score ${run.score}. Press R to fly again.`);
    return;
  }
  run.choices = drawUpgrades(rng, run.world.player);
  run.screen = SCREEN_UPGRADE;
  announce(`Wave ${run.wave} clear! Bonus ${bonus}. Choose an upgrade.`);
}

function chooseUpgrade(i) {
  const choice = run.choices[i];
  if (!choice) return;
  choice.apply(run.world.player);
  audio.powerup();
  run.wave += 1;
  startWave(run.wave);
  run.screen = SCREEN_PLAY;
  announce(`Wave ${run.wave}. Quota: ${run.quota} shards.`);
}

function damagePlayer() {
  const p = run.world.player;
  if (p.invuln > 0 || run.screen !== SCREEN_PLAY) return false;
  if (p.shield) {
    p.shield = false;
    p.invuln = 1.2;
    audio.shieldBreak();
    run.world.floaters.push(createFloater(p.x, p.y - 30, 'SHIELD!', '#7fb2ff'));
    return true;
  }
  p.hull -= 1;
  run.totalHits += 1;
  run.combo = 0;
  run.comboTime = 0;
  run.shake = SHAKE_MAX;
  p.invuln = HIT_INVULN;
  audio.hit();
  run.world.particles.push(
    ...createParticle(p.x, p.y, '#ff4d5e', 26, 260, 0.8),
    ...createParticle(p.x, p.y, '#ffb347', 14, 180, 0.6),
  );
  if (p.hull <= 0) {
    run.screen = SCREEN_OVER;
    if (run.score > run.best) {
      run.best = run.score;
      saveBest(run.best);
    }
    audio.gameOver();
    announce(`Drone down on wave ${run.wave}. Score ${run.score}. Press R to try again.`);
  }
  return true;
}

function collectShard(s) {
  const mult = Math.min(COMBO_MAX_MULT, Math.max(1, run.combo + 1));
  const timed = run.doubleTime > 0 ? 2 : 1;
  const points = Math.round(s.value * mult * run.world.player.scoreMult * timed);
  run.score += points;
  run.combo += 1;
  run.comboTime = COMBO_WINDOW;
  run.collected += 1;
  run.totalShards += 1;
  run.world.particles.push(...createParticle(s.x, s.y, s.gold ? '#ffc95e' : '#39e6c3', 12, 160, 0.6));
  run.world.floaters.push(
    createFloater(s.x, s.y - 14, `+${points}`, s.gold ? '#ffc95e' : '#39e6c3'),
  );
  if (s.gold) audio.gold();
  else audio.pickup(run.combo);
  if (run.collected >= run.quota) waveClear();
}

function collectPowerup(pu) {
  const p = run.world.player;
  if (pu.power === 'shield') p.shield = true;
  if (pu.power === 'slow') run.slowTime = POWERUP_DURATION;
  if (pu.power === 'double') run.doubleTime = POWERUP_DURATION;
  audio.powerup();
  run.world.floaters.push(
    createFloater(pu.x, pu.y - 16, pu.power === 'shield' ? 'SHIELD!' : pu.power === 'slow' ? 'SLOW!' : 'DOUBLE!', '#ffc95e'),
  );
  run.world.particles.push(...createParticle(pu.x, pu.y, '#ffc95e', 16, 180, 0.7));
}

// --- per-step update ---------------------------------------------------------

function update(dt) {
  run.time += dt;
  const w = renderer.w;
  const h = renderer.h;
  const world = run.world;
  const p = world.player;

  if (run.shake > 0) run.shake = Math.max(0, run.shake - dt * 40);
  if (run.bannerLife > 0) run.bannerLife -= dt;
  if (run.slowTime > 0) run.slowTime -= dt;
  if (run.doubleTime > 0) run.doubleTime -= dt;
  if (run.comboTime > 0) {
    run.comboTime -= dt;
    if (run.comboTime <= 0) run.combo = 0;
  }
  updateParticles(world.particles, dt);
  updateFloaters(world.floaters, dt);

  if (run.screen !== SCREEN_PLAY) return;

  updatePlayer(p, input, dt, w, h);
  const hazardDt = run.slowTime > 0 ? dt * 0.5 : dt;
  for (const s of world.shards) updateShard(s, p, dt, run.time);
  for (const a of world.asteroids) updateAsteroid(a, hazardDt, w, h);
  for (const m of world.mines) updateMine(m, p, hazardDt, w, h);
  for (const pu of world.powerups) {
    pu.phase += dt * 2;
    pu.x += pu.vx * dt;
    pu.y += pu.vy * dt;
  }

  // Trickle: keep the field stocked while the wave runs.
  run.trickle += dt;
  const def = waveDef(run.wave);
  if (run.trickle >= def.spawnEvery && world.shards.length < run.quota + 4) {
    run.trickle = 0;
    trickleSpawn(rng, world, w, h);
  }

  // Pickups.
  for (let i = world.shards.length - 1; i >= 0; i -= 1) {
    if (circlesHit(p, world.shards[i])) {
      collectShard(world.shards[i]);
      world.shards.splice(i, 1);
      if (run.screen !== SCREEN_PLAY) return;
    }
  }
  for (let i = world.powerups.length - 1; i >= 0; i -= 1) {
    if (circlesHit(p, world.powerups[i])) {
      collectPowerup(world.powerups[i]);
      world.powerups.splice(i, 1);
    }
  }
  // Hazards.
  for (const a of world.asteroids) {
    if (circlesHit(p, a)) {
      if (damagePlayer()) {
        // Shove the rock away so it cannot hit twice in a row.
        a.vx = -a.vx * 1.4;
        a.vy = -a.vy * 1.4;
      }
      if (run.screen !== SCREEN_PLAY) return;
    }
  }
  for (let i = world.mines.length - 1; i >= 0; i -= 1) {
    if (circlesHit(p, world.mines[i])) {
      if (damagePlayer()) {
        world.particles.push(...createParticle(world.mines[i].x, world.mines[i].y, '#ff4d5e', 30, 300, 0.9));
        world.mines.splice(i, 1);
      }
      if (run.screen !== SCREEN_PLAY) return;
    }
  }
}

// --- input routing -----------------------------------------------------------

function handleActions(actions) {
  for (const action of actions) {
    if (action === ACTION_MUTE) {
      audio.toggleMute();
      continue;
    }
    if (action === ACTION_DASH && run.screen === SCREEN_PLAY) {
      if (tryDash(run.world.player, input)) audio.dash();
      continue;
    }
    if (action === ACTION_PAUSE) {
      if (run.screen === SCREEN_PLAY) {
        run.screen = SCREEN_PAUSED;
        announce('Paused.');
      } else if (run.screen === SCREEN_PAUSED) {
        run.screen = SCREEN_PLAY;
        announce('Resumed.');
      }
      continue;
    }
    if (action === ACTION_RESTART) {
      if (run.screen !== SCREEN_TITLE) startRun();
      continue;
    }
    if (action === ACTION_CONFIRM) {
      audio.unlock();
      if (run.screen === SCREEN_TITLE) startRun();
      else if (run.screen === SCREEN_PAUSED) run.screen = SCREEN_PLAY;
      else if (run.screen === SCREEN_VICTORY || run.screen === SCREEN_OVER) startRun();
      continue;
    }
    if (action === 'upgrade1' || action === 'upgrade2' || action === 'upgrade3') {
      if (run.screen === SCREEN_UPGRADE) {
        chooseUpgrade(Number(action.slice(-1)) - 1);
      }
    }
  }
}

function handleClicks(clicks) {
  for (const click of clicks) {
    audio.unlock();
    if (run.screen === SCREEN_TITLE) {
      startRun();
      return;
    }
    if (run.screen === SCREEN_UPGRADE) {
      for (const rect of run.choiceRects) {
        if (
          click.x >= rect.x &&
          click.x <= rect.x + rect.w &&
          click.y >= rect.y &&
          click.y <= rect.y + rect.h
        ) {
          chooseUpgrade(rect.index);
          return;
        }
      }
      return;
    }
    if (run.screen === SCREEN_PAUSED) {
      run.screen = SCREEN_PLAY;
      return;
    }
    if (run.screen === SCREEN_VICTORY || run.screen === SCREEN_OVER) {
      startRun();
      return;
    }
    if (run.screen === SCREEN_PLAY) {
      if (tryDash(run.world.player, input)) audio.dash();
    }
  }
}

// --- boot --------------------------------------------------------------------

run.best = readBest();
const input = createInput(canvas);

function runShot(name) {
  const scene = stageShot(name, run.world, rng, renderer.w, renderer.h);
  // stageShot fills the shared world; adopt its view values.
  run.screen = scene.screen;
  run.score = scene.score;
  run.best = scene.best;
  run.wave = scene.wave;
  run.collected = scene.collected;
  run.quota = scene.quota;
  run.combo = scene.combo;
  run.comboTime = scene.comboTime;
  run.choices = scene.choices;
  run.choiceRects = scene.choiceRects;
  run.waveBonus = scene.waveBonus;
  run.totalShards = scene.totalShards;
  run.totalHits = scene.totalHits;
  run.time = scene.time;
  run.banner = scene.banner;
  run.bannerLife = scene.bannerLife;
  let painted = 0;
  function paint() {
    const v = view();
    run.choiceRects = v.choiceRects;
    renderer.draw(v);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  let accumulator = 0;
  let last = performance.now();
  function frame(now) {
    const elapsed = Math.min(MAX_FRAME, (now - last) / 1000);
    last = now;
    handleActions(input.takePressed());
    handleClicks(input.takeClicks());
    accumulator += elapsed;
    while (accumulator >= STEP) {
      update(STEP);
      accumulator -= STEP;
    }
    renderer.draw(view());
    if (selftest) driveSelftest();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

// --- scripted playthrough (?selftest=1) ---------------------------------------
// Drives the real game through real input events: starts, steers the drone
// to the nearest shard with the mouse, dashes once, pauses and resumes,
// clears a wave, picks an upgrade, then forces three real hits and a
// restart. Writes the observed result into #test-result.
const test = {
  phase: 'start',
  started: false,
  dashWorked: false,
  dashTried: false,
  pausedSeen: false,
  pauseStep: 0,
  waveReached: 1,
  scoreMax: 0,
  upgradeSeen: false,
  upgradePressed: false,
  gameOverSeen: false,
  restarted: false,
  restartPressed: false,
  hits: 0,
  done: false,
  t: 0,
};

function nearestShard() {
  let bestShard = null;
  let bestD = Infinity;
  for (const s of run.world.shards) {
    const d = Math.hypot(s.x - run.world.player.x, s.y - run.world.player.y);
    if (d < bestD) {
      bestD = d;
      bestShard = s;
    }
  }
  return bestShard;
}

function finishSelftest(note) {
  if (test.done) return;
  test.done = true;
  const result = {
    ok:
      test.started &&
      test.scoreMax > 0 &&
      test.waveReached >= 2 &&
      test.upgradeSeen &&
      test.gameOverSeen &&
      test.restarted &&
      test.pausedSeen &&
      test.dashWorked,
    note,
    started: test.started,
    dashWorked: test.dashWorked,
    pausedSeen: test.pausedSeen,
    scoreMax: test.scoreMax,
    waveReached: test.waveReached,
    upgradeSeen: test.upgradeSeen,
    gameOverSeen: test.gameOverSeen,
    restarted: test.restarted,
    finalScreen: run.screen,
    finalScore: run.score,
  };
  testResult.textContent = JSON.stringify(result);
  window.__selftestDone = true;
  window.__selftest = result;
  console.log('SELFTEST', JSON.stringify(result));
}

function driveSelftest() {
  if (test.done) return;
  test.t += STEP;
  test.scoreMax = Math.max(test.scoreMax, run.score);
  test.waveReached = Math.max(test.waveReached, run.wave);

  if (test.phase === 'start') {
    if (test.t > 0.5) {
      input.pressKey('Enter');
      test.phase = 'play';
      test.t = 0;
    }
    return;
  }
  if (test.phase === 'play') {
    if (run.screen === SCREEN_PLAY) test.started = true;
    if (run.screen === SCREEN_UPGRADE) {
      test.upgradeSeen = true;
      test.phase = 'upgrade';
      test.t = 0;
      return;
    }
    // Pause resume check: must run whatever the screen is, because once
    // paused the steering block below is skipped entirely.
    if (test.pauseStep === 1) {
      if (run.screen === SCREEN_PAUSED) {
        test.pausedSeen = true;
        input.pressKey('KeyP');
        test.pauseStep = 2;
      } else {
        test.pauseStep = 0;
      }
    } else if (run.screen === SCREEN_PLAY) {
      const s = nearestShard();
      if (s) input.steerTo(s.x, s.y);
      // Dash: press once, confirm on a later frame (actions drain next frame).
      if (!test.dashTried && test.t > 1) {
        input.pressKey('ShiftLeft');
        test.dashTried = true;
      } else if (test.dashTried && !test.dashWorked) {
        if (run.world.player.dashCd > 0.3 || run.world.player.dashTime > 0) {
          test.dashWorked = true;
        }
      }
      // Pause: press, confirm paused next frame, press again to resume.
      // Early (t > 1.5) so the wave cannot clear first and skip the check.
      if (!test.pausedSeen && test.t > 1.5 && !test.pauseStep) {
        input.pressKey('KeyP');
        test.pauseStep = 1;
      }
    }
    if (test.t > 60) finishSelftest('timeout in play');
    return;
  }
  if (test.phase === 'upgrade') {
    if (test.t > 0.4 && !test.upgradePressed) {
      input.pressKey('Digit1');
      test.upgradePressed = true;
    } else if (test.upgradePressed && run.screen === SCREEN_PLAY) {
      test.phase = 'force-hits';
      test.t = 0;
    } else if (test.t > 5) {
      finishSelftest('upgrade choice did not resume play');
    }
    return;
  }
  if (test.phase === 'force-hits') {
    if (run.screen !== SCREEN_PLAY) {
      if (test.t > 2) finishSelftest('not in play for force-hits');
      return;
    }
    // Three real hits through damagePlayer(), mercy time cleared between.
    const p = run.world.player;
    p.invuln = 0;
    p.shield = false;
    if (damagePlayer()) test.hits += 1;
    if (run.screen === SCREEN_OVER) {
      test.gameOverSeen = true;
      test.phase = 'restart';
      test.t = 0;
    } else if (test.t > 5) {
      finishSelftest('could not reach game over');
    }
    return;
  }
  if (test.phase === 'restart') {
    if (test.t > 0.5 && !test.restartPressed) {
      input.pressKey('KeyR');
      test.restartPressed = true;
    } else if (test.restartPressed) {
      test.restarted = run.screen === SCREEN_PLAY && run.score === 0 && run.wave === 1;
      finishSelftest(test.restarted ? 'pass' : 'restart failed');
    }
  }
}

if (shot) runShot(shot);
else runGame();

// Read-only handle for automated checks (screenshots, self-test): the
// current screen and run totals, nothing that plays the game by itself.
Object.defineProperty(window, '__game', {
  get() {
    return { screen: run.screen, score: run.score, wave: run.wave, hull: run.world.player.hull };
  },
});
