import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';

const KEY='home-spend-v1';
// Default layout (grid units = meters). x: 0..10, z: 0..8
const ROOMS=[
 {id:'living', name:'סלון',  x:0,z:0,w:5,d:4,floor:'#d9c4a3'},
 {id:'kitchen',name:'מטבח',  x:5,z:0,w:5,d:4,floor:'#e8e1d4'},
 {id:'bed',    name:'חדר שינה',x:0,z:4,w:5,d:4,floor:'#cdb79a'},
 {id:'bath',   name:'אמבטיה',x:5,z:4,w:5,d:4,floor:'#dfe6e4'}];
const WALL_H=2.6, WALL_T=0.12;let CX=5, CZ=4;

let NX=10,NZ=8;
// saved house size (meters); only grows/shrinks on the +x/+z side so existing coords stay valid
try{const z=(JSON.parse(localStorage.getItem('home-spend-v1'))||{}).size;if(z&&z.w>=10&&z.w<=20&&z.d>=8&&z.d<=18){NX=z.w|0;NZ=z.d|0;CX=NX/2;CZ=NZ/2}}catch(e){}
const PAL=[{wall:'#efe3cf',floor:'#b98d63'},{wall:'#d3dfcc',floor:'#d8cfbf'},{wall:'#e4d2bd',floor:'#c7a27c'},{wall:'#cddde3',floor:'#e9e2d6'},{wall:'#e8d6d9',floor:'#bfa58a'},{wall:'#dcd6e6',floor:'#d3c0a4'}];
const stage=document.getElementById('stage');
let renderer;try{renderer=new THREE.WebGLRenderer({antialias:true})}catch(e){window.__homieFail&&__homieFail('WebGL');throw e}
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.05;
renderer.outputColorSpace=THREE.SRGBColorSpace;
stage.appendChild(renderer.domElement);
const scene=new THREE.Scene(); scene.background=new THREE.Color('#efe8dc');
scene.fog=new THREE.Fog('#efe8dc',35,70);
const cam=new THREE.PerspectiveCamera(45,1,0.1,200);
scene.add(new THREE.HemisphereLight('#fff8ec','#cbbfa8',0.9));
scene.add(new THREE.AmbientLight('#ffffff',0.15));
const sun=new THREE.DirectionalLight('#ffe9c8',1.9);
sun.position.set(7,15,9); sun.castShadow=true; sun.shadow.mapSize.set(2048,2048); sun.shadow.bias=-0.0005; sun.shadow.normalBias=0.02;
Object.assign(sun.shadow.camera,{left:-9,right:9,top:9,bottom:-9}); scene.add(sun);
const fill=new THREE.DirectionalLight('#dfe8ff',0.35); fill.position.set(-8,6,-6); scene.add(fill);
const ground=new THREE.Mesh(new THREE.CircleGeometry(30,64),new THREE.MeshStandardMaterial({color:'#e4dccb',roughness:1}));
ground.rotation.x=-Math.PI/2; ground.position.y=-0.02; ground.receiveShadow=true; scene.add(ground);
const backdrop=new THREE.Group();scene.add(backdrop);
function applyBackdrop(set){backdrop.clear();backdrop.userData.tick=null;const bm=(c)=>new THREE.MeshStandardMaterial({color:c,roughness:1});
 if(set==='building'){scene.background.set('#9fd0f2');scene.fog.color.set('#c4def0');scene.fog.near=30;scene.fog.far=80;ground.material.color.set('#7d8794');ground.position.y=-8;
  // flush: slab/tower match the house footprint (10×8) — no strip between scenery and floor
  const slab=new THREE.Mesh(new THREE.BoxGeometry(NX+.12,0.6,NZ+.12),bm('#c9c6bf'));slab.position.y=-0.3;slab.receiveShadow=true;backdrop.add(slab);
  const tower=new THREE.Mesh(new THREE.BoxGeometry(NX+.12,8,NZ+.12),bm('#d8d4cc'));tower.position.y=-4.6;backdrop.add(tower);
  const win=bm('#5d7290');
  // soft clouds
  const cm=new THREE.MeshStandardMaterial({color:'#ffffff',roughness:1,transparent:true,opacity:.92});
  [[-14,13,-18],[10,15,-20],[18,12,-6],[-20,14,4],[2,16,-26]].forEach(([x,y,z])=>{for(let k=0;k<4;k++){const c=new THREE.Mesh(new THREE.SphereGeometry(1.4+k%2*.6,12,8),cm);c.position.set(x+k*1.6-2.4,y+(k%2)*.4,z);c.scale.set(1.3,.6,1);backdrop.add(c)}});
  // birds: small dark V's gliding in circles
  const bmat=new THREE.MeshBasicMaterial({color:'#2d3340',side:THREE.DoubleSide});
  const flock=new THREE.Group();backdrop.add(flock);
  for(let k=0;k<7;k++){const b=new THREE.Group();[-1,1].forEach(sg=>{const w=new THREE.Mesh(new THREE.PlaneGeometry(.45,.09),bmat);w.position.x=sg*.2;w.rotation.z=sg*.35;b.add(w)});
   b.userData={r:9+k*1.3,h:7+(k%3)*1.2,o:k*.9,sp:.00012+k*.00001};flock.add(b)}
  backdrop.userData.tick=t=>flock.children.forEach(b=>{const u=b.userData,a=u.o+t*u.sp;b.position.set(Math.cos(a)*u.r,u.h+Math.sin(t*.002+u.o)*.3,Math.sin(a)*u.r);b.rotation.y=-a;
   b.children.forEach((w,i)=>w.rotation.z=(i?1:-1)*(.35+Math.sin(t*.012+u.o)*.3))});
  [[-12,-9,5,9,5,1.5],[11,-10,6,9,5,3],[-13,4,4,9,6,-1],[12,5,5,9,5,2],[0,-13,8,9,4,4],[-6,13,5,9,4,-2],[7,12,5,9,4,1]].forEach(([x,z,w,h,d,top])=>{h=8+top;const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),bm(['#c9b8a4','#a9b7c4','#d8c9b0','#9fb0a8'][Math.abs(x+z)%4|0]));m.position.set(x,top-h/2,z);backdrop.add(m);
   const r=new THREE.Mesh(new THREE.BoxGeometry(w+.2,.3,d+.2),bm('#6f7883'));r.position.set(x,top,z);backdrop.add(r);
   for(let k=0;k<3;k++){const wn=new THREE.Mesh(new THREE.BoxGeometry(w*.8,.5,d+.05),win);wn.position.set(x,top-1.2-k*1.6,z);backdrop.add(wn)}});
 }else{scene.background.set('#bfe0f2');scene.fog.color.set('#cfe6d0');scene.fog.near=35;scene.fog.far=75;ground.material.color.set('#6fa64a');ground.position.y=-0.02;
  // roads + paths: asphalt street in front and to one side, beige walkway to the door
  const asph=bm('#5d6268'),line=bm('#e9e4d4'),walk=bm('#d6c6a2');
  const road=(x,z,w,d)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,.04,d),asph);m.position.set(x,0,z);m.receiveShadow=true;backdrop.add(m)};
  road(0,CZ+5.2,60,3);road(-CX-5.5,0,3,60);
  for(let x=-28;x<28;x+=3){const m=new THREE.Mesh(new THREE.BoxGeometry(1.2,.05,.12),line);m.position.set(x,.005,CZ+5.2);backdrop.add(m)}
  for(let z=-28;z<28;z+=3){const m=new THREE.Mesh(new THREE.BoxGeometry(.12,.05,1.2),line);m.position.set(-CX-5.5,.005,z);backdrop.add(m)}
  const path=new THREE.Mesh(new THREE.BoxGeometry(1.4,.05,3.7),walk);path.position.set(0,0,CZ+1.85);backdrop.add(path);
  const side=new THREE.Mesh(new THREE.BoxGeometry(60,.05,1),walk);side.position.set(0,0,CZ+3.3);backdrop.add(side);
  // a few trees, many bushes
  [[8.5,-6.5,1.4],[-7.5,-7,1.2],[9,4.5,1.3]].map(([x,z,s])=>[x+Math.sign(x)*(CX-5),z+Math.sign(z)*(CZ-4),s]).forEach(([x,z,s])=>{
   const tr=new THREE.Mesh(new THREE.CylinderGeometry(.18*s,.25*s,1.6*s,8),bm('#7a5534'));tr.position.set(x,.8*s,z);tr.castShadow=true;backdrop.add(tr);
   const t=new THREE.Mesh(new THREE.SphereGeometry(1.1*s,16,12),bm('#3f7d3a'));t.position.set(x,2.2*s,z);t.scale.set(1,1.25,1);t.castShadow=true;backdrop.add(t)});
  const bush=['#4e8a3e','#5f9a48','#6d8f3a','#3f7a3c'];
  [[-6,-5.2,.6],[-4.5,-5.4,.5],[-2,-5.3,.55],[1,-5.5,.5],[3.5,-5.3,.6],[6,-5.2,.5],[6.2,-2,.55],[6.3,1,.5],[6.1,3.2,.6],[-6.2,-2.5,.5],[-6.3,.5,.55],[-6.1,3,.5],
   [-3,5.6,.5],[-1.4,5.5,.4],[1.4,5.5,.4],[3,5.6,.5],[-8.5,3,.7],[8,-2.5,.7],[-3,-8.5,.8],[4,-8.8,.7],[12,-3,.9],[-13,-6,.9],[13,6,.8]].map(([x,z,r])=>[x+Math.sign(x)*(CX-5),z+Math.sign(z)*(CZ-4),r]).forEach(([x,z,r],i)=>{
   const m=new THREE.Mesh(new THREE.SphereGeometry(r,12,8),bm(bush[i%bush.length]));m.position.set(x,r*.6,z);m.scale.set(1.2,.8,1);m.castShadow=true;backdrop.add(m)});}
 const b=document.getElementById('setBtn');if(b)b.textContent=set==='building'?'🏢 בניין':'🌳 קרקע'}
