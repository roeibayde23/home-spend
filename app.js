const KEY='home-spend-v1';
// iso projection: grid (x,y) -> screen
const T=28, iso=(x,y,z=0)=>[(x-y)*T,(x+y)*T/2-z];
const ROOMS=[
 {id:'living',name:'סלון',x:0,y:0,w:5,h:5},
 {id:'kitchen',name:'מטבח ופינת אוכל',x:5,y:0,w:4,h:5},
 {id:'bed',name:'חדר שינה',x:0,y:5,w:5,h:4},
 {id:'bath',name:'אמבטיה',x:5,y:5,w:4,h:4}];
const WALLS=['#e9dfc9','#c9d6c0','#a9bfa6','#d8c3a5','#e8c9b8','#bcd0d8','#d9d4e6','#f2efe6','#8fa88a','#c48f6a'];
const FLOORS=['#b98d63','#d2b48c','#9c7a5b','#cfc6b5','#e6dccb','#8a8f86'];
const seed=()=>({colors:{living:{wall:'#e9dfc9',floor:'#b98d63'},kitchen:{wall:'#c9d6c0',floor:'#cfc6b5'},bed:{wall:'#d8c3a5',floor:'#d2b48c'},bath:{wall:'#bcd0d8',floor:'#e6dccb'}},
 products:[
 {id:1,name:'טלוויזיה',price:12990,date:'2026-09-14',room:'living',icon:'📺',gx:1,gy:1},
 {id:2,name:'ספה',price:18500,date:'2026-08-02',room:'living',icon:'🛋️',gx:3,gy:3},
 {id:3,name:'מקרר',price:15490,date:'2026-07-20',room:'kitchen',icon:'🧊',gx:6,gy:1},
 {id:4,name:'שולחן אוכל',price:6200,date:'2026-08-11',room:'kitchen',icon:'🍽️',gx:7.5,gy:3.5},
 {id:5,name:'מיטה זוגית',price:14900,date:'2026-06-30',room:'bed',icon:'🛏️',gx:2,gy:6.5},
 {id:6,name:'מכונת כביסה',price:9990,date:'2026-09-01',room:'bath',icon:'🧺',gx:6,gy:6}]});
let S; try{S=JSON.parse(localStorage.getItem(KEY))}catch(e){} if(!S)S=seed();
const save=()=>localStorage.setItem(KEY,JSON.stringify(S));
const kc=n=>n.toLocaleString('cs-CZ').replace(/\s/g,',')+' Kč';
const $=s=>document.querySelector(s), svg=$('#house'), NS='http://www.w3.org/2000/svg';
const el=(t,a,p=svg)=>{const e=document.createElementNS(NS,t);for(const k in a)e.setAttribute(k,a[k]);p.appendChild(e);return e};
const pts=a=>a.map(p=>p.join(',')).join(' ');
const shade=(h,f)=>'#'+h.slice(1).match(/../g).map(c=>Math.max(0,Math.min(255,Math.round(parseInt(c,16)*f))).toString(16).padStart(2,'0')).join('');
const WH=70;
function draw(){
 svg.innerHTML='';
 for(const r of ROOMS){const c=S.colors[r.id],X=r.x,Y=r.y,W=r.w,H=r.h;
  // floor
  el('polygon',{points:pts([iso(X,Y),iso(X+W,Y),iso(X+W,Y+H),iso(X,Y+H)]),fill:c.floor,stroke:shade(c.floor,.8)});
  // back walls (north = y edge, west = x edge)
  el('polygon',{points:pts([iso(X,Y),iso(X+W,Y),iso(X+W,Y,WH),iso(X,Y,WH)]),fill:c.wall,stroke:shade(c.wall,.8)});
  el('polygon',{points:pts([iso(X,Y),iso(X,Y+H),iso(X,Y+H,WH),iso(X,Y,WH)]),fill:shade(c.wall,.86),stroke:shade(c.wall,.75)});
  const [lx,ly]=iso(X+W/2,Y+H/2);
  el('text',{x:lx,y:ly+4,'text-anchor':'middle','font-size':11,fill:'#0007'}).textContent=r.name;
  const [sx,sy]=iso(X+W-0.6,Y,WH-14);
  const sw=el('circle',{cx:sx,cy:sy,r:9,fill:c.wall,class:'swatch'});
  sw.addEventListener('click',e=>{e.stopPropagation();openPalette(r,e)});
 }
 // low front lip
 el('polyline',{points:pts([iso(9,0),iso(9,9),iso(0,9)]),fill:'none',stroke:'#7a6a55','stroke-width':3});
 const ps=[...S.products].sort((a,b)=>(a.gx+a.gy)-(b.gx+b.gy));
 for(const p of ps){const [x,y]=iso(p.gx,p.gy);const g=el('g',{class:'item'});
  el('ellipse',{cx:x,cy:y+2,rx:14,ry:6,fill:'#0002'},g);
  const t=el('text',{x,y:y-2,'text-anchor':'middle'},g);t.textContent=p.icon;
  g.addEventListener('click',e=>{e.stopPropagation();openCard(p,e)});}
}
function place(elm,e){elm.classList.remove('hidden');const w=elm.offsetWidth,h=elm.offsetHeight;
 elm.style.left=Math.min(innerWidth-w-8,Math.max(8,e.clientX-w/2))+'px';
 elm.style.top=Math.min(innerHeight-h-8,Math.max(64,e.clientY-h-14))+'px';}
