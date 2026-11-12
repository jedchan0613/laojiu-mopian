import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {randomBytes} from 'node:crypto';
import {createSubmissionStore,privacyChecks} from '../../submissions.mjs';
import {manualReviewChecks} from '../../../shared/manual-review.mjs';
import {manualConsentVersion} from '../../../shared/manual-workflow.mjs';
import {createManualHttpFixture} from './manuals-http-fixture.mjs';
const sourceSite=fileURLToPath(new URL('../../../site/',import.meta.url)),sharp=createRequire(path.join(sourceSite,'package.json'))('sharp');
const key=()=>randomBytes(32).toString('hex');
export const seedManualMetadata={schema_version:1,brand_name:'隔离审核合成品牌',model_texts:['REVIEW-TEST'],product_name:'合成物件',category_key:'tools',document_kind:'user-guide',languages:['zh-CN'],completeness:'complete',region_display:'地区未注明',edition_display:'合成第一版',source_note:'自制合成样图，仅供隔离开发测试',rights_basis:'own-work',sharing_scope:'reading-copy',people:'none',attribution:'anonymous'};
export async function createReviewHttpFixture(t,{pages=12,metadata={},accountId='usr_'+('a'.repeat(24))}={}){
  const f=await createManualHttpFixture(t),submissionRoot=path.join(path.dirname(f.root),'submissions');
  // 只有解码器从现有依赖读取；记录与图片全部存入本次新建的临时目录。
  const store=createSubmissionStore({root:submissionRoot,siteDirectory:sourceSite}),manual={...seedManualMetadata,...metadata};
  const draft=await store.createAccountManualDraft({accountId,payload:{request_key:key(),manual}});
  for(let index=0;index<pages;index++){
    const jpeg=await sharp({create:{width:140,height:180,channels:3,background:{r:180+(index%40),g:170,b:150}}}).jpeg().toBuffer();
    await store.uploadAccountManualPage({id:draft.id,accountId,payload:{operation_id:key(),revision:index+1,copies_confirmed:true,image:{name:'screened-review-'+(index+1)+'.jpg',type:'image/jpeg',buffer:jpeg}}});
  }
  await store.operateAccountManualSubmission({id:draft.id,accountId,payload:{action:'submit',revision:pages+1,operation_id:key(),consent_version:manualConsentVersion,consents:{copies:true,rights:true,privacy:true,processing:true}}});
  const base='/api/admin/manual-submissions/'+draft.id;
  const detail=async()=>{const result=await f.get(base);if(result.status!==200)throw new Error(JSON.stringify(result.body));return result.body;};
  const binding=data=>({revision:data.record.revision,submitted_revision:data.record.manual_submitted_revision,snapshot_digest:data.record.versions.at(-1).digest});
  const approval=data=>({...binding(data),status:'approved',public_message:'合成审核通过，尚未公开',private_note:'PRIVATE-REVIEW-HTTP-NOTE',model_basis:'合成封面型号与适用范围逐项核对',source_basis:'本地自制合成样页来源已核对',rights_basis:'合成图仅供本地验收的展示依据',checks:manualReviewChecks.map(()=>true),privacy_checks:privacyChecks.map(()=>true)});
  const transfer=data=>({...binding(data),catalog_revision:data.catalog_revision,confirmed:true,title:'合成长册说明书',public_description:'不含真实设备、个人资料的合成说明书。',product_name:manual.product_name,region_display:manual.region_display,edition_display:manual.edition_display,...(manual.sharing_scope==='reading-copy'?{object_type:'RPR',accession_date:'2000-01-02'}:{official_source_name:'合成官方来源',checked_on:'2026-01-01',source_available:true})});
  return {...f,store,accountId,submissionId:draft.id,submissionRoot,base,detail,binding,approval,transfer};
}
