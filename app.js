const canvas=document.getElementById("game"),ctx=canvas.getContext("2d"),map=document.getElementById("map"),mctx=map.getContext("2d");
const scoreEl=document.getElementById("score"),speedEl=document.getElementById("speed"),bestEl=document.getElementById("best"),levelEl=document.getElementById("level"),gearEl=document.getElementById("gear"),msg=document.getElementById("message");
let running=false,paused=false,last=0,score=0,baseSpeed=220,speed=220,best=Number(localStorage.getItem("street-best")||0),level=1;
let player={x:450,y:500,w:54,h:92},enemies=[],spawn=0,keys={},gas=false,brake=false,lights=false,audio;let terrain="highway",driveMode="normal";
bestEl.textContent="رکورد: "+best.toLocaleString("fa-IR");
const road={x:170,w:560};
function sound(type){try{audio??=new AudioContext();const o=audio.createOscillator(),g=audio.createGain();o.connect(g);g.connect(audio.destination);o.frequency.value=type==="horn"?180:type==="crash"?70:700;g.gain.value=.05;o.start();o.stop(audio.currentTime+.12)}catch(e){}}
function reset(){score=0;baseSpeed=220;speed=220;level=1;enemies=[];spawn=0;player.x=450;paused=false;gas=false;brake=false;updateUI()}
function start(){reset();running=true;msg.style.display="none";sound("start");last=performance.now();requestAnimationFrame(loop)}
function gameOver(){running=false;sound("crash");if(score>best){best=score;localStorage.setItem("street-best",best)}bestEl.textContent="رکورد: "+best.toLocaleString("fa-IR");msg.querySelector("h1").textContent="💥 بازی تمام شد";msg.querySelector("p").textContent="امتیاز شما: "+score.toLocaleString("fa-IR");msg.style.display="block"}
function rect(x,y,w,h,r=8){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill()}
function drawRoad(){const bg={desert:"#c89b58",forest:"#31552f",city:"#252a31",highway:"#31552f"}[terrain];ctx.fillStyle=bg;ctx.fillRect(0,0,900,600);ctx.globalAlpha=.22;ctx.fillStyle="#fff";for(let i=0;i<12;i++){ctx.beginPath();ctx.arc((i*83+score*.35)%900,(i*137+score*.18)%600,2+(i%3),0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1;if(terrain==="desert"){for(let i=0;i<20;i++){ctx.fillStyle="#d7b878";ctx.fillRect((i*97+score)%900,((i*53+score*0.3)%600),3,3)}}else if(terrain==="forest"){ctx.fillStyle="#214722";for(let i=0;i<18;i++){ctx.beginPath();ctx.arc((i*71)%160, (i*91)%600, 24,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(740+(i*53)%160,(i*67)%600,28,0,Math.PI*2);ctx.fill()}}else if(terrain==="city"){ctx.fillStyle="#555";for(let i=0;i<8;i++){ctx.fillRect(i*115,0,65,80+(i%3)*35);ctx.fillRect(i*115,520,65,80-(i%3)*15)}}ctx.fillStyle="#171a1f";ctx.fillRect(road.x,0,road.w,600);ctx.fillStyle="#353a41";ctx.fillRect(road.x+8,0,road.w-16,600);ctx.fillStyle="#aaa";ctx.fillRect(road.x+8,0,5,600);ctx.fillRect(road.x+road.w-13,0,5,600);ctx.fillStyle="#555";ctx.fillRect(road.x+7,0,road.w-14,600);ctx.fillStyle="#ddd";ctx.fillRect(road.x,0,7,600);ctx.fillRect(road.x+road.w-7,0,7,600);ctx.strokeStyle="#e9e2b6";ctx.lineWidth=7;ctx.shadowBlur=0;ctx.setLineDash([35,35]);ctx.lineDashOffset=-(score*2%70);for(let i=1;i<4;i++){ctx.beginPath();ctx.moveTo(road.x+road.w*i/4,0);ctx.lineTo(road.x+road.w*i/4,600);ctx.stroke()}ctx.setLineDash([])}
function drawCar(c,x,y,w,h,isPlayer=false){ctx.shadowColor="rgba(0,0,0,.5)";ctx.shadowBlur=12;if(isPlayer&&driveMode==="low"){h*=.86;w*=1.03;}
  ctx.save();ctx.translate(x,y);
  // نمای کارتونی و غیرواقعی از پژو 405
  ctx.fillStyle=isPlayer?"#15171a":c;rect(-w/2,-h/2,w,h,8);
  ctx.fillStyle="#20252b";rect(-w*.36,-h*.27,w*.72,h*.24,5);
  ctx.fillStyle="#20252b";rect(-w*.34,h*.04,w*.68,h*.20,5);
  ctx.fillStyle="#bfc6cc";ctx.fillRect(-w*.40,-h*.02,w*.80,4);
  ctx.fillStyle="#111";ctx.fillRect(-w/2-4,-h*.25,7,22);ctx.fillRect(w/2-3,-h*.25,7,22);ctx.fillRect(-w/2-4,h*.16,7,22);ctx.fillRect(w/2-3,h*.16,7,22);
  ctx.fillStyle=lights&&isPlayer?"#fff":"#ddd";ctx.fillRect(-w*.39,-h*.43,10,7);ctx.fillRect(w*.25,-h*.43,10,7);
  ctx.fillStyle=isPlayer?"#d22":"#a22";ctx.fillRect(-w*.39,h*.38,10,7);ctx.fillRect(w*.25,h*.38,10,7);
  ctx.fillStyle="#333";ctx.fillRect(-w*.28,h*.27,w*.56,5);
  ctx.restore();ctx.shadowBlur=0;
}
function spawnEnemy(){const lane=Math.floor(Math.random()*4);enemies.push({x:road.x+road.w*(lane+.5)/4,y:-80,w:52,h:86,c:["#e14b4b","#3f86d9","#f0a33a","#9b68d1"][Math.floor(Math.random()*4)]})}
function collide(a,b){return Math.abs(a.x-b.x)<(a.w+b.w)*.42&&Math.abs(a.y-b.y)<(a.h+b.h)*.42}
function drawMap(){mctx.fillStyle="#245025";mctx.fillRect(0,0,120,160);mctx.fillStyle="#555";mctx.fillRect(25,0,70,160);mctx.fillStyle="#ddd";for(let y=5;y<160;y+=20)mctx.fillRect(58,y,4,10);mctx.fillStyle="#e33";mctx.fillRect(55,140,10,14);enemies.forEach(e=>{mctx.fillStyle="#f6a";mctx.fillRect(55,Math.max(2,Math.min(150,e.y/4)),10,7)})}
function updateUI(){scoreEl.textContent="امتیاز: "+score.toLocaleString("fa-IR");speedEl.textContent="سرعت: "+Math.max(0,Math.round(speed/10))+" km/h";levelEl.textContent="مرحله: "+level.toLocaleString("fa-IR");gearEl.textContent="دنده: "+(brake?"R":gas?"D":"N");document.getElementById("lightsState").textContent=lights?"💡 چراغ روشن":"💡 خاموش"}
function loop(t){if(!running)return;requestAnimationFrame(loop);if(paused){last=t;return}const dt=Math.min((t-last)/1000,.04);last=t;
const target=baseSpeed+(driveMode==="shoti"?45:0)+(gas?150:0)-(brake?170:0);speed+=(target-speed)*dt*4;if(speed<0)speed=0;
spawn-=dt;if(spawn<=0){spawnEnemy();spawn=Math.max(.35,1.05-score/1000)}
const steer=(keys.ArrowLeft||keys.a?-1:0)+(keys.ArrowRight||keys.d?1:0);player.x+=steer*420*dt;player.x=Math.max(road.x+40,Math.min(road.x+road.w-40,player.x));
enemies.forEach(e=>e.y+=speed*dt);enemies=enemies.filter(e=>e.y<680);for(const e of enemies)if(collide(player,e)){gameOver();return}
score+=Math.floor(dt*(speed/25));level=Math.floor(score/100)+1;baseSpeed=220+(level-1)*22;updateUI();drawRoad();drawCar("#f3f5f7",player.x,player.y,player.w,player.h,true);enemies.forEach(e=>drawCar(e.c,e.x,e.y,e.w,e.h));drawMap()}
document.addEventListener("keydown",e=>{keys[e.key]=true;if(["ArrowLeft","ArrowRight"," "].includes(e.key))e.preventDefault();if(e.key===" "&&running)paused=!paused;if(e.key.toLowerCase()==="h")horn()});
document.addEventListener("keyup",e=>keys[e.key]=false);
function hold(id,setter){const b=document.getElementById(id);["pointerdown","touchstart"].forEach(ev=>b.addEventListener(ev,e=>{e.preventDefault();setter(true)}));["pointerup","pointercancel","pointerleave","touchend"].forEach(ev=>b.addEventListener(ev,e=>{e.preventDefault();setter(false)}))}
hold("gas",v=>{gas=v;updateUI()});hold("brake",v=>{brake=v;updateUI()});
function horn(){sound("horn");document.getElementById("hornState").textContent="📯 بوق!";setTimeout(()=>document.getElementById("hornState").textContent="",500)}
document.getElementById("horn").onclick=horn;document.getElementById("lights").onclick=()=>{lights=!lights;updateUI()};
document.querySelectorAll(".steering button").forEach(b=>{b.addEventListener("pointerdown",()=>keys[b.dataset.key]=true);b.addEventListener("pointerup",()=>keys[b.dataset.key]=false);b.addEventListener("pointerleave",()=>keys[b.dataset.key]=false)});
document.getElementById("start").onclick=start;document.getElementById("start2").onclick=start;document.getElementById("pause").onclick=()=>{if(running)paused=!paused};drawRoad();drawCar("#f3f5f7",player.x,player.y,player.w,player.h,true);drawMap();updateUI();
document.querySelectorAll("#terrainMenu button").forEach(b=>b.addEventListener("click",()=>{terrain=b.dataset.terrain;document.getElementById("terrainMenu").style.display="none";drawRoad();drawCar("#f3f5f7",player.x,player.y,player.w,player.h,true);drawMap()}));
document.getElementById("stance").onclick=()=>{driveMode=driveMode==="normal"?"low":driveMode==="low"?"shoti":"normal";const names={normal:"🚗 حالت: عادی",low:"⬇️ حالت: کف‌خواب",shoti:"🏎️ حالت: شوتی"};document.getElementById("stance").textContent=names[driveMode];drawRoad();drawCar("#15171a",player.x,player.y,player.w,player.h,true);};