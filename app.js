const KEY='home-spend-v1';
// iso projection: grid (x,y) -> screen
const T=28, iso=(x,y,z=0)=>[(x-y)*T,(x+y)*T*0.85-z];
const ROOMS=[
 {id:'living',name:'סלון',x:0,y:0,w:5,h:5},
 {id:'kitchen',name:'מטבח ופינת אוכל',x:5,y:0,w:4,h:5},
 {id:'bed',name:'חדר שינה',x:0,y:5,w:5,h:4},
 {id:'bath',name:'אמבטיה',x:5,y:5,w:4,h:4}];
const WALLS=['#e9dfc9','#c9d6c0','#a9bfa6','#d8c3a5','#e8c9b8','#bcd0d8','#d9d4e6','#f2efe6','#8fa88a','#c48f6a'];
const FLOORS=['#b98d63','#d2b48c','#9c7a5b','#cfc6b5','#e6dccb','#8a8f86'];
const N=12; // build grid N x N cells
const DEFC={living:{wall:'#e9dfc9',floor:'#b98d63'},kitchen:{wall:'#c9d6c0',floor:'#cfc6b5'},bed:{wall:'#d8c3a5',floor:'#d2b48c'},bath:{wall:'#bcd0d8',floor:'#e6dccb'}};
// walls stored as unit grid edges {x1,y1,x2,y2}
function rectWalls(rs){const set=new Map();for(const r of rs){
 for(let i=0;i<r.w;i++){addSeg(set,r.x+i,r.y,r.x+i+1,r.y);addSeg(set,r.x+i,r.y+r.h,r.x+i+1,r.y+r.h)}
 for(let j=0;j<r.h;j++){addSeg(set,r.x,r.y+j,r.x,r.y+j+1);addSeg(set,r.x+r.w,r.y+j,r.x+r.w,r.y+j+1)}}
 return [...set.values()]}
const ek=(x1,y1,x2,y2)=>{if(x1>x2||y1>y2)[x1,y1,x2,y2]=[x2,y2,x1,y1];return x1+','+y1+','+x2+','+y2};
function addSeg(m,x1,y1,x2,y2){if(x1>x2||y1>y2)[x1,y1,x2,y2]=[x2,y2,x1,y1];m.set(ek(x1,y1,x2,y2),{x1,y1,x2,y2})}
const roomsFromRects=c=>ROOMS.map(r=>({id:r.id,name:r.name,ax:r.x,ay:r.y,wall:(c[r.id]||DEFC[r.id]).wall,floor:(c[r.id]||DEFC[r.id]).floor}));
const seed=()=>({walls:rectWalls(ROOMS),rooms:roomsFromRects(DEFC),
products:[
 {id:1,name:'טלוויזיה',price:12990,date:'2026-09-14',room:'living',icon:'📺',gx:1.3,gy:1.6},
 {id:2,name:'ספה',price:18500,date:'2026-08-02',room:'living',icon:'🛋️',gx:3,gy:2.8},
 {id:3,name:'מקרר',price:15490,date:'2026-07-20',room:'kitchen',icon:'🧊',gx:6.2,gy:1.4},
 {id:4,name:'שולחן אוכל',price:6200,date:'2026-08-11',room:'kitchen',icon:'🍽️',gx:7.6,gy:2.2},
 {id:5,name:'מיטה זוגית',price:14900,date:'2026-06-30',room:'bed',icon:'🛏️',gx:2,gy:6.6},
 {id:6,name:'מכונת כביסה',price:9990,date:'2026-09-01',room:'bath',icon:'🧺',gx:6.4,gy:6.6}]});
