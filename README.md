# Starlight Salvage

An original arcade game for the [make.fun "Make the best game" bounty](https://make.fun/bounty/best-game-01): pilot a salvage drone through the drift, collect star shards, dodge tumbling asteroids, outrun chasing mines, and clear all 8 waves. Between waves, pick one of three upgrades — a long-range magnet, a reinforced hull, faster dash coils, a lucky charm, or an Aegis shield.

- **Goal:** collect each wave's quota of shards. Clear wave 8 to win; lose all hull to lose.
- **Controls:** mouse or WASD / arrow keys to fly, Shift or click to dash, P to pause, M to mute, R to restart.
- **Scoring:** shards pay 10 points (gold shards 50), chained pickups build a combo multiplier up to ×5, wave-clear bonuses grow per wave. Best score is kept locally.
- **Feel:** synthesised WebAudio effects and a soft ambient loop (no audio files), particles, screen shake, floating score text, a parallax starfield and nebula — all drawn in Canvas 2D, all art and sound original.
- **Tech:** plain static files under `game/` — no build step, no network request, no library. Opens in desktop Chrome from any static server.

## Run it locally

```sh
node serve.ts        # serves game/ at http://localhost:8080
```

Or any static server pointed at `game/`. Node 22.18+ is enough; nothing to install.

## Screenshots

`shots.json` lists the four staged shots (`?shot=start|play|upgrade|victory&seed=7`); `screenshots/` holds the captures taken in headless Chrome from the game's own code.

## Hand in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts   # writes out/dossier.json
```

`main.ts` (Node 22, standard library only) copies `game/` and `screenshots/` to `/output` and writes `dossier.json` with the vendored `vendor/makefun-game.ts` library, which is the kit's copy unchanged.

## Files

| File | Job |
| --- | --- |
| `game/index.html` | Page, canvas, status line |
| `game/src/main.js` | Boot, loop, state machine, scoring, self-test |
| `game/src/config.js` | Every tuning number |
| `game/src/random.js` | Seeded RNG |
| `game/src/audio.js` | Synthesised sound effects + ambient loop |
| `game/src/input.js` | Keyboard + mouse |
| `game/src/entities.js` | Drone, shards, asteroids, mines, particles |
| `game/src/waves.js` | Wave contents + upgrade cards |
| `game/src/render.js` | All drawing: field, HUD, menus |
| `game/src/shots.js` | Deterministic staged scenes for screenshots |

## License

MIT — see `LICENSE`.
