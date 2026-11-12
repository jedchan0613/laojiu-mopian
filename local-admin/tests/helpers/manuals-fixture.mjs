import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createManualStore} from '../../manuals.mjs';

export const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j8WQAAAAASUVORK5CYII=','base64');
export function manualFixtureCatalog(){return {schema_version:1,brands:[{brand_key:'brand-test',name:'隔离测试品牌',aliases:['TEST BRAND'],evidence:'PRIVATE-BRAND-BASIS'}],models:[{model_key:'model-test',brand_key:'brand-test',model_text:'TEST-100',model_aliases:['TEST 100'],product_name:'合成测试物件',category_key:'tools',product_era_display:'年代未知',evidence:'PRIVATE-MODEL-BASIS'}],documents:[{manual_key:'manual-test',model_keys:['model-test'],document_kind:'user-guide',languages:['zh-CN'],region_display:'地区未注明',edition_display:'测试第一版',edition_date:'',completeness:'unverified',missing_note:'',linked_archive_id:'',page_map:[],contents:[],keywords:[],catalogue_summary:'程序生成的隔离测试资料，不是真实产品。',official_sources:[{name:'合成官方来源',url:'https://support.example.com/manual/test',checked_on:'2026-01-01',available:true,evidence:'PRIVATE-SOURCE-BASIS'}],publication_status:'draft',applicability_basis:'PRIVATE-APPLICABILITY',display_basis:'',review_note:'PRIVATE-REVIEW-NOTE'}]};}
export async function createManualFixture(t){
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'ljm-manuals-phase3-'));
  const site=path.join(dir,'site'),root=path.join(dir,'private','manuals'),source=path.join(site,'src/data/generated/manuals-catalog.json'),dist=path.join(site,'dist');
  await fs.mkdir(dist,{recursive:true});await fs.writeFile(path.join(dist,'index.html'),'PREVIOUS-SITE');
  const id='LJM-20000101-OTH-001',src=`/archive/${id}/front-public.png`,archive={core:{item_id:id,title:'合成隔离说明书',record_status:'ACT',privacy_level:'G',use_status:'U3',rights_status:'OWN',object_type:'OTH',publication_file_path:[src]},metadata:{schema:'common',dimensions:{}},public_view:{description:'已审合成公开简介'}};
  const image=path.join(site,'public',src);await fs.mkdir(path.dirname(image),{recursive:true});await fs.writeFile(image,png);
  let archives=[archive],failBuild=false,onBuild=null,builds=0;
  const store=createManualStore({root,siteDirectory:site,readArchives:async()=>structuredClone(archives),build:async()=>{builds++;await fs.mkdir(dist,{recursive:true});await fs.writeFile(path.join(dist,'index.html'),'BUILT-'+builds);if(onBuild)await onBuild();if(failBuild)throw new Error('SYNTHETIC-BUILD-FAIL');return 'SYNTHETIC-BUILD-PASS';}});
  if(t)t.after(async()=>{if(!path.resolve(dir).startsWith(path.resolve(os.tmpdir())+path.sep+'ljm-manuals-phase3-'))throw new Error('测试目录超出范围');await fs.rm(dir,{recursive:true,force:true,maxRetries:10,retryDelay:100});});
  const save=async(catalog=manualFixtureCatalog())=>store.save({catalog,expectedRevision:(await store.bootstrap()).revision});
  const publish=async()=>{const expectedRevision=(await store.bootstrap()).revision,review=await store.prepare({expectedRevision});return store.publish({expectedRevision,review_id:review.review_id,confirmations:Array(5).fill(true)});};
  const readerCatalog=()=>{const catalog=manualFixtureCatalog(),doc=catalog.documents[0];Object.assign(doc,{linked_archive_id:id,official_sources:[],catalogue_summary:'',page_map:[{attachment_ref:src,printed_label:'封面'}],contents:[{label:'封面',page:1}],display_basis:'PRIVATE-DISPLAY-BASIS'});return catalog;};
  return {dir,site,root,source,dist,id,src,image,archive,store,save,publish,readerCatalog,builds:()=>builds,failBuild:value=>failBuild=value,onBuild:value=>onBuild=value,setArchives:value=>archives=value};
}