const house=new THREE.Group(); house.position.set(-CX,0,-CZ); scene.add(house);
const struct=new THREE.Group(); house.add(struct);
// grid overlay for build mode
let grid;function makeGrid(){const vis=grid&&grid.visible;if(grid){house.remove(grid);grid.geometry.dispose()}
 const n=Math.max(NX,NZ);grid=new THREE.GridHelper(n,n,'#8a7a60','#8a7a60');grid.position.set(n/2,0.07,n/2);
 // clip to footprint by scaling a square grid
 grid.scale.set(NX/n,1,NZ/n);grid.position.set(NX/2,0.07,NZ/2);grid.material.transparent=true;grid.material.opacity=.35;grid.visible=!!vis;house.add(grid)}
makeGrid();

// camera fit: house bigger in frame (portrait looks along the short side)
function homeView(){const a=cam.aspect||innerWidth/innerHeight,vt=Math.tan(THREE.MathUtils.degToRad(22.5)),ht=vt*a;
 const portrait=a<0.9;const dir=portrait?new THREE.Vector3(0.95,1.25,0.32):new THREE.Vector3(0.75,1.05,1);dir.normalize();
 const k=Math.max(NX/10,NZ/8),hw=(portrait?7.8:8.2)*k,hh=(portrait?5.2:5.0)*k;const dist=Math.max(hw/ht,hh/vt)*1.45;
 return {pos:dir.multiplyScalar(dist),target:new THREE.Vector3(0,0.3,0)}}
const ctl=new OrbitControls(cam,renderer.domElement);
ctl.enableDamping=true; ctl.dampingFactor=.08;
ctl.minDistance=3; ctl.maxDistance=45; ctl.maxPolarAngle=Math.PI/2-0.05;
ctl.screenSpacePanning=false;
ctl.touches={ONE:THREE.TOUCH.ROTATE,TWO:THREE.TOUCH.DOLLY_PAN};
function resize(){const w=innerWidth,h=innerHeight;renderer.setSize(w,h);cam.aspect=w/h;cam.updateProjectionMatrix()}
addEventListener('resize',resize); window.visualViewport&&visualViewport.addEventListener('resize',resize); addEventListener('orientationchange',()=>setTimeout(()=>{resize();try{resetCam()}catch(e){}},300)); resize();
function resetCam(){const v=homeView();cam.position.copy(v.pos);ctl.target.copy(v.target);ctl.update()}
resetCam();
const TICK=[];renderer.setAnimationLoop(t=>{ctl.update();try{camSide()}catch(e){}TICK.forEach(f=>f(t));backdrop.userData.tick&&backdrop.userData.tick(t);renderer.render(scene,cam)});
setTimeout(()=>document.getElementById('hint').style.opacity=0,6000);
// ===== Stage 2+3: data, structure, furniture, build, undo =====
// Saved gx/gy are old-grid units (house 0..9 × 0..9) → meters x=gx*10/9, z=gy*8/9
const SX=10/9, SZ=8/9;
const seedP=()=>[
 {id:1,name:'טלוויזיה',price:12990,date:'2026-09-14',room:'living',icon:'📺',gx:1.3,gy:1.6},
 {id:2,name:'ספה',price:18500,date:'2026-08-02',room:'living',icon:'🛋️',gx:3,gy:2.8},
 {id:3,name:'מקרר',price:15490,date:'2026-07-20',room:'kitchen',icon:'🧊',gx:6.2,gy:1.4},
 {id:4,name:'שולחן אוכל',price:6200,date:'2026-08-11',room:'kitchen',icon:'🍽️',gx:7.6,gy:2.2},
 {id:5,name:'מיטה זוגית',price:14900,date:'2026-06-30',room:'bed',icon:'🛏️',gx:2,gy:6.6},
 {id:6,name:'מכונת כביסה',price:9990,date:'2026-09-01',room:'bath',icon:'🧺',gx:6.4,gy:6.6}];
