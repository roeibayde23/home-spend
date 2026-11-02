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
const sun=new THREE.DirectionalLight('#ffe9c8',1.55);
sun.position.set(2.2,20,3); sun.castShadow=true; // v8: high sun → short shadows; interior walls also block via shadow proxies
const sunSide=new THREE.DirectionalLight('#ffe9c8',.55);sunSide.position.set(7,9,9);scene.add(sunSide); sun.shadow.mapSize.set(2048,2048); sun.shadow.bias=-0.0005; sun.shadow.normalBias=0.02;
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
  // v8: softer trees (small, muted, layered crowns) + low bush clusters that blend with the lawn
  [[8.5,-6.5,1],[-7.5,-7,.85],[9,4.5,.9]].map(([x,z,s])=>[x+Math.sign(x)*(CX-5),z+Math.sign(z)*(CZ-4),s]).forEach(([x,z,s],i)=>{
   const tr=new THREE.Mesh(new THREE.CylinderGeometry(.09*s,.14*s,1.3*s,8),bm('#8b7560'));tr.position.set(x,.65*s,z);backdrop.add(tr);
   const leaf=['#7fa268','#88a872','#77996a'][i%3];[[0,1.75,0,.75],[.32,1.5,.15,.55],[-.28,1.55,-.18,.5],[.05,2.15,-.05,.5]].forEach(([dx,dy,dz,r])=>{
    const t=new THREE.Mesh(new THREE.IcosahedronGeometry(r*s,1),bm(leaf));t.position.set(x+dx*s,dy*s,z+dz*s);t.scale.y=.9;backdrop.add(t)})});
  const bush=['#6f9a55','#78a05c','#6a9450'];
  [[-6,-5.3,.4],[-2,-5.4,.35],[2.5,-5.4,.38],[6,-5.3,.35],[6.3,-1.5,.36],[6.3,2,.34],[-6.3,-2,.36],[-6.3,1.8,.34],
   [-3,5.6,.32],[3,5.6,.32],[-8.5,3,.45],[8,-2.5,.45],[-3,-8.5,.5],[4,-8.8,.45],[12,-3,.55],[-13,-6,.55]].map(([x,z,r])=>[x+Math.sign(x)*(CX-5),z+Math.sign(z)*(CZ-4),r]).forEach(([x,z,r],i)=>{
   const c=bm(bush[i%bush.length]);[[0,0,1],[.55,-.1,.75],[-.5,.08,.7]].forEach(([dx,dz,k])=>{const m=new THREE.Mesh(new THREE.SphereGeometry(r*k,12,8,0,Math.PI*2,0,Math.PI/2),c);m.position.set(x+dx*r,0,z+dz*r);m.scale.set(1.15,.75,1);backdrop.add(m)})});}
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
if(!Array.isArray(S.fwalls))S.fwalls=[];S.fwalls=S.fwalls.filter(w=>w&&[w.x1,w.z1,w.x2,w.z2].every(n=>typeof n==='number'&&isFinite(n)));
if(!Array.isArray(S.doors))S.doors=[];S.doors=S.doors.filter(k=>typeof k==='string');
const okW=w=>w&&[w.x1,w.z1,w.x2,w.z2].every(n=>typeof n==='number'&&isFinite(n)&&n>=0&&n<=20);
if(!Array.isArray(S.walls)||!S.walls.every(okW)){S.walls=[];S.rooms=defaultRooms()}
if(S.setting!=='building')S.setting='ground';
if(Array.isArray(S.rooms)&&!S.rooms.every(r=>r&&typeof r.ax==='number'&&typeof r.az==='number'))S.rooms=defaultRooms();
S.products=S.products.filter(p=>p&&typeof p==='object');{const u=new Set();S.products.forEach((p,i)=>{if(p.id==null||u.has(p.id))p.id=Date.now()+i*7+Math.floor(Math.random()*1e5);u.add(p.id)})}
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
const mat2=c=>new THREE.MeshStandardMaterial({color:c,roughness:1});const matC={};const mat=(c,o={})=>{const k=c+JSON.stringify(o);return matC[k]||(matC[k]=new THREE.MeshStandardMaterial({color:c,roughness:.9,...o}))};
const capMat=mat('#a8977c');
// v7: floor materials — procedural 1m-periodic textures, tinted by the room's floor colour
const FT=[['solid','חלק'],['wood','פרקט'],['laminate','למינציה'],['tile','אריחים'],['bigtile','אריח גדול'],['marble','שיש'],['concrete','בטון'],['carpet','שטיח מקיר לקיר']];
const FTEX={};function rnd(s){return()=>{s=(s*16807)%2147483647;return s/2147483647}}
function ftCanvas(t){const N=256,cv2=document.createElement('canvas');cv2.width=cv2.height=N;const g=cv2.getContext('2d'),R=rnd(7+t.length*13);g.fillStyle='#fff';g.fillRect(0,0,N,N);
 const noise=(a,sz=1)=>{for(let i=0;i<N*N/(sz*sz)/3;i++){const v=R();g.fillStyle=`rgba(${v<.5?0:255},${v<.5?0:255},${v<.5?0:255},${a*R()})`;g.fillRect(R()*N|0,R()*N|0,sz,sz)}};
 if(t==='wood'||t==='laminate'){const n=t==='wood'?6:4,h=N/n;for(let i=0;i<n;i++){const off=(R()*N)|0,l=t==='wood'?.55:.85;const sh=.78+R()*.22;g.fillStyle=`rgb(${255*sh|0},${245*sh|0},${228*sh|0})`;g.fillRect(0,i*h,N,h);
   g.strokeStyle='rgba(90,60,30,.18)';for(let k=0;k<7;k++){g.lineWidth=1+R()*1.5;g.beginPath();const y=i*h+R()*h;g.moveTo(0,y);for(let x=0;x<=N;x+=16)g.lineTo(x,y+Math.sin(x/30+k)*2.5);g.stroke()}
   g.fillStyle='rgba(60,40,20,.45)';g.fillRect(0,i*h,N,1.5);const L=N*l;for(let x=off%L;x<N;x+=L)g.fillRect(x,i*h,1.5,h)}}
 else if(t==='tile'||t==='bigtile'){const n=t==='tile'?4:2,s=N/n;for(let i=0;i<n;i++)for(let j=0;j<n;j++){const v=.9+R()*.1;g.fillStyle=`rgb(${255*v|0},${255*v|0},${252*v|0})`;g.fillRect(i*s,j*s,s,s)}
   noise(.05);g.fillStyle='rgba(80,80,80,.55)';for(let i=0;i<=n;i++){g.fillRect(i*s-1.5,0,3,N);g.fillRect(0,i*s-1.5,N,3)}}
 else if(t==='marble'){g.fillStyle='#f4f2ee';g.fillRect(0,0,N,N);for(let k=0;k<9;k++){g.strokeStyle=`rgba(110,110,120,${.12+R()*.25})`;g.lineWidth=.6+R()*1.8;g.beginPath();let x=R()*N,y=0;g.moveTo(x,y);while(y<N){x+=(R()-.5)*30;y+=10+R()*14;g.lineTo(x,y)}g.stroke()}
   g.fillStyle='rgba(120,120,120,.35)';g.fillRect(0,0,N,1);g.fillRect(0,0,1,N)}
 else if(t==='concrete'){g.fillStyle='#e9e7e3';g.fillRect(0,0,N,N);noise(.12,2);noise(.08,1);for(let k=0;k<14;k++){g.fillStyle=`rgba(90,90,90,${.04+R()*.05})`;g.beginPath();g.arc(R()*N,R()*N,8+R()*30,0,7);g.fill()}}
 else if(t==='carpet'){g.fillStyle='#f2efe9';g.fillRect(0,0,N,N);noise(.25,1);noise(.15,2)}
 const tx=new THREE.CanvasTexture(cv2);tx.colorSpace=THREE.SRGBColorSpace;tx.anisotropy=4;return tx}