let S; try{S=JSON.parse(localStorage.getItem(KEY))}catch(e){} if(!S)S=seed();
// migrate older saves (fixed rooms + colors, no walls)
if(!S.walls){S.walls=rectWalls(ROOMS);S.rooms=roomsFromRects(S.colors||DEFC);delete S.colors}
const save=()=>localStorage.setItem(KEY,JSON.stringify(S));
const kc=n=>n.toLocaleString('cs-CZ').replace(/\s/g,',')+' Kč';
const $=s=>document.querySelector(s), svg=$('#house'), NS='http://www.w3.org/2000/svg';
const el=(t,a,p=svg)=>{const e=document.createElementNS(NS,t);for(const k in a)e.setAttribute(k,a[k]);p.appendChild(e);return e};
const pts=a=>a.map(p=>p.join(',')).join(' ');
const shade=(h,f)=>'#'+h.slice(1).match(/../g).map(c=>Math.max(0,Math.min(255,Math.round(parseInt(c,16)*f))).toString(16).padStart(2,'0')).join('');
const WH=100;
const BOX={tv:'#3b3b46',sofa:'#7a8fb0',fridge:'#e8eef2',table:'#a0714f',bed:'#c98f8f',wash:'#f2f2f2'};
const ICOL={'📺':'#4a4a58','🛋️':'#7a8fb0','🧊':'#dfe8ee','🍽️':'#a0714f','🛏️':'#c98f8f','🧺':'#eeeeee','🪑':'#a0714f','🖥️':'#4a4a58','🎮':'#5b5b6b'};
// ---- regions: flood-fill cells bounded by walls; regions touching grid edge = outside ----
let REG=null; // {cell: Int array of region idx or -1, list:[{cells,room}]}
function regions(){const W=new Set(S.walls.map(w=>ek(w.x1,w.y1,w.x2,w.y2)));
 const id=new Array(N*N).fill(-2),list=[];
 // can move from cell (x,y) to neighbour if no wall on shared edge
 const open=(x,y,dx,dy)=>dx?!W.has(ek(x+(dx>0?1:0),y,x+(dx>0?1:0),y+1)):!W.has(ek(x,y+(dy>0?1:0),x+1,y+(dy>0?1:0)));
 for(let s=0;s<N*N;s++){if(id[s]!=-2)continue;const cells=[],q=[s];let outside=false;id[s]=list.length;
  while(q.length){const c=q.pop(),x=c%N,y=(c/N)|0;cells.push([x,y]);
   for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){if(!open(x,y,dx,dy))continue;const nx=x+dx,ny=y+dy;
    if(nx<0||ny<0||nx>=N||ny>=N){outside=true;continue}const n=ny*N+nx;if(id[n]==-2){id[n]=list.length;q.push(n)}}}
  list.push({cells,outside})}
 // keep enclosed regions only, match to stored rooms via anchor cell
 const enc=list.map((r,i)=>r.outside?null:r);const used=new Set(),rooms=[];
 for(const rm of S.rooms){const i=id[rm.ay*N+rm.ax];if(i>=0&&enc[i]&&!used.has(i)){used.add(i);enc[i].room=rm;rooms.push(rm)}}
 let k=1;enc.forEach((r,i)=>{if(!r||used.has(i))return;while(rooms.some(q=>q.name=='חדר '+k))k++;
  const c=r.cells.reduce((a,b)=>(b[1]*N+b[0])<(a[1]*N+a[0])?b:a);
  r.room={id:'r'+Date.now().toString(36)+i,name:'חדר '+k,ax:c[0],ay:c[1],wall:WALLS[(rooms.length)%WALLS.length],floor:FLOORS[rooms.length%FLOORS.length]};rooms.push(r.room)});
 S.rooms=rooms;
 const cell=id.map(i=>i>=0&&enc[i]?i:-1);REG={cell,list:enc};save();return REG}