// walls = unit grid edges {x1,z1,x2,z2} in meters; door gaps = missing edges
function defaultWalls(){const W=[];const h=(z,x)=>W.push({x1:x,z1:z,x2:x+1,z2:z}),v=(x,z)=>W.push({x1:x,z1:z,x2:x,z2:z+1});
 for(let x=0;x<NX;x++){h(0,x);h(NZ,x);h(4,x)}
 for(let z=0;z<NZ;z++){v(0,z);v(NX,z);v(5,z)}return W}
const defaultRooms=()=>ROOMS.map((r,i)=>({id:r.id,name:r.name,ax:r.x+1,az:r.z+1,wall:PAL[i].wall,floor:PAL[i].floor}));
let S;try{S=JSON.parse(localStorage.getItem(KEY))}catch(e){}
if(!S||typeof S!=='object')S={};
if(!Array.isArray(S.products))S.products=seedP();
const okW=w=>w&&[w.x1,w.z1,w.x2,w.z2].every(n=>typeof n==='number'&&isFinite(n)&&n>=0&&n<=20);
if(!Array.isArray(S.walls)||!S.walls.every(okW)){S.walls=[];S.rooms=defaultRooms()}
if(S.setting!=='building')S.setting='ground';
if(Array.isArray(S.rooms)&&!S.rooms.every(r=>r&&typeof r.ax==='number'&&typeof r.az==='number'))S.rooms=defaultRooms();
S.products=S.products.filter(p=>p&&typeof p==='object');
if(!Array.isArray(S.rooms))S.rooms=defaultRooms();
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}};
const kc=n=>(+n||0).toLocaleString('cs-CZ').replace(/\s/g,',')+' Kč';
const esc=t=>String(t??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const ek=w=>{const a=w.x1+','+w.z1,b=w.x2+','+w.z2;return a<b?a+'|'+b:b+'|'+a};

// ---- rooms: flood-fill cells bounded by walls; regions leaking outside grid = not a room ----
let CELL=[];   // CELL[z][x] = room or null
function regions(){if(!S.walls.length){if(!S.rooms.length)S.rooms=defaultRooms();CELL=[...Array(NZ)].map(()=>Array(NX).fill(null));
  ROOMS.forEach(R=>{const m=S.rooms.find(o=>o.id===R.id)||S.rooms.find(o=>o.ax>=R.x&&o.ax<R.x+R.w&&o.az>=R.z&&o.az<R.z+R.d);if(!m)return;m.cx=R.x+R.w/2;m.cz=R.z+R.d/2;for(let z=R.z;z<R.z+R.d;z++)for(let x=R.x;x<R.x+R.w;x++)CELL[z][x]=m});
  ROOMS_NOW=S.rooms;fillRoomSel();return}
 const K=new Set(S.walls.map(ek));const has=(x1,z1,x2,z2)=>K.has(ek({x1,z1,x2,z2}));
 const seen=[...Array(NZ)].map(()=>Array(NX).fill(false));const regs=[];
 for(let z0=0;z0<NZ;z0++)for(let x0=0;x0<NX;x0++){if(seen[z0][x0])continue;const cells=[],q=[[x0,z0]];seen[z0][x0]=true;let leak=false;
  while(q.length){const [x,z]=q.pop();cells.push([x,z]);
   const nb=[[x+1,z,has(x+1,z,x+1,z+1)],[x-1,z,has(x,z,x,z+1)],[x,z+1,has(x,z+1,x+1,z+1)],[x,z-1,has(x,z,x+1,z)]];
   for(const [nx,nz,blk] of nb){if(blk)continue;if(nx<0||nz<0||nx>=NX||nz>=NZ){leak=true;continue}if(!seen[nz][nx]){seen[nz][nx]=true;q.push([nx,nz])}}}
  regs.push({cells,leak})}
 const used=new Set(),rooms=[];CELL=[...Array(NZ)].map(()=>Array(NX).fill(null));
 const closed=regs.filter(r=>!r.leak);
 const pending=[];
 for(const r of closed){const inR=new Set(r.cells.map(c=>c+''));const m=S.rooms.find(o=>!used.has(o.id)&&inR.has(Math.floor(o.ax)+','+Math.floor(o.az)));
  if(m){used.add(m.id);r.room=m;rooms.push(m)}else pending.push(r)}
 for(const r of pending){const k=rooms.length+1;const c=r.cells[0];const p=PAL[(rooms.length)%PAL.length];
  r.room={id:'r'+Date.now().toString(36)+k,name:'חדר '+k,ax:c[0]+.5,az:c[1]+.5,wall:p.wall,floor:p.floor};rooms.push(r.room)}
 for(const r of closed){r.room.cells=r.cells.length;let sx=0,sz=0;r.cells.forEach(([x,z])=>{CELL[z][x]=r.room;sx+=x;sz+=z});
  r.room.cx=sx/r.cells.length+.5;r.room.cz=sz/r.cells.length+.5}
 S.rooms=rooms.map(({cells,cx,cz,...o})=>o);ROOMS_NOW=rooms;fillRoomSel()}
let ROOMS_NOW=[];
const roomAtM=(x,z)=>{const cx=Math.floor(x),cz=Math.floor(z);return (CELL[cz]&&CELL[cz][cx])||null};
const roomName=p=>(roomAtM(p.gx*SX,p.gy*SZ)||ROOMS_NOW.find(r=>r.id===p.room)||{name:'—'}).name;

// ---- structure meshes ----
const matC={};const mat=(c,o={})=>{const k=c+JSON.stringify(o);return matC[k]||(matC[k]=new THREE.MeshStandardMaterial({color:c,roughness:.9,...o}))};
const capMat=mat('#a8977c');
function camDir(){const d=cam.position.clone().sub(ctl.target);return {x:d.x,z:d.z}}
// in cutaway mode, rebuild walls when the camera swings to another side of the house
let camSig='';function camSide(){if(S.wallMode!=='far')return;const d=camDir(),s=(d.x>0)+''+(d.z>0);if(s!==camSig){camSig=s;buildStruct()}}
function buildStruct(){struct.clear();const STUB=0.22,cd=camDir();
 const tile=new THREE.BoxGeometry(1,0.05,1);
 for(let z=0;z<NZ;z++)for(let x=0;x<NX;x++){const r=CELL[z][x];
  // subtle checker tone difference inside rooms
  const base=new THREE.Color(r?r.floor:'#d6cfbf');if((x+z)%2)base.offsetHSL(0,0,-0.025);
  const m=new THREE.Mesh(tile,mat('#'+base.getHexString(),{roughness:.85}));m.position.set(x+.5,0.025,z+.5);m.receiveShadow=true;struct.add(m)}
 for(const w of S.walls){const hz=w.z1===w.z2;
  // per-wall height: stub everywhere / full everywhere / Sims cutaway (far perimeter tall, rest stubs)
  const per=hz?(w.z1===0||w.z1===NZ):(w.x1===0||w.x1===NX);
  const far=per&&(((w.x1+w.x2)/2-CX)*cd.x+((w.z1+w.z2)/2-CZ)*cd.z)<0;
  const WH=S.wallMode==='full'?WALL_H:S.wallMode==='far'?(far?WALL_H:STUB):STUB;
  const A=hz?(CELL[w.z1-1]||[])[w.x1]:(CELL[w.z1]||[])[w.x1-1], B=hz?(CELL[w.z1]||[])[w.x1]:(CELL[w.z1]||[])[w.x1];
  const len=1+WALL_T*.5;
  [[A,-1],[B,1]].forEach(([r,sg])=>{const g=hz?new THREE.BoxGeometry(len,WH,WALL_T/2):new THREE.BoxGeometry(WALL_T/2,WH,len);
   const m=new THREE.Mesh(g,mat(S.wallColor||(r?r.wall:'#f3ece0'),{roughness:.95}));
   m.position.set((w.x1+w.x2)/2+(hz?0:sg*WALL_T/4),WH/2,(w.z1+w.z2)/2+(hz?sg*WALL_T/4:0));m.castShadow=m.receiveShadow=true;struct.add(m)});
  const c=new THREE.Mesh(hz?new THREE.BoxGeometry(len,0.04,WALL_T+.01):new THREE.BoxGeometry(WALL_T+.01,0.04,len),capMat);
  c.position.set((w.x1+w.x2)/2,WH+.02,(w.z1+w.z2)/2);struct.add(c)}}

// ---- furniture: simple 3D shapes per type ----
function box(g,w,h,d,c,x=0,y=0,z=0,o){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color:c,roughness:.75,...o}));
 m.position.set(x,y+h/2,z);m.castShadow=m.receiveShadow=true;g.add(m);return m}
