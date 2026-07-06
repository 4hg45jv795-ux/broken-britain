/* data.js — Enough Is Enough: the data/config you tweak (loaded BEFORE engine.js). */

const CLIPS_BRIT={
  idle:   {start:0,  count:1, fps:2,  loop:true},
  walk:   {start:1,  count:6, fps:10, loop:true},
  run:    {start:10, count:3, fps:13, loop:true},
  jump:   {start:7,  count:1, fps:8,  loop:false},
  punch:  {start:18, count:2, fps:14, loop:false},   // gun-thrust melee
  headbutt:{start:18,count:2, fps:14, loop:false},
  die:    {start:20, count:2, fps:7,  loop:false},   // kneel -> lying
  shoot:  {start:13, count:2, fps:16, loop:false},   // raise -> fire
};
/* ── K-9 dog gunner ───────────────────────────────────────────
   Single row of 19 frames, repacked from his 4-col sheet in order:
     0-3   walk (rifle slung on back)
     4-7   walk/run (second cycle)
     8-9   stand, rifle ready   10-11 rifle raised
     12-15 aim -> FIRE  (frame 15 has the muzzle flash + shell)
     16-18 on all fours (currently UNUSED — wire later if you want
           a four-legged sprint, etc.)
   He carries the rifle IN the sprite, so his held-weapon overlay is
   suppressed (noWeaponArt) and bullets leave his own barrel (muzzle). */
const CLIPS_DOG={
  idle:   {start:8,  count:2, fps:3,  loop:true},
  walk:   {start:0,  count:4, fps:9,  loop:true},
  run:    {start:4,  count:4, fps:12, loop:true},
  jump:   {start:10, count:2, fps:8,  loop:false},
  punch:  {start:12, count:3, fps:16, loop:false},   // melee when unarmed = rifle motion
  headbutt:{start:12,count:3, fps:16, loop:false},
  die:    {start:8,  count:1, fps:6,  loop:false},    // no death art yet; freezes on idle
  shoot:  {start:12, count:3, fps:18, loop:false},    // aim -> fire; holds on frame 14 (gun up, muzzle flash)
};
/* ── The Boss (blue-suit heavy with a machine gun). Single row, 8 frames:
     0-1 walk, 2-4 raise+fire (muzzle flash/smoke), 5 idle (adjusting tie),
     6 kneel, 7 lying dead. Gun is IN the sprite, so noWeaponArt + muzzle. */
const CLIPS_BOSS={
  idle:   {start:5, count:1, fps:2,  loop:true},
  walk:   {start:0, count:2, fps:6,  loop:true},
  run:    {start:0, count:2, fps:9,  loop:true},
  jump:   {start:1, count:1, fps:8,  loop:false},
  punch:  {start:2, count:3, fps:13, loop:false},   // unarmed melee = gun raise
  headbutt:{start:2,count:3, fps:13, loop:false},
  die:    {start:6, count:2, fps:6,  loop:false},   // kneel -> lying
  shoot:  {start:2, count:3, fps:15, loop:false},   // aim -> fire -> smoke
};
/* ── NEW CHARACTER (candidate playable fighter) ──────────────────────
   THE TEMPLAR (templar.png): single row, 5 frames -> 0-3 walk, 4 dead(lying).
   Carries a rifle in-sprite, so noWeaponArt + muzzle (bullets leave the barrel). */
