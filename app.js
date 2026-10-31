import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';

const KEY='home-spend-v1';
// Default layout (grid units = meters). x: 0..10, z: 0..8
const ROOMS=[
 {id:'living', name:'סלון',  x:0,z:0,w:5,d:4,floor:'#d9c4a3'},
 {id:'kitchen',name:'מטבח',  x:5,z:0,w:5,d:4,floor:'#e8e1d4'},
 {id:'bed',    name:'חדר שינה',x:0,z:4,w:5,d:4,floor:'#cdb79a'},
 {id:'bath',   name:'אמבטיה',x:5,z:4,w:5,d:4,floor:'#dfe6e4'}];
const WALL_H=2.6, WALL_T=0.12, CX=5, CZ=4;

const NX=10,NZ=8;
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
function applyBackdrop(set){backdrop.clear();const bm=(c)=>new THREE.MeshStandardMaterial({color:c,roughness:1});
 if(set==='building'){scene.background.set('#dfe4e8');scene.fog.color.set('#dfe4e8');ground.material.color.set('#bfc2c2');ground.position.y=-0.32;
  const slab=new THREE.Mesh(new THREE.BoxGeometry(12.4,0.3,10.4),bm('#d2d0cb'));slab.position.y=-0.16;slab.receiveShadow=true;backdrop.add(slab);
  const par=[[0,-5.3,12.6,.2],[0,5.3,12.6,.2],[-6.3,0,.2,10.8],[6.3,0,.2,10.8]];par.forEach(([x,z,w,d])=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,.5,d),bm('#c4c1ba'));m.position.set(x,.1,z);backdrop.add(m)});
  [[-16,-14,6,9,5],[14,-16,7,13,6],[-20,6,5,7,6],[20,4,6,10,5],[2,-22,8,16,6],[-8,-24,5,11,5]].forEach(([x,z,w,h,d])=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),bm('#b9c0c6'));m.position.set(x,h/2-6,z);backdrop.add(m)});
 }else{scene.background.set('#e9efe0');scene.fog.color.set('#e9efe0');ground.material.color.set('#a9c08a');ground.position.y=-0.02;
  const yard=new THREE.Mesh(new THREE.BoxGeometry(11,.04,9),bm('#cfc4ac'));yard.position.y=-0.01;backdrop.add(yard);
  [[-8,-6],[8,-7],[-9,5],[9,6],[0,-9]].forEach(([x,z])=>{const t=new THREE.Mesh(new THREE.SphereGeometry(1,16,12),bm('#7f9c62'));t.position.set(x,1,z);t.scale.set(1,1.2,1);t.castShadow=true;backdrop.add(t)});}
 const b=document.getElementById('setBtn');if(b)b.textContent=set==='building'?'🏢 בניין':'🌳 קרקע'}
const house=new THREE.Group(); house.position.set(-CX,0,-CZ); scene.add(house);
const struct=new THREE.Group(); house.add(struct);
// grid overlay for build mode
const grid=new THREE.GridHelper(10,10,'#8a7a60','#8a7a60'); grid.scale.set(1,1,0.8); grid.position.set(5,0.07,4);
grid.material.transparent=true; grid.material.opacity=.35; grid.visible=false; house.add(grid);