function cyl(g,r,h,c,x,y,z,rx=0){const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,24),new THREE.MeshStandardMaterial({color:c,roughness:.5}));
 m.position.set(x,y,z);m.rotation.x=rx;m.castShadow=true;g.add(m);return m}
const SHAPE={
 '🛋️':g=>{box(g,2,.22,.9,'#5f6f5a',0,.1,0);box(g,1.9,.2,.75,'#7f957a',0,.32,.06);box(g,2,.45,.2,'#6b8066',0,.32,-.35);box(g,.18,.32,.9,'#6b8066',-.91,.32,0);box(g,.18,.32,.9,'#6b8066',.91,.32,0);
  [-.88,.88].forEach(x=>[-.38,.38].forEach(z=>box(g,.06,.1,.06,'#3b3228',x,0,z)))},
 '🛏️':g=>{box(g,1.7,.3,2.1,'#7a5c43',0,0,0);box(g,1.6,.22,2,'#f2ece2',0,.3,0);box(g,1.62,.06,1.3,'#9fb3c8',0,.5,.33);
  box(g,.6,.12,.35,'#ffffff',-.38,.52,-.75);box(g,.6,.12,.35,'#ffffff',.38,.52,-.75);box(g,1.7,.6,.1,'#6a4e38',0,.3,-1.05)},
 '🧊':g=>{box(g,.7,1.8,.68,'#e6eaea',0,0,0,{roughness:.35,metalness:.1});box(g,.71,.015,.69,'#9aa3a3',0,1.15,0);
  box(g,.03,.35,.03,'#8a9393',.28,1.3,.35);box(g,.03,.45,.03,'#8a9393',.28,.55,.35)},
 '📺':g=>{box(g,1.4,.45,.4,'#6e5642',0,0,0);box(g,.08,.12,.08,'#2b2b2b',0,.45,0);box(g,1.25,.72,.05,'#1e2124',0,.57,0,{roughness:.3});
  box(g,1.17,.64,.01,'#2f4b63',0,.61,.03,{roughness:.2,emissive:'#0b1622'})},
 '🍽️':g=>{box(g,1.4,.05,.9,'#a3794f',0,.7,0);[-.62,.62].forEach(x=>[-.38,.38].forEach(z=>box(g,.06,.7,.06,'#7b5a3a',x,0,z)));
  [[-.35,-.65],[.35,-.65],[-.35,.65],[.35,.65]].forEach(([x,z])=>{box(g,.4,.04,.4,'#c9b08f',x,.45,z);box(g,.4,.4,.04,'#c9b08f',x,.49,z+(z<0?-.18:.18))})},
 '🧺':g=>{box(g,.62,.85,.6,'#f1f1ee',0,0,0,{roughness:.4});cyl(g,.21,.03,'#5d7186',0,.42,.31,Math.PI/2);cyl(g,.15,.035,'#a7bccd',0,.42,.315,Math.PI/2);box(g,.5,.06,.02,'#cfd3d4',0,.74,.3)},
 '🚽':g=>{box(g,.4,.4,.55,'#f4f4f1',0,0,.05,{roughness:.3});box(g,.42,.04,.5,'#e2e4e2',0,.4,.08);box(g,.4,.45,.18,'#f4f4f1',0,.3,-.25,{roughness:.3})},
 '🛁':g=>{box(g,.8,.55,1.7,'#f4f4f1',0,0,0,{roughness:.3});box(g,.64,.05,1.5,'#9fc4d6',0,.5,0,{roughness:.1});cyl(g,.03,.2,'#b8bcbd',0,.65,-.75)},
 '🚿':g=>{box(g,.9,.06,.9,'#e6e8e6',0,0,0);box(g,.02,1.9,.9,'#cfe3ea',.45,.06,0,{transparent:true,opacity:.45});box(g,.9,1.9,.02,'#cfe3ea',0,.06,.45,{transparent:true,opacity:.45});cyl(g,.12,.03,'#b8bcbd',-.3,1.95,-.3)},
 '🪥':g=>{box(g,.8,.8,.5,'#e9e0d3',0,0,0);box(g,.5,.05,.35,'#ffffff',0,.8,0);box(g,.7,.7,.03,'#bcd3dc',0,1.15,-.24,{roughness:.1})},
 '🪑':g=>{box(g,.45,.05,.45,'#a3794f',0,.43,0);box(g,.45,.45,.05,'#a3794f',0,.48,-.2);[-.19,.19].forEach(x=>[-.19,.19].forEach(z=>box(g,.04,.43,.04,'#7b5a3a',x,0,z)))},
 '🛋':g=>{box(g,.85,.22,.8,'#9b6e52',0,.1,0);box(g,.75,.18,.62,'#b98a6b',0,.32,.06);box(g,.85,.45,.18,'#8c614a',0,.32,-.32);box(g,.14,.3,.8,'#8c614a',-.36,.32,0);box(g,.14,.3,.8,'#8c614a',.36,.32,0)},
 '🗄️':g=>{box(g,1.2,2,.6,'#d9c9b0',0,0,0);box(g,.01,1.9,.01,'#8a7a60',0,.05,.31);[-.08,.08].forEach(x=>box(g,.03,.2,.03,'#6e604b',x,1,.31))},
 '🪞':g=>{box(g,1,.75,.45,'#c9b08f',0,0,0);box(g,.6,.8,.03,'#bcd3dc',0,.75,-.2,{roughness:.1})},
 '🍳':g=>{box(g,.6,.9,.6,'#e8e8e4',0,0,0,{roughness:.35});box(g,.6,.02,.6,'#2b2b2b',0,.9,0);[[-.14,-.14],[.14,-.14],[-.14,.14],[.14,.14]].forEach(([x,z])=>cyl(g,.09,.01,'#555',x,.925,z))},
 '🗃️':g=>{box(g,2,.9,.6,'#efe7da',0,0,0);box(g,2.02,.04,.62,'#8f8576',0,.9,0);box(g,2,.7,.35,'#efe7da',0,1.5,-.12)},
 '🪴':g=>{cyl(g,.18,.35,'#b36b45',0,.17,0);const m=new THREE.Mesh(new THREE.SphereGeometry(.32,12,10),new THREE.MeshStandardMaterial({color:'#4f8a3e',roughness:.9}));m.position.y=.6;m.castShadow=true;g.add(m)},
 '💡':g=>{cyl(g,.12,.03,'#3b3b3b',0,.015,0);cyl(g,.02,1.4,'#3b3b3b',0,.7,0);cyl(g,.18,.25,'#f3e6c8',0,1.45,0)},
 '🛌':g=>{box(g,1,.45,1.9,'#d9c4a3',0,0,0);box(g,.95,.15,1.85,'#f2ece2',0,.45,0);box(g,1,.5,.08,'#a3794f',0,.45,-.95)},
 default:g=>box(g,.7,.5,.7,'#b39a7a',0,.05,0)};