function ftTex(t){return FTEX[t]||(FTEX[t]=ftCanvas(t))}
const fmatC={};function floorMat(c,t){const k=c+'|'+t;if(fmatC[k])return fmatC[k];const o={color:c,roughness:t==='marble'||t==='tile'||t==='bigtile'?.35:t==='carpet'?1:.8};if(t&&t!=='solid')o.map=ftTex(t);return fmatC[k]=new THREE.MeshStandardMaterial(o)}
function camDir(){const d=cam.position.clone().sub(ctl.target);return {x:d.x,z:d.z}}
// in cutaway mode, rebuild walls when the camera swings to another side of the house
let camSig='';function camSide(){if(S.wallMode!=='far')return;const d=camDir(),s=(d.x>0)+''+(d.z>0);if(s!==camSig){camSig=s;buildStruct()}}
function buildStruct(){struct.clear();const DK=new Set(S.doors||[]);S.doors=(S.doors||[]).filter(k=>S.walls.some(w=>ek(w)===k));
 const shM=new THREE.MeshBasicMaterial({colorWrite:false,depthWrite:false});
 const proxy=(w,h,d,x,y,z,ry=0)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),shM);m.position.set(x,y,z);m.rotation.y=ry;m.castShadow=true;m.renderOrder=-1;struct.add(m)};const STUB=0.22,cd=camDir();
 const tile=new THREE.BoxGeometry(1,0.05,1);
 for(let z=0;z<NZ;z++)for(let x=0;x<NX;x++){const r=CELL[z][x];
  // subtle checker tone difference inside rooms
  const t=(r&&r.ft)||'solid';const base=new THREE.Color(r?r.floor:'#d6cfbf');if(t==='solid'&&(x+z)%2)base.offsetHSL(0,0,-0.025);
  if(t!=='solid')base.lerp(new THREE.Color('#ffffff'),.25);
  const m=new THREE.Mesh(tile,floorMat('#'+base.getHexString(),t));m.position.set(x+.5,0.025,z+.5);m.receiveShadow=true;struct.add(m)}
 for(const w of S.walls){const hz=w.z1===w.z2;
  // per-wall height: stub everywhere / full everywhere / Sims cutaway (far perimeter tall, rest stubs)
  const per=hz?(w.z1===0||w.z1===NZ):(w.x1===0||w.x1===NX);
  const far=per&&(((w.x1+w.x2)/2-CX)*cd.x+((w.z1+w.z2)/2-CZ)*cd.z)<0;
  const WH=S.wallMode==='full'?WALL_H:S.wallMode==='far'?(far?WALL_H:STUB):STUB;
  const A=hz?(CELL[w.z1-1]||[])[w.x1]:(CELL[w.z1]||[])[w.x1-1], B=hz?(CELL[w.z1]||[])[w.x1]:(CELL[w.z1]||[])[w.x1];
  const len=1+WALL_T*.5,mx=(w.x1+w.x2)/2,mz=(w.z1+w.z2)/2,door=DK.has(ek(w));
  // v8: wall pieces along the edge: [offset,length,y0,y1]; a door = two 5cm jambs + lintel above 2.1 m, open 0.9 m gap
  // v8b: a door = fully open ~0.94 m opening; only a lintel above 2.1 m (when walls are tall), never wall fill across the gap
  const DH=2.1,pieces=door?(WH>DH?[[0,len,DH,WH]]:[]):[[0,len,0,WH]];
  [[A,-1],[B,1]].forEach(([r,sg])=>pieces.forEach(([o,L,y0,y1])=>{const H=y1-y0;const g=hz?new THREE.BoxGeometry(L,H,WALL_T/2):new THREE.BoxGeometry(WALL_T/2,H,L);
   const m=new THREE.Mesh(g,mat(S.wallColor||(r?r.wall:'#f3ece0'),{roughness:.95}));
   m.position.set(mx+(hz?o:sg*WALL_T/4),y0+H/2,mz+(hz?sg*WALL_T/4:o));m.castShadow=m.receiveShadow=true;m.userData.wall=w;struct.add(m)}));
  if(door){const fh=WH>DH?DH:WH+.1,tm=mat('#8a6e52',{roughness:.6});[-.5+WALL_T*.25,.5-WALL_T*.25].forEach(o=>{const m=new THREE.Mesh(hz?new THREE.BoxGeometry(.06+WALL_T*.25,fh,WALL_T+.05):new THREE.BoxGeometry(WALL_T+.05,fh,.06+WALL_T*.25),tm);m.position.set(mx+(hz?o:0),fh/2,mz+(hz?0:o));m.castShadow=true;m.userData.wall=w;struct.add(m)});
   if(WH>DH){const top=new THREE.Mesh(hz?new THREE.BoxGeometry(1,.07,WALL_T+.05):new THREE.BoxGeometry(WALL_T+.05,.07,1),tm);top.position.set(mx,DH,mz);top.userData.wall=w;struct.add(top)}
   const th=new THREE.Mesh(hz?new THREE.BoxGeometry(.94,.012,WALL_T+.04):new THREE.BoxGeometry(WALL_T+.04,.012,.94),tm);th.position.set(mx,.056,mz);struct.add(th)}
  else{const c=new THREE.Mesh(hz?new THREE.BoxGeometry(len,0.04,WALL_T+.01):new THREE.BoxGeometry(WALL_T+.01,0.04,len),capMat);
  c.position.set(mx,WH+.02,mz);c.userData.wall=w;struct.add(c)}
  // v8: invisible full-height shadow caster on interior walls so furniture shadows never leak into the next room
  if(!per){const pl=door?[[-.5+.02,.04],[.5-.02,.04]]:[[0,len]];pl.forEach(([o,L])=>proxy(hz?L:WALL_T,WALL_H,hz?WALL_T:L,mx+(hz?o:0),WALL_H/2,mz+(hz?0:o)));if(door)proxy(hz?len:WALL_T,WALL_H-DH,hz?WALL_T:len,mx,(WALL_H+DH)/2,mz)}}
 // v7: free walls — any start/end point on the floor (0.25 m snap); decorative partitions, rooms still come from grid walls
 for(const w of S.fwalls){const dx=w.x2-w.x1,dz=w.z2-w.z1,L=Math.hypot(dx,dz);if(L<.05)continue;const WH=S.wallMode==='full'?WALL_H:.22;
  const m=new THREE.Mesh(new THREE.BoxGeometry(L+WALL_T*.5,WH,WALL_T),mat(S.wallColor||'#f3ece0',{roughness:.95}));m.position.set((w.x1+w.x2)/2,WH/2,(w.z1+w.z2)/2);m.rotation.y=-Math.atan2(dz,dx);m.castShadow=m.receiveShadow=true;m.userData.fwall=w;struct.add(m);proxy(L,WALL_H,WALL_T,m.position.x,WALL_H/2,m.position.z,m.rotation.y);
  const c=new THREE.Mesh(new THREE.BoxGeometry(L+WALL_T*.5,.04,WALL_T+.01),capMat);c.position.set(m.position.x,WH+.02,m.position.z);c.rotation.y=m.rotation.y;struct.add(c)}}

// ---- furniture: simple 3D shapes per type ----
function box(g,w,h,d,c,x=0,y=0,z=0,o){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color:c,roughness:.75,...o}));
 m.position.set(x,y+h/2,z);m.castShadow=m.receiveShadow=true;g.add(m);return m}
function cyl(g,r,h,c,x,y,z,rx=0){const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,24),new THREE.MeshStandardMaterial({color:c,roughness:.5}));
 m.position.set(x,y,z);m.rotation.x=rx;m.castShadow=true;g.add(m);return m}
