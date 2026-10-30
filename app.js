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

const stage=document.getElementById('stage');
const renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
stage.appendChild(renderer.domElement);
const scene=new THREE.Scene(); scene.background=new THREE.Color('#f4efe6');
scene.fog=new THREE.Fog('#f4efe6',30,60);
const cam=new THREE.PerspectiveCamera(45,1,0.1,200);
const HOME_POS=(innerWidth<innerHeight?new THREE.Vector3(12,17,19):new THREE.Vector3(9,11,13));
cam.position.copy(HOME_POS);

scene.add(new THREE.HemisphereLight('#fffaf0','#d8cdb8',1.1));
const sun=new THREE.DirectionalLight('#fff4e0',1.4);
sun.position.set(8,14,6); sun.castShadow=true; sun.shadow.mapSize.set(2048,2048);
Object.assign(sun.shadow.camera,{left:-10,right:10,top:10,bottom:-10}); scene.add(sun);

// ground
const ground=new THREE.Mesh(new THREE.CircleGeometry(30,64),new THREE.MeshStandardMaterial({color:'#e9e2d3'}));
ground.rotation.x=-Math.PI/2; ground.position.y=-0.02; ground.receiveShadow=true; scene.add(ground);

const house=new THREE.Group(); house.position.set(-CX,0,-CZ); scene.add(house);
for(const r of ROOMS){
  const f=new THREE.Mesh(new THREE.BoxGeometry(r.w,0.05,r.d),new THREE.MeshStandardMaterial({color:r.floor,roughness:.9}));
  f.position.set(r.x+r.w/2,0.025,r.z+r.d/2); f.receiveShadow=true; house.add(f);
}
const wallMat=new THREE.MeshStandardMaterial({color:'#f7f1e6',roughness:.95});
const capMat=new THREE.MeshStandardMaterial({color:'#b9a98f'});
function wall(x1,z1,x2,z2,h=WALL_H){
  const len=Math.hypot(x2-x1,z2-z1)+WALL_T;
  const m=new THREE.Mesh(new THREE.BoxGeometry(len,h,WALL_T),wallMat);
  m.position.set((x1+x2)/2,h/2,(z1+z2)/2); m.rotation.y=-Math.atan2(z2-z1,x2-x1);
  m.castShadow=m.receiveShadow=true; house.add(m);
  const c=new THREE.Mesh(new THREE.BoxGeometry(len,0.03,WALL_T+0.01),capMat);
  c.position.set(m.position.x,h+0.015,m.position.z); c.rotation.y=m.rotation.y; house.add(c);
}
// segments with door gaps (gap of 0.9m)
const segs=[
 [0,0,10,0],[0,8,10,8],[0,0,0,8],[10,0,10,8],          // outer
 [0,4,2,4],[2.9,4,5,4],[5,4,7,4],[7.9,4,10,4],          // middle horizontal w/ doors
 [5,0,5,1.6],[5,2.5,5,4],[5,4,5,8]];                    // middle vertical w/ door living↔kitchen
segs.forEach(s=>wall(...s));

const ctl=new OrbitControls(cam,renderer.domElement);
ctl.enableDamping=true; ctl.dampingFactor=.08;
ctl.minDistance=4; ctl.maxDistance=40; ctl.maxPolarAngle=Math.PI/2-0.05;
ctl.screenSpacePanning=false; ctl.target.set(0,0.5,0);
ctl.touches={ONE:THREE.TOUCH.ROTATE,TWO:THREE.TOUCH.DOLLY_PAN};

function resize(){const w=innerWidth,h=innerHeight;renderer.setSize(w,h);cam.aspect=w/h;cam.updateProjectionMatrix()}
addEventListener('resize',resize); resize();
renderer.setAnimationLoop(()=>{ctl.update();renderer.render(scene,cam)});

document.getElementById('resetCam').onclick=()=>{cam.position.copy(HOME_POS);ctl.target.set(0,0.5,0)};
setTimeout(()=>document.getElementById('hint').style.opacity=0,6000);