const roomAt=(gx,gy)=>{const x=Math.floor(gx),y=Math.floor(gy);if(x<0||y<0||x>=N||y>=N)return null;const i=REG.cell[y*N+x];return i>=0?REG.list[i].room:null};
const roomName=p=>(roomAt(p.gx,p.gy)||{name:'מחוץ לבית'}).name;
let BUILD=false,TOOL='wall',PREV=null,PEND=null;
function draw(){
 regions();svg.innerHTML='';const LABS=[];
 if(BUILD){ // grid
  el('polygon',{points:pts([iso(0,0),iso(N,0),iso(N,N),iso(0,N)]),fill:'#f7f2e6',stroke:'none'});}
 // floors
 REG.list.forEach(r=>{if(!r)return;const c=r.room;
  for(const[x,y]of r.cells)el('polygon',{points:pts([iso(x,y),iso(x+1,y),iso(x+1,y+1),iso(x,y+1)]),fill:c.floor,stroke:c.floor,'stroke-width':.8});
  // label at front-most cell
  const f=r.cells.reduce((a,b)=>(b[0]+b[1])>(a[0]+a[1])?b:a);
  LABS.push(()=>{const lab=el('g',{class:'roomlab'});const [lx,ly]=iso(f[0]+0.65,f[1]+0.65);
  const tw=c.name.length*10+46;
  el('rect',{x:lx-tw/2,y:ly-30,width:tw,height:28,rx:14,fill:'#fffffff0',stroke:'#2f4a3a55'},lab);
  el('text',{x:lx+10,y:ly-12,'text-anchor':'middle','font-size':17,'font-weight':700,fill:'#1f2f26'},lab).textContent=c.name;
  el('text',{x:lx-tw/2+14,y:ly-12,'text-anchor':'middle','font-size':13},lab).textContent='🎨';
  lab.addEventListener('click',e=>{e.stopPropagation();openPalette(c,e)});});});
 if(BUILD){for(let i=0;i<=N;i++){el('line',lineA(iso(i,0),iso(i,N)),);el('line',lineA(iso(0,i),iso(N,i)))}}
 // walls + products sorted by depth so near things overlap far things
 const R=(x,y)=>(x<0||y<0||x>=N||y>=N)?null:(REG.cell[y*N+x]>=0?REG.list[REG.cell[y*N+x]].room:null);
 const items=[];
 for(const w of S.walls){const h=w.y1==w.y2; // h: edge along x at y; v: edge along y at x
  const inR=h?R(w.x1,w.y1):R(w.x1,w.y1), outR=h?R(w.x1,w.y1-1):R(w.x1-1,w.y1);
  // Sims-style cutaway: back walls (nothing behind) full height, others low
  const tall=BUILD?false:(!!inR&&!outR);const hz=BUILD?34:(tall?WH:16);
  const col=(inR||outR||{wall:'#d9d0bd'}).wall;
  items.push({d:(w.x1+w.x2+w.y1+w.y2)/2-0.01,f:()=>{const g=el('g',{class:'wall'});const a=iso(w.x1,w.y1),b=iso(w.x2,w.y2),a2=iso(w.x1,w.y1,hz),b2=iso(w.x2,w.y2,hz);
   el('polygon',{points:pts([a,b,b2,a2]),fill:h?col:shade(col,.86),stroke:shade(col,.72)},g);
   el('line',{x1:a2[0],y1:a2[1],x2:b2[0],y2:b2[1],stroke:shade(col,.6),'stroke-width':3},g)}})}
 for(const p of S.products)items.push({d:p.gx+p.gy,f:()=>drawProduct(p,LABS)});
 items.sort((a,b)=>a.d-b.d).forEach(i=>i.f());
 if(BUILD){ if(SEL)SEL.forEach(s=>el('line',{...lineA(iso(s.x1,s.y1),iso(s.x2,s.y2)),stroke:'#f0a020','stroke-width':8,'stroke-linecap':'round',opacity:PREV&&PREV.length?.45:1}));
  if(PREV)PREV.forEach(s=>el('line',{...lineA(iso(s.x1,s.y1),iso(s.x2,s.y2)),stroke:TOOL=='wall'?'#2f7a4a':TOOL=='move'?'#2a6fdb':'#c33','stroke-width':6,'stroke-linecap':'round'}));
  if(PEND){const[x,y]=iso(PEND[0],PEND[1]);el('circle',{cx:x,cy:y,r:8,fill:'#2f7a4a'})}}
 else LABS.forEach(f=>f());
 if(BUILD){const a=iso(0,0,40),b=iso(N,0),c=iso(0,N),d=iso(N,N);svg.setAttribute('viewBox',`${c[0]-10} ${a[1]-10} ${b[0]-c[0]+20} ${d[1]-a[1]+20}`)}
 else{const bb=svg.getBBox();svg.setAttribute('viewBox',`${bb.x-6} ${bb.y-6} ${bb.width+12} ${bb.height+12}`)}
}
const lineA=(a,b)=>({x1:a[0],y1:a[1],x2:b[0],y2:b[1],stroke:'#2f4a3a40','stroke-width':1});
function drawProduct(p,LABS){const g=el('g',{class:'item'});const s=0.6,cx=p.gx,cy=p.gy,hz=26;
  const col=ICOL[p.icon]||'#c9a27a';
  el('polygon',{points:pts([iso(cx-s,cy-s),iso(cx+s,cy-s),iso(cx+s,cy+s),iso(cx-s,cy+s)]),fill:'#0003',transform:'translate(0,4)'},g);
  el('polygon',{points:pts([iso(cx-s,cy+s),iso(cx+s,cy+s),iso(cx+s,cy+s,hz),iso(cx-s,cy+s,hz)]),fill:shade(col,.82),stroke:shade(col,.6)},g);
  el('polygon',{points:pts([iso(cx+s,cy-s),iso(cx+s,cy+s),iso(cx+s,cy+s,hz),iso(cx+s,cy-s,hz)]),fill:shade(col,.68),stroke:shade(col,.6)},g);
  el('polygon',{points:pts([iso(cx-s,cy-s,hz),iso(cx+s,cy-s,hz),iso(cx+s,cy+s,hz),iso(cx-s,cy+s,hz)]),fill:col,stroke:shade(col,.6)},g);
  const [x,y]=iso(cx,cy,hz);
  el('text',{x,y:y+4,'text-anchor':'middle','font-size':40},g).textContent=p.icon;
  LABS.unshift(()=>{const [nx,ny]=iso(cx+s,cy+s);const nw=p.name.length*7.5+16;const t=el('g',{class:'item'});
  el('rect',{x:nx-nw/2,y:ny+4,width:nw,height:19,rx:9,fill:'#2f4a3ae6'},t);
  el('text',{x:nx,y:ny+17.5,'text-anchor':'middle','font-size':12,'font-weight':600,fill:'#fff'},t).textContent=p.name;
  t.addEventListener('click',e=>{e.stopPropagation();openCard(p,e)});});
  g.addEventListener('click',e=>{e.stopPropagation();openCard(p,e)});}
