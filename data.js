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
const CLIPS_CRU={
  idle:   {start:0,  count:4, fps:5,  loop:true},
  walk:   {start:4,  count:8, fps:10, loop:true},
  run:    {start:12, count:8, fps:14, loop:true},
  jump:   {start:20, count:8, fps:12, loop:false},
  punch:  {start:28, count:8, fps:14, loop:false},
  headbutt:{start:28,count:8, fps:14, loop:false},
  die:    {start:36, count:3, fps:8,  loop:false},
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
/* ── FIGHTER META ────────────────────────────────────────── */
const META=[
  {id:'brit',     name:'The Patriot',  flag:'GREAT BRITAIN', fw:233, fh:220, clips:CLIPS_BRIT,
                  noWeaponArt:true, scale:1.1, muzzle:{fwd:0.34, yfac:0.40}},
  {id:'crusader', name:'The Crusader', flag:'CHRISTENDOM',   fw:134, fh:179, clips:CLIPS_CRU},
  {id:'dog',      name:'K-9 Unit',     flag:'ARMED RESPONSE',fw:224, fh:240, clips:CLIPS_DOG,
                  noWeaponArt:true, muzzle:{fwd:0.62, yfac:0.34}},
  {id:'boss',     name:'The Boss',     flag:'THE FIRM',      fw:294, fh:299, clips:CLIPS_BOSS,
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
  {key:'room_library',      type:'img', src:'room library.jpeg', optional:true},
  {key:'room_winchester',   type:'img', src:'room winchester.jpeg', optional:true},
  /* ── NEW ROOM BACKGROUNDS (same "room NAME.jpeg" convention as above) ── */
  {key:'room_police',       type:'img', src:'room police 2.jpeg', optional:true},
  {key:'room_nightclub',    type:'img', src:'room nightclub.jpeg', optional:true},
  {key:'room_crackadilly',  type:'img', src:'room crackadilly.jpeg', optional:true},
  {key:'bg',       type:'img', src:'bg.jpg'},
  {key:'pub',      type:'img', src:'pub2.jpeg'},
  {key:'dundee',   type:'img', src:'dundee.jpeg'},
  {key:'bg3',      type:'img', src:'bg3.jpeg'},
  {key:'brit',     type:'img', src:'patriot.png'},
  {key:'crusader', type:'img', src:'crusader2.png'},
  {key:'dog',      type:'img', src:'dog.png', optional:true},
  {key:'boss',     type:'img', src:'boss.png', optional:true},
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
  {key:'littleblaster',type:'img', src:'littleblaster.png', optional:true},
  {key:'priest',   type:'img', src:'priest.png', optional:true},
  {key:'burgerking', type:'img', src:'burgerking.png', optional:true},
  {key:'captain',  type:'img', src:'captain.png', optional:true},
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
   ]},
  {id:'street', name:'Southside &mdash; the street', bgKey:'bg',  BGW:4047, srcY:120, flatGround:null, chain:true, next:'park',
   enemies:[ {at:1200,kind:0},{at:1700,kind:1},{at:2300,kind:0},{at:3300,kind:1},{at:3700,kind:0} ]},
  {id:'park', name:'Standard UK Park', bgKey:'park', BGW:1763, srcY:0, flatGround:196, chain:true, next:'belfast', prev:'street',
   enemies:[ {at:520,kind:3},{at:880,kind:3},{at:1240,kind:3} ],
   aliens:[ {at:700,kind:2},{at:1020,kind:2},{at:1360,kind:2},{at:1560,kind:2} ]},
  {id:'belfast', name:'Ballymacarrett &mdash; the loyal mile', bgKey:'bg3', BGW:2172, srcY:380, flatGround:560, chain:true, next:'pub', prev:'park',
   enemies:[ {at:760,kind:4},{at:1120,kind:4},{at:1480,kind:4},{at:1800,kind:4},{at:2020,kind:4} ]},
  {id:'pub',     name:'The Red Hand &mdash; loyalist till I die', bgKey:'pub', BGW:533, srcY:8, flatGround:212, charScale:1.4, chain:true, next:'dundee', prev:'belfast',
   enemies:[ ]},
  {id:'dundee',  name:'Welcome to Dundee', bgKey:'dundee', BGW:560, srcY:65, flatGround:270, chain:true, next:'glasgow', prev:'pub',
   enemies:[ ]},
  {id:'glasgow', name:'Glasgow &mdash; the Trongate', bgKey:'glasgow', BGW:2672, srcY:90, flatGround:296, chain:true, next:'southampton', prev:'dundee',
   enemies:[ {at:230,kind:6,hp:1,static:true},{at:760,kind:5},{at:1080,kind:0},{at:1380,kind:5},{at:1700,kind:1},{at:2000,kind:5},{at:2480,kind:5} ]},
  {id:'southampton', name:'Southampton &mdash; Above Bar Street', bgKey:'southampton', BGW:1879, srcY:90, flatGround:296, chain:true, next:null, prev:'glasgow',
   enemies:[ {at:430,kind:0},{at:640,kind:0},{at:850,kind:0},{at:1050,kind:0},{at:1250,kind:0},{at:1450,kind:0},{at:1650,kind:0},{at:1800,kind:0} ]},

  /* ── MORTAL KOMBAT (entered from the hub Portal -> travel menu) ──
     Standalone fight arena: the UMK3 "Blue Portal" bridge. Background
     mortalkombat.png is 1432x240, floor surface ~196 (nudge flatGround).
     chain:true so the helper bar + combat work; next:null so the right
     edge gives the "THE END" exit and the left edge returns to the hub.
     Ambient MK characters (NPCs) are wired separately in MK_NPCS below. */
  {id:'mk', name:'The Portal &mdash; Mortal Kombat', bgKey:'mk', BGW:1432, srcY:0, flatGround:206, chain:true, next:null, prev:null,
   enemies:[ {at:360,kind:4},{at:620,kind:0},{at:880,kind:1},{at:1120,kind:4},{at:1340,kind:0} ]},

  /* ── BLACK LEVEL (entered from the hub Portal -> travel menu) ──────────
     A long, currently-black stage that hosts the MP4 scenery system below
     (SCENE_VIDEOS): a WALL video across the top 75% and a separate FLOOR
     video across the bottom 25%, both TILED across the whole level and
     scrolling with the camera. black:true paints the frame black underneath,
     so anywhere a video hasn't loaded yet just stays black. chain:true lets
     you walk it; the left edge returns to the hub. BGW is the level length. */
  {id:'blacklevel', name:'The Void', bgKey:'__black__', black:true, BGW:8534, srcY:0, flatGround:200, chain:true, next:null, prev:null,
   enemies:[ {at:700,kind:2},{at:1300,kind:7},{at:2100,kind:3},{at:2900,kind:7},{at:3600,kind:2},{at:4400,kind:7},{at:5200,kind:3},{at:6000,kind:7},{at:6800,kind:2},{at:7600,kind:7},{at:8100,kind:3} ]},

  /* ── HOLODECK (entered from the hub Portal -> travel menu) ─────────────
     A full-screen MP4 backdrop: one widescreen clip (holodeck.mp4) fills the
     WHOLE screen (no separate floor band) and is drawn TWICE side-by-side, so
     the level is two screens wide and SCROLLS smoothly (the panels are anchored
     to the world; the camera pans across as you run). Add flip:true to the line
     below if you ever want a flip-screen camera instead (snaps panel-to-panel,
     no scroll). black underneath, the video is silent, Holodeck.mp3 is the
     sound. Want it longer? Add screens: set BGW to (number-of-screens x 534). */
  {id:'holodeck', name:'The Holodeck', bgKey:'__black__', black:true, BGW:1068, srcY:0, flatGround:180, chain:true, next:null, prev:null, enemies:[]},

  /* ── INTERIOR ROOMS (entered from the hub; EXIT door returns to the street) ── */
  {id:'in_house', name:'Inside &mdash; My House', bgKey:'room_house', BGW:591, srcY:46, flatGround:277, charScale:1.3, interior:true, enemies:[],
   doors:[ {x:506, w:92, label:'EXIT &mdash; to the street', target:'home'} ]},
  {id:'in_church', name:'Inside &mdash; The Church', bgKey:'room_church', BGW:591, srcY:46, flatGround:275, charScale:1.3, interior:true, enemies:[],
   doors:[ {x:506, w:92, label:'EXIT &mdash; to the street', target:'home'} ]},
  {id:'in_gunstore', name:'Inside &mdash; FAFO Ammo &amp; Arms', bgKey:'room_gunstore', BGW:591, srcY:46, flatGround:273, charScale:1.3, interior:true, enemies:[],
   doors:[ {x:250, w:95, label:'Buy weapons', target:'shop'}, {x:506, w:92, label:'EXIT &mdash; to the street', target:'home'} ]},
  {id:'in_restore', name:'Inside &mdash; Restore Britain', bgKey:'room_restore', BGW:580, srcY:46, flatGround:277, charScale:1.7, interior:true, enemies:[],
   doors:[ {x:495, w:92, label:'EXIT &mdash; to the street', target:'home'} ]},
  {id:'in_cinema', name:'Inside &mdash; The Cinema', bgKey:'room_cinema', BGW:591, srcY:46, flatGround:273, charScale:1.3, interior:true, enemies:[],
   doors:[ {x:506, w:92, label:'EXIT &mdash; to the street', target:'home'} ]},
  {id:'in_easyjet', name:'Inside &mdash; easyJet Holidays', bgKey:'room_easyjet', BGW:580, srcY:46, flatGround:277, charScale:1.3, interior:true, enemies:[],
   doors:[ {x:290, w:74, label:'Departures', menu:'easyjet'}, {x:495, w:92, label:'EXIT &mdash; to the street', target:'home'} ]},
  {id:'in_trainstation', name:'Inside &mdash; DigiTown Station', bgKey:'room_trainstation', BGW:580, srcY:46, flatGround:281, charScale:1.3, interior:true, enemies:[],
   doors:[ {x:290, w:74, label:'Departures', menu:'trainstation'}, {x:495, w:92, label:'EXIT &mdash; to the street', target:'home'} ]},
  {id:'in_library', name:'Inside &mdash; The Library', bgKey:'room_library', BGW:591, srcY:46, flatGround:281, charScale:1.3, interior:true, enemies:[],
   doors:[ {x:506, w:92, label:'EXIT &mdash; to the street', target:'home'} ]},
  {id:'in_winchester', name:'Inside &mdash; The Winchester', bgKey:'room_winchester', BGW:591, srcY:46, flatGround:275, charScale:1.8, interior:true, enemies:[],
   doors:[ {x:506, w:92, label:'EXIT &mdash; to the street', target:'home'} ]},

  /* ── NEW INTERIOR ROOMS ───────────────────────────────────────────────
     Same shape as the rooms above: enter from the hub, EXIT door (right side)
     pops back to the street. Defaults copied from the church room — nudge
     BGW / srcY / flatGround / charScale to match each new room jpeg, and move
     the EXIT door x to sit over the painted doorway. Each has a music slot in
     TRACKS (see below) and a room-background image in ASSETS. */
  /* Police Station is a wide walk-through (enquiries -> custody cells -> staff
     room) so it uses the full 2182px-wide image. srcY/flatGround/charScale are
     starting guesses — nudge on the phone. EXIT door sits near the entrance. */
  {id:'in_police', name:'Inside &mdash; Police Station', bgKey:'room_police', BGW:2182, zoom:0.85, srcY:150, flatGround:545, charScale:2.2, interior:true, enemies:[],
   doors:[ {x:2070, w:100, label:'EXIT &mdash; to the street', target:'home'} ]},
  {id:'in_nightclub', name:"Inside &mdash; Slammin' Vinyl", bgKey:'room_nightclub', BGW:591, srcY:46, flatGround:275, charScale:1.3, interior:true, enemies:[],
   doors:[ {x:506, w:92, label:'EXIT &mdash; to the street', target:'home'} ]},
  /* ── CRACKADILLY GARDENS (the stitched 3-panorama park; end of the hub) ──
     One wide outdoor walk-through built from Park1+Park2+Park3 stitched into a
     single seamless jpeg (room crackadilly.jpeg, 5946px wide). interior:true so
     the EXIT door pops you back to the hub. srcY / flatGround / charScale are
     tuned from your in-game screenshots: srcY:140 slides the view DOWN so the
     wet pavement (the bottom ~45% of the image) shows along the bottom of the
     screen, and flatGround:350 drops the player's feet onto that pavement.
     Nudge if needed — raise flatGround (e.g. 350->370) to push him lower; raise
     srcY (e.g. 140->165) to reveal even more pavement at the very bottom.
     The EXIT door is at the FAR RIGHT (walk the gardens, leave at the far side);
     move its x left (e.g. x:200) to exit back by the entrance. Music:
     Crackadilly.mp3 (already slotted in TRACKS below — just upload that file). */
  {id:'in_crackadilly', name:'Crackadilly Gardens', bgKey:'room_crackadilly', BGW:5946, srcY:140, flatGround:350, charScale:1.2, interior:true, enemies:[],
   doors:[ {x:5786, w:130, label:'EXIT &mdash; to the street', target:'home'} ]},

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
  /* ── NEW ROOM MUSIC SLOTS (upload these three .mp3s next to index.html) ── */
  in_police:'Police.mp3', in_nightclub:'Slamminvinyl.mp3', in_crackadilly:'Crackadilly.mp3',
  /* ── BLACK LEVEL + HOLODECK MUSIC (the MP4s are silent; these are the sound) ── */
  blacklevel:'Void.mp3', holodeck:'Holodeck.mp3' };
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
         in_cinema  -> cinema.mp4
         in_restore -> restore.mp4                                            */
