/* global Matter */
(() => { "use strict";
  const { Engine, Render, Runner, Bodies, Body, Composite, Events, Vector } = Matter;
  const W=520,H=700,WALL=28,PLAY_WIDTH=430,PLAY_LEFT=(W-PLAY_WIDTH)/2,PLAY_RIGHT=PLAY_LEFT+PLAY_WIDTH,FLOOR_Y=650,DANGER_Y=190;
  const SIZE_SCALE=0.8; // 难度旋钮:整体缩放所有水果的大小。越大越难(越容易堆满),越小越简单;建议 0.6~1.5
  const BASE_RADII=[18,25,34,44,56,69,83,98,114,132,151];
  const LEVELS=[
    {points:1,image:"assets/fruit-0.jpg",fallbackImage:"assets/fruit-0.svg",name:"樱桃"},
    {points:3,image:"assets/fruit-1.jpg",fallbackImage:"assets/fruit-1.svg",name:"草莓"},
    {points:6,image:"assets/fruit-2.jpg",fallbackImage:"assets/fruit-2.svg",name:"葡萄"},
    {points:10,image:"assets/fruit-3.jpg",fallbackImage:"assets/fruit-3.svg",name:"橘子"},
    {points:15,image:"assets/fruit-4.jpg",fallbackImage:"assets/fruit-4.svg",name:"苹果"},
    {points:21,image:"assets/fruit-5.jpg",fallbackImage:"assets/fruit-5.svg",name:"桃子"},
    {points:28,image:"assets/fruit-6.jpg",fallbackImage:"assets/fruit-6.svg",name:"梨子"},
    {points:36,image:"assets/fruit-7.jpg",fallbackImage:"assets/fruit-7.svg",name:"菠萝"},
    {points:45,image:"assets/fruit-8.jpg",fallbackImage:"assets/fruit-8.svg",name:"椰子"},
    {points:55,image:"assets/fruit-9.jpg",fallbackImage:"assets/fruit-9.svg",name:"西瓜"},
    {points:70,image:"assets/fruit-10.jpg",fallbackImage:"assets/fruit-10.svg",name:"彩虹瓜"}
  ].map((d,i)=>({...d,radius:Math.round(BASE_RADII[i]*SIZE_SCALE)}));
  const COLORS=["#dd3347","#ef4c61","#955ebe","#f59a35","#e84b46","#ffa187","#bfd960","#efb841","#8a5a40","#49a95d","#798de7"];
  const canvas=document.querySelector("#game-canvas"),wrap=document.querySelector("#game-wrap"),scoreEl=document.querySelector("#score"),bestEl=document.querySelector("#best-score"),preview=document.querySelector("#next-fruit"),over=document.querySelector("#game-over");
  const engine=Engine.create({gravity:{y:1.05,scale:.001},enableSleeping:true}),render=Render.create({canvas,engine,options:{width:W,height:H,wireframes:false,background:"transparent",pixelRatio:window.devicePixelRatio||1}}),runner=Runner.create();
  function loadImage(image,data){let usedFallback=false;image.onerror=()=>{if(!usedFallback&&data.fallbackImage){usedFallback=true;image.src=data.fallbackImage}};image.src=data.image}
  const images=LEVELS.map(data=>{const i=new Image();loadImage(i,data);return i});let score=0,best=Number(localStorage.getItem("watermelonBest")||0),next=randomLevel(),canDrop=true,ended=false,cooldown=0,dangerFrames=0;
  bestEl.textContent=best;
  function randomLevel(){return Math.random()<.68?0:Math.random()<.72?1:2}
  function makeFruit(x,y,level){const d=LEVELS[level],b=Bodies.circle(x,y,d.radius,{restitution:.18,friction:.3,frictionStatic:.6,frictionAir:.02,density:.0014,label:"fruit",render:{fillStyle:COLORS[level],strokeStyle:"rgba(92,52,30,.18)",lineWidth:2}});b.game={level,bornAt:engine.timing.timestamp,merging:false};return b}
  function resetWorld(){Composite.clear(engine.world,false);Composite.add(engine.world,[Bodies.rectangle(W/2,FLOOR_Y+WALL/2,PLAY_WIDTH,WALL,{isStatic:true,render:{visible:false}}),Bodies.rectangle(PLAY_LEFT-WALL/2,H/2,WALL,H*2,{isStatic:true,render:{visible:false}}),Bodies.rectangle(PLAY_RIGHT+WALL/2,H/2,WALL,H*2,{isStatic:true,render:{visible:false}})])}
  function updatePreview(){const d=LEVELS[next];preview.replaceChildren();const i=new Image();loadImage(i,d);i.alt=`待投放：${d.name}`;preview.append(i)}
  function addScore(n){score+=n;scoreEl.textContent=score;if(score>best){best=score;bestEl.textContent=best;localStorage.setItem("watermelonBest",String(best))}}
  function drop(clientX){if(!canDrop||ended)return;const r=canvas.getBoundingClientRect(),d=LEVELS[next],x=Math.max(PLAY_LEFT+d.radius,Math.min(PLAY_RIGHT-d.radius,(clientX-r.left)*W/r.width));Composite.add(engine.world,makeFruit(x,68,next));canDrop=false;cooldown=560;next=randomLevel();updatePreview()}
  function merge(a,b){if(a.game.merging||b.game.merging||a.game.level!==b.game.level||a.game.level>=LEVELS.length-1)return;a.game.merging=b.game.merging=true;const p=Vector.mult(Vector.add(a.position,b.position),.5),v=Vector.mult(Vector.add(a.velocity,b.velocity),.5),level=a.game.level;Composite.remove(engine.world,a);Composite.remove(engine.world,b);const upgraded=makeFruit(p.x,p.y,level+1);Body.setVelocity(upgraded,v);Composite.add(engine.world,upgraded);addScore(LEVELS[level+1].points)}
  Events.on(engine,"collisionStart",e=>e.pairs.forEach(({bodyA:a,bodyB:b})=>{if(a.label==="fruit"&&b.label==="fruit")merge(a,b)}));
  Events.on(engine,"beforeUpdate",()=>{const dt=engine.timing.lastDelta||16;if(!canDrop&&!ended){cooldown-=dt;if(cooldown<=0)canDrop=true}const now=engine.timing.timestamp,unsafe=Composite.allBodies(engine.world).some(b=>b.label==="fruit"&&!b.game.merging&&now-b.game.bornAt>2800&&b.position.y-b.circleRadius<DANGER_Y&&Math.abs(b.velocity.y)<1.5);dangerFrames=unsafe?dangerFrames+1:Math.max(0,dangerFrames-2);if(!ended&&dangerFrames>85)end()});
  // 判定区域、危险线和地面都使用同一组 Canvas / Matter.js 坐标。
  Events.on(render,"afterRender",()=>{const c=render.context;c.save();c.setLineDash([8,6]);c.strokeStyle="#e44e4ec7";c.lineWidth=3;c.beginPath();c.moveTo(PLAY_LEFT,DANGER_Y);c.lineTo(PLAY_RIGHT,DANGER_Y);c.stroke();c.setLineDash([]);c.fillStyle="#d64b4b";c.font="bold 13px sans-serif";c.textAlign="right";c.fillText("危险线",PLAY_RIGHT-5,DANGER_Y-8);c.fillStyle="#63ad63";c.fillRect(PLAY_LEFT,FLOOR_Y,PLAY_WIDTH,H-FLOOR_Y);c.strokeStyle="#286e3b";c.lineWidth=4;c.beginPath();c.moveTo(PLAY_LEFT,FLOOR_Y);c.lineTo(PLAY_RIGHT,FLOOR_Y);c.stroke();c.fillStyle="rgba(38,104,55,.28)";for(let x=PLAY_LEFT-H;x<PLAY_RIGHT;x+=22){c.beginPath();c.moveTo(x,H);c.lineTo(x+50,FLOOR_Y);c.lineTo(x+60,FLOOR_Y);c.lineTo(x+10,H);c.fill()}c.fillStyle="#3c884b";c.fillRect(PLAY_LEFT-4,0,8,FLOOR_Y);c.fillRect(PLAY_RIGHT-4,0,8,FLOOR_Y);c.fillStyle="#fff";c.font="bold 14px sans-serif";c.textAlign="center";c.fillText("地面",W/2,FLOOR_Y+29);c.restore();Composite.allBodies(engine.world).forEach(b=>{if(b.label!=="fruit"||b.game.merging)return;const i=images[b.game.level],r=b.circleRadius;if(!i.complete||!i.naturalWidth)return;c.save();c.beginPath();c.arc(b.position.x,b.position.y,r,0,Math.PI*2);c.clip();c.drawImage(i,b.position.x-r,b.position.y-r,r*2,r*2);c.restore()})});
  function end(){ended=true;canDrop=false;document.querySelector("#final-score").textContent=score;over.hidden=false}function restart(){score=0;scoreEl.textContent="0";ended=false;canDrop=true;dangerFrames=0;next=randomLevel();over.hidden=true;resetWorld();updatePreview()}
  canvas.addEventListener("pointerup",e=>{if(e.button===0||e.pointerType!=="mouse")drop(e.clientX)});document.querySelector("#restart-button").addEventListener("click",restart);document.querySelector("#restart-overlay").addEventListener("click",restart);resetWorld();updatePreview();Render.run(render);Runner.run(runner,engine);
})();
