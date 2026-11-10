import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {randomUUID} from 'node:crypto';

const source=(await readFile(new URL('../public/app.js',import.meta.url),'utf8')).replaceAll('\r\n','\n');
const declaration=name=>{
 const start=source.indexOf(`const ${name} =`);
 assert.ok(start>=0,name);
 const boundaries=[source.indexOf('\n\n',start),source.indexOf('\nconst ',start+1)].filter(index=>index>=0);
 return source.slice(start,Math.min(...boundaries));
};
const id='LJM-20000101-LET-001';
const paths=[`/archive/${id}/front-public.jpg`,`/archive/${id}/back-public.jpg`];
const record=()=>({core:{item_id:id,object_type:'LET',publication_file_path:[...paths]},public_view:{image_descriptions:['正面','背面']}});
const setup=(item=record())=>{
 const state={current:item,images:[],imagePreflight:[],pendingRemovedImages:[],confirmedPublicationCopies:false};
 let readonly=false;
 const scope={state,isWithdrawn:()=>readonly,deepClone:structuredClone,crypto:{randomUUID},
  displayedImageDescription:(_record,image,index)=>image.description??`图片${index+1}`,
  categoryForObjectType:()=>({label:'信件'})};
 const names=['escapeHtml','recordImages','homepageCoverRequest','chooseHomepageCover','acknowledgeHomepageCoverSave','imageSaveStateLabel','renderImages','renderWithdrawnImages'];
 const helpers=new Function(...Object.keys(scope),`${names.map(declaration).join('\n')}\nreturn {${names.join(',')}};`)(...Object.values(scope));
 state.images=helpers.recordImages(item);
 return {state,...helpers,setReadonly:value=>readonly=value};
};

test('首页封面从正式图路径恢复，指定第二张不重排详情图片，取消后发送null',()=>{
 const item=record();item.public_view.homepage_cover={image:paths[1],selected_at:'2026-11-10T01:00:00.000Z'};
 const f=setup(item),before=f.state.images.map(image=>image.id);
 assert.equal(f.state.images[1].homepageCover,true);
 assert.deepEqual(f.homepageCoverRequest(f.state.images),{imageIndex:1,promote:false});
 f.chooseHomepageCover(f.state.images[0].id);
 assert.deepEqual(f.state.images.map(image=>image.id),before);
 assert.deepEqual(f.homepageCoverRequest(f.state.images),{imageIndex:0,promote:true});
 f.chooseHomepageCover(null);
 assert.deepEqual(f.homepageCoverRequest(f.state.images),{imageIndex:null,promote:false});
 assert.equal(f.chooseHomepageCover(null),false);
});

test('封面随图片重排；新图同样可选；本人再次指定才产生新的优先请求',()=>{
 const f=setup();f.state.images.push({id:'new-image',kind:'new',description:'新增细节'});
 f.chooseHomepageCover('new-image');
 const token=f.state.images[2].homepageCoverToken;
 assert.ok(token);
 f.state.images.unshift(f.state.images.pop());
 assert.deepEqual(f.homepageCoverRequest(f.state.images),{imageIndex:0,promote:true});
 f.chooseHomepageCover('new-image');
 assert.notEqual(f.state.images[0].homepageCoverToken,token);
 assert.equal(f.state.images.filter(image=>image.homepageCover).length,1);
 f.state.images.shift();
 assert.deepEqual(f.homepageCoverRequest(f.state.images),{imageIndex:null,promote:false});
});

test('保存回应只确认相同快照，不能覆盖后来选择、重新指定或取消',()=>{
 for(const next of ['other','again','clear']){
  const f=setup();f.chooseHomepageCover(f.state.images[0].id);
  const snapshot=structuredClone(f.state.images);
  if(next==='other')f.chooseHomepageCover(f.state.images[1].id);
  else if(next==='again')f.chooseHomepageCover(f.state.images[0].id);
  else f.chooseHomepageCover(null);
  const before=structuredClone(f.state);
  const saved=record();saved.public_view.homepage_cover={image:paths[0],selected_at:'2026-11-10T02:00:00.000Z'};
  f.acknowledgeHomepageCoverSave(snapshot,saved);
  assert.deepEqual(f.state,before,next);
 }
});

