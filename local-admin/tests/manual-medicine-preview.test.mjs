import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createManualHttpFixture} from './helpers/manuals-http-fixture.mjs';
import {createManualOnlineFixture} from './helpers/manuals-online-fixture.mjs';
import {png} from './helpers/manuals-fixture.mjs';

test('本机药品草稿可预览已审核页图；关联档案随后撤下时原预览也停止提供图片',async t=>{
  const f = await createManualHttpFixture(t);
  const initial = (await f.get('/api/manuals')).body;
  assert.equal(initial.choices.medicineDraftVersion,1);
  const catalog = f.readerCatalog();
  const key = 'medicine-fixture';
  catalog.schema_version = 2;
  catalog.brands = []; catalog.models = [];
  catalog.medicines = [{medicine_key:key,original_title:'合成旧题'}];
  Object.assign(catalog.documents[0],{model_keys:[],medicine_keys:[key],revision_date_text:'年份未详'});
  const saved = await f.post('/api/manuals/save',{catalog,expectedRevision:initial.revision,medicineDraftVersion:1});
  assert.equal(saved.status,200,JSON.stringify(saved.body));
  const query = new URLSearchParams({manual:'manual-test',revision:saved.body.revision});
  const preview = await f.get('/api/manuals/preview?'+query);
  assert.equal(preview.status,200);
  assert.deepEqual(preview.body.issues,[]);
  const {document} = preview.body;
  assert.equal(document.title,'合成旧题');
  assert.equal(document.revision_date_text,'年份未详');
  assert.equal(document.contents[0].page,1);
  const page = document.pages[0];
  assert.match(page.src,/^\/api\/manuals\/preview-image\?/);
  const image = await fetch(f.origin+page.src);
  assert.equal(image.headers.get('Content-Type'),'image/png');
  assert.deepEqual(Buffer.from(await image.arrayBuffer()),png);
  const file = path.join(f.archiveDirectory,f.id+'.json');
  const archive = JSON.parse(await fs.readFile(file));
  archive.core.use_status='U1';
  await fs.writeFile(file,JSON.stringify(archive));
  assert.equal((await f.get('/api/manuals/preview?'+query)).body.document,null);
  assert.equal((await f.get(page.src)).status,409);
});

test('线上模式维持普通目录能力，不接收独立药品目录',async t=>{
  const f = await createManualOnlineFixture(t);
  const data = (await f.get('/api/manuals')).body;
  assert.equal(data.choices.medicineDraftVersion,0);
  const catalog = {schema_version:2,brands:[],models:[],documents:[],medicines:[]};
  const result = await f.post('/api/manuals/save',{
    catalog,expectedRevision:data.revision,medicineDraftVersion:1,initializeEmpty:true,expectedPublicRevision:data.readiness.publicRevision
  });
  assert.equal(result.status,409);
  assert.equal((await f.get('/api/manuals')).body.revision,data.revision);
});
