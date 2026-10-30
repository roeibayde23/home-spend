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

// expenses sheet: read-only from old save
const sheet=document.getElementById('sheet');
document.getElementById('spendBtn').onclick=()=>{
  let S;try{S=JSON.parse(localStorage.getItem(KEY))}catch(e){}
  const P=(S&&S.products)||[];const kc=n=>n.toLocaleString('cs-CZ')+' Kč';
  document.getElementById('list').innerHTML=P.length?P.map(p=>`<li><span>${p.icon||'📦'} ${p.name}</span><b>${kc(+p.price)}</b></li>`).join(''):'<li>אין הוצאות שמורות</li>';
  document.getElementById('total').textContent=kc(P.reduce((a,p)=>a+(+p.price||0),0));
  sheet.classList.remove('hidden')};
document.getElementById('closeSheet').onclick=()=>sheet.classList.add('hidden');
sheet.onclick=e=>{if(e.target===sheet)sheet.classList.add('hidden')};