const furn=new THREE.Group();house.add(furn);
const meshes=new Map();
function build(){furn.clear();meshes.clear();for(const p of S.products){const g=new THREE.Group();(SHAPE[p.icon]||SHAPE.default)(g);const pc=p.color&&!p.colors?new THREE.Color(p.color):null;g.traverse(o=>{if(!o.isMesh)return;const k=hex(o.material.color);o.userData.part=k;const c=p.colors&&p.colors[k];
  if(c||pc){o.material=o.material.clone();if(c)o.material.color.set(c);else o.material.color.lerp(pc,.75)}})
 g.userData.p=p;place(g);furn.add(g);meshes.set(p,g)}if(SEL)select(S.products.includes(SEL)?SEL:null)}
const place=g=>{const p=g.userData.p,k=p.scale||{};g.scale.set(k.x||1,k.y||1,k.z||1);g.position.set(p.gx*SX,0.05,p.gy*SZ);g.rotation.y=-(g.userData.p.rot||0)*Math.PI/180};
function rebuildAll(){regions();buildStruct();build()}

// undo history (products + walls + rooms)
const H=[];const snap=()=>JSON.stringify({p:S.products,w:S.walls,r:S.rooms,wc:S.wallColor||null});
function push(){H.push(snap());if(H.length>20)H.shift();updUndo()}
const undoBtn=document.getElementById('undoBtn');
function updUndo(){undoBtn.disabled=!H.length}
undoBtn.onclick=()=>{if(!H.length)return;const o=JSON.parse(H.pop());S.products=o.p;S.walls=o.w;S.rooms=o.r;if(o.wc)S.wallColor=o.wc;else delete S.wallColor;SEL=null;if(TOOL==='color')syncColor();closeCard();rebuildAll();save();updUndo()};

// build mode + tools
const DRAW=()=>TOOL==='wall'||TOOL==='erase';var BUILD=false,SEL=null,TOOL='move';const buildBtn=document.getElementById('buildBtn'),bar=document.getElementById('buildBar');
function select(p){const tint=(g,c)=>g&&g.traverse(o=>o.material&&o.material.emissive&&o.material.emissive.set(c));
 if(SEL)tint(meshes.get(SEL),0);SEL=p;if(p)tint(meshes.get(p),'#4a3c08');if(typeof cpanel!=='undefined'&&TOOL==='color')syncColor();if(TOOL==='scale'&&typeof syncScale==='function')syncScale();updRot()}
function updRot(){['rotBtn'].forEach(id=>{const b=document.getElementById(id);if(b){b.classList.toggle('hidden',!(BUILD&&TOOL==='move'));b.classList.toggle('dim',!SEL)}})}
const cpanel=document.getElementById('colorPanel'),$=id=>document.getElementById(id);
const hex=c=>'#'+new THREE.Color(c).getHexString();
function syncColor(){const p=SEL;$('cProd').classList.toggle('off',!p);$('cProdName').textContent=p?(p.icon||'📦')+' '+p.name:'הקישו על רהיט';
 $('prodColor').disabled=!p;$('prodColor').value=p&&p.color?p.color:'#b39a7a';renderParts(p);
 $('wallColor').value=S.wallColor||hex((S.rooms[0]||{}).wall||'#f3ece0');
 const fr=$('floorRoom'),cur=fr.value;fr.innerHTML=S.rooms.map(r=>`<option value="${r.id}">${esc(r.name)}</option>`).join('');if(cur&&S.rooms.some(r=>r.id===cur))fr.value=cur;
 const r=S.rooms.find(r=>r.id===fr.value);$('floorColor').value=r?hex(r.floor):'#d6cfbf'}
let cBefore=null;const cStart=()=>{if(!cBefore)cBefore=snap()},cEnd=()=>{if(cBefore){H.push(cBefore);if(H.length>20)H.shift();cBefore=null;save();updUndo()}};
['prodColor','wallColor','floorColor'].forEach(id=>{$(id).addEventListener('input',cStart);$(id).addEventListener('change',cEnd)});
// product parts: every distinct original color of the model is a "part"
function partsOf(p){const g=meshes.get(p),seen=new Map();g&&g.traverse(o=>{if(o.isMesh&&o.userData.part&&!seen.has(o.userData.part))seen.set(o.userData.part,hex(o.material.color))});return [...seen]}
function renderParts(p){const box=$('cParts');if(!p){box.innerHTML='';return}
 box.innerHTML=partsOf(p).map(([k,c],i)=>`<label class="part"><input type="color" data-part="${k}" value="${c}"><small>חלק ${i+1}</small></label>`).join('');
 box.querySelectorAll('input').forEach(inp=>{inp.addEventListener('input',e=>{if(!SEL)return;cStart();SEL.colors=SEL.colors||{};delete SEL.color;SEL.colors[inp.dataset.part]=e.target.value;build()});inp.addEventListener('change',cEnd)})}
$('prodColor').addEventListener('input',e=>{if(!SEL)return;const parts=partsOf(SEL).map(x=>x[0]);SEL.color=e.target.value;delete SEL.colors;build();
 // keep the per-part pickers in sync with the "all" tint
 $('cParts').querySelectorAll('input').forEach(i=>{const m=[...meshes.get(SEL).children].find(o=>o.userData.part===i.dataset.part);if(m)i.value=hex(m.material.color)})});