const CLIPS_TEMPLAR={
  idle:   {start:0, count:1, fps:2,  loop:true},
  walk:   {start:0, count:4, fps:9,  loop:true},
  run:    {start:0, count:4, fps:13, loop:true},
  jump:   {start:1, count:1, fps:8,  loop:false},
  punch:  {start:0, count:2, fps:13, loop:false},   // gun-thrust melee
  headbutt:{start:0,count:2, fps:13, loop:false},
  shoot:  {start:0, count:2, fps:15, loop:false},
  die:    {start:4, count:1, fps:6,  loop:false},
};
/* ── FIGHTER META ────────────────────────────────────────── */
const META=[
  {id:'templar',  name:'Crusader',     flag:'CHRISTENDOM',   fw:240, fh:345, clips:CLIPS_TEMPLAR,
                  noWeaponArt:true, muzzle:{fwd:0.52, yfac:0.46}},
  {id:'brit',     name:'The Patriot',  flag:'GREAT BRITAIN', fw:233, fh:220, clips:CLIPS_BRIT,
                  noWeaponArt:true, scale:1.1, muzzle:{fwd:0.34, yfac:0.40}},
  {id:'dog',      name:'K-9 Unit',     flag:'ARMED RESPONSE',fw:224, fh:240, clips:CLIPS_DOG,
                  noWeaponArt:true, muzzle:{fwd:0.62, yfac:0.34}},
  {id:'boss',     name:'Cousin V',     flag:'AMERICA',       fw:294, fh:299, clips:CLIPS_BOSS,
                  noWeaponArt:true, muzzle:{fwd:0.62, yfac:0.46}},
];
/* ── ASSETS ──────────────────────────────────────────────── */
const ASSETS = [
  {key:'home',     type:'img', src:'home4.png', optional:true},
  {key:'room_house',        type:'img', src:'room house.jpeg', optional:true},
  {key:'room_church',       type:'img', src:'room church.jpeg', optional:true},
  {key:'room_gunstore',     type:'img', src:'room gunstore.jpeg', optional:true},
  {key:'room_restore',      type:'img', src:'room restore.jpeg', optional:true},
  {key:'room_cinema',       type:'img', src:'room cinema.jpeg', optional:true},
  {key:'room_easyjet',      type:'img', src:'room easyjet.jpeg', optional:true},
  {key:'room_trainstation', type:'img', src:'room trainstation.jpeg', optional:true},
  {key:'room_sea', type:'img', src:'room_sea.jpeg', optional:true},  // The Sea shooting-gallery backdrop (scope view over the cliffs/sea)
  {key:'seaboat', type:'img', src:'seaboat.png', optional:true},     // The Sea: empty drifting fishing boat target (340x190 single image)
  {key:'zombie', type:'img', src:'zombie.png', optional:true},       // ZOMBIES wave defence: 9 frames (walk 0-4, lunge 5, collapse 6-8), fw:131 fh:237
  {key:'zombie2', type:'img', src:'zombie2.png', optional:true},     // ZOMBIES type 2 (camo, faster/weaker): same 9-frame layout, fw:116 fh:239
  {key:'bikinigirl', type:'img', src:'bikinigirl.png', optional:true},  // Winchester dancer (14 frames: walk 0-5, dance 6-13, fw:129 fh:179) — earned by staying in the pub 5 minutes
  {key:'paleman', type:'img', src:'paleman.png', optional:true},      // ZOMBIES type 3 (the pale man): 10 frames (walk 0-5, lunge/attack 6-9), fw:101 fh:214
  {key:'jokeman', type:'img', src:'jokeman.png', optional:true},      // Winchester joke teller (8 frames, all one laughing/gesturing loop), fw:156 fh:223
  {key:'barman', type:'img', src:'barman.png', optional:true},        // Winchester BARMAN (torso only, 8-frame serving/toasting loop), fw:141 fh:150
  {key:'room_zombies', type:'img', src:'room zombies.jpeg', optional:true},  // ZOMBIES backdrop (drawn portal-moor fallback if missing)
  {key:'room_library',      type:'img', src:'room library.jpeg', optional:true},
  {key:'room_winchester',   type:'img', src:'room winchester.jpeg', optional:true},
  /* ── NEW ROOM BACKGROUNDS (same "room NAME.jpeg" convention as above) ── */
  {key:'room_police',       type:'img', src:'room police 2.jpeg', optional:true},
  {key:'room_nightclub',    type:'img', src:'room nightclub.jpeg', optional:true},
  {key:'room_crackadilly',  type:'img', src:'room crackadilly.jpeg', optional:true},
  {key:'room_europe',       type:'img', src:'room europe.jpeg', optional:true},
  {key:'room_america',      type:'img', src:'room america.jpeg', optional:true},
  {key:'potus',             type:'img', src:'potus.png', optional:true},   // America dancing NPC (18-frame dance loop)
  {key:'room_dnb',          type:'img', src:'room dnb.jpeg', optional:true},
  {key:'room_hiphop',       type:'img', src:'room hiphop.jpeg', optional:true},
  {key:'room_special',      type:'img', src:'room special.jpeg', optional:true},
  {key:'room_cottagers',    type:'img', src:'room cottagers.jpeg', optional:true},
  /* ── NEW: the Winchester gents toilet (placeholder until room toilet.jpeg exists) ── */
  {key:'room_toilet',       type:'img', src:'room toilet.jpeg', optional:true},
  {key:'bg',       type:'img', src:'bg.jpg'},
  {key:'pub',      type:'img', src:'pub2.jpeg'},
  {key:'dundee',   type:'img', src:'dundee.jpeg'},
  {key:'bg3',      type:'img', src:'bg3.jpeg'},
  {key:'brit',     type:'img', src:'patriot.png'},
  {key:'dog',      type:'img', src:'dog.png', optional:true},
  {key:'boss',     type:'img', src:'boss.png', optional:true},
  {key:'templar',  type:'img', src:'templar.png', optional:true},
  {key:'ufoship',  type:'img', src:'ufoship.png', optional:true},   // shooting UFO enemy (kind 8)
  {key:'bruiser',  type:'img', src:'bruiser.png', optional:true},   // Cottagers Cove thug enemy (kind 9)
  {key:'shooter',  type:'img', src:'shooter.png', optional:true},   // gunman enemy (kind 10)
  {key:'tracksuit',type:'img', src:'tracksuit.png', optional:true}, // Cottagers Cove tracksuit enemy (kind 11)
  {key:'hippie',   type:'img', src:'hippie.png', optional:true},    // Park/street enemy (kind 12)
  {key:'crackman', type:'img', src:'crackman.png', optional:true},  // Crackadilly Gardens enemy (kind 13)
  {key:'stabber',  type:'img', src:'stabber.png', optional:true},   // Crackadilly Gardens hooded knife enemy (kind 14)
  {key:'bladebot', type:'img', src:'bladebot.png', optional:true},  // Judgement Day blade android (kind 15)
  {key:'gunbot',   type:'img', src:'gunbot.png', optional:true},    // Judgement Day minigun endoskeleton — SHOOTER (kind 16)
  {key:'bostonbot',type:'img', src:'bostonbot.png', optional:true}, // Judgement Day blue-headed combat bot (kind 17)
  {key:'teslabot', type:'img', src:'teslabot.png', optional:true},  // Judgement Day Atlas-style combat bot (kind 18)
  {key:'gardenman',type:'img', src:'gardenman.png', optional:true}, // Crackadilly Gardens pacing NPC (decorative, walks back and forth)
  {key:'hawking',  type:'img', src:'hawking.png', optional:true},   // Judgement Day wheelchair enemy (kind 19)
  {key:'piggybackguy', type:'img', src:'piggybackguy.png', optional:true}, // Special Guest room NPC — carried sedan-chair group (paces the floor)
  {key:'bigbrain',     type:'img', src:'bigbrain.png', optional:true},     // Crackadilly Gardens enemy (kind 20) — has its own dying animation
  {key:'bigman',       type:'img', src:'bigman.png',  optional:true},     // America enemy (kind 21) — grey hoodie, walk + collapse
  {key:'bigman2',      type:'img', src:'bigman2.png', optional:true},     // America enemy (kind 22) — white tee, walk + stagger/fall
  {key:'pinkshirt',    type:'img', src:'pinkshirt.png', optional:true},   // Europe enemy (kind 23) — pink shirt, walk + stagger/fall
  {key:'bigman3',      type:'img', src:'bigman3.png', optional:true},     // America enemy (kind 24) — shirtless, brown shorts, walk + stagger/fall
  {key:'devildance',   type:'img', src:'devildance.png', optional:true},  // America decorative dancer near the end — 16-frame pair; NPC loops frames 0-11
  {key:'hologram', type:'img', src:'hologram.png', optional:true},  // Library blue AI hologram NPC (centre)
  {key:'dancer',   type:'img', src:'dancer.png', optional:true},    // dancing NPC (now in the Hip-Hop room)
  {key:'couple',   type:'img', src:'couple.png', optional:true},    // Void dancing-couple NPCs
  {key:'dgreen',   type:'img', src:'dancer_green.png',  optional:true},  // Hip-Hop room dancer (green)
  {key:'tvguy',    type:'img', src:'tvguy.png', optional:true},     // Hip-Hop room safe-carrying dancing NPC (18 frames)
  /* ── NEW: Drum & Bass room dancing couples ── */
  {key:'dnbcouple1', type:'img', src:'dnbcouple1.png', optional:true},   // Freddy + Queen couple (15 frames)
  {key:'dnbcouple2', type:'img', src:'dnbcouple2.png', optional:true},   // green alien + raver couple (15 frames)
  /* ── NEW: the Winchester toilet KEY pickup (drawn as a gold key if no png) ── */
  {key:'toiletkey',  type:'img', src:'toiletkey.png', optional:true},
  {key:'photog',   type:'img', src:'photog2.png'},
  {key:'athlete',  type:'img', src:'athlete.png', optional:true},
  {key:'police',   type:'img', src:'police4.png', optional:true},
  {key:'clown',    type:'img', src:'clown4.png', optional:true},
  {key:'bikeboy',  type:'img', src:'bikeboy2.png', optional:true},
  {key:'binhelper',type:'img', src:'binhelper.png', optional:true},
  {key:'park',     type:'img', src:'park.jpeg'},
  {key:'alien',    type:'img', src:'alien.png', optional:true},
  {key:'geezer',   type:'img', src:'geezer.png', optional:true},
  {key:'ufo',      type:'img', src:'ufo.png', optional:true},
  {key:'knifeman', type:'img', src:'knifeman.png', optional:true},
  {key:'wanderer', type:'img', src:'wanderer.png', optional:true},
  {key:'food',     type:'img', src:'roast.png', optional:true},
  {key:'deliveroo',type:'img', src:'deliveroo2.png', optional:true},
  {key:'glasgow',  type:'img', src:'glasgow.jpeg', optional:true},
  {key:'southampton', type:'img', src:'southampton.jpeg', optional:true},
  {key:'mk',       type:'img', src:'mortalkombat.png', optional:true},
  /* ── MORTAL KOMBAT NPC SPRITES (single-row strips, real PNG alpha) ──
     Slots for the ambient MK characters wired in MK_NPCS below. Rename per
     character once your sheets are repacked; missing files just stay silent. */
  {key:'mknpc1',   type:'img', src:'mknpc1.png', optional:true},
  {key:'mknpc2',   type:'img', src:'mknpc2.png', optional:true},
  {key:'mknpc3',   type:'img', src:'mknpc3.png', optional:true},
  {key:'weapons',  type:'img', src:'weapons.png', optional:true},
  {key:'bigblaster',   type:'img', src:'bigblaster.png', optional:true},
  {key:'cash',         type:'img', src:'cash.png', optional:true},
  {key:'littleblaster',type:'img', src:'littleblaster.png', optional:true},
  {key:'weapon01', type:'img', src:'weapon01.png', optional:true},
  {key:'weapon02', type:'img', src:'weapon02.png', optional:true},
  {key:'weapon03', type:'img', src:'weapon03.png', optional:true},
  {key:'weapon04', type:'img', src:'weapon04.png', optional:true},
  {key:'weapon05', type:'img', src:'weapon05.png', optional:true},
  {key:'weapon06', type:'img', src:'weapon06.png', optional:true},
  {key:'weapon07', type:'img', src:'weapon07.png', optional:true},
  {key:'weapon08', type:'img', src:'weapon08.png', optional:true},
  {key:'priest',   type:'img', src:'priest.png', optional:true},
  {key:'burgerking', type:'img', src:'burgerking.png', optional:true},
  {key:'captain',  type:'img', src:'captain.png', optional:true},
  {key:'policedance', type:'img', src:'policedance.png', optional:true},  // dancing policewomen pair outside the police station (hub) — 6-frame loop
  {key:'vigilante', type:'img', src:'vigilante.png', optional:true},  // walking vigilante NPC on the hub (first half) — 9 frames: 0-5 walk, 6-8 shoot pose
  {key:'commuter', type:'img', src:'commuter.png', optional:true},  // walking briefcase-and-shotgun NPC on the hub — 10 frames: 0-5 walk (side), 6-9 shoot (side, unused for now)
  {key:'piper', type:'img', src:'piper.png', optional:true},  // walking plaid-shirt drifter NPC on the hub — 9 frames: 0-5 walk, 6-8 shoot (unused for now; frame 8 has the muzzle flash)
  {key:'graffiti_eyes', type:'img', src:'graffiti_eyes.png', optional:true},  // Cottagers Cove reactive wall eyes (7-frame dripping-eyeball blink loop) — LEFT of the Charlie tag
  {key:'graffiti_eyes2', type:'img', src:'graffiti_eyes2.png', optional:true}, // Cottagers Cove grinning eyeball (15-frame roll+grin) — RIGHT of the Charlie tag
];
/* ── SECTIONS / LEVELS ───────────────────────────────────── */
const SECTIONS=[
  {id:'home', name:'DigiTown &mdash; the high street', bgKey:'home', BGW:2868, srcY:26, flatGround:245,
   hub:true, enemies:[ ],
   doors:[
     {x:200,  w:80,  label:'My House',         target:'in_house'},
     {x:365,  w:78,  label:'The Church',        target:'in_church'},
     {x:540,  w:82,  label:'The Gun Store',     target:'in_gunstore'},
     {x:740,  w:92,  label:'Restore Britain',   target:'in_restore'},
     {x:910,  w:84,  label:'The Cinema',        target:'in_cinema'},
     {x:1100, w:84,  label:'easyJet Holidays',  target:'in_easyjet'},
     {x:1290, w:90,  label:'Train Station',     target:'in_trainstation'},
     {x:1490, w:82,  label:'The Portal',        menu:'portal'},
     {x:1740, w:112, label:'The Library',       target:'in_library'},
     {x:2040, w:120, label:'The Winchester',    target:'in_winchester'},
     /* ── NEW BUILDINGS (enter just like the others). The x values below are
        guesses past the Winchester (hub is BGW:2868 wide) — nudge each `x`
        on the phone until the marker sits over the painted door in home4.png,
        exactly how every other door here was lined up. */
     {x:2280, w:100, label:'Police Station',    target:'in_police'},
     {x:2490, w:110, label:"Slammin' Vinyl",    target:'in_nightclub'},
     {x:2700, w:120, label:'Crackadilly Gardens',  target:'in_crackadilly'}
   ],
   /* Two policewomen dancing outside the POLICE STATION (door at x:2280). Decorative
      NPC (not an enemy): 6-frame dance loop, policedance.png. `at` sits them just
      outside the door; nudge at/h to line up with the painted station. */
   npcs:[
          /* ── HUB CROWD ──────────────────────────────────────────────────────
             FOUR WALKERS + the stationary POLICE DANCERS, spaced into non-crossing
             lanes so nobody ever meets or walks through anyone else (hub is 2868 wide):
               vigilante   100..820   (My House, Church, Gun Store, Restore)
               piper        920..1780 (Cinema, easyJet, Train Station, Portal, Library)
               captain     1880..2150 (patrolling outside the Winchester @2040)
               [POLICE DANCERS — stationary at 2280]
               commuter    2410..2770 (Slammin' Vinyl, Crackadilly)
             Each has an mp3 PROXIMITY slot: it fades up as you approach and is silent past
             `range` (or if the file isn't uploaded). Nudge at/paceFrom/paceTo/paceSpd/h/range. */
          {img:'policedance', fw:219, fh:319, at:2280, h:95, yOff:0, face:1,
           clip:{start:0,count:6,fps:7,loop:true}, mp3:'Policedance.mp3', range:200},
          {img:'vigilante', fw:167, fh:282, at:460, h:85, yOff:0, face:1,
           clip:{start:0,count:6,fps:9,loop:true}, pace:true, paceFrom:100, paceTo:820, paceSpd:0.9,
           mp3:'Vigilante.mp3', range:190},
          /* PIPER (plaid shirt, shades, shotgun) — 9-frame sheet: walk 0-5 (used), shoot 6-8
             (unused for now; frame 8 carries the muzzle flash, ready for when he can fire). */
          {img:'piper', fw:164, fh:242, at:1350, h:88, yOff:0, face:1,
           clip:{start:0,count:6,fps:8,loop:true}, pace:true, paceFrom:920, paceTo:1780, paceSpd:0.85,
           mp3:'Piper.mp3', range:190},
          /* CAPTAIN — moved here out of HUB_NPCS so he shares the same lane-spacing + proximity
             audio as the others. Patrols right outside the Winchester (2040). 6-frame walk strip. */
          {img:'captain', fw:110, fh:221, at:2015, h:84, yOff:0, face:1,
           clip:{start:0,count:6,fps:8,loop:true}, pace:true, paceFrom:1880, paceTo:2150, paceSpd:0.7,
           mp3:'Captain.mp3', range:190},
          /* COMMUTER (briefcase + shotgun) — 10-frame sheet: walk 0-5 (used), shoot 6-9 (unused). */
          {img:'commuter', fw:95, fh:139, at:2590, h:88, yOff:0, face:1,
           clip:{start:0,count:6,fps:8,loop:true}, pace:true, paceFrom:2410, paceTo:2770, paceSpd:0.8,
           mp3:'Commuter.mp3', range:190} ]},
  /* ── THE STREETS chain. SOUTHAMPTON is now the FIRST level (entered from the
     Portal / Train Station "The Streets"); the old Southside "street" level is now
     the LAST stop before the chain loops back to the hub. The photographer's first
     appearance + cutscene now triggers at the start of Southampton (see engine.js). */
  {id:'southampton', name:'Southampton &mdash; Above Bar Street', bgKey:'southampton', BGW:1879, srcY:90, flatGround:296, chain:true, next:'park', prev:null,
   enemies:[ {at:430,kind:0},{at:640,kind:0},{at:850,kind:0},{at:1050,kind:0},{at:1250,kind:0},{at:1450,kind:0},{at:1650,kind:0},{at:1800,kind:0},{at:540,kind:0},{at:1150,kind:0},{at:1370,kind:0},{at:1730,kind:0},{at:330,kind:0},{at:760,kind:0},{at:960,kind:0},{at:1550,kind:0},{at:1840,kind:0},{at:1200,kind:0} ]},
  {id:'park', name:'Standard UK Park', bgKey:'park', BGW:1763, srcY:0, flatGround:196, chain:true, next:'belfast', prev:'southampton',
   enemies:[ {at:520,kind:3},{at:880,kind:3},{at:1240,kind:3},{at:680,kind:12},{at:1040,kind:12},{at:1400,kind:12},{at:600,kind:5,spd:1.6},{at:1100,kind:5,spd:1.6},{at:1500,kind:5,spd:1.6} ],
   aliens:[ {at:700,kind:2},{at:1020,kind:2},{at:1360,kind:2},{at:1560,kind:2} ]},
  {id:'belfast', name:'Ballymacarrett &mdash; the loyal mile', bgKey:'bg3', BGW:2172, srcY:380, flatGround:560, chain:true, next:'pub', prev:'park',
   enemies:[ {at:760,kind:4},{at:1120,kind:4},{at:1480,kind:4},{at:1800,kind:4},{at:2020,kind:4},{at:600,kind:4},{at:1300,kind:4},{at:1650,kind:4},{at:1950,kind:4} ]},
  {id:'pub',     name:'The Red Hand &mdash; loyalist till I die', bgKey:'pub', BGW:533, srcY:8, flatGround:212, charScale:1.4, chain:true, next:'dundee', prev:'belfast',
   enemies:[ ]},
  {id:'dundee',  name:'Welcome to Dundee', bgKey:'dundee', BGW:560, srcY:65, flatGround:270, chain:true, next:'glasgow', prev:'pub',
   enemies:[ ]},
  {id:'glasgow', name:'Glasgow &mdash; the Trongate', bgKey:'glasgow', BGW:2672, srcY:90, flatGround:296, chain:true, next:'street', prev:'dundee', weather:'rain',
   /* THE TOILET KEY lives here now, near the END of the Trongate (x:2500 of 2672) — walk over it
      to pick it up; it then unlocks the Winchester toilet door. Nudge at/h to taste. */
   items:[ {id:'toiletkey', at:2500, h:34, label:'the Winchester toilet key'} ],
   enemies:[ {at:230,kind:6,hp:1,static:true},{at:760,kind:5},{at:1080,kind:0},{at:1380,kind:5},{at:2000,kind:5},{at:2480,kind:5} ]},
  {id:'street', name:'Southside &mdash; the street', bgKey:'bg',  BGW:4047, srcY:120, flatGround:null, chain:true, next:null, prev:'glasgow',
   enemies:[ {at:1200,kind:0},{at:2300,kind:0},{at:3700,kind:0},{at:2000,kind:12},{at:2800,kind:12},{at:600,kind:0},{at:3900,kind:0},{at:1500,kind:20,hp:60},{at:3000,kind:20,hp:60},{at:1900,kind:14,hp:50},{at:3100,kind:14,hp:50},{at:2600,kind:10,hp:60} ]},

  /* ── MORTAL KOMBAT (entered from the hub Portal -> travel menu) ──
     Standalone fight arena: the UMK3 "Blue Portal" bridge. Background
     mortalkombat.png is 1432x240, floor surface ~196 (nudge flatGround).
     chain:true so the helper bar + combat work; next:null so the right
     edge gives the "THE END" exit and the left edge returns to the hub.
     Ambient MK characters (NPCs) are wired separately in MK_NPCS below. */
  {id:'mk', name:'The Portal &mdash; Mortal Kombat', bgKey:'mk', BGW:1432, srcY:0, flatGround:206, chain:true, next:null, prev:null,
   arena:true, arenaPool:[0,4,9,14], arenaSpecial:10, arenaSpecialName:'GUNMAN SQUAD', arenaSpecialHp:120,
   arenaBaseCount:6, arenaMaxCount:14, arenaGrowth:1.5, enemies:[]},

  /* ── BLACK LEVEL (entered from the hub Portal -> travel menu) ──────────
     A long, currently-black stage that hosts the MP4 scenery system below
     (SCENE_VIDEOS): a WALL video across the top 75% and a separate FLOOR
     video across the bottom 25%, both TILED across the whole level and
     scrolling with the camera. black:true paints the frame black underneath,
     so anywhere a video hasn't loaded yet just stays black. chain:true lets
     you walk it; the left edge returns to the hub. BGW is the level length. */
  /* THE VOID is now an ENDLESS WAVE ARENA. The engine's wave spawner (arena* in
     engine.js) takes over: each cleared wave brings a tougher one (more enemies,
     more HP, faster, hits harder). Kills bank score; top runs save to this device
     and show when you fall. Walk off the far LEFT to leave. Add future tougher
     enemy kinds to arenaPool() in engine.js, gated behind a higher wave number. */
  {id:'blacklevel', name:'Survive Waves in the Void', bgKey:'__black__', black:true, BGW:8534, srcY:0, flatGround:200, chain:true, next:null, prev:null,
   arena:true, enemies:[],
   /* 8 dancing-couple NPCs (NOT enemies) — placed across the FINAL 2 MP4 panels
      (tileW 1200 each, so x 6000-8400 = the last quarter of the level), 4 per panel.
      Raised up the path (yOff) so they sit higher than the player as background
      dancers. Dancingcouple.mp3 fades in near them. Nudge `at`/`yOff`/`h` to taste. */
   npcs:[
     {img:'couple', fw:234, fh:231, at:6150, h:105, yOff:-40, face:1,  clip:{start:0,count:15,fps:8,loop:true}, mp3:'Dancingcouple.mp3', range:220},
     {img:'couple', fw:234, fh:231, at:6450, h:105, yOff:-40, face:-1, clip:{start:0,count:15,fps:8,loop:true}, mp3:'Dancingcouple.mp3', range:220},
     {img:'couple', fw:234, fh:231, at:6750, h:105, yOff:-40, face:1,  clip:{start:0,count:15,fps:8,loop:true}, mp3:'Dancingcouple.mp3', range:220},
     {img:'couple', fw:234, fh:231, at:7050, h:105, yOff:-40, face:-1, clip:{start:0,count:15,fps:8,loop:true}, mp3:'Dancingcouple.mp3', range:220},
     {img:'couple', fw:234, fh:231, at:7350, h:105, yOff:-40, face:1,  clip:{start:0,count:15,fps:8,loop:true}, mp3:'Dancingcouple.mp3', range:220},
     {img:'couple', fw:234, fh:231, at:7650, h:105, yOff:-40, face:-1, clip:{start:0,count:15,fps:8,loop:true}, mp3:'Dancingcouple.mp3', range:220},
     {img:'couple', fw:234, fh:231, at:7950, h:105, yOff:-40, face:1,  clip:{start:0,count:15,fps:8,loop:true}, mp3:'Dancingcouple.mp3', range:220},
     {img:'couple', fw:234, fh:231, at:8250, h:105, yOff:-40, face:-1, clip:{start:0,count:15,fps:8,loop:true}, mp3:'Dancingcouple.mp3', range:220} ]},

  /* ── HOLODECK (entered from the hub Portal -> travel menu) ─────────────
     A full-screen MP4 backdrop: one widescreen clip (holodeck.mp4) fills the
     WHOLE screen (no separate floor band) and is drawn TWICE side-by-side, so
     the level is two screens wide and SCROLLS smoothly (the panels are anchored
     to the world; the camera pans across as you run). Add flip:true to the line
     below if you ever want a flip-screen camera instead (snaps panel-to-panel,
     no scroll). black underneath, the video is silent, Holodeck.mp3 is the
     sound. Want it longer? Add screens: set BGW to (number-of-screens x 534). */
  {id:'holodeck', name:'The Underworld', bgKey:'__black__', black:true, BGW:2136, srcY:0, flatGround:180, chain:true, next:null, prev:null,
   arena:true, arenaPool:[2,3,7,12,14], arenaSpecial:8, arenaSpecialName:'UFO ASSAULT', arenaSpecialHp:200,
   arenaBaseCount:8, arenaMaxCount:18, arenaGrowth:2, enemies:[]},   // 4 screens wide (4 x tileW 534); holodeck.mp4 tiles across all of them

  /* ── JUDGEMENT DAY (entered from the hub Portal -> travel menu) ─────────
     Endless wave arena vs the machines: BLADEBOT (arm-blades), GUNBOT (a SHOOTER
     that sprays normal machine-gun rounds), and two MMA combat bots (BOSTONBOT /
     TESLABOT). Every 5th wave is a GUNBOT SQUAD (a firing line of miniguns). Black
     backdrop for now; walk off the far LEFT to leave. Its own leaderboard saves to
     this device (arena_judgement). Add a backdrop later via SCENE_VIDEOS if wanted. */
  {id:'judgement', name:'Judgement Day', bgKey:'__black__', black:true, BGW:2136, srcY:0, flatGround:200, chain:true, next:null, prev:null,
   arena:true, arenaPool:[15,17,18,19], arenaSpecial:16, arenaSpecialName:'GUNBOT SQUAD', arenaSpecialHp:150,
   arenaSpecialBase:3, arenaSpecialMax:10, arenaBaseCount:6, arenaMaxCount:16, arenaGrowth:1.6, enemies:[]},

  /* ── BOSS MODE (entered from the hub Portal -> travel menu) ─────────────
     A gauntlet where EVERY wave is one of the portal "special squads", cycling
     through the list below and getting bigger + tankier each wave. 3 screens
     wide (3 x tileW 534 = BGW 1602); one MP4 (bossmode.mp4 via SCENE_VIDEOS)
     tiles across all three and scrolls. Bossmode.mp3 is the sound. arenaBossMode
     makes the wave spawner ignore the normal mix and run the sequence; full
     health is restored every 3rd wave so it stays just-about survivable.
     Reorder/extend arenaBossSequence to taste (kind numbers from ENEMY_KINDS). */
  {id:'bossmode', name:'Boss Mode', bgKey:'__black__', black:true, BGW:1602, srcY:0, flatGround:225, chain:true, next:null, prev:null,
   arena:true, arenaBossMode:true,
   arenaBossSequence:[ {kind:10, name:'GUNMAN SQUAD'}, {kind:8, name:'UFO ASSAULT'}, {kind:16, name:'GUNBOT SQUAD'} ],
   arenaSpecialHp:150, arenaBaseCount:4, arenaMaxCount:14, arenaGrowth:0.8, enemies:[]},


  /* ── INTERIOR ROOMS (entered from the hub; EXIT door returns to the street) ── */
  {id:'in_house', name:'Inside &mdash; My House', bgKey:'room_house', BGW:591, srcY:46, flatGround:277, charScale:1.3, interior:true, exitLeft:'home', exitRight:'home', enemies:[],
   doors:[]},
  {id:'in_church', name:'Inside &mdash; The Church', bgKey:'room_church', BGW:591, srcY:46, flatGround:275, charScale:1.3, interior:true, exitLeft:'home', exitRight:'home', enemies:[],
   doors:[]},
  {id:'in_gunstore', name:'Inside &mdash; FAFO Ammo &amp; Arms', bgKey:'room_gunstore', BGW:591, srcY:46, flatGround:273, charScale:1.3, interior:true, exitLeft:'home', exitRight:'home', enemies:[],
   doors:[ {x:250, w:95, label:'Buy weapons', target:'shop'} ]},
  /* walking path was sitting too high — flatGround nudged 277->285 to drop the feet (this
     is the safe lever within the current view). If he's STILL floating above the painted
     floor, the camera needs to pan down: send a screenshot and I'll set srcY+flatGround
     exactly (raise flatGround to drop him; raise srcY to reveal more floor below). */
  {id:'in_restore', name:'Inside &mdash; Restore Britain', bgKey:'room_restore', BGW:580, srcY:46, flatGround:285, charScale:1.7, interior:true, exitLeft:'home', exitRight:'home', enemies:[],
   doors:[]},
  {id:'in_cinema', name:'Inside &mdash; The Cinema', bgKey:'room_cinema', BGW:591, srcY:46, flatGround:273, charScale:1.3, interior:true, exitLeft:'home', exitRight:'home', enemies:[],
   doors:[]},
  {id:'in_easyjet', name:'Inside &mdash; easyJet Holidays', bgKey:'room_easyjet', BGW:580, srcY:46, flatGround:277, charScale:1.3, interior:true, exitLeft:'home', exitRight:'home', enemies:[],
   doors:[ {x:290, w:74, label:'Departures', menu:'easyjet'} ]},
  {id:'in_trainstation', name:'Inside &mdash; DigiTown Station', bgKey:'room_trainstation', BGW:580, srcY:46, flatGround:281, charScale:1.3, interior:true, exitLeft:'home', exitRight:'home', enemies:[],
   doors:[ {x:290, w:74, label:'Departures', menu:'trainstation'} ]},
  /* ── THE SEA — first-person scope SHOOTING GALLERY (reached from the Train
     Station departures board). `sea:true` makes the engine run the shooting-gallery
     mode instead of the platformer (see "THE SEA" block in engine.js). Drag to aim,
     tap / STRIKE to fire; shoot the moving seagulls, buoys, bottles and clay pigeons.
     Backdrop = room_sea.jpeg. There's an on-screen ◀ LEAVE button back to the hub.   */
  {id:'the_sea', name:'Dover Shooting Range', bgKey:'room_sea', BGW:800, sea:true, interior:true, enemies:[], doors:[]},
  /* ── ZOMBIES — first-person WAVE DEFENCE through the portal. `zdef:true` runs the
     zombie-defence mode in engine.js: same scope/machine gun/joystick as the Dover
     range, but zombies pour out of the portal and walk AT you, growing as they come.
     Each takes a few rounds to drop; one that reaches you costs a heart (3 hearts).
     Waves get bigger and faster. ◀ LEAVE (or dying) returns to the hub portal.      */
  {id:'lvl_zombies', name:'Zombies', bgKey:'room_zombies', BGW:800, zdef:true, interior:true, enemies:[], doors:[]},
  /* LIBRARY swapped to the wide Alexandria panorama (room library.jpeg now 2172x375).
     zoom:1.0 shows an 800px-wide slice; walk RIGHT to explore, walk off the far LEFT to
     leave (exitLeft:'home'). Nudge flatGround/srcY/charScale to taste. */
  {id:'in_library', name:'Inside &mdash; The Library', bgKey:'room_library', BGW:2172, zoom:1.0, srcY:8, flatGround:332, charScale:1.7, interior:true, walkMul:1.7, exitLeft:{target:'home',x:1740,face:1}, exitRight:{target:'home',x:1740,face:1},
   enemies:[],
   /* A blue AI HOLOGRAM hums in the CENTRE of the library (x:1086, room is 2172 wide).
      Harmless background NPC (visual only). Its narration now plays as the room's
      background music (Library.mp3 in TRACKS) — the old Hologram.mp3 proximity slot was
      removed. Optional art: hologram.png as a single-row strip; until it exists nothing
      is drawn. Nudge fw/fh/h once art is in. */
   npcs:[ {img:'hologram', fw:240, fh:360, at:1086, h:170, face:1,
           clip:{start:0, count:6, fps:8, loop:true}} ],
   /* Reading desk in the CENTRE of the library (x:1086, on the hologram). STRIKE opens
      the PDF menu (READ / DOWNLOAD each file). Files listed in PDF_MENUS.library below. */
   doors:[ {x:1086, w:120, label:'The Reading Desk', pdfMenu:'library'} ]},
  /* WINCHESTER swapped to the wide pub panorama (room winchester.jpeg now 2172x387).
     zoom:1.0 shows an 800px-wide slice. Character made BIGGER (charScale 2.2) and the view
     panned down (srcY:27) with flatGround:360 so he walks the front floorboards IN FRONT of
     the bar stools (seats behind him). EXIT from EITHER end by walking off the edge
     (exitLeft + exitRight). Nudge flatGround/charScale to taste. */
  /* Positions measured against room winchester.jpeg (2172 wide): the TOILET door sits under
     the green "Toilets" sign (x:880) and is LOCKED until you carry 'toiletkey' (found in
     DUNDEE). The JUKEBOX (see JUKEBOX below) is the Wurlitzer at the far right (x:1994) —
     STRIKE near it to flip through its track slots, like the house TV but for music. */
  {id:'in_winchester', name:'Inside &mdash; The Winchester', bgKey:'room_winchester', BGW:2172, zoom:1.0, srcY:27, flatGround:360, charScale:2.2, interior:true, exitLeft:'home', exitRight:'home', enemies:[],
   /* (The joke teller swapped places with the BURGER KING — he's on the Special Guest
      stage now, and the King holds court by the pool table. The King is the custom
      BK/bkNpc system in engine.js; his spot is set in BK={} further down this file.) */
   /* BARMAN — torso-only sprite (pint in one hand, cocktail in the other) stood BEHIND
      the bar: yOff lifts him so his waist disappears behind the counter top. Nudge
      at (left/right along the bar), h (size) and yOff (how deep behind the counter). */
   npcs:[ {img:'barman', fw:141, fh:150, at:1465, h:104, yOff:-166, face:1,
           clip:{start:0,count:8,fps:5,loop:true}, mp3:'Barman.mp3', range:200} ],
   doors:[ {x:880, w:110, label:'The Toilet', target:'in_toilet', locked:true, key:'toiletkey'},
           /* Middle of the bar (BGW is 2172, so x:1086 is dead centre) — STRIKE opens your
              Ko-fi page in a new tab. PLACEHOLDER URL below — swap it for your real Ko-fi
              link (find-and-replace the one line). Nudge x if it doesn't sit where you want. */
           {x:1500, w:100, label:'Buy Me A Pint', url:'https://ko-fi.com/fdc'} ]},

  /* ── THE WINCHESTER TOILET (the gents). Reached from the locked door inside the
     Winchester. Placeholder dark room until room toilet.jpeg exists; EXIT door goes
     back to the bar. Nudge BGW/srcY/flatGround/charScale once the art is in. */
  {id:'in_toilet', name:'Inside &mdash; The Gents', bgKey:'room_toilet', BGW:591, zoom:1.35, srcY:46, flatGround:275, charScale:1.7, interior:true, enemies:[],
   /* The wall door is JAMMED: striking it flashes a message and reveals the only real way out —
      a DIVE into the toilet pan in the middle of the room, which drops you into 'in_shitter'.
      The pan exit (needArm) only appears AFTER the player tries the jammed door. Nudge the pan
      door x/w so the down-arrow sits over the painted pan, and the jammed door x over the wall door. */
   doors:[ {x:506, w:92, label:'EXIT &mdash; back to the bar', jammed:true},
           {x:300, w:120, label:'Jump in the shitter!', target:'in_shitter', arrow:true, needArm:true} ]},

  /* ── THE SHITTER (dive in from the toilet pan) ─────────────────────────
     A single-screen UNDERWATER room. Full-screen MP4 backdrop (shitter.mp4 via
     SCENE_VIDEOS; black until uploaded), Shitter.mp3 for sound. water:true gives
     buoyant swim physics (JUMP = swim-stroke up, gentle sink); dropIn:true drops
     the player in from the TOP-LEFT and they sink down through the water. BGW=800
     with zoom 1.0 = exactly one screen, so it doesn't scroll. The ONLY way out is
     the door at the BOTTOM-RIGHT: STRIKE there to climb out to Cottagers Cove. */
  {id:'in_shitter', name:'The Shitter', bgKey:'__black__', black:true, BGW:800, zoom:1.0, srcY:0, flatGround:330, charScale:1.2, interior:true, water:true, dropIn:true, enemies:[],
   /* A floating STACK OF CASH (£2000) bobs in mid-water — swim up to it to grab it. float:true +
      yOff raise it off the floor; money:2000 pays out on pickup. cash.png optional (green stack
      drawn until it's uploaded). id is unique so once grabbed it won't respawn (saved in inventory). */
   items:[ {id:'shittercash', at:400, h:46, yOff:150, float:true, money:2000, label:'\u00A32000'} ],
   doors:[ {x:744, w:120, label:'Climb out &mdash; to Cottagers Cove', target:'in_cottagers'} ]},


  /* ── NEW INTERIOR ROOMS ───────────────────────────────────────────────
     Same shape as the rooms above: enter from the hub, EXIT door (right side)
     pops back to the street. Defaults copied from the church room — nudge
     BGW / srcY / flatGround / charScale to match each new room jpeg, and move
     the EXIT door x to sit over the painted doorway. Each has a music slot in
     TRACKS (see below) and a room-background image in ASSETS. */
  /* Police Station is a wide walk-through (enquiries -> custody cells -> staff
     room) so it uses the full 2182px-wide image. srcY/flatGround/charScale are
     starting guesses — nudge on the phone. EXIT door sits near the entrance. */
  {id:'in_police', name:'Inside &mdash; Police Station', bgKey:'room_police', BGW:2182, zoom:0.85, srcY:150, flatGround:545, charScale:2.2, interior:true, exitLeft:'home', enemies:[],
   doors:[]},   // EXIT by walking off the far LEFT of the room (no STRIKE) — exitLeft:'home'
  /* ── SLAMMIN' VINYL (the club lobby; room nightclub.jpeg, 2048px wide). Leave
     by walking off the far LEFT, back through the turnstiles (exitLeft:'home').
     The 3 doors lead to the club rooms — nudge each x so the marker sits over the
     painted door, and tune srcY/flatGround/charScale so feet land on the floor in
     front of them (mirrors the police-room camera as a sensible starting point).
     walkMul:2.0 stops the walk feeling sluggish at this low zoom. */
  {id:'in_nightclub', name:"Inside &mdash; Slammin' Vinyl", bgKey:'room_nightclub', BGW:2048, zoom:0.85, srcY:150, flatGround:560, charScale:2.5, interior:true, walkMul:2.0, exitLeft:'home', enemies:[],
   doors:[ {x:958,  w:100, label:'Room 1 &mdash; Drum &amp; Bass', target:'in_dnb'},
           {x:1335, w:100, label:'Room 2 &mdash; Hip-Hop',        target:'in_hiphop'},
           {x:1712, w:100, label:'Room 3 &mdash; Special Guest',  target:'in_special'} ]},
  /* ── CRACKADILLY GARDENS (the stitched 3-panorama park; end of the hub) ──
     One wide outdoor walk-through built from Park1+Park2+Park3 stitched into a
     single seamless jpeg (room crackadilly.jpeg, 5946px wide). interior:true so
     the EXIT door pops you back to the hub. srcY / flatGround / charScale are
     tuned from your in-game screenshots: srcY:140 slides the view DOWN so the
     wet pavement (the bottom ~45% of the image) shows along the bottom of the
     screen, and flatGround:350 drops the player's feet onto that pavement.
     Nudge if needed — raise flatGround (e.g. 350->370) to push him lower; raise
     srcY (e.g. 140->165) to reveal even more pavement at the very bottom.
     EXIT: walk off the far LEFT of the level (no STRIKE) — exitLeft:'home'. The
     door at the far-right end is the Cottagers Cove underpass (a separate room).
     groundPts gives the walk a DIP through the canal basin: 350 (towpath) for most
     of the level, dropping to ~366 across the basin (world x ~4300-5000) so the
     player walks the wet stone quay in FRONT of the water, then climbs back to 350
     for the towpath/underpass. Each point spans groundStep (100) world px. To drop
     him further into the basin, raise those dip numbers toward 378 (378 is ~the
     very bottom of the view); flatGround:350 stays as a fallback if the image ever
     fails to load. Nudge the underpass door x (5300) to sit over the tunnel mouth.
     Music: Crackadilly.mp3 (already in TRACKS).
     ENEMIES: six crackmen (kind 13) plus four hooded STABBERS (kind 14) interspersed
     between them. Stabbers walk you down and knife you on contact — die anim is the
     hit -> kneel -> lying-dead-with-blood sequence. Nudge at/hp to taste. */
  {id:'in_crackadilly', name:'Crackadilly Gardens', bgKey:'room_crackadilly', BGW:5946, srcY:140, flatGround:350, charScale:1.2, interior:true, helpers:true, exitLeft:'home',
   enemies:[ {at:800,kind:13},{at:1200,kind:14,hp:50},{at:1600,kind:13},{at:2000,kind:14,hp:50},{at:2400,kind:13},{at:3200,kind:13},{at:3600,kind:14,hp:50},{at:4000,kind:13},{at:4800,kind:13},{at:5200,kind:14,hp:50},{at:2800,kind:20,hp:60},{at:4400,kind:20,hp:60},
             {at:1400,kind:5,spd:1.6,scaleMul:1.08},{at:2600,kind:5,spd:1.6,scaleMul:1.08},{at:3800,kind:5,spd:1.6,scaleMul:1.08},{at:5000,kind:5,spd:1.6,scaleMul:1.08},
             /* reinforcements: extra POLICE + DELIVEROO riders along the gardens */
             {at:1000,kind:0,scaleMul:1.3},{at:1800,kind:0,scaleMul:1.3},{at:3000,kind:0,scaleMul:1.3},{at:4200,kind:0,scaleMul:1.3},{at:5300,kind:0,scaleMul:1.3},
             {at:2200,kind:5,spd:1.6,scaleMul:1.08},{at:4600,kind:5,spd:1.6,scaleMul:1.08} ],
   groundStep:100,
   groundPts:[350,350,350,350,350,350,350,350,350,350,350,350,350,350,350,350,350,350,350,350,350,350,350,350,350,350,350,350,350,350,350,350,350,350,350,350,350,350,350,350,350,350,350,352,360,364,366,366,366,362,354,350,350,350,350,350,350,350,350,350],
   doors:[ {x:5500, w:150, label:'Cottagers Cove &mdash; underpass', target:'in_cottagers'} ]},

  /* ── EUROPE (easyJet destination) ──────────────────────────────────────────
     A simple walkable level — gardenman paces here for now. Placeholder backdrop
     until 'room europe.jpeg' (asset key room_europe) exists. Run off the LEFT edge
     to return to the hub. Nudge BGW / flatGround / gardenman pace once art is in.
     zoom bumped 1.3->1.6 to make the backdrop (landmarks) bigger/fill the screen
     more; charScale dropped 1.3->0.81 to CANCEL that extra zoom out for the
     player specifically, so he goes back to his normal on-screen size instead
     of growing along with the bigger buildings. srcY re-tuned to keep the
     pavement in view at the new zoom. respawn:true — enemies come back every
     time you re-enter. Many more enemies spread across the FULL level width
     (including right near the start and right near the far end) so they close
     in on you from both directions as you walk, not just from ahead. */
  {id:'lvl_europe', name:'Europe', bgKey:'room_europe', BGW:2172, zoom:1.6, srcY:123, flatGround:330, charScale:0.81, interior:true, walkMul:1.5, exitLeft:'home', respawn:true, helpers:true, endlessSpawn:true,
   enemies:[ {at:60,kind:23,hp:70,scaleMul:0.625},{at:280,kind:23,hp:70,scaleMul:0.625},{at:500,kind:23,hp:70,scaleMul:0.625},{at:720,kind:23,hp:70,scaleMul:0.625},{at:940,kind:23,hp:70,scaleMul:0.625},{at:1160,kind:23,hp:70,scaleMul:0.625},{at:1380,kind:23,hp:70,scaleMul:0.625},{at:1600,kind:23,hp:70,scaleMul:0.625},{at:1820,kind:23,hp:70,scaleMul:0.625},{at:2040,kind:23,hp:70,scaleMul:0.625} ],
   doors:[]},

  /* ── AMERICA (easyJet destination) ──────────────────────────────────────────
     Placeholder walkable level — a dancing figure struts in place (proximity MP3
     slot Potus.mp3 fades in as you approach). Add 'room america.jpeg' (asset key
     room_america) for art; run off the LEFT edge to return to the hub.
     Same zoom/charScale treatment as Europe: zoom 1.3->1.6 for a bigger backdrop,
     charScale 1.3->0.81 to cancel that out for the player so he stays normal-sized.
     srcY re-tuned to keep the pavement in view. respawn:true — enemies come back
     every time you re-enter. */
  {id:'lvl_america', name:'America', bgKey:'room_america', BGW:2172, zoom:1.6, srcY:138, flatGround:345, charScale:0.81, interior:true, walkMul:1.5, exitLeft:'home', respawn:true, helpers:true,
   enemies:[ {at:500,kind:21,hp:80,scaleMul:0.625},{at:1000,kind:22,hp:80,scaleMul:0.625},{at:1500,kind:21,hp:80,scaleMul:0.625},{at:1900,kind:22,hp:80,scaleMul:0.625},{at:750,kind:24,hp:90,scaleMul:0.625},{at:1300,kind:24,hp:90,scaleMul:0.625} ],
   npcs:[ {img:'potus', fw:233, fh:362, at:1086, h:84, yOff:0, face:1,
           clip:{start:0,count:18,fps:9,loop:true}, mp3:'Potus.mp3', range:260},
          /* decorative dancing PAIR near the end of the level (BGW 2172). 16-frame sheet;
             frames 0-11 are the continuous pair dance (loop). Bump count to 16 to include the
             solo/finish poses. Not an enemy — background only, no collision. Nudge at/h/face. */
          {img:'devildance', fw:374, fh:283, at:1980, h:109, yOff:0, face:1,
           clip:{start:0,count:12,fps:5,loop:true}, mp3:'Devildance.mp3', range:200} ],
   doors:[]},

  /* ── SLAMMIN' VINYL ROOMS (entered from the club lobby; EXIT door -> lobby) ──
     Interiors for the three club rooms (room dnb/hiphop/
     special.jpeg). Each loops its own track (see TRACKS). The engine draws a dark
     room until the art exists; nudge BGW/srcY/flatGround/charScale once it does. */
  {id:'in_dnb', name:'Room 1 &mdash; Drum &amp; Bass', bgKey:'room_dnb', BGW:591, bgScale:2, srcY:46, flatGround:275, charScale:1.3, interior:true, enemies:[],
   /* two background dancing couples (NOT enemies) just looping a dance on the floor */
   npcs:[ {img:'dnbcouple1', fw:328, fh:310, at:175, h:130, yOff:0, face:1,  clip:{start:0,count:15,fps:6,loop:true}, mp3:'Dnbcouple1.mp3', range:180},
          {img:'dnbcouple2', fw:260, fh:272, at:410, h:130, yOff:0, face:-1, clip:{start:0,count:15,fps:8,loop:true}, mp3:'Dnbcouple2.mp3', range:180} ],
   doors:[ {x:506, w:92, label:'EXIT &mdash; to the lobby', target:'in_nightclub'} ]},
  /* HIP-HOP room: the original dancer + the green dancer + the "TV guy" (orange-shirt
     bloke hugging a safe, tvguy.png) boogieing on the spot. The purple dancer was removed.
     Decorative NPCs: no collision, can't be hit. Nudge at/h/face to taste. */
  {id:'in_hiphop', name:'Room 2 &mdash; Hip-Hop', bgKey:'room_hiphop', BGW:591, bgScale:2, srcY:46, flatGround:275, charScale:1.3, interior:true, enemies:[],
   /* background dancers (NOT enemies) just looping a dance on the floor.
      Green dancer sits in the MIDDLE, flanked by the original dancer (left) and the TV guy (right). */
   npcs:[ /* bigman3 as a DECORATIVE background walker (NOT an enemy here). Listed FIRST so he
             draws BEHIND the other dancers (scenery paints in array order). Smaller (h:80) and
             raised up the scene (yOff:-55) so he reads as further back = depth. Paces a shorter
             range now (80..400) so he doesn't wander as far right. Walk frames 0-5. */
          {img:'bigman3', fw:484, fh:438, at:200, h:80, yOff:-55, face:1,
           clip:{start:0,count:6,fps:9,loop:true}, pace:true, paceFrom:80, paceTo:400, paceSpd:0.6, mp3:'Bigman3.mp3', range:180},
          {img:'dancer',  fw:163, fh:310, at:220, h:135, yOff:0, face:1,  clip:{start:8,count:6,fps:9,loop:true}, mp3:'Dancer.mp3', range:180},
          {img:'dgreen',  fw:156, fh:231, at:355, h:104, yOff:0, face:1,  clip:{start:0,count:6,fps:9,loop:true}, mp3:'Dgreen.mp3', range:180},
          {img:'tvguy',   fw:231, fh:369, at:490, h:128, yOff:0, face:-1, clip:{start:0,count:18,fps:7,loop:true}, mp3:'Tvguy.mp3', range:180} ],
   doors:[ {x:506, w:92, label:'EXIT &mdash; to the lobby', target:'in_nightclub'} ]},
  {id:'in_special', name:'Room 3 &mdash; Special Guest', bgKey:'room_special', BGW:591, bgScale:2, srcY:46, flatGround:275, charScale:1.3, interior:true, enemies:[],
   /* Decorative NPC: the carried sedan-chair group strolls back and forth along the floor on
      the player's path (normal size, ground level). Nudge h / paceFrom-To / paceSpd / face. */
   npcs:[ {img:'piggybackguy', fw:151, fh:287, at:240, h:130, yOff:0, face:1,
           clip:{start:0,count:11,fps:8,loop:true}, pace:true, paceFrom:130, paceTo:420, paceSpd:0.45, mp3:'Piggybackguy.mp3', range:190},
          /* JOKE TELLER — swapped with the Burger King: stands on the stage in the King's
             exact old spot (centre x:280, raised 110, same drawn size). Jokeman.mp3 fades
             up as you approach. */
          {img:'jokeman', fw:156, fh:223, at:253, h:78, yOff:-110, face:1,
           clip:{start:0,count:8,fps:6,loop:true}, mp3:'Jokeman.mp3', range:180} ],
   doors:[ {x:506, w:92, label:'EXIT &mdash; to the lobby', target:'in_nightclub'} ]},

  /* ── COTTAGERS COVE (the underpass at the far end of Crackadilly Gardens) ──
     A standalone room reached from the gardens' right-hand underpass door.
     Placeholder until you make room cottagers.jpeg; EXIT pops back to the hub. */
  /* COTTAGERS COVE now uses the wide underpass panorama (room cottagers.jpeg, 2172x724).
     zoom:0.72 fits the wall+railing above and the brick towpath below; flatGround:620 stands
     the player on the front bricks (railing/canal behind). Reached from the Crackadilly
     underpass door; walk off the far LEFT to return to the hub (exitLeft:'home'). */
  {id:'in_cottagers', name:'Cottagers Cove', bgKey:'room_cottagers', BGW:2172, zoom:0.72, srcY:160, flatGround:620, charScale:2.5, interior:true, walkMul:2.2, respawn:true,
   exitLeft:{target:'in_crackadilly', x:5500, face:-1},   // far LEFT -> back to the Crackadilly underpass entrance
   exitRight:'home',                                       // far RIGHT -> out to the main hub
   enemies:[ {at:900,kind:9,hp:220,scaleMul:1.15},
             {at:1500,kind:11,hp:220,scaleMul:0.84} ],   // just ONE bruiser + ONE tracksuit, both tanky (hp 220); respawn:true = they're back every time you enter
   doors:[]},

  /* Placeholder for travel destinations that aren't built yet (easyJet / train
     station locations). When you create a real level, give it its own id and
     point the travel menu entry at it — anything still pointing at a missing
     id lands here.                                                          */
  {id:'empty', name:'Under construction', bgKey:'__empty__', BGW:1000, srcY:26, flatGround:245, interior:true, enemies:[],
   doors:[ {x:500, w:130, label:'EXIT &mdash; back', target:'home'} ]},
];
/* ── PER-LEVEL MUSIC ── */
const TRACKS={ select:'Character selection screen.mp3', home:'Home.mp3', street:'Street.mp3',
  park:'Park.mp3', belfast:'Belfast.mp3', pub:'Pub.mp3', dundee:'Dundee.mp3', glasgow:'Glasgow.mp3', southampton:'Southampton.mp3',
  mk:'Mortalkombat.mp3',
  /* ── INTERIOR AUDIO SLOTS ─────────────────────────────────────────────
     One looping .mp3 per building that has NO video screen. Upload each
     file to GitHub next to index.html with the EXACT name below (Vercel is
     case-sensitive). Any slot whose file isn't uploaded just stays silent —
     nothing breaks. Buildings WITH a screen (house, cinema, restore) get
     their sound from the .mp4 instead and are deliberately left out here.  */
  in_church:'Church.mp3', in_gunstore:'Gunstore.mp3', in_easyjet:'Easyjet.mp3',
  in_trainstation:'Trainstation.mp3', in_library:'Library.mp3', in_winchester:'Winchester.mp3',
  in_toilet:'Toilet.mp3',
  /* ── NEW ROOM MUSIC SLOTS (upload these three .mp3s next to index.html) ── */
  in_police:'Police.mp3', in_nightclub:'Slamminvinyl.mp3', in_crackadilly:'Crackadilly.mp3',
  in_dnb:'Dnb.mp3', in_hiphop:'Hiphop.mp3', in_special:'Specialguest.mp3', in_cottagers:'Cottagerscove.mp3',
  /* ── BLACK LEVEL + HOLODECK MUSIC (the MP4s are silent; these are the sound) ── */
  blacklevel:'Void.mp3', holodeck:'Holodeck.mp3', judgement:'Judgement.mp3', bossmode:'Bossmode.mp3',
  lvl_europe:'Europe.mp3', lvl_america:'America.mp3', in_shitter:'Shitter.mp3', the_sea:'Sea.mp3', lvl_zombies:'Zombies.mp3' };
