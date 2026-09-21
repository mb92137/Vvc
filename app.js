const canvas=document.getElementById("game"),ctx=canvas.getContext("2d"),map=document.getElementById("map"),mctx=map.getContext("2d");
function setupCanvasQuality(){
  const dpr=Math.min(window.devicePixelRatio||1,2);
  const cssW=canvas.clientWidth||900,cssH=canvas.clientHeight||600;
  canvas.width=Math.round(cssW*dpr);canvas.height=Math.round(cssH*dpr);
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.imageSmoothingEnabled=true;
  const mdpr=Math.min(window.devicePixelRatio||1,2);
  const mw=map.clientWidth||120,mh=map.clientHeight||160;
  map.width=Math.round(mw*mdpr);map.height=Math.round(mh*mdpr);
  mctx.setTransform(mdpr,0,0,mdpr,0,0);mctx.imageSmoothingEnabled=true;
}
setupCanvasQuality();
window.addEventListener("resize",setupCanvasQuality);
const scoreEl=document.getElementById("score"),speedEl=document.getElementById("speed"),bestEl=document.getElementById("best"),gearEl=document.getElementById("gear"),msg=document.getElementById("message");
let running=false,paused=false,last=0,score=0,scoreTime=0,baseSpeed=220,speed=220,best=0;
try{best=Number(localStorage.getItem("street-best")||0)||0}catch(e){best=0}
let player={x:450,y:500,w:58,h:96},enemies=[],spawn=0,keys={},gas=false,brake=false,lights=false,audio;let terrain="highway",driveMode="normal",pedestrians=[];
function saveBest(){const target=score*2;if(target>best){best=target;try{localStorage.setItem("street-best",String(best));localStorage.setItem("street-last-score",String(score))}catch(e){}}bestEl.textContent="رکورد: "+best.toLocaleString("fa-IR")}
bestEl.textContent="رکورد: "+best.toLocaleString("fa-IR");
const road={x:170,w:560};
function sound(type){try{audio??=new AudioContext();const o=audio.createOscillator(),g=audio.createGain();o.connect(g);g.connect(audio.destination);const f=type==="horn"?180:type==="crash"?70:type==="brake"?120:700;o.frequency.value=f;g.gain.value=type==="horn"?0.12:.05;o.start();o.stop(audio.currentTime+(type==="horn"?0.3:.12))}catch(e){}}
function engineSound(){if(!audio)return;try{const o=audio.createOscillator(),g=audio.createGain();o.connect(g);g.connect(audio.destination);o.type="sawtooth";o.frequency.value=70+speed*.55;g.gain.value=.018;o.start();o.stop(audio.currentTime+.07)}catch(e){}}
function reset(){pedestrians=[];score=0;scoreTime=0;baseSpeed=220;speed=220;level=1;enemies=[];spawn=0;player.x=450;paused=false;gas=false;brake=false;driveMode="normal";updateUI()}
function start(){reset();running=true;msg.style.display="none";sound("start");last=performance.now();requestAnimationFrame(loop)}
function gameOver(){running=false;sound("crash");saveBest();try{localStorage.setItem("street-last-score",String(score))}catch(e){}msg.querySelector("h1").textContent="💥 بازی تمام شد";msg.querySelector("p").textContent="امتیاز شما: "+score.toLocaleString("fa-IR");msg.style.display="block"}
function rect(x,y,w,h,r=8){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill()}
function drawRoadDetails(){
  ctx.save();
  // roadside posts and reflectors
  for(let y=40;y<600;y+=70){
    const yy=(y+score*3)%670-70;
    ctx.fillStyle="#eee";ctx.fillRect(road.x-28,yy,6,24);ctx.fillRect(road.x+road.w+22,yy,6,24);
    ctx.fillStyle="#e33";ctx.fillRect(road.x-28,yy,6,6);ctx.fillRect(road.x+road.w+22,yy,6,6);
  }
  // road surface patches
  ctx.globalAlpha=.16;ctx.fillStyle="#fff";
  for(let i=0;i<10;i++){const yy=(i*83+score*4)%650-50;ctx.fillRect(road.x+25+(i%4)*135,yy,45,3)}
  ctx.globalAlpha=1;
  // roadside trees/buildings depending on terrain
  if(terrain==="forest"){
    for(let i=0;i<9;i++){const yy=(i*97+score*2.2)%700-80;for(const sx of [road.x-65,road.x+road.w+55]){ctx.fillStyle="#5a3820";ctx.fillRect(sx-4,yy,8,35);ctx.fillStyle="#1d6b2a";ctx.beginPath();ctx.arc(sx,yy-5,20,0,Math.PI*2);ctx.fill()}}
  }else if(terrain==="city"){
    for(let i=0;i<7;i++){const yy=(i*105+score*2.5)%700-90;for(const sx of [25,road.x+road.w+35]){ctx.fillStyle="#3a4048";ctx.fillRect(sx,yy,80,55);ctx.fillStyle="#f6d76a";for(let w=0;w<3;w++)ctx.fillRect(sx+12+w*20,yy+12,8,10)}}
  }else if(terrain==="desert"){
    ctx.fillStyle="#8d6a39";for(let i=0;i<10;i++){const yy=(i*111+score*1.8)%680-60;ctx.beginPath();ctx.arc(i%2?road.x-55:road.x+road.w+55,yy,14,0,Math.PI*2);ctx.fill()}
  }
  ctx.restore();
}
function drawRoad(){const bg={desert:"#c89b58",forest:"#31552f",city:"#252a31",highway:"#31552f"}[terrain];ctx.fillStyle=bg;ctx.fillRect(0,0,900,600);ctx.globalAlpha=.22;ctx.fillStyle="#fff";for(let i=0;i<12;i++){ctx.beginPath();ctx.arc((i*83+score*.35)%900,(i*137+score*.18)%600,2+(i%3),0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1;if(terrain==="desert"){for(let i=0;i<20;i++){ctx.fillStyle="#d7b878";ctx.fillRect((i*97+score)%900,((i*53+score*0.3)%600),3,3)}}else if(terrain==="forest"){ctx.fillStyle="#214722";for(let i=0;i<18;i++){ctx.beginPath();ctx.arc((i*71)%160,(i*91)%600,24,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(740+(i*53)%160,(i*67)%600,28,0,Math.PI*2);ctx.fill()}}else if(terrain==="city"){ctx.fillStyle="#555";for(let i=0;i<8;i++){ctx.fillRect(i*115,0,65,80+(i%3)*35);ctx.fillRect(i*115,520,65,80-(i%3)*15)}ctx.fillStyle="#777";ctx.fillRect(0,95,road.x-12,410);ctx.fillRect(road.x+road.w+12,95,900-road.x-road.w-12,410);ctx.fillStyle="#ddd";ctx.fillRect(0,108,road.x-12,3);ctx.fillRect(road.x+road.w+12,108,900-road.x-road.w-12,3);ctx.fillStyle="#bbb";for(let y=130;y<500;y+=45){ctx.fillRect(25,y,80,4);ctx.fillRect(road.x+road.w+30,y,80,4)}}ctx.fillStyle="#171a1f";ctx.fillRect(road.x,0,road.w,600);ctx.fillStyle="#353a41";ctx.fillRect(road.x+8,0,road.w-16,600);ctx.fillStyle="#aaa";ctx.fillRect(road.x+8,0,5,600);ctx.fillRect(road.x+road.w-13,0,5,600);ctx.fillStyle="#555";ctx.fillRect(road.x+7,0,road.w-14,600);ctx.fillStyle="#ddd";ctx.fillRect(road.x,0,7,600);ctx.fillRect(road.x+road.w-7,0,7,600);ctx.strokeStyle="#e9e2b6";ctx.lineWidth=7;ctx.shadowBlur=0;ctx.setLineDash([35,35]);ctx.lineDashOffset=-(score*2%70);for(let i=1;i<4;i++){ctx.beginPath();ctx.moveTo(road.x+road.w*i/4,0);ctx.lineTo(road.x+road.w*i/4,600);ctx.stroke()}ctx.setLineDash([])}
function drawPremiumRoadFX(){
  ctx.save();
  const t=performance.now();
  // lane shimmer and heat haze
  ctx.globalAlpha=.07;
  for(let i=0;i<9;i++){
    const y=235+i*44+Math.sin(t*.0015+i)*2;
    ctx.strokeStyle="#fff";ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(road.x+road.w*.12,y);ctx.lineTo(road.x+road.w*.88,y+Math.sin(i)*2);ctx.stroke();
  }
  // illuminated center perspective
  ctx.globalAlpha=.055;
  const g=ctx.createLinearGradient(road.x+road.w/2,180,road.x+road.w/2,620);
  g.addColorStop(0,"#fff");g.addColorStop(1,"rgba(255,255,255,0)");
  ctx.fillStyle=g;ctx.fillRect(road.x+road.w*.25,180,road.w*.5,440);
  // tiny floating dust particles
  ctx.globalAlpha=.13;ctx.fillStyle="#fff";
  for(let i=0;i<20;i++){const x=(i*61+t*.035)%W,y=170+(i*37)%390;ctx.fillRect(x,y,1,1)}
  ctx.globalAlpha=1;ctx.restore();
}
function drawCinematicEffects(){
  ctx.save();
  const t=performance.now();
  // subtle camera shake at high speed
  const shake=Math.max(0,Math.min(2,(speed-150)/70));
  if(shake>0){ctx.translate(Math.sin(t*.035)*shake,Math.cos(t*.041)*shake*.6)}
  // soft road-edge glow
  ctx.globalAlpha=.11;ctx.lineWidth=5;ctx.strokeStyle="#fff";
  ctx.beginPath();ctx.moveTo(road.x+4,180);ctx.lineTo(road.x+4,620);ctx.stroke();
  ctx.beginPath();ctx.moveTo(road.x+road.w-4,180);ctx.lineTo(road.x+road.w-4,620);ctx.stroke();
  // moving dust/air streaks
  ctx.globalAlpha=.12;ctx.lineWidth=1;
  for(let i=0;i<12;i++){const x=(i*97+t*.18)%W;const y=190+(i*53)%360;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-18,y+2);ctx.stroke()}
  ctx.globalAlpha=1;ctx.restore();
}
function drawUltraEffects(){
  ctx.save();
  const t=performance.now();
  // animated sun streaks / lens glow
  const glow=ctx.createRadialGradient(W*.5,105,5,W*.5,105,190);glow.addColorStop(0,"rgba(255,245,205,.16)");glow.addColorStop(1,"rgba(255,245,205,0)");ctx.fillStyle=glow;ctx.fillRect(0,0,W,260);
  // road reflection bands
  ctx.globalAlpha=.08;ctx.strokeStyle="#fff";ctx.lineWidth=2;
  for(let i=0;i<7;i++){const y=300+i*42+Math.sin(t*.001+i)*3;ctx.beginPath();ctx.moveTo(road.x+20,y);ctx.lineTo(road.x+road.w-20,y+5);ctx.stroke()}
  // speed particles
  ctx.globalAlpha=.16;ctx.lineWidth=1;
  for(let i=0;i<18;i++){const x=(i*83+t*.12)%W,y=250+(i*47)%300;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-10,y+22);ctx.stroke()}
  ctx.globalAlpha=1;ctx.restore();
}
function drawHighQualityLighting(){
  ctx.save();
  // dynamic lighting pools on the road
  const pulse=.5+.5*Math.sin(performance.now()*.002);
  ctx.globalAlpha=.035+.025*pulse;
  const light=ctx.createRadialGradient(player.x,player.y-100,10,player.x,player.y-100,260);light.addColorStop(0,"#ffffff");light.addColorStop(1,"rgba(255,255,255,0)");ctx.fillStyle=light;ctx.fillRect(road.x,0,road.w,600);
  // soft car highlight
  ctx.globalAlpha=.13;ctx.fillStyle="#fff";ctx.beginPath();ctx.ellipse(player.x-9,player.y-18,10,38,-.18,0,Math.PI*2);ctx.fill();
  // distant atmospheric haze
  const haze=ctx.createLinearGradient(0,130,0,360);haze.addColorStop(0,"rgba(255,255,255,.07)");haze.addColorStop(1,"rgba(255,255,255,0)");ctx.fillStyle=haze;ctx.fillRect(0,120,900,260);
  ctx.globalAlpha=1;ctx.restore();
}
function drawEnvironmentExtras(){
  ctx.save();
  // roadside fences
  if(terrain!=="city"){
    ctx.strokeStyle=terrain==="desert"?"#8a6b3d":"#6b6b55";ctx.lineWidth=3;ctx.globalAlpha=.7;
    for(let i=0;i<10;i++){const y=(i*72+score*3.5)%680-40;const side=i%2?-1:1;const x=side<0?road.x-78:road.x+road.w+78;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+35);ctx.moveTo(x+side*25,y);ctx.lineTo(x+side*25,y+35);ctx.moveTo(x,y+12);ctx.lineTo(x+side*25,y+12);ctx.moveTo(x,y+27);ctx.lineTo(x+side*25,y+27);ctx.stroke()}
  }
  // lane reflectors
  ctx.globalAlpha=.8;for(let i=0;i<12;i++){const y=(i*58+score*5)%650-25;ctx.fillStyle=i%3===0?"#ffd84a":"#dff";for(let lane=0;lane<4;lane++){const x=road.x+road.w*(lane+.5)/4;ctx.beginPath();ctx.arc(x,y,2.5,0,Math.PI*2);ctx.fill()}}
  // overhead sign in city
  if(terrain==="city"){
    const sy=(180+score*1.7)%520;ctx.fillStyle="#444";ctx.fillRect(road.x+road.w/2-3,sy-55,6,55);ctx.fillStyle="#1769aa";ctx.fillRect(road.x+road.w/2-75,sy-82,150,28);ctx.fillStyle="#fff";ctx.font="bold 13px sans-serif";ctx.textAlign="center";ctx.fillText("BETAZ • ROAD",road.x+road.w/2,sy-63)
  }
  ctx.globalAlpha=1;ctx.restore();
}
function drawTrafficDetails(){
  ctx.save();
  // roadside barriers and chevrons
  for(let i=0;i<8;i++){
    const y=(i*88+score*4.2)%700-60;
    const side=i%2?-1:1;
    const x=side<0?road.x-42:road.x+road.w+42;
    ctx.fillStyle="#c9c9c9";ctx.fillRect(x-3,y,6,22);
    ctx.fillStyle="#f4b400";ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+side*18,y+10);ctx.lineTo(x,y+20);ctx.closePath();ctx.fill();
  }
  // roadside grass / bushes
  if(terrain!=="city"){
    for(let i=0;i<18;i++){
      const y=(i*73+score*2.7)%680-40;
      const side=i%2?-1:1;const x=side<0?road.x-18-Math.random()*35:road.x+road.w+18+Math.random()*35;
      ctx.fillStyle=terrain==="forest"?"#245b2a":terrain==="desert"?"#9b763d":"#315d35";
      ctx.beginPath();ctx.arc(x,y,7+(i%4)*2,0,Math.PI*2);ctx.fill();
    }
  }
  // brake-light glow behind nearby enemies
  enemies.forEach(e=>{if(e.y>40&&e.y<560){ctx.globalAlpha=.16;ctx.fillStyle="#f22";ctx.shadowColor="#f22";ctx.shadowBlur=14;ctx.fillRect(e.x-e.w*.28,e.y+e.h*.35,e.w*.18,6);ctx.fillRect(e.x+e.w*.10,e.y+e.h*.35,e.w*.18,6);ctx.shadowBlur=0}});
  ctx.globalAlpha=1;ctx.restore();
}
function drawWorldDetails(){
  ctx.save();
  // roadside lights / poles
  for(let i=0;i<6;i++){
    const y=(i*125+score*3.2)%720-80;
    for(const side of [-1,1]){
      const x=side<0?road.x-95:road.x+road.w+95;
      ctx.fillStyle="#333";ctx.fillRect(x-3,y,6,58);
      ctx.strokeStyle="#444";ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+side*28,y-18);ctx.stroke();
      ctx.fillStyle="#ffe9a3";ctx.shadowColor="#ffe9a3";ctx.shadowBlur=12;ctx.beginPath();ctx.arc(x+side*30,y-20,7,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
    }
  }
  // traffic signals in city
  if(terrain==="city"){
    for(let i=0;i<3;i++){
      const y=(i*210+score*2)%720-90;
      for(const side of [-1,1]){
        const x=side<0?road.x-35:road.x+road.w+35;
        ctx.fillStyle="#222";ctx.fillRect(x-8,y,16,55);
        ctx.fillStyle=i%3===0?"#e33":i%3===1?"#ffd43b":"#39d353";ctx.beginPath();ctx.arc(x,y+10,5,0,Math.PI*2);ctx.fill();
      }
    }
  }
  // lane wear / tire marks
  ctx.globalAlpha=.12;ctx.strokeStyle="#111";ctx.lineWidth=3;
  for(let i=0;i<4;i++){const x=road.x+road.w*(i+.5)/4;const y=(score*7+i*140)%700-80;ctx.beginPath();ctx.moveTo(x-12,y);ctx.lineTo(x-12,y+45);ctx.stroke();ctx.beginPath();ctx.moveTo(x+12,y+8);ctx.lineTo(x+12,y+53);ctx.stroke()}
  ctx.globalAlpha=1;ctx.restore();
}
function drawPremiumEffects(){
  ctx.save();
  // dynamic sky gradient
  const sky=ctx.createLinearGradient(0,0,0,260);sky.addColorStop(0,"rgba(40,70,100,.18)");sky.addColorStop(1,"rgba(255,210,120,.03)");ctx.fillStyle=sky;ctx.fillRect(0,0,900,260);
  // small dust particles on desert / rain-like particles on forest and highway
  ctx.globalAlpha=.16;ctx.fillStyle="#fff";for(let i=0;i<28;i++){const x=(i*113+score*7)%900,y=(i*71+score*(terrain==="desert"?1.5:4))%600;ctx.fillRect(x,y,terrain==="desert"?3:1,terrain==="desert"?2:7)}
  // reflective lane sheen
  ctx.globalAlpha=.09;ctx.fillStyle="#fff";for(let i=0;i<4;i++){const x=road.x+road.w*(i+.5)/4;ctx.fillRect(x-1,0,2,600)}
  // player shadow
  ctx.globalAlpha=.28;ctx.fillStyle="#000";ctx.beginPath();ctx.ellipse(player.x,player.y+player.h*.52,player.w*.7,9,0,0,Math.PI*2);ctx.fill();
  // soft vignette
  const v=ctx.createRadialGradient(450,300,170,450,300,650);v.addColorStop(0,"rgba(0,0,0,0)");v.addColorStop(1,"rgba(0,0,0,.22)");ctx.fillStyle=v;ctx.fillRect(0,0,900,600);
  ctx.globalAlpha=1;ctx.restore();
}
function drawAdvancedEffects(){
  ctx.save();
  // atmospheric horizon bands
  const h=ctx.createLinearGradient(0,80,0,330);h.addColorStop(0,"rgba(255,255,255,.10)");h.addColorStop(.55,"rgba(255,255,255,.025)");h.addColorStop(1,"rgba(0,0,0,0)");ctx.fillStyle=h;ctx.fillRect(0,70,900,260);
  // lane-side rumble strips
  ctx.globalAlpha=.5;ctx.fillStyle="#f2f2f2";for(let y=-20;y<620;y+=34){const yy=(y+score*3)%680-40;ctx.fillRect(road.x+16,yy,18,4);ctx.fillRect(road.x+road.w-34,yy,18,4)}
  // speed glow around player
  if(speed>300){ctx.globalAlpha=Math.min(.16,(speed-300)/900);ctx.strokeStyle="#8eeaff";ctx.lineWidth=3;ctx.beginPath();ctx.arc(player.x,player.y,75+(speed-300)*.08,0,Math.PI*2);ctx.stroke()}
  // windshield-like highlight on player car
  ctx.globalAlpha=.12;ctx.fillStyle="#fff";ctx.beginPath();ctx.ellipse(player.x-10,player.y-22,14,30,-.2,0,Math.PI*2);ctx.fill();
  ctx.globalAlpha=1;ctx.restore();
}
function drawQualityEffects(){
  ctx.save();
  // subtle motion streaks for speed
  const intensity=Math.min(1,Math.max(0,(speed-220)/180));
  if(intensity>.05){ctx.globalAlpha=.08+intensity*.12;ctx.strokeStyle="#fff";ctx.lineWidth=2;for(let i=0;i<18;i++){const x=(i*67+score*9)%900;const y=(i*97+score*18)%600;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+18+intensity*35);ctx.stroke()}}
  // soft horizon glow
  const g=ctx.createLinearGradient(0,0,0,180);g.addColorStop(0,"rgba(255,255,255,.12)");g.addColorStop(1,"rgba(255,255,255,0)");ctx.fillStyle=g;ctx.fillRect(0,0,900,180);
  // road edge highlights
  ctx.globalAlpha=.45;ctx.fillStyle="#fff";ctx.fillRect(road.x+8,0,2,600);ctx.fillRect(road.x+road.w-10,0,2,600);ctx.globalAlpha=1;
  ctx.restore();
}
function drawExtraDetails(){
  ctx.save();
  // moving lane arrows and road markings
  ctx.globalAlpha=.7;ctx.fillStyle="#f5f5f5";
  for(let i=0;i<5;i++){const yy=(i*145+score*5)%720-100;for(let lane=0;lane<4;lane++){const x=road.x+road.w*(lane+.5)/4;ctx.beginPath();ctx.moveTo(x,yy+16);ctx.lineTo(x-7,yy+27);ctx.lineTo(x+7,yy+27);ctx.closePath();ctx.fill()}}
  ctx.globalAlpha=1;
  // sun / sky glow
  if(terrain!=="city"){ctx.globalAlpha=.12;ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(90,75,45,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1}
  // road-side signs
  for(let i=0;i<4;i++){const yy=(i*180+score*2.8)%760-100;const sx=i%2?road.x+road.w+70:road.x-70;ctx.fillStyle="#555";ctx.fillRect(sx-2,yy+25,4,35);ctx.fillStyle=i%2?"#ffd43b":"#4dd0e1";ctx.beginPath();ctx.roundRect(sx-20,yy,40,26,5);ctx.fill();ctx.fillStyle="#111";ctx.font="bold 11px sans-serif";ctx.textAlign="center";ctx.fillText(i%2?"50":"→",sx,yy+18)}
  ctx.restore();
}
function drawCar(c,x,y,w,h,isPlayer=false){ctx.save();ctx.translate(x,y);if(isPlayer&&driveMode==="low"){h*=.9;w*=1.03}const body=isPlayer?"#1769aa":c;ctx.shadowColor="rgba(0,0,0,.5)";ctx.shadowBlur=10;ctx.fillStyle=body;ctx.beginPath();ctx.moveTo(-w*.46,h*.45);ctx.lineTo(-w*.49,h*.20);ctx.lineTo(-w*.42,-h*.28);ctx.lineTo(-w*.28,-h*.46);ctx.lineTo(w*.28,-h*.46);ctx.lineTo(w*.42,-h*.28);ctx.lineTo(w*.49,h*.20);ctx.lineTo(w*.46,h*.45);ctx.quadraticCurveTo(0,h*.52,-w*.46,h*.45);ctx.fill();ctx.fillStyle="#172b3a";ctx.beginPath();ctx.moveTo(-w*.29,-h*.27);ctx.lineTo(-w*.20,-h*.40);ctx.lineTo(w*.20,-h*.40);ctx.lineTo(w*.29,-h*.27);ctx.lineTo(w*.24,h*.02);ctx.lineTo(-w*.24,h*.02);ctx.closePath();ctx.fill();ctx.fillStyle="#416579";ctx.fillRect(-w*.19,-h*.35,w*.15,h*.22);ctx.fillRect(w*.04,-h*.35,w*.15,h*.22);ctx.fillStyle="#223c4b";ctx.fillRect(-w*.025,-h*.35,w*.05,h*.37);ctx.fillStyle="rgba(255,255,255,.10)";ctx.fillRect(-w*.37,h*.03,w*.74,h*.08);ctx.fillStyle="rgba(0,0,0,.16)";ctx.fillRect(-w*.39,h*.28,w*.78,h*.10);ctx.fillStyle="#11151a";ctx.fillRect(-w*.25,-h*.475,w*.50,h*.055);ctx.fillStyle=lights&&isPlayer?"#fff":"#f4e6b5";ctx.shadowColor=lights&&isPlayer?"#fff":"transparent";ctx.shadowBlur=lights&&isPlayer?12:0;ctx.fillRect(-w*.35,-h*.43,w*.19,h*.065);ctx.fillRect(w*.16,-h*.43,w*.19,h*.065);ctx.shadowBlur=0;ctx.fillStyle=isPlayer?"#e52b32":"#b72d35";ctx.fillRect(-w*.36,h*.36,w*.20,h*.065);ctx.fillRect(w*.16,h*.36,w*.20,h*.065);ctx.fillStyle="#0b0d10";ctx.fillRect(-w*.40,h*.43,w*.80,h*.055);for(const wy of [-h*.27,h*.28])for(const wx of [-w*.49,w*.49]){ctx.fillStyle="#050505";ctx.beginPath();ctx.ellipse(wx,wy,6,13,0,0,Math.PI*2);ctx.fill();ctx.fillStyle="#888";ctx.beginPath();ctx.arc(wx,wy,3.2,0,Math.PI*2);ctx.fill()}ctx.fillStyle="#0b0d10";ctx.beginPath();ctx.ellipse(-w*.51,-h*.08,5,8,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.ellipse(w*.51,-h*.08,5,8,0,0,Math.PI*2);ctx.fill();ctx.fillStyle="#d9d9d9";ctx.font="bold 8px sans-serif";ctx.textAlign="center";ctx.fillText(isPlayer?"P":"",0,h*.30);ctx.restore();ctx.shadowBlur=0}
function spawnPedestrian(){const side=Math.random()<.5?0:1;pedestrians.push({x:side?road.x+road.w+45:road.x-45,y:Math.random()*600,dir:side?-1:1,s:35+Math.random()*35,c:["#f2c7a5","#d88","#8cf","#fdc"].at(Math.floor(Math.random()*4))})}
function spawnEnemy(){const lane=Math.floor(Math.random()*4);enemies.push({x:road.x+road.w*(lane+.5)/4,y:-80,w:52,h:86,c:["#e14b4b","#3f86d9","#f0a33a","#9b68d1"][Math.floor(Math.random()*4)]})}
function collide(a,b){return Math.abs(a.x-b.x)<(a.w+b.w)*.42&&Math.abs(a.y-b.y)<(a.h+b.h)*.42}
function drawPedestrian(p){ctx.save();ctx.translate(p.x,p.y);ctx.fillStyle=p.c;ctx.beginPath();ctx.arc(0,-9,6,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#222";ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(0,-3);ctx.lineTo(0,12);ctx.moveTo(0,2);ctx.lineTo(-7,8);ctx.moveTo(0,2);ctx.lineTo(7,8);ctx.moveTo(0,12);ctx.lineTo(-6,20);ctx.moveTo(0,12);ctx.lineTo(6,20);ctx.stroke();ctx.restore()}
function drawMap(){mctx.fillStyle="#245025";mctx.fillRect(0,0,120,160);mctx.fillStyle="#555";mctx.fillRect(25,0,70,160);mctx.fillStyle="#ddd";for(let y=5;y<160;y+=20)mctx.fillRect(58,y,4,10);mctx.fillStyle="#e33";mctx.fillRect(55,140,10,14);enemies.forEach(e=>{mctx.fillStyle="#f6a";mctx.fillRect(55,Math.max(2,Math.min(150,e.y/4)),10,7)})}
function updateUI(){scoreEl.textContent="امتیاز: "+score.toLocaleString("fa-IR");speedEl.textContent="سرعت: "+Math.max(0,Math.round(speed/10))+" km/h";gearEl.textContent="دنده: "+(brake?"R":gas?"D":"N");document.getElementById("lightsState").textContent=lights?"💡 چراغ روشن":"💡 خاموش";bestEl.textContent="رکورد: "+best.toLocaleString("fa-IR")}
function loop(t){if(!running)return;requestAnimationFrame(loop);if(paused){last=t;return}const dt=Math.min((t-last)/1000,.04);last=t;engineSound();const target=baseSpeed+(driveMode==="shoti"?45:0)+(gas?150:0)-(brake?170:0);speed+=(target-speed)*dt*4;if(speed<0)speed=0;spawn-=dt;if(spawn<=0){spawnEnemy();spawn=Math.max(.35,1.05-score/1000)}if(terrain==="city"&&pedestrians.length<10&&Math.random()<dt*1.5)spawnPedestrian();const steer=(keys.ArrowLeft||keys.a?-1:0)+(keys.ArrowRight||keys.d?1:0);player.x+=steer*420*dt;player.x=Math.max(road.x+40,Math.min(road.x+road.w-40,player.x));enemies.forEach(e=>e.y+=speed*dt);enemies=enemies.filter(e=>e.y<680);pedestrians.forEach(p=>{p.x+=p.dir*p.s*dt;if(p.x<road.x-70)p.dir=1;if(p.x>road.x+road.w+70)p.dir=-1;p.y+=Math.sin((t+p.x)*.01)*.03});pedestrians=pedestrians.filter(p=>p.x>-80&&p.x<980);for(const e of enemies)if(collide(player,e)){gameOver();return}
  scoreTime+=dt;
  if(scoreTime>=1){const whole=Math.floor(scoreTime);score+=whole;scoreTime-=whole;saveBest();updateUI()}
  if(score>0&&score%50===0){document.getElementById("levelToast").textContent="🏁 رکورد جدید!";document.getElementById("levelToast").classList.add("show");setTimeout(()=>document.getElementById("levelToast").classList.remove("show"),500)}
  baseSpeed=220;updateUI();drawRoad();drawRoadDetails();drawExtraDetails();drawWorldDetails();drawTrafficDetails();drawEnvironmentExtras();drawQualityEffects();drawHighQualityLighting();drawUltraEffects();drawCinematicEffects();drawPremiumRoadFX();drawAdvancedEffects();drawPremiumEffects();drawCar("#f3f5f7",player.x,player.y,player.w,player.h,true);enemies.forEach(e=>drawCar(e.c,e.x,e.y,e.w,e.h));if(terrain==="city")pedestrians.forEach(drawPedestrian);drawMap()}
document.addEventListener("keydown",e=>{keys[e.key]=true;if(["ArrowLeft","ArrowRight"," "].includes(e.key))e.preventDefault();if(e.key===" "&&running)paused=!paused;if(e.key.toLowerCase()==="h")horn()});
document.addEventListener("keyup",e=>keys[e.key]=false);
function hold(id,setter){const b=document.getElementById(id);["pointerdown","touchstart"].forEach(ev=>b.addEventListener(ev,e=>{e.preventDefault();setter(true)}));["pointerup","pointercancel","pointerleave","touchend"].forEach(ev=>b.addEventListener(ev,e=>{e.preventDefault();setter(false)}))}
hold("gas",v=>{gas=v;updateUI()});hold("brake",v=>{brake=v;if(v)sound("brake");updateUI()});
function horn(){sound("horn");document.getElementById("hornState").textContent="📯 بوق!";setTimeout(()=>document.getElementById("hornState").textContent="",500)}
document.getElementById("horn").onclick=horn;document.getElementById("lights").onclick=()=>{lights=!lights;updateUI()};
document.querySelectorAll(".steering button").forEach(b=>{b.addEventListener("pointerdown",()=>keys[b.dataset.key]=true);b.addEventListener("pointerup",()=>keys[b.dataset.key]=false);b.addEventListener("pointerleave",()=>keys[b.dataset.key]=false)});
document.getElementById("start").onclick=start;document.getElementById("start2").onclick=start;document.getElementById("pause").onclick=()=>{if(running)paused=!paused};drawRoad();drawRoadDetails();drawCar("#f3f5f7",player.x,player.y,player.w,player.h,true);drawMap();updateUI();
document.querySelectorAll("#terrainMenu button").forEach(b=>b.addEventListener("click",()=>{terrain=b.dataset.terrain;document.getElementById("terrainMenu").style.display="none";drawRoad();drawCar("#f3f5f7",player.x,player.y,player.w,player.h,true);drawMap()}));
document.getElementById("stance").style.display="none";