$('prodReset').onclick=()=>{if(SEL&&(SEL.color||SEL.colors)){push();delete SEL.color;delete SEL.colors;build();save();syncColor()}};
$('wallColor').addEventListener('input',e=>{S.wallColor=e.target.value;buildStruct()});
$('wallReset').onclick=()=>{if(S.wallColor){push();delete S.wallColor;buildStruct();save();syncColor()}};
$('floorRoom').onchange=syncColor;
$('floorColor').addEventListener('input',e=>{const r=S.rooms.find(r=>r.id===$('floorRoom').value);if(r){r.floor=e.target.value;regions();buildStruct()}});
const TIPS={move:'גררו רהיט למיקום חדש · הקישו עליו שוב או 🔄 לסיבוב',scale:'הקישו על רהיט ושנו גודל או מתחו אותו',color:'הקישו על רהיט לצביעה · קירות ורצפה בלוח',wall:'גררו על הרצפה לציור קיר · הקישו ליציאה',erase:'הקישו על קיר או רהיט למחיקה'};
function setTool(t){TOOL=t;document.querySelectorAll('[data-tool]').forEach(b=>b.classList.toggle('on',b.dataset.tool===t));document.getElementById('tip').textContent=TIPS[t];cpanel.classList.toggle('hidden',t!=='color');if(t==='color')syncColor();$('scalePanel').classList.toggle('hidden',t!=='scale');if(t==='scale')syncScale();
 updRot();ctl.touches.ONE=(t==='move'||t==='color'||t==='scale')?THREE.TOUCH.ROTATE:null}
document.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>setTool(b.dataset.tool));
function rotSel(){if(!SEL){document.getElementById('tip').textContent='הקישו קודם על רהיט ואז 🔄';return}push();SEL.rot=((SEL.rot||0)+90)%360;place(meshes.get(SEL));save();updUndo&&updUndo()}
document.getElementById('rotBtn').onclick=rotSel;
function setBuild(on){BUILD=on;buildStruct();buildBtn.classList.toggle('on',on);bar.classList.toggle('hidden',!on);grid.visible=on;closeCard();
 if(!on){select(null);clearPrev()}setTool('move');updUndo()}
buildBtn.onclick=()=>setBuild(!BUILD);
document.getElementById('doneBtn').onclick=()=>setBuild(false);

// wall preview
const prevG=new THREE.Group();house.add(prevG);
function clearPrev(){prevG.clear()}
function showPrev(segs,color){clearPrev();for(const s of segs){const hz=s.z1===s.z2;const m=new THREE.Mesh(hz?new THREE.BoxGeometry(1,.3,.16):new THREE.BoxGeometry(.16,.3,1),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.7}));
 m.position.set((s.x1+s.x2)/2,.15,(s.z1+s.z2)/2);prevG.add(m)}}
function segLine(a,b){const out=[];if(Math.abs(b.x-a.x)>=Math.abs(b.z-a.z)){const [s,e]=[Math.min(a.x,b.x),Math.max(a.x,b.x)];for(let x=s;x<e;x++)out.push({x1:x,z1:a.z,x2:x+1,z2:a.z})}
 else{const [s,e]=[Math.min(a.z,b.z),Math.max(a.z,b.z)];for(let z=s;z<e;z++)out.push({x1:a.x,z1:z,x2:a.x,z2:z+1})}return out}
const snapPt=f=>({x:Math.max(0,Math.min(NX,Math.round(f.x))),z:Math.max(0,Math.min(NZ,Math.round(f.z)))});
function nearestWall(f){let best=null,bd=.45;for(const w of S.walls){const hz=w.z1===w.z2;const mx=(w.x1+w.x2)/2,mz=(w.z1+w.z2)/2;
 const d=hz?(Math.abs(f.z-mz)+Math.max(0,Math.abs(f.x-mx)-.5)):(Math.abs(f.x-mx)+Math.max(0,Math.abs(f.z-mz)-.5));if(d<bd){bd=d;best=w}}return best}

// pointer: raycast
const rc=new THREE.Raycaster(),ndc=new THREE.Vector2(),plane=new THREE.Plane(new THREE.Vector3(0,1,0),0),hit=new THREE.Vector3();
const cv=renderer.domElement;
function setNdc(e){const r=cv.getBoundingClientRect();ndc.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);rc.setFromCamera(ndc,cam)}
function pick(e){setNdc(e);const h=rc.intersectObjects(furn.children,true)[0];let o=h&&h.object;while(o&&!o.userData.p)o=o.parent;return o?o.userData.p:null}
function floorPt(e){setNdc(e);return rc.ray.intersectPlane(plane,hit)?{x:hit.x+CX,z:hit.z+CZ}:null}
let down=null,drag=null,wd=null,pts=0;
function cancelWall(){if(wd){if(wd.erased){const o=JSON.parse(wd.before);S.walls=o.w;S.rooms=o.r;rebuildAll()}wd=null;clearPrev()}}
cv.addEventListener('pointerdown',e=>{pts++;if(pts>1){if(drag){drag=null}ctl.enabled=true;cancelWall();return}
 down={x:e.clientX,y:e.clientY,p:BUILD&&DRAW()?null:pick(e)};
 if(BUILD&&DRAW()){const f=floorPt(e);if(!f)return;ctl.enabled=false;
  if(TOOL==='wall'){wd={a:snapPt(f),segs:[],before:snap()}}
  else{const p=pick(e);if(p){ctl.enabled=true;askDelete(p);return}wd={erased:0,before:snap()};eraseAt(f)}
  return}
 if(down)down.wasSel=SEL;if(BUILD&&down.p&&(TOOL==='color'||TOOL==='scale')){select(down.p)}else if(BUILD&&down.p){const f=floorPt(e);if(f){select(down.p);drag={p:down.p,ox:down.p.gx*SX-f.x,oz:down.p.gy*SZ-f.z,before:snap(),moved:false};ctl.enabled=false;cv.setPointerCapture(e.pointerId)}}},{capture:true});
function eraseAt(f){const w=nearestWall(f);if(w){S.walls=S.walls.filter(q=>q!==w);wd.erased++;regions();buildStruct()}}
cv.addEventListener('pointermove',e=>{
 if(wd){const f=floorPt(e);if(!f)return;if(TOOL==='wall'){wd.segs=segLine(wd.a,snapPt(f));showPrev(wd.segs,'#2f7a4a')}else eraseAt(f);return}
 if(!drag)return;const f=floorPt(e);if(!f)return;
 const sn=v=>Math.round(v*10)/10,cl=(v,a,b)=>Math.max(a,Math.min(b,v));
 const x=cl(sn(f.x+drag.ox),.3,NX-.3),z=cl(sn(f.z+drag.oz),.3,NZ-.3);
 drag.p.gx=+(x/SX).toFixed(3);drag.p.gy=+(z/SZ).toFixed(3);drag.moved=true;place(meshes.get(drag.p))});
