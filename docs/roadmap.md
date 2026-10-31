# Roadmap

Basketball first, putt-skee second, camera only. Each phase ends with a gate you can see
pass before moving on. Use plan mode at the start of each phase: paste the prompt, review
the plan, then let Claude Code build.

| Phase | Timing | Gate to move on |
| --- | --- | --- |
| 0 · Setup | Week 1 | Hello page opens on your phone over HTTPS |
| 1 · Engine, clock and TV scoreboard | Weeks 1–2 | Full timed basketball rounds by tapping; TV updates in under 1 s |
| 2 · Basketball clips and offline detector | Weeks 3–5 | 95%+ on single-shot clips; rapid-fire rounds within 10% of hand count |
| 3 · Calibration and live camera | Week 6 | Rim and net zones stay aligned through a full session |
| 4 · Live basketball auto-scoring | Weeks 7–8 | Five live 60 s rounds each within 2 baskets of a hand count |
| 5 · Leaderboard, polish and game night | Weeks 9–10 | A full evening runs with only the phone, TV and undo button |
| 6 · Add putt-skee | 2–3 weeks once built | 95%+ over a 50-putt live session; shared leaderboard |

---

## Phase 0 — Setup

**You do:** install Node.js (LTS), pnpm and Claude Code; create a GitHub repo
`arcade-scoring`; create a free Supabase project; connect the repo to Vercel.
Copy `CLAUDE.md` and `docs/` into the repo root. Then follow `docs/getting-started.md`.

**Done when:** each of the three apps has a URL that opens on your phone over HTTPS.

## Phase 1 — Engine, clock and TV scoreboard

**Prompt 1 — engine:**
> Read CLAUDE.md and docs/game-rules.md. In packages/engine, implement the event types and
> a pure `reduce(events, config)` that returns game state for gameType 'basketball':
> players, turn order, round state, time-left derivation from round_start, points per
> basket including the last-seconds bonus, bonus time, undo, manual score, round results.
> Design it so 'puttskee' can be added later as another rules module. Full Vitest coverage.

**Prompt 2 — backend + apps:**
> Add Supabase migrations for players, games and events (see docs/game-rules.md), with
> row-level security suitable for a home setup using a room code. In packages/shared, write
> a client that appends events and subscribes to a game's events in order. Build apps/host
> (create game, add players, start round, tap +basket, undo, end) and apps/board (big game
> clock, score, current player, last-basket animation, room code and QR to join). Both
> derive state only via packages/engine.

**Done when:** you play full timed basketball rounds by tapping on your phone and the TV
keeps up in under a second. The broken scoreboard is replaced from here.

## Phase 2 — Basketball clips and offline detector

**You do:** mount the phone as described in docs/detection-spec.md (Camera setup).

**Prompt 1 — recorder:**
> Add a /record page to apps/camera that shows the rear camera at the highest supported
> frame rate (prefer 60 fps), records clips of a chosen length, and downloads them as files.

**You do:** film about 100 single shots (makes, rim-outs, airballs, bank shots) and 10
rapid-fire rounds. Put them in fixtures/basketball/clips/ and hand-count each one into
fixtures/basketball/labels.json (schema in docs/detection-spec.md).

**Prompt 2 — harness:**
> In packages/vision, build an eval harness (`pnpm vision:eval basketball`) that decodes
> each clip, runs the basketball detector frame by frame with a fixed calibration file,
> and compares against labels.json. Print accuracy for single shots, count error for
> rapid-fire rounds, and a list of failures with timestamps.

**Prompt 3 — detector:**
> Implement the basketball detector in docs/detection-spec.md: rim zone, net zone, ball
> colour + background mask, blob tracking, downward count-line crossing, overlap-by-area,
> confidence. Iterate against the harness and report the numbers after each change.

**Done when:** 95%+ on single shots and rapid-fire rounds within 10% of hand count.

## Phase 3 — Calibration and live camera

**Prompt:**
> In apps/camera, build calibration for basketball: live rear camera, tap left and right
> rim edges, draw draggable rim and net zones and the count line, a "show the ball" step
> that learns its colour range, and an empty-scene baseline capture. Save calibration on
> the device and show a warning if the scene stops matching it.

**Done when:** the zones stay aligned through a full session of play.

## Phase 4 — Live basketball auto-scoring

**Prompt:**
> Run the basketball detector on the live feed in apps/camera. Emit basket events with
> confidence via packages/shared; send low-confidence ones to apps/host as Confirm /
> Reject prompts. Add a toggleable debug overlay (zones, blobs, tracks, counts), use the
> Wake Lock API, and save a short clip around every detected basket for later review.

**You do:** play five 60 s rounds while someone hand-counts. Add every miscounted clip to
the fixtures and re-run the harness.

**Done when:** all five rounds finish within 2 baskets of the hand count.
If not, do the ML upgrade in docs/detection-spec.md before Phase 5.

## Phase 5 — Leaderboard, polish and game night

**Prompt:**
> Add player profiles and a leaderboard (today's top and all-time, per game type) shown on
> the TV between rounds. Add sounds (countdown beeps, basket, final buzzer), reconnect
> handling, an offline event queue on the camera phone, and a setup checklist screen
> (mount, light, calibration, Wi-Fi, TV connected).

**Done when:** a full game night runs with only the phone, the TV and the host's undo button.

## Phase 6 — Add putt-skee (after it's built)

**Prompt 1:**
> Add gameType 'puttskee' to packages/engine per docs/game-rules.md (balls per turn, hole
> values, misses), with tests. Add its calibration (corner markers or tap corners, hole
> circles from a layout file, ball colour) to apps/camera.

**Prompt 2:**
> Implement the putt-skee detector in docs/detection-spec.md, with its own eval harness run
> over fixtures/puttskee. Then wire it live like basketball.

**Done when:** 95%+ over a 50-putt live session, with both games on one leaderboard.