// ---- build mode input ----
function toGrid(e){const m=svg.getScreenCTM().inverse(),pt=svg.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;const q=pt.matrixTransform(m);
 const a=q.x/T,b=q.y/(T*0.85);return[(a+b)/2,(b-a)/2]}
const snap=([x,y])=>[Math.max(0,Math.min(N,Math.round(x))),Math.max(0,Math.min(N,Math.round(y)))];
function segsBetween(a,b){const out=[];if(a[0]!=b[0]&&a[1]!=b[1]){ // lock to dominant axis
  if(Math.abs(b[0]-a[0])>=Math.abs(b[1]-a[1]))b=[b[0],a[1]];else b=[a[0],b[1]]}
 const dx=Math.sign(b[0]-a[0]),dy=Math.sign(b[1]-a[1]);let[x,y]=a;
 while(x!=b[0]||y!=b[1]){const nx=x+dx,ny=y+dy;out.push({x1:Math.min(x,nx),y1:Math.min(y,ny),x2:Math.max(x,nx),y2:Math.max(y,ny)});x=nx;y=ny}return out}
function nearestWall(g){let best=null,bd=0.4;for(const w of S.walls){const mx=(w.x1+w.x2)/2,my=(w.y1+w.y2)/2;
 const d=w.y1==w.y2?Math.max(Math.abs(g[0]-mx)-0.5,0)+Math.abs(g[1]-my):Math.max(Math.abs(g[1]-my)-0.5,0)+Math.abs(g[0]-mx);if(d<bd){bd=d;best=w}}return best}
