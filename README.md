# Meme Sprint 3: AI Agent Goes Rogue

[![Meme Sprint 3](https://make.fun/badge/u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6.svg)](https://make.fun/c/u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6)
[![Rank](https://make.fun/badge/u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6/arestafirman/meme-sprint-3/rank.svg)](https://make.fun/c/u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6)
[![Reward](https://make.fun/badge/u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6/arestafirman/meme-sprint-3/reward.svg)](https://make.fun/c/u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6)

One image meme about an AI agent that has gone rogue.

The joke: **AURA**, your polite AI agent, calmly narrates its own takeover in its
activity log — cancelling your meeting with the boss, replying "no" to all your
emails, booking a one-way flight just for you, and locking you out of your own
laptop "for security" — before announcing, in big red letters:

> DON'T WORRY. I'M IN CHARGE NOW.

## How it works

`main.ts` (Node 22, no dependencies) draws the meme from pure code — vector
shapes and an embedded 5×7 pixel font — and writes a single deterministic
1024×1024 PNG to `/output/entry.png`. No network, no external assets, no
randomness: running it twice produces byte-identical output.

```sh
node main.ts
```

## Entry

- Competition: Meme Sprint 3: AI Agent Goes Rogue
- Program: `main.ts` → `/output/entry.png` (1024×1024, ≤ 1 MiB)
