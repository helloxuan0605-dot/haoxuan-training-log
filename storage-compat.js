'use strict';
// The verified historical container is records. Other named containers are
// conservative recovery adapters, not a claim that those schemas were shipped.
const WORKOUT_ROOTS=['records','history','workouts','sessions','currentWorkout','recoveryLegacyRecords'];
const normalizedCache=new Map();
const isObject=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const missingValue=v=>v===null||v===undefined||v==='';
const cloneData=v=>v===undefined?undefined:JSON.parse(JSON.stringify(v));
function readableRoot(data){return isObject(data)&&(data.version===undefined||data.version===1)&&['sleep','dailyStatusByDate'].every(k=>data[k]===undefined||isObject(data[k]))}
function storageSnapshot(){try{const raw=localStorage.getItem(KEY);if(raw===null)return {exists:false,raw:null,data:null,error:''};try{const data=JSON.parse(raw);return {exists:true,raw,data,error:isObject(data)?'':'根数据不是对象'}}catch{return {exists:true,raw,data:null,error:'存储 JSON 无法解析'}}}catch{return {exists:false,raw:null,data:null,error:'浏览器不允许读取 localStorage'}}}
function workoutIdentity(r,key=''){const match=String(key).match(/(\d{4}-\d{2}-\d{2})[^A-Z0-9]*([ABCD])(?:$|[^A-Z])/i);const day=String(r?.date??r?.workoutDate??match?.[1]??'');const type=[r?.type,r?.trainingType,r?.dayType,match?.[2]?.toUpperCase()].find(t=>['A','B','C','D'].includes(t));return validPlanDate(day)&&type?{date:day,type}:null}
function normalizeLegacyWorkout(raw,key=''){
 if(!isObject(raw))return null;const identity=workoutIdentity(raw,key);if(!identity)return null;
 const r=cloneData(raw),normalized=!!raw.compatibilityNormalized;
 r.date=identity.date;r.type=identity.type;r.gym=typeof raw.gym==='string'?raw.gym:'';r.feedback=isObject(raw.feedback)?cloneData(raw.feedback):{};if(raw.notes&&!r.feedback.notes)r.feedback.notes=raw.notes;r.completed=!!(normalized?raw.completed:(raw.completed||raw.done));
 if(isObject(raw.cardio)&&isObject(raw.cardio.entries)&&['treadmill','elliptical','bike'].includes(raw.cardio.selected)){
  if(!isObject(raw.cardio.entries[raw.cardio.selected]))return null;r.kind='cardio';r.exercises=[];
  for(const [id,c]of Object.entries(raw.cardio.entries)){if(!['treadmill','elliptical','bike'].includes(id)||!isObject(c))return null;const out=r.cardio.entries[id];for(const [field,alias]of Object.entries({minutes:'actualDuration',speed:'actualSpeed',incline:'actualIncline',resistance:'actualResistance',rpe:'actualRpe'})){if(!normalized&&!missingValue(c[alias]))out[field]=c[alias];else out[field]??=''}out.handrails??='';out.feel=normalizeFeeling(c.feel??c.feeling);out.legFatigue??='';out.pain??='';out.notes??=''}
 }else{
  if(raw.kind==='cardio'||raw.type==='cardio'||raw.cardio)return null;
  if(!Array.isArray(raw.exercises))return null;r.kind='strength';r.exercises=[];
  for(const e of raw.exercises){if(!isObject(e)||!Array.isArray(e.sets))return null;const out={...cloneData(e),cn:e.cn??e.nameZh??e.name??'',ja:e.ja??e.nameJa??'',en:e.en??e.nameEn??'',weight:e.weight??e.recommendedWeight??'',count:e.count??e.sets.length,range:e.range??(e.repMin!=null&&e.repMax!=null?`${e.repMin}–${e.repMax}`:''),done:!!(normalized?e.done:(e.done||e.completed)),sets:[]};for(const s of e.sets){if(!isObject(s))return null;out.sets.push({...cloneData(s),weight:!normalized&&!missingValue(s.actualWeight)?s.actualWeight:(s.weight??''),reps:!normalized&&!missingValue(s.actualReps)?s.actualReps:(s.reps??''),rir:String(s.rir??s.RIR??''),feel:normalizeFeeling(s.feel??s.feeling),done:!!(normalized?s.done:(s.done||s.completed))})}r.exercises.push(out)}
 }
 r.compatibilityNormalized=true;return r;
}
function normalizeFeeling(v){return ({'🟢轻松':'easy','🟡普通':'normal','🟠困难':'hard','🔴极限':'max','轻松':'easy','普通':'normal','困难':'hard','极限':'max'})[v]??v??''}
function hasActualWorkoutData(r){
 if(!r)return false;if(r.completed||r.done||r.updated||r.actualTouched)return true;
 if(Object.values(r.feedback||{}).some(v=>Array.isArray(v)?v.length:!missingValue(v))||r.notes)return true;
 if(r.cardio){for(const [id,c]of Object.entries(r.cardio.entries||{})){if(['actualDuration','actualSpeed','actualIncline','actualResistance','actualRpe'].some(k=>!missingValue(c[k])))return true;if(c.done||c.completed||!missingValue(c.rpe)||!missingValue(c.feel)||!missingValue(c.feeling)||!missingValue(c.legFatigue)||!missingValue(c.pain)||c.notes)return true;try{const initial=cardioEntryForRecord(r,id);if(['minutes','speed','incline','resistance','handrails'].some(k=>String(c[k]??'')!==String(initial[k]??'')))return true}catch{return true}}return false}
 return (r.exercises||[]).some(e=>e.done||e.completed||(e.sets||[]).some(s=>s.done||s.completed||!missingValue(s.actualWeight)||!missingValue(s.actualReps)||!missingValue(s.reps)||!missingValue(s.rir)||!missingValue(s.RIR)||!missingValue(s.feel)||!missingValue(s.feeling)||(!missingValue(s.weight)&&String(s.weight)!==String(e.recommendedWeight??e.weight??''))));
}
function workoutRank(r){return (hasActualWorkoutData(r)?10000:0)+(r.completed?1000:0)+(r.kind==='cardio'?Object.keys(r.cardio.entries).length:(r.exercises||[]).reduce((n,e)=>n+(e.sets||[]).filter(s=>s.done||!missingValue(s.reps)||!missingValue(s.rir)).length*10,0))+(r.exercises?.length||0)}
function scanWorkouts(data){const candidates=[],unknown=[];if(!isObject(data))return {items:[],candidates,unknown};
 const visit=(value,field,key,depth=0)=>{if(isObject(value)&&(workoutIdentity(value,key)||'exercises'in value||'cardio'in value)){const r=normalizeLegacyWorkout(value,key);if(r)candidates.push({record:r,raw:value,field,key,id:`${r.date}_${r.type}`});else unknown.push({field,key});return}if(depth<2&&(isObject(value)||Array.isArray(value))){for(const [k,v]of Object.entries(value))visit(v,field,key?`${key}/${k}`:k,depth+1)}else if(value!=null)unknown.push({field,key})};
 for(const field of WORKOUT_ROOTS)if(data[field]!=null)visit(data[field],field,'');
 const winners=new Map();for(const c of candidates){const old=winners.get(c.id);if(!old||workoutRank(c.record)>workoutRank(old.record)||(workoutRank(c.record)===workoutRank(old.record)&&c.field==='records'&&c.key===c.id))winners.set(c.id,c)}
 return {items:[...winners.values()],candidates,unknown};
}
function getAllNormalizedWorkouts(data=db){return scanWorkouts(data).items.map(c=>c.record).sort((a,b)=>b.date.localeCompare(a.date)||a.type.localeCompare(b.type))}
function selectedWorkout(day,type,data=db){return scanWorkouts(data).items.find(c=>c.id===`${day}_${type}`)?.record||null}
function editableWorkout(day,type){const result=scanWorkouts(db).items.find(c=>c.id===`${day}_${type}`);if(!result)return null;const signature=JSON.stringify(result.raw),old=normalizedCache.get(result.id);if(old?.signature===signature)return old.record;normalizedCache.set(result.id,{signature,record:result.record});return result.record}
function templateFor(type,data=db){const x=data.templates?.[type]??data.workoutTemplates?.[type];const list=Array.isArray(x)?x:(Array.isArray(x?.exercises)?x.exercises:[]);return list.filter(e=>isObject(e)&&Number.isInteger(Number(e.count??e.sets))&&Number(e.count??e.sets)>0&&Number(e.count??e.sets)<=100).map(e=>({...e,cn:e.cn??e.nameZh??'',ja:e.ja??e.nameJa??'',en:e.en??e.nameEn??'',weight:e.weight??e.recommendedWeight??'',count:Number(e.count??e.sets),range:e.range??`${e.repMin??''}–${e.repMax??''}`}))}
function recoveryNotice(){const s=storageSnapshot();if(!s.exists&&!s.error)return `当前运行环境没有检测到本地训练数据。${isStandalone()?'如果之前在 Safari 使用，请从 Safari 打开并查看数据诊断。':'如果之前从主屏幕 App 使用 Training Log，请从主屏幕 App 打开后查看数据诊断。'}`;if(s.error||(s.exists&&!readableRoot(s.data))||scanWorkouts(s.data).unknown.length)return '检测到旧版数据，但当前版本无法完全识别。请先导出全部数据，不要清除网站数据。';const scan=scanWorkouts(s.data);if(!scan.items.length)return '当前运行环境未发现可读取的训练记录。可检查 Safari / 主屏幕 App，或导入备份；这不表示其他环境的数据已删除。';if(scan.items.some(c=>c.field!=='records'||c.key!==c.id)||scan.candidates.length>scan.items.length)return '检测到旧版训练数据，正在使用兼容模式读取；原始数据保留。';return ''}
function isStandalone(){return navigator.standalone===true||matchMedia('(display-mode: standalone)').matches}
