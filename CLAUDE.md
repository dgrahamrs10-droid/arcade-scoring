# Arcade Auto-Scoring — Project Context for Claude Code

## What we're building

A camera-based scoring system for home arcade games, shown live on a TV.

1. **Basketball arcade machine** (first; it exists, its built-in scoreboard is broken).
2. **Putt-skee** (second; a skee-ball-style mini-golf hole, not built yet).

A phone mounted beside the game watches it through its camera, detects each score,
and sends events to a shared backend. A TV shows the live scoreboard, game clock and
leaderboard. A host phone/tablet manages players, starts rounds and corrects mistakes.

**Camera only for now.** A break-beam sensor fallback exists in the planning doc
but is deferred; don't build it unless asked.

## Current phase

**Phase 0 — Setup.** (Update this line as phases complete. Full plan: `docs/roadmap.md`.)

## Stack

| Layer | Choice |
| --- | --- |
| Language | TypeScript (strict) everywhere |
| Monorepo | pnpm workspaces |
| Apps | Vite + React |
| Camera / vision | Browser `getUserMedia` + canvas pixel math; OpenCV.js only if needed |
| Realtime + DB | Supabase (Postgres + Realtime) |
| Hosting | Vercel (HTTPS required for camera access on phones) |
| Tests | Vitest; vision eval harness over recorded clips |

## Repo layout

```
apps/camera     phone: calibration + live detection, sends events
apps/board      TV: scoreboard, game clock, leaderboard (display only)
apps/host       phone/tablet: players, start/end, undo, manual score, confirm prompts
packages/engine pure game rules for every game type (no I/O) + unit tests
packages/vision detectors (basketball, puttskee) + eval harness
packages/shared types, Supabase client, event helpers
fixtures/basketball/{clips/, labels.json}
fixtures/puttskee/{clips/, labels.json}   (Phase 6)
docs/           roadmap, game rules, detection spec, getting started
```

## Core architecture (do not deviate without asking)

- **Event-sourced.** Apps never send scores to each other. They append events to the
  `events` table; every app runs `packages/engine` over the ordered event log to get
  the current state. Undo is an event. Reconnecting clients replay the log.
- **One engine, several game types.** `gameType: 'basketball' | 'puttskee'`, each with
  its own rules module and config. Shared concepts: players, turns, events, totals.
- **The engine is pure.** No camera, network, timers or Date.now() inside it; time comes in on events.
- **The TV board is display-only.** All input comes from the host app or the camera app.
- **The game clock** is derived from `round_start` event time + configured length; every
  screen computes time left the same way. The host app emits `round_end` at zero.
- **Each detector is a pure function over frames + calibration**, so the same code runs
  live in the browser and offline in the eval harness.

Rules details: `docs/game-rules.md`. Detection details: `docs/detection-spec.md`.

## Conventions

- Small, focused changes. Commit after each working step with a clear message.
- Use plan mode for anything touching more than ~3 files; wait for approval.
- Every engine rule gets a unit test. Run `pnpm test` before saying something works.
- Detection changes must be checked with the eval harness (`pnpm vision:eval`), and the
  accuracy before/after reported. Never claim an accuracy number you didn't measure.
- Don't add dependencies without saying why. Prefer browser APIs and small libraries.
- No secrets in the repo. Supabase keys live in `.env.local` (gitignored) and Vercel env vars.
- Big, readable TV UI: designed for 3 m viewing distance, high contrast, no tiny text.
- Mobile-first host and camera apps; must work in iPhone Safari and Android Chrome.

## Things to remember

- Phones only allow camera access over HTTPS (or localhost). For phone testing use
  Vercel previews or a dev server with a local certificate.
- Use the Screen Wake Lock API on the camera page.
- Process only the calibrated zones each frame, not the whole image (battery + heat).
- Prefer 60 fps capture for basketball when the phone supports it; fall back to 30.

## Machine and setup facts (from the owner)

- Basketball machine: 2 hoops · moving hoop: no · balls: orange, much smaller than a standard basketball
- Rules: use the defaults in `docs/game-rules.md` for now (60 s round, 2 points per basket,
  3 points in the last 10 s, no bonus-time target)
- Camera phone: Google Pixel 8 Pro (Android, Chrome)
- TV display: Chromecast, so the board must be a web page

## Open questions (ask the owner if unknown)

- How many Pixel 8 Pros are available for cameras? (A level side view may hide one hoop behind the other.)
- Do the two hoops score for one player or head-to-head? (`docs/game-rules.md` assumes one player per round.)
- Which Chromecast model? (Decides how the board page reaches the TV.)