function cone(g,rt,rb,h,c,x,y,z,o){const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,24),new THREE.MeshStandardMaterial({color:c,roughness:.5,...o}));m.position.set(x,y+h/2,z);m.castShadow=true;g.add(m);return m}
function ball(g,r,c,x,y,z){const m=new THREE.Mesh(new THREE.SphereGeometry(r,12,10),new THREE.MeshStandardMaterial({color:c,roughness:.8}));m.position.set(x,y,z);m.castShadow=true;g.add(m);return m}
// kitchen counter add-ons: sink and/or cooktop on top (p.kit={sink,stove})
function kitTop(g,k,y,w){if(!k)return;if(k.sink){box(g,.5,.02,.38,'#b8bcbd',-w*.25,y,.02,{metalness:.6,roughness:.3});cyl(g,.022,.28,'#b8bcbd',-w*.25,y+.14,-.2);box(g,.03,.03,.16,'#b8bcbd',-w*.25,y+.26,-.13)}
 if(k.stove){box(g,.58,.015,.5,'#1f1f1f',w*.25,y,0,{roughness:.2});[[-.13,-.11],[.13,-.11],[-.13,.11],[.13,.11]].forEach(([x,z])=>cyl(g,.08,.01,'#555',w*.25+x,y+.02,z))}}
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
 '🗃️':(g,p)=>{box(g,2,.9,.6,'#efe7da',0,0,0);box(g,2.02,.04,.62,'#8f8576',0,.9,0);box(g,2,.7,.35,'#efe7da',0,1.5,-.12);kitTop(g,p&&p.kit,.94,2)},
 '🍴':g=>{box(g,1.6,.05,.9,'#a3794f',0,.71,0);[-.72,.72].forEach(x=>[-.38,.38].forEach(z=>box(g,.07,.71,.07,'#7b5a3a',x,0,z)))},
 '🏝️':(g,p)=>{box(g,1.8,.86,.75,'#efe7da',0,.04,-.08);box(g,1.76,.04,.71,'#7b6a55',0,0,-.08);[-.6,0,.6].forEach(x=>box(g,.56,.7,.01,'#e2d8c8',x,.12,-.46));
  box(g,1.95,.05,1.05,'#8f8576',0,.9,0);[-.6,0,.6].forEach(x=>{cyl(g,.17,.05,'#2f4a3a',x,.66,.78);cyl(g,.025,.64,'#3b3b3b',x,.32,.78);cyl(g,.15,.015,'#3b3b3b',x,.01,.78);cyl(g,.12,.012,'#3b3b3b',x,.26,.78)});kitTop(g,p&&p.kit,.95,1.95)},
 '🚪':g=>{box(g,1.2,.1,.58,'#7b6a55',0,0,0);box(g,1.2,2.2,.6,'#efe7da',0,.1,0);box(g,.01,2.15,.01,'#bfb4a2',0,.12,.305);box(g,1.18,.01,.01,'#bfb4a2',0,1.25,.305);[-.06,.06].forEach(x=>{box(g,.025,.35,.03,'#8a7a60',x,.8,.31);box(g,.025,.25,.03,'#8a7a60',x,1.45,.31)});box(g,1.22,.04,.62,'#d9cbb5',0,2.3,0)},
 '🟤':g=>{cyl(g,.65,.02,'#c48f6a',0,.01,0);cyl(g,.5,.022,'#e8d2b0',0,.012,0);cyl(g,.25,.024,'#b85c44',0,.014,0)},
 '🟫':g=>{box(g,3,.02,2.2,'#8c6a4f',0,0,0);box(g,2.8,.022,2,'#e8dcc4',0,0,0);box(g,2.2,.024,1.4,'#5f6f5a',0,0,0);box(g,1.4,.026,.7,'#d9b45a',0,0,0)},
 '🧥':g=>{box(g,1.8,2.2,.65,'#d9c9b0',0,0,0);box(g,.9,2.1,.02,'#c4ab86',-.45,.05,.33);box(g,.9,2.1,.02,'#bcd3dc',.45,.05,.34,{roughness:.1});box(g,1.82,.04,.67,'#8a7a60',0,2.2,0)},
 '👗':g=>{box(g,1.5,2.1,.6,'#f2ece2',0,0,0);[-.5,0,.5].forEach(x=>{box(g,.48,2,.01,'#e6dccb',x,.05,.305);box(g,.025,.3,.03,'#b8743f',x+(x>0?-.2:.2),.95,.31)});box(g,1.56,.06,.64,'#c48f6a',0,2.1,0)},
 '🧰':g=>{box(g,1.6,.75,.5,'#a3794f',0,.1,0);[-.75,.75].forEach(x=>box(g,.05,.1,.45,'#5a4632',x,0,0));for(let r=0;r<2;r++)for(let c=0;c<3;c++){box(g,.5,.33,.01,'#8c6440',-.53+c*.53,.13+r*.36,.25);box(g,.12,.025,.03,'#d9b45a',-.53+c*.53,.27+r*.36,.27)}},
 '🏺':g=>{cone(g,.12,.18,.55,'#c48f6a',0,0,0,{roughness:.4,metalness:.2});cone(g,.08,.12,.25,'#c48f6a',0,.55,0,{roughness:.4,metalness:.2});[[-.04,0],[.05,.03],[0,-.05]].forEach(([x,z],i)=>{cyl(g,.006,.45,'#7a5534',x,1.0,z);ball(g,.05,'#e8d2b0',x,1.24+i*.03,z)})},
 '💐':g=>{cone(g,.06,.09,.22,'#e8eef0',0,0,0,{roughness:.15,transparent:true,opacity:.8});['#d96a6a','#f2c14e','#e8a0b8','#ffffff','#b86ad9'].forEach((c,i)=>{const a=i*1.25,x=Math.cos(a)*.05,z=Math.sin(a)*.05;cyl(g,.004,.18,'#4f8a3e',x,.3,z);ball(g,.04,c,x,.4,z)})},
 '🌷':g=>{cone(g,.05,.07,.16,'#2f4a3a',0,0,0,{roughness:.3});cyl(g,.004,.14,'#4f8a3e',0,.22,0);ball(g,.035,'#d96a6a',0,.3,0)},
 '🗂️':g=>{box(g,.47,1.32,.62,'#9aa3a3',0,0,0,{roughness:.4,metalness:.3});for(let k=0;k<4;k++){box(g,.43,.29,.01,'#b8bcbd',0,.04+k*.32,.31,{metalness:.3});box(g,.14,.03,.03,'#555',0,.24+k*.32,.32)}},
 '🖥️':g=>{box(g,.22,.015,.16,'#2b2b2b',0,0,0);box(g,.04,.28,.04,'#2b2b2b',0,.015,-.03);box(g,.62,.37,.03,'#1e2124',0,.2,-.02,{roughness:.3});box(g,.58,.33,.01,'#2f4b63',0,.22,0,{emissive:'#0b1622'});box(g,.42,.015,.14,'#3b3b3b',0,0,.2)},
 '🖨️':g=>{box(g,.45,.2,.38,'#efe7da',0,0,0,{roughness:.4});box(g,.3,.02,.2,'#2b2b2b',0,.2,-.05);box(g,.28,.01,.12,'#ffffff',0,.08,.2)},
 '🔆':g=>{cyl(g,.08,.02,'#2f4a3a',0,.01,0);cyl(g,.012,.35,'#3b3b3b',0,.19,0);cone(g,.05,.1,.12,'#c48f6a',0,.33,.06,{metalness:.3})},
 '🗒️':g=>{box(g,1.6,.04,.8,'#7b5a3a',0,.72,0);box(g,.45,.72,.72,'#6a4e38',.55,0,0);box(g,.05,.72,.7,'#6a4e38',-.75,0,0);box(g,1.1,.4,.02,'#6a4e38',-.2,.3,-.36);[0,1,2].forEach(k=>{box(g,.4,.2,.01,'#8c6440',.55,.05+k*.23,.365);box(g,.1,.02,.02,'#d9b45a',.55,.17+k*.23,.37)})},
 '🫖':g=>{cyl(g,.09,.02,'#2b2b2b',0,.01,0);cone(g,.07,.09,.22,'#e6eaea',0,.02,0,{metalness:.4,roughness:.25});box(g,.03,.14,.03,'#2b2b2b',-.1,.08,0)},
 '🪴':g=>{cyl(g,.18,.35,'#b36b45',0,.17,0);const m=new THREE.Mesh(new THREE.SphereGeometry(.32,12,10),new THREE.MeshStandardMaterial({color:'#4f8a3e',roughness:.9}));m.position.y=.6;m.castShadow=true;g.add(m)},
 '💡':g=>{cyl(g,.12,.03,'#3b3b3b',0,.015,0);cyl(g,.02,1.4,'#3b3b3b',0,.7,0);cyl(g,.18,.25,'#f3e6c8',0,1.45,0)},
 '🛌':g=>{box(g,1,.45,1.9,'#d9c4a3',0,0,0);box(g,.95,.15,1.85,'#f2ece2',0,.45,0);box(g,1,.5,.08,'#a3794f',0,.45,-.95)},
 '☕':g=>{box(g,1.1,.05,.6,'#a3794f',0,.4,0);box(g,1,.03,.5,'#7b5a3a',0,.12,0);[-.5,.5].forEach(x=>[-.25,.25].forEach(z=>box(g,.05,.4,.05,'#3b3228',x,0,z)));cyl(g,.05,.08,'#ffffff',.25,.49,0)},
 '📚':g=>{box(g,1,1.9,.35,'#b08a63',0,0,0);const bc=['#8c3b2e','#2f5a7a','#d9b45a','#4f7a4a','#6a4e7a'];for(let s=0;s<4;s++){box(g,.92,.03,.36,'#8f6c4a',0,.1+s*.45,.02);for(let k=0;k<6;k++)box(g,.1,.3,.24,bc[(k+s)%5],-.38+k*.15,.13+s*.45,.1)}},
 '🧶':g=>{box(g,2,.02,1.4,'#b85c44',0,0,0);box(g,1.7,.025,1.1,'#e8d2b0',0,0,0);box(g,1.2,.03,.6,'#2f5a7a',0,0,0)},
 '🎛️':g=>{box(g,1.8,.5,.45,'#efe7da',0,.05,0);box(g,1.82,.04,.47,'#8f8576',0,.55,0);[-.6,0,.6].forEach(x=>box(g,.55,.4,.01,'#d9cbb5',x,.1,.23));[-.8,.8].forEach(x=>box(g,.05,.05,.4,'#3b3228',x,0,0))},
 '🕯️':g=>{box(g,.5,.5,.4,'#a3794f',0,.05,0);box(g,.44,.18,.01,'#8c6440',0,.3,.2);box(g,.44,.18,.01,'#8c6440',0,.08,.2);cyl(g,.07,.02,'#3b3b3b',0,.56,0);cyl(g,.015,.25,'#3b3b3b',0,.68,0);cyl(g,.12,.15,'#f3e6c8',0,.85,0)},
 '👔':g=>{box(g,1.1,1.1,.5,'#d9c4a3',0,.05,0);for(let k=0;k<4;k++){box(g,1,.22,.01,'#c4ab86',0,.12+k*.26,.25);box(g,.18,.03,.03,'#6e604b',0,.22+k*.26,.27)}},
 '🚰':g=>{box(g,1.2,.9,.6,'#efe7da',0,0,0);box(g,1.22,.04,.62,'#8f8576',0,.9,0);box(g,.6,.03,.4,'#b8bcbd',0,.92,0,{metalness:.6,roughness:.3});cyl(g,.025,.3,'#b8bcbd',0,1.08,-.22);box(g,.03,.03,.18,'#b8bcbd',0,1.2,-.14)},
 '🍷':g=>{cyl(g,.2,.05,'#2f4a3a',0,.78,0);cyl(g,.03,.75,'#3b3b3b',0,.38,0);cyl(g,.18,.02,'#3b3b3b',0,.01,0);cyl(g,.15,.015,'#3b3b3b',0,.3,0)},
 '♨️':g=>{box(g,.55,.32,.4,'#e6eaea',0,0,0,{roughness:.35});box(g,.34,.24,.01,'#2b2b2b',-.07,.04,.2,{roughness:.2});box(g,.1,.24,.01,'#9aa3a3',.2,.04,.2)},
 '🧴':g=>{box(g,.8,.85,.45,'#ffffff',0,0,0);box(g,.82,.04,.47,'#cfc6b8',0,.85,0);cyl(g,.16,.02,'#dfe6e4',0,.88,0);[-.2,.2].forEach(x=>box(g,.38,.75,.01,'#e9e2d6',x,.05,.23))},
 '🧻':g=>{[-.35,.35].forEach(x=>cyl(g,.025,1.2,'#b8bcbd',x,.6,0));[.6,.9].forEach(y=>cyl(g,.02,.75,'#b8bcbd',0,y,0).rotation.z=Math.PI/2);box(g,.6,.5,.04,'#9fc4d6',0,.45,.04);box(g,.6,.35,.04,'#f2ece2',0,.55,-.04)},
 '💻':g=>{box(g,1.3,.04,.65,'#efe7da',0,.72,0);[-.6,.6].forEach(x=>box(g,.05,.72,.6,'#3b3b3b',x,0,0));box(g,.4,.02,.28,'#9aa3a3',0,.76,.08);box(g,.4,.26,.02,'#2b2b2b',0,.77,-.07,{emissive:'#0b1622'})},
 '💺':g=>{cyl(g,.25,.03,'#2b2b2b',0,.03,0);cyl(g,.03,.4,'#555',0,.25,0);box(g,.5,.08,.48,'#2f4a3a',0,.45,0);box(g,.46,.55,.06,'#2f4a3a',0,.55,-.22);[-.25,.25].forEach(x=>box(g,.04,.18,.35,'#3b3b3b',x,.5,0))},
 // ---- v8 additions ----
 '🎀':g=>{const m=new THREE.Mesh(new THREE.SphereGeometry(.2,20,14),mat2('#d98a6c'));m.scale.set(1.1,1,.38);m.position.set(0,.2,0);m.rotation.x=-.22;m.castShadow=true;g.add(m);ball(g,.03,'#b86b50',0,.21,.075)},
 '🟪':g=>{const m=new THREE.Mesh(new THREE.BoxGeometry(.42,.42,.13,4,4,2),mat2('#8fa7b8'));const P=m.geometry.attributes.position;for(let i=0;i<P.count;i++){const x=P.getX(i),y=P.getY(i);P.setZ(i,P.getZ(i)*(1-2.2*(x*x+y*y)))}m.geometry.computeVertexNormals();m.position.set(0,.22,0);m.rotation.x=-.22;m.castShadow=true;g.add(m)},
 '🧣':g=>{const m=new THREE.Mesh(new THREE.CapsuleGeometry(.11,.5,8,16),mat2('#c9b27a'));m.rotation.z=Math.PI/2;m.scale.set(1,1,.8);m.position.y=.11;m.castShadow=true;g.add(m);[-.2,0,.2].forEach(x=>{const r=new THREE.Mesh(new THREE.TorusGeometry(.105,.008,6,20),mat2('#9c8452'));r.rotation.y=Math.PI/2;r.position.set(x,.11,0);g.add(r)})},
 '👕':g=>{const fm={metalness:.6,roughness:.35};[-.55,.55].forEach(x=>{[-.25,.25].forEach(z=>{const l=box(g,.025,1.05,.025,'#c9ccce',x,0,z,fm);l.rotation.x=z<0?.22:-.22})});for(let i=0;i<7;i++){const b=new THREE.Mesh(new THREE.CylinderGeometry(.008,.008,1.12,8),new THREE.MeshStandardMaterial({color:'#dfe2e3',...fm}));b.rotation.z=Math.PI/2;b.position.set(0,.98,-.27+i*.09);b.castShadow=true;g.add(b)}[['#9fc3d9',-.25,-.18,.42],['#f1e3c9',.2,.0,.5],['#e7a7a0',-.1,.18,.36]].forEach(([c,x,z,h])=>{const t=box(g,.36,h,.012,c,x,.98-h,z,{side:THREE.DoubleSide});t.material.roughness=1})},
 '🗳️':g=>{box(g,.45,.5,.38,'#c9a77f',0,.05,0);box(g,.47,.03,.4,'#8c6a4f',0,.55,0);box(g,.4,.18,.01,'#b48e66',0,.3,.19);box(g,.1,.02,.02,'#5a4632',0,.38,.2);[-.19,.19].forEach(x=>[-.15,.15].forEach(z=>box(g,.03,.05,.03,'#5a4632',x,0,z)))},
 '⚪':g=>{cyl(g,.25,.03,'#e8dcc4',0,.55,0);cyl(g,.025,.52,'#3b3b3b',0,.28,0);cyl(g,.16,.02,'#3b3b3b',0,.01,0)},
 '🖼️':g=>{box(g,.42,.32,.03,'#5a4632',0,0,0);box(g,.36,.26,.01,'#cfe0e8',0,.03,.015,{roughness:.3});box(g,.2,.12,.012,'#d9a46a',-.04,.06,.016);box(g,.14,.1,.012,'#6f9a55',.08,.12,.017)},
 '🎨':g=>{box(g,1.0,.7,.035,'#2b2b2b',0,0,0);box(g,.92,.62,.01,'#efe7da',0,.04,.02);box(g,.5,.35,.012,'#c48f6a',-.12,.12,.026);box(g,.35,.25,.012,'#2f5a7a',.2,.28,.027);box(g,.2,.15,.012,'#d9b45a',.25,.1,.028)},
 '🍵':g=>{box(g,.26,.34,.3,'#2b2b2b',0,0,0,{roughness:.35});box(g,.26,.06,.12,'#9aa3a3',0,.28,.15,{metalness:.5,roughness:.3});box(g,.16,.02,.1,'#555',0,.02,.14);cyl(g,.04,.07,'#ffffff',0,.075,.14);box(g,.22,.04,.24,'#9aa3a3',0,.34,0,{metalness:.5,roughness:.3})},
 '🌿':g=>{cone(g,.16,.12,.4,'#e8e1d4',0,0,0,{roughness:.4});[[0,1.2,0],[.12,.95,.05],[-.1,1.0,-.06],[.04,.75,.12],[-.08,.78,.1]].forEach(([x,y,z],i)=>{cyl(g,.01,y-.35,'#5a7a3a',x*.5,.4+(y-.4)/2,z*.5);const l=ball(g,.14+i%2*.04,'#5f8f4a',x,y,z);l.scale.set(1.3,.55,1.3)})},
 '🌵':g=>{cyl(g,.07,.12,'#c48f6a',0,.06,0);cyl(g,.04,.22,'#5f8f4a',0,.23,0);cyl(g,.022,.1,'#5f8f4a',.05,.27,0).rotation.z=-1;ball(g,.04,'#5f8f4a',0,.34,0)},
 '🌱':g=>{cyl(g,.1,.16,'#e8e1d4',0,.08,0);[0,1.6,3.2,4.7].forEach((a,i)=>{const l=ball(g,.08,i%2?'#6f9a55':'#5f8f4a',Math.cos(a)*.06,.22+i%2*.04,Math.sin(a)*.06);l.scale.set(1,.5,1.4)})},
 '🌳':g=>{cyl(g,.22,.4,'#8a7a60',0,.2,0);cyl(g,.03,1.0,'#7a5534',0,.9,0);[[0,1.6,0,.4],[.2,1.35,.1,.3],[-.2,1.4,-.1,.3],[0,1.85,0,.28]].forEach(([x,y,z,r])=>ball(g,r,'#6a9450',x,y,z))},
 '🟩':g=>{box(g,1.3,.012,.82,'#f2ece2',0,0,0);box(g,1.3,.18,.01,'#f2ece2',0,-.17,.41);box(g,1.3,.18,.01,'#f2ece2',0,-.17,-.41);box(g,.01,.18,.82,'#f2ece2',.65,-.17,0);box(g,.01,.18,.82,'#f2ece2',-.65,-.17,0);box(g,1.3,.013,.08,'#c48f6a',0,0,.2)},
 '🔳':g=>{[[-.35,-.2],[.35,-.2],[-.35,.2],[.35,.2]].forEach(([x,z])=>{box(g,.4,.008,.3,'#c9b08f',x,0,z);cyl(g,.1,.01,'#ffffff',x,.013,z)})},
 '🗑️':g=>{cone(g,.17,.14,.5,'#9aa3a3',0,0,0,{metalness:.5,roughness:.35});cyl(g,.175,.03,'#555',0,.515,0);box(g,.08,.02,.03,'#555',0,.53,.12)},
 '🚮':g=>{cone(g,.12,.1,.32,'#e8e1d4',0,0,0,{roughness:.5});cyl(g,.125,.02,'#c48f6a',0,.33,0)},
 '🎩':g=>{cyl(g,.18,.03,'#3b3b3b',0,.015,0);cyl(g,.025,1.75,'#5a4632',0,.89,0);[0,1.57,3.14,4.71].forEach(a=>{const h=cyl(g,.012,.22,'#5a4632',Math.cos(a)*.08,1.65,Math.sin(a)*.08);h.rotation.set(Math.sin(a)*.9,0,-Math.cos(a)*.9)});ball(g,.04,'#5a4632',0,1.79,0);const c=box(g,.3,.6,.12,'#4f6b7a',.12,1.05,0);c.rotation.z=.08},
 '🪝':g=>{box(g,.8,.08,.03,'#8c6a4f',0,0,0);[-.3,-.1,.1,.3].forEach(x=>{box(g,.02,.02,.08,'#3b3b3b',x,.02,.05);box(g,.02,.05,.02,'#3b3b3b',x,.03,.09)});box(g,.26,.5,.06,'#b85c44',-.2,-.48,.08)},
 '🏮':g=>{cyl(g,.07,.02,'#3b3b3b',0,.01,0);cyl(g,.01,.25,'#3b3b3b',0,.14,0);cone(g,.08,.13,.16,'#f3e6c8',0,.24,0,{emissive:'#4a3c18'})},
 '🕰️':g=>{cyl(g,.18,.04,'#ffffff',0,0,0,Math.PI/2).position.y=.18;cyl(g,.2,.03,'#3b3b3b',0,0,-.01,Math.PI/2).position.y=.18;box(g,.012,.12,.01,'#2b2b2b',0,.18,.025);box(g,.08,.012,.01,'#2b2b2b',.04,.18,.026)},
 '🪩':g=>{box(g,.55,1.6,.04,'#c9b08f',0,0,0);box(g,.48,1.52,.01,'#cfe0e8',0,.04,.025,{roughness:.05,metalness:.6});box(g,.04,.9,.04,'#c9b08f',0,0,-.3).rotation.x=-.35},
 default:g=>box(g,.7,.5,.7,'#b39a7a',0,.05,0)};
