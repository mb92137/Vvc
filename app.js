const canvas=document.getElementById("game"),ctx=canvas.getContext("2d"),map=document.getElementById("map"),mctx=map.getContext("2d");
const scoreEl=document.getElementById("score"),speedEl=document.getElementById("speed"),bestEl=document.getElementById("best"),gearEl=document.getElementById("gear"),msg=document.getElementById("message");
let running=false,paused=false,last=0,score=0,baseSpeed=220,speed=220,best=Number(localStorage.getItem("street-best")||0),
let player={x:450,y:500,w:58,h:96},enemies=[],spawn=0,keys={},gas=false,brake=false,lights=false,audio;let terrain="highway",driveMode="normal",pedestrians=[];
bestEl.textContent="رکورد: "+best.toLocaleString("fa-IR");
const road={x:170,w:560};
function sound(type){try{audio??=new AudioContext();const o=audio.createOscillator(),g=audio.createGain();o.connect(g);g.connect(audio.destination);const f=type==="horn"?180:type==="crash"?70:type==="brake"?120:700;o.frequency.value=f;g.gain.value=type==="horn"?0.12:.05;o.start();o.stop(audio.currentTime+(type==="horn"?0.3:.12))}catch(e){}}
function engineSound(){if(!audio)return;try{const o=audio.createOscillator(),g=audio.createGain();o.connect(g);g.connect(audio.destination);o.type="sawtooth";o.frequency.value=70+speed*.55;g.gain.value=.018;o.start();o.stop(audio.currentTime+.07)}catch(e){}}
function reset(){pedestrians=[];score=0;baseSpeed=220;speed=220;level=1;enemies=[];spawn=0;player.x=450;paused=false;gas=false;brake=false;updateUI()}
function start(){reset();running=true;msg.style.display="none";sound("start");last=performance.now();requestAnimationFrame(loop)}
function gameOver(){running=false;sound("crash");if(score>best){best=score;localStorage.setItem("street-best",best)}bestEl.textContent="رکورد: "+best.toLocaleString("fa-IR");msg.querySelector("h1").textContent="💥 بازی تمام شد";msg.querySelector("p").textContent="امتیاز شما: "+score.toLocaleString("fa-IR");msg.style.display="block"}
function rect(x,y,w,h,r=8){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill()}
function drawRoad(){const bg={desert:"#c89b58",forest:"#31552f",city:"#252a31",highway:"#31552f"}[terrain];ctx.fillStyle=bg;ctx.fillRect(0,0,900,600);ctx.globalAlpha=.22;ctx.fillStyle="#fff";for(let i=0;i<12;i++){ctx.beginPath();ctx.arc((i*83+score*.35)%900,(i*137+score*.18)%600,2+(i%3),0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1;if(terrain==="desert"){for(let i=0;i<20;i++){ctx.fillStyle="#d7b878";ctx.fillRect((i*97+score)%900,((i*53+score*0.3)%600),3,3)}}else if(terrain==="forest"){ctx.fillStyle="#214722";for(let i=0;i<18;i++){ctx.beginPath();ctx.arc((i*71)%160,(i*91)%600,24,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(740+(i*53)%160,(i*67)%600,28,0,Math.PI*2);ctx.fill()}}else if(terrain==="city"){ctx.fillStyle="#555";for(let i=0;i<8;i++){ctx.fillRect(i*115,0,65,80+(i%3)*35);ctx.fillRect(i*115,520,65,80-(i%3)*15)}ctx.fillStyle="#777";ctx.fillRect(0,95,road.x-12,410);ctx.fillRect(road.x+road.w+12,95,900-road.x-road.w-12,410);ctx.fillStyle="#ddd";ctx.fillRect(0,108,road.x-12,3);ctx.fillRect(road.x+road.w+12,108,900-road.x-road.w-12,3);ctx.fillStyle="#bbb";for(let y=130;y<500;y+=45){ctx.fillRect(25,y,80,4);ctx.fillRect(road.x+road.w+30,y,80,4)}}ctx.fillStyle="#171a1f";ctx.fillRect(road.x,0,road.w,600);ctx.fillStyle="#353a41";ctx.fillRect(road.x+8,0,road.w-16,600);ctx.fillStyle="#aaa";ctx.fillRect(road.x+8,0,5,600);ctx.fillRect(road.x+road.w-13,0,5,600);ctx.fillStyle="#555";ctx.fillRect(road.x+7,0,road.w-14,600);ctx.fillStyle="#ddd";ctx.fillRect(road.x,0,7,600);ctx.fillRect(road.x+road.w-7,0,7,600);ctx.strokeStyle="#e9e2b6";ctx.lineWidth=7;ctx.shadowBlur=0;ctx.setLineDash([35,35]);ctx.lineDashOffset=-(score*2%70);for(let i=1;i<4;i++){ctx.beginPath();ctx.moveTo(road.x+road.w*i/4,0);ctx.lineTo(road.x+road.w*i/4,600);ctx.stroke()}ctx.setLineDash([])}
function drawCar(c,x,y,w,h,isPlayer=false){
  ctx.save();ctx.translate(x,y);
  if(isPlayer&&driveMode==="low"){h*=.9;w*=1.03;}
  // نمای ماشین معمولی و قابل تشخیص؛ بدون ظاهر اسپرت
  ctx.shadowColor="rgba(0,0,0,.45)";ctx.shadowBlur=10;
  ctx.fillStyle=isPlayer?"#111318":c;rect(-w/2,-h/2,w,h,10);
  // کاپوت و صندوق
  ctx.fillStyle=isPlayer?"#1b1e24":"#333941";rect(-w*.43,-h*.43,w*.86,h*.20,6);
  ctx.fillStyle=isPlayer?"#16191f":"#2d3239";rect(-w*.43,h*.23,w*.86,h*.20,6);
  // کابین و شیشه‌ها
  ctx.fillStyle="#182832";rect(-w*.36,-h*.20,w*.72,h*.43,8);
  ctx.fillStyle="#314a59";rect(-w*.30,-h*.16,w*.25,h*.30,4);
  ctx.fillStyle="#314a59";rect(w*.05,-h*.16,w*.25,h*.30,4);
  ctx.fillStyle="#223742";rect(-w*.30,h*.02,w*.60,h*.16,3);
  // ستون‌های بدنه
  ctx.fillStyle=isPlayer?"#090b0f":"#20252b";ctx.fillRect(-w*.035,-h*.20,w*.07,h*.42);
  // سپرها
  ctx.fillStyle="#0a0c10";rect(-w*.42,-h*.49,w*.84,h*.055,3);rect(-w*.42,h*.435,w*.84,h*.055,3);
  // چرخ‌های واقعی‌تر
  const wheelY1=-h*.30,wheelY2=h*.29;
  for(const wy of [wheelY1,wheelY2]){
    for(const wx of [-w*.49,w*.49]){
      ctx.fillStyle="#050505";ctx.beginPath();ctx.ellipse(wx,wy,6,13,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle="#777";ctx.beginPath();ctx.arc(wx,wy,3.2,0,Math.PI*2);ctx.fill();
    }
  }
  // چراغ‌های جلو و عقب
  ctx.fillStyle=lights&&isPlayer?"#fff":"#f1e7c2";ctx.shadowColor=lights&&isPlayer?"#fff":"transparent";ctx.shadowBlur=lights&&isPlayer?14:0;
  rect(-w*.36,-h*.445,w*.18,h*.055,3);rect(w*.18,-h*.445,w*.18,h*.055,3);
  ctx.shadowBlur=0;ctx.fillStyle=isPlayer?"#e52d35":"#b72d35";
  rect(-w*.36,h*.39,w*.18,h*.055,3);rect(w*.18,h*.39,w*.18,h*.055,3);
  // آینه‌های بغل
  ctx.fillStyle="#0b0d10";ctx.beginPath();ctx.ellipse(-w*.51,-h*.08,5,8,0,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(w*.51,-h*.08,5,8,0,0,Math.PI*2);ctx.fill();
  // جلوپنجره
  ctx.fillStyle="#080a0d";rect(-w*.28,-h*.495,w*.56,h*.045,2);
  ctx.fillStyle=isPlayer?"#bbb":"#999";ctx.fillRect(-2,-h*.49,4,h*.035);
  ctx.restore();ctx.shadowBlur=0;
}
function spawnPedestrian(){const side=Math.random()<.5?0:1;pedestrians.push({x:side?road.x+road.w+45:road.x-45,y:Math.random()*600,dir:side?-1:1,s:35+Math.random()*35,c:["#f2c7a5","#d88","#8cf","#fdc"].at(Math.floor(Math.random()*4))})}
function spawnEnemy(){const lane=Math.floor(Math.random()*4);enemies.push({x:road.x+road.w*(lane+.5)/4,y:-80,w:52,h:86,c:["#e14b4b","#3f86d9","#f0a33a","#9b68d1"][Math.floor(Math.random()*4)]})}
function collide(a,b){return Math.abs(a.x-b.x)<(a.w+b.w)*.42&&Math.abs(a.y-b.y)<(a.h+b.h)*.42}
function drawPedestrian(p){ctx.save();ctx.translate(p.x,p.y);ctx.fillStyle=p.c;ctx.beginPath();ctx.arc(0,-9,6,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#222";ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(0,-3);ctx.lineTo(0,12);ctx.moveTo(0,2);ctx.lineTo(-7,8);ctx.moveTo(0,2);ctx.lineTo(7,8);ctx.moveTo(0,12);ctx.lineTo(-6,20);ctx.moveTo(0,12);ctx.lineTo(6,20);ctx.stroke();ctx.restore()}
function drawMap(){mctx.fillStyle="#245025";mctx.fillRect(0,0,120,160);mctx.fillStyle="#555";mctx.fillRect(25,0,70,160);mctx.fillStyle="#ddd";for(let y=5;y<160;y+=20)mctx.fillRect(58,y,4,10);mctx.fillStyle="#e33";mctx.fillRect(55,140,10,14);enemies.forEach(e=>{mctx.fillStyle="#f6a";mctx.fillRect(55,Math.max(2,Math.min(150,e.y/4)),10,7)})}
function updateUI(){scoreEl.textContent="امتیاز: "+score.toLocaleString("fa-IR");speedEl.textContent="سرعت: "+Math.max(0,Math.round(speed/10))+" km/h";gearEl.textContent="دنده: "+(brake?"R":gas?"D":"N");document.getElementById("lightsState").textContent=lights?"💡 چراغ روشن":"💡 خاموش"}
function loop(t){if(!running)return;requestAnimationFrame(loop);if(paused){last=t;return}const dt=Math.min((t-last)/1000,.04);last=t;engineSound();const target=baseSpeed+(driveMode==="shoti"?45:0)+(gas?150:0)-(brake?170:0);speed+=(target-speed)*dt*4;if(speed<0)speed=0;spawn-=dt;if(spawn<=0){spawnEnemy();spawn=Math.max(.35,1.05-score/1000)}if(terrain==="city"&&pedestrians.length<10&&Math.random()<dt*1.5)spawnPedestrian();const steer=(keys.ArrowLeft||keys.a?-1:0)+(keys.ArrowRight||keys.d?1:0);player.x+=steer*420*dt;player.x=Math.max(road.x+40,Math.min(road.x+road.w-40,player.x));enemies.forEach(e=>e.y+=speed*dt);enemies=enemies.filter(e=>e.y<680);pedestrians.forEach(p=>{p.x+=p.dir*p.s*dt;if(p.x<road.x-70)p.dir=1;if(p.x>road.x+road.w+70)p.dir=-1;p.y+=Math.sin((t+p.x)*.01)*.03});pedestrians=pedestrians.filter(p=>p.x>-80&&p.x<980);for(const e of enemies)if(collide(player,e)){gameOver();return}score+=Math.floor(dt*(speed/25));if(Math.floor(score)%50===0&&score>0){document.getElementById("levelToast").textContent="🏁 رکورد جدید!";document.getElementById("levelToast").classList.add("show");setTimeout(()=>document.getElementById("levelToast").classList.remove("show"),500)}baseSpeed=220;updateUI();drawRoad();drawCar("#f3f5f7",player.x,player.y,player.w,player.h,true);enemies.forEach(e=>drawCar(e.c,e.x,e.y,e.w,e.h));if(terrain==="city")pedestrians.forEach(drawPedestrian);drawMap()}
document.addEventListener("keydown",e=>{keys[e.key]=true;if(["ArrowLeft","ArrowRight"," "].includes(e.key))e.preventDefault();if(e.key===" "&&running)paused=!paused;if(e.key.toLowerCase()==="h")horn()});
document.addEventListener("keyup",e=>keys[e.key]=false);
function hold(id,setter){const b=document.getElementById(id);["pointerdown","touchstart"].forEach(ev=>b.addEventListener(ev,e=>{e.preventDefault();setter(true)}));["pointerup","pointercancel","pointerleave","touchend"].forEach(ev=>b.addEventListener(ev,e=>{e.preventDefault();setter(false)}))}
hold("gas",v=>{gas=v;updateUI()});hold("brake",v=>{brake=v;if(v)sound("brake");updateUI()});
function horn(){sound("horn");document.getElementById("hornState").textContent="📯 بوق!";setTimeout(()=>document.getElementById("hornState").textContent="",500)}
document.getElementById("horn").onclick=horn;document.getElementById("lights").onclick=()=>{lights=!lights;updateUI()};
document.querySelectorAll(".steering button").forEach(b=>{b.addEventListener("pointerdown",()=>keys[b.dataset.key]=true);b.addEventListener("pointerup",()=>keys[b.dataset.key]=false);b.addEventListener("pointerleave",()=>keys[b.dataset.key]=false)});
document.getElementById("start").onclick=start;document.getElementById("start2").onclick=start;document.getElementById("pause").onclick=()=>{if(running)paused=!paused};drawRoad();drawCar("#f3f5f7",player.x,player.y,player.w,player.h,true);drawMap();updateUI();
document.querySelectorAll("#terrainMenu button").forEach(b=>b.addEventListener("click",()=>{terrain=b.dataset.terrain;document.getElementById("terrainMenu").style.display="none";drawRoad();drawCar("#f3f5f7",player.x,player.y,player.w,player.h,true);drawMap()}));
document.getElementById("stance").onclick=()=>{driveMode=driveMode==="normal"?"low":driveMode==="low"?"shoti":"normal";const names={normal:"🚗 حالت: عادی",low:"⬇️ حالت: کف‌خواب",shoti:"🏎️ حالت: شوتی"};document.getElementById("stance").textContent=names[driveMode];drawRoad();drawCar("#15171a",player.x,player.y,player.w,player.h,true);};
