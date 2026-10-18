// 私密复核材料生成器：不写译文维护目录，不设置审核人或发布状态。
import {getTranslationValueHash} from '../shared/archive-translations.mjs';
import {translationLocales} from '../shared/locale-config.mjs';
const equal=(left,right)=>JSON.stringify(left)===JSON.stringify(right);
const digits=value=>JSON.stringify(value).match(/\d+/g)??[];
const fieldValue=(record,key)=>key.startsWith('image:')?record?.image_descriptions?.[key.slice(6)]:record?.fields?.[key];
const sourceEntries=record=>[...Object.entries(record.source.fields),...Object.entries(record.source.image_descriptions).map(([key,value])=>['image:'+key,value])];
const matches=(record,translation,key)=>Boolean(translation)&&(translation.source_hashes!==undefined?translation.source_hashes[key]===record.source_hashes[key]:translation.source_hash===record.source_hash);
const reuseKey=(locale,key,hash)=>JSON.stringify([locale,key.startsWith('image:')?'image':key,hash]);

export function createTranslationReview(snapshot,overrides={}){
 const reuse=new Map(),byId=new Map(snapshot.records.map(record=>[record.id,record]));
 for(const record of snapshot.records){
  if(record.source.item_id!==record.id||getTranslationValueHash({...record.source,eligibility:['ACT','U3','G']})!==record.source_hash)throw Error('来源快照不一致：'+record.id);
  for(const [key,value]of sourceEntries(record))if(record.source_hashes[key]!==getTranslationValueHash(value))throw Error('字段指纹不一致：'+record.id+' '+key);
  for(const locale of translationLocales){const published=record.translations[locale]?.published;if(published?.status!=='published')continue;
   for(const [key]of sourceEntries(record)){const value=fieldValue(published,key);if(value===undefined||!matches(record,published,key))continue;const index=reuseKey(locale,key,record.source_hashes[key]),values=reuse.get(index)??new Map();values.set(JSON.stringify(value),{value,from:record.id});reuse.set(index,values);}
  }
 }
 const albumMembers=new Set(snapshot.groups.flatMap(group=>group.members)),featured=new Set(snapshot.featured),packets=[];
 for(const record of snapshot.records)for(const locale of translationLocales){
  const stored=record.translations[locale],published=stored.published,required=new Set(record.required_fields),targets=[];
  for(const [key,source]of sourceEntries(record)){
   const old=fieldValue(published,key),needed=required.has(key)||key.startsWith('image:')||old!==undefined;
   if(!needed||(old!==undefined&&matches(record,published,key)))continue;
   const draftValue=fieldValue(stored.draft,key),manual=fieldValue(overrides[record.id]?.[locale],key),reused=reuse.get(reuseKey(locale,key,record.source_hashes[key]));
   const reuseCandidate=reused?.size===1?[...reused.values()][0]:null;
   let candidate=manual!==undefined?{value:manual,method:'prepared-revision'}:draftValue!==undefined&&matches(record,stored.draft,key)?{value:draftValue,method:'existing-draft'}:reuseCandidate?{value:reuseCandidate.value,method:'same-source-reviewed-translation',from:reuseCandidate.from}:null;
   let blocked_candidate=null;
   if(candidate?.method==='same-source-reviewed-translation'&&!equal(digits(source),digits(candidate.value))){blocked_candidate={...candidate,reason:'数字表达不同，需人工对照，不自动复用'};candidate=null;}
   targets.push({key,reason:old===undefined?'missing':key.startsWith('image:')?'caption-changed':'source-changed',source,previous:old??null,candidate,blocked_candidate,uncertainty:/待考|待核|尚未|不详|未知|推测|疑似|约\d/.test(JSON.stringify(source))});
  }
  const currentKeys=new Set(sourceEntries(record).map(([key])=>key)),removed=[...Object.keys(published?.fields??{}),...Object.keys(published?.image_descriptions??{}).map(key=>'image:'+key)].filter(key=>!currentKeys.has(key));
  if(!targets.length&&!removed.length)continue;
  const patch={fields:{},image_descriptions:{}};
  for(const target of targets)if(target.candidate&&target.candidate.method!=='existing-draft'){
   if(target.key.startsWith('image:'))patch.image_descriptions[target.key.slice(6)]=target.candidate.value;else patch.fields[target.key]=target.candidate.value;
  }
  const packet={item_id:record.id,locale,title:record.title,priority:featured.has(record.id)?0:albumMembers.has(record.id)?1:2,status:'draft',source_hash:record.source_hash,source_hashes:Object.fromEntries(targets.map(target=>[target.key,record.source_hashes[target.key]])),revision:stored.revision,store_sha256:stored.store_sha256,has_existing_draft:stored.has_draft,published_state:stored.published_state,targets,removed_fields:removed,patch,requires_human_review:true};
  validateReviewPatch(packet,record);packets.push(packet);
 }
 packets.sort((a,b)=>a.priority-b.priority||Number(a.locale!=='en')-Number(b.locale!=='en')||a.item_id.localeCompare(b.item_id)||a.locale.localeCompare(b.locale));
 const albums=snapshot.groups.flatMap(group=>translationLocales.map(locale=>({album_id:group.album_id,slug:group.slug,locale,member_count:group.members.length,pending_members:group.members.filter(id=>byId.get(id)?.translations[locale]?.published_state!=='published'),editorial_review_required:group.album_id.startsWith('LJM-CUR-')&&['en','th'].includes(locale)})));
 return {schema_version:1,created_at:snapshot.created_at,input_manifest_hash:snapshot.input_manifest_hash,public_count:snapshot.public_count,packets,albums,summary:{records:packets.length,fields:packets.reduce((sum,packet)=>sum+packet.targets.length,0),candidates:packets.reduce((sum,packet)=>sum+packet.targets.filter(target=>target.candidate).length,0),existing_drafts:packets.filter(packet=>packet.has_existing_draft).length,by_locale:Object.fromEntries(translationLocales.map(locale=>[locale,packets.filter(packet=>packet.locale===locale).length]))}};
}

