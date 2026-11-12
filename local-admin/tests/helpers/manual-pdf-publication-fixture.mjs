import fs from 'node:fs/promises';import path from 'node:path';
import {createPdfReviewFixture,sha} from './manual-pdf-review-fixture.mjs';
import {createManualFixture} from './manuals-fixture.mjs';
import {createSubmissionStore} from '../../submissions.mjs';
import {createManualHttpFixture} from './manuals-http-fixture.mjs';
import {addReviewPdf,pdfManual,key} from './manual-pdf-review-fixture.mjs';
import {createAccountStore,agreementVersion} from '../../accounts.mjs';import {createMailer} from '../../mail.mjs';import {sessionCookieName} from '../../account-server.mjs';
import {manualConsentVersion} from '../../../shared/manual-workflow.mjs';import {manualPdfConsentStatements,manualPdfConfirmationVersion,manualPdfReviewChecks} from '../../../shared/manual-pdf-review.mjs';import {manualReviewChecks} from '../../../shared/manual-review.mjs';import {privacyChecks} from '../../submissions.mjs';
export async function createPdfPublicationFixture(t,{pages=3,runtime}={}){
  const f=await createPdfReviewFixture(t,runtime?{runtime}:{pages}),catalog=await createManualFixture(t);
  const store=createSubmissionStore({root:path.join(f.root,'submissions'),siteDirectory:catalog.site,pdfGenerationRuntime:f.runtime});
  const raw=()=>store.getManualReview(f.id);let draft=null,archiveCalls=0;
  const transfer=r=>({...f.binding(r),catalog_revision:'',confirmed:true,title:'合成PDF整理手册',public_description:'自制隔离测试公开简介',product_name:r.manual_metadata.product_name,region_display:'地区未注明',edition_display:'合成第一版',object_type:'OTH',accession_date:'2000-01-01'});
  const callbacks={planCatalog:catalog.store.planReviewedImport,importCatalog:catalog.store.importReviewed,createArchive:async input=>{
    archiveCalls++;const page_map=[];for(const [index,page]of input.manual_submission.pages.entries()){const filename='page-'+(index+1)+'-public.jpg',bytes=await input.readImage(page.page_id);if(sha(bytes)!==page.sha256)throw new Error('Synthetic copied image mismatch');const attachment_ref='/archive/'+catalog.id+'/'+filename;await fs.writeFile(path.join(catalog.site,'public',attachment_ref),bytes);page_map.push({attachment_ref,printed_label:page.printed_label});}
    draft={source_submission_id:f.id,manual_submission:{...input.manual_submission,pages:input.manual_submission.pages.map((p,i)=>({...p,attachment_ref:page_map[i].attachment_ref}))},record:{core:{item_id:catalog.id,publication_file_path:page_map.map(p=>p.attachment_ref)}}};
    return {item_id:catalog.id,page_map};
  }};
  const approve=async()=>{await f.submitBook();const r=await raw();await store.reviewManualSubmission(f.id,f.approval(r));return raw();};
  const handoff=async()=>{let r=await raw();if(r.status!=='approved')r=await approve();const body={...transfer(r),catalog_revision:(await catalog.store.bootstrap()).revision};return store.transferManualSubmission(f.id,body,callbacks);};
  const images=async()=>Promise.all(draft.record.core.publication_file_path.map(async ref=>({filename:path.basename(ref),sha256:sha(await fs.readFile(path.join(catalog.site,'public',ref)))})));
  return {...f,catalog,store,raw,approve,handoff,transfer,callbacks,images,get draft(){return draft;},get archiveCalls(){return archiveCalls;}};
}

