# Enough Is Enough — Workflow & Handover (NEW)

## Why this changed
The game is one ~2,000-line `index.html`. The old rule ("always hand back the
whole file") forces the entire file *into* the chat and the whole thing back
*out* for every change — slow, error-prone, and it burns a whole session on a
single edit. Worse on a phone: the GitHub mobile app hides search, so
find-and-replace on a giant file is painful.

## The new flow (low-data + phone-friendly)
1. **Split the one big file into a few small files** (plan below). Vercel serves
   them identically; you manage them in GitHub exactly like the image files.
2. After the split, almost every change (new fighter, new level, audio, tuning)
   touches **one small file**. I hand that **whole small file** back — small
   enough to select-all and paste over in full, so you **never need search**.
3. **Per task:** paste only the relevant small file (or just describe the job).
   I return the whole updated small file. One small thing in, one small thing
   out.

## Split plan — do this in a FRESH chat
Open a new chat, paste the current `index.html` **once**, say *"split per the
handover."* I'll produce four files:

- **index.html** — the page shell only (~150 lines): the `<head>`, the on-screen
  HTML, and at the bottom:
  `<link rel="stylesheet" href="game.css">` then
  `<script src="data.js"></script>` then `<script src="engine.js"></script>`
  (that order matters).
- **game.css** — everything currently inside `<style> … </style>`.
- **data.js** — the stuff you actually tweak:
  `CLIPS_*` (character animations), `META` (fighter select), `ASSETS` (file
  list), `SECTIONS` (levels/rooms), `TRACKS` / `SCREENS` / `SCENE_VIDEOS` /
  `TRAVEL_MENUS`, `SHOP` / `WEAPONS`, and the NPC config blocks (`HUB_NPCS`,
  `PRIEST`, `BK`, `MK_NPCS`, `PROX_AUDIO`).
- **engine.js** — everything else (update/draw/loop, input, combat). Rarely
  touched.

I'll validate with `node --check` so the game behaves **exactly the same** — it's
a reorganise, not a gameplay change.

(If `data.js` still feels big on the phone later, we can split it again — e.g. a
`characters.js` holding just `CLIPS_*` / `META` / `ASSETS`. Start with the
four-file split though.)

## Operator (the gun guy) — fold him into the split
`operator.png` is already made: 13 frames @ 150×198, real transparency
(walk → aim → fire with muzzle flash + flying casings → kneel → lying dead).
Rather than hand-edit three spots now without search, **I'll wire Operator into
`data.js` as part of the split.** So: upload `operator.png`, and the split chat
hands him back already done.

His settings (so they're recorded): `name:'The Operator'`, `flag:'DIRECT
ACTION'`, `fw:150, fh:198`, `noWeaponArt:true`, `muzzle:{fwd:0.40, yfac:0.30}`.
Carries the rifle in the sprite (bullets leave his own barrel), same as K-9 and
The Boss. The Boss stays in; remove his one `META` line later if you want him
gone.

## Still true (unchanged essentials)
- Files stay code-only; media is referenced by **exact lowercase filename**.
- Vercel is **case- and extension-sensitive**.
- Cache-bust by renaming a file if a change won't show.
- **Validate every change with `node --check`** before shipping.
- `start()` still sets `money=1000 // TESTING` — **set to 0 for release.**
