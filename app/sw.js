const CACHE='sakina-recite-v27';
const CORE=['./','index.html','style.css','theme.css','manifest.webmanifest','js/app.js','js/reminders-core.js','js/reminders-service.js','js/reminders-view.js','vendor/capacitor-core.mjs','books.css','js/programme-ux.js','js/session-memory.js','js/quran-page-gesture.js','js/program-selection.js','js/navigation.js','js/daily-session.js','js/book-practice.js','js/book-content.js','js/books-core.js','js/books-ui.js','js/books-store.js','vendor/ts-fsrs-5.2.3.mjs','data/books/catalog.json','data/books/rejouissance-fr/edition.json','js/brand.js','js/prior-learning.js','js/data.js','js/matn-corpus.js','js/storage.js','js/alignment.js','js/alignment-client.js','js/alignment-worker.js','js/reading-position.js','js/word-display.js','js/audio.js','js/playback-speed.js','js/recognition.js','js/model-choice.js','js/microphone-worklet.js','js/asr-worker.js','js/memo-core.js','js/macro-plan.js','js/page-core.js','js/mushaf-view.js','js/mushaf-learning.js','js/sounds.js','js/recitation-feedback.js','js/lesson-core.js','js/reader-view.js','js/learning-view.js','js/listen-flow.js','js/speed-control.js','data/page-index.json','vendor/qvp.js','vendor/qvp_ffi.wasm','data/quran.json','data/ibn-ashir.json','data/mukhtasar-al-harari.json','data/phonemes.json','assets/book.png','assets/sakina-mark.svg','assets/wordmark.png','assets/nunito.woff2','assets/arabic.woff2','assets/icon-192.png','assets/icon-512.png','offline-files.json'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE.map(url=>new Request(url,{cache:'reload'})))).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('sakina-recite-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;
 if(/\.(js|css|html)$/.test(new URL(event.request.url).pathname)||new URL(event.request.url).pathname.endsWith('/offline-files.json')||event.request.mode==='navigate'||/\/data\/books\/(?:catalog\.json|[^/]+\/edition\.json)$/.test(new URL(event.request.url).pathname)){
  event.respondWith(fetch(event.request,{cache:'no-cache'}).then(async response=>{if(response.ok&&response.status!==206){const cache=await caches.open(CACHE);await cache.put(event.request,response.clone());}return response;}).catch(()=>caches.open(CACHE).then(cache=>cache.match(event.request)).then(hit=>hit||caches.open(CACHE).then(cache=>cache.match('index.html')))));return;
 }
 event.respondWith(caches.open(CACHE).then(cache=>cache.match(event.request,{ignoreSearch:/\.mp3$/.test(new URL(event.request.url).pathname)})).then(hit=>hit?audioRange(event.request,hit):fetch(event.request).then(async response=>{
  if(response.ok&&response.status!==206){const cache=await caches.open(CACHE);await cache.put(event.request,response.clone());}return response;
 }).catch(()=>event.request.mode==='navigate'?caches.open(CACHE).then(cache=>cache.match('index.html')):Response.error())));
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
