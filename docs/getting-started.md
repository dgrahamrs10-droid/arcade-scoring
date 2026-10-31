# Getting started

## 1. One-time setup (about an hour)

1. Install **Node.js LTS** from nodejs.org, then run `npm install -g pnpm`.
2. Install **Claude Code** (see Anthropic's Claude Code docs) and sign in.
3. Create accounts if you don't have them: **GitHub**, **Supabase** (free), **Vercel** (free).
4. On GitHub, create an empty repo called `arcade-scoring` and clone it to your computer.
5. Copy `CLAUDE.md` and the `docs/` folder from this starter pack into the repo root.
6. In Supabase, create a project. Keep its **Project URL** and **anon key** handy
   (Project Settings → API). Don't paste them into chat or commit them.
7. Fill in the "Open questions" at the bottom of `CLAUDE.md` as best you can.

## 2. First Claude Code session

Open a terminal in the repo folder, run `claude`, switch to plan mode, and paste:

> Read CLAUDE.md and everything in docs/. We're starting Phase 0. Set up a pnpm monorepo
> with Vite + React + TypeScript (strict) apps camera, board and host, and packages
> engine, vision and shared, with the folder layout in CLAUDE.md. Add Vitest, ESLint and
> Prettier, a root `pnpm test` that runs all tests, and a placeholder `pnpm vision:eval`
> script. Each app shows a simple hello page with its name. Add a `.env.example` listing
> VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY and make sure `.env.local` is gitignored.
> Give me the plan first, and tell me exactly what I need to set up in Vercel to deploy
> the three apps.

Review the plan, approve it, then let it build. When it's done:

1. Create `.env.local` from `.env.example` with your Supabase URL and anon key.
2. Commit and push.
3. In Vercel, import the repo three times (one project per app), following the
   instructions Claude gave you, and add the two Supabase env vars to each.
4. Open each app's URL on your phone. That's the Phase 0 gate.

## 3. Every session after

- Start with: *"Read CLAUDE.md. We're in Phase N; here's what I want to do next: …"*
- Use plan mode for anything bigger than a small fix.
- When a phase gate passes, update the **Current phase** line in CLAUDE.md and commit.
- When detection misbehaves, give Claude the clip and the harness output, not a description.
