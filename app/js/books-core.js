import {fsrs,createEmptyCard,generatorParameters,State,FSRSVersion,StrategyMode,GenSeedStrategyWithCardId} from '../vendor/ts-fsrs-5.2.3.mjs';
export const ALGORITHM=Object.freeze({library:'ts-fsrs',version:'5.2.3',model:'FSRS-6',runtime:FSRSVersion});
export const emptyStudy=()=>({schema:1,programs:[],cards:{},logs:[],retention:.9});
const dayKey=date=>{const d=new Date(date);return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;};
export const cardKey=(edition,id)=>`${edition}/${id}`;
export function selectQuestions(edition,{mode='all',chapters=[],ranges=[],ids=[]}={}){
 const chosen=edition.questions.filter(q=>mode==='all'||mode==='chapters'&&(chapters.includes(q.chapterId)||(q.chapterIds||[]).some(id=>chapters.includes(id)))||mode==='ranges'&&ranges.some(r=>q.number>=Number(r.from)&&q.number<=Number(r.to))||mode==='individual'&&ids.includes(q.id));
 if(!chosen.length)throw Error('Choisis au moins une question présente dans le livre.');
 return chosen.map(q=>q.id);
}
export function createBookProgram(edition,{id,name,selection,newPerDay=5}={}){
 if(!Number.isInteger(Number(newPerDay))||Number(newPerDay)<0||Number(newPerDay)>1000)throw Error('Choisis entre 0 et 1 000 nouvelles questions par jour.');
 return {id:id||crypto.randomUUID(),editionId:edition.id,name:String(name||edition.title).trim().slice(0,80),questionIds:selectQuestions(edition,selection),newPerDay:Number(newPerDay),selection:selection||{mode:'all'}};
}
export function bookPlan(study,program,edition,now=new Date()){
 const valid=new Set(edition.questions.map(q=>q.id)),ids=program.questionIds.filter(id=>valid.has(id)),allowed=new Set(ids.map(id=>cardKey(edition.id,id)));
 const introduced=new Set(study.logs.filter(l=>allowed.has(l.key)&&l.log.state===State.New&&dayKey(l.log.review)===dayKey(now)).map(l=>l.key));
 const due=ids.filter(id=>study.cards[cardKey(edition.id,id)]&&new Date(study.cards[cardKey(edition.id,id)].due)<=now).sort((a,b)=>new Date(study.cards[cardKey(edition.id,a)].due)-new Date(study.cards[cardKey(edition.id,b)].due));
 const fresh=ids.filter(id=>!study.cards[cardKey(edition.id,id)]).slice(0,Math.max(0,program.newPerDay-introduced.size));
 const future=ids.map(id=>study.cards[cardKey(edition.id,id)]?.due).filter(Boolean).map(x=>new Date(x)).filter(d=>d>now).sort((a,b)=>a-b);
 return {due,fresh,next:due[0]||fresh[0]||null,nextDue:future[0]?.toISOString()||null,total:ids.length,started:ids.filter(id=>study.cards[cardKey(edition.id,id)]).length};
}
const revive=card=>({...card,due:new Date(card.due),...(card.last_review?{last_review:new Date(card.last_review)}:{})});
const serial=value=>JSON.parse(JSON.stringify(value));
export function previewGrades(study,editionId,questionId,now=new Date()){
 const key=cardKey(editionId,questionId),existing=study.cards[key],card={...(existing?revive(existing):createEmptyCard(now)),card_id:key};
 const retention=Number(study.retention)||.9;if(retention<.7||retention>.99)throw Error('Rétention souhaitée invalide.');
 const engine=fsrs(generatorParameters({request_retention:retention,enable_fuzz:true,learning_steps:['1m','10m'],relearning_steps:['10m'],maximum_interval:36500})).useStrategy(StrategyMode.SEED,GenSeedStrategyWithCardId('card_id'));
 return {key,baseReps:existing?.reps||0,createdAt:now.toISOString(),algorithm:ALGORITHM,options:serial(engine.repeat(card,now))};
}
export function applyGrade(study,preview,rating){
 if(![1,2,3,4].includes(Number(rating))||!preview.options[rating])throw Error('Évaluation inconnue.');
 if((study.cards[preview.key]?.reps||0)!==preview.baseReps)throw Error('Cette carte a déjà été évaluée.');
 const selected=preview.options[rating];
 return {...study,cards:{...study.cards,[preview.key]:selected.card},logs:[...study.logs,{key:preview.key,algorithm:ALGORITHM,log:selected.log,card:selected.card}]};
}
export function intervalLabel(due,now=new Date()){
 const seconds=Math.max(0,(new Date(due)-now)/1000);if(seconds<60)return '< 1 min';
 if(seconds<3600)return `${Math.round(seconds/60)} min`;
 if(seconds<86400)return `${Math.round(seconds/3600)} h`;
 const days=Math.round(seconds/86400);if(days<31)return `${days} ${days===1?'jour':'jours'}`;
 if(days<365)return `${Math.round(days/30)} mois`;const years=Math.round(days/365);return `${years} ${years===1?'an':'ans'}`;
}
export function validateBookStudy(s){
 if(!s||s.schema!==1||!Array.isArray(s.programs)||!s.cards||Array.isArray(s.cards)||typeof s.cards!=='object'||!Array.isArray(s.logs))throw Error('Sauvegarde des livres invalide.');
 if(s.retention!==undefined&&(!Number.isFinite(s.retention)||s.retention<.7||s.retention>.99))throw Error('Rétention souhaitée invalide.');
 for(const p of s.programs)if(typeof p.id!=='string'||typeof p.editionId!=='string'||typeof p.name!=='string'||!Array.isArray(p.questionIds)||!p.questionIds.every(id=>typeof id==='string')||!Number.isInteger(p.newPerDay)||p.newPerDay<0||p.newPerDay>1000)throw Error('Programme de livre invalide.');
 for(const card of Object.values(s.cards))if(!card||!Number.isFinite(Date.parse(card.due))||![0,1,2,3].includes(card.state)||!Number.isInteger(card.reps)||card.reps<0||!Number.isFinite(card.stability)||card.stability<0||!Number.isFinite(card.difficulty))throw Error('État FSRS invalide.');
 for(const entry of s.logs)if(typeof entry.key!=='string'||!entry.log||!Number.isFinite(Date.parse(entry.log.review))||![1,2,3,4].includes(entry.log.rating))throw Error('Historique FSRS invalide.');
 return s;
}