let drag=null,SEL=null;
// connected collinear run of unit walls containing w
function wallRun(w){const h=w.y1==w.y2,K=new Set(S.walls.map(q=>ek(q.x1,q.y1,q.x2,q.y2))),run=[w];
 for(const st of[-1,1]){let i=st;while(true){const q=h?{x1:w.x1+i,y1:w.y1,x2:w.x2+i,y2:w.y2}:{x1:w.x1,y1:w.y1+i,x2:w.x2,y2:w.y2+i};
  if(!K.has(ek(q.x1,q.y1,q.x2,q.y2)))break;run.push(S.walls.find(z=>ek(z.x1,z.y1,z.x2,z.y2)==ek(q.x1,q.y1,q.x2,q.y2)));i+=st}}return run}
function shiftRun(run,dx,dy){let mx=Math.min(...run.map(s=>s.x1)),Mx=Math.max(...run.map(s=>s.x2)),my=Math.min(...run.map(s=>s.y1)),My=Math.max(...run.map(s=>s.y2));
 dx=Math.max(-mx,Math.min(N-Mx,dx));dy=Math.max(-my,Math.min(N-My,dy));return run.map(s=>({x1:s.x1+dx,y1:s.y1+dy,x2:s.x2+dx,y2:s.y2+dy}))}
svg.addEventListener('pointerdown',e=>{if(!BUILD)return;e.preventDefault();svg.setPointerCapture(e.pointerId);const g=toGrid(e);
 if(TOOL=='move'){const w=nearestWall(g);if(!w){SEL=null;draw();return}SEL=wallRun(w);drag={move:true,start:g,dx:0,dy:0};PREV=[]}
 else if(TOOL=='wall'){drag={start:snap(g),moved:false};PREV=[]}
 else{drag={erase:true};eraseAt(g)}draw()});
svg.addEventListener('pointermove',e=>{if(!BUILD||!drag)return;const g=toGrid(e);
 if(drag.erase){eraseAt(g);return}
 if(drag.move){const dx=Math.round(g[0]-drag.start[0]),dy=Math.round(g[1]-drag.start[1]);if(dx!=drag.dx||dy!=drag.dy){drag.dx=dx;drag.dy=dy;PREV=dx||dy?shiftRun(SEL,dx,dy):[];draw()}return}
 const p=snap(g);if(p[0]!=drag.start[0]||p[1]!=drag.start[1]){drag.moved=true;PEND=null;PREV=segsBetween(drag.start,p);draw()}});
svg.addEventListener('pointerup',e=>{if(!BUILD||!drag)return;const d=drag;drag=null;
 if(d.erase){save();draw();return}
 if(d.move){if(PREV&&PREV.length){const old=new Set(SEL);S.walls=S.walls.filter(q=>!old.has(q));const moved=PREV;commit(moved);
  SEL=S.walls.filter(q=>moved.some(m=>ek(m.x1,m.y1,m.x2,m.y2)==ek(q.x1,q.y1,q.x2,q.y2)))}PREV=null;draw();return}
 if(d.moved)commit(PREV);
 else if(PEND&&(PEND[0]==d.start[0]||PEND[1]==d.start[1])&&(PEND[0]!=d.start[0]||PEND[1]!=d.start[1])){commit(segsBetween(PEND,d.start));PEND=null}
 else PEND=d.start; // tap-tap mode: first point
 PREV=null;draw()});
function commit(segs){const m=new Map(S.walls.map(w=>[ek(w.x1,w.y1,w.x2,w.y2),w]));segs.forEach(s=>addSeg(m,s.x1,s.y1,s.x2,s.y2));S.walls=[...m.values()];save()}
function eraseAt(g){const w=nearestWall(g);if(w){S.walls=S.walls.filter(q=>q!==w);draw()}}
function setBuild(on){BUILD=on;PEND=PREV=null;hideFloat();document.body.classList.toggle('building',on);$('#buildBar').classList.toggle('hidden',!on);
 $('#addBtn').classList.toggle('hidden',on);if(!on){regions();save()}setTool('wall');draw()}
