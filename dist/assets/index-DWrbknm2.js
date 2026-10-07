var ee=Object.defineProperty;var te=(e,t,s)=>t in e?ee(e,t,{enumerable:!0,configurable:!0,writable:!0,value:s}):e[t]=s;var o=(e,t,s)=>te(e,typeof t!="symbol"?t+"":t,s);(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))i(r);new MutationObserver(r=>{for(const n of r)if(n.type==="childList")for(const l of n.addedNodes)l.tagName==="LINK"&&l.rel==="modulepreload"&&i(l)}).observe(document,{childList:!0,subtree:!0});function s(r){const n={};return r.integrity&&(n.integrity=r.integrity),r.referrerPolicy&&(n.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?n.credentials="include":r.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function i(r){if(r.ep)return;r.ep=!0;const n=s(r);fetch(r.href,n)}})();class H{constructor(t,s,i,r,n,l){o(this,"el");o(this,"pos");o(this,"vel",{x:0,y:0});o(this,"stage");o(this,"rig");o(this,"maxSpeed");o(this,"accel");o(this,"facing",1);o(this,"flip");o(this,"renderedFacing",0);o(this,"renderedZ",-1);this.stage=t,this.pos={...r},this.maxSpeed=n,this.accel=l,this.el=document.createElement("div"),this.el.className=`critter ${s} is-running`,this.el.style.setProperty("--stride",`${(95/n).toFixed(3)}s`),this.el.style.setProperty("--wag",`${(220/n).toFixed(3)}s`),this.el.innerHTML=`<div class="pop"><div class="flip"><div class="rig">${i}</div></div></div><div class="shadow"></div>`,this.flip=this.el.querySelector(".flip"),this.rig=this.el.querySelector(".rig"),t.appendChild(this.el),this.render()}steer(t,s,i,r){const n=t-this.pos.x,l=s-this.pos.y,h=Math.hypot(n,l);if(h>.001){const V=r?.3+.7*Math.min(1,h/90):1,S=this.maxSpeed*V;let x=n/h*S-this.vel.x,w=l/h*S-this.vel.y;const k=Math.hypot(x,w),v=this.accel*i;k>v&&(x*=v/k,w*=v/k),this.vel.x+=x,this.vel.y+=w}return this.move(i),Math.abs(this.vel.x)>12&&(this.facing=this.vel.x>0?1:-1),h}coast(t,s){const i=Math.pow(s,t);this.vel.x*=i,this.vel.y*=i,this.move(t)}stop(){this.vel.x=0,this.vel.y=0}render(){this.el.style.transform=`translate3d(${this.pos.x.toFixed(1)}px, ${this.pos.y.toFixed(1)}px, 0)`;const t=Math.max(1,Math.round(this.pos.y)+1e4);t!==this.renderedZ&&(this.renderedZ=t,this.el.style.zIndex=String(t)),this.facing!==this.renderedFacing&&(this.renderedFacing=this.facing,this.flip.style.transform=`scaleX(${this.facing})`)}dispose(){const t=this.el;t.classList.add("is-leaving"),window.setTimeout(()=>t.remove(),350)}removeNow(){this.el.remove()}move(t){this.pos.x+=this.vel.x*t,this.pos.y+=this.vel.y*t}}const T=["♥","♥","♥","♥","✦","♪"];function d(e,t,s,i,r={}){const n=document.createElement("span");n.className=r.cls?`spark ${r.cls}`:"spark",n.textContent=i??T[Math.floor(Math.random()*T.length)],n.style.left=`${t.toFixed(0)}px`,n.style.top=`${s.toFixed(0)}px`,n.style.fontSize=`${(r.size??12+Math.random()*10).toFixed(0)}px`,n.style.setProperty("--hx",`${((Math.random()-.5)*30).toFixed(0)}px`),e.appendChild(n),window.setTimeout(()=>n.remove(),1500)}function u(e,t){return Math.hypot(e.x-t.x,e.y-t.y)}function f(e,t){return e+Math.random()*(t-e)}function p(e,t,s){let i=null,r=s;for(const n of e){const l=u(n.pos,t);l<=r&&(r=l,i=n)}return i}function O(e){const t=e.reduce((i,r)=>i+r.weight,0);let s=Math.random()*t;for(const i of e)if(s-=i.weight,s<=0)return i;return e[e.length-1]}const L=[{name:"cream",fur:"#fff0d6",belly:"#fffaf1",ear:"#ffc2cf",line:"#cfa784",iris:"#f2a33a"},{name:"ginger",fur:"#ffbe6f",belly:"#ffeedb",ear:"#ffb0bd",line:"#c7843f",iris:"#5fb35a",tabby:!0},{name:"grey",fur:"#cdd3e6",belly:"#f1f3fb",ear:"#ffc4d2",line:"#8f98b8",iris:"#f0b232",tabby:!0},{name:"cocoa",fur:"#a57b6a",belly:"#ecd6c8",ear:"#ffb7c5",line:"#6b4a3c",iris:"#8fd3f4"},{name:"sakura",fur:"#ffd9e1",belly:"#fff5f7",ear:"#ff9fb6",line:"#d98fa2",iris:"#7fc2ff"},{name:"lilac",fur:"#dccbf5",belly:"#f6f0ff",ear:"#ffb9cc",line:"#a187cf",iris:"#ffa54a"}],se=.7,ie=.4,re=12,ne=70,oe=240,le=150,ae=700,ce=[{weight:1,speed:[130,200],wake:[.3,.8]},{weight:2,speed:[230,340],wake:[.1,.4]},{weight:1,speed:[400,520],wake:[0,.15]}];function he(){const e=O(ce),t=f(e.speed[0],e.speed[1]);return{speed:t,accel:t*5+300,wakeDelay:f(e.wake[0],e.wake[1])}}function fe(e){const t=-(Math.random()*5).toFixed(2),s=e.tabby?`<g fill="none" stroke="${e.line}" stroke-width="3" stroke-linecap="round" opacity=".7">
         <path d="M52 20 v9" /><path d="M60 17 v10" /><path d="M68 20 v9" />
       </g>`:"";return`
<svg viewBox="0 0 120 112" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <g class="tail">
    <path d="M38 92 C 14 94, 8 72, 22 62" fill="none" stroke="${e.line}" stroke-width="12" stroke-linecap="round" opacity=".35" />
    <path d="M38 92 C 14 94, 8 72, 22 62" fill="none" stroke="${e.fur}" stroke-width="9" stroke-linecap="round" />
    <circle cx="22" cy="62" r="5" fill="${e.line}" opacity=".5" />
  </g>
  <g class="legs">
    <ellipse class="leg leg-back" cx="44" cy="102" rx="9" ry="6.5" fill="${e.fur}" stroke="${e.line}" stroke-width="1.5" />
    <ellipse class="leg leg-front" cx="76" cy="102" rx="9" ry="6.5" fill="${e.fur}" stroke="${e.line}" stroke-width="1.5" />
  </g>
  <ellipse cx="60" cy="86" rx="27" ry="18" fill="${e.fur}" stroke="${e.line}" stroke-width="1.5" />
  <ellipse cx="60" cy="90" rx="15" ry="10" fill="${e.belly}" />
  <g class="head">
    <g class="ear ear-l">
      <path d="M30 34 L24 8 L52 22 Z" fill="${e.fur}" stroke="${e.line}" stroke-width="1.5" stroke-linejoin="round" />
      <path d="M32 30 L28 14 L46 23 Z" fill="${e.ear}" />
    </g>
    <g class="ear ear-r">
      <path d="M90 34 L96 8 L68 22 Z" fill="${e.fur}" stroke="${e.line}" stroke-width="1.5" stroke-linejoin="round" />
      <path d="M88 30 L92 14 L74 23 Z" fill="${e.ear}" />
    </g>
    <circle cx="60" cy="50" r="34" fill="${e.fur}" stroke="${e.line}" stroke-width="1.5" />
    ${s}
    <ellipse cx="34" cy="60" rx="8" ry="4.5" fill="#ff9fb8" opacity=".55" />
    <ellipse cx="86" cy="60" rx="8" ry="4.5" fill="#ff9fb8" opacity=".55" />
    <g class="eyes-open" style="animation-delay:${t}s">
      <ellipse cx="45" cy="52" rx="8" ry="10.5" fill="#2e1f33" />
      <ellipse cx="45" cy="54" rx="5.5" ry="7.5" fill="${e.iris}" />
      <ellipse cx="45" cy="57" rx="3" ry="3.5" fill="#2e1f33" />
      <circle cx="48.5" cy="47.5" r="3.2" fill="#fff" />
      <circle cx="42" cy="57" r="1.5" fill="#fff" opacity=".9" />
      <ellipse cx="75" cy="52" rx="8" ry="10.5" fill="#2e1f33" />
      <ellipse cx="75" cy="54" rx="5.5" ry="7.5" fill="${e.iris}" />
      <ellipse cx="75" cy="57" rx="3" ry="3.5" fill="#2e1f33" />
      <circle cx="78.5" cy="47.5" r="3.2" fill="#fff" />
      <circle cx="72" cy="57" r="1.5" fill="#fff" opacity=".9" />
    </g>
    <g class="eyes-happy" fill="none" stroke="#2e1f33" stroke-width="3.2" stroke-linecap="round">
      <path d="M37 54 q8 -10 16 0" />
      <path d="M67 54 q8 -10 16 0" />
    </g>
    <path d="M56.5 62 h7 l-3.5 4.5 z" fill="#ff8fa8" />
    <path d="M53 66 q3.5 4 7 0 q3.5 4 7 0" fill="none" stroke="#2e1f33" stroke-width="1.8" stroke-linecap="round" />
    <g stroke="${e.line}" stroke-width="1.4" stroke-linecap="round" opacity=".8">
      <path d="M22 60 h-12" /><path d="M23 66 l-11 3" />
      <path d="M98 60 h12" /><path d="M97 66 l11 3" />
    </g>
  </g>
</svg>`}class de extends H{constructor(s,i,r){const n=he();super(r,"cat",fe(s),i,n.speed,n.accel);o(this,"state","running");o(this,"wakeDelay");o(this,"stateT",0);o(this,"wakeT",0);o(this,"heartT",0);o(this,"offset",{x:0,y:0});o(this,"gladTimer");this.wakeDelay=n.wakeDelay,this.pickSpot()}update(s,i){this.stateT+=s;const r={x:i.cursor.x+this.offset.x,y:i.cursor.y+this.offset.y};switch(this.state){case"running":{const n=p(i.items,this.pos,oe);if(n){this.steer(n.pos.x,n.pos.y,s,!1);break}if(u(r,this.pos)<re){this.setState("tumbling");break}this.steer(r.x,r.y,s,!0);break}case"tumbling":this.coast(s,.002),this.stateT>=se&&this.setState("cuddling");break;case"cuddling":{this.heartT-=s,this.heartT<=0&&(d(this.stage,this.pos.x+(Math.random()-.5)*44,this.pos.y-18),this.heartT=.45+Math.random()*.7);const n=p(i.items,this.pos,le)!==null,l=u(r,this.pos)>ne;n||l?(this.wakeT+=s,(n||this.wakeT>=this.wakeDelay)&&this.setState("rising")):this.wakeT=0;break}case"rising":this.stateT>=ie&&this.setState("running");break}this.render()}cheer(){this.el.classList.add("is-glad"),window.clearTimeout(this.gladTimer),this.gladTimer=window.setTimeout(()=>this.el.classList.remove("is-glad"),ae);for(let s=0;s<3;s++)d(this.stage,this.pos.x+(Math.random()-.5)*48,this.pos.y-24)}setState(s){this.el.classList.remove(`is-${this.state}`),this.state=s,this.stateT=0,this.el.classList.add(`is-${s}`),s==="cuddling"&&(this.stop(),this.wakeT=0,this.heartT=.15),s==="rising"&&this.pickSpot()}pickSpot(){const s=Math.random()*Math.PI*2,i=26+Math.random()*40;this.offset={x:Math.cos(s)*i,y:Math.sin(s)*i*.8}}}const E=["fish","mouse","cookie"];function ue(){return E[Math.floor(Math.random()*E.length)]}function R(e){switch(e){case"fish":return`
<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M27 20 L37 11 L35 20 L37 29 Z" fill="#8cc9ff" stroke="#4f8fd1" stroke-width="1.5" stroke-linejoin="round" />
  <path d="M5 20 C 9 9, 24 7, 31 20 C 24 33, 9 31, 5 20 Z" fill="#8cc9ff" stroke="#4f8fd1" stroke-width="1.5" />
  <path d="M8 20 C 12 15, 22 15, 27 20" fill="none" stroke="#fff" stroke-width="2" opacity=".6" stroke-linecap="round" />
  <path d="M19 13 q4 7 0 14" fill="none" stroke="#4f8fd1" stroke-width="1.5" stroke-linecap="round" />
  <circle cx="12" cy="18" r="2.6" fill="#2e1f33" />
  <circle cx="13" cy="17" r="1" fill="#fff" />
</svg>`;case"mouse":return`
<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M30 23 q9 -3 6 9" fill="none" stroke="#8f98b8" stroke-width="2" stroke-linecap="round" />
  <path d="M6 24 C 6 15, 18 12, 26 16 C 33 19, 33 30, 24 32 L 10 32 C 6 32, 5 28, 6 24 Z" fill="#d6daea" stroke="#8f98b8" stroke-width="1.5" />
  <circle cx="14" cy="15" r="4.5" fill="#d6daea" stroke="#8f98b8" stroke-width="1.5" />
  <circle cx="14" cy="15" r="2.4" fill="#ffc4d2" />
  <circle cx="9" cy="23" r="1.7" fill="#2e1f33" />
  <circle cx="5.5" cy="26" r="1.8" fill="#ff8fa8" />
  <path d="M4 24 l-3 -1 M4 27 l-3 1" stroke="#8f98b8" stroke-width="1" stroke-linecap="round" />
</svg>`;case"cookie":return`
<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <circle cx="20" cy="20" r="14" fill="#f3c27b" stroke="#c98a3e" stroke-width="1.5" />
  <circle cx="20" cy="24" r="4.5" fill="#b9772f" opacity=".55" />
  <circle cx="12" cy="17" r="2.3" fill="#b9772f" opacity=".55" />
  <circle cx="17" cy="12.5" r="2.3" fill="#b9772f" opacity=".55" />
  <circle cx="23" cy="12.5" r="2.3" fill="#b9772f" opacity=".55" />
  <circle cx="28" cy="17" r="2.3" fill="#b9772f" opacity=".55" />
</svg>`}}class ge{constructor(t,s,i){o(this,"el");o(this,"pos");o(this,"kind");this.kind=s,this.pos={...i},this.el=document.createElement("div"),this.el.className=`item item-${s}`,this.el.style.transform=`translate3d(${i.x.toFixed(0)}px, ${i.y.toFixed(0)}px, 0)`,this.el.innerHTML=`<div class="bob">${R(s)}</div>`,t.appendChild(this.el)}vanish(){const t=this.el;t.classList.add("is-gone"),window.setTimeout(()=>t.remove(),400)}}const N=[{name:"shiba",fur:"#f0b26b",belly:"#fff3e0",ear:"#d9924f",line:"#b8732f",iris:"#5a3a25"},{name:"husky",fur:"#bcc3d3",belly:"#f3f5fa",ear:"#8e97ad",line:"#6f7891",iris:"#6fb4ff"},{name:"brown",fur:"#b98a63",belly:"#efdcc5",ear:"#8f6241",line:"#6b4a3c",iris:"#3f2a1e"}],pe=[{weight:1,speed:[170,240]},{weight:2,speed:[280,370]},{weight:1,speed:[420,500]}],ye=100,me=140;function xe(e){const t=-(Math.random()*5).toFixed(2);return`
<svg viewBox="0 0 120 112" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <g class="tail">
    <path d="M34 86 C 18 80, 20 58, 38 62" fill="none" stroke="${e.line}" stroke-width="12" stroke-linecap="round" opacity=".35" />
    <path d="M34 86 C 18 80, 20 58, 38 62" fill="none" stroke="${e.fur}" stroke-width="9" stroke-linecap="round" />
  </g>
  <g class="legs">
    <ellipse class="leg leg-back" cx="44" cy="102" rx="9.5" ry="6.5" fill="${e.fur}" stroke="${e.line}" stroke-width="1.5" />
    <ellipse class="leg leg-front" cx="76" cy="102" rx="9.5" ry="6.5" fill="${e.fur}" stroke="${e.line}" stroke-width="1.5" />
  </g>
  <ellipse cx="60" cy="86" rx="28" ry="18" fill="${e.fur}" stroke="${e.line}" stroke-width="1.5" />
  <ellipse cx="60" cy="90" rx="15" ry="10" fill="${e.belly}" />
  <g class="head">
    <g class="ear ear-l">
      <path d="M36 30 C 16 32, 10 66, 24 74 C 34 78, 42 62, 42 42 Z" fill="${e.ear}" stroke="${e.line}" stroke-width="1.5" stroke-linejoin="round" />
    </g>
    <g class="ear ear-r">
      <path d="M84 30 C 104 32, 110 66, 96 74 C 86 78, 78 62, 78 42 Z" fill="${e.ear}" stroke="${e.line}" stroke-width="1.5" stroke-linejoin="round" />
    </g>
    <circle cx="60" cy="50" r="33" fill="${e.fur}" stroke="${e.line}" stroke-width="1.5" />
    <ellipse cx="60" cy="67" rx="15" ry="11" fill="${e.belly}" />
    <ellipse cx="33" cy="58" rx="7" ry="4" fill="#ff9fb8" opacity=".5" />
    <ellipse cx="87" cy="58" rx="7" ry="4" fill="#ff9fb8" opacity=".5" />
    <g class="eyes-open" style="animation-delay:${t}s">
      <ellipse cx="44" cy="49" rx="7" ry="9" fill="#2e1f33" />
      <ellipse cx="44" cy="51" rx="4.8" ry="6.5" fill="${e.iris}" />
      <circle cx="47" cy="45" r="2.8" fill="#fff" />
      <circle cx="41.5" cy="54" r="1.3" fill="#fff" opacity=".9" />
      <ellipse cx="76" cy="49" rx="7" ry="9" fill="#2e1f33" />
      <ellipse cx="76" cy="51" rx="4.8" ry="6.5" fill="${e.iris}" />
      <circle cx="79" cy="45" r="2.8" fill="#fff" />
      <circle cx="73.5" cy="54" r="1.3" fill="#fff" opacity=".9" />
    </g>
    <g class="eyes-happy" fill="none" stroke="#2e1f33" stroke-width="3.2" stroke-linecap="round">
      <path d="M37 51 q7 -9 14 0" />
      <path d="M69 51 q7 -9 14 0" />
    </g>
    <ellipse cx="60" cy="62" rx="4.8" ry="3.6" fill="#2e1f33" />
    <circle cx="58.5" cy="61" r="1.2" fill="#fff" opacity=".8" />
    <path d="M60 65 v3 M54 68 q6 5 12 0" fill="none" stroke="#2e1f33" stroke-width="1.8" stroke-linecap="round" />
    <path d="M57.5 70 q2.5 8 5 0 z" fill="#ff8fa8" />
    <path d="M38 78 q22 12 44 0" fill="none" stroke="#e5536f" stroke-width="5" stroke-linecap="round" />
    <circle cx="60" cy="84" r="3.5" fill="#ffd166" stroke="#c99a2e" stroke-width="1" />
  </g>
</svg>`}class we extends H{constructor(s,i){const r=O(pe),n=f(r.speed[0],r.speed[1]),l=N[Math.floor(Math.random()*N.length)];super(s,"dog",xe(l),i,n,n*5+300);o(this,"state","hunting");o(this,"target",null);o(this,"exit",null);o(this,"announced",!1);o(this,"carry");this.carry=document.createElement("div"),this.carry.className="carry",this.rig.appendChild(this.carry)}get gone(){const s=ye;return this.state==="leaving"&&(this.pos.x<-s||this.pos.x>window.innerWidth+s||this.pos.y<-s||this.pos.y>window.innerHeight+s)}update(s,i){!this.announced&&this.onScreen()&&(this.announced=!0,d(this.stage,this.pos.x,this.pos.y-36,"гав!",{cls:"bark",size:15})),this.state==="hunting"&&((!this.target||!i.items.includes(this.target))&&(this.target=p(i.items,this.pos,1/0)),this.target?this.steer(this.target.pos.x,this.target.pos.y,s,!1):this.leave()),this.state==="leaving"&&this.exit&&this.steer(this.exit.x,this.exit.y,s,!1),this.render()}grab(s){this.carry.innerHTML=R(s),this.el.classList.add("is-glad"),this.leave()}leave(){if(this.state==="leaving")return;this.state="leaving",this.target=null;const s=window.innerWidth,i=window.innerHeight,r=me,n=[{x:this.pos.x,y:-r},{x:s+r,y:this.pos.y},{x:this.pos.x,y:i+r},{x:-r,y:this.pos.y}];this.exit=n.reduce((l,h)=>u(l,this.pos)<=u(h,this.pos)?l:h)}onScreen(){return this.pos.x>0&&this.pos.x<window.innerWidth&&this.pos.y>0&&this.pos.y<window.innerHeight}}const ke=5,I=5,ve=40,Me=6,be=6,$e=26,Ce=28;class Se{constructor(t,s){o(this,"phase","menu");o(this,"cats",[]);o(this,"dogs",[]);o(this,"items",[]);o(this,"cursor");o(this,"hungerLimit",7);o(this,"hunger",7);o(this,"stats",{treats:0,stolen:0,maxCats:0,time:0});o(this,"onGameOver");o(this,"stage");o(this,"keepClear");o(this,"world");o(this,"itemTimer",0);o(this,"dogQueue",[]);o(this,"paletteCursor",0);this.stage=t,this.keepClear=s,this.cursor={x:window.innerWidth/2,y:window.innerHeight/2},this.world={cursor:this.cursor,items:this.items}}showMenu(){this.phase="menu",this.clearField(),this.setCats(ke)}start(t){this.phase="playing",this.hungerLimit=t,this.hunger=t,this.stats={treats:0,stolen:0,maxCats:I,time:0},this.clearField(),this.setCats(I),this.itemTimer=f(1,2)}update(t){const s=this.phase==="playing";s&&this.spawnThings(t);for(const i of this.cats)i.update(t,this.world);for(let i=this.dogs.length-1;i>=0;i--){const r=this.dogs[i];r.update(t,this.world),r.gone&&(r.removeNow(),this.dogs.splice(i,1))}s&&(this.resolvePickups(),this.stats.time+=t,this.starve(t))}spawnThings(t){if(this.itemTimer-=t,this.itemTimer<=0&&(this.itemTimer=f(2.5,4.5),this.items.length<Me)){const s=this.randomItemSpot();s&&(this.items.push(new ge(this.stage,ue(),s)),this.dogQueue.push(f(.8,2.2)))}for(let s=this.dogQueue.length-1;s>=0;s--)this.dogQueue[s]-=t,!(this.dogQueue[s]>0)&&(this.dogQueue.splice(s,1),this.items.length>0&&this.dogs.length<be&&this.dogs.push(new we(this.stage,F())))}resolvePickups(){const t=this.dogs.filter(s=>s.state==="hunting");for(const s of[...this.items]){const i=p(this.cats,s.pos,$e);if(i){this.removeItem(s),this.stats.treats++,this.hunger=this.hungerLimit,i.cheer(),this.cats.length<ve?(this.addCat(),d(this.stage,s.pos.x,s.pos.y-10,"+1 котик",{cls:"score-cat",size:16})):d(this.stage,s.pos.x,s.pos.y-10,"+1",{cls:"score-cat",size:17});continue}const r=p(t,s.pos,Ce);r&&(this.removeItem(s),this.stats.stolen++,r.grab(s.kind),d(this.stage,s.pos.x,s.pos.y-10,"утащила!",{cls:"score-dog",size:15}))}}starve(t){this.hunger-=t,!(this.hunger>0)&&(this.hunger=this.hungerLimit,this.loseCat(),this.cats.length===0&&this.endGame())}loseCat(){const t=Math.floor(Math.random()*this.cats.length),[s]=this.cats.splice(t,1);d(this.stage,s.pos.x,s.pos.y-34,"мяу…",{cls:"sad",size:14}),s.dispose()}endGame(){var t;this.phase="over",this.clearField(),(t=this.onGameOver)==null||t.call(this,this.stats)}addCat(){const t=L[this.paletteCursor++%L.length];this.cats.push(new de(t,F(),this.stage)),this.stats.maxCats=Math.max(this.stats.maxCats,this.cats.length)}setCats(t){for(;this.cats.length<t;)this.addCat();for(;this.cats.length>t;)this.cats.pop().dispose()}removeItem(t){const s=this.items.indexOf(t);s>=0&&this.items.splice(s,1),t.vanish()}clearField(){for(const t of this.items)t.vanish();this.items.length=0;for(const t of this.dogs)t.dispose();this.dogs.length=0,this.dogQueue=[]}randomItemSpot(){const t=this.keepClear.getBoundingClientRect(),s=60,i=window.innerWidth,r=window.innerHeight;for(let n=0;n<12;n++){const l={x:f(s,i-s),y:f(s,r-s)};if(!(l.x<t.right+40&&l.y<t.bottom+40)&&!this.cats.some(h=>u(h.pos,l)<90)&&!this.items.some(h=>u(h.pos,l)<70))return l}return null}}function F(){const e=window.innerWidth,t=window.innerHeight;switch(Math.floor(Math.random()*4)){case 0:return{x:Math.random()*e,y:-60};case 1:return{x:e+60,y:Math.random()*t};case 2:return{x:Math.random()*e,y:t+60};default:return{x:-60,y:Math.random()*t}}}const Te=3,Le=20,Z=7,z="cat-chase:hunger",M="cat-chase:best",a=e=>document.querySelector(e),Ee=a("#stage"),Ne=a("#yarn"),y=a("#hud"),B=a("#menu"),b=a("#gameover"),g=a("#hunger"),Ie=a("#cats-count"),Fe=a("#score"),Ae=a("#hunger-sec"),A=a("#hunger-fill"),_=a("#best"),c=new Se(Ee,y);let K=0;function U(){Ne.style.transform=`translate(${c.cursor.x}px, ${c.cursor.y}px) rotate(${K.toFixed(0)}deg)`}function X(e){K+=(e.clientX-c.cursor.x)*.6,c.cursor.x=e.clientX,c.cursor.y=e.clientY,U()}window.addEventListener("pointermove",X,{passive:!0});window.addEventListener("pointerdown",X,{passive:!0});function $(e){try{const t=Number(localStorage.getItem(e));return Number.isFinite(t)&&localStorage.getItem(e)!==null?t:null}catch{return null}}function Q(e,t){try{localStorage.setItem(e,String(t))}catch{}}function W(e){return Number.isFinite(e)?Math.min(Le,Math.max(Te,Math.round(e))):Z}function m(e){const t=W(e);g.value=String(t),Q(z,t)}a("#hunger-minus").addEventListener("click",()=>m(Number(g.value)-1));a("#hunger-plus").addEventListener("click",()=>m(Number(g.value)+1));g.addEventListener("change",()=>m(Number(g.value)));function _e(){const e=$(M);_.hidden=e===null||e<=0,e!==null&&(_.textContent=`Рекорд: ${e} ${Ge(e,"угощение","угощения","угощений")}`)}function Ge(e,t,s,i){const r=e%10,n=e%100;return r===1&&n!==11?t:r>=2&&r<=4&&(n<12||n>14)?s:i}function j(){B.hidden=!0,b.hidden=!0,y.hidden=!1,c.start(W(Number(g.value))),Y(!0)}function C(){b.hidden=!0,y.hidden=!0,_e(),B.hidden=!1,c.showMenu()}function Pe(e){const t=$(M)??0;e.treats>t&&Q(M,e.treats),a("#r-treats").textContent=String(e.treats),a("#r-stolen").textContent=String(e.stolen),a("#r-max").textContent=String(e.maxCats),a("#r-time").textContent=`${Math.round(e.time)} с`,a("#r-best").hidden=e.treats<=t||e.treats===0,y.hidden=!0,b.hidden=!1}c.onGameOver=Pe;a("#start").addEventListener("click",j);a("#again").addEventListener("click",j);a("#to-menu").addEventListener("click",C);a("#quit").addEventListener("click",C);let G=-1,P="",D="";function Y(e=!1){const t=c.cats.length;(e||t!==G)&&(G=t,Ie.textContent=String(t));const s=`котики ${c.stats.treats} · собачки ${c.stats.stolen}`;(e||s!==P)&&(P=s,Fe.textContent=s);const i=`${Math.max(0,c.hunger).toFixed(1)} с`;(e||i!==D)&&(D=i,Ae.textContent=i);const r=Math.max(0,Math.min(1,c.hunger/c.hungerLimit));A.style.transform=`scaleX(${r.toFixed(3)})`,A.classList.toggle("is-low",c.hunger<2.5)}let q=performance.now();function J(e){const t=Math.min(.05,(e-q)/1e3);q=e,c.update(t),c.phase==="playing"&&Y(),requestAnimationFrame(J)}m($(z)??Z);U();C();requestAnimationFrame(J);
