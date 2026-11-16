// 只用合成资料；online模式仍走正式JWT校验，未向生产代码加入测试入口。
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {randomBytes,randomUUID} from 'node:crypto';
import {createManualOnlineFixture} from './manuals-online-fixture.mjs';
import {createSubmissionStore,privacyChecks} from '../../submissions.mjs';
import {manualReviewChecks} from '../../../shared/manual-review.mjs';
import {manualConsentVersion} from '../../../shared/manual-workflow.mjs';
const site=fileURLToPath(new URL('../../../site/',import.meta.url));
const sharp=createRequire(path.join(site,'package.json'))('sharp');
const key=()=>randomBytes(32).toString('hex');
export async function createOnlineReviewFixture(t,{pages=2,official=false,reviewEnabled=true,...options}={}){
  const f=await createManualOnlineFixture(t,{enabled:false,reviewEnabled,...options});
  const accountId='usr_'+('a'.repeat(24)),root=f.env.LJM_SUBMISSION_DATA_DIR;
  const store=createSubmissionStore({root,siteDirectory:site});
  const manual={schema_version:1,brand_name:'线上审核合成品牌',model_texts:['ONLINE-82'],product_name:'合成测试物件',category_key:'tools',document_kind:'user-guide',languages:['zh-CN'],completeness:'complete',region_display:'地区未注明',edition_display:'合成一版',source_note:'自制合成样页，仅供隔离验收',rights_basis:official?'official-link':'own-work',sharing_scope:official?'official-link':'reading-copy',people:'none',attribution:'anonymous',...(official?{official_url:'https://support.example.com/manual'}:{})};
  const draft=await store.createAccountManualDraft({accountId,payload:{request_key:key(),manual}});
  const jpeg=await sharp({create:{width:240,height:320,channels:3,background:'#e9ddc3'}}).jpeg().toBuffer();
  for(let i=0;i<pages;i++)await store.uploadAccountManualPage({id:draft.id,accountId,payload:{operation_id:key(),revision:i+1,copies_confirmed:true,image:{name:'screened-online-'+i+'.jpg',type:'image/jpeg',buffer:jpeg}}});
  await store.operateAccountManualSubmission({id:draft.id,accountId,payload:{action:'submit',operation_id:key(),revision:pages+1,consent_version:manualConsentVersion,consents:{copies:true,rights:true,privacy:true,processing:true}}});
  const file=path.join(root,draft.id,'record.json'),raw=async()=>JSON.parse(await fs.readFile(file,'utf8'));
  const mutate=async fn=>{const r=await raw();await fn(r);await fs.writeFile(file,JSON.stringify(r),{mode:0o600});};
  const approval=r=>({revision:r.revision,submitted_revision:r.manual_submitted_revision,snapshot_digest:r.versions.find(v=>v.revision===r.manual_submitted_revision).digest,status:'approved',public_message:'合成审核通过，仍未公开',private_note:'PRIVATE-REVIEW-82',model_basis:'合成完整型号与适用范围核对',source_basis:'自制合成资料来源已核对',rights_basis:'仅用于隔离测试的合成作品',checks:manualReviewChecks.map(()=>true),privacy_checks:privacyChecks.map(()=>true)});
  const context=(actor=f.email)=>({online:true,actor,operationId:randomUUID(),stepId:randomUUID()});
  return {...f,store,accountId,id:draft.id,base:'/api/admin/manual-submissions/'+draft.id,file,raw,mutate,approval,context,jpeg};
}