export function validateReviewPatch(packet,current){
 if(packet.status!=='draft'||packet.requires_human_review!==true||packet.reviewed_at||packet.reviewed_by||packet.confirmed_fields)throw Error('复核材料不能代替人工批准');
 const stored=current.translations[packet.locale];
 if(!translationLocales.includes(packet.locale)||packet.item_id!==current.id||packet.source_hash!==current.source_hash||packet.revision!==stored.revision||packet.store_sha256!==stored.store_sha256)throw Error('来源或维护版本已变化，必须重新生成清单');
 const allowed=new Map(packet.targets.map(target=>[target.key,target]));
 for(const [key,value]of [...Object.entries(packet.patch.fields),...Object.entries(packet.patch.image_descriptions).map(([key,value])=>['image:'+key,value])]){
  const target=allowed.get(key);if(!target||packet.source_hashes[key]!==current.source_hashes[key])throw Error('不允许修改未列入复核的字段');
  if(fieldValue(stored.published,key)!==undefined&&matches(current,stored.published,key))throw Error('不得覆盖来源有效的已审译文');
  const source=key.startsWith('image:')?current.source.image_descriptions[key.slice(6)]:current.source.fields[key];
  if(source===undefined||Array.isArray(source)!==Array.isArray(value)||Array.isArray(source)&&source.length!==value.length)throw Error('译文结构与原字段不一致');
  for(const text of Array.isArray(value)?value:[value])if(typeof text!=='string'||!text.trim()||/<\/?[a-z][^>]*>/i.test(text))throw Error('译文必须是非空纯文本');
  if(!equal(digits(source),digits(value)))throw Error('数字事实发生变化，需人工判断：'+packet.item_id+' '+key);
 }
 return true;
}