const furn=new THREE.Group();house.add(furn);
const meshes=new Map();
function build(){relink();furn.clear();meshes.clear();for(const p of S.products){const g=new THREE.Group();(SHAPE[p.icon]||SHAPE.default)(g,p);const pc=p.color&&!p.colors?new THREE.Color(p.color):null;g.traverse(o=>{if(!o.isMesh)return;const k=hex(o.material.color);o.userData.part=k;const c=p.colors&&p.colors[k];
  if(c||pc){o.material=o.material.clone();if(c)o.material.color.set(c);else o.material.color.lerp(pc,.75)}})
 g.userData.p=p;place(g);furn.add(g);meshes.set(p,g)}if(SEL)select(S.products.includes(SEL)?SEL:null)}
// v6: every item sits exactly on the floor (or on its supporting surface) — bottom of its bbox is snapped to base height
const FLOOR_Y=0.05;
const TOP={'🛋️':.52,'🛋':.5,'🛏️':.56,'🛌':.5,'🗳️':.58,'⚪':.57,'🍽️':.75,'🍴':.76,'☕':.45,'💻':.76,'🗒️':.76,'🎛️':.59,'🕯️':.55,'🗃️':.94,'🏝️':.95,'🪞':.75,'🧴':.89,'🚰':.94,'👔':1.15,'🧰':.85,'🗂️':1.32,'🍳':.91,'🧺':.85};
const STACK=new Set(['🎀','🟪','🧣','🍵','🌵','🌱','🟩','🔳','🖼️','🏮','🚮','🪴','♨️','🖥️','🖨️','🔆','💐','🌷','🫖','💡','🏺']);
const HANG={'🎨':1.25,'🕰️':1.65,'🪝':1.7};
const topOf=q=>(+q.sy||0)+(TOP[q.icon]||0)*((q.scale&&q.scale.y)||1);
const place=g=>{const p=g.userData.p,k=p.scale||{};g.scale.set(k.x||1,k.y||1,k.z||1);g.rotation.y=-(p.rot||0)*Math.PI/180;g.position.set(p.gx*SX,0,p.gy*SZ);
 g.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(g);g.position.y=FLOOR_Y+(+p.sy||0)+(p.on==null&&HANG[p.icon]||0)-(b.min.y-house.position.y);if(!isFinite(g.position.y))g.position.y=FLOOR_Y};
// footprint of a placed item in house meters
function fp(g){g.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(g);return {x0:b.min.x+CX,x1:b.max.x+CX,z0:b.min.z+CZ,z1:b.max.z+CZ}}
function surfaceAt(p,x,z){if(!STACK.has(p.icon))return null;let best=null;for(const q of S.products){if(q===p||!TOP[q.icon]||q.on===p.id)continue;const g=meshes.get(q);if(!g)continue;const f=fp(g);
  if(x>f.x0+.04&&x<f.x1-.04&&z>f.z0+.04&&z<f.z1-.04&&(!best||topOf(q)>topOf(best)))best=q}return best}
function relink(){const ids=new Map(S.products.map(q=>[q.id,q]));for(const p of S.products){if(p.on==null){if(p.sy)delete p.sy;continue}const q=ids.get(p.on);if(!q||!TOP[q.icon]||!STACK.has(p.icon)){delete p.on;delete p.sy}else p.sy=+topOf(q).toFixed(3)}}
// wall magnet: slide item flush to the nearest wall face (any rotation — uses its real footprint)
function magnet(p,thr){const g=meshes.get(p);if(!g||p.on!=null||p.icon==='🧶'||p.icon==='🟫'||p.icon==='🟤')return false;const f=fp(g),T=WALL_T/2;let bx=thr,bz=thr,dx=0,dz=0;
 const W=S.walls.slice();for(let z=0;z<NZ;z++){W.push({x1:0,z1:z,x2:0,z2:z+1},{x1:NX,z1:z,x2:NX,z2:z+1})}for(let x=0;x<NX;x++){W.push({x1:x,z1:0,x2:x+1,z2:0},{x1:x,z1:NZ,x2:x+1,z2:NZ})}
 for(const w of S.fwalls){if(Math.abs(w.x1-w.x2)<1e-6||Math.abs(w.z1-w.z2)<1e-6)W.push(w)}
 const cx=(f.x0+f.x1)/2,cz=(f.z0+f.z1)/2;
 for(const w of W){if(Math.abs(w.x1-w.x2)<1e-6){const X=w.x1,a=Math.min(w.z1,w.z2),b=Math.max(w.z1,w.z2);if(!(f.z0<b-.02&&f.z1>a+.02))continue;
   if(cx>X){const d=f.x0-(X+T);if(Math.abs(d)<bx){bx=Math.abs(d);dx=-d}}else{const d=(X-T)-f.x1;if(Math.abs(d)<bx){bx=Math.abs(d);dx=d}}}
  else{const Z=w.z1,a=Math.min(w.x1,w.x2),b=Math.max(w.x1,w.x2);if(!(f.x0<b-.02&&f.x1>a+.02))continue;
   if(cz>Z){const d=f.z0-(Z+T);if(Math.abs(d)<bz){bz=Math.abs(d);dz=-d}}else{const d=(Z-T)-f.z1;if(Math.abs(d)<bz){bz=Math.abs(d);dz=d}}}}
 if(Math.abs(dx)<.001&&Math.abs(dz)<.001)return false;
 const mv=q=>{q.gx=+((q.gx*SX+dx)/SX).toFixed(3);q.gy=+((q.gy*SZ+dz)/SZ).toFixed(3);place(meshes.get(q))};mv(p);S.products.filter(q=>q.on===p.id).forEach(mv);return true}
function rebuildAll(){regions();buildStruct();build()}

// undo history (products + walls + rooms)
const H=[];const snap=()=>JSON.stringify({p:S.products,w:S.walls,fw:S.fwalls,r:S.rooms,dr:S.doors,wc:S.wallColor||null,s:[NX,NZ]});
function push(){H.push(snap());if(H.length>20)H.shift();updUndo()}
const undoBtn=document.getElementById('undoBtn');
function updUndo(){undoBtn.disabled=!H.length}
undoBtn.onclick=()=>{if(!H.length)return;const o=JSON.parse(H.pop());S.products=o.p;S.walls=o.w;S.rooms=o.r;S.fwalls=o.fw||[];S.doors=o.dr||[];if(o.s&&(o.s[0]!==NX||o.s[1]!==NZ)){applyDims(o.s[0],o.s[1]);resetCam();updSize()}if(o.wc)S.wallColor=o.wc;else delete S.wallColor;SEL=null;if(TOOL==='color')syncColor();closeCard();rebuildAll();save();updUndo()};