// camera fit: house bigger in frame (portrait looks along the short side)
function homeView(){const a=cam.aspect||innerWidth/innerHeight,vt=Math.tan(THREE.MathUtils.degToRad(22.5)),ht=vt*a;
 const portrait=a<0.9;const dir=portrait?new THREE.Vector3(0.95,1.25,0.32):new THREE.Vector3(0.75,1.05,1);dir.normalize();
 const hw=portrait?6.3:6.8,hh=portrait?4.4:4.2;const dist=Math.max(hw/ht,hh/vt)*1.02;
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
renderer.setAnimationLoop(()=>{ctl.update();renderer.render(scene,cam)});
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
const okW=w=>w&&[w.x1,w.z1,w.x2,w.z2].every(n=>typeof n==='number'&&isFinite(n)&&n>=0&&n<=Math.max(NX,NZ));
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
function buildStruct(){struct.clear();const WH=BUILD?WALL_H:0.2;
 const tile=new THREE.BoxGeometry(1,0.05,1);
 for(let z=0;z<NZ;z++)for(let x=0;x<NX;x++){const r=CELL[z][x];
  // subtle checker tone difference inside rooms
  const base=new THREE.Color(r?r.floor:'#d6cfbf');if((x+z)%2)base.offsetHSL(0,0,-0.025);
  const m=new THREE.Mesh(tile,mat('#'+base.getHexString(),{roughness:.85}));m.position.set(x+.5,0.025,z+.5);m.receiveShadow=true;struct.add(m)}
 for(const w of S.walls){const hz=w.z1===w.z2;
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
 default:g=>box(g,.7,.5,.7,'#b39a7a',0,.05,0)};
const furn=new THREE.Group();house.add(furn);
const meshes=new Map();
function build(){furn.clear();meshes.clear();for(const p of S.products){const g=new THREE.Group();(SHAPE[p.icon]||SHAPE.default)(g);if(p.color){const pc=new THREE.Color(p.color);g.traverse(o=>{if(o.isMesh){o.material=o.material.clone();o.material.color.lerp(pc,.75)}})}
 g.userData.p=p;place(g);furn.add(g);meshes.set(p,g)}if(SEL)select(S.products.includes(SEL)?SEL:null)}
const place=g=>{g.position.set(g.userData.p.gx*SX,0.05,g.userData.p.gy*SZ);g.rotation.y=-(g.userData.p.rot||0)*Math.PI/180};
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
 if(SEL)tint(meshes.get(SEL),0);SEL=p;if(p)tint(meshes.get(p),'#4a3c08');if(typeof cpanel!=='undefined'&&TOOL==='color')syncColor();updRot()}
function updRot(){const b=document.getElementById('rotBtn');if(b)b.classList.toggle('hidden',!(BUILD&&SEL&&TOOL==='move'))}
const cpanel=document.getElementById('colorPanel'),$=id=>document.getElementById(id);
const hex=c=>'#'+new THREE.Color(c).getHexString();
function syncColor(){const p=SEL;$('cProd').classList.toggle('off',!p);$('cProdName').textContent=p?(p.icon||'📦')+' '+p.name:'הקישו על רהיט';
 $('prodColor').disabled=!p;$('prodColor').value=p&&p.color?p.color:'#b39a7a';
 $('wallColor').value=S.wallColor||hex((S.rooms[0]||{}).wall||'#f3ece0');
 const fr=$('floorRoom'),cur=fr.value;fr.innerHTML=S.rooms.map(r=>`<option value="${r.id}">${esc(r.name)}</option>`).join('');if(cur&&S.rooms.some(r=>r.id===cur))fr.value=cur;
 const r=S.rooms.find(r=>r.id===fr.value);$('floorColor').value=r?hex(r.floor):'#d6cfbf'}
let cBefore=null;const cStart=()=>{if(!cBefore)cBefore=snap()},cEnd=()=>{if(cBefore){H.push(cBefore);if(H.length>20)H.shift();cBefore=null;save();updUndo()}};
['prodColor','wallColor','floorColor'].forEach(id=>{$(id).addEventListener('input',cStart);$(id).addEventListener('change',cEnd)});
$('prodColor').addEventListener('input',e=>{if(!SEL)return;SEL.color=e.target.value;build()});
$('prodReset').onclick=()=>{if(SEL&&SEL.color){push();delete SEL.color;build();save();syncColor()}};
$('wallColor').addEventListener('input',e=>{S.wallColor=e.target.value;buildStruct()});
$('wallReset').onclick=()=>{if(S.wallColor){push();delete S.wallColor;buildStruct();save();syncColor()}};
$('floorRoom').onchange=syncColor;
$('floorColor').addEventListener('input',e=>{const r=S.rooms.find(r=>r.id===$('floorRoom').value);if(r){r.floor=e.target.value;regions();buildStruct()}});
const TIPS={move:'גררו רהיט להזזה · בחרו רהיט ולחצו 🔄 לסיבוב',color:'הקישו על רהיט לצביעה · קירות ורצפה בלוח',wall:'גררו על הרצפה לציור קיר',erase:'לחצו/גררו על קיר למחיקה'};
function setTool(t){TOOL=t;document.querySelectorAll('[data-tool]').forEach(b=>b.classList.toggle('on',b.dataset.tool===t));document.getElementById('tip').textContent=TIPS[t];cpanel.classList.toggle('hidden',t!=='color');if(t==='color')syncColor();
 updRot();ctl.touches.ONE=(t==='move'||t==='color')?THREE.TOUCH.ROTATE:null}
document.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>setTool(b.dataset.tool));
document.getElementById('rotBtn').onclick=()=>{if(!SEL)return;push();SEL.rot=((SEL.rot||0)+90)%360;place(meshes.get(SEL));save()};
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
  else{wd={erased:0,before:snap()};eraseAt(f)}
  return}
 if(BUILD&&down.p&&TOOL==='color'){select(down.p)}else if(BUILD&&down.p){const f=floorPt(e);if(f){select(down.p);drag={p:down.p,ox:down.p.gx*SX-f.x,oz:down.p.gy*SZ-f.z,before:snap(),moved:false};ctl.enabled=false;cv.setPointerCapture(e.pointerId)}}},{capture:true});