/* ── THE WINCHESTER JUKEBOX ────────────────────────────────────────────────
   Works exactly like the house TV, but for MUSIC. Stand near the jukebox in the
   Winchester and STRIKE to flip to the next track; the chosen .mp3 becomes the
   room's music. `x` is the jukebox spot in ROOM pixels (room is 2172 wide) and
   `reach` is how close you must be before the STRIKE-to-change prompt appears.
   TEN slots are provided below — Track 1 is the existing Winchester.mp3 so the
   room sounds the same until you flip it; upload Juke2.mp3 .. Juke10.mp3 next to
   index.html (EXACT lower-case names) to fill the rest. Missing files just stay
   silent. Add a jukebox to any other room by adding another `id:{...}` entry. */
const JUKEBOX={
  in_winchester:{ x:1994, reach:150, idx:0, glowY:0.49, glowR:84,
    files:['Winchester.mp3','Juke2.mp3','Juke3.mp3','Juke4.mp3','Juke5.mp3',
           'Juke6.mp3','Juke7.mp3','Juke8.mp3','Juke9.mp3','Juke10.mp3'] },
};
/* ── AMBIENT GLOWS ─────────────────────────────────────────────────────────
   Soft pulsing halos painted onto things that emit light (candles, neon, lamps,
   signs) so rooms feel lit — the same idea as the jukebox glow, but data-driven
   per room. Drawn additively BEHIND the characters. Each entry uses WORLD coords
   (the same space as enemies/doors):
     x,y   = world position of the light (room pixels; y measured like the floor line)
     r     = base glow radius (world px)
     mode  = 'warm'  -> flickering candle / warm-bulb amber (fire, lanterns, lamps)
             'cycle' -> slow rainbow neon (clubs, signs)
             (omit)  -> a steady glow at fixed `hue`
     hue   = 0 red · 16 orange · 40 amber · 120 green · 200 cyan · 300 magenta (when no mode)
     alpha = peak strength (default 0.22); sat/light optional fine-tuning
   All positions are EYEBALLED — nudge x/y on the phone so each glow sits on the
   actual candle / sign / lamp in the room art. Add lights to any room by adding an
   `id:[ ... ]` block; remove a glow by deleting its line. */
