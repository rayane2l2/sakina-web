// Sends about 100 ms of audio per message, whatever the context's sample rate.
class Capture extends AudioWorkletProcessor {
 constructor(){
  super();this.size=Math.max(1024,Math.round(sampleRate/10));this.buffer=new Float32Array(this.size);this.offset=0;this.stopped=false;
  this.port.onmessage=({data})=>{
   if(data.type!=='flush')return;
   this.stopped=true;
   if(this.offset){this.port.postMessage({samples:this.buffer.slice(0,this.offset),rate:sampleRate});this.offset=0;}
   this.port.postMessage({flushed:true});
  };
 }
 process(inputs){
  if(this.stopped)return true;
  const input=inputs[0]?.[0];if(!input)return true;
  for(const value of input){this.buffer[this.offset++]=value;if(this.offset===this.buffer.length){this.port.postMessage({samples:this.buffer,rate:sampleRate});this.buffer=new Float32Array(this.size);this.offset=0;}}
  return true;
 }
}
registerProcessor('sakina-capture',Capture);
