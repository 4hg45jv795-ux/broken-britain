/* engine.js — Enough Is Enough: update/draw/loop, input, combat. Loads AFTER data.js. */
/* ============================================================
   ENOUGH IS ENOUGH
   ------------------------------------------------------------
   SPRITE-SHEET FORMAT (all characters use the SAME convention):
   one single horizontal row of uniform FW x FH cells, real
   transparency (PNG alpha), frames laid out in clip order.
   This matches brit2.png / crusader2.png. New enemy/helper art
   must be re-exported into this strip format before it will
   animate. Until then the engine draws a stand-in figure so
   everything is testable.
   ============================================================ */

let FW=181,FH=218;          // current fighter's frame size (set in start())
const PFW=124,PFH=214;      // photographer frame size
let CLIPS=CLIPS_BRIT;
const GSTEP=60;
const GROUNDPTS=[322,322,322,322,322,322,322,322,322,322,322,322,322,322,322,322,322,322,322,322,322,322,322,322,322,322,322,322,322,322,322,322,322,322,322,322,322,322,322,322,322,330.0,342.0,346,346,346,346,346,346,346,346,346,346,346,346,346,346,338.0,330.0,322,322,322,322,322,322,322,322,322,322];

function imgOk(im){ return im && im.complete && im.naturalWidth>0; }

let sectionIndex=0;
let SRCY=120, BGW=4047;
let CSCALE=1;
let BGSCALE=1;                 // background image resolution multiplier (image px per world px); 1 = legacy 1:1
function loadSectionConfig(){
  const s=SECTIONS[sectionIndex];
  SRCY=s.srcY; BGW=s.BGW; CSCALE=s.charScale||1;
  BGSCALE=s.bgScale||1;        // a >1 value lets a higher-res bg image render crisp without changing layout
  ZOOM=s.zoom||1.5; SRCW=VW/ZOOM; SRCH=VH/ZOOM;     // per-section camera zoom (default 1.5)
  document.getElementById('flag').textContent=' '+s.name.replace(/&mdash;/g,'—').toUpperCase();
}
function groundAt(x){
  const s=SECTIONS[sectionIndex];
  if(s.groundPts){                                  // per-section variable ground profile (a dip/rise path)
    const step=s.groundStep||GSTEP, pts=s.groundPts;
    let i=x/step,a=Math.max(0,Math.min(pts.length-1,Math.floor(i))),b=Math.min(a+1,pts.length-1),t=i-a;
    return pts[a]*(1-t)+pts[b]*t;
  }
  if(s.flatGround!=null) return s.flatGround;
  let i=x/GSTEP,a=Math.max(0,Math.min(GROUNDPTS.length-1,Math.floor(i))),b=Math.min(a+1,GROUNDPTS.length-1),t=i-a;
  return GROUNDPTS[a]*(1-t)+GROUNDPTS[b]*t;
}

const loaded={};
const failed=[];
let loadedCount=0;
function onLoad(){
  loadedCount++;
  document.getElementById('load-bar').style.width=(loadedCount/ASSETS.length*100)+'%';
  if(loadedCount>=ASSETS.length) onAllLoaded();
}
/* Load images a FEW AT A TIME instead of all at once. On a phone/slow link, firing
   ~50 requests together (Vercel uses HTTP/2, so they really do all go at once) starves
   the connection and a random couple time out and get flagged "missing". A small
   concurrency window keeps every request healthy; each image also retries before
   it's given up on. */
const MAX_CONC=5;
let _assetIdx=0;
function loadNextAsset(){
  if(_assetIdx>=ASSETS.length) return;
  const a=ASSETS[_assetIdx++];
  const im=new Image(); loaded[a.key]=im;
  let tries=0;
  im.onload=()=>{ onLoad(); loadNextAsset(); };
  im.onerror=()=>{
    if(tries<3){ tries++; setTimeout(()=>{ im.src=a.src+(a.src.indexOf('?')<0?'?':'&')+'retry='+tries; }, 400*tries); return; }  // retry transient time-outs before declaring missing
    if(!a.optional) failed.push(a.src); console.warn('[EnoughIsEnough] failed to load:',a.src); onLoad(); loadNextAsset();
  };
  im.src=a.src;
}
for(let i=0;i<MAX_CONC;i++) loadNextAsset();
if('serviceWorker' in navigator){ try{ navigator.serviceWorker.register('sw.js').catch(()=>{}); }catch(_){} }  // PWA: cache media for fast, reliable repeat launches (see sw.js)
function onAllLoaded(){
  document.getElementById('loading').style.display='none';
  document.getElementById('app').style.display='flex';
  if(failed.length){
    const w=document.getElementById('warn');
    w.style.display='block';
    w.innerHTML='<b>Missing files ('+failed.length+'):</b><br>'+failed.join('<br>')+
      '<br><br>These need to be deployed next to index.html.';
  }
  buildCards();
  buildHelperThumbs();
}

/* ── RECORDS SCREEN ─────────────────────────────────────────────────────────
   A "Records" button on the fighter-select screen opens an overlay of lifetime
   stats (persisted). Built in JS so index.html needs no edits. */
/* ── CONTINUE / NEW GAME ────────────────────────────────────────────────────
   If a previous session was saved, the select screen opens with a choice:
   CONTINUE (same fighter, money, weapons, unlocks) or NEW GAME (wipes the save). */
function buildContinueUI(){
  if(!SAVED || !SAVED.fighter) return;
  const m=META.find(x=>x.id===SAVED.fighter); if(!m) return;
  const st=document.createElement('style');
  st.textContent=`#contwrap{position:fixed;inset:0;z-index:85;background:rgba(4,6,10,0.88);display:flex;align-items:center;justify-content:center;}
   #contwrap .ccard{background:#12171f;border:1.5px solid #8a929b;border-radius:16px;padding:24px 28px;text-align:center;color:#eef2f6;font:15px system-ui,sans-serif;max-width:340px;}
   #contwrap h2{margin:0 0 6px;font-size:22px;} #contwrap .csub{color:#aab2bb;font-size:13px;margin-bottom:16px;line-height:1.5;}
   #contwrap button{display:block;width:100%;padding:12px;border:0;border-radius:10px;font:bold 15px system-ui,sans-serif;cursor:pointer;margin-top:10px;}
   #contbtn{background:#3fae5a;color:#fff;} #newbtn{background:rgba(255,255,255,0.08);color:#eef2f6;border:1.5px solid #566 !important;}`;
  document.head.appendChild(st);
  const ov=document.createElement('div'); ov.id='contwrap';
  ov.innerHTML=`<div class="ccard"><h2>WELCOME BACK</h2>
    <div class="csub">${m.name} &bull; &pound;${(SAVED.money||0).toLocaleString()} &bull; ${(SAVED.owned||[]).length} weapon${(SAVED.owned||[]).length===1?'':'s'}</div>
    <button id="contbtn">&#9654; Continue</button>
    <button id="newbtn">New Game</button></div>`;
  document.body.appendChild(ov);
  document.getElementById('contbtn').onclick=()=>{ CONTINUE_MODE=true; ov.remove(); start(m); };
  document.getElementById('newbtn').onclick=()=>{
    CONTINUE_MODE=false; SAVED=null;
    try{ localStorage.removeItem('crusader_save'); }catch(_){}
    ov.remove();
  };
}
function buildRecordsUI(){
  if(document.getElementById('recordsbtn')) return;
  const st=document.createElement('style');
  st.textContent=`
   #recordsbtn{display:block;margin:14px auto 0;padding:9px 20px;border-radius:999px;cursor:pointer;
     background:rgba(20,26,34,0.9);color:#eef2f6;border:1.5px solid #8a929b;font:bold 14px system-ui,sans-serif;}
   #records{position:fixed;inset:0;z-index:80;background:rgba(4,6,10,0.9);display:none;align-items:center;justify-content:center;}
   #records.on{display:flex;}
   #records .rcard{background:#12171f;border:1.5px solid #8a929b;border-radius:16px;padding:22px 26px;min-width:280px;max-width:360px;color:#eef2f6;font:15px/1.7 system-ui,sans-serif;}
   #records h2{margin:0 0 4px;font-size:22px;letter-spacing:1px;} #records .rsub{color:#aab2bb;font-size:12px;margin-bottom:14px;}
   #records .rrow{display:flex;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,0.08);padding:6px 0;}
   #records .rrow b{color:#ffe98a;font-variant-numeric:tabular-nums;}
   #records button{margin-top:16px;width:100%;padding:10px;border:0;border-radius:10px;background:#3fae5a;color:#fff;font:bold 15px system-ui,sans-serif;cursor:pointer;}
   #records .rreset{background:transparent;color:#8a929b;font-size:12px;margin-top:8px;}`;
  document.head.appendChild(st);
  const btn=document.createElement('button'); btn.id='recordsbtn'; btn.textContent='\uD83C\uDFC5 Records';
  const cards=document.getElementById('cards');
  cards.parentNode.insertBefore(btn, cards.nextSibling);
  const ov=document.createElement('div'); ov.id='records';
  ov.innerHTML='<div class="rcard"><h2>RECORDS</h2><div class="rsub">Your lifetime stats</div><div id="rrows"></div>'+
    '<button id="rclose">Close</button><button class="rreset" id="rreset">Reset records</button></div>';
  document.body.appendChild(ov);
  const fmt=n=>n.toLocaleString();
  const render=()=>{ document.getElementById('rrows').innerHTML=[
      ['Enemies defeated', fmt(STATS.kills)],
      ['Total &pound; earned', '&pound;'+fmt(STATS.earned)],
      ['Best Zombies wave', STATS.bestWave||'&mdash;'],
      ['Best Dover score', STATS.bestDover?fmt(STATS.bestDover):'&mdash;'],
      ['Times downed', fmt(STATS.deaths)],
    ].map(r=>`<div class="rrow"><span>${r[0]}</span><b>${r[1]}</b></div>`).join(''); };
  btn.onclick=()=>{ render(); ov.classList.add('on'); };
  ov.onclick=e=>{ if(e.target===ov) ov.classList.remove('on'); };
  document.getElementById('rclose').onclick=()=>ov.classList.remove('on');
  document.getElementById('rreset').onclick=()=>{ if(confirm('Reset all records?')){ STATS.kills=STATS.earned=STATS.bestWave=STATS.bestDover=STATS.deaths=STATS.runs=0; saveStats(); render(); } };
}
function buildCards(){
  buildRecordsUI();
  buildContinueUI();
  const grid=document.getElementById('cards');
  META.forEach(m=>{
    const c=document.createElement('button'); c.className='card';
    const thumbDiv=document.createElement('div'); thumbDiv.className='thumb';
    const cv2=document.createElement('canvas');
    const TW=150, dh=Math.round(TW*m.fh/m.fw);
    cv2.width=TW; cv2.height=dh;
    const ctx2=cv2.getContext('2d'); ctx2.imageSmoothingEnabled=true;
    if(imgOk(loaded[m.id])){ try{ ctx2.drawImage(loaded[m.id],0,0,m.fw,m.fh,0,0,TW,dh); }catch(err){ drawThumbPlaceholder(ctx2,TW,dh);} }
    else drawThumbPlaceholder(ctx2,TW,dh);
    thumbDiv.appendChild(cv2); c.appendChild(thumbDiv);
    const nameDiv=document.createElement('div'); nameDiv.className='name'; nameDiv.textContent=m.name;
    const flagDiv=document.createElement('div'); flagDiv.className='flagtag'; flagDiv.textContent=m.flag;
    c.appendChild(nameDiv); c.appendChild(flagDiv);
    c.onclick=()=>start(m);
    grid.appendChild(c);
  });
}
function drawThumbPlaceholder(ctx2,w,h){
  ctx2.fillStyle='#16202f'; ctx2.fillRect(0,0,w,h);
  ctx2.strokeStyle='#2bd4ff'; ctx2.lineWidth=1.5; ctx2.strokeRect(2,2,w-4,h-4);
  ctx2.fillStyle='#2bd4ff'; ctx2.font='700 13px monospace'; ctx2.textAlign='center';
  ctx2.fillText('no img', w/2, h/2+4); ctx2.textAlign='start';
}

/* ── SOUND EFFECTS (synthesised, no files needed) ────────── */
let AC=null, sfxOn=true;
function actx(){ try{ if(!AC) AC=new (window.AudioContext||window.webkitAudioContext)(); if(AC.state!=='running') AC.resume(); }catch(e){} return AC; }
function blip(f1,f2,dur,type,vol){
  const c=actx(); if(!c||!sfxOn) return;
  const o=c.createOscillator(),g=c.createGain(); o.type=type||'square';
  o.frequency.setValueAtTime(f1,c.currentTime);
  if(f2) o.frequency.exponentialRampToValueAtTime(Math.max(1,f2),c.currentTime+dur);
  g.gain.setValueAtTime(vol||0.18,c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0008,c.currentTime+dur);
  o.connect(g).connect(c.destination); o.start(); o.stop(c.currentTime+dur+0.02);
}
function noiseBurst(dur,vol,hp){
  const c=actx(); if(!c||!sfxOn) return;
  const n=Math.max(1,Math.floor(c.sampleRate*dur)); const buf=c.createBuffer(1,n,c.sampleRate);
  const d=buf.getChannelData(0); for(let i=0;i<n;i++) d[i]=(Math.random()*2-1)*(1-i/n);
  const s=c.createBufferSource(); s.buffer=buf; const g=c.createGain(); g.gain.value=vol||0.18;
  const f=c.createBiquadFilter(); f.type='highpass'; f.frequency.value=hp||300;
  s.connect(f).connect(g).connect(c.destination); s.start();
}
const sfxPunch =()=>{ noiseBurst(0.10,0.16,600); blip(230,90,0.10,'sawtooth',0.10); };
const sfxHit   =()=>{ blip(150,55,0.14,'square',0.22); noiseBurst(0.07,0.18,180); };
const sfxKO    =()=>{ blip(320,60,0.38,'sawtooth',0.24); noiseBurst(0.22,0.16,140); };
const sfxJump  =()=>{ blip(300,640,0.16,'square',0.10); };
const sfxHurt  =()=>{ blip(210,120,0.16,'sawtooth',0.18); };
const sfxSummon=()=>{ [0,4,7,12].forEach((s,i)=>setTimeout(()=>blip(330*Math.pow(2,s/12),0,0.16,'triangle',0.18),i*85)); };
const sfxShot  =()=>{ noiseBurst(0.06,0.22,900); blip(180,60,0.07,'sawtooth',0.12); };
const sfxThrow =()=>{ blip(420,700,0.16,'triangle',0.12); };

/* ── GAME STATE ──────────────────────────────────────────── */
const cv=document.getElementById('cv'),ctx=cv.getContext('2d');
const VW=800,VH=360;
let ZOOM=1.5,SRCW=VW/ZOOM,SRCH=VH/ZOOM;   // recomputed per-section in loadSectionConfig (see section.zoom)
const PH=80; let PW=Math.round(PH*FW/FH);
let cur=null,raf=null,camX=0;
const player={x:120,y:200,vx:0,vy:0,face:1,onGround:true,clip:'idle',ct:0,hp:100,max:100,dead:false,deadT:0,attackId:0,hurtCool:0,armour:0,invincibleT:0};
const keys={left:false,right:false,jump:false};
let punchDown=false,punchEdge=false,runHold=0;
function setClip(name){ if(player.clip!==name){player.clip=name;player.ct=0;} }
function clipDone(){ const c=CLIPS[player.clip]; return !c.loop && player.ct>=Math.ceil(c.count*60/c.fps); }
function playerAttacking(){ return player.clip==='punch'||player.clip==='headbutt'; }
// The photographer snaps on any action — a STRIKE or a SHOT (not used for melee damage).
function playerActioning(){ return playerAttacking()||player.clip==='shoot'; }
const SPEED=2.1,RUNSPEED=3.4,GRAV=0.55,JUMP=-9.6,SWIM=-4.4;   // SWIM = upward stroke in water levels
let bannerShown=false;

/* ── ENEMIES ─────────────────────────────────────────────── */
/* enemy strip layout (single horizontal row, uniform FWxFH cells):
   walk frames first (start:0), then die frames last.              */
const ENEMY_KINDS=[
  {img:'police', fw:167, fh:130, color:'#d8e23a', hair:'#1a2233', mp3:'Policeenemy.mp3',
   clips:{walk:{start:0,count:6,fps:9,loop:true}, die:{start:6,count:1,fps:6,loop:false}}},
  {img:'clown', fw:109, fh:130, scale:1.7, color:'#e8c43a', hair:'#2f8a3a', mp3:'Clown.mp3',
   clips:{walk:{start:0,count:5,fps:9,loop:true}, die:{start:5,count:1,fps:6,loop:false}}},
  {img:'alien', fw:71, fh:142, color:'#83a86a', hair:'#41603a', mp3:'Alien.mp3',
   clips:{walk:{start:0,count:8,fps:10,loop:true}, die:{start:8,count:6,fps:11,loop:false}}},
  {img:'geezer', fw:63, fh:160, color:'#2f3238', hair:'#7a4a26', mp3:'Geezer.mp3',
   clips:{walk:{start:0,count:7,fps:9,loop:true}, die:{start:7,count:4,fps:8,loop:false}}},
  {img:'knifeman', fw:89, fh:151, color:'#3a5a8a', hair:'#241712', mp3:'Knifeman.mp3',
   clips:{walk:{start:0,count:8,fps:9,loop:true}, die:{start:8,count:6,fps:10,loop:false}}},
  {img:'deliveroo', fw:134, fh:120, scale:1.05, color:'#2c2f36', hair:'#101216', mp3:'Deliveroo.mp3',
   clips:{walk:{start:0,count:6,fps:12,loop:true}, die:{start:6,count:4,fps:9,loop:false}}},
  {img:'bikeboy', fw:175, fh:130, color:'#8a8f96', hair:'#2a2622', mp3:'Bikeboy.mp3',
   clips:{walk:{start:0,count:2,fps:3,loop:true}, die:{start:2,count:2,fps:6,loop:false}}},
  {img:'ufo', fw:119, fh:90, hover:34, color:'#bfe4ff', hair:'#3a5a8a', mp3:'Ufo.mp3',
   clips:{walk:{start:0,count:8,fps:10,loop:true}, die:{start:0,count:1,fps:6,loop:false}}},
  // 8 = UFO GUNSHIP: hovering saucer that SHOOTS the Big Blaster bolt at the player.
  //     ufoship.png frames: 0-2 fly, 3 damaged, 4 exploding. hover lifts it off the
  //     ground; scale sizes the saucer. Spawned in the Holodeck (data.js) for testing.
  {img:'ufoship', fw:360, fh:194, scale:0.9, hover:80, shooter:true, shotDmg:12, color:'#7fd0ff', hair:'#2a4a7a', mp3:'Ufoship.mp3',
   clips:{walk:{start:0,count:3,fps:8,loop:true}, die:{start:3,count:2,fps:9,loop:false}}},
  // 9 = BRUISER: heavyset bare-knuckle thug (bruiser.png). 18 frames -> 0-5 running,
  //     6-11 punching (unused by the simple enemy AI), 12-17 dying. Melee only; lives in
  //     Cottagers Cove. `scale` sizes him against the big-room player — nudge to taste.
  {img:'bruiser', fw:196, fh:237, scale:2.2, color:'#cdb89a', hair:'#3a2a1e', mp3:'Bruiser.mp3',
   clips:{walk:{start:0,count:6,fps:11,loop:true}, die:{start:12,count:6,fps:10,loop:false}}},
  // 10 = GUNMAN: hooded shooter (shooter.png). 12 frames -> 0-3 walk, 4-7 aim/fire, 8-11 die.
  //      Fires the Big-Blaster bolt and plays its SHOOT pose while firing. In the Holodeck.
  {img:'shooter', fw:292, fh:343, scale:1.7, shooter:true, shotDmg:10, bullet:'pistol', color:'#3a4250', hair:'#20242c', mp3:'Gunman.mp3',
   clips:{walk:{start:0,count:4,fps:9,loop:true}, shoot:{start:4,count:4,fps:11,loop:false}, die:{start:8,count:4,fps:9,loop:false}}},
  // 11 = TRACKSUIT (tracksuit.png). 12 dance-pose frames -> 0-9 a strut/dance loop used as the
  //      "walk", 10-11 used as the death flourish. Melee only; lives in Cottagers Cove.
  {img:'tracksuit', fw:239, fh:426, scale:3.5, color:'#1fb6c9', hair:'#e8e4d8', mp3:'Tracksuit.mp3',
   clips:{walk:{start:0,count:10,fps:8,loop:true}, die:{start:10,count:2,fps:6,loop:false}}},
  // 12 = HIPPIE (hippie.png). 8-frame walk cycle (tie-dye top, blue hair, keffiyeh scarf).
  //      No bespoke death art, so the last walk frame is reused as the fading death frame.
  {img:'hippie', fw:78, fh:124, color:'#7ac0e0', hair:'#3a6ea5', mp3:'Hippie.mp3',
   clips:{walk:{start:0,count:8,fps:9,loop:true}, die:{start:7,count:1,fps:6,loop:false}}},
  // 13 = CRACKMAN (crackman.png). 6-frame walk cycle; lives in Crackadilly Gardens. The
  //      source punch frames aren't used (basic enemies have no melee-attack anim) and the
  //      knockdown frames were cropped, so death reuses the last walk frame (it fades out).
  {img:'crackman', fw:181, fh:348, scale:1.3, color:'#8a5a3a', hair:'#161616', mp3:'Crackman.mp3',
   clips:{walk:{start:0,count:6,fps:9,loop:true}, die:{start:5,count:1,fps:6,loop:false}}},
  // 14 = STABBER (stabber.png). Hooded figure in a black puffer with a knife. 11 frames ->
  //      0-5 walk, 6-7 knife-draw/lunge (UNUSED — basic enemies have no melee-attack hook),
  //      8-10 die (hit-with-blood -> kneel -> lying dead in a blood pool). Lives in
  //      Crackadilly Gardens alongside the crackmen. Melee/contact only. Nudge scale to taste.
  {img:'stabber', fw:222, fh:208, scale:1.155, color:'#23232a', hair:'#0e0e10', mp3:'Stabber.mp3',
   clips:{walk:{start:0,count:6,fps:9,loop:true}, die:{start:8,count:3,fps:9,loop:false}}},
  // 15 = BLADEBOT (bladebot.png). T-1000-style android with arm-blades. 6-frame walk cycle
  //      (the face peels back to bare endoskeleton across the cycle). Melee/contact; no death
  //      art so the last walk frame fades out. Judgement Day arena. Nudge scale to taste.
  {img:'bladebot', fw:228, fh:395, scale:1.3, color:'#2a2d33', hair:'#6a4a3a', mp3:'Bladebot.mp3',
   clips:{walk:{start:0,count:6,fps:10,loop:true}, die:{start:5,count:1,fps:6,loop:false}}},
  // 16 = GUNBOT (gunbot.png). Endoskeleton hauling a minigun. 10-frame walk. A SHOOTER that
  //      sprays NORMAL machine-gun rounds (bullet:'mg' -> small fast yellow tracers, NOT the
  //      UFO's Big-Blaster bolt). Fires while walking (no stop-pose). Judgement Day arena.
  {img:'gunbot', fw:265, fh:421, scale:1.35, shooter:true, bullet:'mg', shotDmg:5, color:'#3a3d42', hair:'#1c1c1c', mp3:'Gunbot.mp3',
   clips:{walk:{start:0,count:10,fps:11,loop:true}, die:{start:9,count:1,fps:6,loop:false}}},
  // 17 = BOSTONBOT (bostonbot.png). Blue-headed humanoid combat bot. 6-frame walk cycle.
  //      Melee/contact; last walk frame fades as death. Judgement Day arena.
  {img:'bostonbot', fw:118, fh:255, scale:1.2, color:'#9aa2ab', hair:'#1f7bff', mp3:'Bostonbot.mp3',
   clips:{walk:{start:0,count:6,fps:10,loop:true}, die:{start:5,count:1,fps:6,loop:false}}},
  // 18 = TESLABOT (teslabot.png). Black-and-white Atlas-style combat bot. 8-frame walk cycle.
  //      Melee/contact; last walk frame fades as death. Judgement Day arena.
  {img:'teslabot', fw:148, fh:265, scale:1.2, color:'#d8dde2', hair:'#101010', mp3:'Teslabot.mp3',
   clips:{walk:{start:0,count:8,fps:10,loop:true}, die:{start:7,count:1,fps:6,loop:false}}},
  // 19 = PROFESSOR (hawking.png). Seated figure in a powered wheelchair; 15 near-idle frames
  //      used as a slow rolling "walk". Melee/contact; last frame fades as death. Judgement Day.
  {img:'hawking', fw:281, fh:307, scale:0.96, color:'#20232a', hair:'#cfcfcf', mp3:'Hawking.mp3',
   clips:{walk:{start:0,count:15,fps:8,loop:true}, die:{start:14,count:1,fps:6,loop:false}}},
  // 20 = BIG-BRAIN GENIUS (bigbrain.png). Robed mega-brained figure. 6-frame walk (0-5) then a
  //      5-frame DYING collapse (6-10) used as the death animation. Crackadilly Gardens enemy.
  {img:'bigbrain', fw:276, fh:274, scale:1.5, color:'#d8d8d0', hair:'#6a4a30', mp3:'Bigbrain.mp3',
   clips:{walk:{start:0,count:6,fps:9,loop:true}, die:{start:6,count:5,fps:9,loop:false}}},
  // 21 = BIGMAN (bigman.png). Heavyset street guy, grey hoodie. 10 frames -> 0-5 walk, 6-9 collapse/die.
  //      Melee/contact. Repacked from 2-row art into one right-facing strip. Lives in America. Nudge scale/hp.
  {img:'bigman', fw:395, fh:438, scale:1.4, color:'#8a8f88', hair:'#3a2a1e', mp3:'Bigman.mp3',
   clips:{walk:{start:0,count:6,fps:9,loop:true}, die:{start:6,count:4,fps:9,loop:false}}},
  // 22 = BIGMAN2 (bigman2.png). Heavyset guy, white tee; staggers backward then falls flat. 10 frames ->
  //      0-5 walk, 6-9 stagger/fall/die. Melee/contact. Lives in America. Nudge scale/hp to taste.
  {img:'bigman2', fw:444, fh:417, scale:1.4, color:'#efefef', hair:'#1c1c1c', mp3:'Bigman2.mp3',
   clips:{walk:{start:0,count:6,fps:9,loop:true}, die:{start:6,count:4,fps:9,loop:false}}},
  // 23 = PINKSHIRT (pinkshirt.png). Slim bloke, pink shirt + dark trousers; staggers back and falls.
  //      10 frames -> 0-5 walk, 6-9 stagger/fall/die. Melee/contact. Lives in EUROPE (lvl_europe).
  {img:'pinkshirt', fw:353, fh:363, scale:1.35, color:'#d9a7b0', hair:'#141414', mp3:'Pinkshirt.mp3',
   clips:{walk:{start:0,count:6,fps:9,loop:true}, die:{start:6,count:4,fps:9,loop:false}}},
  // 24 = BIGMAN3 (bigman3.png). Big shirtless bloke in brown shorts; staggers back then falls flat.
  //      10 frames -> 0-5 walk, 6-9 stagger/fall/die. Melee/contact. Lives in AMERICA (lvl_america).
  {img:'bigman3', fw:484, fh:438, scale:1.5, color:'#7a4a2a', hair:'#241712', mp3:'Bigman3.mp3',
   clips:{walk:{start:0,count:6,fps:9,loop:true}, die:{start:6,count:4,fps:9,loop:false}}},
];
const EH=78;
let enemies=[];
const killedEnemies=new Set();          // ids of enemies killed this playthrough (don't respawn)
function pushEnemy(kind,at,id,opts){
  if(kind===1) return null;                             // CLOWNS removed from the game entirely
  const k=ENEMY_KINDS[kind]; const sc=(k.scale||1)*((opts&&opts.scaleMul)||1); const h=Math.round(EH*sc); const w=Math.round(h*k.fw/k.fh);
  const hp=(opts&&opts.hp)||40;
  let face=((opts&&opts.face)||-1);
  if(opts&&opts.spawnSide==='left'){  at=Math.max(20, at-BGW*0.35);        face= 1; }   // enter from the LEFT, walking right
  if(opts&&opts.spawnSide==='right'){ at=Math.min(BGW-w-20, at+BGW*0.25);  face=-1; }   // enter from the RIGHT, walking left
  const e={kind, x:at, w, h, y:0, vx:0, face, id:id||null, static:!!(opts&&opts.static),
    cross:!!(opts&&opts.cross), spd:(opts&&opts.spd)||null,
    hp, max:hp, state:'walk', ct:0, hitId:-1, dmgCool:0, fade:1, fireCd:80+Math.floor(Math.random()*60)};
  enemies.push(e); return e;            // returned so the arena can scale its speed/damage
}
function spawnEnemiesForSection(){
  if(SECTIONS[sectionIndex].arena){ arenaEnter(); return; }   // arena sections run their own wave spawner
  arenaActive=false;                                          // any normal section leaves the arena
  enemies=[]; enemyBullets=[]; drops=[];
  const sec=SECTIONS[sectionIndex];
  if(sec.respawn){ (sec.enemies||[]).forEach((e,i)=>killedEnemies.delete(sectionIndex+'-e'+i)); }  // respawn sections (e.g. Cottagers Cove): enemies are back every visit
  sec.enemies.forEach((e,i)=>{ const id=sectionIndex+'-e'+i; if(!killedEnemies.has(id)) pushEnemy(e.kind, e.at, id, e); });
  if(SECTIONS[sectionIndex].id==='park' && parkInvaded) spawnParkAliens();
}
function spawnParkAliens(){
  const a=SECTIONS[sectionIndex].aliens; if(!a) return;
  a.forEach((x,i)=>{ const id=sectionIndex+'-a'+i; if(!killedEnemies.has(id)) pushEnemy(x.kind, x.at, id); });
}
const ESPEED=1.05, EAGGRO=560, EHIT_RANGE=42, EDMG=8;
function enemyClipDone(e){ const c=ENEMY_KINDS[e.kind].clips.die; return e.ct>=Math.ceil(c.count*60/c.fps); }
/* ── ARENA DROPS: wave-game reward pickups ────────────────────────────────
   Only in arenas (isArena() — the Void / Underworld / Judgement Day / Boss
   Mode). ~16% of kills drop something: mostly a plate of food (heals 40 HP),
   occasionally a star (10 seconds of invincibility — no damage taken at all).
   No art needed — drawn as simple canvas shapes, same fallback style as the
   toilet key / cash stack. */