function up(e){pts=Math.max(0,pts-1);if(BUILD&&DRAW())ctl.enabled=true;
 // wall tool: a plain tap (no stroke) leaves wall drawing but stays in design mode
 const tap=down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<8;
 if(BUILD&&TOOL==='wall'&&tap&&!(wd&&wd.segs.length)){wd=null;clearPrev();down=null;setTool('move');return}
 if(wd){const d=wd;wd=null;clearPrev();
  if(TOOL==='wall'&&d.segs.length){const K=new Set(S.walls.map(ek));const add=d.segs.filter(s=>!K.has(ek(s)));if(add.length){H.push(d.before);if(H.length>20)H.shift();S.walls.push(...add);rebuildAll();save()}}
  else if(TOOL==='erase'&&d.erased){H.push(d.before);if(H.length>20)H.shift();rebuildAll();save()}
  updUndo();down=null;return}
 if(drag){const d=drag;drag=null;ctl.enabled=true;
  if(d.moved){H.push(d.before);if(H.length>20)H.shift();const r=roomAtM(d.p.gx*SX,d.p.gy*SZ);if(r)d.p.room=r.id;save();updUndo()}}
 if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<8){
  if(down.p){if(!BUILD)openEdit(down.p);else if(TOOL==='move'&&down.wasSel===down.p)rotSel();else select(down.p)}else{select(null);closeCard()}}
 down=null}
cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',e=>{pts=Math.max(0,pts-1);ctl.enabled=true;cancelWall();if(drag){S.products=JSON.parse(drag.before).p;drag=null;ctl.enabled=true;build()}down=null});

// delete confirm (furniture)
function askDelete(p){const d=$('confirm');$('confirmMsg').textContent=`למחוק את ${p.name}?`;$('confirmIcon').textContent=p.icon||'📦';d.classList.remove('hidden');
 $('confirmNo').onclick=()=>d.classList.add('hidden');
 $('confirmYes').onclick=()=>{d.classList.add('hidden');push();S.products=S.products.filter(q=>q!==p);if(SEL===p)SEL=null;save();build()}}
$('confirm').onclick=e=>{if(e.target.id==='confirm')$('confirm').classList.add('hidden')};
// low walls toggle (design mode)
// wall modes (Sims-style): full → cutaway → none; works in view + design
const WM=[['stub','פס נמוך','➖'],['far','רחוקים','🏠'],['full','מלאים','🧱']];
if(!WM.some(m=>m[0]===S.wallMode))S.wallMode='far';delete S.lowWalls;
function updWM(){const m=WM.find(m=>m[0]===S.wallMode);$('wallsPill').textContent=`${m[2]} ${m[1]}`}
function cycleWM(){const i=WM.findIndex(m=>m[0]===S.wallMode);S.wallMode=WM[(i+1)%WM.length][0];camSig='';updWM();buildStruct();save()}
$('wallsPill').onclick=cycleWM;updWM();
// ---- scale / stretch selected product ----
const SK=[['scAll',null],['scX','x'],['scZ','z'],['scY','y']];
function syncScale(){const p=SEL;$('sProd').textContent=p?(p.icon||'📦')+' '+p.name:'הקישו על רהיט';$('scalePanel').classList.toggle('off',!p);const k=(p&&p.scale)||{};
 SK.forEach(([id,a])=>{const el=$(id);el.disabled=!p;const v=a?(k[a]||1):((k.x||1)+(k.y||1)+(k.z||1))/3;el.value=Math.round(v*100);$(id+'V').textContent=Math.round(v*100)+'%'})}
SK.forEach(([id,a])=>{const el=$(id);el.addEventListener('input',e=>{if(!SEL)return;cStart();const v=+e.target.value/100;const k=SEL.scale=SEL.scale||{x:1,y:1,z:1};
 if(a)k[a]=v;else{k.x=k.y=k.z=v}place(meshes.get(SEL));syncScale()});el.addEventListener('change',cEnd)});
$('scReset').onclick=()=>{if(SEL&&SEL.scale){push();delete SEL.scale;place(meshes.get(SEL));save();syncScale()}};
// ---- furniture shop (v1): tap item → add form prefilled → placed in matching room ----
const SHOP=[
 {id:'bed',name:'חדר שינה',ic:'🛏️',items:[['מיטה זוגית','🛏️',14900],['מיטת יחיד','🛌',5900],['ארון בגדים','🗄️',8900],['שידת איפור','🪞',4200],['מנורה עומדת','💡',1290]]},
 {id:'kitchen',name:'מטבח',ic:'🍳',items:[['מקרר','🧊',15490],['כיריים ותנור','🍳',11900],['שולחן אוכל','🍽️',6200],['כיסא','🪑',1490],['מזנון מטבח','🗃️',9900]]},
 {id:'living',name:'סלון',ic:'🛋️',items:[['ספה','🛋️',18500],['כורסה','🛋',6900],['טלוויזיה','📺',12990],['עציץ','🪴',690],['מנורה עומדת','💡',1290]]},
 {id:'bath',name:'שירותים ואמבטיה',ic:'🛁',items:[['אסלה','🚽',4900],['אמבטיה','🛁',13900],['מקלחון','🚿',9900],['כיור ומראה','🪥',5900],['מכונת כביסה','🧺',9990]]},
 {id:'other',name:'אחר',ic:'📦',items:[['עציץ','🪴',690],['כיסא','🪑',1490],['ארגז אחסון','📦',990]]}];
let shopCat=SHOP[0].id;
const THUMB={};let tR,tS,tC;
function thumb(ic){if(THUMB[ic])return THUMB[ic];
 if(!tR){tR=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});tR.setSize(192,192);tR.outputColorSpace=THREE.SRGBColorSpace;tR.toneMapping=THREE.ACESFilmicToneMapping;
  tS=new THREE.Scene();tS.add(new THREE.HemisphereLight('#fff8ec','#cbbfa8',1.1));const d=new THREE.DirectionalLight('#ffe9c8',1.8);d.position.set(3,5,4);tS.add(d);tC=new THREE.PerspectiveCamera(30,1,.1,50)}
 const g=new THREE.Group();(SHAPE[ic]||SHAPE.default)(g);tS.add(g);
 const b=new THREE.Box3().setFromObject(g),c=b.getCenter(new THREE.Vector3()),r=b.getSize(new THREE.Vector3()).length()/2;
 tC.position.copy(c).add(new THREE.Vector3(1,.8,1.25).normalize().multiplyScalar(r/Math.sin(THREE.MathUtils.degToRad(15))*1.05));tC.lookAt(c);
 tR.render(tS,tC);THUMB[ic]=tR.domElement.toDataURL('image/png');tS.remove(g);return THUMB[ic]}
