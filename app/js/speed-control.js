import {PLAYBACK_SPEEDS,normalizeSpeed,speedLabel} from './playback-speed.js';
const closeIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17"/></svg>';
export const shiftRate=(rate,steps)=>normalizeSpeed(Math.max(.5,Math.min(2,Math.round((normalizeSpeed(rate)+steps*.1)*10)/10)));
export const rulerRate=(rate,pixels)=>shiftRate(rate,-Math.round(pixels/22));
export function speedDialog(m,b){
 const rate=normalizeSpeed(m.playbackRate),index=PLAYBACK_SPEEDS.indexOf(rate);
 return `<dialog id="speed-menu" class="speed-menu modern-speed" aria-label="Vitesse audio"><header class="speed-heading"><span>Vitesse</span>${b(closeIcon,'close-speed','speed-dismiss','aria-label="Fermer la vitesse"')}</header><div class="speed-readout"><output id="playback-speed-value" for="playback-speed">${speedLabel(rate)}</output></div><div class="speed-ruler" style="--speed-index:${index}"><div class="selection-lens"></div><div class="ruler-strip" aria-hidden="true">${PLAYBACK_SPEEDS.map((value,i)=>`<span class="ruler-tick ${i%5===0?'major':''} ${i===index?'active':''}"><i></i><small>${i%5===0?speedLabel(value):''}</small></span>`).join('')}</div><div class="ruler-needle" aria-hidden="true"></div><input id="playback-speed" type="range" min="0" max="15" step="1" value="${index}" aria-label="Vitesse audio" aria-valuetext="${speedLabel(rate)}"></div><div class="speed-adjustments">${b('−','speed-down','speed-nudge','aria-label="Ralentir de 0,1"')}${b('1× <span>Normal</span>','speed-reset','normal-speed')}${b('+','speed-up','speed-nudge','aria-label="Accélérer de 0,1"')}</div></dialog>`;
}
export const speedTrigger=(m,b)=>b(`<span id="speed-trigger-value">${speedLabel(m.playbackRate)}</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5"/></svg>`,'open-speed','speed-trigger','aria-label="Régler la vitesse audio" aria-haspopup="dialog"');
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
export function openSpeed(){
 const dialog=document.querySelector('#speed-menu');if(!dialog)return;
 const trigger=document.querySelector('[data-action="open-speed"]');
 const bottom=trigger?Math.max(12,innerHeight-trigger.getBoundingClientRect().top+9):20;
 dialog.style.setProperty('--speed-bottom',Math.min(bottom,Math.max(12,innerHeight-280))+'px');
 if(!dialog.open)dialog.showModal();
}
export function bindSpeedControls(root,{getRate,onRate}){
 let closing=false,drag=null;
 const sync=rate=>{
  const index=PLAYBACK_SPEEDS.indexOf(rate),range=root.querySelector('#playback-speed'),ruler=root.querySelector('.speed-ruler');
  if(range){range.value=index;range.setAttribute('aria-valuetext',speedLabel(rate));}
  ruler?.style.setProperty('--speed-index',index);
  root.querySelectorAll('.ruler-tick').forEach((tick,i)=>tick.classList.toggle('active',i===index));
  const output=root.querySelector('#playback-speed-value');if(output){output.textContent=speedLabel(rate);if(!reduced())output.animate([{opacity:.7,transform:'translateY(2px)'},{opacity:1,transform:'none'}],{duration:140,easing:'ease-out'});}
  const trigger=root.querySelector('#speed-trigger-value');if(trigger)trigger.textContent=speedLabel(rate);
 };
 const apply=value=>{const rate=normalizeSpeed(value);if(rate!==getRate())onRate(rate);sync(rate);};
 const close=()=>{
  const dialog=root.querySelector('#speed-menu');if(!dialog?.open||closing)return;
  closing=true;
  const done=()=>{root.querySelector('#speed-menu')?.close();dialog.classList.remove('closing');closing=false;root.querySelector('[data-action="open-speed"]')?.focus({preventScroll:true});};
  if(reduced()){done();return;}dialog.classList.add('closing');setTimeout(done,130);
 };
 root.addEventListener('click',e=>{
  const button=e.target.closest('[data-action]'),action=button?.dataset.action;
  if(!['open-speed','close-speed','speed-up','speed-down','speed-reset'].includes(action))return;
  e.stopImmediatePropagation();e.preventDefault();
  if(action==='open-speed'){openSpeed();return;}if(action==='close-speed'){close();return;}
  apply(action==='speed-reset'?1:shiftRate(getRate(),action==='speed-up'?1:-1));
 },true);
 root.addEventListener('input',e=>{if(e.target.id==='playback-speed'){e.stopImmediatePropagation();apply(PLAYBACK_SPEEDS[Number(e.target.value)]);}},true);
 root.addEventListener('cancel',e=>{if(e.target.id==='speed-menu'){e.preventDefault();close();}},true);
 root.addEventListener('click',e=>{if(e.target.id==='speed-menu'){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();}});
 root.addEventListener('pointerdown',e=>{
  if(e.target.id!=='playback-speed')return;e.preventDefault();e.target.focus({preventScroll:true});e.target.setPointerCapture(e.pointerId);
  drag={x:e.clientX,rate:getRate(),input:e.target};e.target.closest('.modern-speed').classList.add('dragging');
 });
 window.addEventListener('pointermove',e=>{if(drag?.input.isConnected)apply(rulerRate(drag.rate,e.clientX-drag.x));});
 const release=e=>{
  if(!drag)return;
  if(e.type==='pointerup'&&drag.input.isConnected&&Math.abs(e.clientX-drag.x)<4){const r=drag.input.getBoundingClientRect();apply(shiftRate(drag.rate,Math.round((e.clientX-r.left-r.width/2)/22)));}
  drag=null;root.querySelector('.modern-speed')?.classList.remove('dragging');
 };
 window.addEventListener('pointerup',release);window.addEventListener('pointercancel',release);
}
