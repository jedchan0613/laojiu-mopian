import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const script = (await readFile(new URL('../public/app.js', import.meta.url), 'utf8')).replaceAll('\r\n', '\n');
const declaration = (name) => {
  const start = script.indexOf(`const ${name} =`);
  assert.notEqual(start, -1);
  return script.slice(start, script.indexOf('\n\n', start));
};
const setup = (record) => {
  const state = { current: structuredClone(record), records: [], isNew: false, dirty: false,
    translation: {dirty: false}, search: '旧搜索', recordTypeFilter: 'ALB', recordDecadeFilter: '1990',
    recordQuickStatus: '已发布', recordFilters: {category:'photo'}, recordStatusFilter:'withdrawn', recordPage:3 };
  const calls = [];
  const elements = { recordSearch:{value:'旧搜索'}, editorSurface:{querySelector:()=>null} };
  const scope = {state, elements, deepClone:structuredClone, today:()=> '2026-10-14',
    isWithdrawn:()=>state.current?.core.record_status==='WDR',
    hasUnsavedChanges:()=>state.dirty || state.translation.dirty,
    updateDerivedCollectionCode:()=>{}, schemaForType:()=> 'photo',
    setFieldValue:(_scope,_dimension,key,value)=>{state.current.core[key]=value;state.dirty=true;},
    renderEditorPreservingViewport:()=>{},
  };
  for (const name of ['renderRecordList','renderWorkspaceNavigation','setMobileRecordBrowserOpen','renderEditor','updateHeader','renderTabs','showToast']) scope[name]=(...args)=>calls.push([name,...args]);
  const functions = new Function(...Object.keys(scope), [
    declaration('similarCoreFieldCodes'), declaration('startNewRecord'), declaration('handleAlbumAction'),
    'return {handleAlbumAction};',
  ].join('\n'))(...Object.values(scope));
  return {...functions,state,elements,calls};
};
const album = {core:{item_id:'LJM-20261014-ALB-001',object_type:'ALB',album_id:'旧相册_01',record_status:'ACT',
  title:'相册',accession_date:'2025-01-01',date_display:'1980年代',country:'中国',province:'浙江',city:'杭州',district:'某区',
  batch_id:'批次甲',source_name:'来源甲',source_place:'入藏地',privacy_level:'G',use_status:'U3',publication_file_path:['相册图.jpg']},
  metadata:{schema:'photo',dimensions:{D01:{value:'某值'}}}, public_view:{description:'相册简介'}};

test('同册按钮清除其他筛选并使用真实搜索控件，保持当前档案不变', () => {
  const c = setup(album), before = structuredClone(c.state.current);
  c.handleAlbumAction('show-members');
  assert.equal(c.elements.recordSearch.value,'');
  assert.equal(c.state.search,'');
  assert.equal(c.state.recordAlbumFilter,'旧相册_01');
  assert.equal(c.state.recordStatusFilter,'normal');
  assert.equal(c.state.recordPage,1);
  assert.ok(Object.values(c.state.recordFilters).every(v=>v===''));
  assert.deepEqual(c.state.current,before);
  assert.ok(c.calls.some(([name,value])=>name==='setMobileRecordBrowserOpen' && value===true));
});

test('同册新增只复制入藏信息，清空逐张年代、地点、图片、专属字段和公开许可', () => {
  const c = setup(album);
  c.handleAlbumAction('new-photo');
  const r=c.state.current;
  assert.equal(r.core.object_type,'PHO');
  assert.equal(r.core.album_id,'旧相册_01');
  assert.equal(r.core.accession_date,'2025-01-01');
  assert.equal(r.core.batch_id,'批次甲');
  assert.equal(r.core.source_name,'来源甲');
  assert.equal(r.core.source_place,'入藏地');
  for(const field of ['title','date_display','item_id']) assert.equal(r.core[field],'');
  for(const field of ['country','province','city','district','original_position']) assert.equal(r.core[field],undefined);
  assert.deepEqual(r.core.publication_file_path,[]);
  assert.deepEqual(r.metadata,{schema:'photo',dimensions:{}});
  assert.equal(r.core.privacy_level,'Y');assert.equal(r.core.use_status,'U0');assert.equal(r.core.record_status,'SUS');
  assert.equal(c.state.confirmedPublicationCopies,false);
  assert.equal(c.state.dirty,true);
  assert.equal(album.core.object_type,'ALB');
});

test('未保存或已撤销档案不能通过相册动作覆盖当前编辑', () => {
  for(const mode of ['dirty','translation','new','withdrawn']) {
    const c=setup(album);
    if(mode==='dirty')c.state.dirty=true;
    if(mode==='translation')c.state.translation.dirty=true;
    if(mode==='new')c.state.isNew=true;
    if(mode==='withdrawn')c.state.current.core.record_status='WDR';
    const before=structuredClone(c.state.current);
    c.handleAlbumAction('new-photo');
    assert.deepEqual(c.state.current,before,mode);
  }
  const c=setup(album);c.state.current.core.record_status='WDR';delete c.state.current.core.album_id;
  c.handleAlbumAction('use-record-id');
  assert.equal(c.state.current.core.album_id,undefined);
});

test('永久编号辅助仅补空关联，不覆盖已有相册关系', () => {
  const c=setup(album);
  c.handleAlbumAction('use-record-id');
  assert.equal(c.state.current.core.album_id,'旧相册_01');
  delete c.state.current.core.album_id;
  c.handleAlbumAction('use-record-id');
  assert.equal(c.state.current.core.album_id,c.state.current.core.item_id);
});