function renderShop(){$('shopTabs').innerHTML=SHOP.map(c=>`<button class="stab${c.id===shopCat?' on':''}" data-c="${c.id}"><b>${c.ic}</b>${c.name}</button>`).join('');
 const c=SHOP.find(c=>c.id===shopCat);$('shopGrid').innerHTML=c.items.map(([n,ic,pr],i)=>`<button class="sitem" data-i="${i}"><img class="si" alt="" src="${thumb(ic)}"><b>${n}</b><small>${kc(pr)}</small></button>`).join('');
 $('shopTabs').querySelectorAll('.stab').forEach(b=>b.onclick=()=>{shopCat=b.dataset.c;renderShop()});
 $('shopGrid').querySelectorAll('.sitem').forEach(b=>b.onclick=()=>{const [n,ic,pr]=c.items[+b.dataset.i];$('shopSheet').classList.add('hidden');
  form.reset();form.name.value=n;form.price.value=pr;form.icon.value=ic;form.date.value=new Date().toISOString().slice(0,10);
  const rm=ROOMS_NOW.find(r=>r.id===c.id)||ROOMS_NOW.find(r=>r.name===c.name);if(rm)form.room.value=rm.id;$('formTitle').textContent='הוספה מהחנות';$('formSheet').classList.remove('hidden')})}
$('shopBtn').onclick=()=>{renderShop();$('shopSheet').classList.remove('hidden')};
$('closeShop').onclick=()=>$('shopSheet').classList.add('hidden');
$('shopSheet').onclick=e=>{if(e.target.id==='shopSheet')$('shopSheet').classList.add('hidden')};
// ---- house size ----
function fits(w,d){return S.walls.every(q=>Math.max(q.x1,q.x2)<=w&&Math.max(q.z1,q.z2)<=d)&&S.products.every(p=>p.gx*SX<=w-.3&&p.gy*SZ<=d-.3)}
function updSize(){$('sizeW').textContent=NX;$('sizeD').textContent=NZ;$('sizeArea').textContent=NX*NZ;$('wMinus').disabled=!(NX>10&&fits(NX-2,NZ));$('dMinus').disabled=!(NZ>8&&fits(NX,NZ-2));$('wPlus').disabled=NX>=20;$('dPlus').disabled=NZ>=18}
function setSize(w,d){if(w<10||d<8||w>20||d>18||!fits(w,d))return;NX=w;NZ=d;CX=NX/2;CZ=NZ/2;S.size={w,d};house.position.set(-CX,0,-CZ);makeGrid();grid.visible=BUILD;rebuildAll();applyBackdrop(S.setting);resetCam();save();updSize()}
$('wPlus').onclick=()=>setSize(NX+2,NZ);$('wMinus').onclick=()=>setSize(NX-2,NZ);$('dPlus').onclick=()=>setSize(NX,NZ+2);$('dMinus').onclick=()=>setSize(NX,NZ-2);
$('sizeBtn').onclick=()=>{updSize();$('sizeSheet').classList.remove('hidden')};$('closeSize').onclick=()=>$('sizeSheet').classList.add('hidden');
$('sizeSheet').onclick=e=>{if(e.target.id==='sizeSheet')$('sizeSheet').classList.add('hidden')};
// price card
const card=document.getElementById('card');
function openCard(p){card.innerHTML=`<button class="icon x">✕</button><div class="ce">${p.icon||'📦'}</div><b>${esc(p.name)}</b><div class="p">${kc(p.price)}</div><div class="d">${p.date?new Date(p.date).toLocaleDateString('he-IL'):''} · ${esc(roomName(p))}</div><button class="del edit">✏️ עריכה</button>`;
 card.classList.remove('hidden');card.querySelector('.x').onclick=closeCard;
 card.querySelector('.edit').onclick=()=>{closeCard();openEdit(p)}}
// edit sheet: name / price / purchase date / delete
let EDIT=null;function openEdit(p){EDIT=p;const f=$('editForm');$('editIcon').textContent=p.icon||'📦';$('editMeta').textContent=kc(p.price)+' · '+roomName(p);f.name.value=p.name||'';f.price.value=p.price||0;f.date.value=p.date||'';$('editSheet').classList.remove('hidden')}
$('editForm').onsubmit=e=>{e.preventDefault();const p=EDIT,f=$('editForm');if(!p)return;push();p.name=f.name.value.trim()||p.name;p.price=+f.price.value||0;p.date=f.date.value;save();build();$('editSheet').classList.add('hidden');if(TOOL==='color')syncColor()};
$('editCancel').onclick=()=>$('editSheet').classList.add('hidden');
$('editDel').onclick=()=>{const p=EDIT;$('editSheet').classList.add('hidden');if(p)askDelete(p)};
$('editSheet').onclick=e=>{if(e.target.id==='editSheet')$('editSheet').classList.add('hidden')};

function closeCard(){card.classList.add('hidden')}

// expenses sheet
const sheet=document.getElementById('sheet');
function renderList(){const P=S.products;
 document.getElementById('list').innerHTML=P.length?P.map(p=>`<li><span>${p.icon||'📦'} ${esc(p.name)}<small>${esc(roomName(p))}${p.date?' · '+new Date(p.date).toLocaleDateString('he-IL'):''}</small></span><b>${kc(p.price)}</b></li>`).join(''):'<li>אין הוצאות שמורות</li>';
 document.getElementById('total').textContent=kc(P.reduce((a,p)=>a+(+p.price||0),0))}
document.getElementById('spendBtn').onclick=()=>{renderList();sheet.classList.remove('hidden')};
document.getElementById('closeSheet').onclick=()=>sheet.classList.add('hidden');
sheet.onclick=e=>{if(e.target===sheet)sheet.classList.add('hidden')};

// add product
const form=document.getElementById('addForm');
function fillRoomSel(){const sel=document.getElementById('roomSel');sel.innerHTML=ROOMS_NOW.map(r=>`<option value="${r.id}">${esc(r.name)}</option>`).join('')||'<option value="">—</option>'}
document.getElementById('addBtn').onclick=()=>{form.reset();$('formTitle').textContent='מוצר חדש';form.date.value=new Date().toISOString().slice(0,10);document.getElementById('formSheet').classList.remove('hidden')};
document.getElementById('cancelAdd').onclick=()=>document.getElementById('formSheet').classList.add('hidden');
form.onsubmit=e=>{e.preventDefault();const r=ROOMS_NOW.find(x=>x.id===form.room.value)||{id:'',cx:CX,cz:CZ};push();
 S.products.push({id:Date.now(),name:form.name.value.trim()||'מוצר',price:+form.price.value||0,date:form.date.value,room:r.id,icon:form.icon.value,
  gx:+(r.cx/SX).toFixed(3),gy:+(r.cz/SZ).toFixed(3)});save();build();renderList();document.getElementById('formSheet').classList.add('hidden')};
try{rebuildAll()}catch(e){console.error(e);S.walls=defaultWalls();S.rooms=defaultRooms();try{rebuildAll()}catch(e2){S.products=seedP();rebuildAll()}}
save();setTool('move');updUndo();window.__homieOk=1;

applyBackdrop(S.setting);document.getElementById('setBtn').onclick=()=>{S.setting=S.setting==='building'?'ground':'building';applyBackdrop(S.setting);save()};