// ===== Stage 2: furniture + build + undo =====
// Saved gx/gy are old-grid units (house 0..9 × 0..9) → meters x=gx*10/9, z=gy*8/9
const SX=10/9, SZ=8/9;
const seedP=()=>[
 {id:1,name:'טלוויזיה',price:12990,date:'2026-09-14',room:'living',icon:'📺',gx:1.3,gy:1.6},
 {id:2,name:'ספה',price:18500,date:'2026-08-02',room:'living',icon:'🛋️',gx:3,gy:2.8},
 {id:3,name:'מקרר',price:15490,date:'2026-07-20',room:'kitchen',icon:'🧊',gx:6.2,gy:1.4},
 {id:4,name:'שולחן אוכל',price:6200,date:'2026-08-11',room:'kitchen',icon:'🍽️',gx:7.6,gy:2.2},
 {id:5,name:'מיטה זוגית',price:14900,date:'2026-06-30',room:'bed',icon:'🛏️',gx:2,gy:6.6},
 {id:6,name:'מכונת כביסה',price:9990,date:'2026-09-01',room:'bath',icon:'🧺',gx:6.4,gy:6.6}];
let S;try{S=JSON.parse(localStorage.getItem(KEY))}catch(e){}
if(!S||typeof S!=='object')S={};
if(!Array.isArray(S.products))S.products=seedP();
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}};
save();
const kc=n=>(+n||0).toLocaleString('cs-CZ').replace(/\s/g,',')+' Kč';
const esc=t=>String(t??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const roomAtM=(x,z)=>ROOMS.find(r=>x>=r.x&&x<r.x+r.w&&z>=r.z&&z<r.z+r.d)||null;
const roomName=p=>(roomAtM(p.gx*SX,p.gy*SZ)||ROOMS.find(r=>r.id===p.room)||{name:'—'}).name;
const SIZE={'📺':[1.2,.7,.25],'🛋️':[2,.8,.9],'🧊':[.7,1.8,.7],'🍽️':[1.4,.75,.9],'🛏️':[1.6,.5,2],'🧺':[.6,.85,.6]};
const COL={'📺':'#4a4f55','🛋️':'#8fa88a','🧊':'#dfe3e2','🍽️':'#a07a55','🛏️':'#c9b8a0','🧺':'#e8e8e6'};
const texCache={};
function emojiTex(e){if(texCache[e])return texCache[e];const c=document.createElement('canvas');c.width=c.height=96;const g=c.getContext('2d');
 g.fillStyle='rgba(255,250,242,.92)';g.beginPath();g.arc(48,48,44,0,7);g.fill();g.font='60px serif';g.textAlign='center';g.textBaseline='middle';g.fillText(e,48,54);
 return texCache[e]=new THREE.CanvasTexture(c)}
const furn=new THREE.Group();house.add(furn);
const meshes=new Map();
function build(){furn.clear();meshes.clear();for(const p of S.products){
 const [w,h,d]=SIZE[p.icon]||[.7,.6,.7];const g=new THREE.Group();
 const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color:COL[p.icon]||'#b9a98f',roughness:.8}));
 m.position.y=h/2+.05;m.castShadow=true;g.add(m);
 const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:emojiTex(p.icon||'📦'),depthTest:false}));sp.scale.set(.6,.6,1);sp.position.y=h+.45;sp.renderOrder=5;g.add(sp);
 g.userData.p=p;g.userData.box=m;place(g);furn.add(g);meshes.set(p,g)}}
const place=g=>g.position.set(g.userData.p.gx*SX,0,g.userData.p.gy*SZ);
build();

// undo history
const H=[];const snap=()=>JSON.stringify(S.products);
function push(){H.push(snap());if(H.length>20)H.shift();updUndo()}
const undoBtn=document.getElementById('undoBtn');
function updUndo(){undoBtn.disabled=!H.length}
undoBtn.onclick=()=>{if(!H.length)return;S.products=JSON.parse(H.pop());select(null);save();build();updUndo()};