function eraseAt(f){const w=nearestWall(f);if(w){S.walls=S.walls.filter(q=>q!==w);wd.erased++;regions();buildStruct()}}
cv.addEventListener('pointermove',e=>{
 if(wd){const f=floorPt(e);if(!f)return;if(TOOL==='wall'){wd.segs=segLine(wd.a,snapPt(f));showPrev(wd.segs,'#2f7a4a')}else eraseAt(f);return}
 if(!drag)return;const f=floorPt(e);if(!f)return;
 const sn=v=>Math.round(v*10)/10,cl=(v,a,b)=>Math.max(a,Math.min(b,v));
 const x=cl(sn(f.x+drag.ox),.3,9.7),z=cl(sn(f.z+drag.oz),.3,7.7);
 drag.p.gx=+(x/SX).toFixed(3);drag.p.gy=+(z/SZ).toFixed(3);drag.moved=true;place(meshes.get(drag.p))});
function up(e){pts=Math.max(0,pts-1);if(BUILD&&DRAW())ctl.enabled=true;
 if(wd){const d=wd;wd=null;clearPrev();
  if(TOOL==='wall'&&d.segs.length){const K=new Set(S.walls.map(ek));const add=d.segs.filter(s=>!K.has(ek(s)));if(add.length){H.push(d.before);if(H.length>20)H.shift();S.walls.push(...add);rebuildAll();save()}}
  else if(TOOL==='erase'&&d.erased){H.push(d.before);if(H.length>20)H.shift();rebuildAll();save()}
  updUndo();down=null;return}
 if(drag){const d=drag;drag=null;ctl.enabled=true;
  if(d.moved){H.push(d.before);if(H.length>20)H.shift();const r=roomAtM(d.p.gx*SX,d.p.gy*SZ);if(r)d.p.room=r.id;save();updUndo()}}
 if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<8){
  if(down.p){if(!BUILD)openCard(down.p);else select(down.p)}else{select(null);closeCard()}}
 down=null}
cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',e=>{pts=Math.max(0,pts-1);ctl.enabled=true;cancelWall();if(drag){S.products=JSON.parse(drag.before).p;drag=null;ctl.enabled=true;build()}down=null});

// price card
const card=document.getElementById('card');
function openCard(p){card.innerHTML=`<button class="icon x">✕</button><div class="ce">${p.icon||'📦'}</div><b>${esc(p.name)}</b><div class="p">${kc(p.price)}</div><div class="d">${p.date?new Date(p.date).toLocaleDateString('he-IL'):''} · ${esc(roomName(p))}</div><button class="del">🗑️ מחק</button>`;
 card.classList.remove('hidden');card.querySelector('.x').onclick=closeCard;
 card.querySelector('.del').onclick=()=>{push();S.products=S.products.filter(q=>q!==p);select(null);save();build();closeCard()}}
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
document.getElementById('addBtn').onclick=()=>{form.reset();form.date.value=new Date().toISOString().slice(0,10);document.getElementById('formSheet').classList.remove('hidden')};
document.getElementById('cancelAdd').onclick=()=>document.getElementById('formSheet').classList.add('hidden');
form.onsubmit=e=>{e.preventDefault();const r=ROOMS_NOW.find(x=>x.id===form.room.value)||{id:'',cx:5,cz:4};push();
 S.products.push({id:Date.now(),name:form.name.value.trim()||'מוצר',price:+form.price.value||0,date:form.date.value,room:r.id,icon:form.icon.value,
  gx:+(r.cx/SX).toFixed(3),gy:+(r.cz/SZ).toFixed(3)});save();build();renderList();document.getElementById('formSheet').classList.add('hidden')};
try{rebuildAll()}catch(e){console.error(e);S.walls=defaultWalls();S.rooms=defaultRooms();try{rebuildAll()}catch(e2){S.products=seedP();rebuildAll()}}
save();setTool('move');updUndo();window.__homieOk=1;

applyBackdrop(S.setting);document.getElementById('setBtn').onclick=()=>{S.setting=S.setting==='building'?'ground':'building';applyBackdrop(S.setting);save()};
