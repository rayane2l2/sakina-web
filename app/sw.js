import {createOfflineStore} from './js/offline-cache.js';
const CACHE='sakina-recite-v39';
const CORE=['./','index.html','style.css','theme.css','manifest.webmanifest','js/app.js','js/offline-cache.js','js/tajweed.js','js/matn-plan.js','js/quran-audio-sync.js','js/review-continuation.js','js/quran-reading.js','js/quran-book-phonetics.js','js/phonetic-view.js','js/transliteration.js','data/transliterations-book-v2.json','data/matn-phonetics.json','assets/ayah-ring.svg','js/review-flow.js','js/matn-reading.js','js/reminders-core.js','js/reminders-service.js','js/reminders-view.js','vendor/capacitor-core.mjs','books.css','js/programme-ux.js','js/session-memory.js','js/quran-page-gesture.js','js/program-selection.js','js/navigation.js','js/daily-session.js','js/book-practice.js','js/book-content.js','js/books-core.js','js/books-ui.js','js/books-store.js','vendor/ts-fsrs-5.2.3.mjs','data/books/catalog.json','data/books/rejouissance-fr/edition.json','data/books/but-etudiants-fr/edition.json','js/brand.js','js/prior-learning.js','js/data.js','js/matn-corpus.js','js/storage.js','js/alignment.js','js/alignment-client.js','js/alignment-worker.js','js/reading-position.js','js/word-display.js','js/audio.js','js/playback-speed.js','js/recognition.js','js/model-choice.js','js/microphone-worklet.js','js/asr-worker.js','js/memo-core.js','js/macro-plan.js','js/page-core.js','js/mushaf-view.js','js/mushaf-learning.js','js/sounds.js','js/recitation-feedback.js','js/lesson-core.js','js/reader-view.js','js/learning-view.js','js/listen-flow.js','js/speed-control.js','data/page-index.json','data/tajweed.json','vendor/qvp.js','vendor/qvp_ffi.wasm','data/quran.json','data/ibn-ashir.json','data/mukhtasar-al-harari.json','data/phonemes.json','assets/book.png','assets/sakina-mark.svg','assets/wordmark.png','assets/nunito.woff2','assets/arabic.woff2','assets/icon-192.png','assets/icon-512.png','offline-files.json','offline-manifest.json'];
const BASE=new URL('./',self.location.href);
let storePromise;
async function store(){
 if(!storePromise)storePromise=(async()=>{const cache=await caches.open(CACHE);const response=await cache.match(new URL('offline-manifest.json',BASE).href);if(!response)throw Error('Inventaire hors connexion indisponible.');return createOfflineStore({manifest:await response.json(),baseURL:BASE.href,shellCache:CACHE});})().catch(error=>{storePromise=null;throw error;});
 return storePromise;
}
async function install(){
 const shell=await caches.open(CACHE);
 const isAsset=file=>file.startsWith('data/')||/\.(wasm|woff2)$/.test(file);
 await shell.addAll(CORE.filter(file=>!isAsset(file)).map(url=>new Request(new URL(url,BASE),{cache:'reload'})));
 const persistent=await store();
 for(const file of CORE.filter(isAsset))await persistent.ensure(file);
 await self.skipWaiting();
}
self.addEventListener('install',event=>event.waitUntil(install()));
// Preserve legacy caches until the offline store has migrated their matching files.
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin)return;
 if(request.headers?.get('X-Sakina-Offline-Fetch')==='1'){event.respondWith(fetch(request));return;}
 event.respondWith((async()=>{
  const relative=decodeURIComponent(url.pathname.slice(BASE.pathname.length))||'./';
  const shell=await caches.open(CACHE);
  const code=/\.(js|css|html)$/.test(url.pathname)||request.mode==='navigate'||/\/offline-(?:files|manifest)\.json$/.test(url.pathname)||/\/data\/books\/(?:catalog\.json|[^/]+\/edition\.json)$/.test(url.pathname);
  if(code){
   try{const response=await fetch(request,{cache:'no-cache'});if(response.ok&&response.status!==206)await shell.put(request,response.clone());return response;}
   catch{
    const current=await shell.match(request);if(current)return current;
    try{const retained=await (await store()).ensure(relative,{allowNetwork:false});if(retained)return retained.response;}catch{}
    return request.mode==='navigate'?(await shell.match(new URL('index.html',BASE).href)||Response.error()):Response.error();
   }
  }
  let manifest;
  try{const inventory=await shell.match(new URL('offline-manifest.json',BASE).href);manifest=inventory?await inventory.json():null;}catch{}
  if(manifest?.files?.[relative]){
   try{return audioRange(request,(await (await store()).ensure(relative)).response);}catch{return Response.error();}
  }
  const hit=await shell.match(request,{ignoreSearch:/\.mp3$/.test(url.pathname)});
  if(hit)return audioRange(request,hit);
  try{const response=await fetch(request);if(response.ok&&response.status!==206)await shell.put(request,response.clone());return response;}catch{return Response.error();}
 })());
});

// Native audio elements request byte ranges. Never Cache.put a partial 206 body.
async function audioRange(request,response){
 const range=request.headers?.get('range');if(!range||response.status!==200||!new URL(request.url).pathname.endsWith('.mp3'))return response;
 const match=/^bytes=(\d*)-(\d*)$/.exec(range);if(!match||(!match[1]&&!match[2]))return response;
 const buffer=await response.arrayBuffer(),length=buffer.byteLength;
 const from=match[1]?Number(match[1]):Math.max(0,length-Number(match[2])),to=match[1]?(match[2]?Math.min(length-1,Number(match[2])):length-1):length-1;
 if(from>=length||from>to)return new Response(null,{status:416,headers:{'Content-Range':`bytes */${length}`}});
 return new Response(buffer.slice(from,to+1),{status:206,headers:{'Content-Type':response.headers.get('Content-Type')||'audio/mpeg','Content-Length':String(to-from+1),'Content-Range':`bytes ${from}-${to}/${length}`,'Accept-Ranges':'bytes'}});
}