function hideFloat(){$('#card').classList.add('hidden');$('#palette').classList.add('hidden')}
function openCard(p,e){hideFloat();const c=$('#card');
 c.innerHTML=`<div style="font-size:28px">${p.icon}</div><b>${p.name}</b><div class="p">${kc(p.price)}</div><div class="d">${new Date(p.date).toLocaleDateString('he-IL')} · ${ROOMS.find(r=>r.id==p.room).name}</div><button>מחק</button>`;
 c.querySelector('button').onclick=()=>{if(confirm('למחוק?')){S.products=S.products.filter(q=>q!==p);save();hideFloat();draw()}};
 place(c,e)}
function openPalette(r,e){hideFloat();const p=$('#palette');
 p.innerHTML=`<h4>קיר · ${r.name}</h4><div class="row" data-k="wall"></div><h4>רצפה</h4><div class="row" data-k="floor"></div>`;
 [['wall',WALLS],['floor',FLOORS]].forEach(([k,arr])=>{const row=p.querySelector(`[data-k=${k}]`);
  arr.forEach(col=>{const s=document.createElement('span');s.style.background=col;
   if(S.colors[r.id][k]==col)s.style.borderColor='#2f4a3a';
   s.onclick=ev=>{ev.stopPropagation();S.colors[r.id][k]=col;save();draw();openPalette(r,e)};row.appendChild(s)})});
 place(p,e)}
document.addEventListener('click',e=>{if(!e.target.closest('.card,.palette'))hideFloat()});
const show=id=>$('#'+id).classList.remove('hidden'), hide=id=>$('#'+id).classList.add('hidden');
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>hide(b.dataset.close));
document.querySelectorAll('.sheet').forEach(s=>s.addEventListener('click',e=>{if(e.target==s)s.classList.add('hidden')}));
$('#spendBtn').onclick=()=>{const l=$('#list');l.innerHTML='';
 [...S.products].sort((a,b)=>b.date.localeCompare(a.date)).forEach(p=>{const li=document.createElement('li');
  li.innerHTML=`<span>${p.icon} ${p.name}<small>${ROOMS.find(r=>r.id==p.room).name} · ${new Date(p.date).toLocaleDateString('he-IL')}</small></span><b>${kc(p.price)}</b>`;l.appendChild(li)});
 $('#total').textContent=kc(S.products.reduce((s,p)=>s+ +p.price,0));show('sheet')};
$('#roomSel').innerHTML=ROOMS.map(r=>`<option value="${r.id}">${r.name}</option>`).join('');
$('#addBtn').onclick=()=>{$('#addForm').reset();$('#addForm').date.value=new Date().toISOString().slice(0,10);show('form')};
$('#addForm').onsubmit=e=>{e.preventDefault();const f=e.target,r=ROOMS.find(r=>r.id==f.room.value);
 S.products.push({id:Date.now(),name:f.name.value,price:+f.price.value,date:f.date.value,room:r.id,icon:f.icon.value,
  gx:r.x+0.8+Math.random()*(r.w-1.6),gy:r.y+0.8+Math.random()*(r.h-1.6)});save();hide('form');draw()};
$('#menuBtn').onclick=()=>show('menu');
$('#resetBtn').onclick=()=>{S=seed();save();hide('menu');draw()};
draw();