// 零依赖生成合成PDF，只有页号和色块；不是对真实文件检查的替代品。
export function syntheticPdf(pages=12){
  const objects=[null,'<< /Type /Catalog /Pages 2 0 R >>',`<< /Type /Pages /Count ${pages} /Kids [${Array.from({length:pages},(_,i)=>(4+i*2)+' 0 R').join(' ')}] >>`,'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];
  for(let n=1;n<=pages;n++){const landscape=n===2,w=landscape?842:595,h=landscape?595:842;let drawing=`BT /F1 18 Tf 40 ${h-55} Td (SYNTHETIC PDF65 ONLY - PAGE ${String(n).padStart(3,'0')} / ${pages}) Tj ET\n0.15 0.3 0.4 rg 40 150 250 90 re f\n`;
    for(let bit=0;bit<8;bit++)drawing+=`${(n>>bit)&1?'0':'1'} g ${40+bit*16} 60 12 12 re f\n`;
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${w} ${h}] /Resources << /Font << /F1 3 0 R >> >> /Contents ${5+(n-1)*2} 0 R >>`,`<< /Length ${Buffer.byteLength(drawing)} >>\nstream\n${drawing}endstream`);
  }
  let text='%PDF-1.4\n',offsets=[0];for(let i=1;i<objects.length;i++){offsets.push(Buffer.byteLength(text));text+=`${i} 0 obj\n${objects[i]}\nendobj\n`;}const xref=Buffer.byteLength(text);text+=`xref\n0 ${objects.length}\n0000000000 65535 f \n${offsets.slice(1).map(n=>String(n).padStart(10,'0')+' 00000 n \n').join('')}trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;return Buffer.from(text);
}

export const isolatedPdfBuild=`import fs from 'node:fs/promises';import path from 'node:path';import assert from 'node:assert/strict';
const root=path.resolve('.'),dist=path.resolve('dist');assert(path.basename(root)==='site'&&path.basename(path.dirname(root)).startsWith('ljm-manuals-phase3-'));assert.equal(path.dirname(dist),root);
const read=async p=>{try{return await fs.readFile(p,'utf8')}catch{return ''}};const n=Number(await read('build-count'))+1;await fs.writeFile('build-count',String(n));await fs.rm(dist,{recursive:true,force:true});await fs.mkdir(dist);await fs.cp('public/archive','dist/archive',{recursive:true});await fs.writeFile('dist/index.html','ISOLATED-PDF65-BUILD-'+n);
if(await read('build-fail'))throw new Error('SYNTHETIC-PDF65-BUILD-FAIL');console.log('isolated PDF65 build passed');\n`;

export async function createNativePdfPublicationFixture(t,{pages=12,generate=true}={}){
  const sourceSite=path.resolve('site'),nodePathBefore=process.env.NODE_PATH;let f;
  try{process.env.NODE_PATH=path.join(sourceSite,'node_modules');f=await createManualHttpFixture();}finally{if(nodePathBefore===undefined)delete process.env.NODE_PATH;else process.env.NODE_PATH=nodePathBefore;}
  await fs.writeFile(path.join(f.site,'build.mjs'),isolatedPdfBuild);
  const privateRoot=path.dirname(f.root),directory=f.env.LJM_ACCOUNT_DATA_DIR,outbox=path.join(directory,'mail-outbox');
  const accounts=createAccountStore({directory,mailer:createMailer({transport:'file',environment:'development',directory:outbox}),environment:'development',ipSalt:''});let accountClosed=false;
  const closeAccounts=()=>{if(!accountClosed){accounts.close();accountClosed=true;}};
  const email='pdf65-owner@example.invalid',ip='10.65.0.1',requested=await accounts.requestLoginCode({email,ip});
  const mails=await Promise.all((await fs.readdir(outbox)).filter(n=>n.endsWith('.json')).map(async n=>JSON.parse(await fs.readFile(path.join(outbox,n),'utf8')))),mail=mails.find(m=>m.to===email&&m.variables?.purpose==='login'),verified=await accounts.verifyLoginCode({email,ip,ticket:requested.ticket,code:mail.text.match(/\d{6}/)[0],client:'pdf65-synthetic'});
  const user=await accounts.completeOnboarding({onboardingTicket:verified.onboarding_ticket,agreement:agreementVersion,agreed:true,nickname:'PDF65合成账号',client:'pdf65-synthetic',ip});
  const submissions=createSubmissionStore({root:f.env.LJM_SUBMISSION_DATA_DIR,siteDirectory:sourceSite}),manual={...pdfManual,brand_name:'6.5合成品牌',model_texts:['SYNTHETIC-PDF65-'+pages],product_name:'合成PDF65物件'},book=await addReviewPdf({submissions,users:[user]},{manual,bytes:syntheticPdf(pages)});
  const close=async()=>{await submissions.waitForPdfGenerationIdle();closeAccounts();await f.dispose();};if(t)t.after(close);
  const owner=async(route,{method='GET',body}={})=>{const response=await fetch(f.origin+route,{method,headers:{Cookie:sessionCookieName+'='+user.token,Origin:f.origin,'X-LJM-Account-Request':'1',...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});return {status:response.status,body:await response.json()};};
  const base='/api/admin/manual-submissions/'+book.id,getOwner=async()=>(await owner('/api/account/manual-submissions/'+book.id)).body;
  if(generate){const r=await getOwner();await submissions.beginAccountManualPdfGeneration({...book,payload:{operation_id:key(),revision:r.revision,profile:'standard'}});await submissions.waitForPdfGenerationIdle();}
  const detail=async()=>{const result=await f.get(base);if(result.status!==200)throw new Error(JSON.stringify(result.body));return result.body;};
  const binding=r=>({revision:r.revision,submitted_revision:r.manual_submitted_revision,snapshot_digest:r.versions.at(-1).digest});
  const submit=async()=>{const r=await getOwner(),result=await owner('/api/account/manual-submissions/'+book.id+'/operate',{method:'POST',body:{action:'submit',operation_id:key(),revision:r.revision,consent_version:manualConsentVersion,consents:{copies:true,rights:true,privacy:true,processing:true},pdf_confirmation:{version:manualPdfConfirmationVersion,token:r.manual_pdf_review.confirmation_token,checks:Object.fromEntries(Object.keys(manualPdfConsentStatements).map(k=>[k,true]))}}});if(result.status!==200)throw new Error(JSON.stringify(result.body));return result;};
  const approval=r=>({...binding(r),status:'approved',public_message:'合成PDF65初审通过',private_note:'PRIVATE-PDF65-ADMIN',model_basis:'合成品牌型号及各页标记核对',source_basis:'本测试程序生成的合成PDF',rights_basis:'仅用于隔离验收的自制资料',checks:manualReviewChecks.map(()=>true),privacy_checks:privacyChecks.map(()=>true),pdf_checks:manualPdfReviewChecks.map(()=>true)});
  const transfer=data=>({...binding(data.record),catalog_revision:data.catalog_revision,confirmed:true,title:'合成PDF65说明书',public_description:'程序生成的合成阅读资料，不含真实人物或产品。',product_name:manual.product_name,region_display:'地区未注明',edition_display:'合成第一版',object_type:'RPR',accession_date:'2000-01-02'});
  const handoff=async()=>{await submit();let data=await detail(),result=await f.post(base+'/review',approval(data.record));if(result.status!==200)throw new Error(JSON.stringify(result.body));data=await detail();result=await f.post(base+'/transfer',transfer(data));if(result.status!==200)throw new Error(JSON.stringify(result.body));return result.body;};
  const archiveRow=async itemId=>(await f.get('/api/bootstrap?format=split-v1')).body.records.find(r=>r.core.item_id===itemId);
  const prepareArchive=async itemId=>{const row=await archiveRow(itemId);Object.assign(row.core,{batch_id:'SYNTHETIC-PDF65-ONLY',physical_location:'隔离测试目录',rights_status:'OWN',digitization_status:'DG1'});let saved=await f.post('/api/save-draft',{isNew:false,expectedRevision:row._admin.revision,record:row,images:row.core.publication_file_path.map(src=>({kind:'existing',filename:path.basename(src)}))});if(saved.status!==200)throw new Error(JSON.stringify(saved.body));const review=await f.post('/api/publication-review',{itemId,expectedRevision:saved.body.revision});if(review.status!==200||review.body.issues.length)throw new Error(JSON.stringify(review.body));return {itemId,expectedRevision:saved.body.revision,reviewId:review.body.reviewId,confirmations:Array(13).fill(true)};};
  const publishArchive=async itemId=>f.post('/api/publish',await prepareArchive(itemId));
  const prepareCatalog=async()=>{const state=(await f.get('/api/manuals')).body,checked=await f.post('/api/manuals/review',{expectedRevision:state.revision});if(checked.status!==200||checked.body.issues.length)throw new Error(JSON.stringify(checked.body));return {expectedRevision:state.revision,review_id:checked.body.review_id,confirmations:Array(5).fill(true)};};
  return {...f,...book,privateRoot,user,accounts,closeAccounts,close,submissions,owner,getOwner,base,detail,approval,transfer,handoff,submit,archiveRow,prepareArchive,publishArchive,prepareCatalog};
}