// build mode
let BUILD=false,SEL=null;const buildBtn=document.getElementById('buildBtn'),bar=document.getElementById('buildBar');
function select(p){if(SEL&&meshes.get(SEL))meshes.get(SEL).userData.box.material.emissive.set(0);SEL=p;
 if(p&&meshes.get(p))meshes.get(p).userData.box.material.emissive.set('#5a4a10')}
buildBtn.onclick=()=>{BUILD=!BUILD;buildBtn.classList.toggle('on',BUILD);bar.classList.toggle('hidden',!BUILD);if(!BUILD)select(null);updUndo()};

// pointer: raycast
const rc=new THREE.Raycaster(),ndc=new THREE.Vector2(),plane=new THREE.Plane(new THREE.Vector3(0,1,0),0),hit=new THREE.Vector3();
const cv=renderer.domElement;
function setNdc(e){const r=cv.getBoundingClientRect();ndc.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);rc.setFromCamera(ndc,cam)}
function pick(e){setNdc(e);const h=rc.intersectObjects(furn.children,true)[0];let o=h&&h.object;while(o&&!o.userData.p)o=o.parent;return o?o.userData.p:null}
function floorPt(e){setNdc(e);return rc.ray.intersectPlane(plane,hit)?{x:hit.x+CX,z:hit.z+CZ}:null}
let down=null,drag=null,pts=0;
cv.addEventListener('pointerdown',e=>{pts++;if(pts>1){if(drag){drag=null;ctl.enabled=true}return}
 down={x:e.clientX,y:e.clientY,p:pick(e)};
 if(BUILD&&down.p){const f=floorPt(e);if(f){select(down.p);drag={p:down.p,ox:down.p.gx*SX-f.x,oz:down.p.gy*SZ-f.z,before:snap(),moved:false};ctl.enabled=false;cv.setPointerCapture(e.pointerId)}}},{capture:true});
cv.addEventListener('pointermove',e=>{if(!drag)return;const f=floorPt(e);if(!f)return;
 const sn=v=>Math.round(v*10)/10,cl=(v,a,b)=>Math.max(a,Math.min(b,v));
 const x=cl(sn(f.x+drag.ox),.3,9.7),z=cl(sn(f.z+drag.oz),.3,7.7);
 drag.p.gx=+(x/SX).toFixed(3);drag.p.gy=+(z/SZ).toFixed(3);drag.moved=true;place(meshes.get(drag.p))});
function up(e){pts=Math.max(0,pts-1);if(drag){const d=drag;drag=null;ctl.enabled=true;
  if(d.moved){H.push(d.before);if(H.length>20)H.shift();const r=roomAtM(d.p.gx*SX,d.p.gy*SZ);if(r)d.p.room=r.id;save();updUndo()}}
 if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<8){
  if(down.p){if(!BUILD||!SEL||true)openCard(down.p)}else{select(null);closeCard()}}
 down=null}
cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',e=>{pts=Math.max(0,pts-1);if(drag){S.products=JSON.parse(drag.before);drag=null;ctl.enabled=true;build()}down=null});

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
document.getElementById('roomSel').innerHTML=ROOMS.map(r=>`<option value="${r.id}">${r.name}</option>`).join('');
document.getElementById('addBtn').onclick=()=>{form.reset();form.date.value=new Date().toISOString().slice(0,10);document.getElementById('formSheet').classList.remove('hidden')};
document.getElementById('cancelAdd').onclick=()=>document.getElementById('formSheet').classList.add('hidden');
form.onsubmit=e=>{e.preventDefault();const r=ROOMS.find(x=>x.id===form.room.value);push();
 S.products.push({id:Date.now(),name:form.name.value.trim()||'מוצר',price:+form.price.value||0,date:form.date.value,room:r.id,icon:form.icon.value,
  gx:+((r.x+r.w/2)/SX).toFixed(3),gy:+((r.z+r.d/2)/SZ).toFixed(3)});save();build();renderList();document.getElementById('formSheet').classList.add('hidden')};
updUndo();
