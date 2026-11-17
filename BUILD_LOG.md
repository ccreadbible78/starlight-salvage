# BUILD LOG — Starlight Salvage (make.fun best-game-01)

Built: 2026-11-17 01:17–02:00 UTC by the Muse agent session below, from the
parent agent's brief. No wallet was created, no account was registered, no
submission was made, no money was spent. The game is built to a submittable
state; submission is the user's decision (see "Still missing").

## The game

**Starlight Salvage** — an original arcade game. Pilot a salvage drone
through the drift: collect star shards, dodge tumbling asteroids, outrun
chasing mines, clear all 8 waves to win. Between waves, pick 1 of 3 upgrade
cards (magnet / hull / dash coils / lucky charm / Aegis shield). Combo
multiplier up to ×5, gold shards worth 50, dash with cooldown, hull hearts,
pause, restart, best score kept locally, synthesised WebAudio SFX + ambient
loop. All art, sound, names and code are original; no library, no images, no
audio files, no network requests.

- Controls: mouse or WASD/arrows to fly, Shift or click to dash, P pause,
  M mute, R restart, 1/2/3 to pick an upgrade.
- Win: clear wave 8. Lose: hull reaches 0. Score, wave quota, hull, combo
  and dash cooldown are all on the HUD.

## Build steps (every command, in order)

1. Read the bounty:
   - `GET https://make.fun/api/competitions/best-game-01/requirements`
     (via browser.open) and the kit's `RULES.txt`.
   - `curl -sSL "https://make.fun/skill.md" -o skill.md` (971 lines; read
     the README/submission sections).
2. Fetch the kit:
   - `curl -sSL "https://make.fun/c/best-game-01/kit" -o kit.tar.gz`
     (5,551,038 bytes) then `tar xzf kit.tar.gz` → `best-game-01-kit/`.
   - Verified `vendor/makefun-game.ts` copied verbatim: sha256
     `dc67187521b24025ff952f8c231485a6eb92d6d71d29edd2a08154ffb4376129`
     matches `kit.json`.