// build mode + tools
const DRAW=()=>TOOL==='wall'||TOOL==='erase';let WSUB='draw';var BUILD=false,SEL=null,TOOL='move';const buildBtn=document.getElementById('buildBtn'),bar=document.getElementById('buildBar');
function select(p){const tint=(g,c)=>g&&g.traverse(o=>o.material&&o.material.emissive&&o.material.emissive.set(c));
 if(SEL)tint(meshes.get(SEL),0);SEL=p;if(p)tint(meshes.get(p),'#4a3c08');if(typeof cpanel!=='undefined'&&(TOOL==='color'||TOOL==='floor'))syncColor();if(TOOL==='scale'&&typeof syncScale==='function')syncScale();updRot()}
function updRot(){const on=BUILD&&!!SEL&&(TOOL==='move'||TOOL==='scale'||TOOL==='color');$('selCtl').classList.toggle('hidden',!on);if(on){$('selName').textContent=(SEL.icon||'📦')+' '+SEL.name;$('selScale').classList.toggle('on',TOOL==='scale');$('selColor').classList.toggle('on',TOOL==='color')}
 if(BUILD&&(TOOL==='scale'||TOOL==='color')&&!SEL)setTool('move')}
const cpanel=document.getElementById('colorPanel'),$=id=>document.getElementById(id);
const hex=c=>'#'+new THREE.Color(c).getHexString();
function syncColor(){const p=SEL;$('cProd').classList.toggle('off',!p);$('cProdName').textContent=p?(p.icon||'📦')+' '+p.name:'הקישו על רהיט';
 $('prodColor').disabled=!p;$('prodColor').value=p&&p.color?p.color:'#b39a7a';renderParts(p);
 $('wallColor').value=S.wallColor||hex((S.rooms[0]||{}).wall||'#f3ece0');
 const fr=$('floorRoom'),cur=fr.value;fr.innerHTML=S.rooms.map(r=>`<option value="${r.id}">${esc(r.name)}</option>`).join('');if(cur&&S.rooms.some(r=>r.id===cur))fr.value=cur;
 const r=S.rooms.find(r=>r.id===fr.value);$('floorColor').value=r?hex(r.floor):'#d6cfbf';
 const cur2=(r&&r.ft)||'solid';$('fTypes').innerHTML=FT.map(([k,n])=>`<button class="ft${k===cur2?' on':''}" data-ft="${k}"><img alt="" src="${ftThumb(k,r?r.floor:'#d6cfbf')}">${n}</button>`).join('');
 $('fTypes').querySelectorAll('.ft').forEach(b=>b.onclick=()=>{const rr=S.rooms.find(q=>q.id===$('floorRoom').value);if(!rr)return;push();if(b.dataset.ft==='solid')delete rr.ft;else rr.ft=b.dataset.ft;regions();buildStruct();save();syncColor()})}
function ftThumb(t,c){const k=document.createElement('canvas');k.width=k.height=44;const g=k.getContext('2d');g.fillStyle=c;g.fillRect(0,0,44,44);if(t!=='solid'){g.globalCompositeOperation='multiply';g.drawImage(ftTex(t).image,0,0,44,44)}return k.toDataURL()}
$('floorAll').onclick=()=>{const r=S.rooms.find(q=>q.id===$('floorRoom').value);if(!r)return;push();S.rooms.forEach(q=>{q.floor=r.floor;if(r.ft)q.ft=r.ft;else delete q.ft});regions();buildStruct();save();syncColor()};
let cBefore=null;const cStart=()=>{if(!cBefore)cBefore=snap()},cEnd=()=>{if(cBefore){H.push(cBefore);if(H.length>20)H.shift();cBefore=null;save();updUndo()}};
['prodColor','wallColor','floorColor'].forEach(id=>{$(id).addEventListener('input',cStart);$(id).addEventListener('change',cEnd)});
// product parts: every distinct original color of the model is a "part"
function partsOf(p){const g=meshes.get(p),seen=new Map();g&&g.traverse(o=>{if(o.isMesh&&o.userData.part&&!seen.has(o.userData.part))seen.set(o.userData.part,hex(o.material.color))});return [...seen]}
function renderParts(p){const box=$('cParts');if(!p){box.innerHTML='';return}
 const ps=partsOf(p);if(CT!=='all'&&!ps.some(x=>x[0]===CT))CT='all';
 box.innerHTML=`<button class="part${CT==='all'?' on':''}" data-part="all"><i style="background:${p.color||'conic-gradient(#d98a6c,#8fa7b8,#c9b27a,#7f957a,#d98a6c)'}"></i><small>הכל</small></button>`+ps.map(([k,c],i)=>`<button class="part${CT===k?' on':''}" data-part="${k}"><i style="background:${c}"></i><small>חלק ${i+1}</small></button>`).join('');
 box.querySelectorAll('.part').forEach(b=>b.onclick=()=>{CT=b.dataset.part;box.querySelectorAll('.part').forEach(q=>q.classList.toggle('on',q===b));$('prodColor').value=CT==='all'?(SEL&&SEL.color||'#b39a7a'):hex(b.querySelector('i').style.background);flashPart()})}
// v8b: briefly pulse the meshes of the part being colored
function flashPart(){if(!SEL||CT==='all')return;const g=meshes.get(SEL);if(!g)return;const ms=[];g.traverse(o=>{if(o.isMesh&&o.userData.part===CT)ms.push(o)});ms.forEach(o=>{o.material=o.material.clone();o.material.emissive=new THREE.Color('#ffcc55');o.material.emissiveIntensity=.6});setTimeout(()=>ms.forEach(o=>{if(o.material.emissive)o.material.emissive.set(0)}),450)}
let CT='all';
function applyProd(c){if(!SEL)return;cStart();if(CT==='all'){SEL.color=c;delete SEL.colors}else{if(SEL.color&&!SEL.colors){/*keep the all-tint for other parts*/const pc=SEL.color;SEL.colors={};partsOf(SEL).forEach(([k,v])=>SEL.colors[k]=v);delete SEL.color}SEL.colors=SEL.colors||{};delete SEL.color;SEL.colors[CT]=c}build();
 const box=$('cParts'),cur=new Map(partsOf(SEL));box.querySelectorAll('.part').forEach(b=>{const k=b.dataset.part;if(k==='all'){if(SEL.color)b.querySelector('i').style.background=SEL.color}else if(cur.has(k))b.querySelector('i').style.background=cur.get(k)})}
// stay-open preset palette (primary UX); the native picker stays as "custom"
const SW=['#ffffff','#f6f1e7','#efe3cf','#e4d2bd','#d8c3a5','#c9a77f','#b48e66','#8c6a4f','#6b4f3a','#3e2f25','#d6d2cb','#a8a49c','#6e6c68','#3b3d40','#1f2023','#f3d6cf','#e7a7a0','#d98a6c','#b8574a','#f2e3b3','#e6c36a','#c9b27a','#dfe8d6','#b5c9a7','#7f957a','#4f6b4a','#d5e3ea','#9fc3d9','#8fa7b8','#4a6a86','#2e3f5c','#d9cde3'];
function swatches(el,onPick){el.innerHTML=SW.map(c=>`<button class="sw" style="background:${c}" data-c="${c}" title="${c}"></button>`).join('');el.querySelectorAll('.sw').forEach(b=>b.onclick=e=>{e.preventDefault();e.stopPropagation();onPick(b.dataset.c);cEnd();el.querySelectorAll('.sw').forEach(q=>q.classList.toggle('on',q===b))})}
$('prodColor').addEventListener('input',e=>applyProd(e.target.value));
swatches($('pSw'),applyProd);
const setWall=c=>{cStart();S.wallColor=c;buildStruct();$('wallColor').value=c},setFloor=c=>{const r=S.rooms.find(r=>r.id===$('floorRoom').value);if(!r)return;cStart();r.floor=c;regions();buildStruct();$('floorColor').value=c;
 const t=$('fTypes').querySelectorAll('.ft img');FT.forEach(([k],i)=>{if(t[i])t[i].src=ftThumb(k,c)})};
swatches($('wSw'),setWall);swatches($('fSw'),setFloor);
$('prodReset').onclick=()=>{if(SEL&&(SEL.color||SEL.colors)){push();delete SEL.color;delete SEL.colors;build();save();syncColor()}};
$('wallColor').addEventListener('input',e=>{S.wallColor=e.target.value;buildStruct()});
$('wallReset').onclick=()=>{if(S.wallColor){push();delete S.wallColor;buildStruct();save();syncColor()}};
$('floorRoom').onchange=syncColor;
$('floorColor').addEventListener('input',e=>{const r=S.rooms.find(r=>r.id===$('floorRoom').value);if(r){r.floor=e.target.value;regions();buildStruct()}});
const TIPS={floor:'בחרו חדר, סוג רצפה וגוון · וגם צבע קירות',move:'הקישו על רהיט לסיבוב ולשינוי גודל · גררו להזזה',scale:'הקישו על רהיט ושנו גודל או מתחו אותו',color:'צבעו את הרהיט כולו או חלק-חלק',wall:'גררו על הרצפה לציור קיר · הקישו על קיר למחיקה',wallerase:'🗑️ הקישו על קיר (או גררו לאורכו) כדי למחוק · ↶ לביטול',walldoor:'🚪 הקישו על קיר חדר כדי להוסיף/להסיר משקוף דלת',erase:'הקישו על קיר או רהיט למחיקה'};
function setTool(t){if(t==='erase')t='wall';TOOL=t;document.querySelectorAll('[data-tool]').forEach(b=>b.classList.toggle('on',b.dataset.tool===t));document.getElementById('tip').textContent=t==='wall'&&WSUB!=='draw'?TIPS['wall'+WSUB]:TIPS[t];$('wallSub').classList.toggle('hidden',t!=='wall');if(t!=='wall')WSUB='draw';updWS();cpanel.classList.toggle('hidden',t!=='color');$('floorPanel').classList.toggle('hidden',t!=='floor');if(t==='color'||t==='floor')syncColor();$('scalePanel').classList.toggle('hidden',t!=='scale');if(t==='scale')syncScale();
 if(typeof updRot==='function'&&$('selCtl'))updRot();ctl.touches.ONE=(t==='move'||t==='color'||t==='scale'||t==='floor')?THREE.TOUCH.ROTATE:null}