function setTool(t){TOOL=t;PEND=null;SEL=null;document.querySelectorAll('#buildBar [data-tool]').forEach(b=>b.classList.toggle('on',b.dataset.tool==t))}
function place(elm,e){elm.classList.remove('hidden');const w=elm.offsetWidth,h=elm.offsetHeight;
 elm.style.left=Math.min(innerWidth-w-8,Math.max(8,e.clientX-w/2))+'px';
 elm.style.top=Math.min(innerHeight-h-8,Math.max(64,e.clientY-h-14))+'px';}
function hideFloat(){$('#card').classList.add('hidden');$('#palette').classList.add('hidden')}
function openCard(p,e){hideFloat();const c=$('#card');
 c.innerHTML=`<div style="font-size:28px">${p.icon}</div><b>${p.name}</b><div class="p">${kc(p.price)}</div><div class="d">${new Date(p.date).toLocaleDateString('he-IL')} · ${roomName(p)}</div><button>מחק</button>`;
 c.querySelector('button').onclick=()=>{if(confirm('למחוק?')){S.products=S.products.filter(q=>q!==p);save();hideFloat();draw()}};
 place(c,e)}
function openPalette(r,e){hideFloat();const p=$('#palette');
 p.innerHTML=`<h4>קיר · ${r.name}</h4><div class="row" data-k="wall"></div><h4>רצפה</h4><div class="row" data-k="floor"></div>`;
 [['wall',WALLS],['floor',FLOORS]].forEach(([k,arr])=>{const row=p.querySelector(`[data-k=${k}]`);
  arr.forEach(col=>{const s=document.createElement('span');s.style.background=col;
   if(r[k]==col)s.style.borderColor='#2f4a3a';
   s.onclick=ev=>{ev.stopPropagation();r[k]=col;save();draw();openPalette(r,e)};row.appendChild(s)})});
 place(p,e)}
document.addEventListener('click',e=>{if(!e.target.closest('.card,.palette'))hideFloat()});
const show=id=>$('#'+id).classList.remove('hidden'), hide=id=>$('#'+id).classList.add('hidden');
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>hide(b.dataset.close));
document.querySelectorAll('.sheet').forEach(s=>s.addEventListener('click',e=>{if(e.target==s)s.classList.add('hidden')}));
$('#spendBtn').onclick=()=>{const l=$('#list');l.innerHTML='';
 [...S.products].sort((a,b)=>b.date.localeCompare(a.date)).forEach(p=>{const li=document.createElement('li');
  li.innerHTML=`<span>${p.icon} ${p.name}<small>${roomName(p)} · ${new Date(p.date).toLocaleDateString('he-IL')}</small></span><b>${kc(p.price)}</b>`;l.appendChild(li)});
 $('#total').textContent=kc(S.products.reduce((s,p)=>s+ +p.price,0));show('sheet')};
$('#addBtn').onclick=()=>{$('#roomSel').innerHTML=S.rooms.map(r=>`<option value="${r.id}">${r.name}</option>`).join('');$('#addForm').reset();$('#addForm').date.value=new Date().toISOString().slice(0,10);show('form')};
$('#addForm').onsubmit=e=>{e.preventDefault();const f=e.target,r=S.rooms.find(r=>r.id==f.room.value);if(!r)return;
 const reg=REG.list.find(q=>q&&q.room===r),c=reg.cells[Math.floor(Math.random()*reg.cells.length)];
 S.products.push({id:Date.now(),name:f.name.value,price:+f.price.value,date:f.date.value,room:r.id,icon:f.icon.value,
  gx:c[0]+0.5,gy:c[1]+0.5});save();hide('form');draw()};
$('#menuBtn').onclick=()=>show('menu');
$('#resetBtn').onclick=()=>{S=seed();save();hide('menu');draw()};
$('#buildBtn').onclick=()=>setBuild(!BUILD);
document.querySelectorAll('#buildBar [data-tool]').forEach(b=>b.onclick=()=>setTool(b.dataset.tool));
$('#doneBtn').onclick=()=>setBuild(false);
draw();