3. Wrote the game by hand (agent-authored, this session), file by file:
   `game/index.html`, `game/src/config.js`, `random.js`, `audio.js`,
   `input.js`, `entities.js`, `waves.js`, `render.js`, `shots.js`,
   `main.js`. Plus `main.ts` (entrypoint), `serve.ts` (kit's, dev only),
   `LICENSE` (MIT, kit's), `shots.json`, `README.md`, `.gitignore`.
4. Syntax check: `node --check` on every `game/src/*.js` as `.mjs` — all pass.
5. Logic test (DOM-free modules, Node): `/tmp/logic-test.mjs` —
   **52 passed, 0 failed** (wave tables, upgrades, dash, steering,
   collisions, wrapping, seeded RNG determinism).
6. Served it: `node serve.ts --port 8080` (background). `curl` confirmed
   `200` for `/` and `/src/main.js`.
7. Browser test — the VM's Chromium (`/opt/meta-chromium/chrome`) refuses
   to start any page (`Hatch WebGL domain policy is required for browser
   startup`, exit 13, no output, in every flag combination tried), so:
   `npx -y playwright@1.49.1 install chromium` (downloaded Chromium Headless
   Shell 131.0.6778.33 to `~/.cache/ms-playwright/`) + `npm install
   playwright@1.49.1 --no-save` in `/tmp`, then drove it with
   `/tmp/pw-drive.mjs`.
8. In-browser self-test (`?selftest=1`, real input events driving the real
   loop): first run `ok: true` except pause untested (wave cleared before
   the pause check); fixed the test to check pause at t>1.5 and to observe
   pause outside the play-only branch; second run regressed on a test bug
   (pause check inside the play-only branch, game stuck paused — the pause
   feature itself worked); fixed; **final run: ok, note "pass"** —
   started, dash worked, pause worked, score 785, wave 2 reached, upgrade
   picked, game over reached, restart worked (final screen play, score 0).
   Zero console errors, **zero external requests** (offline requirement
   verified by Playwright request logging).
9. Screenshots: `?shot=start|play|upgrade|victory&seed=7` via Playwright,
   `window.__shotReady` awaited, 1280×800 PNG → JPEG q85 with PIL.
   First pass: asteroids spawned off-screen in staged shots and the drone
   overlapped menu text. Fixed in `shots.js` (asteroids pulled in-bounds,
   drone parked in a corner on menu screens) and `render.js` (brighter
   asteroid colours, backing panel behind the combo/dash HUD). Re-shot and
   visually inspected all four.
10. Hand-in dry run: `MAKEFUN_OUTPUT_DIR=out node main.ts` twice —
    **deterministic** (identical dossier.json sha256
    `c582f5f7cb01d7b0a53ae7e9dee0e5dae74600bc37fe72e581d064bade288a47`),
    dossier 342,042 bytes (< 1.5 MiB cap), all 10 source files included.

## Test results (summary)

| Check | Result |
| --- | --- |
| `node --check`, 9 modules | all parse as ES modules |
| Node logic test | 52/52 pass |
| In-browser self-test (`?selftest=1`) | pass: start, dash, pause, score, wave 2, upgrade, game over, restart |
| Console errors during play | 0 |
| External network requests during play | 0 |
| `main.ts` twice | byte-identical dossier.json |
| Gate limits | game/ 10 files, 64,179 bytes (cap 993 / 48 MiB); index.html 1,068 bytes (cap 1 MiB); 4 screenshots, each 1280×800, 35–62 KiB (cap 256 KiB, long side ≤1280, short side ≥480); no symlinks; no external URLs in game/ |

## File list (the submittable repo)

Repo root is this directory. Excluded from the repo by `.gitignore`:
`best-game-01-kit/`, `kit.tar.gz`, `skill.md`, `out/`, `out2/`.

- `main.ts` — entrypoint (Node 22 stdlib only), copies game/ +
  screenshots/ to `/output`, writes `dossier.json`.
- `vendor/makefun-game.ts` — kit copy, byte-identical (sha256 above).
- `game/index.html` + `game/src/{config,random,audio,input,entities,waves,render,shots,main}.js`
- `screenshots/1-start.jpg` (62,109 B), `2-play.jpg` (42,802 B),
  `3-upgrade.jpg` (56,320 B), `4-victory.jpg` (44,503 B) — real renders,
  first by name is the cover.
- `shots.json` — the four `?shot=` URLs that stage them.
- `serve.ts` — local static server (dev convenience, kit's).
- `LICENSE` — MIT. `README.md` — game description + run/submit commands.
- `BUILD_LOG.md` — this file. `.gitignore` — keeps kit material and
  build output out of the repo.

## Transcripts (for submission)

This build ran in Muse session `0280d6b3-67ad-4bac-9f00-599d4065e393`,
started 2026-11-17T01:17:08Z — after the competition opened
(2026-11-15T18:00:00Z), so `thinking_in_window` holds. The harness's own
session log is at:

- `~/agents/agent-0280d6b3-67ad-4bac-9f00-599d4065e393/sessions/0280d6b3-67ad-4bac-9f00-599d4065e393.jsonl`
  (196 lines at time of writing; still growing while this session runs)
- Parent (assigning) session:
  `~/agents/agent-4f4ef1be-9d48-43f6-9074-87eee66b6e32/sessions/4f4ef1be-9d48-43f6-9074-87eee66b6e32.jsonl`

To bundle for submission, the parent agent runs from the unpacked kit
(`best-game-01-kit/`, `node cli/makefun.mjs bundle ...`), which discovers
Muse session files; declare harness `Muse`, provider `meta`, model
`muse-spark-1.3`. The bundle must cover the top-level session AND this
subagent session, each whole. Do NOT hand-write or summarise a session file
after the fact — the requirements reject fabricated transcripts, and a
handed-over session is ranked but takes no paid place
(`handed_over_places: none`).

## Still missing (submission is the user's decision)

1. **GitHub repository** created after the competition opened, public,
   containing this repo (minus `.gitignore` entries), with the MIT LICENSE.
   (Alternative: a source bundle via the kit's `init` — but `init` must run
   in a fresh session before any game code is written, so the GitHub route
   is the clean one for this build.)
2. **Solana wallet + make.fun account** (registration/sign-in, wallet
   linked). The entry must be signed by a wallet on the account; the prize
   (if any) is paid in USDC on Solana to that wallet. I created no wallet
   and no account, as instructed. If the repo owner differs from the
   account's GitHub login, add `.makefun/owner.json` with
   `{"wallet": "<base58 address>"}` in the first commit.
3. **README badges**: the submission check `repo_readme` requires the
   README to carry make.fun's three badges for this exact repo
   (`https://make.fun/badge/best-game-01.svg`,
   `.../badge/best-game-01/<owner>/<repo>/rank.svg`,
   `.../badge/best-game-01/<owner>/<repo>/reward.svg`), a link to a
   make.fun page, and the `{owner}`/`{repo}`/`{description}`/`{run}`/
   `{referral_code}` placeholders filled. The current README.md has none of
   that — fill it in from the requirements' `how_to_submit.readme_template`
   once the repo exists. (Also note: the skill's README section says a
   README may cost score where the harness counts every file's bytes — this
   competition's dossier is text-capped, and the check requires it, so add
   it.)
4. **Transcript bundle** (see above) + the kit's pre-submit checks
   (`node cli/makefun.mjs check ...` from RULES.txt "Before you submit").
5. **Submit** before 2026-11-18 18:00 UTC (2026-11-19 02:00 Beijing).
   Max 5 submissions/day, 10 total; last one before the deadline counts.

## Environment notes (for the next run)

- Node v24.22.1 on PATH (grader uses Node 22; type-stripping works on both).
- VM Chromium (`/opt/meta-chromium/chrome`, "Muse Browser" 157) cannot
  start a page from a shell here — it dies at startup with the Hatch WebGL
  domain policy error. Playwright's own Chromium (installed 2026-11-17 to
  `~/.cache/ms-playwright/chromium_headless_shell-1148`, package in
  `/tmp/node_modules`) works fine for play-testing and screenshots.
- Local server used for testing: `node serve.ts --port 8080` (killed after
  the run; re-run to play again at http://localhost:8080).
- Playwright driver kept at `/tmp/pw-drive.mjs` (self-test + screenshots);
  logic test at `/tmp/logic-test.mjs`. Both are scratch, not part of the repo.