function updWS(){document.querySelectorAll('[data-ws]').forEach(b=>b.classList.toggle('on',b.dataset.ws===WSUB))}
document.querySelectorAll('[data-ws]').forEach(b=>b.onclick=()=>{WSUB=b.dataset.ws;setTool('wall')});
document.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>setTool(b.dataset.tool));
function rotSel(){if(!SEL){document.getElementById('tip').textContent='הקישו קודם על רהיט ואז 🔄';return}push();SEL.rot=((SEL.rot||0)+90)%360;place(meshes.get(SEL));save();updUndo&&updUndo()}
document.getElementById('rotBtn').onclick=rotSel;
$('magBtn').onclick=()=>{if(!SEL)return;const b=snap();if(magnet(SEL,1.2)){H.push(b);if(H.length>20)H.shift();save();updUndo();$('tip').textContent='🧲 הוצמד לקיר'}else $('tip').textContent=SEL.on!=null?'פריט על משטח — לא מוצמד לקיר':'אין קיר קרוב (עד 1.2 מ׳)'};
$('selColor').onclick=()=>setTool(TOOL==='color'?'move':'color');$('selDel').onclick=()=>{if(SEL)askDelete(SEL)};
$('selScale').onclick=()=>setTool(TOOL==='scale'?'move':'scale');$('selClose').onclick=()=>{select(null);if(TOOL==='scale')setTool('move')};
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
const snapF=f=>({x:Math.max(0,Math.min(NX,Math.round(f.x*4)/4)),z:Math.max(0,Math.min(NZ,Math.round(f.z*4)/4))});
const snapPt=f=>({x:Math.max(0,Math.min(NX,Math.round(f.x))),z:Math.max(0,Math.min(NZ,Math.round(f.z)))});
// v7: straight wall from a→b; snaps to 0/45/90° when close; grid-aligned integer runs stay "room" walls
function wallEnd(a,b){const dx=b.x-a.x,dz=b.z-a.z,L=Math.hypot(dx,dz);if(L<.01)return b;const ang=Math.atan2(dz,dx),st=Math.PI/4,sn=Math.round(ang/st)*st;
 if(Math.abs(ang-sn)<.12){const l=Math.abs(Math.cos(sn))>.5&&Math.abs(Math.sin(sn))>.5?Math.round(L/Math.SQRT2*4)/4*Math.SQRT2:Math.round(L*4)/4;return {x:Math.max(0,Math.min(NX,+(a.x+Math.cos(sn)*l).toFixed(3))),z:Math.max(0,Math.min(NZ,+(a.z+Math.sin(sn)*l).toFixed(3)))}}return b}
function planWall(a,b){if(Math.hypot(b.x-a.x,b.z-a.z)<.25)return [];const I=v=>Math.abs(v-Math.round(v))<1e-6;
 if((a.x===b.x||a.z===b.z)&&I(a.x)&&I(a.z)&&I(b.x)&&I(b.z))return segLine({x:Math.round(a.x),z:Math.round(a.z)},{x:Math.round(b.x),z:Math.round(b.z)});
 return [{free:1,x1:a.x,z1:a.z,x2:b.x,z2:b.z}]}
function showPrevF(a,b){clearPrev();const L=Math.hypot(b.x-a.x,b.z-a.z);const dot=(p)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,.32,16),new THREE.MeshBasicMaterial({color:'#2f7a4a'}));m.position.set(p.x,.16,p.z);prevG.add(m)};dot(a);if(L<.05)return;dot(b);
 const m=new THREE.Mesh(new THREE.BoxGeometry(L,.3,.16),new THREE.MeshBasicMaterial({color:'#2f7a4a',transparent:true,opacity:.7}));m.position.set((a.x+b.x)/2,.15,(a.z+b.z)/2);m.rotation.y=-Math.atan2(b.z-a.z,b.x-a.x);prevG.add(m)}
function segDist(f,w){const dx=w.x2-w.x1,dz=w.z2-w.z1,l2=dx*dx+dz*dz||1;const t=Math.max(0,Math.min(1,((f.x-w.x1)*dx+(f.z-w.z1)*dz)/l2));return Math.hypot(f.x-w.x1-t*dx,f.z-w.z1-t*dz)}
function wallHit(e){if(!e)return null;setNdc(e);const h=rc.intersectObjects(struct.children,false).find(h=>h.object.userData.wall||h.object.userData.fwall);return h?h.object.userData:null}
function nearestWall(f){let best=null,bd=.55;for(const w of S.walls){const hz=w.z1===w.z2;const mx=(w.x1+w.x2)/2,mz=(w.z1+w.z2)/2;
 const d=hz?(Math.abs(f.z-mz)+Math.max(0,Math.abs(f.x-mx)-.5)):(Math.abs(f.x-mx)+Math.max(0,Math.abs(f.z-mz)-.5));if(d<bd){bd=d;best=w}}return best}

// pointer: raycast
const rc=new THREE.Raycaster(),ndc=new THREE.Vector2(),plane=new THREE.Plane(new THREE.Vector3(0,1,0),0),hit=new THREE.Vector3();
const cv=renderer.domElement;
function setNdc(e){const r=cv.getBoundingClientRect();ndc.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);rc.setFromCamera(ndc,cam)}
function pick(e){setNdc(e);const h=rc.intersectObjects(furn.children,true)[0];let o=h&&h.object;while(o&&!o.userData.p)o=o.parent;return o?o.userData.p:null}
function floorPt(e){setNdc(e);return rc.ray.intersectPlane(plane,hit)?{x:hit.x+CX,z:hit.z+CZ}:null}
let down=null,drag=null,wd=null,pts=0;
function cancelWall(){if(wd){if(wd.erased){const o=JSON.parse(wd.before);S.walls=o.w;S.rooms=o.r;S.fwalls=o.fw||[];S.doors=o.dr||[];rebuildAll()}wd=null;clearPrev()}}
cv.addEventListener('pointerdown',e=>{pts++;if(pts>1){if(drag){drag=null}ctl.enabled=true;cancelWall();return}
 down={x:e.clientX,y:e.clientY,p:BUILD&&DRAW()?null:pick(e)};
 if(BUILD&&DRAW()){const f=floorPt(e);if(!f)return;ctl.enabled=false;
  if(TOOL==='wall'&&WSUB==='door'){ctl.enabled=true;if(!S.walls.length){S.walls=defaultWalls();regions()}const wh=wallHit(e);const w=(wh&&wh.wall&&S.walls.includes(wh.wall))?wh.wall:nearestWall(f);
   if(!w){$('tip').textContent=wh&&wh.fwall?'משקוף אפשר רק על קירות חדר (קווי הרשת)':'לא נמצא קיר כאן — הקישו קרוב לקיר';return}
   const k=ek(w);push();if(S.doors.includes(k)){S.doors=S.doors.filter(d=>d!==k);$('tip').textContent='המשקוף הוסר'}else{S.doors.push(k);$('tip').textContent='🚪 נוסף משקוף · החדרים נשארים נפרדים'}buildStruct();save();down=null;return}
  if(TOOL==='wall'&&WSUB==='erase'){wd={erased:0,before:snap(),er:1};eraseAt(f,e);return}
  if(TOOL==='wall'){wd={a:snapF(f),segs:[],before:snap()}}
  else{const p=pick(e);if(p){ctl.enabled=true;askDelete(p);return}wd={erased:0,before:snap()};eraseAt(f)}
  return}
 if(down)down.wasSel=SEL;if(BUILD&&down.p&&(TOOL==='color'||TOOL==='scale')){select(down.p)}else if(BUILD&&down.p){const f=floorPt(e);if(f){select(down.p);drag={p:down.p,ox:down.p.gx*SX-f.x,oz:down.p.gy*SZ-f.z,before:snap(),moved:false,kids:S.products.filter(q=>q.on===down.p.id).map(q=>[q,q.gx*SX-down.p.gx*SX,q.gy*SZ-down.p.gy*SZ])};if(STACK.has(down.p.icon)){drag.ox=drag.oz=0}ctl.enabled=false;cv.setPointerCapture(e.pointerId)}}},{capture:true});
function eraseAt(f,e){const wh=wallHit(e);if(wh&&wh.fwall&&S.fwalls.includes(wh.fwall)){S.fwalls=S.fwalls.filter(q=>q!==wh.fwall);wd.erased++;buildStruct();return}if(wh&&wh.wall&&S.walls.includes(wh.wall)){const k=ek(wh.wall);S.walls=S.walls.filter(q=>q!==wh.wall);S.doors=S.doors.filter(d=>d!==k);wd.erased++;regions();buildStruct();return}
 let fb=null,fd=.4;for(const w of S.fwalls){const d=segDist(f,w);if(d<fd){fd=d;fb=w}}if(fb){S.fwalls=S.fwalls.filter(q=>q!==fb);wd.erased++;buildStruct();return}const w=nearestWall(f);if(w){const k=ek(w);S.walls=S.walls.filter(q=>q!==w);S.doors=S.doors.filter(d=>d!==k);wd.erased++;regions();buildStruct()}}
cv.addEventListener('pointermove',e=>{
 if(wd){const f=floorPt(e);if(!f)return;if(TOOL==='wall'&&!wd.er){wd.b=wallEnd(wd.a,snapF(f));wd.segs=planWall(wd.a,wd.b);showPrevF(wd.a,wd.b)}else eraseAt(f,e);return}
 if(!drag)return;const f=floorPt(e);if(!f)return;
 const sn=v=>Math.round(v*10)/10,cl=(v,a,b)=>Math.max(a,Math.min(b,v));
 let fx=f.x,fz=f.z;
 if(STACK.has(drag.p.icon)){const own=meshes.get(drag.p);const hs=rc.intersectObjects(furn.children.filter(o=>o!==own),true);for(const h of hs){let o=h.object;while(o&&!o.userData.p)o=o.parent;if(o&&TOP[o.userData.p.icon]){fx=h.point.x+CX;fz=h.point.z+CZ;break}}}
 const st=STACK.has(drag.p.icon),x=cl(st?Math.round((fx+drag.ox)*100)/100:sn(fx+drag.ox),.3,NX-.3),z=cl(st?Math.round((fz+drag.oz)*100)/100:sn(fz+drag.oz),.3,NZ-.3);
 drag.p.gx=+(x/SX).toFixed(3);drag.p.gy=+(z/SZ).toFixed(3);drag.moved=true;
 const s=surfaceAt(drag.p,x,z);if(s){drag.p.on=s.id;drag.p.sy=+topOf(s).toFixed(3)}else{delete drag.p.on;delete drag.p.sy}
 place(meshes.get(drag.p));drag.kids.forEach(([q,ox,oz])=>{q.gx=+((x+ox)/SX).toFixed(3);q.gy=+((z+oz)/SZ).toFixed(3);place(meshes.get(q))})});