const GLOWS={
  /* HIGH STREET (home4.png 2868x266) — daytime, so only the things that truly emit:
     the portal vortex, the cinema marquee + poster boxes, the club neon, police sign. */
  home: [
    {x:1489, y:126, r:64, hue:205, sat:90, light:62, alpha:0.26},   // the blue PORTAL vortex
    {x:905,  y:62,  r:42, hue:42,  sat:90, light:60, alpha:0.18},   // CINEMA marquee
    {x:840,  y:172, r:26, hue:205, sat:70, light:60, alpha:0.12},   // cinema poster lightbox
    {x:975,  y:172, r:26, hue:205, sat:70, light:60, alpha:0.12},
    {x:2504, y:103, r:50, hue:305, sat:92, light:62, alpha:0.22},   // SLAMMIN VINYL neon
    {x:2304, y:103, r:26, hue:215, sat:80, light:62, alpha:0.12},   // police 'DP' sign
  ],
  /* THE WINCHESTER (room_winchester.jpeg 2172x387) — warm bar dome lamps, wall sconces,
     the pool-table pendant, the right-hand candle, the green Toilets sign. Read off the
     art. The jukebox has its own glow (drawJukeGlow). */
  in_winchester: [
    {x:122,  y:70,  r:34, mode:'warm', alpha:0.22},                 // left wall sconce
    {x:355,  y:55,  r:42, mode:'warm', alpha:0.22},                 // pool-table pendant
    {x:605,  y:130, r:28, mode:'warm', alpha:0.18},                 // mid wall sconce (right of England flag)
    {x:815,  y:120, r:28, mode:'warm', alpha:0.18},                 // sconce by the dartboard
    {x:878,  y:68,  r:22, hue:130, sat:85, light:55, alpha:0.16},   // green 'Toilets' sign
    {x:1198, y:95,  r:44, mode:'warm', alpha:0.26},                 // bar dome lamp (left)
    {x:1480, y:95,  r:44, mode:'warm', alpha:0.26},                 // bar dome lamp (right)
    {x:1840, y:140, r:24, mode:'warm', alpha:0.32},                 // lit candle on the cabinet
  ],
  /* THE GUN STORE (room_gunstore.jpeg 591x323) — neon kept by request; other lights removed. */
  in_gunstore: [
    {x:296, y:74,  r:78, hue:345, sat:95, light:58, alpha:0.26},    // FAFO neon (red/pink) — kept; other lights removed
  ],
  /* THE LIBRARY (room_library.jpeg 2172x375) — the central AI hologram glows cyan (body
     + floor ring), warm wall lanterns, blue digital-archive kiosks. */
  in_library: [
    {x:1086, y:158, r:95, hue:195, sat:85, light:66, alpha:0.24},   // AI hologram (centre)
    {x:1086, y:270, r:85, hue:200, sat:90, light:60, alpha:0.20},   // hologram floor ring
    {x:98,   y:113, r:30, mode:'warm', alpha:0.18},                 // left lantern
    {x:250,  y:113, r:26, mode:'warm', alpha:0.16},                 // left lantern 2
    {x:2074, y:113, r:30, mode:'warm', alpha:0.18},                 // right lantern
    {x:586,  y:233, r:26, hue:205, sat:80, light:60, alpha:0.16},   // blue archive kiosk
    {x:977,  y:225, r:24, hue:205, sat:80, light:60, alpha:0.16},
    {x:1346, y:225, r:24, hue:205, sat:80, light:60, alpha:0.16},
    {x:1694, y:240, r:26, hue:205, sat:80, light:60, alpha:0.16},
  ],
  /* COTTAGERS COVE (room_cottagers.jpeg 2172x724) — only the two harsh strip-lights on
     the right of the underpass. */
  in_cottagers: [
    {x:1553, y:195, r:56, hue:210, sat:12, light:88, alpha:0.20},   // strip light 1
    {x:2020, y:188, r:56, hue:210, sat:12, light:88, alpha:0.20},   // strip light 2
  ],
  /* SLAMMIN' VINYL LOBBY (room_nightclub.jpeg 2048x768) — wall-to-wall neon: the club
     sign, reception, the three coloured door signs, the SLAM MODE poster + spotlight. */
  in_nightclub: [
    {x:338,  y:276, r:48, hue:320, sat:95, light:62, alpha:0.20},   // SLAMMIN VINYL neon
    {x:666,  y:161, r:40, hue:315, sat:95, light:62, alpha:0.18},   // RECEPTION sign
    {x:686,  y:399, r:55, hue:315, sat:95, light:60, alpha:0.22},   // reception desk underglow
    {x:1003, y:160, r:48, hue:205, sat:90, light:62, alpha:0.18},   // ROOM 1 — DNB (blue)
    {x:1403, y:160, r:48, hue:25,  sat:95, light:60, alpha:0.18},   // ROOM 2 — HIP-HOP (orange)
    {x:1700, y:160, r:48, hue:282, sat:90, light:62, alpha:0.18},   // ROOM 3 — SPECIAL GUEST (purple)
    {x:1905, y:269, r:50, hue:282, sat:90, light:62, alpha:0.20},   // SLAM MODE poster
    {x:1884, y:476, r:55, hue:285, sat:85, light:60, alpha:0.16},   // purple spotlight on the floor
  ],
};
/* ── REACTIVE GRAFFITI (decorative wall art that reacts to the player) ──────
   Same single-row sprite-sheet convention as everything else in this game:
   `idle` is what plays normally (usually just 1 frame, or a slow idle loop);
   `react` plays ONCE — triggered either by the player simply walking within
   `range` of it, OR by a STRIKE while in range — then it settles back to idle.
   Fully decorative: no collision, can't be hit, doesn't block movement.
     {img, fw, fh, at, h, [yOff], range, clips:{idle:{...}, react:{...}}}
   EMPTY for now — nothing draws until an entry + matching art is added (same
   "every asset is optional" rule as the rest of the game). To wire one in:
   send the sprite sheet (idle frame(s) + a short reaction clip, e.g. eyes
   rolling or the tag morphing into something ruder), tell me which room and
   roughly where on the wall, and I'll add the ASSETS line + an entry here. */
