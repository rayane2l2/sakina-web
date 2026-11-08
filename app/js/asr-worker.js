/* Local inference worker. The official ReciteQuran sherpa runtime is unmodified. */

let ready, recognizer, stream, generation=0;

var Module = {

 locateFile: name => new URL('../vendor/'+name,self.location.href).href,

 print: () => {}, printErr: text => console.warn(text),

 onRuntimeInitialized: () => ready?.(),

 onAbort: text => postMessage({type:'error',message:'Moteur local interrompu : '+text})

};

let initialized;

async function init(modelId='v3') {

 if(initialized)return initialized;

 initialized=(async()=>{

  const runtime=new Promise(resolve=>{ready=resolve;});

  importScripts('../vendor/sherpa-onnx-asr.js','../vendor/sherpa-onnx-wasm-main-asr.js');

  await runtime;

  const base=modelId==='v3.1'?'../models/v3.1/':'../models/';
  const manifestResponse=await fetch(new URL(base+'manifest.json',self.location.href));

  if(!manifestResponse.ok)throw Error('Modèle indisponible');

  const manifest=await manifestResponse.json(),model=new Uint8Array(manifest.size);let offset=0;

  for(const part of manifest.parts){

   const response=await fetch(new URL(base+part.file,self.location.href));

   if(!response.ok)throw Error('Une partie du modèle est manquante');

   const chunk=new Uint8Array(await response.arrayBuffer());

   if(chunk.length!==part.size)throw Error('Modèle incomplet');model.set(chunk,offset);offset+=chunk.length;

  }

  Module.FS_createDataFile('/','zipformer.onnx',model,true,true,true);

  const tokens=await fetch(new URL('../models/tokens.txt',self.location.href));

  if(!tokens.ok)throw Error('Table des sons indisponible');

  Module.FS_createDataFile('/','quran_tokens.txt',new Uint8Array(await tokens.arrayBuffer()),true,true,true);

  Module.modelPath='/zipformer.onnx';recognizer=createOnlineRecognizer(Module);

  if(!recognizer.handle)throw Error('Le modèle phonétique n’a pas pu être chargé');

  Module.FS_unlink('/zipformer.onnx');postMessage({type:'ready'});

 })().catch(e=>{initialized=null;throw e;});

 return initialized;

}

function result(final=false){const r=recognizer.getResult(stream);postMessage({type:'result',...r,final,id:generation});}

self.onmessage=async({data})=>{

 try{

  if(data.type==='init'){await init(data.model);return;}

  if(data.type==='reset'){

   await init();generation=data.id;stream?.free();stream=recognizer.createStream();

   stream.acceptWaveform(16000,new Float32Array(4800));return;

  }

  if(data.type==='cancel'){generation=data.id;stream?.free();stream=null;return;}

  if(data.type==='audio'&&stream&&data.id===generation){

   stream.acceptWaveform(data.rate,new Float32Array(data.samples));

   while(recognizer.isReady(stream))recognizer.decode(stream);

   result();

  }

  if(data.type==='finish'&&stream&&data.id===generation){

   stream.acceptWaveform(16000,new Float32Array(16000));stream.inputFinished();

   while(recognizer.isReady(stream))recognizer.decode(stream);

   result(true);stream.free();stream=null;

  }

 }catch(e){postMessage({type:'error',message:e.message||String(e)});}

};