function up(e){pts=Math.max(0,pts-1);if(BUILD&&DRAW())ctl.enabled=true;
 // wall tool: a plain tap (no stroke) leaves wall drawing but stays in design mode
 const tap=down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<8;
 if(BUILD&&TOOL==='wall'&&WSUB==='door'){down=null;return}
 if(BUILD&&TOOL==='wall'&&wd&&wd.er){const d=wd;wd=null;if(d.erased){H.push(d.before);if(H.length>20)H.shift();rebuildAll();save();updUndo();$('tip').textContent='🗑️ נמחק · ↶ לביטול'}down=null;return}
 if(BUILD&&TOOL==='wall'&&tap&&!(wd&&wd.segs.length)){const b0=wd&&wd.before;wd=null;clearPrev();const f=floorPt(e);const tw={erased:0,before:b0||snap()};if(f){wd=tw;eraseAt(f,e);wd=null}
  if(tw.erased){H.push(tw.before);if(H.length>20)H.shift();rebuildAll();save();updUndo();$('tip').textContent='הקיר נמחק · ↶ לביטול';down=null;return}
  down=null;setTool('move');return}
 if(wd){const d=wd;wd=null;clearPrev();
  if(TOOL==='wall'&&d.segs.length){const K=new Set(S.walls.map(ek));const g=d.segs.filter(s=>!s.free&&!K.has(ek(s))),fr=d.segs.filter(s=>s.free);if(g.length||fr.length){H.push(d.before);if(H.length>20)H.shift();S.walls.push(...g);fr.forEach(s=>S.fwalls.push({x1:s.x1,z1:s.z1,x2:s.x2,z2:s.z2}));rebuildAll();save()}}
  else if(TOOL==='erase'&&d.erased){H.push(d.before);if(H.length>20)H.shift();rebuildAll();save()}
  updUndo();down=null;return}
 if(drag){const d=drag;drag=null;ctl.enabled=true;
  if(d.moved){H.push(d.before);if(H.length>20)H.shift();magnet(d.p,HANG[d.p.icon]?1.2:.22);place(meshes.get(d.p));const r=roomAtM(d.p.gx*SX,d.p.gy*SZ);if(r)d.p.room=r.id;save();updUndo()}}
 if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<8){
  if(down.p){if(!BUILD)openCard(down.p);else if(TOOL==='move'&&down.wasSel===down.p)rotSel();else select(down.p)}else{select(null);closeCard()}}
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
 {id:'bed',name:'חדר שינה',ic:'🛏️',items:[['מיטה זוגית','🛏️',14900],['מיטת יחיד','🛌',5900],['ארון בגדים','🗄️',8900],['שידת איפור','🪞',4200],['מנורה עומדת','💡',1290],['שידת לילה','🕯️',1990],['שידה קטנה','🗳️',990],['שולחן צד','⚪',790],['מראה עומדת','🪩',1690],['שידת מגירות','👔',5400],['ארון הזזה','🧥',11900],['ארון 3 דלתות','👗',9400],['שידה רחבה','🧰',4900],['שטיח קטן','🟤',990]]},
 {id:'kitchen',name:'מטבח',ic:'🍳',items:[['מקרר','🧊',15490],['כיריים ותנור','🍳',11900],['שולחן אוכל','🍽️',6200],['כיסא','🪑',1490],['מזנון מטבח','🗃️',9900],['כיור מטבח','🚰',7400],['כיסא בר','🍷',1690],['מיקרוגל','♨️',2490],['שולחן אוכל (בלי כסאות)','🍴',4900],['אי מטבח + כסאות בר','🏝️',16900],['אי מטבח עם כיור','🏝️',19900,{sink:1}],['ארונות מטבח בגובה','🚪',8900],['מזנון + כיור','🗃️',12400,{sink:1}],['מזנון + כיריים','🗃️',13900,{stove:1}],['מזנון + כיור וכיריים','🗃️',16400,{sink:1,stove:1}],['קומקום','🫖',490],['מכונת קפה','🍵',2990],['מפת שולחן','🟩',390],['פלייסמטים (4)','🔳',290],['פח אשפה','🗑️',590]]},
 {id:'living',name:'סלון',ic:'🛋️',items:[['ספה','🛋️',18500],['כורסה','🛋',6900],['טלוויזיה','📺',12990],['עציץ','🪴',690],['מנורה עומדת','💡',1290],['שולחן קפה','☕',3900],['ספרייה','📚',4600],['שטיח','🧶',2900],['שטיח קטן','🟤',990],['שטיח גדול','🟫',4900],['מזנון טלוויזיה','🎛️',5900],['שידה רחבה','🧰',4900],['אגרטל רצפה','🏺',890],['אגרטל פרחים','💐',390],['אגרטל קטן','🌷',190],['שולחן צד','⚪',790],['צמח גבוה','🌿',1190],['תמונה גדולה (לקיר)','🎨',1490],['שעון קיר','🕰️',490]]},
 {id:'office',name:'משרד',ic:'💼',items:[['שולחן עבודה','💻',4900],['שולחן מנהלים','🗒️',8900],['כיסא משרדי','💺',3490],['כיסא אורח','🪑',1490],['ארון תיוק','🗂️',2900],['מחשב ומסך','🖥️',6900],['מדפסת','🖨️',1990],['ספריית משרד','📚',4600],['מנורת שולחן','🔆',590],['עציץ','🪴',690],['שטיח קטן','🟤',990]]},
 {id:'bath',name:'שירותים ואמבטיה',ic:'🛁',items:[['אסלה','🚽',4900],['אמבטיה','🛁',13900],['מקלחון','🚿',9900],['כיור ומראה','🪥',5900],['מכונת כביסה','🧺',9990],['פח קטן','🚮',190],['מתלה כביסה','👕',290],['ארון כיור','🧴',6900],['מתלה מגבות','🧻',1290]]},
 {id:'decor',name:'נוי ואביזרים',ic:'🖼️',items:[['כרית נוי','🎀',149],['כרית מרובעת','🟪',179],['כרית ארוכה','🧣',199],['תמונה קטנה','🖼️',290],['תמונה גדולה (לקיר)','🎨',1490],['שעון קיר','🕰️',490],['מראה עומדת','🪩',1690],['מנורת שולחן','🏮',490],['מפת שולחן','🟩',390],['פלייסמטים (4)','🔳',290],['מתלה מעילים עומד','🎩',890],['מתלה מעילים לקיר','🪝',490],['פח אשפה','🗑️',590],['פח קטן','🚮',190],['אגרטל פרחים','💐',390]]},
 {id:'plants',name:'עציצים',ic:'🌿',items:[['עציץ','🪴',690],['צמח גבוה','🌿',1190],['עץ פנים','🌳',2490],['קקטוס קטן','🌵',150],['שתיל בעציץ','🌱',120],['אגרטל קטן','🌷',190]]},
 {id:'other',name:'אחר',ic:'📦',items:[['שידה קטנה','🗳️',990],['שולחן צד','⚪',790],['עציץ','🪴',690],['כיסא','🪑',1490],['ארגז אחסון','📦',990],['אגרטל רצפה','🏺',890],['אגרטל פרחים','💐',390],['שטיח גדול','🟫',4900]]}];
let shopCat=SHOP[0].id,PENDKIT=null;
const THUMB={};let tR,tS,tC;
function thumb(ic,kit){const key=ic+(kit?JSON.stringify(kit):'');if(THUMB[key])return THUMB[key];
 if(!tR){tR=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});tR.setSize(192,192);tR.outputColorSpace=THREE.SRGBColorSpace;tR.toneMapping=THREE.ACESFilmicToneMapping;
  tS=new THREE.Scene();tS.add(new THREE.HemisphereLight('#fff8ec','#cbbfa8',1.1));const d=new THREE.DirectionalLight('#ffe9c8',1.8);d.position.set(3,5,4);tS.add(d);tC=new THREE.PerspectiveCamera(30,1,.1,50)}
 const g=new THREE.Group();(SHAPE[ic]||SHAPE.default)(g,{kit});tS.add(g);
 const b=new THREE.Box3().setFromObject(g),c=b.getCenter(new THREE.Vector3()),r=b.getSize(new THREE.Vector3()).length()/2;
 tC.position.copy(c).add(new THREE.Vector3(1,.8,1.25).normalize().multiplyScalar(r/Math.sin(THREE.MathUtils.degToRad(15))*1.05));tC.lookAt(c);
 tR.render(tS,tC);THUMB[key]=tR.domElement.toDataURL('image/png');tS.remove(g);return THUMB[key]}
function renderShop(){$('shopTabs').innerHTML=SHOP.map(c=>`<button class="stab${c.id===shopCat?' on':''}" data-c="${c.id}"><b>${c.ic}</b>${c.name}</button>`).join('');
 const c=SHOP.find(c=>c.id===shopCat);$('shopGrid').innerHTML=c.items.map(([n,ic,pr,kit],i)=>`<button class="sitem" data-i="${i}"><img class="si" alt="" src="${thumb(ic,kit)}"><b>${n}</b><small>${kc(pr)}</small></button>`).join('');
 $('shopTabs').querySelectorAll('.stab').forEach(b=>b.onclick=()=>{shopCat=b.dataset.c;renderShop()});
 $('shopGrid').querySelectorAll('.sitem').forEach(b=>b.onclick=()=>{const [n,ic,pr,kit]=c.items[+b.dataset.i];$('shopSheet').classList.add('hidden');
  form.reset();PENDKIT=kit?{...kit}:null;form.name.value=n;form.price.value=pr;form.icon.value=ic;form.date.value=new Date().toISOString().slice(0,10);
  const rm=ROOMS_NOW.find(r=>r.id===c.id)||ROOMS_NOW.find(r=>r.name===c.name);if(rm)form.room.value=rm.id;$('formTitle').textContent='הוספה מהחנות';$('formSheet').classList.remove('hidden')})}
$('shopBtn').onclick=()=>{renderShop();$('shopSheet').classList.remove('hidden')};
$('closeShop').onclick=()=>$('shopSheet').classList.add('hidden');
$('shopSheet').onclick=e=>{if(e.target.id==='shopSheet')$('shopSheet').classList.add('hidden')};
// ---- house size ----
// regrid: move the +x/+z perimeter to the new edge so edge rooms grow (keeping their floor color)
function regrid(ow,od,w,d){const K=new Set();let W=[];
 const add=s=>{if(Math.max(s.x1,s.x2)>w||Math.max(s.z1,s.z2)>d)return;const k=ek(s);if(!K.has(k)){K.add(k);W.push(s)}};
 const has=new Set(S.walls.map(ek)),hz=(x,z)=>has.has(ek({x1:x,z1:z,x2:x+1,z2:z})),vt=(x,z)=>has.has(ek({x1:x,z1:z,x2:x,z2:z+1}));
 for(const s of S.walls){const isV=s.x1===s.x2;if(isV&&s.x1===ow&&ow!==w)continue;if(!isV&&s.z1===od&&od!==d)continue;add(s)}
 // extend/carry horizontal walls touching old +x edge, vertical walls touching old +z edge
 if(w>ow)for(let z=0;z<=Math.min(od,d);z++)if(hz(ow-1,z))for(let x=ow;x<w;x++)add({x1:x,z1:z,x2:x+1,z2:z});
 if(d>od)for(let x=0;x<=Math.min(ow,w);x++)if(vt(x,od-1))for(let z=od;z<d;z++)add({x1:x,z1:z,x2:x,z2:z+1});
 for(let x=0;x<w;x++){add({x1:x,z1:0,x2:x+1,z2:0});add({x1:x,z1:d,x2:x+1,z2:d})}
 for(let z=0;z<d;z++){add({x1:0,z1:z,x2:0,z2:z+1});add({x1:w,z1:z,x2:w,z2:z+1})}
 S.walls=W}
