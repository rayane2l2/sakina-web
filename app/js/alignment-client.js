// One running comparison and one latest snapshot: no growing UI backlog.
// Reset invalidates callbacks from previous passages without restarting WASM.
export class AlignmentClient{
 constructor(factory=()=>new Worker(new URL('./alignment-worker.js',import.meta.url),{type:'module'})){this.factory=factory;this.nextId=0;this.reset();}
 reset(){this.nextId++;this.latest=null;this.queued=null;}
 compare(data,callback,onError=()=>{}){
  if(!this.worker){this.worker=this.factory();this.worker.onmessage=({data:r})=>this.receive(r);this.worker.onerror=e=>{const job=this.latest;this.worker.terminate();this.worker=null;this.busy=false;this.reset();job?.onError(e.message||'Comparaison indisponible');};}
  const job={...data,id:++this.nextId,callback,onError};this.latest=job;
  if(this.busy)this.queued=job;else this.send(job);
 }
 send(job){this.busy=true;const {callback,onError,...data}=job;this.worker.postMessage(data);}
 receive(reply){
  this.busy=false;
  if(reply.id===this.latest?.id){if(reply.error)this.latest.onError(reply.error);else this.latest.callback(reply.result);}
  if(this.queued){const job=this.queued;this.queued=null;this.send(job);}
 }
}
