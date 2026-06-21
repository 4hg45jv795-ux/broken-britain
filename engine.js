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
function loadSectionConfig(){
  const s=SECTIONS[sectionIndex];
  SRCY=s.srcY; BGW=s.BGW; CSCALE=s.charScale||1;
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
ASSETS.forEach(a=>{
  const im=new Image();
  im.onload=onLoad;
  im.onerror=()=>{ if(!a.optional) failed.push(a.src); console.warn('[EnoughIsEnough] failed to load:',a.src); onLoad(); };
  im.src=a.src;
  loaded[a.key]=im;
});
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

function buildCards(){
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
const player={x:120,y:200,vx:0,vy:0,face:1,onGround:true,clip:'idle',ct:0,hp:100,max:100,dead:false,deadT:0,attackId:0,hurtCool:0,armour:0};
const keys={left:false,right:false,jump:false};
let punchDown=false,punchEdge=false,runHold=0;
function setClip(name){ if(player.clip!==name){player.clip=name;player.ct=0;} }
function clipDone(){ const c=CLIPS[player.clip]; return !c.loop && player.ct>=Math.ceil(c.count*60/c.fps); }
function playerAttacking(){ return player.clip==='punch'||player.clip==='headbutt'; }
const SPEED=2.1,RUNSPEED=3.4,GRAV=0.55,JUMP=-9.6;
let bannerShown=false;

/* ── ENEMIES ─────────────────────────────────────────────── */
/* enemy strip layout (single horizontal row, uniform FWxFH cells):
   walk frames first (start:0), then die frames last.              */
const ENEMY_KINDS=[
  {img:'police', fw:167, fh:130, color:'#d8e23a', hair:'#1a2233',
   clips:{walk:{start:0,count:6,fps:9,loop:true}, die:{start:6,count:1,fps:6,loop:false}}},
  {img:'clown', fw:109, fh:130, color:'#e8c43a', hair:'#2f8a3a',
   clips:{walk:{start:0,count:5,fps:9,loop:true}, die:{start:5,count:1,fps:6,loop:false}}},
  {img:'alien', fw:71, fh:142, color:'#83a86a', hair:'#41603a',
   clips:{walk:{start:0,count:8,fps:10,loop:true}, die:{start:8,count:6,fps:11,loop:false}}},
  {img:'geezer', fw:63, fh:160, color:'#2f3238', hair:'#7a4a26',
   clips:{walk:{start:0,count:7,fps:9,loop:true}, die:{start:7,count:4,fps:8,loop:false}}},
  {img:'knifeman', fw:89, fh:151, color:'#3a5a8a', hair:'#241712',
   clips:{walk:{start:0,count:8,fps:9,loop:true}, die:{start:8,count:6,fps:10,loop:false}}},
  {img:'deliveroo', fw:134, fh:120, color:'#2c2f36', hair:'#101216',
   clips:{walk:{start:0,count:6,fps:12,loop:true}, die:{start:6,count:4,fps:9,loop:false}}},
  {img:'bikeboy', fw:175, fh:130, color:'#8a8f96', hair:'#2a2622',
   clips:{walk:{start:0,count:2,fps:3,loop:true}, die:{start:2,count:2,fps:6,loop:false}}},
  {img:'ufo', fw:119, fh:90, hover:34, color:'#bfe4ff', hair:'#3a5a8a',
   clips:{walk:{start:0,count:8,fps:10,loop:true}, die:{start:0,count:1,fps:6,loop:false}}},
  // 8 = BOSS MAN: big, very tanky, SHOOTS fireballs at the player (appears in the MK level).
  // Single static frame for now (re-export a walk/die strip later and bump the counts).
  {img:'bossman', fw:103, fh:84, scale:1.9, shooter:true, shotDmg:16, color:'#c64a4a', hair:'#8aa0b8',
   clips:{walk:{start:0,count:1,fps:1,loop:true}, die:{start:0,count:1,fps:2,loop:false}}},
];
const EH=78;
let enemies=[];
const killedEnemies=new Set();          // ids of enemies killed this playthrough (don't respawn)
function pushEnemy(kind,at,id,opts){
  const k=ENEMY_KINDS[kind]; const sc=k.scale||1; const h=Math.round(EH*sc); const w=Math.round(h*k.fw/k.fh);
  const hp=(opts&&opts.hp)||40;
  const e={kind, x:at, w, h, y:0, vx:0, face:-1, id:id||null, static:!!(opts&&opts.static),
    hp, max:hp, state:'walk', ct:0, hitId:-1, dmgCool:0, fade:1, fireCd:80+Math.floor(Math.random()*60)};
  enemies.push(e); return e;            // returned so the arena can scale its speed/damage
}
function spawnEnemiesForSection(){
  if(SECTIONS[sectionIndex].arena){ arenaEnter(); return; }   // arena sections run their own wave spawner
  arenaActive=false;                                          // any normal section leaves the arena
  enemies=[]; enemyBullets=[];
  SECTIONS[sectionIndex].enemies.forEach((e,i)=>{ const id=sectionIndex+'-e'+i; if(!killedEnemies.has(id)) pushEnemy(e.kind, e.at, id, e); });
  if(SECTIONS[sectionIndex].id==='park' && parkInvaded) spawnParkAliens();
}
function spawnParkAliens(){
  const a=SECTIONS[sectionIndex].aliens; if(!a) return;
  a.forEach((x,i)=>{ const id=sectionIndex+'-a'+i; if(!killedEnemies.has(id)) pushEnemy(x.kind, x.at, id); });
}
const ESPEED=1.05, EAGGRO=560, EHIT_RANGE=42, EDMG=8;
function enemyClipDone(e){ const c=ENEMY_KINDS[e.kind].clips.die; return e.ct>=Math.ceil(c.count*60/c.fps); }
function killEnemy(e,ko){ if(e.state==='die'||e.state==='dead')return; e.state='die'; e.ct=0; (ko?sfxKO:sfxHit)();
  const reward=e.static?25:10; addMoney(reward); addFloater(e.x+e.w/2, e.y, '+\u00A3'+reward); arenaAddKillScore(); }
function updateEnemies(){
  for(const e of enemies){
    e.y=groundAt(e.x+e.w/2)-e.h-(ENEMY_KINDS[e.kind].hover||0);
    if(e.state==='dead') continue;
    if(e.state==='die'){ e.ct++; if(enemyClipDone(e)){ e.state='dead'; if(e.id) killedEnemies.add(e.id); } continue; }
    // walking / chasing the player
    const dx=(player.x+PW/2)-(e.x+e.w/2);
    e.face = dx>0?1:-1;
    if(!player.dead && Math.abs(dx)<EAGGRO && Math.abs(dx)>EHIT_RANGE){
      if(!e.static) e.x += e.face*(e.spd||ESPEED); e.ct++;
    } else { e.ct++; }
    e.x=Math.max(0,Math.min(BGW-e.w,e.x));
    // contact damage to player
    if(e.dmgCool>0) e.dmgCool--;
    if(!e.static && !player.dead && Math.abs(dx)<EHIT_RANGE+6 && e.dmgCool<=0){
      damagePlayer(e.dmg||EDMG); e.dmgCool=70;
      player.x += (dx>0?-10:10); // knockback
    }
    // shooter enemies (e.g. Boss Man) lob fireballs at the player from a distance
    if(ENEMY_KINDS[e.kind].shooter && !player.dead){
      if(e.fireCd>0) e.fireCd--;
      if(e.fireCd<=0 && Math.abs(dx)<900){ enemyFire(e); e.fireCd=70+Math.floor(Math.random()*50); }
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
    let clip = e.state==='die'?k.clips.die:k.clips.walk;
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

/* ── ENEMY PROJECTILES: fireballs thrown by shooter enemies like Boss Man ── */
let enemyBullets=[];
function enemyFire(e){
  const px=player.x+PW/2, py=player.y+PH*0.45;
  const ex=e.x+e.w*0.5, ey=e.y+e.h*0.42;
  let dx=px-ex, dy=py-ey; const d=Math.hypot(dx,dy)||1, sp=4.6;
  enemyBullets.push({x:ex, y:ey, vx:dx/d*sp, vy:dy/d*sp, dmg:(ENEMY_KINDS[e.kind].shotDmg||14), t:0, life:150});
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
    if(imgOk(loaded.fireblaster)){
      const bi=loaded.fireblaster, bh=30*ZOOM, bw=bh*bi.naturalWidth/bi.naturalHeight;
      ctx.save(); ctx.translate(sx,sy);
      ctx.shadowColor='rgba(255,140,20,0.9)'; ctx.shadowBlur=12;
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
const HELPER_DUR=15*60, FIGHT_COOL=20*60, SWEEP_COOL=26*60;
let helperCool=[0,0];
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
  if(bar) bar.style.display = (s.chain || s.arena) ? '' : 'none';   // chain levels + the arena get helpers
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
  if(player.armour>0){                              // vest soaks the hit, no HP lost
    player.armour--; player.hurtCool=18; sfxHurt(); updateArmourHUD();
    if(player.armour===0) flashBanner('Armour gone');
    return;
  }
  player.hp=Math.max(0,player.hp-d); player.hurtCool=18; sfxHurt();
  document.getElementById('hpbar').style.width=(player.hp/player.max*100)+'%';
  if(player.hp<=0){ player.dead=true; player.deadT=0; setClip('die'); sfxKO(); if(isArena()) arenaBankScore(); flashBanner('YOU GOT DONE &mdash; respawning'); }
}
function respawnPlayer(){
  player.x=120; player.y=groundAt(120+PW/2)-PH; player.vx=0; player.vy=0; player.onGround=true;
  player.hp=player.max; player.dead=false; player.deadT=0; setClip('idle');
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
  if(nextId==='glasgow'){ // Dundee -> Glasgow: title card with a 3s cut-scene track
    transitioning=true;
    showCard({text:next.name, sound:'Glasgowcut.mp3',
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
  if(opts && typeof opts.x==='number') ex=opts.x;
  else if(opts==='right') ex=BGW-PW-60;
  else ex=120;
  player.x=Math.max(0,Math.min(BGW-PW,ex));
  player.y=groundAt(player.x+PW/2)-PH; player.vx=0; player.vy=0; player.onGround=true; setClip('idle');
  if(opts && typeof opts.face==='number') player.face=opts.face;
  bannerShown=false; helper.active=false; helperCool=[0,0]; activeDoor=null;
  if(SECTIONS[sectionIndex].id==='home' && !photographerMet){
    photographerMet=true; initNPC();              // first time on the street: the photographer turns up
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
  refreshHelperBtns();
  updateHelperBarVisibility();
  playSectionTrack();   // plays this room's track, or silence for screen rooms / trackless interiors
  initPickup();
  tvEnter();                                       // start this room's wall screen (or stop if none)
  sceneEnter();                                    // start this level's full-scene wall+floor videos (or stop)
}

/* ── WORLD / DOORWAYS (hub <-> rooms) ────────────────────── */
let activeDoor=null, hubReturnX=120, photographerMet=false;
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
  for(const d of sec.doors){ if(Math.abs(cx-d.x)<=d.w){ activeDoor=d; break; } }
}
function useDoor(d){
  if(transitioning||!d) return;
  if(d.menu){                                         // travel point (portal / departures): open its menu
    const sec=SECTIONS[sectionIndex];
    if(sec.hub) hubReturnX=d.x;                        // pop back to this spot when returning to the hub
    openTravel(d.menu);
    return;
  }
  if(d.target===null){ flashBanner('The portal is dormant&hellip; for now'); return; }
  if(d.target==='shop'){ openShop(); return; }
  const sec=SECTIONS[sectionIndex];
  if(d.target==='home'){                              // leaving a room -> back outside
    transitioning=true;
    doFade('Out to the street', ()=>{ gotoId('home',{x:hubReturnX,face:1}); transitioning=false; });
  } else {                                            // entering a room (or a future linked level)
    if(sec.hub) hubReturnX=d.x;                        // remember which building to pop back to
    const dest=SECTIONS.find(s=>s.id===d.target);
    transitioning=true;
    doFade(dest?dest.name:'', ()=>{ gotoId(d.target,{x:90,face:1}); transitioning=false; });
  }
}
function drawDoors(){
  const sec=SECTIONS[sectionIndex];
  if(!sec.doors || !activeDoor) return;
  const d=activeDoor;
  const mx=(d.x-camX)*ZOOM;                       // screen x over the doorway
  const bob=Math.sin(performance.now()/260)*4;
  const label=d.label.replace(/&mdash;/g,'\u2014').replace(/&amp;/g,'&').toUpperCase();
  let name, hint;
  if(d.menu){ name=label; hint='STRIKE to travel'; }
  else if(d.target===null){ name=label; hint='locked for now'; }
  else if(d.target==='home'){ name='EXIT'; hint='STRIKE to leave'; }
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

let tvVideo=null, tvHot=false;
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
  const tvRolling = tvVideo && !tvVideo.paused;
  const sceneRolling = (sceneWallVid && !sceneWallVid.paused) || (sceneFloorVid && !sceneFloorVid.paused);
  if(document.visibilityState==='visible' && (tvRolling || sceneRolling)) requestWakeLock();
});
function curScreen(){ return SCREENS[SECTIONS[sectionIndex].id] || null; }
function tvEl(){
  if(!tvVideo){
    tvVideo=document.createElement('video');
    tvVideo.setAttribute('playsinline','');
    tvVideo.setAttribute('webkit-playsinline','');
    tvVideo.loop=true; tvVideo.preload='auto';
    tvVideo.muted=musicMuted;
    tvVideo.style.cssText='position:fixed;left:-9999px;top:-9999px;width:2px;height:2px;opacity:0;pointer-events:none;';
    document.body.appendChild(tvVideo);
  }
  return tvVideo;
}
function screenLoad(playNow){
  const sc=curScreen(); if(!sc){ tvPause(); return; }
  const v=tvEl(), src=sc.files[sc.idx];
  if(v.getAttribute('data-src')!==src){ v.setAttribute('data-src',src); v.src=src; try{ v.load(); }catch(_){} }
  v.muted=musicMuted;
  if(playNow && !paused){ v.play().catch(()=>{}); requestWakeLock(); }
}
function tvEnter(){ if(curScreen()) screenLoad(true); else tvPause(); }
function tvPause(){ if(tvVideo){ try{ tvVideo.pause(); }catch(_){} } releaseWakeLock(); }
function tvNextChannel(){
  const sc=curScreen(); if(!sc||!sc.switchable) return;
  sc.idx=(sc.idx+1)%sc.files.length; screenLoad(true);
  blip(540,820,0.05,'square',0.12); blip(300,300,0.04,'square',0.08);
  flashBanner('Channel '+(sc.idx+1));
}
function screenCenterX(sc){ return sc.rect.x + sc.rect.w/2; }
function updateTV(){
  const sc=curScreen();
  tvHot = !!(sc && sc.switchable) &&
          Math.abs((player.x+PW/2) - screenCenterX(sc)) <= (sc.reach||120);
}
function drawTV(){
  const sc=curScreen(); if(!sc) return;
  const r=sc.rect;
  const sx=(r.x-camX)*ZOOM, sy=(r.y-SRCY)*ZOOM, sw=r.w*ZOOM, sh=r.h*ZOOM;
  const v=tvVideo;
  if(v && v.readyState>=2 && v.videoWidth>0 && v.getAttribute('data-src')===sc.files[sc.idx]){
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
  drawMarker(cx, cy, 'TV \u00B7 CH '+(sc.idx+1), 'STRIKE to change channel');
}

let sceneWallVid=null, sceneFloorVid=null;
function curSceneCfg(){ return SCENE_VIDEOS[SECTIONS[sectionIndex].id] || null; }
function sceneVid(which){
  let v = which==='wall' ? sceneWallVid : sceneFloorVid;
  if(!v){
    v=document.createElement('video');
    v.setAttribute('playsinline',''); v.setAttribute('webkit-playsinline','');
    v.loop=true; v.preload='auto'; v.muted=true;
    v.style.cssText='position:fixed;left:-9999px;top:-9999px;width:2px;height:2px;opacity:0;pointer-events:none;';
    document.body.appendChild(v);
    if(which==='wall') sceneWallVid=v; else sceneFloorVid=v;
  }
  return v;
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
  const w=sceneVid('wall');
  if(src.wall && w.getAttribute('data-src')!==src.wall){ w.setAttribute('data-src',src.wall); w.src=src.wall; try{w.load();}catch(_){} }
  w.muted=true;
  let f=null;
  if(src.floor){
    f=sceneVid('floor');
    if(f.getAttribute('data-src')!==src.floor){ f.setAttribute('data-src',src.floor); f.src=src.floor; try{f.load();}catch(_){} }
    f.muted=true;
  } else if(sceneFloorVid){ try{ sceneFloorVid.pause(); }catch(_){} }
  if(playNow && !paused){ w.play().catch(()=>{}); if(f) f.play().catch(()=>{}); requestWakeLock(); }
}
function sceneEnter(){ sceneZoneIdx=-1; if(curSceneCfg()) sceneLoad(true); else scenePause(); }
function scenePause(){ try{ if(sceneWallVid) sceneWallVid.pause(); if(sceneFloorVid) sceneFloorVid.pause(); }catch(_){} }
function drawSceneVideos(){
  const cfg=curSceneCfg(); if(!cfg) return;
  const src=sceneSrc()||{};
  const hasFloor = !!src.floor;
  const wallH = hasFloor ? Math.round(VH*cfg.wallFrac) : VH;
  const floorY=wallH, floorH=VH-wallH;
  const tileScreenW=cfg.tileW*ZOOM;
  const w=sceneWallVid, f=sceneFloorVid;
  const wallReady = w && w.readyState>=2 && w.videoWidth>0 && w.getAttribute('data-src')===src.wall;
  const floorReady= hasFloor && f && f.readyState>=2 && f.videoWidth>0 && f.getAttribute('data-src')===src.floor;
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
function addMoney(n){ money+=n; updateMoneyHUD(); }
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
    money-=w.price; owned.add(w.id); updateMoneyHUD(); renderShop();
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
const WEAPON_ORDER=['rifle','littleblaster','bigblaster','fireblaster','weapon01','weapon02','weapon03','weapon04','weapon05','weapon06','weapon07','weapon08'];
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
}
function drawWeaponIcon(cx,id,W,H){
  cx.clearRect(0,0,W,H);
  if((id==='bigblaster'||id==='littleblaster') && imgOk(loaded[id])){
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
  if(isArmed()){ btn.classList.remove('empty'); drawWeaponIcon(cx, weaponList[weaponSel], cvs.width, cvs.height); }
  else { btn.classList.add('empty'); cx.clearRect(0,0,cvs.width,cvs.height); }
  const strike=document.querySelector('.btn.punch'); if(strike) strike.textContent=isArmed()?'SHOOT':'STRIKE';
}
function updateArmourHUD(){ const el=document.getElementById('armour'); if(el) el.textContent = player.armour>0 ? ('ARMOUR \u00D7'+player.armour) : ''; }

function muzzlePoint(){
  const mz=(cur&&cur.muzzle)||{fwd:0.55,yfac:0.46};
  return { x: player.x+PW/2 + player.face*(PW*mz.fwd+6), y: player.y+PH*mz.yfac };
}
const HELD_WEAPON={
  pistol:  {fwd:0.24, up:-0.14, scale:0.50},
  shotgun: {fwd:0.16, up:-0.12, scale:1.00},
  rifle:   {fwd:0.12, up:-0.12, scale:1.12},
};
function drawHeldWeapon(){
  if(player.dead || !isArmed()) return;
  if(cur && cur.noWeaponArt) return;
  const id=weaponList[weaponSel];
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
    bullets.push({grenade:true, x:m.x, y:m.y-4, vx:player.face*w.speed, vy:-7.5, fuse:60, dmg:w.dmg, radius:w.radius, knock:w.knock});
    return;
  }
  sfxShot();
  if(w.shake) addShake(8,11);
  for(let i=0;i<w.pellets;i++){
    const spread=(Math.random()*2-1)*w.spread;
    bullets.push({ x:m.x, y:m.y, vx:player.face*w.speed*Math.cos(spread), vy:w.speed*Math.sin(spread),
                   dmg:w.dmg, knock:w.knock, range:w.range, traveled:0, sprite:w.sprite, spriteH:w.spriteH });
  }
}
function tryFire(){
  const w=curWeapon(); if(!w) return;
  if(shootCool>0) return;
  fireWeapon(w); shootCool=w.cooldown;
  if(CLIPS.shoot){ if(player.clip!=='shoot') setClip('shoot'); player.shootPoseT=14; }
}
function explodeGrenade(b){
  vfx.push({type:'boom', x:b.x, y:b.y, t:0, life:26, r:b.radius});
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
        spawnBlood(b.x, b.y, b.vx>=0?1:-1);
        b.dead=true; break;
      }
    }
  }
  bullets=bullets.filter(b=>!b.dead);
}
function updateVfx(){ for(const f of vfx) f.t++; vfx=vfx.filter(f=>f.t<f.life); }
function drawBullets(){
  for(const b of bullets){
    const sx=(b.x-camX)*ZOOM, sy=(b.y-SRCY)*ZOOM;
    if(sx<-30||sx>VW+30) continue;
    if(b.grenade){
      ctx.save(); ctx.fillStyle='#3f5a2a'; ctx.strokeStyle='#1a240f'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.arc(sx,sy,6,0,7); ctx.fill(); ctx.stroke(); ctx.restore();
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
    } else if(f.type==='boom'){
      ctx.save();
      const rr=(f.r||80)*ZOOM*Math.min(1,p*1.6);
      const grd=ctx.createRadialGradient(sx,sy,2,sx,sy,rr);
      grd.addColorStop(0,'rgba(255,240,180,'+(1-p)+')');
      grd.addColorStop(0.5,'rgba(255,140,20,'+(0.8-p*0.8)+')');
      grd.addColorStop(1,'rgba(120,30,0,0)');
      ctx.fillStyle=grd; ctx.beginPath(); ctx.arc(sx,sy,rr,0,7); ctx.fill(); ctx.restore();
    }
  }
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
    else npc.state=playerAttacking()?'photo':'trailIdle';
    if(playerAttacking()&&npc.state==='photo'){npc.t++;if(npc.t>40)npc.t=0;} else if(npc.state!=='photo')npc.t=0; }
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

/* ── FULLSCREEN / START ──────────────────────────────────── */
function goFullscreen(){
  const el=document.documentElement;
  const rq=el.requestFullscreen||el.webkitRequestFullscreen||el.mozRequestFullScreen||el.msRequestFullscreen;
  if(rq){ try{ rq.call(el); }catch(e){} }
  if(screen.orientation&&screen.orientation.lock){ try{ screen.orientation.lock('landscape').catch(()=>{}); }catch(e){} }
}
function start(m){
  cur=m; FW=m.fw; FH=m.fh; PW=Math.round(PH*FW/FH); CLIPS=m.clips;
  goFullscreen(); actx();
  document.getElementById('select').style.display='none';
  document.getElementById('kbhint').style.display='none';
  document.getElementById('game').style.display='block';
  document.getElementById('who').firstChild.textContent=m.name+' ';
  player.face=1;player.clip='idle';player.ct=0;runHold=0;player.shootPoseT=0;
  player.hp=player.max;player.dead=false;player.deadT=0;player.hurtCool=0;
  document.getElementById('hpbar').style.width='100%';
  bannerShown=false;csActive=false;csDone=false;
  photographerMet=false; npc.active=false;
  money=1000; owned.clear(); updateMoneyHUD(); closeShop(); floaters=[];
  weaponList=[]; weaponSel=-1; shootCool=0; bullets=[]; vfx=[];
  player.armour=0; updateArmourHUD(); refreshWeaponBtn();
  hubReturnX=200;
  helper.active=false; helperCool=[0,0]; buildHelperThumbs(); refreshHelperBtns();
  killedEnemies.clear(); pickup.active=false;
  setPaused(false);
  gotoId('in_house', {x:90, face:1});
  if(!raf)loop();
}

/* ── PAUSE / MUTE ────────────────────────────────────────── */
let paused=false, musicMuted=false;
function setPaused(p){
  paused=p;
  document.getElementById('pausemenu').classList.toggle('on',p);
  document.getElementById('pause').innerHTML=p?'&#9654;':'&#10073;&#10073;';
  const bgm=document.getElementById('bgm');
  if(p){ bgm.pause(); tvPause(); scenePause(); pauseAllProxAudio(); }
  else if(cur){
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
  if(tvVideo) tvVideo.muted=musicMuted;
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
  if(SECTIONS[sectionIndex].id!=='in_library') return;
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
}

/* ── UPDATE / DRAW / LOOP ────────────────────────────────── */
function update(){
  if(csActive||transitioning||shopOpen||travelOpen)return;
  if(player.hurtCool>0) player.hurtCool--;
  updateDoors();
  updateTV();

  if(player.dead){
    player.ct++; player.vy+=GRAV; player.y+=player.vy;
    const g=groundAt(player.x+PW/2); if(player.y+PH>=g){player.y=g-PH;player.vy=0;}
    player.deadT++; if(player.deadT>90){ respawnPlayer(); }
    updateEnemies(); updateHelper(); return;
  }

  if(shootCool>0) shootCool--;
  const armed=isArmed();
  if(punchEdge){
    punchEdge=false;
    if(tvHot){ tvNextChannel(); }
    else if(activeDoor){ useDoor(activeDoor); }
    else if(armed){ tryFire(); }
    else if(player.onGround){
      if(!playerAttacking()){ setClip('punch'); player.attackId++; sfxPunch(); }
      else if(player.clip==='punch'){ setClip('headbutt'); player.attackId++; sfxPunch(); }
    }
  }
  if(armed && punchDown && !activeDoor && !tvHot){ const w=curWeapon(); if(w&&w.auto) tryFire(); }
  const attacking=playerAttacking() && !clipDone();

  let moving=false;
  if(!attacking){
    if(keys.left&&!keys.right){player.face=-1;moving=true;}
    else if(keys.right&&!keys.left){player.face=1;moving=true;}
  }
  runHold = moving ? Math.min(runHold+1,60) : 0;
  const running = moving && runHold>28;
  player.vx = attacking ? 0 : (moving ? player.face*(running?RUNSPEED:SPEED) : 0);

  if(keys.jump&&player.onGround&&!attacking){player.vy=JUMP;player.onGround=false;sfxJump();}

  player.vy+=GRAV;player.x+=player.vx;player.y+=player.vy;
  player.x=Math.max(0,Math.min(BGW-PW,player.x));
  const g=groundAt(player.x+PW/2);
  if(player.y+PH>=g){player.y=g-PH;player.vy=0;player.onGround=true;}

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
  updateHubNpcs();
  updateChurchNpc();
  updateLibraryNpc();
  updateMkNpcs();
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
  // interior rooms flagged `exitLeft`: just walk off the LEFT edge to leave (no STRIKE needed)
  const curSec=SECTIONS[sectionIndex];
  if(curSec.exitLeft && player.x<=2 && keys.left && !transitioning){
    transitioning=true; const tgt=curSec.exitLeft;
    doFade('Out to the street', ()=>{ gotoId(tgt,{x:hubReturnX,face:1}); transitioning=false; });
  }
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
  if(imgOk(loaded[bgKey])){ try{ ctx.drawImage(loaded[bgKey],camX,SRCY,SRCW,SRCH,0,0,VW,VH); }catch(e){ drawNoBg(); } } else drawNoBg();
}
function draw(){
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

  drawTV();

  drawUfo();
  drawWanderer();
  drawPickup();
  for(const e of enemies) drawEnemy(e);
  drawNPC();
  drawHubNpcs();
  drawChurchNpc();
  drawLibraryNpc();
  drawMkNpcs();
  drawHelper();

  const fx=frameIndex();
  const cs=(cur&&cur.scale)||1; const dw=PW*ZOOM*CSCALE*cs,dh=PH*ZOOM*CSCALE*cs;
  const sx=(player.x-camX)*ZOOM-(dw-PW*ZOOM)/2,sy=(player.y+PH-SRCY)*ZOOM-dh;
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
  drawDoors();
  drawTVMarker();
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
function loop(){ if(!paused) update(); draw(); raf=requestAnimationFrame(loop); }

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
function arenaPool(w){
  const pool=[0,3];                 // 0 police, 3 geezer
  if(w>=3) pool.push(4,2);          // 4 knifeman, 2 alien
  if(w>=5) pool.push(1,5);          // 1 clown, 5 deliveroo
  if(w>=7) pool.push(7);            // 7 ufo (hovers)
  return pool;
}
function arenaEnter(){
  arenaActive=true; arenaWave=0; arenaScore=0; arenaGrace=0; arenaScored=false;
  enemies=[]; bullets=[]; vfx=[]; enemyBullets=[];
  arenaNextWave();
}
function arenaNextWave(){
  arenaWave++;
  const count=Math.min(14, 3+Math.floor(arenaWave*1.3));   // more each wave, capped so it stays playable
  const hpMul=1+(arenaWave-1)*0.40;                        // tougher to kill each wave
  const spd=ESPEED*(1+(arenaWave-1)*0.05);                 // a touch faster
  const dmg=EDMG+(arenaWave-1)*2;                          // hits harder
  const pool=arenaPool(arenaWave);
  for(let i=0;i<count;i++){
    const kind=pool[Math.floor(Math.random()*pool.length)];
    const side=Math.random()<0.5?-1:1;
    let at=player.x + side*(SRCW*0.55 + Math.random()*SRCW*0.4);   // just off-screen, within aggro range
    at=Math.max(40,Math.min(BGW-60,at));
    const e=pushEnemy(kind, at, null, {hp:Math.round(40*hpMul)});
    if(e){ e.spd=spd; e.dmg=dmg; }
  }
  flashBanner('WAVE '+arenaWave);
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
function arenaLoadScores(){ try{ return JSON.parse(localStorage.getItem('void_scores')||'[]'); }catch(_){ return []; } }
function arenaBest(){ const s=arenaLoadScores(); return s.length?s[0].score:0; }
function arenaBankScore(){
  if(arenaScored) return; arenaScored=true;
  if(arenaScore<=0) return;
  let s=arenaLoadScores();
  s.push({score:arenaScore, wave:arenaWave, t:Date.now()});
  s.sort((a,b)=>b.score-a.score); s=s.slice(0,10);
  try{ localStorage.setItem('void_scores', JSON.stringify(s)); }catch(_){}
}
function drawArenaHud(){
  if(!isArena()) return;
  ctx.save(); ctx.textAlign='left'; ctx.lineWidth=3; ctx.strokeStyle='#000';
  const y=92;
  ctx.font='900 16px monospace';
  ctx.strokeText('WAVE '+arenaWave,12,y);    ctx.fillStyle='#9fe0ff'; ctx.fillText('WAVE '+arenaWave,12,y);
  ctx.strokeText('SCORE '+arenaScore,12,y+20); ctx.fillStyle='#ffe46b'; ctx.fillText('SCORE '+arenaScore,12,y+20);
  ctx.font='700 11px monospace';
  const best=Math.max(arenaBest(),arenaScore);
  ctx.strokeText('BEST '+best,12,y+37);      ctx.fillStyle='#cdd6e6'; ctx.fillText('BEST '+best,12,y+37);
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
  ctx.fillText('THE VOID \u2014 TOP RUNS', bx+bw/2, by+24);
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