const GRAFFITI = {
  /* ── COTTAGERS COVE: two reactive eyeball tags flanking "CHARLIE VIETCH WAS HERE" ──
     LEFT  (x:760)  = graffiti_eyes2.png — grinning purple eyeball, 15 frames (fw:165 fh:182).
     RIGHT (x:1360) = graffiti_eyes2.png — same grinning eyeball.
                      The eye rolls away and grins/sneers, then rolls back. Idles on frame 0.
     Both: walk near (or STRIKE near) plays the react cycle ONCE, then settles back to idle.
     Cottagers Cove is zoom:0.72, srcY:160, flatGround:620 — so the floor line is y≈620 in room
     px. yOff:-330 lifts each tag UP onto the brick wall above the towpath. If you STILL can't
     see them: (a) make sure BOTH pngs are deployed next to index.html, and (b) nudge yOff toward
     0 to bring them DOWN, or more negative to push them UP. h is on-screen height before zoom. */
  in_cottagers: [
    {img:'graffiti_eyes2', fw:165, fh:182, at:1360, h:150, yOff:-270, range:160,
     clips:{idle:{start:0,count:1,fps:1,loop:true}, react:{start:0,count:15,fps:12,loop:false}}},
  ],
};
/* ── ROOM SCREENS (looping .mp4s with sound, painted onto wall screens) ──
   Each room id below maps to a screen rectangle (measured in THAT room's
   background-image pixels, same space as the room jpeg) plus the video
   file(s) shown on it. The video is drawn straight onto the canvas so it
   scrolls with the wall and sits behind the player.

   >>> ALIGNING A SCREEN: nudge its rect {x,y,w,h}. Flip that screen's
       `debug` to true to draw a bright green outline, line it up with the
       painted screen, then set it back to false.

   >>> VIDEO FILES: upload to GitHub next to index.html, EXACT lower-case
       names, H.264/AAC .mp4 so iPhones can play them. Each loops with sound:
         in_house   -> channel1.mp4 .. channel8.mp4  (STRIKE by the TV flips channel)
         in_cinema  -> part1.mp4, part2.mp4, ...  a long film split into parts. Plays them
                       in order and AUTO-ADVANCES (part ends -> next part starts). STRIKE by
                       the screen skips to the next part. Set `files` to EXACTLY the parts you
                       upload (missing parts are skipped; spare slots just show static).
         in_restore -> restore.mp4                                            */
