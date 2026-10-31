# Game rules and data model

All rules live in `packages/engine` as pure functions. Every number below is a **config
default**, editable per game from the host app. Fill in the basketball values to match
the machine's original rules (see open questions in CLAUDE.md).

## Shared concepts

- **Player:** id, display name. Persists across games for the leaderboard.
- **Game:** one session at one machine with 1–6 players. Basketball players pair up for
  head-to-head rounds; putt-skee players take turns.
- **Turn / round:** Basketball = a timed head-to-head round, one player per hoop;
  putt-skee = one player's N balls.
- **Event log:** the only source of truth. State = `reduce(events, config)`.

## Event types

| Type | Sent by | Payload |
| --- | --- | --- |
| `game_created` | host | gameType, config, players |
| `player_added` / `player_removed` | host | playerId |
| `round_start` | host | startedAt (server time); basketball: players `{ left, right }` (playerIds); putt-skee: playerId |
| `basket` | camera | hoop (`left` or `right`), at (time), confidence, clipId? |
| `throw` | camera | holeId or `miss`, points, confidence, clipId? (putt-skee) |
| `manual_score` | host | points (+/-), reason; basketball: hoop (`left` or `right`) |
| `confirm` / `reject` | host | targetEventSeq |
| `undo` | host | targetEventSeq (defaults to last scoring event) |
| `round_end` | host | endedAt |
| `game_end` | host | — |

Rules for the reducer:
- Events are applied in `seq` order. Unknown types are ignored, not fatal.
- `undo` and `reject` cancel their target; cancelled events never score.
- Low-confidence scoring events count as **pending** until confirmed or rejected; the TV
  shows pending points in a different style. Config: `autoAcceptConfidence` (default 0.8).
- Scoring events received outside an active round are ignored (but kept in the log).

## Basketball (`gameType: 'basketball'`)

| Setting | Default | Notes |
| --- | --- | --- |
| `roundSeconds` | 60 | Countdown shown on TV |
| `pointsPerBasket` | 2 | |
| `bonusWindowSeconds` | 10 | Last N seconds of the round |
| `bonusPointsPerBasket` | 3 | Points during the bonus window |
| `bonusTimeTarget` | null | e.g. 40 points → extend round |
| `bonusTimeSeconds` | 20 | Added when target is reached (once per round) |
| `countdownSeconds` | 3 | "3-2-1" before the clock starts |

- Points for a basket depend on the basket's time within the round
  (`at - round_start.startedAt`), not on when the event arrived.
- Time left = `roundSeconds + bonus earned - (now - startedAt)`; every screen computes it
  the same way from the log plus the current time.
- **Head-to-head:** two players, one per hoop, share one clock. A basket scores for the
  player on its `hoop`.
- Round result = each player's total points. Higher total wins; equal totals are a draw.
- If either player reaches `bonusTimeTarget`, the shared clock extends once for both.
- A round counts toward the leaderboard only if it ended normally. Each player's total is
  a separate leaderboard entry.

## Putt-skee (`gameType: 'puttskee'`) — Phase 6

| Setting | Default |
| --- | --- |
| `ballsPerTurn` | 9 |
| `holes` | `[{id:'h10',points:10},{id:'h20',points:20},{id:'h30',points:30},{id:'h40',points:40},{id:'h50',points:50},{id:'c100l',points:100},{id:'c100r',points:100}]` |
| `missPoints` | 0 |

- Each `throw` (hole or miss) uses one ball. The turn ends when balls run out.
- A `throw` while no balls remain is ignored.

## Leaderboard

Derived from finished rounds/turns, per gameType:
- **Today:** top 10 scores since local midnight (America/Vancouver).
- **All-time:** top 10 scores ever, one entry per player (their best).
- Ties broken by earlier time.

## Database (Supabase)

```
players (id uuid pk, name text, created_at timestamptz)
games   (id uuid pk, room_code text unique, game_type text, config jsonb,
         status text, created_at timestamptz)
events  (id bigserial pk, game_id uuid fk, seq int, type text, payload jsonb,
         source text, created_at timestamptz default now(),
         unique (game_id, seq))
```

- `seq` is assigned by the database (e.g. via a function) so concurrent writers can't collide.
- Realtime subscription on `events` filtered by `game_id`.
- Leaderboard can be a SQL view or computed client-side from finished games; keep it simple first.