const SCREENS = {
  in_house:   { rect:{ x:222, y:66, w:146, h:82 },                       // perfect already
                files:['channel1.mp4','channel2.mp4','channel3.mp4','channel4.mp4','channel5.mp4','channel6.mp4','channel7.mp4','channel8.mp4'],
                switchable:true, reach:120, idx:0, debug:false },
  in_cinema:  { rect:{ x:183, y:61, w:240, h:120 },                      // measured to the painted cinema screen
                files:['cinema.mp4'],  switchable:false, idx:0, debug:false },
  in_restore: { rect:{ x:243, y:64, w:109, h:66 },                       // measured to the painted restore-room TV
                files:['restore.mp4'], switchable:false, idx:0, debug:false },
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
  holodeck:   { wall:'holodeck.mp4', floor:null, wallFrac:1.0, tileW:534 },   // full-screen clip, doubled side-by-side
};
/* ── TRAVEL MENUS (the portal + departure boards) ─────────────────────────
   Each menu = a title and a list of destinations. `target` is the section id
   to travel to; if that section doesn't exist yet you land on the 'empty'
   placeholder. Add/replace destinations here as new levels are built.       */
const TRAVEL_MENUS={
  portal: { title:'The Portal', dests:[
    {label:'The Streets', target:'street'},          // already wired to the original level chain
    {label:'Mortal Kombat', target:'mk'},            // the UMK3 "Blue Portal" bridge arena
    {label:'The Void', target:'blacklevel'},         // black level: tiled MP4 wall + floor scenery
    {label:'The Holodeck', target:'holodeck'},       // full-screen MP4 backdrop, doubled side-by-side
  ]},
  easyjet: { title:'easyJet Holidays', dests:[
    {label:'America',   target:'lvl_america'},
    {label:'Australia', target:'lvl_australia'},
    {label:'Japan',     target:'lvl_japan'},
    {label:'Europe',    target:'lvl_europe'},
  ]},
  /* ── DigiTown Station: every portal level broken out as its own stop ──
     These all point at the existing chain sections, so each one shows GO and
     drops you straight into that level (you can still walk it through to the
     next, or run off the left edge to come back to the hub).                */
  trainstation: { title:'DigiTown Station', dests:[
    {label:'The Streets',         target:'street'},
    {label:'The Park',            target:'park'},
    {label:'Belfast',             target:'belfast'},
    {label:'The Red Hand (Pub)',  target:'pub'},
    {label:'Dundee',              target:'dundee'},
    {label:'Glasgow',             target:'glasgow'},
    {label:'Southampton',         target:'southampton'},
  ]},
};
const SHOP=[
  {id:'rifle',   name:'Bullets',          price:350},
  {id:'vest',    name:'Bulletproof Vest', price:250},
  {id:'littleblaster', name:'Little Blaster',    price:300},
  {id:'bigblaster',    name:'Big Blaster',       price:600},
];
const WEAPONS={
  rifle:   {name:'Bullets', auto:true,  cooldown:6,  type:'bullet', pellets:1, spread:0.05, speed:14, range:640, dmg:18, knock:6 },
  grenade: {name:'Grenade', auto:false, cooldown:48, type:'grenade', speed:8, dmg:80, radius:95, knock:22 },
  littleblaster:{name:'Little Blaster', auto:false, cooldown:16, type:'bullet', pellets:1, spread:0.02, speed:12, range:600, dmg:34, knock:9,  sprite:'littleblaster', spriteH:30, shake:false},
  bigblaster:   {name:'Big Blaster',    auto:false, cooldown:34, type:'bullet', pellets:1, spread:0.00, speed:10, range:680, dmg:90, knock:24, sprite:'bigblaster',    spriteH:58, shake:true },
};
/* ── HUB WANDERERS (ambient NPCs on the high street, can't hit / be hit) ──
   One of each, they just stroll back and forth on the hub. Add more by
   dropping entries here (each needs a single-row walk strip png).        */
const HUB_NPCS=[
  // home = the hub x he hangs around; range = how far he paces each way from it.
  // The Winchester door is at x:2040, so the captain patrols right outside it.
  {key:'captain', fw:110, fh:221, frames:6,  h:84, home:2010, range:120},
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
/* ── LIBRARY NPC: "Burger King guy" ──────────────────────────
   Lives only inside the in_library room. He does NOT walk: he
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
const BK={ x:280, lift:0, height:84, animSpd:0.16, flipEvery:80 };
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
  {section:'in_library', src:'Burgerking.mp3', range:180, getX:()=>bkNpc?bkNpc.x:null},
  {section:'home',       src:'Captain.mp3',    range:180,
     getX:()=>{ const c=hubNpcs.find(n=>n.def&&n.def.key==='captain'); return c?c.x:null; }},
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