const SCREENS = {
  in_house:   { rect:{ x:222, y:66, w:146, h:82 },                       // perfect already
                files:['channel1.mp4','channel2.mp4','channel3.mp4','channel4.mp4','channel5.mp4','channel6.mp4','channel7.mp4','channel8.mp4'],
                switchable:true, sound:true, reach:120, idx:0, debug:false },
  in_cinema:  { rect:{ x:183, y:61, w:240, h:120 },                      // measured to the painted cinema screen
                files:['cinema.mp4'], playlist:false, switchable:false, sound:true, reach:160, idx:0, debug:false },   // ONE small looping clip on the screen (no parts, no auto-advance)
  in_restore: { rect:{ x:243, y:64, w:109, h:66 },                       // measured to the painted restore-room TV
                files:['restore.mp4'], switchable:false, sound:true, idx:0, debug:false },
};
/* ── SCENE VIDEOS (full-level MP4 scenery: tiled WALL + FLOOR) ─────────────
   On a level flagged with a SCENE_VIDEOS entry, two looping MP4s become the
   whole backdrop: the WALL video fills the top band, the FLOOR video fills
   the bottom band, each TILED across the entire level and scrolling with the
   camera. Both are ALWAYS muted — a scene level's sound comes from its TRACKS
   mp3 instead. Upload the files next to index.html with the EXACT lower-case
   names below; until they exist, each band shows a labelled placeholder over
   the black so you can see the layout.

   >>> TUNE PER LEVEL:
     wallFrac = fraction of screen HEIGHT the wall band fills (rest = floor)
     tileW    = how many LEVEL pixels one copy of the video spans (smaller =
                repeats more often). Author each clip to loop seamlessly so
                the left and right edges butt together with no visible seam. */
