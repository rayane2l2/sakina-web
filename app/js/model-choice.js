export const MODELS=Object.freeze([{id:'v3',label:'Quran Lab v3 · original'},{id:'v3.1',label:'Quran Lab v3.1 · madd'}]);
export const normalizeModel=value=>MODELS.some(m=>m.id===value)?value:'v3';
export const modelLabel=value=>MODELS.find(m=>m.id===normalizeModel(value)).label;
export function modelPicker(value){return `<label>Modèle vocal<select id="recognition-model">${MODELS.map(m=>`<option value="${m.id}" ${m.id===normalizeModel(value)?'selected':''}>${m.label}</option>`).join('')}</select></label>`;}
