// 6.3：一个环境顺序生成整册，全部页图核对完成后才原子切换本人私密预览。
import fs from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {manualPdfGenerationLimits as limits,manualPdfProfiles,manualPdfJobPattern,manualPdfJobActive,manualPdfJobStates,manualPdfJobLabels,normalizeManualPdfGeneration} from '../shared/manual-pdf-generation.mjs';
import {manualPdfSourcePattern} from '../shared/manual-pdf-upload.mjs';
import {submissionPayloadUsage} from './submission-storage.mjs';
import {pdfFileDigest} from './manual-pdf-windows.mjs';
import {createLocalManualPdfRuntime,pdfGenerationMessages} from './manual-pdf-runtime.mjs';
import {manualPdfPageIdentity} from '../shared/manual-pdf-review.mjs';
import {verifiedLinuxPdfGeneration} from './manual-pdf-attestation.mjs';
const coordinators=new Map();
const sha=x=>createHash('sha256').update(x).digest('hex');
const fail=(message,statusCode=409,pdfCode='processing_failed')=>{throw Object.assign(new Error(message),{name:'SubmissionError',statusCode,pdfCode});};
const processAlive=pid=>{try{process.kill(pid,0);return true;}catch(e){return e.code!=='ESRCH';}};
const scratchBytes=2*limits.pageBytes+limits.diagnosticBytes;
export function createManualPdfJobStore({root,read,all,locked,ownedBy,safeAccountId,writeRecord,atomicJson,uploadStore,checkStorageLimit,globalUsage,maxStorageBytes,runtime=createLocalManualPdfRuntime(),options={}}){
  const now=options.now??Date.now,alive=options.processAlive??processAlive;
  const clock=()=>new Date(now()).toISOString();
  if(!coordinators.has(root))coordinators.set(root,{queue:[],active:new Map(),busy:false,timer:null});
  const coordinator=coordinators.get(root);
  const recordFolder=id=>{if(!/^TG-[A-F0-9]{24}$/.test(id??''))fail('投稿编号无效。',404);return path.join(root,id);};
  const jobFolder=(id,j)=>{if(!manualPdfJobPattern.test(j??''))fail('生成任务编号无效。',404);return path.join(recordFolder(id),'pdf','jobs',j);};
  const jobId=(r,key)=>'PG-'+sha(r.account_id+':'+r.id+':'+key).slice(0,24);
  const owned=async(id,account)=>{const r=ownedBy(await read(id),safeAccountId(account));if(r.submission_kind!=='manual')fail('找不到这份说明书。',404);return r;};
  const editable=r=>{if(r.status!=='draft'||r.manual_handoff||r.withdrawal_requested)fail('只有尚未进入整理的私密草稿可以生成PDF页面。');};
  const save=job=>atomicJson(path.join(jobFolder(job.submission_id,job.job_id),'job.json'),job);
  async function load(id,j){try{const job=JSON.parse(await fs.readFile(path.join(jobFolder(id,j),'job.json'),'utf8'));if(job.schema!==1||job.job_id!==j||job.submission_id!==id||!manualPdfJobStates.has(job.state)||!Number.isSafeInteger(job.budget_bytes)||job.budget_bytes<0||job.budget_bytes>200*1024*1024||!Array.isArray(job.pages)||job.pages.length>limits.pages)fail('PDF任务记录无法核对，请联系维护者。',503);return job;}catch(e){if(e.code==='ENOENT')return null;throw e;}}
  async function jobs(r){const folder=path.join(recordFolder(r.id),'pdf','jobs'),rows=await fs.readdir(folder,{withFileTypes:true}).catch(e=>{if(e.code==='ENOENT')return [];throw e;});const result=[];for(const e of rows){if(e.isSymbolicLink())fail('PDF私密任务目录出现链接，已停止处理。',503);if(e.isDirectory()&&manualPdfJobPattern.test(e.name)){const job=await load(r.id,e.name);if(job)result.push(job);}}return result.sort((a,b)=>b.created_at.localeCompare(a.created_at));}
  const applied=(r,job)=>(r.manual_pdf_render_saved??[]).some(x=>x.job_id===job.job_id&&x.operation_id===job.operation_id&&x.digest===job.pages_digest);
  const live=job=>manualPdfJobActive.has(job.state)||job.state==='needs_review';
  async function transaction(id,account,fn){const until=Date.now()+5000;while(true){try{return await locked('account-quota-'+safeAccountId(account),()=>locked('intake',()=>locked(id,fn)));}catch(e){if(e.statusCode!==409||!String(e.message).includes('当前正在处理')||Date.now()>=until)throw e;await new Promise(r=>setTimeout(r,20));}}}
  async function assertIdle(r){if((await jobs(r)).some(j=>live(j)&&!applied(r,j)))fail('本册仍有PDF生成任务，请先核对进度或停止本次生成。');}
  async function sourceFile(r,source){if(!source||!manualPdfSourcePattern.test(source.filename??''))fail('请先私密保存一份PDF。');const file=path.join(recordFolder(r.id),'pdf',source.filename);const stat=await fs.lstat(file);if(!stat.isFile()||stat.isSymbolicLink()||stat.size!==source.bytes||await pdfFileDigest(file)!==source.sha256)fail(pdfGenerationMessages.source_changed,409,'source_changed');return file;}
  const currentSource=r=>(r.manual_pdf_sources??[]).find(s=>s.source_id===r.manual_pdf_current_source_id);
  async function copyInput(source,target,expected){const out=await fs.open(target,'wx',0o600),digest=createHash('sha256');let bytes=0;try{for await(const chunk of createReadStream(source)){bytes+=chunk.length;if(bytes>expected.bytes)fail(pdfGenerationMessages.source_changed,409,'source_changed');digest.update(chunk);await out.writeFile(chunk);}if(bytes!==expected.bytes||digest.digest('hex')!==expected.sha256)fail(pdfGenerationMessages.source_changed,409,'source_changed');await out.sync();}finally{await out.close();}}
  const stillBound=(r,job)=>r.status==='draft'&&!r.withdrawal_requested&&!r.manual_handoff&&r.source_format==='pdf'&&r.revision===job.base_revision&&currentSource(r)?.source_id===job.source.source_id&&currentSource(r)?.sha256===job.source.sha256;
  function manifestDigest(pages){return sha(JSON.stringify(pages.map(({page_id,filename,bytes,sha256,width,height,source_page})=>({page_id,filename,bytes,sha256,width,height,source_page}))));}
  async function verifyPages(job){
    if(!Number.isSafeInteger(job.page_count)||job.page_count<1||job.page_count>limits.pages||job.pages.length!==job.page_count||manifestDigest(job.pages)!==job.pages_digest)fail('整册页面清单无法核对。',409,'page_output');
    const seen=new Set();for(let index=0;index<job.pages.length;index++){const page=job.pages[index];if(page.source_page!==index+1||!/^manual-[a-f0-9]{64}\.jpg$/.test(page.filename)||seen.has(page.filename)||!/^[a-f0-9]{64}$/.test(page.sha256)||!Number.isSafeInteger(page.bytes)||page.bytes<1||page.bytes>limits.pageBytes)fail('整册页序或图片清单无法核对。',409,'page_output');seen.add(page.filename);const file=path.join(jobFolder(job.submission_id,job.job_id),'pages',page.filename),stat=await fs.lstat(file);if(!stat.isFile()||stat.isSymbolicLink()||stat.size!==page.bytes||await pdfFileDigest(file)!==page.sha256)fail('生成页面与留存摘要不一致，已停止显示。',409,'page_output');}
  }
  async function disposeParts(job){
    for(const relative of ['work','pages']){
      const base=path.join(jobFolder(job.submission_id,job.job_id),relative);
      async function visit(dir,depth=0){if(depth>6)fail('处理临时文件层级无法核对。',503);for(const e of await fs.readdir(dir,{withFileTypes:true}).catch(err=>{if(err.code==='ENOENT')return [];throw err;})){if(e.isSymbolicLink())fail('处理临时文件出现链接，已停止清理。',503);const file=path.join(dir,e.name);if(e.isDirectory())await visit(file,depth+1);else if(e.isFile()&&e.name.endsWith('.part')){const resolved=path.resolve(file);if(!resolved.startsWith(path.resolve(base)+path.sep))fail('临时路径无法核对。',503);await fs.unlink(file);}}}
      await visit(base);
    }
  }
  const activeKey=job=>job.submission_id+':'+job.job_id;
  async function reconcile(r){
    for(const job of await jobs(r)){
      if(applied(r,job)){if(job.state!=='succeeded'){await verifyPages(job);job.state='succeeded';job.budget_bytes=0;job.message='已通过原任务回执找回整册结果，未重复生成。';await save(job);}continue;}
      if(job.state==='needs_review'&&job.cleanup_pending===true&&!coordinator.active.has(activeKey(job))){
        // 只处理明确记为“清理待确认”的Linux失败；提交中和其他待核对状态仍需人工判断。
        try{await runtime.recover(jobFolder(r.id,job.job_id));await disposeParts(job);job.state=job.pending_stop_reason==='cancelled'?'cancelled':'interrupted';job.budget_bytes=0;job.cleanup_pending=false;job.message='已确认旧处理进程和临时源结束，未自动重跑；旧预览和已生成页图仍保留，可重新发起。';job.updated_at=clock();await save(job);}catch{}
        continue;
      }
      if(job.state==='succeeded'){job.state='needs_review';job.message='生成回执与草稿绑定不一致，完整页图仍保留，请联系维护者。';await save(job);continue;}
      if(!manualPdfJobActive.has(job.state)||coordinator.active.has(activeKey(job))||coordinator.queue.some(x=>x.job.job_id===job.job_id))continue;
      if(alive(job.owner_pid)){
        if(job.owner_pid!==process.pid)continue;
        const state=await fs.readFile(path.join(jobFolder(r.id,job.job_id),'control','native-state.json'),'utf8').then(JSON.parse,()=>null);
        if(state?.closed!==true||state?.cleanup!==true){job.state='needs_review';job.message='本次执行结果或进程标记需要维护者核对，已有文件仍保留。';await save(job);continue;}
      }
      try{await runtime.recover(jobFolder(r.id,job.job_id));await disposeParts(job);job.state='interrupted';job.budget_bytes=0;job.message='上次生成已中断，已生成页图和旧预览仍保留；可重新发起本次生成。';await save(job);}catch{job.state='needs_review';job.message='上次执行环境尚未安全结束，已保留文件和容量，请联系维护者核对。';await save(job);}
    }
  }
  function publicJob(r,job,operationId=''){
    if(!job)return {id:r.id,revision:r.revision,found:false,operation_id:operationId,state:'not_found',applied:false};
    const done=applied(r,job),state=done?'succeeded':job.state==='succeeded'?'needs_review':job.state;
    return {id:r.id,revision:r.revision,found:true,operation_id:job.operation_id,job_id:job.job_id,state,state_label:manualPdfJobLabels[state],applied:done,profile:job.profile,created_at:job.created_at,updated_at:job.updated_at,page_count:job.page_count??0,completed_pages:job.pages.length,warnings:job.warnings??[],message:!done&&job.state==='succeeded'?'生成回执与草稿绑定不一致，完整页图仍保留，请联系维护者。':job.message??'',error_code:job.error_code??'',can_cancel:manualPdfJobActive.has(state)&&state!=='committing',can_retry:['failed','cancelled','interrupted'].includes(state)};
  }
  async function describe(r){
    const list=await jobs(r),job=list.find(j=>live(j)&&!applied(r,j))??list[0]??null,used=await submissionPayloadUsage(recordFolder(r.id)),preview=r.manual_pdf_preview;
    let config=null;if(preview)try{config=await runtime.configuration();}catch{}
    let engineCurrent=config?config.fingerprint===preview?.engine_fingerprint:null;
    if(preview){const saved=list.find(j=>j.job_id===preview.job_id);if(saved?.execution_platform==='linux'||saved?.origin_attestation)engineCurrent=await verifiedLinuxPdfGeneration(saved,config,{trustFile:options.pdfGenerationTrustFile});}
    return {operation:job?publicJob(r,job):null,preview:preview?{pages:preview.pages,profile:preview.profile,generated_at:preview.generated_at,warnings:preview.warnings??[],source_current:preview.source_sha256===currentSource(r)?.sha256,engine_current:engineCurrent,job_id:preview.job_id}:null,stored_image_bytes:used.imageBytes,stored_images:used.imageCount,limits,profiles:manualPdfProfiles};
  }
  async function status({id,accountId,operationId}){if(!/^[a-f0-9]{64}$/.test(operationId??''))fail('生成操作凭证无效。',404);return transaction(id,accountId,async()=>{const r=await owned(id,accountId);await reconcile(r);return publicJob(r,await load(id,jobId(r,operationId)),operationId);});}
  async function begin({id,accountId,payload}){
    const op=normalizeManualPdfGeneration(payload),fingerprint=sha(JSON.stringify(op));
    const result=await transaction(id,accountId,async()=>{
      const r=await owned(id,accountId),j=jobId(r,op.operation_id),prior=await load(id,j);if(prior){if(prior.fingerprint!==fingerprint)fail('同一生成凭证的内容已改变，请重新读取。');return {response:publicJob(r,prior),job:null};}
      editable(r);await reconcile(r);await assertIdle(r);await uploadStore.assertUploadsIdle(r);
      if(r.source_format!=='pdf'||r.manual_metadata?.sharing_scope!=='reading-copy')fail('请先保存PDF资料方式和文件。');if(r.revision!==op.revision)fail('草稿版本已更新，请重新读取后生成。');
      const source=currentSource(r);await sourceFile(r,source);
      const config=await runtime.configuration(),list=await jobs(r);if(list.length>=limits.jobs)fail('本册生成任务已达200次上限，已有文件仍保留。',429);
      let active=0;for(const entry of await all())for(const other of await jobs(entry))if(live(other)&&!applied(entry,other)){active++;if(other.account_id===r.account_id)fail('本账号已有一册正在生成或等待，请先完成或停止该任务。',409);}
      if(active>=limits.queue+1)fail('当前生成队列已满，请稍后重试。',429);
      const used=await submissionPayloadUsage(recordFolder(id));if(used.imageCount>=limits.storedPages||used.imageBytes>=limits.bookBytes)fail('本册保留图片已达到100 MiB或1000份，不能再生成。',413);
      const extraCopies=config.transient_source_copies??0;if(![0,1].includes(extraCopies))fail('PDF暂存预算无法核对。',503);
      const budget=source.bytes*(1+extraCopies)+scratchBytes;await checkStorageLimit(accountId,budget);if((await globalUsage()).allocatedBytes+budget>maxStorageBytes)fail('私密暂存区空间不足，旧PDF和预览仍保留。',503);
      const at=clock(),job={schema:1,job_id:j,submission_id:id,account_id:r.account_id,operation_id:op.operation_id,fingerprint,base_revision:r.revision,source:{...source},profile:op.profile,engine_fingerprint:config.fingerprint,tool_version:config.version,transient_source_copies:extraCopies,...(config.requires_attestation?{execution_platform:config.execution_platform,requires_attestation:true}:{}),owner_pid:process.pid,state:'queued',created_at:at,updated_at:at,budget_bytes:budget,pages:[],page_count:0,warnings:[],message:'已排队等待受限生成；旧预览仍保留。'};
      await fs.mkdir(jobFolder(id,j),{recursive:true,mode:0o700});await save(job);return {response:publicJob(r,job),job};
    });
    if(result.job){coordinator.queue.push({job:result.job,run:runJob});void pump();}return result.response;
  }
  async function cancel({id,accountId,operationId}){
    if(!/^[a-f0-9]{64}$/.test(operationId??''))fail('生成操作凭证无效。',404);let stop;
    const result=await transaction(id,accountId,async()=>{
      const r=await owned(id,accountId),job=await load(id,jobId(r,operationId));if(!job)return publicJob(r,null,operationId);if(applied(r,job))return publicJob(r,job);
      if(['committing','needs_review','succeeded'].includes(job.state))fail('完整结果需要核对，不能按未完成任务取消或删除。');
      if(!manualPdfJobActive.has(job.state))return publicJob(r,job);
      stop=coordinator.active.get(activeKey(job));
      if(job.state==='queued'&&!stop){job.state='cancelled';job.budget_bytes=0;job.message=pdfGenerationMessages.cancelled;await save(job);return publicJob(r,job);}
      job.state='cancelling';job.message='正在停止受限处理，旧预览和已生成页图仍保留。';job.updated_at=clock();await save(job);await fs.mkdir(path.join(jobFolder(id,job.job_id),'control'),{recursive:true,mode:0o700});await fs.writeFile(path.join(jobFolder(id,job.job_id),'control','cancel.json'),'{}',{mode:0o600});return publicJob(r,job);
    });
    if(stop)void stop.cancel('cancelled');return result;
  }
  async function change(job,fn){return transaction(job.submission_id,job.account_id,async()=>{const fresh=await load(job.submission_id,job.job_id),r=await owned(job.submission_id,job.account_id);await fn(fresh,r);fresh.updated_at=clock();await save(fresh);return fresh;});}
  async function runJob(initial){
    let job=initial,session=null,reason=null,clean=true;const controller={cancel:async code=>{reason=code;if(session)await session.cancel();}};coordinator.active.set(activeKey(job),controller);
    let deadline;
    try{
      job=await change(job,(fresh,r)=>{if(fresh.state!=='queued')fail('本次生成已停止。',409,'cancelled');if(!stillBound(r,fresh))fail('草稿或PDF已改变，旧预览仍保留。',409,'binding_changed');fresh.state='inspecting';fresh.message='正在检查PDF结构、附件、字体和全部页面尺寸。';});
      deadline=setTimeout(()=>void controller.cancel('timeout'),options.bookMs??limits.bookMs);deadline.unref?.();
      const folder=jobFolder(job.submission_id,job.job_id),input=path.join(folder,'work','input','source.pdf.part');await fs.mkdir(path.dirname(input),{recursive:true,mode:0o700});await fs.mkdir(path.join(folder,'pages'),{recursive:true,mode:0o700});
      const r=await owned(job.submission_id,job.account_id),source=await sourceFile(r,job.source);await copyInput(source,input,job.source);
      session=await runtime.open(folder,job);if(reason)await session.cancel();const info=await runtime.inspect(session,input);if(info.pages<1||info.pages>limits.pages)fail(pdfGenerationMessages.page_count,409,'page_count');
      job=await change(job,fresh=>{if(fresh.state==='cancelling'||reason)fail(pdfGenerationMessages[reason??'cancelled'],409,reason??'cancelled');fresh.state='rendering';fresh.page_count=info.pages;fresh.geometry=info.geometry;fresh.inspection=info.inspection??null;fresh.warnings=info.warnings??[];fresh.diagnostic_bytes=info.diagnostic_bytes??0;fresh.message='文件检查完成，正在逐页生成；完成前不替换旧预览。';});
      for(let page=1;page<=info.pages;page++){
        if(reason)fail(pdfGenerationMessages[reason],409,reason);
        job=await change(job,async(fresh,record)=>{
          if(fresh.state==='cancelling')fail(pdfGenerationMessages.cancelled,409,'cancelled');if(!stillBound(record,fresh))fail('草稿或PDF已改变，本次结果未替换旧预览。',409,'binding_changed');
          const copies=fresh.transient_source_copies??0;if(![0,1].includes(copies))fail('PDF暂存预算无法核对。',503);
          const wanted=fresh.source.bytes*(1+copies)+fresh.pages.reduce((n,p)=>n+p.bytes,0)+scratchBytes,added=Math.max(0,wanted-fresh.budget_bytes);await checkStorageLimit(job.account_id,added);if((await globalUsage()).allocatedBytes+added>maxStorageBytes)fail('私密暂存区空间不足，生成已停止，旧预览仍保留。',503,'capacity');fresh.budget_bytes=wanted;
        });
        const image=await runtime.render(session,input,page,job.profile,info.geometry[page-1]);
        job=await change(job,async(fresh,record)=>{
          if(reason||fresh.state==='cancelling')fail(pdfGenerationMessages[reason??'cancelled'],409,reason??'cancelled');if(!stillBound(record,fresh))fail('草稿或PDF已改变，本次结果未替换旧预览。',409,'binding_changed');
          const used=await submissionPayloadUsage(recordFolder(job.submission_id));if(used.imageBytes+image.buffer.length>limits.bookBytes||used.imageCount+1>limits.storedPages)fail('本册图片留存将超过100 MiB或1000份，旧预览仍保留。',413,'book_capacity');
          if(!Buffer.isBuffer(image.buffer)||!image.buffer.length||image.buffer.length>limits.pageBytes||image.width*image.height>8_000_000)fail(pdfGenerationMessages.page_output,409,'page_output');
          const digest=sha(image.buffer),filename='manual-'+sha(job.job_id+':'+page)+'.jpg',file=path.join(folder,'pages',filename),temporary=file+'.part';
          const handle=await fs.open(temporary,'wx',0o600);try{await handle.writeFile(image.buffer);await handle.sync();}finally{await handle.close();}try{await fs.access(file);fail('生成目标已存在，已停止避免覆盖。',409,'page_output');}catch(e){if(e.code!=='ENOENT')throw e;}await fs.rename(temporary,file);
          fresh.pages.push({filename,page_id:'MP-'+sha(job.job_id+':page:'+page).slice(0,24),bytes:image.buffer.length,sha256:digest,width:image.width,height:image.height,source_page:page,label:'',note:'',original_name:'源PDF第'+page+'页'});
          fresh.diagnostic_bytes+=(image.diagnostic_bytes??0);if(fresh.diagnostic_bytes>limits.diagnosticBytes)fail(pdfGenerationMessages.diagnostic_limit,409,'diagnostic_limit');if(image.warning&&!fresh.warnings.includes(image.warning))fresh.warnings.push(image.warning);fresh.peak_memory=Math.max(fresh.peak_memory??0,image.peak_memory??0);fresh.message='已生成 '+fresh.pages.length+'/'+fresh.page_count+' 页，尚未切换整册预览。';
        });
      }
      const closed=await session.close();session=null;
      if(job.requires_attestation){job=await change(job,async fresh=>{fresh.origin_attestation=closed?.origin_attestation;let config;try{config=await runtime.configuration();}catch{fail('PDF生成来源暂时无法核对，未替换旧预览。',503,'configuration_changed');}if(!await verifiedLinuxPdfGeneration(fresh,config,{trustFile:options.pdfGenerationTrustFile}))fail('PDF生成来源与整册页图不一致，未替换旧预览。',409,'page_output');});}
      await disposeParts(job);
      job.pages_digest=manifestDigest(job.pages);
      await transaction(job.submission_id,job.account_id,async()=>{
        const fresh=await load(job.submission_id,job.job_id),record=await owned(job.submission_id,job.account_id);if(reason||fresh.state==='cancelling')fail(pdfGenerationMessages[reason??'cancelled'],409,reason??'cancelled');if(!stillBound(record,fresh))fail('草稿或PDF已更新，本次完整结果仍保留，未替换旧预览。',409,'binding_changed');
        await sourceFile(record,fresh.source);fresh.pages_digest=manifestDigest(fresh.pages);await verifyPages(fresh);if(fresh.inspection)fresh.inspection.warnings=[...fresh.warnings];fresh.state='committing';fresh.message='全部页面已核对，正在保存整册预览。';fresh.helper_cleanup=true;await save(fresh);
        const at=clock(),next={...record,images:fresh.pages.map(p=>({...p})),revision:record.revision+1,updated_at:at,manual_pdf_preview:{job_id:fresh.job_id,source_id:fresh.source.source_id,source_sha256:fresh.source.sha256,profile:fresh.profile,engine_fingerprint:fresh.engine_fingerprint,pages_digest:fresh.pages_digest,pages:fresh.page_count,warnings:fresh.warnings,generated_at:at},manual_pdf_render_saved:[...(record.manual_pdf_render_saved??[]),{job_id:fresh.job_id,operation_id:fresh.operation_id,digest:fresh.pages_digest}],history:[...record.history,{at,action:'manual_pdf_generated'}]};
        delete next.manual_review_binding;await writeRecord(record.id,next);fresh.state='succeeded';fresh.budget_bytes=0;fresh.updated_at=at;fresh.message=fresh.warnings.length?'整册已生成，存在字体或版面提示，请逐页核对；尚未提交审核。':'整册已生成，请逐页核对；尚未提交审核。';await save(fresh);job=fresh;
      });
    }catch(error){
      if(error.pdfCleanupUncertain===true)clean=false;
      if(session){try{await session.cancel();await session.close();session=null;}catch{clean=false;}}
      if(clean)try{await disposeParts(job);}catch{clean=false;}
      try{await transaction(job.submission_id,job.account_id,async()=>{
        const fresh=await load(job.submission_id,job.job_id),r=await owned(job.submission_id,job.account_id);if(applied(r,fresh)){await verifyPages(fresh);fresh.state='succeeded';fresh.budget_bytes=0;fresh.message='已找回本次完整预览结果，没有重复生成。';}
        else if(!clean||fresh.state==='committing'){if(!clean&&fresh.execution_platform==='linux'&&manualPdfJobActive.has(fresh.state)&&fresh.state!=='committing'){fresh.cleanup_pending=true;fresh.pending_stop_reason=reason??error.pdfCode??'processing_failed';}fresh.state='needs_review';fresh.message='完整结果或临时执行权限需要维护者核对，已有文件和旧预览仍保留。';if(clean)fresh.budget_bytes=0;}
        else{fresh.state=reason==='cancelled'||!reason&&(fresh.state==='cancelling'||error.pdfCode==='cancelled')?'cancelled':'failed';fresh.error_code=reason??error.pdfCode??'processing_failed';fresh.message=pdfGenerationMessages[fresh.error_code]??(error.name==='SubmissionError'?error.message:pdfGenerationMessages.processing_failed);fresh.budget_bytes=0;}
        fresh.updated_at=clock();await save(fresh);
      });}catch{ /* 磁盘故障保留原任务与预留，下一次查询不会把未知结果当成功。 */ }
    }finally{clearTimeout(deadline);coordinator.active.delete(activeKey(job));}
  }
  async function recoverWorkerLock(){
    const lock=path.join(root,'.manual-pdf-worker.lock');let owner;try{owner=JSON.parse(await fs.readFile(path.join(lock,'owner.json'),'utf8'));}catch(e){if(e.code==='ENOENT'){const exists=await fs.lstat(lock).catch(error=>{if(error.code==='ENOENT')return null;throw error;});if(exists)fail('上次生成锁缺少可核对的进程标记，请联系维护者。',503);return;}throw e;}
    if(!Number.isSafeInteger(owner.pid)||alive(owner.pid))return;
    await runtime.recover(jobFolder(owner.submission_id,owner.job_id));
    // 删除的仅是已核实无原进程的本模块锁标记，不是业务文件。
    await fs.unlink(path.join(lock,'owner.json'));await fs.rmdir(lock);
  }
  async function pump(){
    if(coordinator.busy||!coordinator.queue.length)return;coordinator.busy=true;const item=coordinator.queue.shift();let retry=false;
    try{await recoverWorkerLock();await locked('manual-pdf-worker',async()=>{const owner=path.join(root,'.manual-pdf-worker.lock','owner.json');await atomicJson(owner,{pid:process.pid,submission_id:item.job.submission_id,job_id:item.job.job_id});try{await item.run(item.job);}finally{await fs.unlink(owner);}});}
    catch(e){if(e.statusCode===409||e.code==='ENOENT'){coordinator.queue.unshift(item);retry=true;}else{try{await change(item.job,j=>{j.state='needs_review';j.message='生成执行环境需要维护者核对，文件和预留仍保留。';});}catch{}}}
    finally{coordinator.busy=false;if(coordinator.queue.length){coordinator.timer=setTimeout(()=>void pump(),retry?500:0);coordinator.timer.unref?.();}}
  }
  async function image({id,accountId,filename}){
    const r=await owned(id,accountId),preview=r.manual_pdf_preview,page=r.images.find(p=>p.filename===filename);if(r.source_format!=='pdf'||!preview||!page||!/^manual-[a-f0-9]{64}\.jpg$/.test(filename??''))fail('本册没有这张PDF预览页面。',404);
    const job=await load(id,preview.job_id);if(!job||!applied(r,job)||job.pages_digest!==preview.pages_digest||manifestDigest(job.pages)!==preview.pages_digest)fail('PDF整册留存信息无法核对。');
    const saved=job.pages.find(p=>p.filename===filename);if(!saved||sha(JSON.stringify(manualPdfPageIdentity(saved)))!==sha(JSON.stringify(manualPdfPageIdentity(page))))fail('本页与整册留存信息不一致。');
    const file=path.join(jobFolder(id,job.job_id),'pages',filename),stat=await fs.lstat(file);if(!stat.isFile()||stat.isSymbolicLink()||stat.size!==saved.bytes)fail('本页私密副本发生变化，请联系维护者。');const bytes=await fs.readFile(file);if(sha(bytes)!==saved.sha256)fail('本页私密副本发生变化，请联系维护者。');return bytes;
  }
  const safe=fn=>async(...args)=>{try{return await fn(...args);}catch(e){if(e.name==='SubmissionError')throw e;fail('私密PDF任务暂时无法核对，已有文件仍保留，请联系维护者。',503);}};
  return {begin:safe(begin),status:safe(status),cancel:safe(cancel),describe:safe(describe),assertIdle:safe(assertIdle),image:safe(image),runtimeStatus:runtime.status,configuration:runtime.configuration,async waitForIdle(){while(coordinator.busy||coordinator.queue.length)await new Promise(r=>setTimeout(r,25));}};
}