const SCENE_VIDEOS = {
  blacklevel: { wallFrac:0.75, tileW:1200, zones:[
    {from:0,    wall:'wall.mp4',  floor:'floor.mp4' },
    {from:2134, wall:'wall2.mp4', floor:'floor2.mp4'},
    {from:4267, wall:'wall3.mp4', floor:'floor3.mp4'},
    {from:6400, wall:'wall4.mp4', floor:'floor4.mp4'},
  ]},
  holodeck:   { wall:'holodeck.mp4', floor:null, wallFrac:1.0, tileW:534 },   // full-screen clip, tiled across 4 panels (BGW 2136)
  judgement:  { wall:'judgement.mp4', floor:null, wallFrac:1.0, tileW:534 },  // same as holodeck: one clip tiled across 4 panels (BGW 2136). Drop judgement.mp4 in; black until then.
  in_shitter: { wall:'shitter.mp4', floor:null, wallFrac:1.0, tileW:800 },     // THE SHITTER: one full-screen underwater clip, tileW=BGW so it fills the single screen with no repeat/scroll. Black until shitter.mp4 is uploaded.
  bossmode:   { wall:'bossmode.mp4', floor:null, wallFrac:1.0, tileW:534 },     // BOSS MODE: one clip tiled across all 3 screens (BGW 1602 = 3 x 534), same style as the Underworld. Black until bossmode.mp4 is uploaded.
};
/* ── TRAVEL MENUS (the portal + departure boards) ─────────────────────────
   Each menu = a title and a list of destinations. `target` is the section id
   to travel to; if that section doesn't exist yet you land on the 'empty'
   placeholder. Add/replace destinations here as new levels are built.       */
/* ── PDF LIBRARY MENUS ─────────────────────────────────────────────────────
   Lists of PDF documents shown by the Library reading-desk door (pdfMenu:'library').
   Each file gets a READ button (opens it) and a DOWNLOAD button (saves it). Upload
   the PDFs next to index.html with the EXACT names below (case-sensitive, no spaces
   — use underscores). Add/rename/remove entries freely; edit the `file` and `label`.
   PLACEHOLDER entries below — swap them for your real PDFs (and upload the files). */