test('普通保存确认后清除已受理的promote，后续文字编辑不会再次抢首页位置',()=>{
 const f=setup();f.chooseHomepageCover(f.state.images[1].id);
 const snapshot=structuredClone(f.state.images),saved=record();
 saved.public_view.homepage_cover={image:paths[1],selected_at:'2026-11-10T02:00:00.000Z'};
 f.acknowledgeHomepageCoverSave(snapshot,saved);
 assert.deepEqual(f.homepageCoverRequest(f.state.images),{imageIndex:1,promote:false});
 assert.deepEqual(f.state.current.public_view.homepage_cover,saved.public_view.homepage_cover);
 f.chooseHomepageCover(null);
 f.acknowledgeHomepageCoverSave(structuredClone(f.state.images),record());
 assert.equal(f.state.current.public_view.homepage_cover,undefined);
});

test('发布图片界面区分详情首图与首页封面，撤销记录没有可编辑封面入口',()=>{
 const f=setup();f.chooseHomepageCover(f.state.images[1].id);
 const markup=f.renderImages();
 assert.match(markup,/详情首图/);
 assert.match(markup,/本件指定第 2 张/);
 assert.match(markup,/data-homepage-cover-clear/);
 const buttons=[...markup.matchAll(/<button[^>]*data-image-action="homepage-cover"[^>]*>/g)].map(match=>match[0]);
 assert.equal(buttons.length,2);
 assert.match(buttons[0],/aria-pressed="false"/);
 assert.match(buttons[1],/aria-pressed="true"/);
 f.setReadonly(true);
 const before=structuredClone(f.state);
 assert.equal(f.chooseHomepageCover(f.state.images[0].id),false);
 assert.equal(f.chooseHomepageCover(null),false);
 assert.deepEqual(f.state,before);
 assert.doesNotMatch(f.renderWithdrawnImages(),/data-image-action="homepage-cover"|data-homepage-cover-clear/);
});

test('实际saveDraft发出快照封面索引；保存中改选保留新选择，后续保存不再重排或重复promote',async()=>{
 const f=setup();Object.assign(f.state,{writeProtocol:2,editSequence:1,isNew:false,activeTab:'images',dirty:true});
 f.chooseHomepageCover(f.state.images[1].id);
 const payloads=[];
 const scope={state:f.state,pendingWriteReview:null,...f,deepClone:structuredClone,itemIdPattern:/^LJM-\d{8}-[A-Z]{3}-\d{3}$/,
  draftSavePrerequisiteIssues:()=>[],expectedRecordRevision:()=>'synthetic-revision',setSavePhase:()=>{},
  throwIfOperationCancelled:()=>{},finishCancellableOperation:()=>{},isOperationCancellation:()=>false,
  updateHeader:()=>{},showToast:()=>{},scheduleAutoSaveDraft:()=>{},autoSaveTimeLabel:()=>'',
  classifySaveError:error=>{throw error;},
  apiPost:async(url,payload)=>{
   assert.equal(url,'/api/save-draft');payloads.push(structuredClone(payload));
   const saved=record();
   if(payload.homepageCover.imageIndex!==null)saved.public_view.homepage_cover={image:paths[payload.homepageCover.imageIndex],selected_at:'2026-11-10T02:00:00.000Z'};
   if(payloads.length===1){f.chooseHomepageCover(f.state.images[0].id);f.state.editSequence++;}
   return{draft:{record:saved,saved_at:'2026-11-10T02:00:00.000Z'},revision:'synthetic-next'};
  },
 };
 const start=source.indexOf('const saveDraft = async'),end=source.indexOf('\nconst publishCurrent =',start);
 const saveDraft=new Function(...Object.keys(scope),source.slice(start,end)+'\nreturn saveDraft;')(...Object.values(scope));
 await saveDraft({reload:false,silent:true,operation:{quiet:true},autoSave:true});
 assert.deepEqual(payloads[0].homepageCover,{imageIndex:1,promote:true});
 assert.deepEqual(f.homepageCoverRequest(f.state.images),{imageIndex:0,promote:true});
 await saveDraft({reload:false,silent:true,operation:{quiet:true},autoSave:true});
 assert.deepEqual(payloads[1].homepageCover,{imageIndex:0,promote:true});
 assert.deepEqual(f.homepageCoverRequest(f.state.images),{imageIndex:0,promote:false});
 await saveDraft({reload:false,silent:true,operation:{quiet:true},autoSave:true});
 assert.deepEqual(payloads[2].homepageCover,{imageIndex:0,promote:false});
 assert.deepEqual(f.state.images.map(image=>image.filename),['front-public.jpg','back-public.jpg']);
});
