// 全新临时目录、虚构账号与合成字节；状态测试不调用真实解析器。
import fs from 'node:fs/promises';import path from 'node:path';import {Readable} from 'node:stream';import {randomBytes,createHash} from 'node:crypto';import {createRequire} from 'node:module';
import {createManualAccountFixture} from './manual-account-fixture.mjs';
import {manualConsentVersion} from '../../../shared/manual-workflow.mjs';
import {manualPdfConfirmationVersion,manualPdfConsentStatements,manualPdfReviewChecks} from '../../../shared/manual-pdf-review.mjs';
import {manualReviewChecks} from '../../../shared/manual-review.mjs';import {privacyChecks} from '../../submissions.mjs';
const sharp=createRequire(new URL('../../../site/package.json',import.meta.url))('sharp');
export const key=()=>randomBytes(32).toString('hex'),sha=v=>createHash('sha256').update(v).digest('hex');
export const pdfBytes=Buffer.from('%PDF-1.4\nSYNTHETIC PRIVATE PDF REVIEW 6.4\n%%EOF\n');
export const pdfManual={schema_version:1,brand_name:'6.4合成品牌',model_texts:['SYNTHETIC-PDF-REVIEW-64'],product_name:'虚构说明书',category_key:'tools',document_kind:'user-guide',languages:['zh-CN'],completeness:'complete',source_note:'自制合成资料，不对应真实人物或产品',rights_basis:'own-work',sharing_scope:'reading-copy',people:'none',attribution:'anonymous'};
export function reviewRuntime({pages=3,warnings=[],gate=null}={}){
  let fingerprint='a'.repeat(64),ready=true,stopped=false;const calls={opens:0,pages:[]};
  return {calls,setEngine:value=>{fingerprint=value;},setReady:value=>{ready=value;},status:async()=>({available:ready,message:'合成状态测试执行器'}),configuration:async()=>{if(!ready)throw new Error('synthetic runtime off');return {fingerprint,version:'synthetic-review-64'};},open:async()=>{calls.opens++;stopped=false;return {cancel:async()=>{stopped=true;},close:async()=>({cleanup:true})};},recover:async()=>({cleanup:true}),
    inspect:async()=>{if(gate)await gate();if(stopped)throw Object.assign(new Error('cancelled'),{pdfCode:'cancelled'});const geometry=Array.from({length:pages},(_,index)=>({page:index+1,width:595,height:842,rotation:0}));return {pages,geometry,warnings,diagnostic_bytes:0,inspection:{schema:1,checked_at:new Date().toISOString(),pages,encrypted:false,javascript:false,form:'none',attachments:0,pdf_version:'1.4',geometry,warnings:[...warnings]}};},
    render:async(_,source,page)=>{if(stopped)throw Object.assign(new Error('cancelled'),{pdfCode:'cancelled'});calls.pages.push(page);const buffer=await sharp({create:{width:24,height:32,channels:3,background:{r:100+page%100,g:145,b:180}}}).jpeg().toBuffer();return {buffer,width:24,height:32,diagnostic_bytes:0};},
  };
}
export async function addReviewPdf(f,{id=null,user=f.users[0],bytes=pdfBytes,manual=pdfManual}={}){
  const accountId=user.user.id;if(!id){const made=await f.submissions.createAccountManualDraft({accountId,payload:{request_key:key(),manual}});id=made.id;await f.submissions.setAccountManualMaterial({id,accountId,payload:{operation_id:key(),revision:1,source_format:'pdf'}});}
  const before=await f.submissions.getAccountManualSubmission({id,accountId}),prepared=await f.submissions.prepareAccountManualPdf({id,accountId,payload:{operation_id:key(),revision:before.revision,name:'screened-6-4.pdf',bytes:bytes.length,sha256:sha(bytes),copies_confirmed:true}}),request=Readable.from([bytes]);request.headers={'content-type':'application/pdf','content-length':String(bytes.length)};
  await f.submissions.receiveAccountManualPdf({id,accountId,uploadId:prepared.upload_id,request});return {id,accountId};
}
export async function createPdfReviewFixture(t,{runtime=reviewRuntime(),pages,generate=true,handlerOptions={}}={}){
  if(pages!==undefined)runtime=reviewRuntime({pages});const f=await createManualAccountFixture({submissionOptions:{pdfGenerationRuntime:runtime},handlerOptions});
  t.after(async()=>{await f.submissions.waitForPdfGenerationIdle();await f.close();});const book=await addReviewPdf(f);
  const get=()=>f.submissions.getAccountManualSubmission(book),rawFile=path.join(f.root,'submissions',book.id,'record.json'),raw=async()=>JSON.parse(await fs.readFile(rawFile,'utf8'));
  const generateBook=async(profile='standard')=>{const r=await get(),operation_id=key();await f.submissions.beginAccountManualPdfGeneration({...book,payload:{operation_id,revision:r.revision,profile}});await f.submissions.waitForPdfGenerationIdle();return get();};
  const submitPayload=r=>({action:'submit',operation_id:key(),revision:r.revision,consent_version:manualConsentVersion,consents:{copies:true,rights:true,privacy:true,processing:true},...(r.manual_metadata.sharing_scope==='reading-copy'?{pdf_confirmation:{version:manualPdfConfirmationVersion,token:r.manual_pdf_review.confirmation_token,checks:Object.fromEntries(Object.keys(manualPdfConsentStatements).map(k=>[k,true]))}}:{})});
  const operate=payload=>f.submissions.operateAccountManualSubmission({...book,payload}),submitBook=async()=>operate(submitPayload(await get()));
  const binding=r=>({revision:r.revision,submitted_revision:r.manual_submitted_revision,snapshot_digest:r.versions.at(-1).digest});
  const approval=r=>({...binding(r),status:'approved',public_message:'合成审核通过，仍私密保存',private_note:'PRIVATE-PDF-REVIEW-64',model_basis:'自制合成型号核对依据',source_basis:'自制合成来源核对依据',rights_basis:'自制合成权利依据',checks:manualReviewChecks.map(()=>true),privacy_checks:privacyChecks.map(()=>true),...(r.versions.at(-1).pdf?{pdf_checks:manualPdfReviewChecks.map(()=>true)}:{})});
  if(generate)await generateBook();return {...f,...book,runtime,get,rawFile,raw,generateBook,operate,submitPayload,submitBook,binding,approval,base:'/api/account/manual-submissions/'+book.id};
}