function fitsOld(w,d){const inn=q=>{const v=q.x1===q.x2;return v?(q.x1===NX):(q.z1===NZ)};return S.walls.every(q=>inn(q)||(Math.max(q.x1,q.x2)<=w&&Math.max(q.z1,q.z2)<=d))&&S.products.every(p=>p.gx*SX<=w-.3&&p.gy*SZ<=d-.3)}
function updSize(){$('sizeW').textContent=NX;$('sizeD').textContent=NZ;$('sizeArea').textContent=NX*NZ;$('wMinus').disabled=NX<=10;$('dMinus').disabled=NZ<=8;$('wPlus').disabled=NX>=20;$('dPlus').disabled=NZ>=18}
function applyDims(w,d){NX=w;NZ=d;CX=NX/2;CZ=NZ/2;S.size={w,d};house.position.set(-CX,0,-CZ);makeGrid();grid.visible=BUILD;clearPrev();applyBackdrop(S.setting)}
function setSize(w,d){if(w<10||d<8||w>20||d>18||(w===NX&&d===NZ))return;push();if(!S.walls.length){S.walls=defaultWalls();regions()}regrid(NX,NZ,w,d);
 // keep room anchors inside the new footprint so rooms keep their name + floor colour
 S.rooms.forEach(r=>{r.ax=Math.min(r.ax,w-.5);r.az=Math.min(r.az,d-.5)});
 applyDims(w,d);
 // products outside the new bounds are pulled back onto the remaining floor
 S.products.forEach(p=>{p.gx=+(Math.max(.3,Math.min(NX-.3,p.gx*SX))/SX).toFixed(3);p.gy=+(Math.max(.3,Math.min(NZ-.3,p.gy*SZ))/SZ).toFixed(3)});
 rebuildAll();S.products.forEach(p=>{const r=roomAtM(p.gx*SX,p.gy*SZ);if(r)p.room=r.id});resetCam();save();updSize()}
$('wPlus').onclick=()=>setSize(NX+2,NZ);$('wMinus').onclick=()=>setSize(NX-2,NZ);$('dPlus').onclick=()=>setSize(NX,NZ+2);$('dMinus').onclick=()=>setSize(NX,NZ-2);
$('sizeBtn').onclick=()=>{updSize();$('sizeSheet').classList.remove('hidden')};$('closeSize').onclick=()=>$('sizeSheet').classList.add('hidden');
$('sizeSheet').onclick=e=>{if(e.target.id==='sizeSheet')$('sizeSheet').classList.add('hidden')};
// price card
const card=document.getElementById('card');
function openCard(p){card.innerHTML=`<button class="icon x">✕</button><div class="ce">${p.icon||'📦'}</div><b>${esc(p.name)}</b><div class="p">${kc(p.price)}</div><div class="d">${[p.date?new Date(p.date).toLocaleDateString('he-IL'):'',esc(roomName(p)),p.kit?[p.kit.sink?'כיור':'',p.kit.stove?'כיריים':''].filter(Boolean).join(' + '):'',p.on!=null?'על '+esc((S.products.find(q=>q.id===p.on)||{}).name||''):''].filter(Boolean).join(' · ')}</div><button class="edit mini2" aria-label="עריכה">✏️ עריכה</button>`;
 card.classList.remove('hidden');card.querySelector('.x').onclick=closeCard;
 card.querySelector('.edit').onclick=()=>{closeCard();openEdit(p)}}
// edit sheet: name / price / purchase date / delete
const KIT_ICONS=new Set(['🗃️','🏝️']);let EDIT=null;function openEdit(p){EDIT=p;const f=$('editForm');$('editIcon').textContent=p.icon||'📦';$('editMeta').textContent=kc(p.price)+' · '+roomName(p);f.name.value=p.name||'';f.price.value=p.price||0;f.date.value=p.date||'';const kr=KIT_ICONS.has(p.icon);$('kitRow').classList.toggle('hidden',!kr);f.ksink.checked=!!(p.kit&&p.kit.sink);f.kstove.checked=!!(p.kit&&p.kit.stove);$('editSheet').classList.remove('hidden')}
$('editForm').onsubmit=e=>{e.preventDefault();const p=EDIT,f=$('editForm');if(!p)return;push();p.name=f.name.value.trim()||p.name;p.price=+f.price.value||0;p.date=f.date.value;if(KIT_ICONS.has(p.icon)){const k={};if(f.ksink.checked)k.sink=1;if(f.kstove.checked)k.stove=1;if(k.sink||k.stove)p.kit=k;else delete p.kit}save();build();$('editSheet').classList.add('hidden');if(TOOL==='color')syncColor()};
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
document.getElementById('addBtn').onclick=()=>{form.reset();PENDKIT=null;$('formTitle').textContent='מוצר חדש';form.date.value=new Date().toISOString().slice(0,10);document.getElementById('formSheet').classList.remove('hidden')};
document.getElementById('cancelAdd').onclick=()=>document.getElementById('formSheet').classList.add('hidden');
// v7: new items spawn at the middle of the house (nudged off any wall line), then get selected in design mode
function centerSpot(){let x=NX/2,z=NZ/2;const onW=(x,z)=>S.walls.some(w=>segDist({x,z},w)<.35)||S.fwalls.some(w=>segDist({x,z},w)<.35);
 if(onW(x,z)){for(const [dx,dz] of [[.5,.5],[-.5,.5],[.5,-.5],[-.5,-.5],[1,0],[0,1],[-1,0],[0,-1]])if(!onW(x+dx,z+dz)){x+=dx;z+=dz;break}}return {x,z}}
form.onsubmit=e=>{e.preventDefault();const c0=centerSpot();const r0=roomAtM(c0.x,c0.z)||ROOMS_NOW.find(x=>x.id===form.room.value)||{id:''};const r={id:r0.id,cx:c0.x,cz:c0.z};push();
 S.products.push({id:Date.now(),name:form.name.value.trim()||'מוצר',price:+form.price.value||0,date:form.date.value,room:r.id,icon:form.icon.value,...(PENDKIT&&KIT_ICONS.has(form.icon.value)?{kit:PENDKIT}:{}),
  gx:+(r.cx/SX).toFixed(3),gy:+(r.cz/SZ).toFixed(3)});save();build();renderList();document.getElementById('formSheet').classList.add('hidden');if(BUILD){const np=S.products[S.products.length-1];setTool('move');select(np)}};
try{rebuildAll()}catch(e){console.error(e);S.walls=defaultWalls();S.rooms=defaultRooms();try{rebuildAll()}catch(e2){S.products=seedP();rebuildAll()}}
save();setTool('move');updUndo();window.__homieOk=1;

applyBackdrop(S.setting);document.getElementById('setBtn').onclick=()=>{S.setting=S.setting==='building'?'ground':'building';applyBackdrop(S.setting);save()};

// ---- v6: desktop keyboard navigation ----
// Arrows / WASD — move the view · Q/E — orbit · +/− — zoom · R — reset view · Shift+Arrows (design, item selected) — nudge item 10cm
const KEYS=new Set(),KC={ArrowUp:'f',KeyW:'f',ArrowDown:'b',KeyS:'b',ArrowLeft:'l',KeyA:'l',ArrowRight:'r',KeyD:'r',KeyQ:'ql',KeyE:'qr',Equal:'zi',NumpadAdd:'zi',Minus:'zo',NumpadSubtract:'zo'};
const typing=e=>/INPUT|SELECT|TEXTAREA/.test((e.target&&e.target.tagName)||'')||!!document.querySelector('.sheet:not(.hidden)');
addEventListener('keydown',e=>{if(typing(e)||e.ctrlKey||e.metaKey||e.altKey)return;
 if(e.code==='KeyR'){resetCam();return}
 if(e.shiftKey&&BUILD&&SEL&&e.code.startsWith('Arrow')){e.preventDefault();const f=ctl.target.clone().sub(cam.position);f.y=0;f.normalize();const r=new THREE.Vector3(-f.z,0,f.x);
  const v=e.code==='ArrowUp'?f:e.code==='ArrowDown'?f.clone().negate():e.code==='ArrowLeft'?r.clone().negate():r;const ax=Math.abs(v.x)>Math.abs(v.z)?[Math.sign(v.x)*.1,0]:[0,Math.sign(v.z)*.1];
  if(!e.repeat)push();const mv=q=>{q.gx=+(Math.max(.3,Math.min(NX-.3,q.gx*SX+ax[0]))/SX).toFixed(3);q.gy=+(Math.max(.3,Math.min(NZ-.3,q.gy*SZ+ax[1]))/SZ).toFixed(3);place(meshes.get(q))};
  mv(SEL);S.products.filter(q=>q.on===SEL.id).forEach(mv);const s=surfaceAt(SEL,SEL.gx*SX,SEL.gy*SZ);if(STACK.has(SEL.icon)){if(s){SEL.on=s.id;SEL.sy=+topOf(s).toFixed(3)}else{delete SEL.on;delete SEL.sy}place(meshes.get(SEL))}save();return}
 const k=KC[e.code];if(k){KEYS.add(k);e.preventDefault()}});
addEventListener('keyup',e=>{const k=KC[e.code];if(k)KEYS.delete(k)});addEventListener('blur',()=>KEYS.clear());
let lastKT=0;TICK.push(t=>{const dt=Math.min(.05,lastKT?(t-lastKT)/1000:0);lastKT=t;if(!KEYS.size||!dt)return;
 const off=cam.position.clone().sub(ctl.target),dist=off.length(),f=off.clone().negate();f.y=0;f.normalize();const r=new THREE.Vector3(-f.z,0,f.x),mv=new THREE.Vector3(),sp=Math.max(2,dist*.55)*dt;
 if(KEYS.has('f'))mv.add(f);if(KEYS.has('b'))mv.sub(f);if(KEYS.has('r'))mv.add(r);if(KEYS.has('l'))mv.sub(r);
 if(mv.lengthSq()){mv.normalize().multiplyScalar(sp);const lim=v=>v;ctl.target.add(mv);ctl.target.x=Math.max(-CX-3,Math.min(CX+3,ctl.target.x));ctl.target.z=Math.max(-CZ-3,Math.min(CZ+3,ctl.target.z))}
 if(KEYS.has('ql')||KEYS.has('qr'))off.applyAxisAngle(new THREE.Vector3(0,1,0),(KEYS.has('ql')?1:-1)*1.4*dt);
 if(KEYS.has('zi')||KEYS.has('zo')){const nd=Math.max(ctl.minDistance,Math.min(ctl.maxDistance,dist*(KEYS.has('zi')?1-1.2*dt:1+1.2*dt)));off.setLength(nd)}
 cam.position.copy(ctl.target).add(off)});
if(matchMedia('(pointer:fine)').matches){const h=$('hint');h.textContent='גרירה — סיבוב · גלגלת — זום · קליק ימני — הזזה · חיצים/WASD — תזוזה · Q/E — סיבוב · +/− — זום · R — איפוס · Shift+חיצים — הזזת רהיט';}
window.__homie={S,setTool,get NX(){return NX},get NZ(){return NZ},setSize,meshes,struct,house,build,magnet,surfaceAt,fp,select,setBuild,cam,ctl,undo:()=>undoBtn.onclick(),place,openCard,openEdit,FLOOR_Y};