const PDF_MENUS={
  library:{ title:'The Library \u2014 Reading Desk', files:[
    {label:"Foxe's Book of Martyrs", file:'pdf1.pdf'},
    {label:'The Turner Diaries', file:'doc2.pdf'},
    {label:'Document Three', file:'doc3.pdf'},
  ]},
};
const TRAVEL_MENUS={
  portal: { title:'The Portal \u2014 Wave Survival Maps', dests:[
    {label:'The Void', target:'blacklevel'},
    {label:'The Underworld', target:'holodeck'},
    {label:'Judgement Day', target:'judgement'},
    {label:'Mortal Kombat', target:'mk'},
    {label:'Boss Mode', target:'bossmode'},
    {label:'Zombies', target:'lvl_zombies'},   // first-person wave defence (scope + machine gun)
  ]},
  easyjet: { title:'easyJet Holidays', dests:[
    {label:'Europe',    target:'lvl_europe'},
    {label:'America',   target:'lvl_america'},
  ]},
  /* ── DigiTown Station: every portal level broken out as its own stop ──
     These all point at the existing chain sections, so each one shows GO and
     drops you straight into that level (you can still walk it through to the
     next, or run off the left edge to come back to the hub).                */
  trainstation: { title:'DigiTown Station', dests:[
    {label:'Southampton',            target:'southampton'},   // the streets, named back-to-back
    {label:'The Park',               target:'park'},          // in the order you play them
    {label:'Belfast',                target:'belfast'},
    {label:'The Red Hand (Pub)',     target:'pub'},
    {label:'Dundee',                 target:'dundee'},
    {label:'Glasgow',                target:'glasgow'},
    {label:'Southside (the Street)', target:'street'},
    {label:'Dover Shooting Range', target:'the_sea'},   // first-person scope shooting gallery
  ]},
};
const SHOP=[
  {id:'vest',          name:'Bulletproof Vest', price:150},
  {id:'rifle',         name:'Fully Automatic',  price:300},
  {id:'weapon02',      name:'Hornet',           price:600},
  {id:'weapon01',      name:'Viper',            price:900},
  {id:'littleblaster', name:'Little Blaster',   price:1200},
  {id:'weapon07',      name:'Falcon',           price:1600},
  {id:'weapon05',      name:'Arc Lance',        price:2200},
  {id:'weapon03',      name:'Ravager',          price:3000},
  {id:'weapon06',      name:'Tempest',          price:4200},
  {id:'weapon04',      name:'Sledgehammer',     price:6000},
  {id:'weapon08',      name:'Annihilator',      price:9000},
  {id:'bigblaster',    name:'Big Blaster',      price:20000},   // the ultimate — clears the whole screen in one shot
];
const WEAPONS={
  pistol:  {name:'Pistol', auto:false, cooldown:14, type:'bullet', pellets:1, spread:0.04, speed:14, range:600, dmg:14, knock:5 },   // the free starting sidearm — semi-auto, tap to fire
  rifle:   {name:'Fully Automatic', auto:true,  cooldown:10, type:'bullet', pellets:1, spread:0.06, speed:14, range:640, dmg:15, knock:5 },
  grenade: {name:'Grenade', auto:false, cooldown:48, type:'grenade', speed:8, dmg:80, radius:95, knock:22 },
  littleblaster:{name:'Little Blaster', auto:false, cooldown:16, type:'bullet', pellets:1, spread:0.02, speed:12, range:600, dmg:34, knock:9,  sprite:'littleblaster', spriteH:30, shake:false},
  bigblaster:   {name:'Big Blaster',    auto:false, cooldown:75, type:'bullet', pellets:1, spread:0.00, speed:10, range:680, dmg:999, knock:30, sprite:'bigblaster', spriteH:58, shake:true, clearAll:true },  // THE ultimate: one shot wipes every enemy on the level. Long cooldown so each blast is an event.
  // NOTE: the 'fireblaster' weapon AND its asset were removed completely by request.
  // Shooter enemies (the UFO) now fire the BIG BLASTER bolt instead (bigblaster.png),
  // which also remains a buyable weapon below.
  // 8 NAMELESS neon weapons (rename freely — the key/sprite stay the same).
  weapon01: {name:'Viper', auto:false, cooldown:12, type:'bullet', pellets:1, spread:0.03, speed:14, range:660, dmg:30, knock:8,  sprite:'weapon01', spriteH:26, shake:false},
  weapon02: {name:'Hornet', auto:true,  cooldown:20, type:'bullet', pellets:1, spread:0.04, speed:13, range:640, dmg:26, knock:7,  sprite:'weapon02', spriteH:26, shake:false},
  weapon03: {name:'Ravager', auto:false, cooldown:16, type:'bullet', pellets:1, spread:0.02, speed:12, range:660, dmg:44, knock:11, sprite:'weapon03', spriteH:28, shake:false},
  weapon04: {name:'Sledgehammer', auto:false, cooldown:22, type:'bullet', pellets:1, spread:0.00, speed:11, range:680, dmg:55, knock:18, sprite:'weapon04', spriteH:30, shake:true },
  weapon05: {name:'Arc Lance', auto:false, cooldown:14, type:'bullet', pellets:1, spread:0.03, speed:13, range:650, dmg:38, knock:10, sprite:'weapon05', spriteH:26, shake:false, hitfx:'electric'},
  weapon06: {name:'Tempest', auto:true,  cooldown:10, type:'bullet', pellets:1, spread:0.03, speed:16, range:700, dmg:48, knock:9,  sprite:'weapon06', spriteH:22, shake:false},
  weapon07: {name:'Falcon', auto:false, cooldown:12, type:'bullet', pellets:1, spread:0.03, speed:14, range:650, dmg:34, knock:9,  sprite:'weapon07', spriteH:24, shake:false},
  weapon08: {name:'Annihilator', auto:false, cooldown:26, type:'bullet', pellets:1, spread:0.00, speed:12, range:700, dmg:70, knock:20, sprite:'weapon08', spriteH:30, shake:true },
};
/* ── HUB WANDERERS (ambient NPCs on the high street, can't hit / be hit) ──
   One of each, they just stroll back and forth on the hub. Add more by
   dropping entries here (each needs a single-row walk strip png).        */
const HUB_NPCS=[
  // home = the hub x he hangs around; range = how far he paces each way from it.
  // (The CAPTAIN moved into the hub `npcs:` array so he shares lane-spacing + proximity
  //  audio with the other walkers. This table is left here for future single-row walkers.)
];
/* ── CHURCH PRIEST (paces the stage at the back-centre of the church) ──
   Lives only inside the in_church room. He walks left/right within a
   centred band — the stage — and is clamped so he never steps off it.
   PRIEST.x is treated as his CENTRE in room pixels (the room is BGW wide).
   All four numbers are hand-tunable on the phone:
     centre  = middle of the stage, in room pixels
     halfRun = how far each way he paces from the centre (stage half-width)
     lift    = pixels his feet sit ABOVE the floor (raises him onto the stage)
     height  = his drawn height before the room's charScale is applied      */
const PRIEST_DEF={ key:'priest', fw:117, fh:161, frames:12 };
const PRIEST={ centre:296, halfRun:58, lift:46, height:66 };
/* ── "Burger King guy" NPC (now in the SPECIAL GUEST room, moved from the Library) ──
   Lives only inside the in_special room. He does NOT walk: he
   stands in place and loops his baton-strike, turning to face the
   other way every few seconds so he strikes in BOTH directions.
   He is purely decorative — his swings never touch the player and
   he takes no damage. Uses row 5 of his sheet = 6 strike frames.
   Tunables (safe to nudge on the phone):
     x         = where he stands, in room pixels (room is BGW wide)
     lift      = pixels his feet sit ABOVE the floor (0 = on the floor)
     height    = drawn height before the room's charScale is applied
     animSpd   = strike playback speed (higher = faster swings)
     flipEvery = ticks between turning to face the other direction   */
const BK_DEF={ key:'burgerking', fw:170, fh:170, frames:6 };
const BK={ x:721, lift:12, height:83.5, animSpd:0.16, flipEvery:80 };  // the Winchester pool table (the joke teller's old spot: world h 175, feet raised 12)
/* ── MORTAL KOMBAT NPCS (ambient characters in the Portal / MK arena) ──────
   These live ONLY in the 'mk' section. They pace back and forth like the hub
   wanderers and are purely decorative — they can't hit the player and take no
   damage (the level's real opponents still come from the mk `enemies:` list).
   Every character needs a single horizontal sprite strip with real PNG alpha,
   the SAME format as every other character (see the K-9 dog notes up top).

   >>> ADD A CHARACTER:
       1. Drop a line in MK_NPCS below pointing at its `key`.
       2. Add a matching {key, src} line in ASSETS (mknpc1/2/3 slots already
          exist — rename them or add more).
       3. Set fw/fh to the sheet's cell size and `frames` to the cell count,
          then `home` (centre x in the 1432-wide arena) and `range` (how far
          it paces each way). `h` is its drawn height.
   Send me the sheets and I'll repack them + fill in the exact fw/fh/frames. */
const MK_NPCS=[
  // EXAMPLE SLOTS — invisible until the matching png is uploaded. Tune freely.
  {key:'mknpc1', fw:120, fh:200, frames:6, h:88, home:430,  range:150},
  {key:'mknpc2', fw:120, fh:200, frames:6, h:88, home:760,  range:150},
  {key:'mknpc3', fw:120, fh:200, frames:6, h:88, home:1080, range:150},
];
/* ── PROXIMITY NPC AUDIO ───────────────────────────────────────
   A looping mp3 tied to a specific NPC that fades IN when the player
   gets near and OUT when they leave. It layers on top of the room
   music (separate audio element). Upload each file next to index.html
   with the EXACT name below; any missing file just stays silent.
   range = how close, in room pixels, before it begins.              */
const PROX_AUDIO=[
  {section:'in_church',  src:'Priest.mp3',     range:180, getX:()=>priestNpc?priestNpc.x:null},
  {section:'in_winchester', src:'Burgerking.mp3', range:180, getX:()=>bkNpc?bkNpc.x:null},
  /* (the CAPTAIN's entry moved out of here — his Captain.mp3 now plays from his
     mp3 slot on the hub npcs list, like the other walkers. Keeping an entry here
     too would fight that slot over the same audio element and silence it.) */
  /* ── POLICE STATION proximity sounds (FIXED spots, measured in room pixels) ──
     A different looping mp3 fades in as you stand in front of each cell, the
     pool table and the staff-room seating. The four cells sit close together,
     so their `range` is kept tight (60) to stop them overlapping. The x values
     (room is 2182 wide) are estimates — nudge each `x` and `range` by ear.
     These layer on top of Police.mp3.                                        */
  {section:'in_police', src:'Cell1.mp3',     range:60,  getX:()=>895},
  {section:'in_police', src:'Cell2.mp3',     range:60,  getX:()=>1025},
  {section:'in_police', src:'Cell3.mp3',     range:60,  getX:()=>1155},
  {section:'in_police', src:'Cell4.mp3',       range:85,  getX:()=>1310},
  {section:'in_police', src:'Policewoman.mp3', range:120, getX:()=>400},
  {section:'in_police', src:'Staffroom.mp3', range:420, getX:()=>1920},
];