let drops=[];
function maybeDropPickup(e){
  if(!isArena()) return;
  if(Math.random()>=0.16) return;
  const kind = Math.random()<0.78 ? 'food' : 'star';
  drops.push({kind, x:e.x+e.w/2, taken:false, t:Math.random()*10});
}
function killEnemy(e,ko){ if(e.state==='die'||e.state==='dead')return; e.state='die'; e.ct=0; (ko?sfxKO:sfxHit)();
  STATS.kills++; if(STATS.kills%25===0) saveStats();
  const reward=e.static?25:10; addMoney(reward); addFloater(e.x+e.w/2, e.y, '+\u00A3'+reward); arenaAddKillScore();
  maybeDropPickup(e);
  const sec=SECTIONS[sectionIndex];
  if(sec.endlessSpawn && !player.dead){                 // e.g. Europe: kill one, another takes its place
    let at = 200 + Math.random()*(BGW-400);
    if(Math.abs(at-player.x)<260) at += (at<player.x?-1:1)*320;   // never pop in right on top of you
    at=Math.max(40,Math.min(BGW-60,at));
    const k=ENEMY_KINDS[e.kind];
    const scaleMul = e.h/(EH*(k.scale||1));            // match the size of the enemy that just died, not full kind-scale
    pushEnemy(e.kind, at, null, {hp:e.max||40, scaleMul});
  }
}
function updateDrops(){
  if(player.dead) return;
  for(const d of drops){
    if(d.taken) continue;
    const gy=groundAt(d.x);
    const near = Math.abs((player.x+PW/2)-d.x) < PW/2+30 && Math.abs((player.y+PH)-gy) < 70;
    if(!near) continue;
    d.taken=true;
    if(d.kind==='food'){
      player.hp=Math.min(player.max, player.hp+40);
      document.getElementById('hpbar').style.width=(player.hp/player.max*100)+'%';
      addFloater(d.x, gy-40, '+HEALTH');
      flashBanner('Found some scran &mdash; health up!');
      [0,4,7].forEach((s,i)=>setTimeout(()=>blip(440*Math.pow(2,s/12),0,0.12,'triangle',0.14),i*70));
    } else {
      player.invincibleT=600;                            // 10 seconds at 60fps
      addFloater(d.x, gy-40, 'INVINCIBLE!');
      flashBanner('INVINCIBLE &mdash; 10 seconds!');
      sfxSummon();
    }
  }
  drops=drops.filter(d=>!d.taken);
}
function drawDropFallback(kind, cx, top, hh){
  ctx.save(); ctx.translate(cx, top+hh/2); const s=hh/34; ctx.scale(s,s);
  if(kind==='food'){
    ctx.shadowColor='rgba(255,200,80,0.85)'; ctx.shadowBlur=8;
    ctx.fillStyle='#d8d8d8'; ctx.beginPath(); ctx.ellipse(0,4,15,6,0,0,7); ctx.fill();       // plate
    ctx.fillStyle='#b5651d'; ctx.beginPath(); ctx.ellipse(-3,-1,7,5,0.3,0,7); ctx.fill();     // food
    ctx.fillStyle='#8a4513'; ctx.beginPath(); ctx.ellipse(4,1,5,4,0,0,7); ctx.fill();
    ctx.fillStyle='#5a8a3a'; ctx.beginPath(); ctx.ellipse(-7,3,3,2,0,0,7); ctx.fill();        // veg garnish
  } else {
    ctx.shadowColor='rgba(255,230,60,0.95)'; ctx.shadowBlur=13;
    ctx.fillStyle='#ffe23c'; ctx.strokeStyle='#a87d00'; ctx.lineWidth=1.4;
    ctx.beginPath();
    for(let i=0;i<5;i++){
      const a=-Math.PI/2 + i*(2*Math.PI/5), a2=a+Math.PI/5;
      const xo=Math.cos(a)*13, yo=Math.sin(a)*13, xi=Math.cos(a2)*5.4, yi=Math.sin(a2)*5.4;
      if(i===0) ctx.moveTo(xo,yo); else ctx.lineTo(xo,yo);
      ctx.lineTo(xi,yi);
    }
    ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  ctx.restore();
}
function drawDrops(){
  for(const d of drops){
    if(d.taken) continue;
    const gy=groundAt(d.x);
    const bob=Math.sin(performance.now()/300 + d.t)*4;
    const h=30*ZOOM;
    const sx=(d.x-camX)*ZOOM, sy=(gy-30-SRCY)*ZOOM+bob;
    if(sx<-60||sx>VW+60) continue;
    drawDropFallback(d.kind, sx, sy, h);
  }
}
function updateEnemies(){
  const aggro = isArena()? 1e9 : EAGGRO;   // The Void: enemies chase the player from ANY distance
  for(const e of enemies){
    e.y=groundAt(e.x+e.w/2)-e.h-(ENEMY_KINDS[e.kind].hover||0);
    if(e.state==='dead') continue;
    if(e.shockT>0){ e.shockT--; if(e.shockT%2===0) vfx.push({type:'electric', x:e.x+e.w/2+(Math.random()*e.w*0.5-e.w*0.25), y:e.y+e.h*0.4+(Math.random()*e.h*0.3), t:0, life:6}); }
    if(e.burnT>0){ e.burnT--; for(let i=0;i<2;i++) vfx.push({type:'fire', x:e.x+e.w/2+(Math.random()*e.w*0.6-e.w*0.3), y:e.y+e.h*0.72, vx:(Math.random()-0.5)*0.6, vy:-1-Math.random()*1.4, t:0, life:14+Math.floor(Math.random()*10)}); }
    if(e.state==='die'){ e.ct++; if(enemyClipDone(e)){ e.state='dead'; if(e.id) killedEnemies.add(e.id); } continue; }
    // CROSS rider (e.g. bikes): rides in a FIXED direction across the level, ignores the player,
    // wraps around the far edge so riders keep coming from both directions. Hurts on contact.
    if(e.cross){
      e.x += e.face*(e.spd||2.3);
      if(e.face>0 && e.x>BGW){ e.x=-e.w; } else if(e.face<0 && e.x<-e.w){ e.x=BGW; }
      e.ct++;
      if(e.dmgCool>0) e.dmgCool--;
      const dxc=(player.x+PW/2)-(e.x+e.w/2);
      if(!player.dead && Math.abs(dxc)<EHIT_RANGE+6 && e.dmgCool<=0){
        damagePlayer(e.dmg||EDMG); e.dmgCool=70; player.x += (dxc>0?-10:10);
      }
      continue;
    }
    // walking / chasing the player
    const K=ENEMY_KINDS[e.kind];
    const dx=(player.x+PW/2)-(e.x+e.w/2);
    e.face = dx>0?1:-1;
    // e.anim is a VISUAL overlay ('shoot'/'dance') that pauses movement; e.state stays 'walk'
    // so all hit/target logic keeps working. animT counts the overlay down.
    if(e.animT>0){ e.animT--; if(e.animT<=0){ e.anim=null; e.ct=0; } }
    // DANCER: walk a few steps, then dance in place, repeat
    if(K.dancer){
      if(e.phaseT===undefined){ e.phaseT=55; e.anim=null; }
      if(--e.phaseT<=0){
        if(e.anim==='dance'){ e.anim=null; e.phaseT=55; e.ct=0; }
        else { e.anim='dance'; e.phaseT=120; e.ct=0; }
      }
    }
    const busy = (e.anim==='shoot'||e.anim==='dance');   // stationary while doing the overlay
    if(!busy && !player.dead && Math.abs(dx)<aggro && Math.abs(dx)>EHIT_RANGE){
      if(!e.static) e.x += e.face*(e.spd||ESPEED);
    }
    e.ct++;
    e.x=Math.max(0,Math.min(BGW-e.w,e.x));
    // contact damage to player (not while paused for an overlay)
    if(e.dmgCool>0) e.dmgCool--;
    if(!busy && !e.static && !player.dead && Math.abs(dx)<EHIT_RANGE+6 && e.dmgCool<=0){
      damagePlayer(e.dmg||EDMG); e.dmgCool=70;
      player.x += (dx>0?-10:10); // knockback
    }
    // shooter enemies (UFO, gunman) lob Big-Blaster bolts; gunmen play a SHOOT pose
    if(K.shooter && !player.dead && !busy){
      if(e.fireCd>0) e.fireCd--;
      if(e.fireCd<=0 && Math.abs(dx)<900){
        enemyFire(e); e.fireCd = (K.bullet==='mg') ? (14+Math.floor(Math.random()*12)) : (70+Math.floor(Math.random()*50));
        if(K.clips.shoot){ e.anim='shoot'; e.ct=0; e.animT=Math.ceil(K.clips.shoot.count*60/K.clips.shoot.fps); }
      }
    }
  }
  // cull fully-dead after their death anim has shown a moment
  enemies = enemies.filter(e=> e.state!=='dead');
}
function applyPlayerHits(){
  if(!playerAttacking()) return;
  const c=CLIPS[player.clip]; const dur=Math.ceil(c.count*60/c.fps);
  const prog=player.ct/dur;
  if(prog<0.18||prog>0.62) return;               // active strike window only
  const dmg = player.clip==='headbutt'?60:26;
  const reach=64;
  const front = player.x + (player.face>0?PW*0.4:PW*0.6);
  for(const e of enemies){
    if(e.state!=='walk') continue;
    if(e.hitId===player.attackId) continue;       // already hit this swing
    const ec=e.x+e.w/2;
    const inFront = player.face>0 ? (ec>front && ec<front+reach) : (ec<front && ec>front-reach);
    if(!inFront) continue;
    e.hp-=dmg; e.hitId=player.attackId; e.x += player.face*12;
    spawnBlood(e.x+e.w/2 + player.face*e.w*0.18, e.y+e.h*0.45, player.face);
    if(e.hp<=0) killEnemy(e,true); else sfxHit();
  }
}
function drawEnemy(e){
  const sx=(e.x-camX)*ZOOM, sy=(e.y-SRCY)*ZOOM, dw=e.w*ZOOM, dh=e.h*ZOOM;
  if(sx<-dw*2||sx>VW+dw*2) return;
  const k=ENEMY_KINDS[e.kind];
  ctx.save();
  if(e.face<0){ ctx.translate(sx+dw,sy); ctx.scale(-1,1); } else { ctx.translate(sx,sy); }
  if(e.state==='die'){ const p=Math.min(1,e.ct/26); ctx.globalAlpha=1-p*0.85; ctx.translate(0,dh*0.15*p); }
  if(imgOk(loaded[k.img])){
    let clip = e.state==='die' ? k.clips.die : (k.clips[e.anim] || k.clips.walk);
    let f=Math.floor(e.ct*clip.fps/60); f=clip.loop?(f%clip.count):Math.min(f,clip.count-1);
    try{ ctx.drawImage(loaded[k.img],(clip.start+f)*k.fw,0,k.fw,k.fh,0,0,dw,dh); }catch(_){ drawEnemyStandin(dw,dh,k,e); }
  } else { drawEnemyStandin(dw,dh,k,e); }
  ctx.restore();
}
function drawEnemyStandin(dw,dh,k,e){
  const walkBob = (e.state==='walk') ? Math.sin(e.ct*0.3)*2 : 0;
  ctx.save(); ctx.translate(0,walkBob);
  ctx.fillStyle=k.color; roundRect(dw*0.22,dh*0.32,dw*0.56,dh*0.55,6); ctx.fill();
  ctx.fillRect(dw*0.30,dh*0.80,dw*0.16,dh*0.20); ctx.fillRect(dw*0.54,dh*0.80,dw*0.16,dh*0.20);
  ctx.fillStyle=k.hair; ctx.beginPath(); ctx.arc(dw*0.5,dh*0.22,dh*0.14,0,7); ctx.fill();
  ctx.fillStyle='#f3c9a8'; ctx.beginPath(); ctx.arc(dw*0.5,dh*0.25,dh*0.085,0,7); ctx.fill();
  ctx.fillStyle='#d9caa6'; ctx.fillRect(dw*0.74,dh*0.10,dw*0.22,dh*0.16);
  ctx.strokeStyle='#5a4a2a'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(dw*0.80,dh*0.26); ctx.lineTo(dw*0.80,dh*0.55); ctx.stroke();
  ctx.restore();
}

/* ── SCENERY NPCs: decorative, non-combat animated sprites (dancers etc.) ─────
   Defined per-section in data.js as
     npcs:[{img, fw, fh, clip:{start,count,fps,loop}, at, h, yOff, face, mp3, range}]
   They just loop an animation in place — no collision, no damage, can't be hit.
   yOff is added to the ground line: a NEGATIVE yOff lifts them UP the path (further
   back / higher on screen) so they read as background. mp3 = proximity track slot. */
let scenery=[];
function spawnScenery(){
  scenery=[];
  const list=SECTIONS[sectionIndex].npcs||[];
  for(const d of list) scenery.push({def:d, x:d.at, ct:(Math.random()*120)|0, dir:(d.face||1), face:(d.face||1)});
}
function updateScenery(){
  for(const s of scenery){ s.ct++;
    const d=s.def;
    if(d.pace){                                  // walk back and forth between paceFrom..paceTo
      const from=(d.paceFrom!=null?d.paceFrom:d.at-200), to=(d.paceTo!=null?d.paceTo:d.at+200);
      s.x += s.dir*(d.paceSpd||0.7);
      if(s.x>=to){ s.x=to; s.dir=-1; } else if(s.x<=from){ s.x=from; s.dir=1; }
      s.face=s.dir;                              // face the way he's walking
    }
  }
}
function drawScenery(){
  for(const s of scenery){
    const d=s.def; const h=d.h||120, w=Math.round(h*d.fw/d.fh);
    const top=groundAt(s.x+w/2)+(d.yOff||0)-h;
    const sx=(s.x-camX)*ZOOM, sy=(top-SRCY)*ZOOM, dw=w*ZOOM, dh=h*ZOOM;
    if(sx<-dw*2||sx>VW+dw*2) continue;
    ctx.save();
    if(((s.face!=null?s.face:d.face)||1)<0){ ctx.translate(sx+dw,sy); ctx.scale(-1,1); } else { ctx.translate(sx,sy); }
    const img=loaded[d.img];
    if(imgOk(img)){
      const c=d.clip; let f=Math.floor(s.ct*c.fps/60); f=(c.loop===false)?Math.min(f,c.count-1):(f%c.count);
      try{ ctx.drawImage(img,(c.start+f)*d.fw,0,d.fw,d.fh,0,0,dw,dh); }catch(_){}
    }
    ctx.restore();
  }
}

/* ── REACTIVE GRAFFITI: decorative wall art that reacts to the player ────────
   Data-driven per room via GRAFFITI (data.js) — same idle/react clip pattern
   documented there. Reacts either when the player simply walks within range,
   or gets an immediate re-trigger from a STRIKE while in range. */
let graffiti=[];
function curGraffitiList(){ return (typeof GRAFFITI!=='undefined' && GRAFFITI[SECTIONS[sectionIndex].id]) || null; }
function spawnGraffiti(){
  graffiti=[];
  const list=curGraffitiList(); if(!list) return;
  for(const d of list) graffiti.push({def:d, ct:0, mode:'idle', wasNear:false});
}
function updateGraffiti(){
  if(!graffiti.length) return;
  for(const g of graffiti){
    const d=g.def;
    const near = Math.abs((player.x+PW/2)-d.at) < (d.range||110);
    if(g.mode==='idle'){
      const struck = near && punchEdge;                 // a STRIKE while nearby re-triggers it
      if((near && !g.wasNear) || struck){ g.mode='react'; g.ct=0; }
    } else {
      g.ct++;
      const c=d.clips.react, dur=Math.ceil(c.count*60/c.fps);
      if(g.ct>=dur){ g.mode='idle'; g.ct=0; }
    }
    g.wasNear=near;
  }
}
function drawGraffiti(){
  for(const g of graffiti){
    const d=g.def, im=loaded[d.img]; if(!imgOk(im)) continue;
    const h=d.h||120, w=Math.round(h*d.fw/d.fh);
    const top=groundAt(d.at)+(d.yOff||0)-h;
    const sx=(d.at-w/2-camX)*ZOOM, sy=(top-SRCY)*ZOOM, dw=w*ZOOM, dh=h*ZOOM;
    if(sx<-dw*2||sx>VW+dw*2) continue;
    const c=(g.mode==='react')?d.clips.react:d.clips.idle;
    let f=Math.floor(g.ct*c.fps/60); f=c.loop?(f%c.count):Math.min(f,c.count-1);
    try{ ctx.drawImage(im,(c.start+f)*d.fw,0,d.fw,d.fh,sx,sy,dw,dh); }catch(_){}
  }
}

/* ── WEATHER: rain + wind overlay, data-driven via section.weather:'rain' ──
   Screen-space particle overlay (not world-anchored) so it always covers the
   whole view regardless of camera position. Gusty diagonal drift for "windy". */
let rain=[];
function sectionWeather(){ return SECTIONS[sectionIndex].weather||null; }
function initRain(n){ rain=[]; for(let i=0;i<n;i++) rain.push({x:Math.random()*VW, y:Math.random()*VH, len:14+Math.random()*11, spd:9+Math.random()*5}); }
function updateRain(){
  if(sectionWeather()!=='rain'){ if(rain.length) rain=[]; return; }
  if(!rain.length) initRain(110);
  const gust=3.6+1.8*Math.sin(performance.now()/850);      // fluctuating sideways wind
  for(const r of rain){
    r.x+=gust; r.y+=r.spd;
    if(r.y>VH || r.x>VW+20){ r.x=Math.random()*VW-60; r.y=-10-Math.random()*50; }
  }
}
function drawRain(){
  if(sectionWeather()!=='rain'||!rain.length) return;
  ctx.save();
  ctx.fillStyle='rgba(18,26,38,0.14)'; ctx.fillRect(0,0,VW,VH);   // overcast tint
  ctx.strokeStyle='rgba(195,215,235,0.38)'; ctx.lineWidth=1.4; ctx.lineCap='round';
  for(const r of rain){ ctx.beginPath(); ctx.moveTo(r.x,r.y); ctx.lineTo(r.x-5,r.y+r.len); ctx.stroke(); }
  ctx.restore();
}


/* ── COLLECTIBLE ITEMS (keys etc.) ─────────────────────────────────────────
   Per-section in data.js as items:[{id, at, h, label}]. Walk over one to pick
   it up; it drops into `inventory` (a Set of ids that PERSISTS across rooms for
   the whole playthrough, cleared only on a new game). Doors can require an item
   via {locked:true, key:'<id>'}. If loaded[id] is a real png it's drawn; if not,
   a gold key is drawn so the toilet key is visible even before toiletkey.png is
   uploaded. */
let items=[];
const inventory=new Set();
function spawnItems(){
  items=[];
  const list=SECTIONS[sectionIndex].items||[];
  for(const d of list){ if(!inventory.has(d.id)) items.push({def:d, x:d.at, taken:false}); }
}
function updateItems(){
  if(player.dead) return;
  for(const it of items){
    if(it.taken) continue;
    const d=it.def;
    let near = Math.abs((player.x+PW/2)-it.x) < PW/2+34;
    if(near && d.float){                                  // a floating item: must also be near it vertically (swim up to it)
      const itemY = groundAt(it.x) - (d.h||34) - (d.yOff||0);
      near = Math.abs((player.y+PH*0.4) - itemY) < 100;
    }
    if(near){
      it.taken=true; inventory.add(d.id);
      if(d.money){ addMoney(d.money); flashBanner('Found '+(d.label||('\u00A3'+d.money))+'!'); }
      else flashBanner('Picked up '+(d.label||d.id));
      [0,4,7,12].forEach((s,i)=>setTimeout(()=>blip(520*Math.pow(2,s/12),0,0.12,'triangle',0.16),i*60));
    }
  }
}
function drawKeyFallback(cx, top, hh){
  // a simple gold key, scaled to height hh, drawn with its top-left near (cx-?, top)
  ctx.save(); ctx.translate(cx, top+hh/2); const s=hh/34; ctx.scale(s,s);
  ctx.shadowColor='rgba(255,200,40,0.85)'; ctx.shadowBlur=8;
  ctx.fillStyle='#f4c430'; ctx.strokeStyle='#7a5a10'; ctx.lineWidth=1.6;
  ctx.beginPath(); ctx.arc(-9,0,7.5,0,7); ctx.fill(); ctx.stroke();           // bow (round head)
  ctx.beginPath(); ctx.arc(-9,0,3,0,7); ctx.fillStyle='#221900'; ctx.fill();  // hole
  ctx.fillStyle='#f4c430';
  ctx.fillRect(-2,-2.4,17,4.8);                                               // shaft
  ctx.fillRect(11,-2.4,2.6,8); ctx.fillRect(14.5,-2.4,2.6,6);                 // teeth
  ctx.restore();
}
function drawCashFallback(cx, top, hh){
  // a green stack of banknotes with a £ on it, scaled to height hh
  ctx.save(); ctx.translate(cx, top); const s=hh/34; ctx.scale(s,s);
  ctx.shadowColor='rgba(80,220,120,0.85)'; ctx.shadowBlur=9;
  for(let i=3;i>=0;i--){                       // a few offset notes => a stack
    ctx.fillStyle=i%2?'#1f7a3a':'#249447'; ctx.strokeStyle='#0c3a1c'; ctx.lineWidth=1.4;
    ctx.beginPath(); ctx.rect(-17+i*1.5, i*-3.2, 34, 18); ctx.fill(); ctx.stroke();
  }
  ctx.shadowBlur=0; ctx.fillStyle='#eaffe2'; ctx.font='800 12px sans-serif'; ctx.textAlign='center';
  ctx.fillText('\u00A3', 0, -9.5+13);
  ctx.restore(); ctx.textAlign='start';
}
function drawItems(){
  for(const it of items){
    if(it.taken) continue;
    const d=it.def; const h=(d.h||34);
    const gy=groundAt(it.x);
    const bob=Math.sin(performance.now()/360)*(d.float?6:3);
    const sx=(it.x-camX)*ZOOM, sy=(gy-h-(d.yOff||0)-SRCY)*ZOOM+bob;
    if(sx<-80||sx>VW+80) continue;
    const img=loaded[d.money?'cash':d.id];
    if(imgOk(img)){
      const dh=h*ZOOM, dw=dh*img.naturalWidth/img.naturalHeight;
      ctx.save(); ctx.shadowColor=d.money?'rgba(120,255,150,0.7)':'rgba(255,210,80,0.7)'; ctx.shadowBlur=10;
      try{ ctx.drawImage(img, sx-dw/2, sy, dw, dh); }catch(_){}
      ctx.restore();
    } else if(d.money){
      drawCashFallback(sx, sy, h*ZOOM);
    } else {
      drawKeyFallback(sx, sy, h*ZOOM);
    }
  }
}

/* ── ENEMY PROJECTILES: Big-Blaster bolts thrown by shooter enemies (the UFO) ── */
let enemyBullets=[];
function enemyFire(e){
  const K=ENEMY_KINDS[e.kind];
  const px=player.x+PW/2, py=player.y+PH*0.45;
  const ex=e.x+e.w*0.5, ey=e.y+e.h*0.42;
  let dx=px-ex, dy=py-ey; const d=Math.hypot(dx,dy)||1;
  const mg=(K.bullet==='mg');
  const pistol=(K.bullet==='pistol');
  const sp = mg?9.6:(pistol?8.4:4.6);
  let vx=dx/d*sp, vy=dy/d*sp;
  if(mg){ const j=(Math.random()-0.5)*0.09, c=Math.cos(j), s=Math.sin(j); const nx=vx*c-vy*s, ny=vx*s+vy*c; vx=nx; vy=ny; } // slight spray
  enemyBullets.push({x:ex, y:ey, vx, vy, dmg:(K.shotDmg||14), t:0, life:mg?80:(pistol?90:150), mg, pistol});
  if(typeof sfxShot==='function') sfxShot();
}
function updateEnemyBullets(){
  for(const b of enemyBullets){
    b.x+=b.vx; b.y+=b.vy; b.t++;
    if(b.t>b.life || b.x<-40 || b.x>BGW+40){ b.dead=true; continue; }
    if(!player.dead && (player.hurtCool||0)<=0 &&
       Math.abs(b.x-(player.x+PW/2))<PW*0.42 && Math.abs(b.y-(player.y+PH*0.5))<PH*0.5){
      damagePlayer(b.dmg); b.dead=true;
      if(typeof vfx!=='undefined') vfx.push({type:'spark', x:b.x, y:b.y, t:0, life:8});
    }
  }
  enemyBullets=enemyBullets.filter(b=>!b.dead);
}
function drawEnemyBullets(){
  for(const b of enemyBullets){
    const sx=(b.x-camX)*ZOOM, sy=(b.y-SRCY)*ZOOM;
    if(sx<-30||sx>VW+30) continue;
    if(b.mg){                                            // normal machine-gun round: small fast tracer
      const ang=Math.atan2(b.vy,b.vx);
      ctx.save(); ctx.translate(sx,sy); ctx.rotate(ang);
      ctx.shadowColor='#ff9a1a'; ctx.shadowBlur=6;
      ctx.fillStyle='#ffe07a'; ctx.fillRect(-8*ZOOM,-1.4*ZOOM, 16*ZOOM, 2.8*ZOOM);
      ctx.fillStyle='#fff7d0'; ctx.fillRect(2*ZOOM,-1*ZOOM, 5*ZOOM, 2*ZOOM);
      ctx.restore(); continue;
    }
    if(b.pistol){                                        // normal pistol round: small brass bullet
      const ang=Math.atan2(b.vy,b.vx);
      ctx.save(); ctx.translate(sx,sy); ctx.rotate(ang);
      ctx.shadowColor='#ffd24a'; ctx.shadowBlur=5;
      ctx.fillStyle='#ffe98a'; ctx.fillRect(-5*ZOOM,-1.1*ZOOM, 10*ZOOM, 2.2*ZOOM);
      ctx.fillStyle='#fff7d0'; ctx.beginPath(); ctx.arc(5*ZOOM,0,1.3*ZOOM,0,7); ctx.fill();
      ctx.restore(); continue;
    }
    if(imgOk(loaded.bigblaster)){
      const bi=loaded.bigblaster, bh=30*ZOOM, bw=bh*bi.naturalWidth/bi.naturalHeight;
      ctx.save(); ctx.translate(sx,sy);
      if(b.vx<0) ctx.scale(-1,1);                         // sprite art points RIGHT; flip when flying left
      ctx.shadowColor='rgba(120,200,255,0.9)'; ctx.shadowBlur=12;
      try{ ctx.drawImage(bi,-bw/2,-bh/2,bw,bh); }catch(_){}
      ctx.restore();
    } else {
      ctx.save(); ctx.fillStyle='#ff7a1a'; ctx.shadowColor='#ff4500'; ctx.shadowBlur=10;
      ctx.beginPath(); ctx.arc(sx,sy,6*ZOOM,0,7); ctx.fill(); ctx.restore();
    }
  }
}
const HELPERS=[
  {id:'athlete', name:'The Hurler', img:'athlete', type:'fighter', fw:127, fh:185, drawH:80,
   color:'#27c2a8', skin:'#f0c49a', stick:'#caa05a',
   clips:{run:{start:0,count:6,fps:12,loop:true}, atk:{start:6,count:5,fps:16,loop:true}}},
  {id:'bin', name:'Fire Bin', img:'binhelper', type:'sweep', fw:90, fh:113, drawH:86,
   color:'#3a3d44', skin:'#ff7a1a', stick:'#ff9b30',
   clips:{roll:{start:0,count:7,fps:14,loop:true}}},
];
const HELPER_DUR=15*60, FIGHT_COOL=20*60, SWEEP_COOL=26*60, CREW_COOL=45*60;
let helperCool=[0,0,0];
/* ── THE CAVALRY (helper 3): the hub walkers — vigilante, piper and the commuter
   (the captain sits this one out) — run in and SHOOT the enemies around you for
   10 seconds, then leg it. Summoned from the third helper button. */
HELPERS.push({id:'crew', name:'The Cavalry', img:'piper', type:'crew', fw:164, fh:242, drawH:80,
  color:'#3b6a3f', skin:'#e8c49a', stick:'#caa05a'});
const CREW_DEFS=[
  /* each cavalry member fires a DIFFERENT shop weapon — real projectiles through the
     same bullets system as the player, so the actual weapon sprite flies out: */
  {img:'vigilante', fw:167, fh:282, h:85, off:-170, walk:{start:0,count:6,fps:10}, shoot:{start:6,count:3,fps:10},
   wid:'weapon08'},   // Annihilator
  {img:'piper',     fw:164, fh:242, h:88, off:-100, walk:{start:0,count:6,fps:10}, shoot:{start:6,count:3,fps:12},
   wid:'weapon03'},   // Ravager
  {img:'commuter',  fw:95,  fh:139, h:88, off: 130, walk:{start:0,count:6,fps:10}, shoot:{start:6,count:4,fps:12},
   wid:'weapon04'},   // Sledgehammer
];
const CREW_DUR=10*60;
const crew={active:false, timer:0, members:[], tracers:[]};
function crewSummon(){
  if(crew.active || helperCool[2]>0){ blip(180,120,0.08,'square',0.12); return; }
  crew.active=true; crew.timer=CREW_DUR; crew.tracers=[];
  crew.members=CREW_DEFS.map((d,i)=>({d, x:(i<2? camX-60-i*70 : camX+SRCW+60), slot:player.x+d.off,
    w:Math.round(d.h*d.fw/d.fh), face:1, phase:'in', ct:Math.random()*10, fireCd:30+i*14, shootT:0}));
  flashBanner('THE CAVALRY!');
  blip(392,784,0.16,'triangle',0.2); blip(587,1175,0.2,'triangle',0.16);
}
function crewUpdate(){
  if(!crew.active) return;
  crew.timer--;
  const SPD=3.4;
  for(const m of crew.members){
    m.ct++;
    const d=m.d;
    if(crew.timer<=0) m.phase='out';
    if(m.phase==='in'){
      m.slot=Math.max(40,Math.min(BGW-m.w-40, player.x+d.off));   // keep station on the player
      const dx=m.slot-m.x;
      if(Math.abs(dx)>8){ m.face=dx>0?1:-1; m.x+=m.face*SPD; m.shootT=0; }
      else{                                                        // in position: fight
        m.fireCd--;
        if(m.shootT>0) m.shootT--;
        if(m.fireCd<=0){
          let best=null,bd=1e9;
          for(const e of enemies){ if(e.state!=='walk')continue;
            const dd=Math.abs((e.x+e.w/2)-(m.x+m.w/2)); if(dd<900&&dd<bd){bd=dd;best=e;} }
          const w=WEAPONS[d.wid];
          if(best) m.face=(best.x+best.w/2>m.x+m.w/2)?1:-1;      // no target? keep SUPPRESSING anyway
          m.shootT=16; m.fireCd=(best?w.cooldown:Math.max(12,w.cooldown*0.7))+4+Math.random()*8;
          const mx=m.x+m.w/2+m.face*m.w*0.6, my=groundAt(m.x+m.w/2)-d.h*0.62;
          vfx.push({type:'muzzle', x:mx, y:my, face:m.face, t:0, life:7});
          const spread=(Math.random()*2-1)*(w.spread||0.02)+(best?0:(Math.random()*2-1)*0.05);
          bullets.push({ x:mx, y:my, vx:m.face*w.speed*Math.cos(spread), vy:w.speed*Math.sin(spread),
                         dmg:w.dmg, knock:w.knock, range:w.range, traveled:0, sprite:w.sprite, spriteH:w.spriteH,
                         hitfx:w.hitfx });
          sfxShot(); if(w.shake) addShake(3,4);
        }
      }
    } else {                                                       // leg it off the LEFT of the view
      m.face=-1; m.x-=SPD*1.25; m.shootT=0;
    }
  }
  if(crew.timer<=0 && crew.members.every(m=>m.x+m.w<camX-20 || m.x<=0)){
    crew.active=false; helperCool[2]=CREW_COOL;
  }
}
function crewDraw(){
  if(!crew.active) return;
  for(const m of crew.members){
    const d=m.d, dh=d.h*ZOOM*CSCALE, dw=m.w*ZOOM*CSCALE;
    const wy=groundAt(m.x+m.w/2)-d.h;
    const sx=(m.x-camX)*ZOOM-(dw-m.w*ZOOM)/2, sy=(wy+d.h-SRCY)*ZOOM-dh;
    if(sx<-dw*2||sx>VW+dw*2) continue;
    ctx.save(); ctx.shadowColor='rgba(120,255,200,0.8)'; ctx.shadowBlur=10;
    if(m.face<0){ ctx.translate(sx+dw,sy); ctx.scale(-1,1); } else { ctx.translate(sx,sy); }
    const img=loaded[d.img];
    const clip=(m.shootT>0)?d.shoot:d.walk;
    let f=Math.floor(m.ct*clip.fps/60)%clip.count;
    if(imgOk(img)){ try{ ctx.drawImage(img,(clip.start+f)*d.fw,0,d.fw,d.fh,0,0,dw,dh); }catch(_){} }
    else { ctx.fillStyle='#3b6a3f'; ctx.fillRect(dw*0.3,dh*0.15,dw*0.4,dh*0.85); }
    ctx.restore();
  }
}
const helper={active:false, kind:0, x:0, y:0, face:1, ct:0, phase:'in', timer:0, w:0, hitCt:0, kills:0, targets:[]};
function pickNearestEnemies(n){
  const live=enemies.filter(e=>e.state==='walk');
  live.sort((a,b)=>Math.abs(a.x-player.x)-Math.abs(b.x-player.x));
  return live.slice(0,n);
}
function nearestEnemy(){
  let best=null,bd=1e9;
  for(const e of enemies){ if(e.state!=='walk')continue; const d=Math.abs((e.x+e.w/2)-(helper.x+helper.w/2)); if(d<bd){bd=d;best=e;} }
  return best;
}
function nearestOf(list){
  let best=null,bd=1e9;
  for(const e of list){ const d=Math.abs((e.x+e.w/2)-(helper.x+helper.w/2)); if(d<bd){bd=d;best=e;} }
  return best;
}
function fighterNearTarget(){
  const t=nearestOf(helper.targets.filter(e=>enemies.includes(e)&&e.state==='walk'));
  return !!t && Math.abs((t.x+t.w/2)-(helper.x+helper.w/2))<70;
}
function summonHelper(idx){
  idx=idx||0;
  if(HELPERS[idx]&&HELPERS[idx].type==='crew'){ crewSummon(); return; }   // the cavalry runs independently
  if(helper.active) return;
  if(helperCool[idx]>0){ blip(180,120,0.08,'square',0.12); return; }
  const h=HELPERS[idx];
  helper.kind=idx; helper.w=Math.round(h.drawH*h.fw/h.fh);
  helper.x=Math.max(0,camX-helper.w-30); helper.face=1; helper.phase='in';
  helper.active=true; helper.ct=0; helper.hitCt=0; helper.kills=0;
  helper.targets = h.type==='fighter' ? pickNearestEnemies(2) : [];
  sfxSummon();
}
function updateHelper(){
  crewUpdate();
  if(!helper.active){ for(let i=0;i<helperCool.length;i++) if(helperCool[i]>0) helperCool[i]--; refreshHelperBtns(); return; }
  helper.ct++;
  const h=HELPERS[helper.kind];
  if(h.type==='fighter') updateFighter(); else updateSweep();
  helper.x=Math.max(0,Math.min(BGW-helper.w,helper.x));
  helper.y=groundAt(helper.x+helper.w/2)-h.drawH;
  refreshHelperBtns();
}
function updateFighter(){
  const HSPD=3.8;
  helper.targets=helper.targets.filter(e=>enemies.includes(e)&&e.state==='walk');
  if(helper.phase==='in'){
    const tgt=nearestOf(helper.targets);
    if(tgt && helper.kills<2){
      helper.face=(tgt.x>helper.x)?1:-1;
      const reach=Math.abs((tgt.x+tgt.w/2)-(helper.x+helper.w/2));
      if(reach>50){ helper.x+=helper.face*HSPD; }
      else { killEnemy(tgt,true); helper.kills++; helper.hitCt=0; }
    } else { helper.phase='out'; }
  } else {
    helper.face=-1; helper.x-=HSPD;
    if(helper.x+helper.w < camX-12 || helper.x<=0){ helper.active=false; helperCool[helper.kind]=FIGHT_COOL; }
  }
}
function updateSweep(){
  const BSPD=4.8; helper.face=1; helper.x+=BSPD;
  const viewL=camX, viewR=camX+SRCW;
  for(const e of enemies){
    if(e.state!=='walk') continue;
    const ec=e.x+e.w/2;
    if(ec>=viewL && ec<=viewR && ec<=helper.x+helper.w) killEnemy(e,true);
  }
  if(helper.x-camX > SRCW+24 || helper.x>=BGW-helper.w){ helper.active=false; helperCool[helper.kind]=SWEEP_COOL; }
}
function drawHelper(){
  if(!helper.active) return;
  const h=HELPERS[helper.kind];
  const dh=h.drawH*ZOOM*CSCALE, dw=helper.w*ZOOM*CSCALE;
  const sx=(helper.x-camX)*ZOOM-(dw-helper.w*ZOOM)/2, sy=(helper.y+h.drawH-SRCY)*ZOOM-dh;
  if(sx<-dw*2||sx>VW+dw*2) return;
  ctx.save();
  if(h.type==='fighter'){ ctx.shadowColor='rgba(120,255,200,0.85)'; ctx.shadowBlur=12; }
  else { ctx.shadowColor='rgba(255,150,40,0.9)'; ctx.shadowBlur=16; }
  if(helper.face<0){ ctx.translate(sx+dw,sy); ctx.scale(-1,1); } else { ctx.translate(sx,sy); }
  if(imgOk(loaded[h.img])){
    let clip;
    if(h.type==='fighter'){ clip=(helper.phase==='in'&&fighterNearTarget())?h.clips.atk:h.clips.run; }
    else clip=h.clips.roll;
    let f=Math.floor(helper.ct*clip.fps/60); f=clip.loop?(f%clip.count):Math.min(f,clip.count-1);
    try{ ctx.drawImage(loaded[h.img],(clip.start+f)*h.fw,0,h.fw,h.fh,0,0,dw,dh); }catch(_){ drawHelperStandin(dw,dh,h); }
  } else drawHelperStandin(dw,dh,h);
  ctx.restore();
}
function drawHelperStandin(dw,dh,h){
  if(h.type==='sweep'){
    ctx.fillStyle=h.color; roundRect(dw*0.16,dh*0.34,dw*0.68,dh*0.6,5); ctx.fill();
    ctx.fillStyle='#ff7a1a'; ctx.beginPath(); ctx.moveTo(dw*0.3,dh*0.34); ctx.lineTo(dw*0.5,dh*0.02); ctx.lineTo(dw*0.7,dh*0.34); ctx.closePath(); ctx.fill();
    return;
  }
  const bob=Math.sin(helper.ct*0.4)*3; ctx.save(); ctx.translate(0,bob);
  const stride=Math.sin(helper.ct*0.4)*dw*0.12;
  ctx.fillStyle=h.color;
  ctx.fillRect(dw*0.34-stride,dh*0.74,dw*0.16,dh*0.26); ctx.fillRect(dw*0.50+stride,dh*0.74,dw*0.16,dh*0.26);
  roundRect(dw*0.26,dh*0.34,dw*0.48,dh*0.46,6); ctx.fill();
  ctx.fillStyle=h.skin; ctx.beginPath(); ctx.arc(dw*0.5,dh*0.22,dh*0.13,0,7); ctx.fill();
  ctx.strokeStyle=h.stick; ctx.lineWidth=4; ctx.beginPath(); ctx.moveTo(dw*0.6,dh*0.5); ctx.lineTo(dw*0.92,dh*0.2); ctx.stroke();
  ctx.restore();
}
function buildHelperThumbs(){
  document.querySelectorAll('.helperbtn').forEach(btn=>{
    const idx=+btn.dataset.h; const h=HELPERS[idx];
    const nm=btn.querySelector('.hname'); if(nm) nm.textContent=h.name.toUpperCase();
    const cvt=btn.querySelector('.helperthumb'); if(!cvt) return; const c=cvt.getContext('2d');
    c.clearRect(0,0,cvt.width,cvt.height);
    if(imgOk(loaded[h.img])){
      const dw=cvt.height*h.fw/h.fh;
      try{ c.imageSmoothingEnabled=true; c.drawImage(loaded[h.img],0,0,h.fw,h.fh,(cvt.width-dw)/2,0,dw,cvt.height); return; }catch(_){}
    }
    c.fillStyle=h.color; c.fillRect(cvt.width/2-9,16,18,26);
    if(h.type!=='sweep'){ c.fillStyle=h.skin; c.beginPath(); c.arc(cvt.width/2,12,8,0,7); c.fill(); }
  });
}
function updateHelperBarVisibility(){
  const s=SECTIONS[sectionIndex];
  const bar=document.querySelector('.helperbar');
  if(bar) bar.style.display = (s.chain || s.arena || s.helpers) ? '' : 'none';   // chain levels + arenas + any `helpers:true` room get helpers
}
function refreshHelperBtns(){
  document.querySelectorAll('.helperbtn').forEach(btn=>{
    const idx=+btn.dataset.h; const cool=btn.querySelector('.cool');
    if(helperCool[idx]>0){ btn.classList.add('cooling'); btn.classList.remove('ready'); if(cool) cool.textContent=Math.ceil(helperCool[idx]/60); }
    else { btn.classList.remove('cooling'); if(cool) cool.textContent=''; if(!helper.active) btn.classList.add('ready'); else btn.classList.remove('ready'); }
  });
}

/* ── small canvas helper ── */
function roundRect(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

/* ── PLAYER HP / DEATH ───────────────────────────────────── */
function damagePlayer(d){
  if(player.dead||player.hurtCool>0) return;
  if(player.invincibleT>0){ player.hurtCool=10; return; }   // invincible: no HP lost, no knockback flicker either
  if(player.armour>0){                              // vest soaks the hit, no HP lost
    player.armour--; player.hurtCool=18; sfxHurt(); updateArmourHUD();
    if(player.armour===0) flashBanner('Armour gone');
    return;
  }
  player.hp=Math.max(0,player.hp-d); player.hurtCool=18; sfxHurt();
  document.getElementById('hpbar').style.width=(player.hp/player.max*100)+'%';
  if(player.hp<=0){ player.dead=true; player.deadT=0; setClip('die'); sfxKO(); if(isArena()) arenaBankScore(); STATS.deaths++; saveStats(); showDeathCard(); }
}
function showDeathCard(){
  let d=document.getElementById('deathcard');
  if(!d){
    const st=document.createElement('style');
    st.textContent=`#deathcard{position:fixed;inset:0;z-index:75;background:rgba(6,2,2,0.72);display:none;align-items:center;justify-content:center;pointer-events:none;}
     #deathcard.on{display:flex;}
     #deathcard .dcard{text-align:center;color:#eef2f6;font:15px system-ui,sans-serif;}
     #deathcard h2{margin:0 0 6px;font-size:30px;color:#ff5f6d;letter-spacing:1px;text-shadow:0 2px 12px #000;}
     #deathcard .dmsg{font-style:italic;font-size:16px;margin-bottom:14px;color:#ffe98a;}
     #deathcard .drow{color:#cdd4dc;font-size:13px;line-height:1.8;}`;
    document.head.appendChild(st);
    d=document.createElement('div'); d.id='deathcard';
    d.innerHTML='<div class="dcard"><h2>YOU GOT DONE</h2><div class="dmsg"></div><div class="drow"></div></div>';
    document.body.appendChild(d);
  }
  d.querySelector('.dmsg').textContent="You're dead? Don't think you are, mate.";
  d.querySelector('.drow').innerHTML=
    'Enemies defeated: <b>'+STATS.kills.toLocaleString()+'</b> &nbsp;&bull;&nbsp; &pound; earned: <b>'+STATS.earned.toLocaleString()+'</b><br>'+
    'Best wave: <b>'+(STATS.bestWave||'&mdash;')+'</b> &nbsp;&bull;&nbsp; Times downed: <b>'+STATS.deaths.toLocaleString()+'</b>';
  d.classList.add('on');
}
function hideDeathCard(){ const d=document.getElementById('deathcard'); if(d) d.classList.remove('on'); }
function respawnPlayer(){
  player.x=120; player.y=groundAt(120+PW/2)-PH; player.vx=0; player.vy=0; player.onGround=true;
  player.hp=player.max; player.dead=false; player.deadT=0; setClip('idle');
  hideDeathCard();
  document.getElementById('hpbar').style.width='100%';
  if(isArena()) arenaBankScore();                   // record the run before the wave counter resets
  spawnEnemiesForSection();
}

/* ── LEVEL TRANSITION ────────────────────────────────────── */
let transitioning=false;
function flashBanner(html){ const b=document.getElementById('banner'); b.innerHTML=html; b.style.opacity=1; clearTimeout(b._t); b._t=setTimeout(()=>b.style.opacity=0,1600); }
function nextSection(){
  if(transitioning) return;
  const here=SECTIONS[sectionIndex];
  if(!here.chain) return;                       // hub & interior rooms don't advance off the edge
  const nextId=here.next;
  if(!nextId){                                  // end of the chain -> pop back to the hub
    transitioning=true;
    doFade('THE END &mdash; back to the street', ()=>{ killedEnemies.clear(); gotoId('home',{x:hubReturnX,face:1}); transitioning=false; });
    return;
  }
  const next=SECTIONS.find(s=>s.id===nextId);
  if(nextId==='dundee'){ // pub -> Dundee: flash the news card for ~3s
    transitioning=true;
    showCard({img:'dundee-news.jpeg', text:'Welcome to Dundee',
      swap:()=>{ gotoId('dundee'); }, done:()=>{ transitioning=false; }});
    return;
  }
  if(nextId==='glasgow'){ // Dundee -> Glasgow: title card (cut-scene track removed by request)
    transitioning=true;
    showCard({text:next.name,
      swap:()=>{ gotoId('glasgow'); }, done:()=>{ transitioning=false; }});
    return;
  }
  transitioning=true;
  doFade(next.name, ()=>{ gotoId(nextId); transitioning=false; });
}
function prevSection(){
  if(transitioning) return;
  const here=SECTIONS[sectionIndex];
  if(!here.chain || !here.prev) return;         // only chained levels with a prev can backtrack
  const prev=SECTIONS.find(s=>s.id===here.prev);
  transitioning=true;
  doFade(prev.name, ()=>{ gotoId(here.prev,'right'); transitioning=false; });
}
function showCard(opts){
  const card=document.getElementById('dundeecard');
  const img=document.getElementById('dundeecard-img');
  const txt=card.querySelector('.dtxt'); if(txt) txt.innerHTML=opts.text||'';
  if(opts.img){
    card.classList.remove('noimg');
    img.onerror=()=>card.classList.add('noimg');   // if the picture isn't uploaded yet, fall back to text
    img.onload =()=>card.classList.remove('noimg');
    img.src=opts.img;
  } else { card.classList.add('noimg'); img.removeAttribute('src'); }   // text-only card
  if(opts.sound && !musicMuted){ try{ const a=new Audio(opts.sound); a.volume=0.9; a.play().catch(()=>{}); }catch(_){} }
  card.classList.add('on');
  requestAnimationFrame(()=>{ card.style.opacity='1'; });
  setTimeout(()=>{ opts.swap&&opts.swap(); }, 1500);          // switch the level underneath while it's hidden
  setTimeout(()=>{ card.style.opacity='0'; }, 3000);          // ~3s on screen, then fade out
  setTimeout(()=>{ card.classList.remove('on'); opts.done&&opts.done(); }, 3400);
}
function doFade(txt, mid){
  const f=document.getElementById('fade'), t=document.getElementById('ftxt');
  t.innerHTML=txt; f.style.opacity=1; setTimeout(()=>t.style.opacity=1,200);
  setTimeout(()=>{ mid&&mid(); }, 650);
  setTimeout(()=>{ t.style.opacity=0; f.style.opacity=0; }, 1500);
}
function enterSection(opts){
  loadSectionConfig();
  let ex;
  if(SECTIONS[sectionIndex].spawnMid) ex=Math.round(BGW/2-PW/2);   // easyJet / station: start dead centre
  else if(opts && typeof opts.x==='number') ex=opts.x;
  else if(opts==='right') ex=BGW-PW-60;
  else ex=120;
  player.x=Math.max(0,Math.min(BGW-PW,ex));
  player.y=groundAt(player.x+PW/2)-PH; player.vx=0; player.vy=0; player.onGround=true; setClip('idle');
  if(opts && typeof opts.face==='number') player.face=opts.face;
  toiletPanArmed=false;                                   // the toilet's pan-dive prompt re-arms each visit
  if(SECTIONS[sectionIndex].dropIn){                      // water levels: splash in from the TOP-LEFT and sink
    player.x=Math.max(0,Math.min(BGW-PW,40)); player.y=-PH; player.vy=0.6; player.onGround=false; player.face=1; setClip('jump');
  }
  bannerShown=false; helper.active=false; helperCool=[0,0]; activeDoor=null;
  if(SECTIONS[sectionIndex].id==='southampton' && !photographerMet){
    photographerMet=true; initNPC();              // first time on Southampton (the streets start): the photographer turns up
  } else if(typeof npc!=='undefined' && npc.active){
    npc.x=Math.max(0,Math.min(BGW-NPCW, player.x-130)); npc.state='trail'; npc.y=groundAt(npc.x+NPCW/2)-NPCH;
  }
  startParkIntro();
  startWanderer();
  initHubNpcs();
  initChurchNpc();
  initLibraryNpc();
  initMkNpcs();
  spawnEnemiesForSection();
  spawnScenery();
  spawnItems();
  spawnGraffiti();
  rain=[];                                          // re-seeded lazily by updateRain() for whichever room it's needed in
  refreshHelperBtns();
  updateHelperBarVisibility();
  playSectionTrack();   // plays this room's track, or silence for screen rooms / trackless interiors
  initPickup();
  if(dogHere()){ dog.x=Math.max(10,player.x-90); dog.st='trail'; dog.jumps=0; }   // the dog trots after you between floors
  SEA.on=false; if(SECTIONS[sectionIndex].sea) seaEnter();   // THE SEA shooting gallery
  else if(seaVid) { try{ seaVid.pause(); }catch(_){} }
  if(SECTIONS[sectionIndex].zdef) zomEnter();                // ZOMBIES wave defence
  tvEnter();                                       // start this room's wall screen (or stop if none)
  sceneEnter();                                    // start this level's full-scene wall+floor videos (or stop)
  if(SECTIONS[sectionIndex].autoMenu){ setTimeout(()=>{   // easyJet / station: open the board straight away
    if(SECTIONS[sectionIndex].autoMenu && !travelOpen) openTravel(SECTIONS[sectionIndex].autoMenu);
  }, 260); }
}

/* ── WORLD / DOORWAYS (hub <-> rooms) ────────────────────── */
let activeDoor=null, hubReturnX=120, photographerMet=false, toiletPanArmed=false;
const roomReturn={};   // roomId -> {from, x, face}: where to drop the player when they pop back OUT of that room
function gotoId(id, opts){
  const idx=SECTIONS.findIndex(s=>s.id===id);
  if(idx<0) return;
  sectionIndex=idx; enterSection(opts);
}
function updateDoors(){
  activeDoor=null;
  const sec=SECTIONS[sectionIndex];
  if(!sec.doors) return;
  const cx=player.x+PW/2;
  for(const d of sec.doors){ if(d.needArm && !toiletPanArmed) continue; if(Math.abs(cx-d.x)<=d.w){ activeDoor=d; break; } }
}
function useDoor(d){
  if(transitioning||!d) return;
  if(d.url){ try{ window.open(d.url,'_blank','noopener'); }catch(_){}
             if(d.label==='Buy Me A Pint' && !stashUnlocked){ stashUnlocked=true; saveProgress();
               flashBanner('CHEERS! \u2014 the STASH upstairs is yours'); }   // supporters' perk unlock
             setTimeout(()=>{ try{ location.href=d.url; }catch(_){} }, 60);   // mobile blocks deferred popups, so fall back to navigating this tab
             return; }
  if(d.jammed){                                       // the toilet's wall door won't open — sends you to the pan instead
    flashBanner('The door won&rsquo;t open &mdash; jump in the shitter!'); blip(200,110,0.12,'square',0.16);
    toiletPanArmed=true; return;
  }
  if(d.locked && !inventory.has(d.key)){          // locked door: needs the matching item in your inventory
    flashBanner('It&rsquo;s locked &mdash; you need a key'); blip(200,110,0.12,'square',0.16); return;
  }
  if(d.pdfMenu){ openPdfMenu(d.pdfMenu); return; }     // Library reading desk: opens the PDF read/download menu
  if(d.menu){                                         // travel point (portal / departures): open its menu
    const sec=SECTIONS[sectionIndex];
    if(sec.hub) hubReturnX=d.x;                        // pop back to this spot when returning to the hub
    openTravel(d.menu);
    return;
  }
  if(d.target===null){ flashBanner('The portal is dormant&hellip; for now'); return; }
  if(d.action==='stash'){ openStash(); return; }      // gun cabinet: opens the STASH menu
  if(d.action==='war'){ startWar(); return; }         // the window marker: 5 minutes of madness
  if(d.target==='shop'){ openShop(); return; }
  const sec=SECTIONS[sectionIndex];
  if(d.target==='home'){                              // leaving a room -> back outside
    transitioning=true;
    doFade('Out to the street', ()=>{ gotoId('home',{x:hubReturnX,face:1}); transitioning=false; });
  } else {                                            // entering a room (or a future linked level)
    if(sec.hub) hubReturnX=d.x;                        // remember which building to pop back to
    const dest=SECTIONS.find(s=>s.id===d.target);
    // If THIS door leads back to where we entered from, drop the player at the door they came
    // in through (so sub-rooms — club rooms, the toilet — return you outside the right door).
    // Otherwise we're heading deeper: remember the door we just used so the trip back lands here.
    let ex=90, face=1;
    const ret=roomReturn[sec.id];
    if(ret && ret.from===d.target){ ex=ret.x; face=ret.face||1; }
    else { roomReturn[d.target]={from:sec.id, x:d.x, face:1}; }
    if(typeof d.tx==='number'){ ex=d.tx; roomReturn[d.target]={from:sec.id, x:d.x, face:1}; }   // door-specified arrival spot
    transitioning=true;
    doFade(dest?dest.name:'', ()=>{ gotoId(d.target,{x:ex,face:face}); transitioning=false; });
  }
}
function drawDoors(){
  const sec=SECTIONS[sectionIndex];
  if(!sec.doors || !activeDoor) return;
  const d=activeDoor;
  const mx=(d.x-camX)*ZOOM;                       // screen x over the doorway
  const bob=Math.sin(performance.now()/260)*4;
  if(d.arrow){                                     // toilet pan: bubble up top + a big down-arrow aimed at the pan
    drawMarker(mx, 36+bob, 'JUMP IN THE SHITTER', 'STRIKE to dive in');
    ctx.save(); ctx.translate(mx, 92+bob);
    ctx.fillStyle='#ffe46b'; ctx.shadowColor='#000'; ctx.shadowBlur=4;
    ctx.beginPath(); ctx.moveTo(-13,0); ctx.lineTo(13,0); ctx.lineTo(0,20); ctx.closePath(); ctx.fill();
    ctx.restore();
    return;
  }
  const label=d.label.replace(/&mdash;/g,'\u2014').replace(/&amp;/g,'&').toUpperCase();
  let name, hint;
  if(d.url){ name=label; hint='STRIKE to open link'; }
  else if(d.pdfMenu){ name=label; hint='STRIKE to browse'; }
  else if(d.menu){ name=label; hint='STRIKE to travel'; }
  else if(d.jammed){ name='EXIT'; hint='STRIKE to leave'; }
  else if(d.target===null){ name=label; hint='locked for now'; }
  else if(d.locked && !inventory.has(d.key)){ name=label; hint='LOCKED \u2014 need a key'; }
  else if(d.target==='home'){ name='EXIT'; hint='STRIKE to leave'; }
  else if(d.action==='stash'){ name=label; hint='STRIKE to open'; }
  else if(d.action==='war'){ name=label; hint='STRIKE for WAR MODE \u2014 5 minutes of madness'; }
  else if(d.target==='shop'){ name=label; hint='STRIKE to open'; }
  else { name=label; hint='STRIKE to enter'; }
  drawMarker(mx, 30+bob, name, hint);
}
function drawMarker(cx, cy, name, hint){
  ctx.save(); ctx.textAlign='center';
  ctx.font='800 15px sans-serif'; const w1=ctx.measureText(name).width;
  ctx.font='700 11px sans-serif'; const w2=ctx.measureText(hint).width;
  const w=Math.max(w1,w2)+26, h=42;
  const bx=Math.max(6,Math.min(VW-w-6, cx-w/2)), by=cy;
  const px=Math.max(bx+12,Math.min(bx+w-12,cx));        // pointer aimed at the door
  ctx.globalAlpha=0.93; ctx.fillStyle='#0b0e14';
  roundRect(bx,by,w,h,9); ctx.fill();
  ctx.beginPath(); ctx.moveTo(px-9,by+h-1); ctx.lineTo(px+9,by+h-1); ctx.lineTo(px,by+h+11); ctx.closePath(); ctx.fill();
  ctx.globalAlpha=1; ctx.lineWidth=2; ctx.strokeStyle='#ffd34d';
  roundRect(bx,by,w,h,9); ctx.stroke();
  ctx.fillStyle='#ffe46b'; ctx.font='800 15px sans-serif'; ctx.fillText(name,bx+w/2,by+18);
  ctx.fillStyle='#cdd6e6'; ctx.font='700 11px sans-serif'; ctx.fillText(hint,bx+w/2,by+34);
  ctx.restore();
}

let tvVideo=null, tvHot=false, tvSoundEngaged=false;
let wakeLock=null;
async function requestWakeLock(){
  try{
    if('wakeLock' in navigator && !wakeLock){
      wakeLock=await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release',()=>{ wakeLock=null; });
    }
  }catch(_){}
}
function releaseWakeLock(){ try{ if(wakeLock){ wakeLock.release(); wakeLock=null; } }catch(_){} }
document.addEventListener('visibilitychange',()=>{
  // Re-acquire the screen wake lock whenever we come back to the foreground during play.
  // The browser auto-releases the lock when the tab is hidden (e.g. the phone sleeps), so
  // this keeps the screen awake for the WHOLE game session, not just while a video rolls.
  if(document.visibilityState==='visible'){
    try{ if(AC && AC.state!=='running') AC.resume(); }catch(_){}   // wake the SFX context too
    if(cur && !paused) requestWakeLock();
  }
});
/* iOS can SUSPEND / "interrupt" the WebAudio context after a while (lock screen, a call,
   backgrounding, an audio-session change) and a resume() from the game loop won't revive it —
   only a real user gesture will. The player taps constantly, so revive it on every tap/key.
   This is what was killing the jump/shoot SFX after a period of play. */
['pointerdown','touchstart','keydown'].forEach(ev=>document.addEventListener(ev, ()=>{
  try{ if(AC && AC.state!=='running') AC.resume(); }catch(_){}
  // The screen PICTURE already autoplays muted on entry. A sound screen (house TV / Restore)
  // gets its in-world audio switched on here, on the first gesture — iOS forbids cold unmuted autoplay.
  try{ const sc=curScreen(); if(sc && tvVideo && !paused){
        if(sc.sound && !musicMuted && tvVideo.muted){ tvVideo.muted=false; tvSoundEngaged=true; }
        if(tvVideo.paused && !tvVideo.ended) tvVideo.play().catch(()=>{});
      } }catch(_){}
}, {passive:true, capture:true}));
function curScreen(){ return SCREENS[SECTIONS[sectionIndex].id] || null; }
const _tvVidPool={};                 // src -> <video>, kept buffered so channels don't reload on switch
function tvVidFor(src){
  if(!src) return null;
  let v=_tvVidPool[src];
  if(!v){
    v=document.createElement('video');
    v.setAttribute('playsinline',''); v.setAttribute('webkit-playsinline','');
    const sc=curScreen(); const playlist=!!(sc&&sc.playlist);
    v.loop=!playlist;                        // channels loop; cinema parts play through then advance
    v.preload='auto'; v.muted=true;          // in-world screens stay MUTED: muted video autoplays reliably on iOS AND doesn't grab the audio session (which was suspending the SFX). Sound comes on in fullscreen.
    v.style.cssText='position:fixed;left:-9999px;top:-9999px;width:2px;height:2px;opacity:0;pointer-events:none;';
    document.body.appendChild(v);
    if(playlist){                            // when one part finishes (or 404s), roll to the next
      v.addEventListener('ended', ()=>{ if(tvVideo===v) tvAdvancePart(); });
      v.addEventListener('error', ()=>{ if(tvVideo===v) tvAdvancePart(); });
      v.addEventListener('playing', ()=>{ _plSkips=0; });   // a part is actually rolling (don't preload the next — it starves this one)
    }
    v.src=src; try{ v.load(); }catch(_){}    // begin buffering immediately
    _tvVidPool[src]=v;
  }
  return v;
}
let _plSkips=0;
function tvAdvancePart(){                     // cinema: roll to the next part, skipping any missing files
  const sc=curScreen(); if(!sc||!sc.playlist||!sc.files.length) return;
  if(_plSkips>sc.files.length){ _plSkips=0; return; }   // a whole lap with nothing playable — stop trying
  sc.idx=(sc.idx+1)%sc.files.length; _plSkips++;
  screenLoad(true);
}
function tvPreloadOthers(){
  /* Preloading the OTHER channels/parts was starving the CURRENT video's bandwidth on phones —
     the screen would flash on then vanish until you skipped. Each channel/part now loads on
     demand: a brief buffer the first time you view it, then it stays pooled and is instant after. */
}
function screenLoad(playNow){
  const sc=curScreen(); if(!sc){ tvPause(); return; }
  const v=tvVidFor(sc.files[sc.idx]);
  if(tvVideo && tvVideo!==v){ try{ tvVideo.pause(); }catch(_){} }   // pause the previous channel
  tvVideo=v; v.muted=(sc.sound && !musicMuted && tvSoundEngaged) ? false : true;   // start MUTED so the PICTURE autoplays instantly on iOS; once the in-world sound has been engaged this visit (first gesture), channel-skips stay UNMUTED so audio is continuous.
  if(sc.playlist && v.readyState>=1 && (v.ended || v.currentTime>0.1)){ try{ v.currentTime=0; }catch(_){} }  // restart a FINISHED part, but never seek a still-loading element (that stalled part 1 on entry)
  if(playNow && !paused){ v.play().catch(()=>{}); requestWakeLock(); }
}
function tvEnter(){
  const sc=curScreen();
  if(!sc){ tvPause(); return; }
  tvSoundEngaged=false;                      // each visit: picture autoplays muted, first gesture engages sound, then skips stay unmuted
  if(sc.playlist){ sc.idx=0; _plSkips=0; }   // the cinema always (re)starts at PART 1
  screenLoad(true);                  // load + PLAY the current channel first (gives it bandwidth priority)
  if(tvVideo){                       // then warm the other channels once the current one has data
    if(tvVideo.readyState>=2) tvPreloadOthers();
    else tvVideo.addEventListener('loadeddata', tvPreloadOthers, {once:true});
  }
}
function tvPause(){ try{ for(const k in _tvVidPool){ _tvVidPool[k].pause(); } }catch(_){} try{ if(AC&&AC.state!=='running') AC.resume(); }catch(_){} }   // leaving a screen frees the audio session -> wake the SFX context
function tvNextChannel(){
  const sc=curScreen(); if(!sc||!sc.switchable) return;
  if(sc.playlist) _plSkips=0;
  sc.idx=(sc.idx+1)%sc.files.length; screenLoad(true);
  blip(540,820,0.05,'square',0.12); blip(300,300,0.04,'square',0.08);
  flashBanner((sc.playlist?'Part ':'Channel ')+(sc.idx+1));
}
function screenCenterX(sc){ return sc.rect.x + sc.rect.w/2; }
function updateTV(){
  const sc=curScreen();
  tvHot = !!(sc && sc.switchable) &&
          Math.abs((player.x+PW/2) - screenCenterX(sc)) <= (sc.reach||120);
  // Keep the screen video rolling: if it should be playing but isn't (e.g. the Restore TV wasn't
  // buffered on first entry), retry play() each frame until it sticks. Muted, so iOS allows it.
  if(sc && tvVideo && !paused && tvVideo.paused && !tvVideo.ended){ try{ tvVideo.play().catch(()=>{}); }catch(_){} }
  // Belt-and-suspenders for the SFX: nudge the WebAudio context back awake if it drifted to
  // suspended (the gesture/visibility handlers do the heavy lifting; this just speeds recovery).
  if(AC && AC.state==='suspended'){ try{ AC.resume(); }catch(_){} }
}
function drawTV(){
  const sc=curScreen(); if(!sc) return;
  const r=sc.rect;
  const sx=(r.x-camX)*ZOOM, sy=(r.y-SRCY)*ZOOM, sw=r.w*ZOOM, sh=r.h*ZOOM;
  const v=tvVideo;
  if(v && v.readyState>=2 && v.videoWidth>0){     // v is the current channel's pooled element
    try{ ctx.drawImage(v, sx, sy, sw, sh); }catch(_){}
  } else {
    ctx.save();
    ctx.fillStyle='#05070b'; ctx.fillRect(sx,sy,sw,sh);
    ctx.fillStyle='#1d2b46'; for(let i=0;i<6;i++){ ctx.fillRect(sx, sy+sh*(i/6), sw, sh/12); }
    ctx.fillStyle='#9fb4d8'; ctx.textAlign='center';
    ctx.font='700 11px monospace'; ctx.fillText(sc.files[sc.idx], sx+sw/2, sy+sh/2+4);
    ctx.restore();
  }
  if(sc.debug){ ctx.save(); ctx.strokeStyle='#00ff88'; ctx.lineWidth=2; ctx.strokeRect(sx,sy,sw,sh); ctx.restore(); }
}
function drawTVMarker(){
  if(!tvHot) return;
  const sc=curScreen(); const r=sc.rect;
  const cx=(screenCenterX(sc)-camX)*ZOOM;
  const cy=Math.max(8,(r.y-SRCY)*ZOOM-50) + Math.sin(performance.now()/260)*4;
  if(sc.playlist) drawMarker(cx, cy, 'CINEMA \u00B7 PART '+(sc.idx+1), 'STRIKE: next part \u00B7 double tap screen: fullscreen + sound');
  else            drawMarker(cx, cy, 'TV \u00B7 CH '+(sc.idx+1),      'STRIKE: next channel \u00B7 double tap screen: fullscreen');
}

/* ── THE WINCHESTER JUKEBOX (works like the TV, but switches MUSIC) ──────────
   When the current section has a JUKEBOX (data.js), stand within `reach` of its
   `x` and STRIKE to flip to the next track. The chosen file becomes the room's
   music via sectionMusic()/playSectionTrack(). Purely audio — no video, no rect. */
function curJukebox(){ return (typeof JUKEBOX!=='undefined' && JUKEBOX[SECTIONS[sectionIndex].id]) || null; }
let jukeHot=false;
function updateJukebox(){
  const jb=curJukebox();
  jukeHot = !!jb && Math.abs((player.x+PW/2) - jb.x) <= (jb.reach||140);
}
function jukeNext(){
  const jb=curJukebox(); if(!jb) return;
  jb.idx = (jb.idx>=jb.files.length-1) ? -1 : jb.idx+1;   // after the last track: PAUSED, then round again
  blip(540,820,0.05,'square',0.12); blip(300,300,0.04,'square',0.08);
  flashBanner(jb.idx<0 ? 'Jukebox &mdash; PAUSED' : 'Jukebox &mdash; Track '+(jb.idx+1));
  playSectionTrack();                              // re-evaluates music; picks the new jukebox track
  requestWakeLock();                               // keep the screen awake while listening (same as the TV screens)
}
function drawJukeMarker(){
  if(!jukeHot) return;
  const jb=curJukebox();
  const cx=(jb.x-camX)*ZOOM;
  const cy=30 + Math.sin(performance.now()/260)*4;
  drawMarker(cx, cy, jb.idx<0 ? 'JUKEBOX \u00B7 paused' : 'JUKEBOX \u00B7 '+(jb.idx+1), 'STRIKE to change track');
}
/* ── JUKEBOX AMBIENT GLOW ───────────────────────────────────────────────────
   A soft pulsing multi-colour halo around the jukebox spot (the Wurlitzer in the
   Winchester), drawn on the wall behind the characters so the corner feels lit.
   Position is the JUKEBOX `x`; tune the height with an optional `glowY` (0..1 of
   screen height, default ~0.5) and size with optional `glowR` on the JUKEBOX entry. */
function drawJukeGlow(){
  const jb=curJukebox(); if(!jb) return;
  const cx=(jb.x-camX)*ZOOM;
  const baseR=(jb.glowR||90)*ZOOM*0.7;
  if(cx<-baseR*2||cx>VW+baseR*2) return;
  const cy=VH*(jb.glowY!=null?jb.glowY:0.5);
  const t=performance.now()/1000;
  ctx.save(); ctx.globalCompositeOperation='lighter';
  for(let i=0;i<3;i++){
    const r=baseR*(0.7+0.3*Math.sin(t*1.4+i*2.1));
    const hue=(t*45+i*120)%360;
    const g=ctx.createRadialGradient(cx,cy,0,cx,cy,Math.max(1,r));
    g.addColorStop(0,'hsla('+hue+',90%,60%,0.22)');
    g.addColorStop(0.6,'hsla('+hue+',90%,55%,0.08)');
    g.addColorStop(1,'hsla('+hue+',90%,55%,0)');
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(cx,cy,Math.max(1,r),0,7); ctx.fill();
  }
  ctx.restore();
}
/* ── AMBIENT GLOWS (data-driven, per room) ──────────────────────────────────
   Renders the GLOWS table (data.js): soft additive halos on candles / neon /
   lamps so light sources feel alive. 'warm' flickers like a flame, 'cycle' drifts
   through the spectrum like neon, a fixed `hue` glows steadily. Drawn as backdrop. */
function curGlows(){ return (typeof GLOWS!=='undefined' && GLOWS[SECTIONS[sectionIndex].id]) || null; }
function drawGlows(){
  const list=curGlows(); if(!list) return;
  const t=performance.now()/1000;
  ctx.save(); ctx.globalCompositeOperation='lighter';
  for(let i=0;i<list.length;i++){
    const gl=list[i];
    const sx=(gl.x-camX)*ZOOM, sy=(gl.y-SRCY)*ZOOM, baseR=(gl.r||40)*ZOOM;
    if(sx<-baseR*2||sx>VW+baseR*2) continue;
    const ph=i*1.7;
    const warm=(gl.mode==='warm'), cyc=(gl.mode==='cycle');
    // warm = candle flicker; others = a slow gentle breathe
    const flick = warm ? (0.74+0.20*Math.sin(t*9+ph)+0.12*Math.sin(t*21+ph*1.7))
                       : (0.82+0.18*Math.sin(t*1.6+ph));
    const r=baseR*flick;
    let hue;
    if(warm) hue=30+6*Math.sin(t*6+ph);            // amber flame
    else if(cyc) hue=(t*45+i*70)%360;              // slow rainbow neon
    else hue=(gl.hue!=null?gl.hue:45);             // steady fixed hue
    const sat=warm?95:(gl.sat!=null?gl.sat:90);
    const lig=warm?56:(gl.light!=null?gl.light:58);
    const a=(gl.alpha!=null?gl.alpha:0.22)*flick;
    const rg=ctx.createRadialGradient(sx,sy,0,sx,sy,Math.max(1,r));
    rg.addColorStop(0,   'hsla('+hue+','+sat+'%,'+lig+'%,'+a+')');
    rg.addColorStop(0.55,'hsla('+hue+','+sat+'%,'+(lig-6)+'%,'+(a*0.4)+')');
    rg.addColorStop(1,   'hsla('+hue+','+sat+'%,'+lig+'%,0)');
    ctx.fillStyle=rg; ctx.beginPath(); ctx.arc(sx,sy,Math.max(1,r),0,7); ctx.fill();
  }
  ctx.restore();
}

let sceneWallVid=null, sceneFloorVid=null;     // the CURRENT zone's pooled <video> elements
const _sceneVidPool={};                        // src -> <video>, kept buffered so zones don't reload mid-level
function curSceneCfg(){ return SCENE_VIDEOS[SECTIONS[sectionIndex].id] || null; }
function sceneVidFor(src){
  if(!src) return null;
  let v=_sceneVidPool[src];
  if(!v){
    v=document.createElement('video');
    v.setAttribute('playsinline',''); v.setAttribute('webkit-playsinline','');
    v.loop=true; v.preload='auto'; v.muted=true;
    v.style.cssText='position:fixed;left:-9999px;top:-9999px;width:2px;height:2px;opacity:0;pointer-events:none;';
    document.body.appendChild(v);
    v.src=src; try{ v.load(); }catch(_){}      // start buffering this clip immediately
    _sceneVidPool[src]=v;
  }
  return v;
}
function scenePreloadAll(){                     // warm up EVERY zone's clips on entry so later zones are ready before you reach them
  const cfg=curSceneCfg(); if(!cfg) return;
  if(cfg.zones){ for(const z of cfg.zones){ sceneVidFor(z.wall); sceneVidFor(z.floor); } }
  else { sceneVidFor(cfg.wall); sceneVidFor(cfg.floor); }
}
let sceneZoneIdx=-1;
function sceneSrc(){
  const cfg=curSceneCfg(); if(!cfg) return null;
  if(cfg.zones && cfg.zones.length){ let z=cfg.zones[0]; for(const zz of cfg.zones){ if(player.x>=zz.from) z=zz; } return {wall:z.wall, floor:z.floor}; }
  return {wall:cfg.wall, floor:cfg.floor};
}
function sceneUpdate(){
  const cfg=curSceneCfg(); if(!cfg||!cfg.zones) return;
  let idx=0; for(let i=0;i<cfg.zones.length;i++){ if(player.x>=cfg.zones[i].from) idx=i; }
  if(idx!==sceneZoneIdx){ sceneZoneIdx=idx; sceneLoad(true); }
}
function sceneLoad(playNow){
  const cfg=curSceneCfg(); if(!cfg){ scenePause(); return; }
  const src=sceneSrc()||{};
  const w=sceneVidFor(src.wall), f=src.floor?sceneVidFor(src.floor):null;
  if(sceneWallVid && sceneWallVid!==w){ try{ sceneWallVid.pause(); }catch(_){} }   // pause previous zone's clips
  if(sceneFloorVid && sceneFloorVid!==f){ try{ sceneFloorVid.pause(); }catch(_){} }
  sceneWallVid=w; sceneFloorVid=f;
  if(w) w.muted=true; if(f) f.muted=true;
  if(playNow && !paused){ if(w) w.play().catch(()=>{}); if(f) f.play().catch(()=>{}); requestWakeLock(); }
}
function sceneEnter(){ sceneZoneIdx=-1; if(curSceneCfg()){ scenePreloadAll(); sceneLoad(true); } else scenePause(); }
function scenePause(){ try{ for(const k in _sceneVidPool){ _sceneVidPool[k].pause(); } }catch(_){} }
function drawSceneVideos(){
  const cfg=curSceneCfg(); if(!cfg) return;
  const src=sceneSrc()||{};
  const hasFloor = !!src.floor;
  const wallH = hasFloor ? Math.round(VH*cfg.wallFrac) : VH;
  const floorY=wallH, floorH=VH-wallH;
  const tileScreenW=cfg.tileW*ZOOM;
  const w=sceneWallVid, f=sceneFloorVid;
  const wallReady = w && w.readyState>=2 && w.videoWidth>0;     // w is already the current zone's pooled element
  const floorReady= hasFloor && f && f.readyState>=2 && f.videoWidth>0;
  const startK=Math.floor(camX/cfg.tileW);
  for(let k=startK; k*cfg.tileW < camX+SRCW; k++){
    const sx=(k*cfg.tileW - camX)*ZOOM;
    if(wallReady){ try{ ctx.drawImage(w, sx, 0, tileScreenW, wallH); }catch(_){} }
    else { ctx.save(); ctx.fillStyle='#0a0c12'; ctx.fillRect(sx,0,tileScreenW,wallH);
           ctx.strokeStyle='#1a2640'; ctx.lineWidth=1; ctx.strokeRect(sx+0.5,0.5,tileScreenW-1,wallH-1);
           ctx.fillStyle='#33405a'; ctx.font='700 12px monospace'; ctx.textAlign='center';
           ctx.fillText((src.wall||'(no clip)')+(hasFloor?'  \u00B7  WALL':'  \u00B7  SCREEN'), sx+tileScreenW/2, wallH/2); ctx.restore(); }
    if(hasFloor){
      if(floorReady){ try{ ctx.drawImage(f, sx, floorY, tileScreenW, floorH); }catch(_){} }
      else { ctx.save(); ctx.fillStyle='#05070b'; ctx.fillRect(sx,floorY,tileScreenW,floorH);
             ctx.strokeStyle='#141d30'; ctx.lineWidth=1; ctx.strokeRect(sx+0.5,floorY+0.5,tileScreenW-1,floorH-1);
             ctx.fillStyle='#2a3550'; ctx.font='700 12px monospace'; ctx.textAlign='center';
             ctx.fillText((src.floor||'(no floor)')+'  \u00B7  FLOOR', sx+tileScreenW/2, floorY+floorH/2); ctx.restore(); }
    }
  }
  ctx.textAlign='start';
}

/* ── MONEY + FLOATING REWARDS ────────────────────────────── */
let money=0;
function updateMoneyHUD(){ const m=document.getElementById('money'); if(m) m.textContent='\u00A3'+money; }
function addMoney(n){ money+=n; updateMoneyHUD(); if(n>0){ STATS.earned+=n; } if(typeof saveProgress==='function') saveProgress(); }
/* ── LIFETIME STATS ─────────────────────────────────────────────────────────
   Persisted records shown on the RECORDS screen. */
const STATS={ kills:0, earned:0, bestWave:0, bestDover:0, deaths:0, runs:0 };
function loadStats(){ try{ const j=JSON.parse(localStorage.getItem('crusader_stats')||'null'); if(j) Object.assign(STATS,j); }catch(_){}}
function saveStats(){ try{ localStorage.setItem('crusader_stats', JSON.stringify(STATS)); }catch(_){}}
function statBestWave(w){ if(w>STATS.bestWave){ STATS.bestWave=w; saveStats(); } }
function statBestDover(s){ if(s>STATS.bestDover){ STATS.bestDover=s; saveStats(); } }
let floaters=[];
function addFloater(x,y,txt){ floaters.push({x,y,txt,t:0}); }
function updateFloaters(){ for(const f of floaters) f.t++; floaters=floaters.filter(f=>f.t<55); }
function drawFloaters(){
  ctx.save(); ctx.textAlign='center'; ctx.font='800 16px sans-serif';
  for(const f of floaters){ const a=Math.max(0,1-f.t/55); const sx=(f.x-camX)*ZOOM, sy=(f.y-SRCY)*ZOOM-f.t*0.9;
    ctx.globalAlpha=a; ctx.lineWidth=3; ctx.strokeStyle='#000'; ctx.strokeText(f.txt,sx,sy);
    ctx.fillStyle='#ffe46b'; ctx.fillText(f.txt,sx,sy); }
  ctx.restore();
}

/* ── RETURN TO HUB (run off the left edge of a level) ─────── */
function returnToHub(){
  if(transitioning) return;
  transitioning=true;
  doFade('Back to the high street', ()=>{ killedEnemies.clear(); gotoId('home',{x:hubReturnX,face:1}); transitioning=false; });
}

/* ── GUN SHOP ────────────────────────────────────────────── */
const owned=new Set();
/* ── SAVED PROGRESS ─────────────────────────────────────────────────────────
   Money, bought weapons and story unlocks persist across sessions (localStorage).
   Saved on every money change / purchase and every few seconds as a backstop. */
function saveProgress(){
  try{ localStorage.setItem('crusader_save', JSON.stringify({
    money, owned:[...owned],
    fighter:(typeof cur!=='undefined'&&cur)?cur.id:null,
    stash:stashUnlocked, ammo:STASH_AMMO,
    bikMet:(typeof bik!=='undefined')&&bik.met,
    photoMet:(typeof photographerMet!=='undefined')&&photographerMet })); }catch(_){}
}
let CONTINUE_MODE=false, SAVED=null;
function loadProgress(){
  try{ SAVED=JSON.parse(localStorage.getItem('crusader_save')||'null'); }catch(_){ SAVED=null; }
}
function applySavedProgress(){                          // called AFTER start(m)'s reset, when Continuing
  const j=SAVED; if(!j) return;
  if(typeof j.money==='number') money=j.money;
  if(Array.isArray(j.owned)) j.owned.forEach(id=>{ if(WEAPONS[id]) owned.add(id); });
  weaponList=WEAPON_ORDER.filter(x=>owned.has(x));
  weaponSel=weaponList.indexOf('pistol');
  if(j.bikMet){ bik.met=true; bik.active=true; bik.state='trail'; }
  if(j.photoMet) photographerMet=true;
  if(j.stash) stashUnlocked=true;
  if(j.ammo) Object.assign(STASH_AMMO, j.ammo);
  updateMoneyHUD(); refreshWeaponBtn();
}
setInterval(saveProgress, 5000);
let shopOpen=false;
function openShop(){ shopOpen=true; renderShop(); document.getElementById('shop').classList.add('on'); }
function closeShop(){ shopOpen=false; document.getElementById('shop').classList.remove('on'); }

let travelOpen=false;
function openTravel(menuId){
  const m=TRAVEL_MENUS[menuId]; if(!m) return;
  travelOpen=true;
  document.getElementById('travel-title').textContent=m.title;
  const list=document.getElementById('travel-list'); list.innerHTML='';
  m.dests.forEach(dst=>{
    const exists=SECTIONS.some(s=>s.id===dst.target);
    const b=document.createElement('button'); b.className='trow';
    const nm=document.createElement('span'); nm.className='tname'; nm.textContent=dst.label;
    const tag=document.createElement('span'); tag.className='ttag'; tag.textContent=exists?'GO':'SOON';
    if(!exists) b.classList.add('soon');
    b.appendChild(nm); b.appendChild(tag);
    b.onclick=(e)=>{ e.stopPropagation(); travelTo(dst.target, dst.label); };
    list.appendChild(b);
  });
  document.getElementById('travel').classList.add('on');
}
function closeTravel(){ travelOpen=false; document.getElementById('travel').classList.remove('on'); }
/* ── WAR MODE ───────────────────────────────────────────────────────────────
   Triggered from the marker LEFT of the upstairs window: 5 MINUTES OF MADNESS.
   The window feed switches to war.mp4 (upload it), a two-tone siren wails, red/
   blue light floods the room, and every enemy kind in the game pours in from the
   far LEFT of upstairs, walking straight at you. Survive the 5 minutes (or die
   trying). The war only ticks while you're up there. */
const WAR={ on:false, t:0, dur:5*60*60, spawnT:0, kindIdx:0, sirenT:0 };
const WAR_KINDS=[0,2,3,4,5,7,9,10,12,14,15,16,17,18,19,20,21,22,23,24].filter(k=>ENEMY_KINDS[k]);
function startWar(){
  if(WAR.on){ flashBanner('WAR already raging \u2014 '+Math.ceil((WAR.dur-WAR.t)/3600)+' min left'); return; }
  WAR.on=true; WAR.t=0; WAR.spawnT=900; WAR.kindIdx=0; WAR.sirenT=0;   // sirens NOW; first bodies through the window after 15s
  const sc=SCREENS.in_upstairs; if(sc && sc.files.length>1){ sc.idx=1; tvEnter(); }   // the window shows the war outside
  flashBanner('WAR MODE \u2014 5 MINUTES OF MADNESS');
  addShake(10,20); noiseBurst(0.4,0.3,120);
}
function endWar(){
  WAR.on=false;
  const sc=SCREENS.in_upstairs; if(sc){ sc.idx=0; if(SECTIONS[sectionIndex].id==='in_upstairs') tvEnter(); }
  flashBanner('THE WAR IS OVER');
  blip(392,784,0.3,'triangle',0.2);
}
function updateWar(){
  if(!WAR.on) return;
  if(SECTIONS[sectionIndex].id!=='in_upstairs') return;   // only rages while you're up there
  WAR.t++;
  if(WAR.t>=WAR.dur){ endWar(); return; }
  WAR.sirenT++;                                           // two-tone siren
  if(WAR.sirenT%44===0) blip(660,660,0.34,'sawtooth',0.10);
  else if(WAR.sirenT%44===22) blip(880,880,0.34,'sawtooth',0.10);
  WAR.spawnT--;
  if(WAR.spawnT<=0){
    const kind=WAR_KINDS[WAR.kindIdx%WAR_KINDS.length]; WAR.kindIdx++;
    const at=1760+Math.random()*260;                     // they climb IN THROUGH THE WINDOW
    const e=pushEnemy(kind, at, null, {face:(player.x<at?-1:1), hp:40});
    if(e) e.aggro=true;
    const ramp=Math.min(1, WAR.t/6000);
    WAR.spawnT=Math.round(95-55*ramp)+Math.random()*20;   // waves thicken as the madness deepens
  }
}
function drawWarLights(){
  if(!WAR.on || SECTIONS[sectionIndex].id!=='in_upstairs') return;
  const phase=Math.floor(WAR.sirenT/22)%2;                // red / blue strobes with the siren
  const pulse=0.10+0.06*Math.abs(Math.sin(WAR.sirenT*0.14));
  ctx.fillStyle=phase? 'rgba(255,40,40,'+pulse+')' : 'rgba(60,110,255,'+pulse+')';
  ctx.fillRect(0,0,VW,VH);
  const tleft=Math.max(0,WAR.dur-WAR.t);
  const mm=Math.floor(tleft/3600), ss=Math.floor((tleft%3600)/60);
  ctx.save(); ctx.textAlign='center'; ctx.font='bold 16px system-ui,sans-serif';
  ctx.fillStyle='rgba(0,0,0,0.55)'; ctx.fillText('WAR '+mm+':'+String(ss).padStart(2,'0'), VW/2+1, 47);
  ctx.fillStyle='#ff5f6d'; ctx.fillText('WAR '+mm+':'+String(ss).padStart(2,'0'), VW/2, 46);
  ctx.restore();
}
/* ── THE STASH ─────────────────────────────────────────────────────────────
   The upstairs gun cabinet. Reuses the #travel overlay. Options are defined here
   (add more rows to STASH_ITEMS); each has a one-off effect when tapped. */
const STASH_ITEMS=[
  {label:'N Bomb', tag:'x3', fx:()=>{ owned.add('nbomb'); STASH_AMMO.nbomb=3; addWeaponToLoadout('nbomb'); saveProgress(); flashBanner('N BOMB \u00D73 \u2014 in your hands'); blip(320,660,0.18,'triangle',0.2); }},
  {label:'Big Eye', tag:'x3', fx:()=>{ owned.add('bigeye'); STASH_AMMO.bigeye=3; addWeaponToLoadout('bigeye'); saveProgress(); flashBanner('BIG EYE \u00D73 \u2014 armed'); blip(320,660,0.18,'triangle',0.2); }},
  // add more here later, e.g. {label:'Body Armour', tag:'ARM', fx:()=>{...}},
];
/* The stash is a SUPPORTERS' PERK: it unlocks when the player uses the
   'Buy Me A Pint' Ko-fi door in the Winchester (honour system — a static
   site can't verify the purchase). Unlock persists in the save. */
let stashUnlocked=false;
/* Stash weapons are AMMO-LIMITED: 3 shots each, then back to the cabinet to restock. */
const STASH_AMMO={ nbomb:0, bigeye:0 };
function isStashWeapon(id){ return id in STASH_AMMO; }
function openStash(){
  if(!stashUnlocked){
    flashBanner('LOCKED \u2014 Buy Me A Pint at the Winchester bar to open the stash');
    blip(200,120,0.12,'square',0.14);
    return;
  }
  travelOpen=true;
  document.getElementById('travel-title').textContent='The Stash';
  const list=document.getElementById('travel-list'); list.innerHTML='';
  STASH_ITEMS.forEach(it=>{
    const b=document.createElement('button'); b.className='trow';
    const nm=document.createElement('span'); nm.className='tname'; nm.textContent=it.label;
    const tag=document.createElement('span'); tag.className='ttag'; tag.textContent=it.tag||'GET';
    b.appendChild(nm); b.appendChild(tag);
    b.onclick=(e)=>{ e.stopPropagation(); closeTravel(); try{ it.fx(); }catch(_){}; };
    list.appendChild(b);
  });
  document.getElementById('travel').classList.add('on');
}
/* ── PDF LIBRARY MENU ──────────────────────────────────────────────────────
   Reuses the same on-screen overlay as the travel menu (#travel), but lists
   PDF documents from the PDF_MENUS table (data.js) with a READ button (opens
   the PDF in a new tab / this tab on mobile) and a DOWNLOAD button (saves it).
   PDFs must be deployed next to index.html (same rule as every other asset).  */
function openPdfMenu(menuId){
  const m=(typeof PDF_MENUS!=='undefined') ? PDF_MENUS[menuId] : null; if(!m) return;
  travelOpen=true;
  document.getElementById('travel-title').textContent=m.title||'Library';
  const list=document.getElementById('travel-list'); list.innerHTML='';
  // Explicit BACK button at the top so there's always an obvious way out of the menu.
  const back=document.createElement('button'); back.className='trow'; back.style.cursor='pointer';
  back.style.background='#7a1f25'; back.style.justifyContent='center';
  const bl=document.createElement('span'); bl.className='tname'; bl.style.color='#fff';
  bl.textContent='\u2190  Back to game';
  back.appendChild(bl);
  back.onclick=(e)=>{ e.stopPropagation(); closeTravel(); };
  list.appendChild(back);
  (m.files||[]).forEach(doc=>{
    const row=document.createElement('button'); row.className='trow'; row.style.cursor='default';
    const nm=document.createElement('span'); nm.className='tname'; nm.textContent=doc.label;
    const box=document.createElement('span'); box.style.display='flex'; box.style.gap='8px';
    const read=document.createElement('span'); read.className='ttag'; read.textContent='READ';
    read.style.cursor='pointer';
    read.onclick=(e)=>{ e.stopPropagation(); try{ window.open(doc.file,'_blank','noopener'); }catch(_){}
                        setTimeout(()=>{ try{ location.href=doc.file; }catch(_){} },60); };
    const dl=document.createElement('span'); dl.className='ttag'; dl.textContent='DOWNLOAD';
    dl.style.cursor='pointer'; dl.style.background='#5aa0e0';
    dl.onclick=(e)=>{ e.stopPropagation(); const a=document.createElement('a');
                      a.href=doc.file; a.download=doc.file.split('/').pop(); document.body.appendChild(a); a.click(); a.remove(); };
    box.appendChild(read); box.appendChild(dl);
    row.appendChild(nm); row.appendChild(box);
    list.appendChild(row);
  });
  document.getElementById('travel').classList.add('on');
}
function travelTo(target, label){
  closeTravel();
  if(transitioning) return;
  const dest=SECTIONS.find(s=>s.id===target);
  const goId = dest ? target : 'empty';               // not built yet -> placeholder
  transitioning=true;
  doFade(dest?dest.name:label, ()=>{
    gotoId(goId,{x:90,face:1}); transitioning=false;
    if(!dest) flashBanner(label+' &mdash; coming soon');
  });
}
function renderShop(){
  const mm=document.getElementById('shopmoney'); if(mm) mm.textContent='\u00A3'+money;
  const list=document.getElementById('shoplist'); if(!list) return; list.innerHTML='';
  SHOP.forEach(w=>{
    const row=document.createElement('div'); row.className='shoprow';
    const th=document.createElement('canvas'); th.className='sthumb'; th.width=92; th.height=68;
    drawWeaponIcon(th.getContext('2d'), w.id, th.width, th.height);
    const nm=document.createElement('span'); nm.className='sname'; nm.textContent=w.name;
    const pr=document.createElement('span'); pr.className='sprice'; pr.textContent='\u00A3'+w.price;
    const btn=document.createElement('button');
    if(owned.has(w.id)){ btn.textContent='OWNED'; btn.disabled=true; btn.className='sbtn owned'; }
    else { btn.textContent='BUY'; btn.className='sbtn'; btn.onclick=()=>buyWeapon(w); }
    row.appendChild(th); row.appendChild(nm); row.appendChild(pr); row.appendChild(btn); list.appendChild(row);
  });
}
function buyWeapon(w){
  if(owned.has(w.id)) return;
  if(money>=w.price){
    money-=w.price; owned.add(w.id); updateMoneyHUD(); renderShop(); saveProgress();
    if(w.id==='vest'){ player.armour=ARMOUR_HITS; updateArmourHUD(); flashBanner('Armour on &mdash; '+ARMOUR_HITS+' hits'); }
    else { addWeaponToLoadout(w.id); flashBanner(w.name+' ready'); }
    [0,4,7,12].forEach((s,i)=>setTimeout(()=>blip(440*Math.pow(2,s/12),0,0.12,'triangle',0.15),i*60));
  }
  else { flashBanner('Not enough money for the '+w.name); blip(200,110,0.12,'square',0.16); }
}

const ARMOUR_HITS=5;
const WEAPON_ART={
  pistol:  {sx:144,  sy:143, sw:314, sh:185},
  shotgun: {sx:503,  sy:154, sw:491, sh:138},
  rifle:   {sx:1010, sy:148, sw:467, sh:201},
  vest:    {sx:190,  sy:544, sw:273, sh:281},
  grenade: {sx:856,  sy:653, sw:145, sh:128},
};
const WEAPON_ORDER=['pistol','rifle','weapon02','weapon01','littleblaster','weapon07','weapon05','weapon03','weapon06','weapon04','weapon08','bigblaster','nbomb','bigeye'];
let weaponList=[];
let weaponSel=-1;
let shootCool=0;
let bullets=[], vfx=[];

function isArmed(){ return weaponSel>=0 && weaponSel<weaponList.length; }
function curWeapon(){ return isArmed()? WEAPONS[weaponList[weaponSel]] : null; }

function addWeaponToLoadout(id){
  weaponList=WEAPON_ORDER.filter(x=>owned.has(x));
  weaponSel=weaponList.indexOf(id);
  refreshWeaponBtn();
}
function cycleWeapon(){
  if(weaponList.length===0) return;
  weaponSel++;
  if(weaponSel>=weaponList.length) weaponSel=-1;
  refreshWeaponBtn();
  blip(560,640,0.05,'square',0.10);
  const el=_proxEl('Nbomb.mp3');                          // N BOMB theme: start/stop right in the tap
  if(el){ if(weaponList[weaponSel]==='nbomb'){ el.volume=0.75; el.play().catch(()=>{}); }
          else if(!el.paused) el.pause(); }
}
function drawWeaponIcon(cx,id,W,H){
  cx.clearRect(0,0,W,H);
  // Any weapon that has its own loaded sprite (the blasters + weapon01..08) shows that art.
  if(imgOk(loaded[id])){
    const bi=loaded[id], pad=8, s=Math.min((W-pad*2)/bi.naturalWidth,(H-pad*2)/bi.naturalHeight);
    const dw=bi.naturalWidth*s, dh=bi.naturalHeight*s; cx.imageSmoothingEnabled=true;
    try{ cx.drawImage(bi,(W-dw)/2,(H-dh)/2,dw,dh); return; }catch(_){}
  }
  const a=WEAPON_ART[id], img=loaded.weapons;
  if(a && imgOk(img)){
    const pad=7, aw=W-pad*2, ah=H-pad*2, s=Math.min(aw/a.sw, ah/a.sh);
    const dw=a.sw*s, dh=a.sh*s;
    cx.imageSmoothingEnabled=true;
    try{ cx.drawImage(img,a.sx,a.sy,a.sw,a.sh,(W-dw)/2,(H-dh)/2,dw,dh); return; }catch(_){}
  }
  cx.fillStyle='#cdb35a'; cx.font='800 9px monospace'; cx.textAlign='center';
  cx.fillText((id||'').toUpperCase(), W/2, H/2+3);
}
function refreshWeaponBtn(){
  const btn=document.getElementById('weaponsel'); if(!btn) return;
  const cvs=document.getElementById('weaponicon'); const cx=cvs.getContext('2d');
  if(isArmed()){ btn.classList.remove('empty'); drawWeaponIcon(cx, weaponList[weaponSel], cvs.width, cvs.height);
    const wid=weaponList[weaponSel];
    if(isStashWeapon(wid)){                              // ammo pips on stash weapons
      cx.save(); cx.font='bold 13px system-ui,sans-serif'; cx.textAlign='right'; cx.textBaseline='bottom';
      cx.fillStyle='rgba(0,0,0,0.65)'; cx.fillText('\u00D7'+STASH_AMMO[wid], cvs.width-3, cvs.height-1);
      cx.fillStyle=STASH_AMMO[wid]>0?'#ffe98a':'#ff5f6d'; cx.fillText('\u00D7'+STASH_AMMO[wid], cvs.width-4, cvs.height-2);
      cx.restore(); }
  }
  else { btn.classList.add('empty'); cx.clearRect(0,0,cvs.width,cvs.height); }
  const strike=document.querySelector('.btn.punch'); if(strike) strike.textContent=isArmed()?'SHOOT':'STRIKE';
}
function updateArmourHUD(){ const el=document.getElementById('armour'); if(el) el.textContent = player.armour>0 ? ('ARMOUR \u00D7'+player.armour) : ''; }

function muzzlePoint(){
  const mz=(cur&&cur.muzzle)||{fwd:0.55,yfac:0.46};
  // Offsets scale with the room's character scale (CSCALE) so the muzzle tracks the
  // BIGGER sprite in zoomed rooms (pub/underpass). At CSCALE=1 this equals the old
  // formula exactly, so normal rooms are unchanged. Fixes bullets firing too low.
  return { x: player.x+PW/2 + player.face*(PW*mz.fwd*CSCALE+6),
           y: (player.y+PH) - PH*(1-mz.yfac)*CSCALE };
}
const HELD_WEAPON={
  pistol:  {fwd:0.24, up:-0.14, scale:0.50},
  shotgun: {fwd:0.16, up:-0.12, scale:1.00},
  rifle:   {fwd:0.12, up:-0.12, scale:1.12},
};
function drawHeldWeapon(){
  if(player.dead || !isArmed()) return;
  const id=weaponList[weaponSel];
  if(id==='nbomb' && imgOk(loaded.nbomb)){                 // the N BOMB is handheld: shown even on fighters
    const bi=loaded.nbomb;                                 // whose guns are baked into the sprite art
    const dw=PW*ZOOM*CSCALE, dh=PH*ZOOM*CSCALE;
    const pcx=(player.x+PW/2-camX)*ZOOM;
    const midY=(player.y+PH-SRCY)*ZOOM-dh*0.5;
    const bh=dh*0.42, bw=bh*bi.naturalWidth/bi.naturalHeight;
    const bx=pcx + player.face*dw*0.30, by=midY + dh*0.02 + Math.sin(performance.now()/300)*2;
    ctx.save(); ctx.translate(bx,by); if(player.face<0) ctx.scale(-1,1);
    try{ ctx.drawImage(bi,-bw/2,-bh/2,bw,bh); }catch(_){}
    ctx.restore();
    return;
  }
  if(cur && cur.noWeaponArt) return;
  if(id==='grenade') return;
  const cfg=HELD_WEAPON[id], art=WEAPON_ART[id], img=loaded.weapons;
  if(!cfg||!art||!imgOk(img)) return;
  const dw=PW*ZOOM*CSCALE, dh=PH*ZOOM*CSCALE;
  const pcx=(player.x+PW/2-camX)*ZOOM;
  const midY=(player.y+PH-SRCY)*ZOOM-dh*0.5;
  const ww=dw*cfg.scale, wh=ww*art.sh/art.sw;
  const handX=pcx + player.face*dw*cfg.fwd;
  const handY=midY - dh*cfg.up;
  ctx.save();
  ctx.translate(handX,handY);
  if(player.face<0) ctx.scale(-1,1);
  ctx.drawImage(img, art.sx,art.sy,art.sw,art.sh, -ww*0.30, -wh*0.5, ww, wh);
  ctx.restore();
}
function hitEnemy(e,dmg,knock,dir){
  if(e.state!=='walk') return;
  e.hp-=dmg; e.x += dir*(knock||8);
  if(e.hp<=0) killEnemy(e,true); else sfxHit();
}
function fireWeapon(w){
  const m=muzzlePoint();
  vfx.push({type:'muzzle', x:m.x, y:m.y, face:player.face, t:0, life:7});
  for(let i=0;i<3;i++) vfx.push({type:'spark', x:m.x+player.face*(4+Math.random()*9), y:m.y+(Math.random()*7-3.5), t:0, life:6});
  if(w.type==='grenade'){
    sfxThrow();
    bullets.push({grenade:true, x:m.x, y:m.y-4, vx:player.face*w.speed, vy:-7.5, fuse:60, dmg:w.dmg, radius:w.radius, knock:w.knock, sprite:w.sprite, nuke:w.nuke, spin:0});
    return;
  }
  sfxShot();
  if(w.shake) addShake(8,11);
  for(let i=0;i<w.pellets;i++){
    const spread=(Math.random()*2-1)*w.spread;
    bullets.push({ x:m.x, y:m.y, vx:player.face*w.speed*Math.cos(spread), vy:w.speed*Math.sin(spread),
                   dmg:w.dmg, knock:w.knock, range:w.range, traveled:0, sprite:w.sprite, spriteH:w.spriteH,
                   hitfx:w.hitfx });   // only weapons with an explicit hitfx get the fire/electric burst
  }
}
function tryFire(){
  const w=curWeapon(); if(!w) return;
  if(shootCool>0) return;
  const wid=weaponList[weaponSel];
  if(isStashWeapon(wid)){
    if(STASH_AMMO[wid]<=0){ flashBanner((w.name||'Weapon').toUpperCase()+' EMPTY \u2014 restock at the stash'); blip(180,110,0.1,'square',0.14); shootCool=20; return; }
    STASH_AMMO[wid]--; saveProgress(); refreshWeaponBtn();
  }
  fireWeapon(w); shootCool=w.cooldown;
  if(w.clearAll) blastClearAll();
  if(CLIPS.shoot){ if(player.clip!=='shoot') setClip('shoot'); player.shootPoseT=14; }
}
function blastClearAll(){            // Big Blaster: one shot wipes every enemy on the level
  addShake(16,20);
  let n=0;
  for(const e of enemies){
    if(e.state!=='walk') continue;
    const dir=(e.x+e.w/2)>=(player.x+PW/2)?1:-1;
    spawnBlood(e.x+e.w/2, e.y+e.h*0.5, dir);
    killEnemy(e,true);   // awards money + arena score per enemy, same as a normal kill
    n++;
  }
  if(n) flashBanner('ENOUGH IS ENOUGH');
}
function explodeGrenade(b){
  vfx.push({type:'boom', x:b.x, y:b.y, t:0, life:26, r:b.radius});
  if(b.nuke){ vfx.push({type:'nboom', x:b.x, y:b.y-14, t:0, life:34, r:b.radius});   // N BOMB: the big art + ground-shaking blast
    addShake(15,30); noiseBurst(0.5,0.34,90); noiseBurst(0.3,0.3,60); blip(70,24,0.5,'sawtooth',0.3); }
  sfxKO();
  addShake(9,12);
  for(const e of enemies){
    if(e.state!=='walk') continue;
    const ex=e.x+e.w/2, ey=e.y+e.h*0.5;
    if(Math.hypot(b.x-ex,b.y-ey) < b.radius){ hitEnemy(e, b.dmg, b.knock, ex>=b.x?1:-1); spawnBlood(ex, ey, ex>=b.x?1:-1); }
  }
}
function updateBullets(){
  for(const b of bullets){
    if(b.dead) continue;
    if(b.grenade){
      b.vy+=0.5; b.x+=b.vx; b.y+=b.vy; b.fuse--;
      const gy=groundAt(b.x);
      if(b.y>=gy){ b.y=gy; explodeGrenade(b); b.dead=true; continue; }
      if(b.fuse<=0){ explodeGrenade(b); b.dead=true; continue; }
      for(const e of enemies){ if(e.state!=='walk') continue; const ex=e.x+e.w/2, ey=e.y+e.h*0.5;
        if(Math.abs(b.x-ex)<e.w*0.6 && Math.abs(b.y-ey)<e.h*0.6){ explodeGrenade(b); b.dead=true; break; } }
      continue;
    }
    b.x+=b.vx; b.y+=b.vy; b.traveled+=Math.hypot(b.vx,b.vy);
    if(b.traveled>b.range || b.x<-20 || b.x>BGW+20){ b.dead=true; continue; }
    for(const e of enemies){
      if(e.state!=='walk') continue;
      const ex=e.x+e.w/2, ey=e.y+e.h*0.46;
      if(Math.abs(b.x-ex) < e.w*0.5+5 && Math.abs(b.y-ey) < e.h*0.5){
        hitEnemy(e, b.dmg, b.knock, b.vx>=0?1:-1);
        vfx.push({type:'spark', x:b.x, y:b.y, t:0, life:8});
        spawnBlood(b.x, b.y, b.vx>=0?1:-1);          // blood stays for every weapon
        if(b.hitfx){                                 // only weapons with a hitfx add the extra burst
          spawnHitFx(b.x, b.y, b.hitfx);
          if(b.hitfx==='electric') e.shockT=Math.max(e.shockT||0,16);  // crackles over them a moment
          else e.burnT=Math.max(e.burnT||0,22);                         // flames lick up off them
        }
        b.dead=true; break;
      }
    }
  }
  bullets=bullets.filter(b=>!b.dead);
}
function spawnHitFx(x,y,kind){
  if(kind==='electric'){
    vfx.push({type:'electric', x, y, t:0, life:12});
    for(let i=0;i<4;i++) vfx.push({type:'spark', x:x+(Math.random()*10-5), y:y+(Math.random()*10-5), t:0, life:7});
  } else { // fire
    for(let i=0;i<7;i++) vfx.push({type:'fire', x:x+(Math.random()*10-5), y:y+(Math.random()*8-4),
      vx:(Math.random()-0.5)*1.4, vy:-1.0-Math.random()*2.0, t:0, life:16+Math.floor(Math.random()*12)});
  }
}
function updateVfx(){
  for(const f of vfx){ f.t++;
    if(f.type==='fire'){ f.x+=f.vx||0; f.y+=f.vy||0; f.vy=(f.vy||0)+0.04; }
    else if(f.type==='bubble'){ f.x+=(f.vx||0)+Math.sin(f.t*0.2)*0.2; f.y+=f.vy||0; f.vy=(f.vy||0)*0.99; }
  }
  vfx=vfx.filter(f=>f.t<f.life);
}
function drawBullets(){
  for(const b of bullets){
    const sx=(b.x-camX)*ZOOM, sy=(b.y-SRCY)*ZOOM;
    if(sx<-30||sx>VW+30) continue;
    if(b.grenade){
      if(b.sprite && imgOk(loaded[b.sprite])){                 // N BOMB: the letter itself tumbles through the air
        const bi=loaded[b.sprite]; b.spin=(b.spin||0)+0.14;
        const bh=34*ZOOM, bw=bh*bi.naturalWidth/bi.naturalHeight;
        ctx.save(); ctx.translate(sx,sy); ctx.rotate(b.spin*(b.vx<0?-1:1));
        try{ ctx.drawImage(bi,-bw/2,-bh/2,bw,bh); }catch(_){}
        ctx.restore();
      } else {
        ctx.save(); ctx.fillStyle='#3f5a2a'; ctx.strokeStyle='#1a240f'; ctx.lineWidth=2;
        ctx.beginPath(); ctx.arc(sx,sy,6,0,7); ctx.fill(); ctx.stroke(); ctx.restore();
      }
    } else if(b.sprite && imgOk(loaded[b.sprite])){
      const bi=loaded[b.sprite]; const bh=(b.spriteH||30)*ZOOM, bw=bh*bi.naturalWidth/bi.naturalHeight;
      ctx.save(); ctx.translate(sx,sy); if(b.vx<0) ctx.scale(-1,1);
      ctx.shadowColor='rgba(90,190,255,0.85)'; ctx.shadowBlur=12;
      try{ ctx.drawImage(bi,-bw*0.5,-bh*0.5,bw,bh); }catch(_){}
      ctx.restore();
    } else {
      ctx.save(); ctx.strokeStyle='#ffd24a'; ctx.lineWidth=3; ctx.lineCap='round';
      ctx.shadowColor='#ffae00'; ctx.shadowBlur=6;
      ctx.beginPath(); ctx.moveTo(sx,sy); ctx.lineTo(sx-b.vx*ZOOM*0.9, sy-b.vy*ZOOM*0.9); ctx.stroke();
      ctx.restore();
    }
  }
}
function drawVfx(){
  for(const f of vfx){
    const sx=(f.x-camX)*ZOOM, sy=(f.y-SRCY)*ZOOM, p=f.t/f.life;
    if(f.type==='muzzle'){
      ctx.save(); ctx.globalAlpha=1-p; ctx.translate(sx,sy);
      const len=(14+Math.random()*6)*ZOOM*(1-p*0.4);
      const grd=ctx.createLinearGradient(0,0,(f.face||1)*len,0);
      grd.addColorStop(0,'#fff'); grd.addColorStop(0.4,'#ffd24a'); grd.addColorStop(1,'rgba(255,90,0,0)');
      ctx.fillStyle=grd; ctx.beginPath();
      ctx.moveTo(0,-6*ZOOM); ctx.lineTo((f.face||1)*len,0); ctx.lineTo(0,6*ZOOM); ctx.closePath(); ctx.fill();
      ctx.restore();
    } else if(f.type==='spark'){
      ctx.save(); ctx.globalAlpha=1-p; ctx.fillStyle='#ffd24a';
      ctx.beginPath(); ctx.arc(sx,sy,3*ZOOM*(1-p),0,7); ctx.fill(); ctx.restore();
    } else if(f.type==='nboom'){
      const bi=loaded.nboom;
      if(imgOk(bi)){ const g=0.55+p*1.15, bh=f.r*2.2*g, bw=bh*bi.naturalWidth/bi.naturalHeight;
        ctx.save(); ctx.globalAlpha=Math.min(1,(1-p)*1.6);
        try{ ctx.drawImage(bi, sx-bw/2, sy-bh/2, bw, bh); }catch(_){}
        ctx.restore(); }
    } else if(f.type==='boom'){
      ctx.save();
      const rr=(f.r||80)*ZOOM*Math.min(1,p*1.6);
      const grd=ctx.createRadialGradient(sx,sy,2,sx,sy,rr);
      grd.addColorStop(0,'rgba(255,240,180,'+(1-p)+')');
      grd.addColorStop(0.5,'rgba(255,140,20,'+(0.8-p*0.8)+')');
      grd.addColorStop(1,'rgba(120,30,0,0)');
      ctx.fillStyle=grd; ctx.beginPath(); ctx.arc(sx,sy,rr,0,7); ctx.fill(); ctx.restore();
    } else if(f.type==='fire'){
      const r=(7*ZOOM)*(1-p*0.55);
      ctx.save(); ctx.globalCompositeOperation='lighter';
      const g=ctx.createRadialGradient(sx,sy,0,sx,sy,Math.max(1,r));
      g.addColorStop(0,'rgba(255,246,205,'+(0.9*(1-p))+')');
      g.addColorStop(0.45,'rgba(255,150,30,'+(0.75*(1-p))+')');
      g.addColorStop(1,'rgba(190,40,0,0)');
      ctx.fillStyle=g; ctx.beginPath(); ctx.arc(sx,sy,Math.max(1,r),0,7); ctx.fill(); ctx.restore();
    } else if(f.type==='bubble'){
      ctx.save(); ctx.globalAlpha=0.55*(1-p);
      const r=Math.max(1,(f.r||2)*ZOOM);
      ctx.fillStyle='rgba(160,215,255,0.30)'; ctx.strokeStyle='rgba(210,238,255,0.85)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.arc(sx,sy,r,0,7); ctx.fill(); ctx.stroke();
      ctx.restore();
    } else if(f.type==='electric'){
      ctx.save(); ctx.globalCompositeOperation='lighter';
      ctx.strokeStyle='rgba(150,230,255,'+(1-p)+')'; ctx.shadowColor='#7fe8ff'; ctx.shadowBlur=8; ctx.lineWidth=2;
      for(let b=0;b<3;b++){
        let ang=Math.random()*Math.PI*2, len=(14+Math.random()*16)*ZOOM, x=sx, y=sy;
        ctx.beginPath(); ctx.moveTo(x,y);
        for(let s=0;s<4;s++){ x+=Math.cos(ang)*len/4+(Math.random()*8-4); y+=Math.sin(ang)*len/4+(Math.random()*8-4); ctx.lineTo(x,y); }
        ctx.stroke();
      }
      ctx.restore();
    }
  }
}

/* ── RAVE FX (Drum & Bass room): drifting coloured haze, a sweeping laser fan and the
   odd strobe flash, all time-driven so the room feels alive. Screen-space overlay. ── */
function raveRoom(){ const id=SECTIONS[sectionIndex].id; return (id==='in_dnb')?'dnb':(id==='in_hiphop')?'hiphop':null; }
function raveActive(){ return raveRoom()!==null; }
function drawRaveSmoke(){
  const rm=raveRoom(); if(!rm) return;
  const red = (rm==='hiphop');
  const t=performance.now()/1000;
  ctx.save(); ctx.globalCompositeOperation='lighter';
  for(let i=0;i<5;i++){
    const px=(Math.sin(t*0.15+i*1.7)*0.5+0.5)*VW;
    const py=VH*(0.42+0.18*Math.sin(t*0.2+i));
    const r=110+60*Math.sin(t*0.3+i*2);
    const hue=red ? (350+i*4+6*Math.sin(t*0.3+i))%360 : (t*30+i*60)%360;   // hip-hop = reds, DnB = full spectrum
    const g=ctx.createRadialGradient(px,py,0,px,py,Math.max(1,r));
    g.addColorStop(0,'hsla('+hue+',85%,'+(red?52:60)+'%,0.06)');
    g.addColorStop(1,'hsla('+hue+',85%,55%,0)');
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(px,py,Math.max(1,r),0,7); ctx.fill();
  }
  ctx.restore();
}
function drawRaveLights(){
  const rm=raveRoom(); if(!rm) return;
  const red = (rm==='hiphop');
  const t=performance.now()/1000;
  ctx.save(); ctx.globalCompositeOperation='lighter';
  const emitters=[{x:VW*0.25,y:-8},{x:VW*0.75,y:-8}];
  for(let e=0;e<emitters.length;e++){
    const em=emitters[e];
    for(let b=0;b<5;b++){
      const ang=Math.PI/2 + Math.sin(t*0.8+b*0.6+e*1.3)*0.7;   // sweep around straight-down
      const len=VH*1.25, x2=em.x+Math.cos(ang)*len, y2=em.y+Math.sin(ang)*len;
      const hue=red ? (352+b*4+e*5)%360 : (t*60+b*40+e*120)%360;   // hip-hop = red beams
      const g=ctx.createLinearGradient(em.x,em.y,x2,y2);
      g.addColorStop(0,'hsla('+hue+',100%,65%,0)');
      g.addColorStop(0.15,'hsla('+hue+',100%,'+(red?58:65)+'%,0.32)');
      g.addColorStop(1,'hsla('+hue+',100%,60%,0)');
      ctx.strokeStyle=g; ctx.lineWidth=3+2*Math.sin(t*2+b);
      ctx.beginPath(); ctx.moveTo(em.x,em.y); ctx.lineTo(x2,y2); ctx.stroke();
    }
  }
  if(Math.sin(t*9)>0.93){ ctx.globalCompositeOperation='source-over'; ctx.fillStyle=red?'rgba(255,60,60,0.13)':'rgba(255,255,255,0.12)'; ctx.fillRect(0,0,VW,VH); }
  ctx.restore();
}

let blood=[];
function spawnBlood(x,y,dir){
  dir = dir>=0 ? 1 : -1;
  const n=12+Math.floor(Math.random()*8);
  for(let i=0;i<n;i++){
    const spread=(Math.random()*2-1)*0.85;
    const sp=1.2+Math.random()*4.4;
    blood.push({ x, y,
      vx: dir*Math.cos(spread)*sp*(0.6+Math.random()*0.7),
      vy: Math.sin(spread)*sp - (0.4+Math.random()*1.6),
      t:0, life:26+Math.floor(Math.random()*22),
      r:1.3+Math.random()*2.6,
      col: Math.random()<0.5 ? '#b3060f' : '#7c0a0a' });
  }
}
function updateBlood(){
  for(const p of blood){ p.t++; p.vy+=0.45; p.x+=p.vx; p.y+=p.vy; p.vx*=0.99; }
  blood=blood.filter(p=>p.t<p.life);
}
function drawBlood(){
  for(const p of blood){
    const sx=(p.x-camX)*ZOOM, sy=(p.y-SRCY)*ZOOM;
    if(sx<-20||sx>VW+20||sy<-20||sy>VH+20) continue;
    const a=Math.max(0,1-p.t/p.life);
    ctx.save(); ctx.globalAlpha=a; ctx.fillStyle=p.col;
    ctx.beginPath(); ctx.arc(sx,sy,p.r*ZOOM*(0.6+a*0.6),0,7); ctx.fill(); ctx.restore();
  }
}

let shakeT=0, shakeMag=0, shakeDur=1;
function addShake(mag,frames){
  if(shakeT<=0){ shakeMag=0; shakeDur=1; }
  shakeT=Math.max(shakeT,frames);
  shakeDur=Math.max(shakeDur,frames);
  shakeMag=Math.max(shakeMag,mag);
}

/* ── CUTSCENE (unchanged intro chat) ─────────────────────── */
const DIALOGUE=[
  {side:'left', label:'YOU',          text:'Who are you?'},
  {side:'right',label:'PHOTOGRAPHER', text:'A YouTuber.'},
  {side:'left', label:'YOU',          text:'F#*k off before I smash your camera.'},
  {side:'right',label:'PHOTOGRAPHER', text:"Don't worry, I won't get anybody's faces."},
  {side:'left', label:'YOU',          text:"Okay, f#*k it, the people need to see this, but remember, NO FACES!!."},
];
let csActive=false,csDone=false,csStep=0,csTimeout=null;
function startCutscene(){ csActive=true; csStep=0; document.getElementById('cutscene').classList.add('active'); document.getElementById('cs-lines').innerHTML=''; showNextLine(); }
function showNextLine(){
  if(csStep>=DIALOGUE.length){endCutscene();return;}
  const d=DIALOGUE[csStep++]; const lines=document.getElementById('cs-lines');
  const lbl=document.createElement('div'); lbl.className='bubble-label'+(d.side==='right'?' right-label':''); lbl.textContent=d.label;
  const b=document.createElement('div'); b.className='bubble '+d.side; b.textContent=d.text;
  b.style.cssText='opacity:0;transform:translateY(6px);transition:all .25s'; lbl.style.cssText='opacity:0;transition:opacity .2s';
  lines.appendChild(lbl); lines.appendChild(b);
  while(lines.children.length>4){ lines.removeChild(lines.firstChild); }
  requestAnimationFrame(()=>requestAnimationFrame(()=>{b.style.opacity='1';b.style.transform='translateY(0)';lbl.style.opacity='1';}));
  csTimeout=setTimeout(showNextLine,2200);
}
function endCutscene(){ csActive=false; csDone=true; document.getElementById('cutscene').classList.remove('active'); }
document.getElementById('cutscene').addEventListener('click',()=>{ if(!csActive)return; clearTimeout(csTimeout); if(csStep<DIALOGUE.length) showNextLine(); else endCutscene(); });

/* ── BIKINI DANCER (bikinigirl.png, 14 frames: walk 0-5, dance 6-13, fw:129 fh:179)
   Stay in the Winchester for FIVE FULL MINUTES and she dances her way in — and
   from then on she lives in the pub: follows the player around INSIDE the
   Winchester (walks behind you, dances when you stand still), never leaves, and
   is right there waiting every time you come back. */
const BKW=129,BKH=179,BIKH=82,BIKW=Math.round(BIKH*BKW/BKH);
const bik={active:false, met:false, x:0, state:'walkin', anim:0, winT:0, sayT:0, sayCool:0};
const BIK_LINE="Buy me a drink and I'll get my baps out";
function initBikini(){
  bik.met=true; bik.active=true; bik.state='walkin'; bik.anim=0;
  bik.x=Math.min(BGW-BIKW-10, camX+SRCW+60);
  bik.sayT=300; bik.sayCool=1500;
  flashBanner("You've pulled!");
  blip(523,1046,0.18,'triangle',0.18); blip(659,1318,0.22,'triangle',0.14);
}
function updateBikini(){
  const sec=SECTIONS[sectionIndex];
  if(!bik.met){
    if(sec.id==='in_winchester' && !csActive){ bik.winT++; if(bik.winT>=5400) initBikini(); }   // 1 min 30
    else bik.winT=0;
    return;
  }
  if(!bik.active) return;
  if(sec.id!=='in_winchester') return;                   // she never leaves the pub
  if(bik.sayT>0) bik.sayT--;
  if(bik.sayCool>0) bik.sayCool--;
  else if(Math.abs(player.x-bik.x)<230){ bik.sayT=300; bik.sayCool=1700; }   // pipes up when you're close
  if(bik.state==='walkin'){
    bik.anim+=0.13;
    const tgt=player.x+110;
    if(bik.x>tgt+16){ bik.x-=1.5; }
    else bik.state='trail';
  } else {
    const targetX=player.x-104;                          // her spot (photographer keeps -130)
    const gap=bik.x-targetX;
    if(gap>30){ bik.x-=2.0; bik.anim+=0.16; bik.state='trail'; }
    else if(gap<-20){ bik.x+=2.4; bik.anim+=0.16; bik.state='trail'; }
    else { bik.state='trailIdle'; bik.anim+=0.115; }     // on the spot: DANCE
  }
  bik.x=Math.max(0,Math.min(BGW-BIKW,bik.x));
}
function drawBikini(){
  if(!bik.active||!imgOk(loaded.bikinigirl))return;
  if(SECTIONS[sectionIndex].id!=='in_winchester')return;
  const dw=BIKW*ZOOM*CSCALE, dh=BIKH*ZOOM*CSCALE;
  const wy=groundAt(bik.x+BIKW/2)-BIKH;
  const sx=(bik.x-camX)*ZOOM-(dw-BIKW*ZOOM)/2, sy=(wy+BIKH-SRCY)*ZOOM-dh;
  if(sx<-dw*2||sx>VW+dw*2)return;
  const dancing=(bik.state==='trailIdle'||bik.state==='walkin');
  let f;
  if(dancing) f=6+Math.floor(bik.anim)%8;                // dance 6-13
  else f=Math.floor(bik.anim)%6;                         // walk 0-5
  const facingLeft = dancing ? false : (bik.x>player.x);
  ctx.save();
  if(facingLeft){ ctx.translate(sx+dw,sy); ctx.scale(-1,1); } else { ctx.translate(sx,sy); }
  try{ ctx.drawImage(loaded.bikinigirl, f*BKW,0,BKW,BKH, 0,0,dw,dh); }catch(_){}
  ctx.restore();
  if(bik.sayT>0){                                        // speech bubble
    const alpha=Math.min(1,bik.sayT/40);
    ctx.save(); ctx.globalAlpha=alpha;
    ctx.font='bold 13px system-ui,sans-serif';
    const tw=ctx.measureText(BIK_LINE).width;
    let bx=sx+dw/2, by=sy-14;
    bx=Math.max(tw/2+10,Math.min(VW-tw/2-10,bx));
    ctx.fillStyle='rgba(255,255,255,0.94)'; ctx.strokeStyle='rgba(20,24,30,0.85)'; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.roundRect(bx-tw/2-9,by-21,tw+18,26,9); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bx-5,by+5); ctx.lineTo(bx+7,by+5); ctx.lineTo(sx+dw/2,by+14); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#14181d'; ctx.textAlign='center'; ctx.fillText(BIK_LINE,bx,by-3); ctx.textAlign='left';
    ctx.restore();
  }
}
/* ── THE DOG (dog.png, 10 frames: run 0-4, jump-up 5-7, lie 8, asleep 9; fw:145 fh:150)
   Lives in MY HOUSE and follows the player between downstairs and upstairs. Runs
   after you; when he catches you he jumps up at you a few times; if you then stand
   still he settles down and lies next to you (nodding off if you stay put). Move
   off and he springs up and follows again. */
const DGW=145,DGH=150,DOGH=44,DOGW=Math.round(DOGH*DGW/DGH);
const dog={ x:1500, anim:0, st:'trail', jumps:0, restT:0, face:1 };
function dogHere(){ const id=SECTIONS[sectionIndex].id; return id==='in_house'||id==='in_upstairs'; }
function updateDog(){
  if(!dogHere()||csActive) return;
  dog.anim+=1;
  const px=player.x+PW/2, dx=px-(dog.x+DOGW/2);
  const moving=Math.abs(player.vx||0)>0.4 || keys.left || keys.right;
  if(dog.st==='trail'){
    if(Math.abs(dx)>70){ dog.face=dx>0?1:-1; dog.x+=dog.face*2.6; dog.jumps=0; }
    else { dog.st='jump'; dog.anim=0; }
  } else if(dog.st==='jump'){
    if(Math.abs(dx)>120){ dog.st='trail'; }
    else if(dog.anim>26){ dog.anim=0; dog.jumps++;
      blip(880,1400,0.06,'square',0.06);                 // excited yip
      if(dog.jumps>=3 && !moving){ dog.st='settle'; dog.restT=0; dog.anim=0; }
    }
    dog.face=dx>0?1:-1;
  } else {                                               // settle: lying beside you
    dog.restT++;
    if(moving || Math.abs(dx)>170){ dog.st='trail'; }
  }
  dog.x=Math.max(10,Math.min(BGW-DOGW-10,dog.x));
}
function drawDog(){
  if(!dogHere()||!imgOk(loaded.housedog)) return;
  const dw=DOGW*ZOOM*CSCALE, dh=DGH*(DOGW*ZOOM*CSCALE/DGW);
  const wy=groundAt(dog.x+DOGW/2)-DOGH;
  let f, hop=0;
  if(dog.st==='trail') f=Math.floor(dog.anim*0.18)%5;
  else if(dog.st==='jump'){ const k=(dog.anim%26)/26; f=5+Math.min(2,Math.floor(k*3)); hop=Math.sin(k*Math.PI)*16; }
  else f=(dog.restT>240)?9:8;
  const sx=(dog.x-camX)*ZOOM-(dw-DOGW*ZOOM)/2, sy=(wy+DOGH-SRCY)*ZOOM-dh-hop*ZOOM;
  if(sx<-dw*2||sx>VW+dw*2) return;
  ctx.save();
  if(dog.face<0){ ctx.translate(sx+dw,sy); ctx.scale(-1,1); } else { ctx.translate(sx,sy); }
  try{ ctx.drawImage(loaded.housedog, f*DGW,0,DGW,DGH, 0,0,dw,dh); }catch(_){}
  ctx.restore();
}
/* ── NPC photographer (unchanged) ────────────────────────── */
const NPCH=78,NPCW=Math.round(NPCH*PFW/PFH);
const npc={x:0,y:0,state:'walkin',t:0,anim:0,active:false};
function initNPC(){ npc.x=player.x+SRCW+80; npc.state='walkin'; npc.t=0; npc.anim=0; npc.active=true; csDone=false; npc.y=groundAt(npc.x+NPCW/2)-NPCH; }
function updateNPC(){
  if(!npc.active)return;
  if(csActive){npc.state='idle';npc.y=groundAt(npc.x+NPCW/2)-NPCH;return;}
  if(npc.state==='walkin'){ npc.x-=1.4; npc.anim+=0.17; if(!csDone&&Math.abs(player.x-npc.x)<260){npc.state='idle';startCutscene();} }
  else if(npc.state==='idle'){ npc.t=0; if(player.x > npc.x + 20) npc.state='trail'; }
  else{ const targetX=player.x-130; const gap=npc.x-targetX;
    if(gap>30){npc.x-=1.8;npc.anim+=0.16;npc.state='trail';}
    else if(gap<-20){npc.x+=2.3;npc.anim+=0.16;npc.state='trail';}
    else npc.state=playerActioning()?'photo':'trailIdle';
    if(playerActioning()&&npc.state==='photo'){npc.t++;if(npc.t>40)npc.t=0;} else if(npc.state!=='photo')npc.t=0; }
  npc.x=Math.max(0,Math.min(BGW-NPCW,npc.x)); npc.y=groundAt(npc.x+NPCW/2)-NPCH;
}
function npcFrame(){ if(npc.state==='walkin'||npc.state==='walk'||npc.state==='trail') return Math.floor(npc.anim)%6;
  if(npc.state==='photo'){ const p=npc.t/40; return p<0.3?6:p<0.6?7:8; } return 9; }
function drawNPC(){
  if(!npc.active||!imgOk(loaded.photog))return;
  const dw=NPCW*ZOOM*CSCALE,dh=NPCH*ZOOM*CSCALE;
  const sx=(npc.x-camX)*ZOOM-(dw-NPCW*ZOOM)/2,sy=(npc.y+NPCH-SRCY)*ZOOM-dh;
  if(sx<-NPCW*ZOOM*2||sx>VW+NPCW*ZOOM)return;
  if(npc.state==='photo'&&npc.t>12&&npc.t<22){ ctx.save();ctx.globalAlpha=0.5*(1-Math.abs(npc.t-17)/5);ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(sx+(npc.x>player.x?dw*0.08:dw*0.92),sy+dh*0.3,18,0,7);ctx.fill();ctx.restore(); }
  const facingLeft=npc.x>player.x; ctx.save();
  if(facingLeft){ctx.translate(sx+dw,sy);ctx.scale(-1,1);}else{ctx.translate(sx,sy);}
  try{ ctx.drawImage(loaded.photog,npcFrame()*PFW,0,PFW,PFH,0,0,dw,dh); }catch(e){} ctx.restore();
}

/* ── INPUT ───────────────────────────────────────────────── */
addEventListener('keydown',e=>{
  if(e.key==='ArrowLeft'||e.key==='a')keys.left=true;
  if(e.key==='ArrowRight'||e.key==='d')keys.right=true;
  if((e.key===' '||e.key==='ArrowUp'||e.key==='w')&&!csActive){keys.jump=true;e.preventDefault();}
  if((e.key==='x'||e.key==='f')&&!punchDown){punchDown=true;punchEdge=true;}
  if((e.key==='e'||e.key==='E')&&cur&&!csActive){ summonHelper(0); }
  if((e.key==='r'||e.key==='R')&&cur&&!csActive){ summonHelper(1); }
  if((e.key==='t'||e.key==='T')&&cur&&!csActive){ summonHelper(2); }
  if((e.key==='q'||e.key==='Q')&&cur&&!csActive){ cycleWeapon(); }
  if(e.key==='Escape'&&csActive){clearTimeout(csTimeout);endCutscene();}
  if((e.key==='p'||e.key==='P')&&cur&&!csActive)setPaused(!paused);
});
addEventListener('keyup',e=>{
  if(e.key==='ArrowLeft'||e.key==='a')keys.left=false;
  if(e.key==='ArrowRight'||e.key==='d')keys.right=false;
  if(e.key===' '||e.key==='ArrowUp'||e.key==='w')keys.jump=false;
  if(e.key==='x'||e.key==='f')punchDown=false;
});
document.querySelectorAll('.btn').forEach(b=>{
  const k=b.dataset.k;
  const on=e=>{e.preventDefault();actx();if(k==='punch'){if(!punchDown){punchDown=true;punchEdge=true;}}else keys[k]=true;};
  const off=e=>{e.preventDefault();if(k==='punch')punchDown=false;else keys[k]=false;};
  b.addEventListener('touchstart',on,{passive:false});b.addEventListener('touchend',off,{passive:false});
  b.addEventListener('touchcancel',off,{passive:false});
  b.addEventListener('mousedown',on);b.addEventListener('mouseup',off);b.addEventListener('mouseleave',off);
});
/* ── VIRTUAL JOYSTICK ────────────────────────────────────────────────────────
   Replaces the ◀ ▶ direction buttons everywhere. Drag the knob: in the game it
   walks left/right (push UP past 60% to jump too); on The Sea it steers the
   reticle in full 2D. JUMP / STRIKE buttons are unchanged. Built entirely from
   JS so index.html needs no edits: the old ◀ ▶ buttons are hidden and the stick
   is dropped into their place (or bottom-left if they aren't found). */
const JOY={x:0,y:0,active:false};
(function(){
  const st=document.createElement('style');
  st.textContent=`
    #joy{position:relative;width:112px;height:112px;border-radius:50%;touch-action:none;
      background:transparent;
      border:3px solid #6b7178;box-shadow:0 3px 14px #0006;
      pointer-events:auto;flex:0 0 auto;}
    #joyknob{position:absolute;left:50%;top:50%;width:52px;height:52px;border-radius:50%;
      transform:translate(-50%,-50%);
      background:radial-gradient(circle at 38% 32%, #4a525c, #14181d 70%);
      border:2px solid #aeb6bf;box-shadow:0 4px 10px #000b;}
  `;
  document.head.appendChild(st);
  const base=document.createElement('div'); base.id='joy';
  const knob=document.createElement('div'); knob.id='joyknob'; base.appendChild(knob);
  const lb=document.querySelector('[data-k="left"]'), rb=document.querySelector('[data-k="right"]');
  if(lb&&lb.parentElement){ lb.style.display='none'; if(rb) rb.style.display='none';
    lb.parentElement.insertBefore(base, lb); }
  else { base.style.position='fixed'; base.style.left='16px'; base.style.bottom='16px'; base.style.zIndex=40;
    document.body.appendChild(base); }
  const R=42;                                            // knob travel radius (px)
  function setFrom(e){
    const b=base.getBoundingClientRect();
    let dx=e.clientX-(b.left+b.width/2), dy=e.clientY-(b.top+b.height/2);
    const d=Math.hypot(dx,dy)||1, cl=Math.min(d,R)/d; dx*=cl; dy*=cl;
    knob.style.transform=`translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    JOY.x=dx/R; JOY.y=dy/R; JOY.active=true;
    keys.left = JOY.x < -0.28;                           // platformer walking
    keys.right= JOY.x >  0.28;
    if(JOY.y < -0.6) keys.jump=true; else if(JOY._j) keys.jump=false;   // push up = jump
    JOY._j = JOY.y < -0.6;
  }
  function reset(){
    JOY.x=0; JOY.y=0; JOY.active=false;
    keys.left=false; keys.right=false; if(JOY._j){ keys.jump=false; JOY._j=false; }
    knob.style.transform='translate(-50%,-50%)';
  }
  base.addEventListener('pointerdown',e=>{ e.preventDefault(); actx(); base.setPointerCapture(e.pointerId); setFrom(e); });
  base.addEventListener('pointermove',e=>{ if(JOY.active){ e.preventDefault(); setFrom(e); } });
  base.addEventListener('pointerup',reset);
  base.addEventListener('pointercancel',reset);
})();

const _hb1=document.querySelector('.helperbtn[data-h="1"]');
if(_hb1 && !document.querySelector('.helperbtn[data-h="2"]')){   // build the third (Cavalry) button
  const nb=_hb1.cloneNode(true); nb.dataset.h='2';
  _hb1.parentElement.appendChild(nb);
}
document.querySelectorAll('.helperbtn').forEach(btn=>{
  const idx=+btn.dataset.h;
  const fire=e=>{ e.preventDefault(); actx(); summonHelper(idx); };
  btn.addEventListener('touchstart',fire,{passive:false}); btn.addEventListener('mousedown',fire);
});
(function(){
  const wb=document.getElementById('weaponsel'); if(!wb) return;
  const fire=e=>{ e.preventDefault(); actx(); cycleWeapon(); };
  wb.addEventListener('touchstart',fire,{passive:false}); wb.addEventListener('mousedown',fire);
})();

/* ── CINEMA: double-tap the movie screen for native fullscreen ──────────────
   Active only in a `playlist` screen room (the cinema). Maps the tap to the
   on-screen video rectangle; a double-tap hands the CURRENT part to the phone/PC
   native fullscreen player with sound + scrub controls. Each part is its own file,
   so at a part boundary the native player closes — double-tap again to carry on. */
let _lastCinTap=0, _cinFsEl=null, _cinFsWired=false;
function _cinRestore(){ if(_cinFsEl){ try{ const s=curScreen(); _cinFsEl.muted=(s&&s.sound)?musicMuted:true; _cinFsEl.controls=false; }catch(_){} _cinFsEl=null; } }  // back to in-world state
function cinemaFullscreen(){
  const v=tvVideo; if(!v||v.readyState<1) return;
  if(!_cinFsWired){          // when the video fullscreen ends, put mute/controls back
    document.addEventListener('fullscreenchange', ()=>{ if(_cinFsEl && document.fullscreenElement!==_cinFsEl) _cinRestore(); });
    document.addEventListener('webkitfullscreenchange', ()=>{ if(_cinFsEl && document.webkitFullscreenElement!==_cinFsEl) _cinRestore(); });
    _cinFsWired=true;
  }
  _cinFsEl=v;
  v.addEventListener('webkitendfullscreen', _cinRestore, {once:true});   // iOS native player closed
  v.muted=false;                                                         // sound on for the film
  try{ v.play().catch(()=>{}); }catch(_){}
  if(typeof v.webkitEnterFullscreen==='function'){ try{ v.webkitEnterFullscreen(); return; }catch(_){} }  // iPhone: native player
  const rq=v.requestFullscreen||v.webkitRequestFullscreen||v.mozRequestFullScreen||v.msRequestFullscreen; // desktop / Android
  if(rq){ v.controls=true; try{ rq.call(v); }catch(_){} }
}
const seaRelease=()=>{ SEA.firing=false; SEA.holdUp=false; SEA.holdDn=false; };
cv.addEventListener('pointerup', seaRelease);
cv.addEventListener('pointercancel', seaRelease);
cv.addEventListener('pointerleave', seaRelease);
cv.addEventListener('pointerdown', e=>{                 // SEA/ZOMBIES: tap = aim + fire, drag = aim
  const _fps=SECTIONS[sectionIndex]; if((!_fps.sea&&!_fps.zdef)||paused||csActive) return;
  e.preventDefault(); seaPointer(e.clientX,e.clientY,true);
});
cv.addEventListener('pointermove', e=>{
  const _fps=SECTIONS[sectionIndex]; if((!_fps.sea&&!_fps.zdef)||paused||csActive) return;
  if(e.buttons||e.pressure>0) seaPointer(e.clientX,e.clientY,false);
});
cv.addEventListener('pointerup', e=>{
  const sc=curScreen(); if(!sc||!(sc.playlist||sc.switchable)||paused||csActive) return;   // the cinema OR the house TV
  const b=cv.getBoundingClientRect(); if(!b.width||!b.height) return;
  const ix=(e.clientX-b.left)/b.width*VW, iy=(e.clientY-b.top)/b.height*VH;    // tap -> internal canvas coords
  const r=sc.rect, sx=(r.x-camX)*ZOOM, sy=(r.y-SRCY)*ZOOM, sw=r.w*ZOOM, sh=r.h*ZOOM, pad=14;
  if(ix>=sx-pad && ix<=sx+sw+pad && iy>=sy-pad && iy<=sy+sh+pad){             // tapped on the screen
    e.preventDefault();
    const now=performance.now();
    if(now-_lastCinTap<450){ _lastCinTap=0; cinemaFullscreen(); }            // second tap = go fullscreen
    else _lastCinTap=now;
  }
});

/* ── FULLSCREEN / START ──────────────────────────────────── */
function goFullscreen(){
  const el=document.documentElement;
  const rq=el.requestFullscreen||el.webkitRequestFullscreen||el.mozRequestFullScreen||el.msRequestFullscreen;
  if(rq){ try{ rq.call(el); }catch(e){} }
  if(screen.orientation&&screen.orientation.lock){ try{ screen.orientation.lock('landscape').catch(()=>{}); }catch(e){} }
}
function start(m){
  cur=m; FW=m.fw; FH=m.fh; PW=Math.round(PH*FW/FH); CLIPS=m.clips;
  goFullscreen(); actx(); requestWakeLock();          // keep the screen awake for the whole session
  document.getElementById('select').style.display='none';
  document.getElementById('kbhint').style.display='none';
  document.getElementById('game').style.display='block';
  document.getElementById('who').firstChild.textContent=m.name+' ';
  player.face=1;player.clip='idle';player.ct=0;runHold=0;player.shootPoseT=0;
  player.hp=player.max;player.dead=false;player.deadT=0;player.hurtCool=0;player.invincibleT=0;
  document.getElementById('hpbar').style.width='100%';
  bannerShown=false;csActive=false;csDone=false;
  photographerMet=false; npc.active=false;
  bik.met=false; bik.active=false; bik.winT=0;
  money=1000; owned.clear(); updateMoneyHUD(); closeShop(); floaters=[];
  weaponList=[]; weaponSel=-1; shootCool=0; bullets=[]; vfx=[]; drops=[];
  owned.add('pistol'); addWeaponToLoadout('pistol');   // everyone starts with the free sidearm so SHOOT works from the off
  if(CONTINUE_MODE) applySavedProgress();               // CONTINUE: same money / weapons / unlocks as last session
  player.armour=0; updateArmourHUD(); refreshWeaponBtn();
  hubReturnX=200;
  helper.active=false; helperCool=[0,0]; buildHelperThumbs(); refreshHelperBtns();
  killedEnemies.clear(); pickup.active=false; inventory.clear();
  for(const k in roomReturn) delete roomReturn[k];   // forget remembered door-return spots
  setPaused(false);
  gotoId('in_library', {x:90, face:1});            // start in the Library (walk right toward the exit)
  if(!raf)loop();
}

/* ── PAUSE / MUTE ────────────────────────────────────────── */
let paused=false, musicMuted=false;
function setPaused(p){
  paused=p;
  document.getElementById('pausemenu').classList.toggle('on',p);
  document.getElementById('pause').innerHTML=p?'&#9654;':'&#10073;&#10073;';
  const bgm=document.getElementById('bgm');
  if(p){ bgm.pause(); tvPause(); scenePause(); pauseAllProxAudio(); releaseWakeLock(); }
  else if(cur){
    requestWakeLock();                               // re-acquire the wake lock on resume
    if(!musicMuted && sectionMusic()) bgm.play().catch(()=>{});
    if(curScreen()) screenLoad(true);
    if(curSceneCfg()) sceneLoad(true);
  }
}
document.getElementById('pause').onclick=(e)=>{ e.stopPropagation(); setPaused(!paused); };
document.getElementById('pausemenu').onclick=()=>setPaused(false);
document.getElementById('shopclose').onclick=(e)=>{ e.stopPropagation(); closeShop(); };
document.getElementById('shop').onclick=(e)=>{ if(e.target.id==='shop') closeShop(); };
document.getElementById('travel-close').onclick=(e)=>{ e.stopPropagation(); closeTravel(); };
document.getElementById('travel').onclick=(e)=>{ if(e.target.id==='travel') closeTravel(); };
document.getElementById('mute').onclick=(e)=>{
  e.stopPropagation(); musicMuted=!musicMuted;
  const bgm=document.getElementById('bgm'); bgm.muted=musicMuted;
  if(musicMuted) pauseAllProxAudio();
  for(const k in _tvVidPool){ _tvVidPool[k].muted=true; }
  { const _sc=curScreen(); if(tvVideo) tvVideo.muted=(_sc&&_sc.sound)?musicMuted:true; }   // sound screens follow the music toggle; cinema stays muted in-world
  if(!musicMuted && cur && !paused && sectionMusic()) bgm.play().catch(()=>{});
  document.getElementById('mute').innerHTML = musicMuted ? '&#128263;' : '&#128266;';
};

/* ── UFO (park intro NPC) + PARK INVASION ─ */
const UFO_FW=119, UFO_FH=90;
const ufo={active:false, sx:0, sy:0, ct:0};
let parkInvaded=false;
function startParkIntro(){
  const sec=SECTIONS[sectionIndex];
  if(sec.id==='park'||sec.id==='blacklevel'){ ufo.active=true; ufo.sx=-180; ufo.sy=VH*0.09; ufo.ct=0; parkInvaded=false; }
  else { ufo.active=false; }
}
function updateUfo(){
  if(!ufo.active) return;
  ufo.ct++; ufo.sx += 2.7;
  if(!parkInvaded && ufo.sx>VW){ parkInvaded=true; spawnParkAliens(); }
  if(ufo.sx>VW+220) ufo.active=false;
}
function drawUfo(){
  if(!ufo.active || !imgOk(loaded.ufo)) return;
  const sc=1.3, dw=UFO_FW*sc, dh=UFO_FH*sc;
  const f=Math.floor(ufo.ct*0.2)%8;
  const bob=Math.sin(ufo.ct*0.05)*7;
  try{ ctx.drawImage(loaded.ufo, f*UFO_FW,0,UFO_FW,UFO_FH, ufo.sx, ufo.sy+bob, dw,dh); }catch(_){}
}

/* ── WANDERER (ambient background NPC, harmless) ── */
const WAN_FW=118, WAN_FH=182, WAN_H=58;
const wanderer={active:false, x:0, face:1, anim:0};
function startWanderer(){
  if(SECTIONS[sectionIndex].id==='dundee'){ wanderer.active=true; wanderer.x=BGW*0.62; wanderer.face=-1; wanderer.anim=0; }
  else wanderer.active=false;
}
function updateWanderer(){
  if(!wanderer.active) return;
  wanderer.x += wanderer.face*0.6; wanderer.anim += 0.13;
  if(wanderer.x > BGW-120) wanderer.face=-1; else if(wanderer.x < 80) wanderer.face=1;
}
function drawWanderer(){
  if(!wanderer.active || !imgOk(loaded.wanderer)) return;
  const w=Math.round(WAN_H*WAN_FW/WAN_FH);
  const gy=groundAt(wanderer.x+w/2)-WAN_H;
  const sx=(wanderer.x-camX)*ZOOM, sy=(gy-SRCY)*ZOOM, dw=w*ZOOM, dh=WAN_H*ZOOM;
  if(sx<-dw*2||sx>VW+dw*2) return;
  const f=Math.floor(wanderer.anim)%6;
  ctx.save();
  if(wanderer.face<0){ ctx.translate(sx+dw,sy); ctx.scale(-1,1); } else { ctx.translate(sx,sy); }
  try{ ctx.drawImage(loaded.wanderer, f*WAN_FW,0,WAN_FW,WAN_FH, 0,0, dw,dh); }catch(_){}
  ctx.restore();
}

let hubNpcs=[];
function initHubNpcs(){
  hubNpcs=[];
  if(SECTIONS[sectionIndex].id!=='home') return;
  HUB_NPCS.forEach((d,i)=>{
    const startX = (d.home!=null) ? d.home : 350+i*620;
    hubNpcs.push({ def:d, x:startX, face:(i%2?-1:1), anim:Math.random()*10, pauseT:0, speed:0.45+Math.random()*0.35 });
  });
}
function updateHubNpcs(){
  if(SECTIONS[sectionIndex].id!=='home') return;
  for(const n of hubNpcs){
    const w=Math.round(n.def.h*n.def.fw/n.def.fh);
    const lo = (n.def.home!=null) ? n.def.home-n.def.range : 60;
    const hi = (n.def.home!=null) ? n.def.home+n.def.range : BGW-w-60;
    if(n.pauseT>0){ n.pauseT--; continue; }
    n.x += n.face*n.speed; n.anim += 0.14;
    if(n.x < lo){ n.x=lo; n.face=1; }
    else if(n.x > hi){ n.x=hi; n.face=-1; }
    else { if(Math.random()<0.004) n.face*=-1; if(Math.random()<0.003) n.pauseT=40+Math.floor(Math.random()*90); }
  }
}
function drawHubNpcs(){
  if(SECTIONS[sectionIndex].id!=='home') return;
  for(const n of hubNpcs){
    const d=n.def, im=loaded[d.key]; if(!imgOk(im)) continue;
    const w=Math.round(d.h*d.fw/d.fh);
    const gy=groundAt(n.x+w/2)-d.h;
    const sx=(n.x-camX)*ZOOM, sy=(gy-SRCY)*ZOOM, dw=w*ZOOM, dh=d.h*ZOOM;
    if(sx<-dw*2||sx>VW+dw*2) continue;
    const f = n.pauseT>0 ? 0 : Math.floor(n.anim)%d.frames;
    ctx.save();
    if(n.face<0){ ctx.translate(sx+dw,sy); ctx.scale(-1,1); } else { ctx.translate(sx,sy); }
    try{ ctx.drawImage(im, f*d.fw,0,d.fw,d.fh, 0,0, dw,dh); }catch(_){}
    ctx.restore();
  }
}

let priestNpc=null;
function initChurchNpc(){
  priestNpc=null;
  if(SECTIONS[sectionIndex].id!=='in_church') return;
  priestNpc={ x:PRIEST.centre, face:-1, anim:Math.random()*10, pauseT:0, speed:0.4 };
}
function updateChurchNpc(){
  if(!priestNpc) return;
  const n=priestNpc;
  if(n.pauseT>0){ n.pauseT--; return; }
  n.x += n.face*n.speed; n.anim += 0.13;
  const left=PRIEST.centre-PRIEST.halfRun, right=PRIEST.centre+PRIEST.halfRun;
  if(n.x<left){ n.x=left; n.face=1; }
  else if(n.x>right){ n.x=right; n.face=-1; }
  else { if(Math.random()<0.004) n.face*=-1; if(Math.random()<0.003) n.pauseT=40+Math.floor(Math.random()*90); }
}
function drawChurchNpc(){
  if(!priestNpc) return;
  const im=loaded[PRIEST_DEF.key]; if(!imgOk(im)) return;
  const d=PRIEST_DEF, n=priestNpc;
  const h=PRIEST.height*CSCALE, w=Math.round(h*d.fw/d.fh);
  const leftX=n.x - w/2;
  const gy=groundAt(n.x)-PRIEST.lift-h;
  const sx=(leftX-camX)*ZOOM, sy=(gy-SRCY)*ZOOM, dw=w*ZOOM, dh=h*ZOOM;
  if(sx<-dw*2||sx>VW+dw*2) return;
  const f = n.pauseT>0 ? 0 : Math.floor(n.anim)%d.frames;
  ctx.save();
  if(n.face<0){ ctx.translate(sx+dw,sy); ctx.scale(-1,1); } else { ctx.translate(sx,sy); }
  try{ ctx.drawImage(im, f*d.fw,0,d.fw,d.fh, 0,0, dw,dh); }catch(_){}
  ctx.restore();
}

let bkNpc=null;
function initLibraryNpc(){
  bkNpc=null;
  if(SECTIONS[sectionIndex].id!=='in_winchester') return;   // moved again: Special Guest room -> the Winchester (pool table)
  bkNpc={ x:BK.x, face:1, anim:Math.random()*BK_DEF.frames, flipT:BK.flipEvery };
}
function updateLibraryNpc(){
  if(!bkNpc) return;
  const n=bkNpc;
  n.anim += BK.animSpd;
  if(--n.flipT<=0){ n.face*=-1; n.flipT=BK.flipEvery; }
}
function drawLibraryNpc(){
  if(!bkNpc) return;
  const im=loaded[BK_DEF.key]; if(!imgOk(im)) return;
  const d=BK_DEF, n=bkNpc;
  const h=BK.height*CSCALE, w=Math.round(h*d.fw/d.fh);
  const leftX=n.x - w/2;
  const gy=groundAt(n.x)-BK.lift-h;
  const sx=(leftX-camX)*ZOOM, sy=(gy-SRCY)*ZOOM, dw=w*ZOOM, dh=h*ZOOM;
  if(sx<-dw*2||sx>VW+dw*2) return;
  const f=Math.floor(n.anim)%d.frames;
  ctx.save();
  if(n.face<0){ ctx.translate(sx+dw,sy); ctx.scale(-1,1); } else { ctx.translate(sx,sy); }
  try{ ctx.drawImage(im, f*d.fw,0,d.fw,d.fh, 0,0, dw,dh); }catch(_){}
  ctx.restore();
}

let mkNpcs=[];
function initMkNpcs(){
  mkNpcs=[];
  if(SECTIONS[sectionIndex].id!=='mk') return;
  MK_NPCS.forEach((d,i)=>{
    mkNpcs.push({ def:d, x:d.home, face:(i%2?-1:1), anim:Math.random()*10, pauseT:0, speed:0.4+Math.random()*0.4 });
  });
}
function updateMkNpcs(){
  if(SECTIONS[sectionIndex].id!=='mk') return;
  for(const n of mkNpcs){
    const lo=n.def.home-n.def.range, hi=n.def.home+n.def.range;
    if(n.pauseT>0){ n.pauseT--; continue; }
    n.x += n.face*n.speed; n.anim += 0.14;
    if(n.x < lo){ n.x=lo; n.face=1; }
    else if(n.x > hi){ n.x=hi; n.face=-1; }
    else { if(Math.random()<0.004) n.face*=-1; if(Math.random()<0.003) n.pauseT=40+Math.floor(Math.random()*90); }
  }
}
function drawMkNpcs(){
  if(SECTIONS[sectionIndex].id!=='mk') return;
  for(const n of mkNpcs){
    const d=n.def, im=loaded[d.key]; if(!imgOk(im)) continue;
    const w=Math.round(d.h*d.fw/d.fh);
    const gy=groundAt(n.x+w/2)-d.h;
    const sx=(n.x-camX)*ZOOM, sy=(gy-SRCY)*ZOOM, dw=w*ZOOM, dh=d.h*ZOOM;
    if(sx<-dw*2||sx>VW+dw*2) continue;
    const f = n.pauseT>0 ? 0 : Math.floor(n.anim)%d.frames;
    ctx.save();
    if(n.face<0){ ctx.translate(sx+dw,sy); ctx.scale(-1,1); } else { ctx.translate(sx,sy); }
    try{ ctx.drawImage(im, f*d.fw,0,d.fw,d.fh, 0,0, dw,dh); }catch(_){}
    ctx.restore();
  }
}

/* ── FOOD PICKUP (pub heal) ── */
const FOOD_H=30;
const pickup={active:false,x:0,w:0,taken:false};
function initPickup(){
  if(SECTIONS[sectionIndex].id==='pub' && imgOk(loaded.food)){
    const im=loaded.food; pickup.w=Math.round(FOOD_H*im.naturalWidth/im.naturalHeight);
    pickup.x=Math.round(BGW*0.5 - pickup.w/2); pickup.taken=false; pickup.active=true;
  } else { pickup.active=false; }
}
function updatePickup(){
  if(!pickup.active||pickup.taken||player.dead) return;
  const pc=player.x+PW/2, fc=pickup.x+pickup.w/2;
  if(Math.abs(pc-fc) < PW/2 + pickup.w/2 - 6){
    pickup.taken=true;
    player.hp=player.max; document.getElementById('hpbar').style.width='100%';
    [0,4,7,12].forEach((s,i)=>setTimeout(()=>blip(440*Math.pow(2,s/12),0,0.14,'triangle',0.16),i*70));
    flashBanner('Proper scran &mdash; full health!');
  }
}
function drawPickup(){
  if(!pickup.active||pickup.taken||!imgOk(loaded.food)) return;
  const im=loaded.food, w=pickup.w*CSCALE, h=FOOD_H*CSCALE;
  const gy=groundAt(pickup.x+pickup.w/2);
  const sx=(pickup.x-camX)*ZOOM-(w-pickup.w)*ZOOM/2, sy=(gy-SRCY-h)*ZOOM;
  if(sx<-w*ZOOM*2||sx>VW+w*ZOOM*2) return;
  const bob=Math.sin(performance.now()/400)*2;
  ctx.save(); ctx.shadowColor='rgba(0,0,0,0.45)'; ctx.shadowBlur=6;
  try{ ctx.drawImage(im, sx, sy+bob, w*ZOOM, h*ZOOM); }catch(_){}
  ctx.restore();
}

function sectionMusic(){
  const id=SECTIONS[sectionIndex].id;
  const jb=(typeof JUKEBOX!=='undefined') ? JUKEBOX[id] : null;
  if(jb) return jb.idx<0 ? null : jb.files[jb.idx]; // jukebox rooms play the selected track (idx -1 = paused/silent)
  return (!SCREENS[id] && TRACKS[id]) ? TRACKS[id] : null;
}
function playTrack(src){
  const bgm=document.getElementById('bgm');
  if(!src){ bgm.pause(); return; }
  if(bgm.getAttribute('data-src')!==src){ bgm.setAttribute('data-src',src); bgm.src=src; }
  try{ bgm.currentTime=0; }catch(_){}
  bgm.volume=0.35; bgm.muted=musicMuted;
  if(!paused && !musicMuted) bgm.play().catch(()=>{});
}
function playSectionTrack(){ playTrack(sectionMusic()); }
let selectMusicStarted=false;
function tryStartSelectMusic(){
  if(selectMusicStarted || cur) return;
  selectMusicStarted=true; playTrack(TRACKS.select);
}
document.addEventListener('pointerdown', tryStartSelectMusic);

const _proxEls={};
const _npcSrcSeen={};   // every npc mp3 that has started, so we can silence it in other rooms
function _proxEl(src){
  if(!_proxEls[src]){ const a=new Audio(src); a.loop=true; a.volume=0; a.preload='auto'; _proxEls[src]=a; }
  return _proxEls[src];
}
function pauseAllProxAudio(){ for(const k in _proxEls){ try{ _proxEls[k].pause(); }catch(_){} } }
function updateProxAudio(){
  const secId=SECTIONS[sectionIndex].id;
  for(const p of PROX_AUDIO){
    const a=_proxEl(p.src);
    let want=false, vol=0;
    if(!musicMuted && !paused && cur && !player.dead && secId===p.section){
      const nx=p.getX();
      if(nx!=null){
        const d=Math.abs((player.x+PW/2)-nx);
        if(d<p.range){ want=true; vol=0.25 + 0.55*(1-d/p.range); }
      }
    }
    if(want){ a.muted=musicMuted; a.volume=Math.max(0,Math.min(0.8,vol)); if(a.paused) a.play().catch(()=>{}); }
    else if(!a.paused){ a.pause(); }
  }
  const live = !musicMuted && !paused && cur && !player.dead;
  // per ENEMY KIND: every enemy has an mp3 slot; the NEAREST live instance sets the volume
  for(let k=0;k<ENEMY_KINDS.length;k++){
    const K=ENEMY_KINDS[k]; if(!K.mp3) continue;
    const a=_proxEl(K.mp3); let vol=0;
    if(live){
      let nd=1e9;
      for(const e of enemies){ if(e.kind===k && e.state!=='dead'){ const dd=Math.abs((player.x+PW/2)-(e.x+e.w/2)); if(dd<nd) nd=dd; } }
      const rng=K.mp3range||240;
      if(nd<rng) vol=0.2+0.55*(1-nd/rng);
    }
    if(vol>0){ a.muted=musicMuted; a.volume=Math.max(0,Math.min(0.8,vol)); if(a.paused) a.play().catch(()=>{}); }
    else if(!a.paused){ a.pause(); }
  }
  // per SCENERY NPC: every NPC has an mp3 slot; the NEAREST instance of each src sets the volume
  const _npcVol={};
  if(live){
    for(const s of scenery){ const d=s.def; if(!d.mp3) continue;
      _npcSrcSeen[d.mp3]=1;
      const w=(d.h||120)*d.fw/d.fh; const dd=Math.abs((player.x+PW/2)-(s.x+w/2)); const rng=d.range||180;
      const v=dd<rng ? (0.25+0.55*(1-dd/rng)) : 0;
      if(!(d.mp3 in _npcVol) || v>_npcVol[d.mp3]) _npcVol[d.mp3]=v;
    }
  } else { for(const s of scenery){ if(s.def.mp3){ _npcSrcSeen[s.def.mp3]=1; _npcVol[s.def.mp3]=0; } } }
  // any npc mp3 that has EVER played but whose owner isn't in THIS room: force it silent
  // (fixes hub walker audio carrying on inside the Winchester etc.)
  for(const src in _npcSrcSeen){ if(!(src in _npcVol)) _npcVol[src]=0; }
  // N BOMB armed loop: Nbomb.mp3 plays while the N bomb is the selected weapon
  {
    const el=_proxEl('Nbomb.mp3');
    if(el){ const want=live && isArmed() && weaponList[weaponSel]==='nbomb';
      if(want){ el.volume=0.75; if(el.paused) el.play().catch(()=>{}); }
      else if(!el.paused) el.pause(); }
  }
  for(const src in _npcVol){
    const a=_proxEl(src); const vol=_npcVol[src];
    if(vol>0){ a.muted=musicMuted; a.volume=Math.max(0,Math.min(0.8,vol)); if(a.paused) a.play().catch(()=>{}); }
    else if(!a.paused){ a.pause(); }
  }
  // DUCK the room music while a scenery NPC (e.g. gardenman) is talking, so their voice is clear.
  let _duck=0; for(const src in _npcVol){ if(src==='Barman.mp3') continue; if(_npcVol[src]>_duck) _duck=_npcVol[src]; }   // the barman talks OVER the jukebox, no ducking
  if(typeof bgm!=='undefined' && bgm){ const norm=Math.min(1,_duck/0.8); bgm.volume = 0.35*(1-0.92*norm); }
}

/* ══ THE SEA — first-person scope SHOOTING GALLERY ═══════════════════════════
   A self-contained mini-game (NOT the platformer). Any section with `sea:true`
   runs seaUpdate()/seaDraw() instead of the normal loop (branched at the top of
   update() and draw()). You swing a scope RETICLE around — DRAG on screen to aim
   and TAP to fire, or use the pad (◀▶ pan, JUMP raise, STRIKE fire) — and pick
   off MOVING TARGETS out at sea: seagulls, bobbing buoys, drifting bottles and the
   odd launched clay pigeon. Pure arcade shooter; targets are inanimate/animal only.
   Everything is drawn procedurally so it needs no art; backdrop = the section's
   bgKey (room_sea.jpeg). To use your own target art later, swap the seaDrawTarget
   branches for drawImage on an uploaded sprite. ◀ LEAVE (top-left) returns to hub. */
const SEA = { on:false, rx:VW/2, ry:VH*0.5, tx:VW/2, ty:VH*0.5, aimX:VW/2, aimY:VH*0.5,
  cool:0, kick:0, flash:0, score:0, shots:0, hits:0, t:0, targets:[], puffs:[], spawnT:0, aiming:false,
  firing:false, holdUp:false, holdDn:false,
  leaveBtn:{x:8,y:64,w:104,h:30} };   // below the DOM name/£ overlay
function seaHorizonY(){ return VH*0.37; }              // waterline in the VIDEO backdrop (~y133)
let seaVid=null;                                         // room_sea.mp4 — optional looping video backdrop (audio stripped; level music is Sea.mp3)
function seaVidEnsure(){
  if(seaVid!==null) return;
  seaVid=document.createElement('video');
  seaVid.muted=true; seaVid.loop=true;
  seaVid.playsInline=true; seaVid.setAttribute('playsinline','');
  seaVid.preload='auto';
  seaVid._alt=true;                                          // repo name first, underscore as backup
  seaVid.addEventListener('error', ()=>{
    if(seaVid && seaVid._alt){ seaVid._alt=false; seaVid.src='room_sea.mp4'; seaVid.load(); }
    else seaVid=false;                                       // neither name: fall back to the jpeg forever
  });
  seaVid.src='room sea.mp4';
  try{ seaVid.load(); }catch(_){}
}
function seaEnter(){
  seaVidEnsure();
  if(seaVid){ try{ seaVid.currentTime=0; seaVid.play().catch(()=>{}); }catch(_){}}
  SEA.on=true; SEA.rx=SEA.tx=SEA.aimX=VW/2; SEA.ry=SEA.ty=SEA.aimY=VH*0.5;
  SEA.cool=0; SEA.kick=0; SEA.flash=0; SEA.score=0; SEA.shots=0; SEA.hits=0; SEA.t=0;
  SEA.targets=[]; SEA.puffs=[]; SEA.spawnT=0; SEA.aiming=false;
  SEA.firing=false; SEA.holdUp=false; SEA.holdDn=false;
  SEA.challenges=[ {hits:25, pay:1000, done:false},      // MONEY CHALLENGES (per visit):
                   {hits:50, pay:2500, done:false},      // rack up hits, get paid at each rung
                   {hits:100,pay:10000,done:false} ];
  for(let i=0;i<5;i++) seaSpawn(true);
}
function seaSpawn(anywhere){
  const horizon=seaHorizonY();
  const k = Math.random()<0.5 ? 'gull' : 'boat';        // TARGETS: seagulls + empty boats only
  const dir=Math.random()<0.5?1:-1;
  const t={kind:k, dir, dead:false, bob:Math.random()*6.28};
  if(k==='gull'){
    t.y=18+Math.random()*(horizon-46); t.spd=0.9+Math.random()*1.2; t.r=15; t.pts=15;
    t.scale=0.7+Math.random()*0.2;
  } else {                                              // empty drifting fishing boat (seaboat.png)
    t.y=horizon+12+Math.random()*(VH-horizon-60); t.spd=0.45+Math.random()*0.45;
    t.r=36; t.pts=20;
    t.scale = 0.42 + (t.y-horizon)/(VH-horizon)*1.35;   // far out = small, close in = big
  }
  t.x = anywhere ? (40+Math.random()*(VW-80)) : (dir>0 ? -30 : VW+30);
  SEA.targets.push(t);
}
function seaFireAt(ax,ay){
  if(SEA.cool>0) return;
  SEA.cool=5; SEA.shots++; SEA.kick=4; SEA.flash=3;      // MACHINE GUN: ~12 rounds/sec while held
  ax+=(Math.random()*2-1)*3; ay+=(Math.random()*2-1)*3;  // slight spray
  addShake(1.5,3); noiseBurst(0.07,0.20,500); blip(180,70,0.06,'square',0.10);
  let best=null, bd=1e9;
  for(const t of SEA.targets){ if(t.dead) continue;
    const hr=(t.r+8)*t.scale, d=Math.hypot(t.x-ax,t.y-ay);
    if(d<hr && d<bd){ bd=d; best=t; }
  }
  if(best){
    best.dead=true; SEA.hits++; SEA.score+=best.pts;
    SEA.puffs.push({x:best.x,y:best.y,ct:0,pts:best.pts,splash:best.y>seaHorizonY()&&best.kind!=='gull'});
    blip(880,1500,0.07,'square',0.12); blip(560,1000,0.10,'triangle',0.10);     // hit chime
    for(const ch of (SEA.challenges||[])){                // money challenge payouts
      if(!ch.done && SEA.hits>=ch.hits){ ch.done=true; addMoney(ch.pay);
        flashBanner('CHALLENGE \u2014 '+ch.hits+' HITS: \u00A3'+ch.pay.toLocaleString());
        blip(520,1040,0.18,'triangle',0.2); blip(780,1560,0.22,'triangle',0.16); }
    }
  } else {
    SEA.puffs.push({x:ax,y:ay,ct:0,miss:true,splash:ay>seaHorizonY()});
  }
}
function seaFire(){ seaFireAt(SEA.aimX,SEA.aimY); }
function seaPointer(clientX,clientY,fire){
  const b=cv.getBoundingClientRect(); if(!b.width||!b.height) return;
  const px=Math.max(0,Math.min(VW,(clientX-b.left)/b.width*VW));
  const py=Math.max(0,Math.min(VH,(clientY-b.top)/b.height*VH));
  const inBtn=(B)=>px>=B.x&&px<=B.x+B.w&&py>=B.y&&py<=B.y+B.h;
  if(fire && seaVid && seaVid.paused && SECTIONS[sectionIndex].sea){ try{ seaVid.play().catch(()=>{}); }catch(_){} }
  if(fire){
    if(inBtn(SEA.leaveBtn)){                                             // ◀ LEAVE → the door you came from
      gotoId('home',{x:SECTIONS[sectionIndex].zdef?1490:1290,face:1}); return; }
  }
  SEA.tx=px; SEA.ty=py; SEA.rx=px; SEA.ry=py; SEA.aiming=true;   // snap to finger for responsive aim
  if(fire) SEA.firing=true;                              // MACHINE GUN: hold to keep firing
}
function seaUpdate(){
  SEA.t++;
  if(SEA.cool>0) SEA.cool--;
  if(SEA.flash>0) SEA.flash--;
  if(SEA.kick>0.4) SEA.kick*=0.78; else SEA.kick=0;
  const PAN=4.4, JSPD=6.2;
  if(JOY.active){                                        // JOYSTICK: analog 2D aim
    SEA.rx=Math.max(0,Math.min(VW,SEA.rx+JOY.x*JSPD));
    SEA.ry=Math.max(0,Math.min(VH,SEA.ry+JOY.y*JSPD));
  } else if(!SEA.aiming){                                // keyboard fallback
    if(keys.left)  SEA.rx=Math.max(0,SEA.rx-PAN);
    if(keys.right) SEA.rx=Math.min(VW,SEA.rx+PAN);
    if(keys.jump)  SEA.ry=Math.max(0,SEA.ry-PAN);
  }
  SEA.aiming=false;                                      // pointermove re-asserts this each frame
  SEA.aimX=SEA.rx+Math.sin(SEA.t*0.05)*2.0;              // subtle scope breathing (aim + drawn reticle match)
  SEA.aimY=SEA.ry+Math.sin(SEA.t*0.037)*1.5;
  if(SEA.firing||punchDown) seaFire();                   // MACHINE GUN: hold screen or STRIKE to spray
  punchEdge=false;
  const horizon=seaHorizonY();
  for(const t of SEA.targets){
    if(t.dead) continue;
    t.x += t.dir*t.spd; t.bob += 0.06;
    if(t.kind==='gull') t.y += Math.sin(t.bob)*0.35;
    else t.y += Math.sin(t.bob)*0.5;                     // boats bob on the swell
    if(t.x<-50 || t.x>VW+50) t.dead=true;
  }
  SEA.targets=SEA.targets.filter(t=>!t.dead);
  for(const p of SEA.puffs) p.ct++;
  SEA.puffs=SEA.puffs.filter(p=>p.ct<24);
  SEA.spawnT--;
  if(SEA.targets.length<6 && SEA.spawnT<=0){ seaSpawn(false); SEA.spawnT=18+Math.random()*40; }
}
/* ── drawing ── */
function seaDrawTarget(t){
  const s=t.scale, x=t.x, y=t.y;
  ctx.save(); ctx.translate(x,y); ctx.scale(t.dir,1);   // face travel direction
  if(t.kind==='gull'){
    ctx.strokeStyle='rgba(30,34,40,0.92)'; ctx.lineWidth=3*s; ctx.lineCap='round';
    const w=13*s, f=Math.sin(t.bob*2)*4*s;               // flapping
    ctx.beginPath(); ctx.moveTo(-w,f); ctx.quadraticCurveTo(-w*0.4,-6*s-f,0,0);
    ctx.quadraticCurveTo(w*0.4,-6*s-f,w,f); ctx.stroke();
    ctx.fillStyle='rgba(40,44,50,0.9)'; ctx.beginPath(); ctx.arc(0,0,2.2*s,0,7); ctx.fill();
  } else if(t.kind==='boat'){
    const img=loaded.seaboat;
    ctx.rotate(Math.sin(t.bob)*0.045);                   // gentle roll on the swell
    if(imgOk(img)){
      const bw=124*s, bh=bw*img.naturalHeight/img.naturalWidth;
      ctx.scale(-1,1);                                   // sprite's bow points LEFT; net flip = face travel dir
      ctx.drawImage(img,-bw/2,-bh+8*s,bw,bh);            // hull sits on the waterline (y)
    } else {                                             // fallback if seaboat.png isn't uploaded
      ctx.fillStyle='#e8ecef'; ctx.beginPath();
      ctx.moveTo(-26*s,0); ctx.lineTo(22*s,0); ctx.lineTo(28*s,-7*s); ctx.lineTo(-20*s,-8*s); ctx.closePath(); ctx.fill();
      ctx.fillStyle='#2a3138'; ctx.fillRect(-10*s,-16*s,14*s,9*s);
    }
  }
  ctx.restore();
}
function seaDrawPuff(p){
  const k=p.ct/24;
  if(p.splash){
    ctx.strokeStyle=`rgba(230,244,255,${(1-k)*0.9})`; ctx.lineWidth=2;
    const rr=6+k*22; ctx.beginPath(); ctx.ellipse(p.x,p.y,rr,rr*0.4,0,0,7); ctx.stroke();
    for(let i=0;i<5;i++){ const a=i/5*6.28; const d=k*18;
      ctx.fillStyle=`rgba(230,244,255,${(1-k)*0.8})`;
      ctx.fillRect(p.x+Math.cos(a)*d, p.y-Math.abs(Math.sin(a))*d - k*10, 2,2); }
  } else {
    ctx.fillStyle=`rgba(255,${p.miss?200:120},60,${(1-k)*0.8})`;
    const rr=4+k*16; ctx.beginPath(); ctx.arc(p.x,p.y,rr,0,7); ctx.fill();
  }
  if(p.pts){ ctx.fillStyle=`rgba(255,240,150,${1-k})`; ctx.font='bold 13px system-ui,sans-serif';
    ctx.textAlign='center'; ctx.fillText('+'+p.pts, p.x, p.y-14-k*16); ctx.textAlign='left'; }
}
function seaDrawScope(){
  const cx=VW/2, cy=VH/2, R=VH*0.60;
  const g=ctx.createRadialGradient(cx,cy,R*0.55,cx,cy,R*1.15);
  g.addColorStop(0,'rgba(0,0,0,0)'); g.addColorStop(0.72,'rgba(0,0,0,0.05)');
  g.addColorStop(1,'rgba(0,0,0,0.92)');
  ctx.fillStyle=g; ctx.fillRect(0,0,VW,VH);
  ctx.strokeStyle='rgba(10,12,14,0.9)'; ctx.lineWidth=6;
  ctx.beginPath(); ctx.arc(cx,cy,R,0,7); ctx.stroke();
  ctx.strokeStyle='rgba(120,130,140,0.35)'; ctx.lineWidth=1.5;
  ctx.beginPath(); ctx.arc(cx,cy,R-4,0,7); ctx.stroke();
}
function seaDrawReticle(x,y){
  ctx.save();
  ctx.strokeStyle='rgba(60,255,120,0.95)'; ctx.fillStyle='rgba(60,255,120,0.95)';
  ctx.lineWidth=1.5; ctx.shadowColor='rgba(60,255,120,0.7)'; ctx.shadowBlur=6;
  ctx.beginPath(); ctx.arc(x,y,13,0,7); ctx.stroke();
  const g=5, L=11;
  ctx.beginPath();
  ctx.moveTo(x-g-L,y); ctx.lineTo(x-g,y); ctx.moveTo(x+g,y); ctx.lineTo(x+g+L,y);
  ctx.moveTo(x,y-g-L); ctx.lineTo(x,y-g); ctx.moveTo(x,y+g); ctx.lineTo(x,y+g+L);
  ctx.stroke();
  ctx.beginPath(); ctx.arc(x,y,1.6,0,7); ctx.fill();
  ctx.restore();
}
function seaDrawGun(){
  /* chunky MACHINE GUN anchored bottom-right, barrel tracking the reticle */
  const px=VW-118, py=VH+42;                              // pivot just off-screen
  const ang=Math.atan2(SEA.aimY-py, SEA.aimX-px);
  ctx.save(); ctx.translate(px,py); ctx.rotate(ang);
  ctx.fillStyle='#14181d';                                // barrel
  ctx.fillRect(38,-7,150,14);
  ctx.fillStyle='#0c0f13'; ctx.fillRect(176,-9,16,18);    // muzzle brake
  ctx.fillStyle='#1d232b';                                // handguard ribs
  for(let i=0;i<4;i++) ctx.fillRect(58+i*26,-10,14,20);
  ctx.fillStyle='#242c36'; ctx.beginPath(); ctx.roundRect(-16,-20,70,44,8); ctx.fill();  // receiver
  ctx.fillStyle='#171c22'; ctx.beginPath(); ctx.roundRect(-4,16,34,26,5); ctx.fill();    // ammo box
  ctx.fillStyle='#0f1317'; ctx.fillRect(20,-26,12,12);    // rear sight
  if(SEA.flash>0){                                        // muzzle flash
    const fx=196, k=SEA.flash/3;
    ctx.fillStyle=`rgba(255,240,170,${0.85*k})`;
    ctx.beginPath();
    ctx.moveTo(fx,0); ctx.lineTo(fx+26*k,-11*k); ctx.lineTo(fx+40*k,0); ctx.lineTo(fx+26*k,11*k);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle=`rgba(255,200,90,${0.7*k})`; ctx.beginPath(); ctx.arc(fx+8,0,8*k,0,7); ctx.fill();
  }
  ctx.restore();
}
function seaDrawHud(){
  ctx.save();
  // LEAVE button
  const L=SEA.leaveBtn;
  ctx.fillStyle='rgba(12,16,22,0.72)'; ctx.strokeStyle='rgba(200,210,220,0.5)'; ctx.lineWidth=1.5;
  ctx.beginPath(); ctx.roundRect(L.x,L.y,L.w,L.h,7); ctx.fill(); ctx.stroke();
  ctx.fillStyle='#eef2f6'; ctx.font='bold 15px system-ui,sans-serif'; ctx.textBaseline='middle';
  ctx.fillText('\u25C0 LEAVE', L.x+12, L.y+L.h/2+1);
  // score / accuracy (top-right)
  ctx.textAlign='right'; ctx.font='bold 18px system-ui,sans-serif';
  ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.fillText('SCORE '+SEA.score, VW-23, 47);
  ctx.fillStyle='#ffe98a'; ctx.fillText('SCORE '+SEA.score, VW-24, 46);
  ctx.font='12px system-ui,sans-serif'; ctx.fillStyle='rgba(235,240,245,0.85)';
  ctx.fillText('HITS '+SEA.hits+' / '+SEA.shots, VW-24, 64);
  statBestDover(SEA.score);
  const _nx=(SEA.challenges||[]).find(ch=>!ch.done);
  ctx.fillStyle=_nx?'rgba(140,255,170,0.9)':'rgba(255,233,138,0.9)';
  ctx.fillText(_nx?('NEXT: '+_nx.hits+' HITS \u2192 \u00A3'+_nx.pay.toLocaleString())
                  :'ALL CHALLENGES PAID', VW-24, 80);
  ctx.textAlign='left'; ctx.textBaseline='alphabetic';
  if(SEA.t<210){ ctx.globalAlpha=Math.max(0,1-(SEA.t-150)/60);
    ctx.fillStyle='#eef2f6'; ctx.font='13px system-ui,sans-serif'; ctx.textAlign='center';
    ctx.fillText('JOYSTICK to aim \u2022 HOLD screen or STRIKE to fire', VW/2, VH-16);
    ctx.textAlign='left'; ctx.globalAlpha=1; }
  ctx.restore();
}
function seaDraw(){
  ctx.clearRect(0,0,VW,VH); ctx.imageSmoothingEnabled=true;
  const kx=(Math.random()*2-1)*SEA.kick, ky=(Math.random()*2-1)*SEA.kick;
  ctx.save(); ctx.translate(kx,ky);                      // recoil kick shakes the VIEW, not the HUD
  const bg=loaded[SECTIONS[sectionIndex].bgKey];
  if(seaVid && seaVid.paused){ try{ seaVid.play().catch(()=>{}); }catch(_){} }
  if(seaVid && seaVid.readyState>=2){ ctx.drawImage(seaVid,-4,-4,VW+8,VH+8); }
  else if(imgOk(bg)){ ctx.drawImage(bg,-4,-4,VW+8,VH+8); }
  else {                                                 // fallback sea if the photo isn't uploaded
    const horizon=seaHorizonY();
    const sky=ctx.createLinearGradient(0,0,0,horizon);
    sky.addColorStop(0,'#2a4a6e'); sky.addColorStop(1,'#e9a659'); ctx.fillStyle=sky; ctx.fillRect(0,0,VW,horizon);
    const sea=ctx.createLinearGradient(0,horizon,0,VH);
    sea.addColorStop(0,'#37617f'); sea.addColorStop(1,'#1d3448'); ctx.fillStyle=sea; ctx.fillRect(0,horizon,VW,VH-horizon);
    ctx.fillStyle='rgba(255,210,120,0.5)'; ctx.beginPath(); ctx.arc(VW*0.62,horizon-8,16,0,7); ctx.fill();
  }
  for(const t of SEA.targets) if(!t.dead) seaDrawTarget(t);
  for(const p of SEA.puffs) seaDrawPuff(p);
  seaDrawGun();
  ctx.restore();
  seaDrawReticle(SEA.aimX,SEA.aimY);
  seaDrawHud();
}

/* ══ ZOMBIES — first-person WAVE DEFENCE ═════════════════════════════════════
   Runs on any section with `zdef:true` (branched in update()/draw() like the sea
   range). Shares the SEA aim state + machine gun + scope + reticle + joystick:
   zombies spawn small at the portal on the horizon and walk AT the camera,
   growing as they close in. Each takes a few rounds to put down; frames 0-4 walk,
   5 = lunge (the strike when one reaches you), 6-8 = collapse. A zombie reaching
   the screen costs a heart — lose all 3 and it's game over (tap to go home).
   Waves grow bigger and faster. Backdrop room_zombies.jpeg; a drawn moor + glowing
   portal is used until it's uploaded. */
const ZOM={ zombies:[], wave:0, kills:0, score:0, lives:3, spawnLeft:0, spawnT:0,
  betweenT:0, over:false, overT:0, hurtT:0 };
/* zombie TYPES — add a row per sheet (9 frames each: walk 0-4, lunge 5, collapse 6-8).
   spdM = speed multiplier, hpM = hit-points adjustment vs the wave baseline. */
const ZOM_KINDS=[
  {img:'zombie',  fw:131, fh:237, spdM:1.0, hpM:0,
   clips:{walk:{start:0,count:5}, lunge:{start:5,count:1}, die:{start:6,count:3}}},   // nightgown — baseline
  {img:'zombie2', fw:116, fh:239, spdM:1.3, hpM:-1,
   clips:{walk:{start:0,count:5}, lunge:{start:5,count:1}, die:{start:6,count:3}}},   // camo jacket — faster but weaker
  {img:'paleman', fw:101, fh:214, spdM:0.9, hpM:2,
   clips:{walk:{start:0,count:6}, lunge:{start:6,count:2}, die:{start:6,count:4}}},   // the pale man — slow, tanky, horrid
];
function zomEnter(){
  SEA.rx=SEA.tx=SEA.aimX=VW/2; SEA.ry=SEA.ty=SEA.aimY=VH*0.5;
  SEA.cool=0; SEA.kick=0; SEA.flash=0; SEA.t=0; SEA.aiming=false; SEA.firing=false;
  ZOM.zombies=[]; ZOM.wave=0; ZOM.kills=0; ZOM.score=0; ZOM.lives=3;
  ZOM.spawnLeft=0; ZOM.spawnT=0; ZOM.betweenT=80; ZOM.over=false; ZOM.overT=0; ZOM.hurtT=0;
}
function zomHorizonY(){ return VH*0.46; }
function zomStartWave(){
  ZOM.wave++; statBestWave(ZOM.wave); ZOM.spawnLeft=2+ZOM.wave*2; ZOM.spawnT=10;
  flashBanner('WAVE '+ZOM.wave);
  blip(220,440,0.25,'triangle',0.16);
}
function zomSpawn(){
  const k=ZOM_KINDS[(Math.random()*ZOM_KINDS.length)|0];
  const spd=(0.0016+0.00035*ZOM.wave)*(0.85+Math.random()*0.4)*k.spdM;
  ZOM.zombies.push({ k, sx:(Math.random()*2-1)*0.9, z:1, spd,
    hp:Math.max(1, 2+(ZOM.wave>=4?1:0)+(ZOM.wave>=8?1:0)+k.hpM),
    st:'walk', anim:Math.random()*5, hitT:0, lungeT:0, dieT:0 });
}
function zomGeom(zb){                                    // screen geometry from depth z (1=portal, 0=camera)
  const t=1-zb.z, tt=t*t;
  const dh=26+tt*400;                                    // drawn height px
  const dw=dh*zb.k.fw/zb.k.fh;
  const fy=VH*0.833+tt*VH*0.42;                         // ground line ~83% down (the misty path), walking down past the camera
  const x=VW/2 + zb.sx*(50+tt*430);                      // lanes fan out as they approach
  return {x, fy, dw, dh, t};
}
function zomFireAt(ax,ay){
  if(SEA.cool>0) return;
  SEA.cool=5; SEA.kick=4; SEA.flash=3;
  ax+=(Math.random()*2-1)*3; ay+=(Math.random()*2-1)*3;
  addShake(1.5,3); noiseBurst(0.07,0.20,500); blip(180,70,0.06,'square',0.10);
  let best=null, bt=-1;
  for(const zb of ZOM.zombies){
    if(zb.st==='die') continue;
    const g=zomGeom(zb);
    if(ax>g.x-g.dw*0.34 && ax<g.x+g.dw*0.34 && ay>g.fy-g.dh && ay<g.fy){
      if(g.t>bt){ bt=g.t; best=zb; }                     // hit the CLOSEST one under the reticle
    }
  }
  if(best){
    best.hp--; best.hitT=6;
    const g=zomGeom(best);
    SEA.puffs.push({x:ax,y:Math.max(g.fy-g.dh*0.8,ay),ct:0,miss:false,splash:false});
    if(best.hp<=0){ best.st='die'; best.dieT=0; ZOM.kills++; ZOM.score+=10+ZOM.wave;
      SEA.puffs.push({x:g.x,y:g.fy-g.dh*0.5,ct:0,pts:10+ZOM.wave,splash:false});
      blip(90,36,0.22,'sawtooth',0.16);
    } else blip(120,60,0.08,'square',0.10);
  }
}
function zomUpdate(){
  SEA.t++;
  if(SEA.cool>0) SEA.cool--;
  if(SEA.flash>0) SEA.flash--;
  if(SEA.kick>0.4) SEA.kick*=0.78; else SEA.kick=0;
  if(ZOM.hurtT>0) ZOM.hurtT--;
  if(ZOM.over){                                          // game over: STRIKE / tap (after a beat) goes home
    ZOM.overT++;
    if(ZOM.overT>45 && (SEA.firing||punchDown)){ SEA.firing=false; punchDown=false; gotoId('home',{x:1490,face:1}); }
    punchEdge=false; return;
  }
  const JSPD=6.2, PAN=4.4;
  if(JOY.active){
    SEA.rx=Math.max(0,Math.min(VW,SEA.rx+JOY.x*JSPD));
    SEA.ry=Math.max(0,Math.min(VH,SEA.ry+JOY.y*JSPD));
  } else if(!SEA.aiming){
    if(keys.left)  SEA.rx=Math.max(0,SEA.rx-PAN);
    if(keys.right) SEA.rx=Math.min(VW,SEA.rx+PAN);
    if(keys.jump)  SEA.ry=Math.max(0,SEA.ry-PAN);
  }
  SEA.aiming=false;
  SEA.aimX=SEA.rx+Math.sin(SEA.t*0.05)*2.0;
  SEA.aimY=SEA.ry+Math.sin(SEA.t*0.037)*1.5;
  if(SEA.firing||punchDown) zomFireAt(SEA.aimX,SEA.aimY);
  punchEdge=false;
  // waves
  if(ZOM.zombies.length===0 && ZOM.spawnLeft===0){
    if(ZOM.betweenT>0){ ZOM.betweenT--; if(ZOM.betweenT===0) zomStartWave(); }
  }
  if(ZOM.spawnLeft>0){ ZOM.spawnT--;
    if(ZOM.spawnT<=0){ zomSpawn(); ZOM.spawnLeft--; ZOM.spawnT=Math.max(16,52-ZOM.wave*3); } }
  // zombies
  for(const zb of ZOM.zombies){
    if(zb.st==='walk'){
      zb.z-=zb.spd; zb.anim+=0.09+zb.spd*26; zb.hitT>0&&zb.hitT--;
      if(zb.z<=0.06){ zb.st='lunge'; zb.lungeT=0; }
    } else if(zb.st==='lunge'){
      zb.lungeT++;
      if(zb.lungeT===22){                                // the strike lands
        ZOM.lives--; ZOM.hurtT=22; addShake(7,14); noiseBurst(0.25,0.3,140); blip(200,50,0.3,'sawtooth',0.2);
        zb.st='die'; zb.dieT=0;                          // it spends itself in the lunge
        if(ZOM.lives<=0){ ZOM.over=true; ZOM.overT=0; }
      }
    } else if(zb.st==='die'){ zb.dieT++; }
  }
  ZOM.zombies=ZOM.zombies.filter(zb=>!(zb.st==='die'&&zb.dieT>60));
  if(ZOM.zombies.length===0 && ZOM.spawnLeft===0 && ZOM.betweenT===0) ZOM.betweenT=110;
  for(const p of SEA.puffs) p.ct++;
  SEA.puffs=SEA.puffs.filter(p=>p.ct<24);
}
function zomDrawBackdrop(){
  const bg=loaded[SECTIONS[sectionIndex].bgKey], hz=zomHorizonY();
  if(imgOk(bg)){ ctx.drawImage(bg,-4,-4,VW+8,VH+8); return; }
  const sky=ctx.createLinearGradient(0,0,0,hz);          // fallback: night moor + glowing portal
  sky.addColorStop(0,'#05060c'); sky.addColorStop(1,'#1a1430');
  ctx.fillStyle=sky; ctx.fillRect(0,0,VW,hz);
  const gnd=ctx.createLinearGradient(0,hz,0,VH);
  gnd.addColorStop(0,'#17201a'); gnd.addColorStop(1,'#060a07');
  ctx.fillStyle=gnd; ctx.fillRect(0,hz,VW,VH-hz);
}
function zomDrawZombie(zb){
  const g=zomGeom(zb), img=loaded[zb.k.img];
  const cl=zb.k.clips;
  let fr;
  if(zb.st==='walk') fr=cl.walk.start+Math.floor(zb.anim)%cl.walk.count;
  else if(zb.st==='lunge') fr=cl.lunge.start+Math.floor(zb.lungeT/8)%cl.lunge.count;
  else fr=cl.die.start+Math.min(cl.die.count-1,Math.floor(zb.dieT/9));
  ctx.save();
  if(zb.st==='die'&&zb.dieT>34) ctx.globalAlpha=Math.max(0,1-(zb.dieT-34)/26);
  if(imgOk(img)){
    if(zb.hitT>0){ ctx.filter='brightness(1.9)'; }       // white flash on hit
    ctx.drawImage(img, fr*zb.k.fw,0,zb.k.fw,zb.k.fh, g.x-g.dw/2, g.fy-g.dh, g.dw, g.dh);
    ctx.filter='none';
  } else {                                               // fallback silhouette
    ctx.fillStyle=zb.hitT>0?'#cfd6cc':'#39413a';
    ctx.fillRect(g.x-g.dw*0.22, g.fy-g.dh, g.dw*0.44, g.dh);
  }
  ctx.restore();
}
function zomDrawHud(){
  ctx.save();
  const L=SEA.leaveBtn;
  ctx.fillStyle='rgba(12,16,22,0.72)'; ctx.strokeStyle='rgba(200,210,220,0.5)'; ctx.lineWidth=1.5;
  ctx.beginPath(); ctx.roundRect(L.x,L.y,L.w,L.h,7); ctx.fill(); ctx.stroke();
  ctx.fillStyle='#eef2f6'; ctx.font='bold 15px system-ui,sans-serif'; ctx.textBaseline='middle';
  ctx.fillText('\u25C0 LEAVE', L.x+12, L.y+L.h/2+1);
  ctx.textAlign='center'; ctx.font='bold 17px system-ui,sans-serif';   // hearts top-centre
  let hearts=''; for(let i=0;i<3;i++) hearts+=(i<ZOM.lives?'\u2665 ':'\u2661 ');
  ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.fillText(hearts, VW/2+1, 30);
  ctx.fillStyle='#ff5f6d'; ctx.fillText(hearts, VW/2, 29);
  ctx.textAlign='right'; ctx.font='bold 18px system-ui,sans-serif';
  ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.fillText('SCORE '+ZOM.score, VW-23, 47);
  ctx.fillStyle='#ffe98a'; ctx.fillText('SCORE '+ZOM.score, VW-24, 46);
  ctx.font='12px system-ui,sans-serif'; ctx.fillStyle='rgba(235,240,245,0.85)';
  ctx.fillText('WAVE '+Math.max(1,ZOM.wave)+'  \u2022  KILLS '+ZOM.kills, VW-24, 64);
  ctx.textAlign='left'; ctx.textBaseline='alphabetic';
  if(SEA.t<210&&!ZOM.over){ ctx.globalAlpha=Math.max(0,1-(SEA.t-150)/60);
    ctx.fillStyle='#eef2f6'; ctx.font='13px system-ui,sans-serif'; ctx.textAlign='center';
    ctx.fillText('Stop them reaching you \u2022 JOYSTICK aims \u2022 HOLD to fire', VW/2, VH-16);
    ctx.textAlign='left'; ctx.globalAlpha=1; }
  ctx.restore();
}
function zomDraw(){
  ctx.clearRect(0,0,VW,VH); ctx.imageSmoothingEnabled=true;
  const kx=(Math.random()*2-1)*SEA.kick, ky=(Math.random()*2-1)*SEA.kick;
  ctx.save(); ctx.translate(kx,ky);
  zomDrawBackdrop();
  const zs=[...ZOM.zombies].sort((a,b)=>b.z-a.z);        // far ones first
  for(const zb of zs) zomDrawZombie(zb);
  for(const p of SEA.puffs) seaDrawPuff(p);
  seaDrawGun();
  ctx.restore();
  if(ZOM.hurtT>0){ ctx.fillStyle=`rgba(180,0,0,${0.42*ZOM.hurtT/22})`; ctx.fillRect(0,0,VW,VH); }
  if(ZOM.over){
    ctx.fillStyle='rgba(0,0,0,0.62)'; ctx.fillRect(0,0,VW,VH);
    ctx.textAlign='center'; ctx.fillStyle='#ff5f6d'; ctx.font='bold 40px system-ui,sans-serif';
    ctx.fillText('YOU DIED', VW/2, VH/2-16);
    ctx.fillStyle='#eef2f6'; ctx.font='bold 16px system-ui,sans-serif';
    ctx.fillText('WAVE '+ZOM.wave+'  \u2022  KILLS '+ZOM.kills+'  \u2022  SCORE '+ZOM.score, VW/2, VH/2+14);
    if(ZOM.overT>45){ ctx.font='13px system-ui,sans-serif'; ctx.fillStyle='rgba(235,240,245,0.9)';
      ctx.fillText('tap to return to the hub', VW/2, VH/2+40); }
    ctx.textAlign='left';
  } else {
    seaDrawReticle(SEA.aimX,SEA.aimY);
  }
  zomDrawHud();
}

/* ── UPDATE / DRAW / LOOP ────────────────────────────────── */
function update(){
  if(csActive||transitioning||shopOpen||travelOpen)return;
  if(SECTIONS[sectionIndex].sea){ seaUpdate(); updateProxAudio(); return; }   // THE SEA shooting gallery
  if(SECTIONS[sectionIndex].zdef){ zomUpdate(); updateProxAudio(); return; }  // ZOMBIES wave defence
  // (updateProxAudio in these modes keeps fading out / silencing audio carried in
  //  from the previous room — e.g. hub walkers heard next to the portal/station)
  if(player.hurtCool>0) player.hurtCool--;
  if(player.invincibleT>0) player.invincibleT--;
  updateDoors();
  updateTV();
  updateJukebox();
  updateGraffiti();
  updateRain();

  if(player.dead){
    player.ct++; player.vy+=GRAV; player.y+=player.vy;
    const g=groundAt(player.x+PW/2); if(player.y+PH>=g){player.y=g-PH;player.vy=0;}
    player.deadT++; if(player.deadT>210){ respawnPlayer(); }   // long enough to read the death card
    updateEnemies(); updateHelper(); return;
  }

  if(shootCool>0) shootCool--;
  const armed=isArmed();
  if(punchEdge){
    punchEdge=false;
    if(jukeHot){ jukeNext(); }
    else if(tvHot){ tvNextChannel(); }
    else if(activeDoor){ useDoor(activeDoor); }
    else if(armed){ tryFire(); }
    else if(player.onGround){
      if(!playerAttacking()){ setClip('punch'); player.attackId++; sfxPunch(); }
      else if(player.clip==='punch'){ setClip('headbutt'); player.attackId++; sfxPunch(); }
    }
  }
  if(armed && punchDown && !activeDoor && !tvHot && !jukeHot){ const w=curWeapon(); if(w&&w.auto) tryFire(); }
  const attacking=playerAttacking() && !clipDone();

  let moving=false;
  if(!attacking){
    if(keys.left&&!keys.right){player.face=-1;moving=true;}
    else if(keys.right&&!keys.left){player.face=1;moving=true;}
  }
  runHold = moving ? Math.min(runHold+1,60) : 0;
  const running = moving && runHold>28;
  // per-section walk multiplier: low-zoom rooms (e.g. Cottagers/Library) move slowly on
  // screen (on-screen speed = SPEED*ZOOM), so `walkMul` compensates so they don't feel sluggish.
  const walkMul = SECTIONS[sectionIndex].walkMul || 1;
  player.vx = attacking ? 0 : (moving ? player.face*(running?RUNSPEED:SPEED)*walkMul : 0);

  const inWater = !!SECTIONS[sectionIndex].water;
  if(inWater){
    // SWIM: JUMP is an upward stroke (no ground needed); gentle buoyant sink, capped + drag.
    if(keys.jump && !attacking && (player.swimCd||0)<=0){ player.vy=SWIM; player.swimCd=12; sfxJump(); }
    if(player.swimCd>0) player.swimCd--;
    player.vy += GRAV*0.10;            // weak gravity underwater
    player.vy *= 0.94;                 // water drag
    if(player.vy>1.7) player.vy=1.7;   // slow terminal sink
    player.x += player.vx*0.7;         // a touch slower side-to-side in water
    player.y += player.vy;
    player.x=Math.max(0,Math.min(BGW-PW,player.x));
    if(player.y<0){ player.y=0; if(player.vy<0) player.vy=0; }
    const gw=groundAt(player.x+PW/2);
    if(player.y+PH>=gw){ player.y=gw-PH; if(player.vy>0) player.vy=0; player.onGround=true; } else player.onGround=false;
    if(player.ct%6===0){            // rising bubbles trailing the swimmer
      vfx.push({type:'bubble', x:player.x+PW*0.25+Math.random()*PW*0.5, y:player.y+PH*0.35+Math.random()*PH*0.4,
                t:0, life:42+Math.floor(Math.random()*28), r:1.4+Math.random()*2.6, vx:(Math.random()-0.5)*0.3, vy:-(0.5+Math.random()*0.8)});
    }
  } else {
    if(keys.jump&&player.onGround&&!attacking){player.vy=JUMP;player.onGround=false;sfxJump();}
    player.vy+=GRAV;player.x+=player.vx;player.y+=player.vy;
    player.x=Math.max(0,Math.min(BGW-PW,player.x));
    const g=groundAt(player.x+PW/2);
    if(player.y+PH>=g){player.y=g-PH;player.vy=0;player.onGround=true;}
  }

  player.ct++;
  if(player.shootPoseT>0) player.shootPoseT--;
  const stillAttacking = playerAttacking() && !clipDone();
  if(stillAttacking) applyPlayerHits();
  const shootingPose = player.shootPoseT>0 && CLIPS.shoot;
  if(!stillAttacking && !shootingPose){
    if(!player.onGround) setClip('jump');
    else if(moving) setClip(running?'run':'walk');
    else setClip('idle');
  } else if(shootingPose && player.clip!=='shoot'){ setClip('shoot'); }

  updateEnemies();
  arenaUpdate();          // the Void's endless-wave spawner (no-op everywhere else)
  updateHelper();
  updateBullets();
  updateEnemyBullets();
  updateVfx();
  updateBlood();
  updateNPC();
  updateBikini();
  updateDog();
  updateWar();
  updateHubNpcs();
  updateChurchNpc();
  updateLibraryNpc();
  updateMkNpcs();
  updateScenery();
  updateItems();
  updateDrops();
  updateUfo();
  updateWanderer();
  updatePickup();
  updateFloaters();
  updateProxAudio();
  sceneUpdate();

  // section edges: chained levels advance to the right; running off the LEFT returns to the hub
  if(SECTIONS[sectionIndex].chain){
    if(player.x>BGW-PW-40 && !isArena()){           // the arena never "ends" off the right edge
      if(!bannerShown){ bannerShown=true; nextSection(); }
    } else if(player.x<=2 && keys.left && !transitioning){
      returnToHub();
    } else if(bannerShown && player.x < BGW-PW-120){ bannerShown=false; }
  }
  // interior rooms flagged `exitLeft`/`exitRight`: just walk off that edge to leave.
  // Each value is either a section-id string (land at the default hub-return spot) or
  // an object {target, x, face} to land at a specific spot in the destination level.
  const curSec=SECTIONS[sectionIndex];
  if(curSec.exitLeft && player.x<=2 && keys.left && !transitioning) exitVia(curSec.exitLeft);
  if(curSec.exitRight && player.x>=BGW-PW-2 && keys.right && !transitioning) exitVia(curSec.exitRight);
}
function exitVia(spec){
  const tgt  = (typeof spec==='string') ? spec : spec.target;
  const dest = SECTIONS.find(s=>s.id===tgt);
  const x    = (typeof spec==='object' && typeof spec.x==='number')    ? spec.x    : hubReturnX;
  const face = (typeof spec==='object' && typeof spec.face==='number') ? spec.face : 1;
  transitioning=true;
  doFade(dest?dest.name:'Out to the street', ()=>{ gotoId(tgt,{x,face}); transitioning=false; });
}
function frameIndex(){
  const c=CLIPS[player.clip];
  let f=Math.floor(player.ct*c.fps/60);
  f = c.loop ? (f%c.count) : Math.min(f,c.count-1);
  return c.start+f;
}
function drawBg(){
  const sec=SECTIONS[sectionIndex];
  if(sec.black){ ctx.fillStyle='#000'; ctx.fillRect(0,0,VW,VH); drawSceneVideos(); return; }
  if(sec.bgSegments){
    let anyDrawn=false;
    for(const seg of sec.bgSegments){
      const segL=seg.x, segR=seg.x+seg.w;
      const left=Math.max(segL,camX), right=Math.min(segR,camX+SRCW);
      if(right<=left) continue;
      const im=loaded[seg.key]; if(!imgOk(im)) continue;
      const srcX=left-segL, srcW=right-left;
      const dstX=(left-camX)*ZOOM, dstW=srcW*ZOOM;
      try{ ctx.drawImage(im, srcX, SRCY, srcW, SRCH, dstX, 0, dstW, VH); anyDrawn=true; }catch(e){}
    }
    if(!anyDrawn) drawNoBg();
    return;
  }
  const bgKey=sec.bgKey;
  if(imgOk(loaded[bgKey])){ const bs=BGSCALE; try{ ctx.drawImage(loaded[bgKey],camX*bs,SRCY*bs,SRCW*bs,SRCH*bs,0,0,VW,VH); }catch(e){ drawNoBg(); } } else drawNoBg();
}
function drawWater(){
  if(!SECTIONS[sectionIndex].water) return;
  ctx.save();
  const g=ctx.createLinearGradient(0,0,0,VH);          // blue depth tint, darker toward the bottom
  g.addColorStop(0,'rgba(34,96,150,0.28)');
  g.addColorStop(1,'rgba(6,28,58,0.55)');
  ctx.fillStyle=g; ctx.fillRect(0,0,VW,VH);
  ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=0.05;   // slow shimmering caustic lines
  const t=performance.now()/1000;
  ctx.strokeStyle='#cdecff'; ctx.lineWidth=2;
  for(let i=0;i<6;i++){
    const baseY=(i/6)*VH + ((t*18)%(VH/6));
    ctx.beginPath();
    for(let x=0;x<=VW;x+=40){ const yy=baseY+Math.sin(x/90+t*1.4+i)*8; if(x===0) ctx.moveTo(x,yy); else ctx.lineTo(x,yy); }
    ctx.stroke();
  }
  ctx.restore();
}
function draw(){
  if(SECTIONS[sectionIndex].sea){ seaDraw(); return; }      // THE SEA shooting gallery
  if(SECTIONS[sectionIndex].zdef){ zomDraw(); return; }     // ZOMBIES wave defence
  const dsec=SECTIONS[sectionIndex];
  if(dsec.flip){
    const cfg=curSceneCfg(); const panelW=(cfg&&cfg.tileW)||SRCW;
    const pi=Math.max(0,Math.floor((player.x+PW/2)/panelW));
    camX=Math.max(0,Math.min(BGW-SRCW,pi*panelW));
  } else {
    camX=player.x+PW/2-SRCW/2; camX=Math.max(0,Math.min(BGW-SRCW,camX));
  }
  ctx.clearRect(0,0,VW,VH); ctx.imageSmoothingEnabled=true;
  let _shaking=false;
  if(shakeT>0){ const k=shakeT/Math.max(1,shakeDur), m=shakeMag*k;
    ctx.save(); ctx.translate(Math.round((Math.random()*2-1)*m), Math.round((Math.random()*2-1)*m)); _shaking=true; shakeT--; }
  drawBg();
  drawScenery();   // decorative background NPCs (dancers/couples) — drawn behind everything
  drawGraffiti();  // reactive wall art
  drawRaveSmoke(); // DnB / Hip-Hop room: coloured haze behind the action
  drawJukeGlow();  // Winchester: soft pulsing halo around the jukebox
  drawGlows();     // ambient candle / neon / lamp glows across rooms (GLOWS table)

  drawTV();

  drawUfo();
  drawWanderer();
  drawPickup();
  drawItems();
  drawDrops();
  for(const e of enemies) drawEnemy(e);
  drawNPC();
  drawBikini();
  drawDog();
  drawWarLights();
  drawHubNpcs();
  drawChurchNpc();
  drawLibraryNpc();
  drawMkNpcs();
  drawHelper(); crewDraw();

  const fx=frameIndex();
  const cs=(cur&&cur.scale)||1; const dw=PW*ZOOM*CSCALE*cs,dh=PH*ZOOM*CSCALE*cs;
  const sx=(player.x-camX)*ZOOM-(dw-PW*ZOOM)/2,sy=(player.y+PH-SRCY)*ZOOM-dh;
  if(player.invincibleT>0){
    ctx.save(); ctx.globalCompositeOperation='lighter';
    const t=performance.now()/300, r=(38+7*Math.sin(t))*ZOOM;
    const g=ctx.createRadialGradient(sx+dw/2,sy+dh/2,0,sx+dw/2,sy+dh/2,Math.max(1,r));
    g.addColorStop(0,'rgba(255,230,120,0.55)'); g.addColorStop(1,'rgba(255,230,120,0)');
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(sx+dw/2,sy+dh/2,Math.max(1,r),0,7); ctx.fill();
    ctx.restore();
  }
  if(imgOk(loaded[cur.id])){
    ctx.save();
    if(player.face<0){ctx.translate(sx+dw,sy);ctx.scale(-1,1);}else{ctx.translate(sx,sy);}
    if(player.hurtCool>0 && (player.hurtCool>>1)%2===0) ctx.globalAlpha=0.55;
    ctx.shadowColor='rgba(150,180,255,0.55)';ctx.shadowBlur=7;
    try{ ctx.drawImage(loaded[cur.id],fx*FW,0,FW,FH,0,0,dw,dh); }catch(e){}
    ctx.restore();
  } else { ctx.fillStyle='#c0392b'; ctx.fillRect(sx,sy,dw,dh); }

  drawHeldWeapon();
  drawBullets();
  drawEnemyBullets();
  drawVfx();
  drawBlood();
  drawWater();        // water levels (The Shitter): blue depth tint + drifting caustics over the scene
  drawRain();         // Glasgow: rain + wind overlay
  drawDoors();
  drawTVMarker();
  drawJukeMarker();
  drawRaveLights();   // DnB room: sweeping laser fan + strobe, over the action
  drawFloaters();
  drawArenaHud();         // WAVE / SCORE / leaderboard (only shows in the arena)
  if(_shaking) ctx.restore();
}
function drawNoBg(){
  const sec=SECTIONS[sectionIndex];
  if(sec.interior){ ctx.fillStyle='#15110c'; ctx.fillRect(0,0,VW,VH); ctx.fillStyle='#241c14'; ctx.fillRect(0,VH*0.72,VW,VH-VH*0.72); return; }
  if(sec.flatGround!=null){ drawParkPlaceholder(); }
  else {
    ctx.fillStyle='#0c0d10'; ctx.fillRect(0,0,VW,VH);
    ctx.fillStyle='#3a3d44'; ctx.fillRect(0,VH*0.78,VW,VH);
  }
}
function pr(n){ const s=Math.sin(n*127.1)*43758.5453; return s-Math.floor(s); }
function drawParkPlaceholder(){
  const sec=SECTIONS[sectionIndex];
  const gY=(sec.flatGround/SRCH)*VH;
  const sky=ctx.createLinearGradient(0,0,0,gY);
  sky.addColorStop(0,'#1a1d24'); sky.addColorStop(1,'#2b2f38');
  ctx.fillStyle=sky; ctx.fillRect(0,0,VW,gY);
  const par=camX*0.35;
  ctx.fillStyle='#23262e';
  for(let i=-1;i<24;i++){
    const seed=i*3+1, bx=i*120-(par%120), bw=70+pr(seed)*46, bh=60+pr(seed+9)*90;
    ctx.fillRect(bx,gY-bh,bw,bh);
  }
  const hx=(BGW*0.5-camX);
  if(hx>-260 && hx<VW+260){
    const hw=240, hh=gY*0.92, hxx=hx-hw/2;
    ctx.fillStyle='#3a2a22'; ctx.fillRect(hxx,gY-hh,hw,hh);
    ctx.fillStyle='#caa15a';
    for(let r=0;r<5;r++)for(let c=0;c<4;c++){ if(pr(r*7+c)>0.45) ctx.fillRect(hxx+18+c*54,gY-hh+22+r*34,26,20); }
    ctx.fillStyle='#7a1f25'; ctx.fillRect(hxx+hw-26,gY-hh+10,16,hh*0.6);
  }
  ctx.fillStyle='#243126'; ctx.fillRect(0,gY-VH*0.16,VW,VH*0.16);
  ctx.strokeStyle='#15171c'; ctx.lineWidth=3;
  const railTop=gY-VH*0.13;
  ctx.beginPath(); ctx.moveTo(0,railTop); ctx.lineTo(VW,railTop); ctx.stroke();
  for(let x=-(camX%26); x<VW; x+=26){ ctx.beginPath(); ctx.moveTo(x,railTop); ctx.lineTo(x,gY); ctx.stroke(); }
  for(let i=0;i<60;i++){
    const tx=i*150+40-camX; if(tx<-60||tx>VW+60) continue;
    const ty=gY-VH*0.13, th=VH*0.34;
    ctx.fillStyle='#2c241c'; ctx.fillRect(tx-4,ty-th*0.4,8,th*0.4);
    ctx.fillStyle='#1f3322'; ctx.beginPath(); ctx.arc(tx,ty-th*0.5,VH*0.12,0,7); ctx.fill();
  }
  ctx.fillStyle='#3a3d44'; ctx.fillRect(0,gY,VW,VH-gY);
  ctx.strokeStyle='#2c2f36'; ctx.lineWidth=1;
  for(let x=-(camX%48); x<VW; x+=48){ ctx.beginPath(); ctx.moveTo(x,gY); ctx.lineTo(x,VH); ctx.stroke(); }
}
/* ── XBOX / PC GAMEPAD ────────────────────────────────────────────────────
   Standard-mapping controller support (Xbox/PS/generic) via the Gamepad API.
   Left stick or D-pad = move, A = jump, B or Right-Trigger = strike/shoot,
   X or Y = cycle weapon, Start = pause. It drives the very same input flags
   the touch buttons and keyboard use, so nothing else in the game changes.
   Polled once per rendered frame from loop(). Helpers stay on the touch bar. */
const _gpPrev={};
function pollGamepad(){
  let pads=null;
  try{ pads = navigator.getGamepads ? navigator.getGamepads() : null; }catch(_){ return; }
  if(!pads) return;
  let gp=null; for(const p of pads){ if(p && p.connected!==false){ gp=p; break; } }
  if(!gp) return;
  const B=gp.buttons||[], ax=gp.axes||[];
  const down=i=>!!(B[i] && (B[i].pressed || B[i].value>0.5));
  const edge=i=>{ const d=down(i), was=!!_gpPrev[i]; _gpPrev[i]=d; return d && !was; };
  const DZ=0.35;
  const lx=ax[0]||0, ly=ax[1]||0;
  const wantLeft  = lx<-DZ || down(14);        // 14 = D-pad left
  const wantRight = lx> DZ || down(15);        // 15 = D-pad right
  keys.left  = wantLeft  && !wantRight;
  keys.right = wantRight && !wantLeft;
  keys.jump  = down(0) || down(12) || ly<-0.55; // A, D-pad up, or stick up
  // strike / shoot: mirror the punch-key edge logic exactly (B or Right-Trigger)
  const strike = down(1) || down(7);
  if(strike && !_gpPrev._strike){ if(!punchDown){ punchDown=true; punchEdge=true; } }
  else if(!strike && _gpPrev._strike){ punchDown=false; }
  _gpPrev._strike=strike;
  if((edge(2)||edge(3)) && cur && !csActive){ cycleWeapon(); }  // X / Y = cycle weapon
  if(edge(9)){ setPaused(!paused); }                            // Start = pause
}

/* ── FRAME-RATE-INDEPENDENT MAIN LOOP ─────────────────────────────────────
   The simulation (update) is tuned for 60Hz. On 120Hz/144Hz screens (many
   Android tablets/phones) running update() once per animation frame makes the
   whole game run 2x+ too fast. This fixed-timestep loop advances the logic in
   fixed 1/60s steps off a real wall-clock accumulator, so movement, gravity
   and timers run at the SAME speed on every device, while draw() still runs
   once per rendered frame for smooth visuals. */
let _loopLast=0, _loopAcc=0;
const FIXED_STEP=1000/60;
function loop(ts){
  raf=requestAnimationFrame(loop);
  if(ts===undefined){ _loopLast=0; return; }   // first kick (loop() called with no timestamp)
  if(_loopLast===0) _loopLast=ts;
  let dt=ts-_loopLast; _loopLast=ts;
  if(dt>250) dt=250;                            // backgrounded/stalled: don't fast-forward a huge burst
  pollGamepad();
  if(!paused){
    _loopAcc+=dt;
    let steps=0;
    while(_loopAcc>=FIXED_STEP && steps<5){ update(); _loopAcc-=FIXED_STEP; steps++; }  // cap catch-up
  } else { _loopAcc=0; }
  draw();
}

/* ── THE VOID — endless wave arena + score + local leaderboard ─────────────
   Any section with `arena:true` becomes a survival arena: waves of enemies
   spawn around the player; clear one and a tougher wave arrives, forever.
   Each wave raises enemy HP, speed and contact damage, and (later waves) widens
   the spawn pool. Score banks per kill (more per wave). Top runs are saved on
   THIS DEVICE via localStorage (no server) and shown when you fall.
   >>> Add your future tougher enemy kinds to arenaPool(), gated behind a higher
       wave number, so they only start appearing once the early waves are dead. */
let arenaActive=false, arenaWave=0, arenaScore=0, arenaGrace=0, arenaScored=false;
function isArena(){ return !!SECTIONS[sectionIndex].arena; }
function arenaPool(){
  // Each arena section can define its OWN wave mix via `arenaPool` in data.js; otherwise
  // it falls back to the Void's roughly-even mix of every melee/ground enemy.
  // (the every-5th "boss" wave uses arenaSpecial instead — see arenaNextWave.)
  const s=SECTIONS[sectionIndex];
  return s.arenaPool || [0,2,3,4,5,7,9,12];   // (kind 1, the clown, removed from the game)
}
function arenaEnter(){
  arenaActive=true; arenaWave=0; arenaScore=0; arenaGrace=0; arenaScored=false;
  enemies=[]; bullets=[]; vfx=[]; enemyBullets=[]; drops=[];
  arenaNextWave();
}
function arenaNextWave(){
  arenaWave++;
  const w=arenaWave;
  const s=SECTIONS[sectionIndex];
  const bossMode = !!s.arenaBossMode;                      // BOSS MODE: every wave is a special squad
  const bossWave = bossMode || (w%5===0);                  // a "boss" round (special enemies)
  const heal = bossMode ? (w%3===0) : (w%5===0);           // health top-up: every 3rd wave in boss mode, else every 5th
  if(heal){
    player.hp=player.max; document.getElementById('hpbar').style.width='100%';
    addFloater(player.x+PW/2, player.y, 'FULL HEALTH');
  }
  const spd=ESPEED*(1+(w-1)*0.05);                         // a touch faster each wave
  const dmg=EDMG+(w-1)*2;                                  // hits harder each wave
  let kinds, count, hp, bossName=s.arenaSpecialName||'UFO ASSAULT';
  if(bossMode){
    const seq=s.arenaBossSequence||[{kind:10,name:'GUNMAN SQUAD'},{kind:8,name:'UFO ASSAULT'},{kind:16,name:'GUNBOT SQUAD'}];
    const item=seq[(w-1)%seq.length];                      // cycle through the squads, escalating
    kinds=[item.kind]; bossName=item.name;
    count=Math.min(s.arenaMaxCount||14, (s.arenaBaseCount||4)+Math.floor((w-1)*(s.arenaGrowth||0.8)));
    hp=Math.round((s.arenaSpecialHp||150)*(1+(w-1)*0.22));
  } else if(w%5===0){
    const special = (s.arenaSpecial!=null) ? s.arenaSpecial : 8;   // default: UFO gunship (kind 8)
    kinds=[special];                                       // ONLY this map's special enemy
    count=Math.min(s.arenaSpecialMax||16, Math.round((s.arenaSpecialBase||4) + (w/5 - 1)*1.5));
    hp=Math.round((s.arenaSpecialHp||220)*(1+(w/5-1)*0.6));       // very tanky, tougher each boss round
  } else {
    kinds=arenaPool();                                     // this map's normal wave mix
    count=Math.min(s.arenaMaxCount||50, (s.arenaBaseCount||18)+Math.floor(w*(s.arenaGrowth||3)));
    hp=Math.round(40*(1+(w-1)*0.40));                      // tougher each wave
  }
  // build a bag with roughly equal numbers of each kind, then shuffle it
  const bag=[];
  for(let i=0;i<count;i++) bag.push(kinds[i % kinds.length]);
  for(let i=bag.length-1;i>0;i--){ const j=(Math.random()*(i+1))|0; const t=bag[i]; bag[i]=bag[j]; bag[j]=t; }
  const lo=200, hi=BGW-200;                                // spread across the entire level width
  for(let i=0;i<count;i++){
    const kind=bag[i];
    let at = lo + (hi-lo)*((i+Math.random())/count);       // evenly spaced with jitter, whole map
    if(Math.abs(at-player.x)<260) at += (at<player.x?-1:1)*320;  // never spawn right on top of you
    at=Math.max(40,Math.min(BGW-60,at));
    const e=pushEnemy(kind, at, null, {hp});
    if(e){ e.spd=spd; e.dmg=dmg; }
  }
  flashBanner(bossWave ? ('WAVE '+w+' \u2014 '+bossName) : ('WAVE '+w));
  blip(420,640,0.12,'square',0.14);
}
function arenaUpdate(){
  if(!arenaActive||player.dead) return;
  if(enemies.length>0){ arenaGrace=70; return; }   // still fighting this wave
  if(arenaGrace>0){ arenaGrace--; return; }         // ~1.2s breather between waves
  arenaNextWave();
}
function arenaAddKillScore(){
  if(!arenaActive) return;
  arenaScore += 10 + arenaWave*5;
}
function arenaScoreKey(){ return 'arena_'+SECTIONS[sectionIndex].id; }   // each arena keeps its own local top-runs board
function arenaLoadScores(){ try{ return JSON.parse(localStorage.getItem(arenaScoreKey())||'[]'); }catch(_){ return []; } }
function arenaBest(){ const s=arenaLoadScores(); return s.length?s[0].score:0; }
function arenaBankScore(){
  if(arenaScored) return; arenaScored=true;
  if(arenaScore<=0) return;
  let s=arenaLoadScores();
  s.push({score:arenaScore, wave:arenaWave, t:Date.now()});
  s.sort((a,b)=>b.score-a.score); s=s.slice(0,10);
  try{ localStorage.setItem(arenaScoreKey(), JSON.stringify(s)); }catch(_){}
}
function drawArenaHud(){
  if(!isArena()) return;
  ctx.save();
  // dark backing panel so the stats read clearly over the bright moon, and clear of the screen edge
  const px=14, py=70, pw=150, ph=66;
  ctx.globalAlpha=0.62; ctx.fillStyle='#05070c'; roundRect(px,py,pw,ph,10); ctx.fill();
  ctx.globalAlpha=1; ctx.lineWidth=1.5; ctx.strokeStyle='rgba(255,211,77,0.55)'; roundRect(px,py,pw,ph,10); ctx.stroke();
  ctx.textAlign='left'; ctx.lineWidth=3; ctx.strokeStyle='#000';
  const tx=px+14, y=py+22;
  ctx.font='900 16px monospace';
  ctx.strokeText('WAVE '+arenaWave,tx,y);      ctx.fillStyle='#9fe0ff'; ctx.fillText('WAVE '+arenaWave,tx,y);
  ctx.strokeText('SCORE '+arenaScore,tx,y+20); ctx.fillStyle='#ffe46b'; ctx.fillText('SCORE '+arenaScore,tx,y+20);
  ctx.font='700 11px monospace';
  const best=Math.max(arenaBest(),arenaScore);
  ctx.strokeText('BEST '+best,tx,y+37);        ctx.fillStyle='#cdd6e6'; ctx.fillText('BEST '+best,tx,y+37);
  ctx.restore();
  if(player.dead) drawArenaBoard();
}
function drawArenaBoard(){
  const s=arenaLoadScores().slice(0,5);
  const bw=300, bh=44+Math.max(1,s.length)*22+24, bx=(VW-bw)/2, by=66;
  ctx.save();
  ctx.globalAlpha=0.93; ctx.fillStyle='#0b0e14'; roundRect(bx,by,bw,bh,12); ctx.fill();
  ctx.globalAlpha=1; ctx.lineWidth=2; ctx.strokeStyle='#ffd34d'; roundRect(bx,by,bw,bh,12); ctx.stroke();
  ctx.textAlign='center'; ctx.fillStyle='#ffe46b'; ctx.font='900 15px sans-serif';
  const boardTitle=(SECTIONS[sectionIndex].name||'ARENA').replace(/&mdash;/g,'\u2014').replace(/&amp;/g,'&').toUpperCase();
  ctx.fillText(boardTitle+' \u2014 TOP RUNS', bx+bw/2, by+24);
  ctx.font='800 13px monospace'; ctx.textAlign='left';
  if(s.length===0){ ctx.textAlign='center'; ctx.fillStyle='#cdd6e6'; ctx.fillText('No runs banked yet', bx+bw/2, by+50); }
  for(let i=0;i<s.length;i++){
    const r=s[i], yy=by+46+i*22;
    ctx.fillStyle=(r.score===arenaScore)?'#7dffb0':'#cdd6e6';
    ctx.fillText((i+1)+'.', bx+18, yy);
    ctx.fillText(String(r.score), bx+48, yy);
    ctx.fillText('wave '+r.wave, bx+158, yy);
  }
  ctx.textAlign='center'; ctx.fillStyle='#9fe0ff'; ctx.font='700 11px monospace';
  ctx.fillText('respawning\u2026', bx+bw/2, by+bh-9);
  ctx.restore();
}
loadProgress();   // restore money / weapons / unlocks from the last session
loadStats();      // restore lifetime records for the Records screen

/* wall.mp4 is the heaviest scene clip and stalls the first time you enter The Void;
   warm it (and its floor) in the background on the first user gesture so it's buffered
   by the time you get there. */
(function(){
  let warmed=false;
  const warm=()=>{ if(warmed) return; warmed=true;
    try{ sceneVidFor('wall.mp4'); sceneVidFor('floor.mp4'); }catch(_){}
    document.removeEventListener('pointerdown', warm);
  };
  document.addEventListener('pointerdown', warm, {passive:true, once:false});
})();
