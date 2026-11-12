// 原生集成仅显式LJM_PDF_NATIVE_TESTS=1时执行；只读6.1合成样例，不接受真实资料。
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import path from 'node:path';import os from 'node:os';import net from 'node:net';import {once} from 'node:events';import {execFile} from 'node:child_process';import {promisify} from 'node:util';import {Readable} from 'node:stream';import {createHash,randomBytes} from 'node:crypto';import {createRequire} from 'node:module';
import {createManualAccountFixture} from './helpers/manual-account-fixture.mjs';
import {createLocalManualPdfRuntime} from '../manual-pdf-runtime.mjs';
import {openManualPdfWindowsSession} from '../manual-pdf-windows.mjs';
const enabled=process.platform==='win32'&&process.env.LJM_PDF_NATIVE_TESTS==='1';
const key=()=>randomBytes(32).toString('hex'),sha=b=>createHash('sha256').update(b).digest('hex'),runFile=promisify(execFile);
const fixtures=path.resolve('outputs/manuals-pdf-phase6-1/fixtures'),evidence=path.resolve('outputs/manuals-pdf-phase6-3');
const require=createRequire(new URL('../../site/package.json',import.meta.url)),sharp=require('sharp');
async function nativeFixture(t){const f=await createManualAccountFixture();t.after(async()=>{await f.submissions.waitForPdfGenerationIdle();await f.close();});return f;}
async function book(f,file,profile='standard'){
  const bytes=await fs.readFile(file),accountId=f.users[0].user.id;
  const made=await f.submissions.createAccountManualDraft({accountId,payload:{request_key:key(),manual:{schema_version:1,brand_name:'原生合成验收',model_texts:['SYNTHETIC-NATIVE'],sharing_scope:'reading-copy'}}}),id=made.id;
  await f.submissions.setAccountManualMaterial({id,accountId,payload:{operation_id:key(),revision:1,source_format:'pdf'}});
  const upload=await f.submissions.prepareAccountManualPdf({id,accountId,payload:{operation_id:key(),revision:2,name:'screened-synthetic.pdf',bytes:bytes.length,sha256:sha(bytes),copies_confirmed:true}}),request=Readable.from([bytes]);request.headers={'content-type':'application/pdf'};
  await f.submissions.receiveAccountManualPdf({id,accountId,uploadId:upload.upload_id,request});
  const op=key(),start=Date.now();await f.submissions.beginAccountManualPdfGeneration({id,accountId,payload:{operation_id:op,revision:3,profile}});await f.submissions.waitForPdfGenerationIdle();
  return {id,accountId,elapsed_ms:Date.now()-start,receipt:await f.submissions.getAccountManualPdfGeneration({id,accountId,operationId:op}),record:await f.submissions.getAccountManualSubmission({id,accountId})};
}

test('Windows真实200页全链路：无漏页乱页、像素页标、私密读取与容量结算',{skip:!enabled,timeout:300000},async t=>{
  const f=await nativeFixture(t),result=await book(f,path.join(fixtures,'long-200.pdf'));assert.equal(result.receipt.state,'succeeded',JSON.stringify(result.receipt));assert.equal(result.record.images.length,200);assert.equal(result.receipt.completed_pages,200);
  let total=0;const seen=[];
  for(let n=1;n<=200;n++){
    const page=result.record.images[n-1],bytes=await f.submissions.getAccountManualPage({id:result.id,accountId:result.accountId,filename:page.filename});assert.equal(page.source_page,n);assert.equal(sha(bytes),page.sha256);total+=bytes.length;
    const {data,info}=await sharp(bytes).removeAlpha().raw().toBuffer({resolveWithObject:true}),landscape=n===2,w=landscape?841.8898:595.2756,h=landscape?595.2756:841.8898;let marker=0;
    for(let bit=0;bit<8;bit++){const x=Math.round((40+bit*12)*info.width/w),y=info.height-Math.round(72*info.height/h),p=(y*info.width+x)*info.channels;if((data[p]+data[p+1]+data[p+2])/3<140)marker|=1<<bit;}
    assert.equal(marker,n,'源PDF页序标记不一致');assert(Math.max(info.width,info.height)<=2400);assert(info.width*info.height<=8_000_000);seen.push(marker);
  }
  const usage=await f.submissions.accountUsage(result.accountId);assert.equal(usage.storage_reserved_bytes,0);assert.equal(usage.storage_used_bytes,total+(await fs.stat(path.join(fixtures,'long-200.pdf'))).size);
  await fs.mkdir(evidence,{recursive:true});await fs.writeFile(path.join(evidence,'native-200.json'),JSON.stringify({syntheticOnly:true,pages:200,markers:seen,elapsed_ms:result.elapsed_ms,image_bytes:total,receipt:result.receipt,usage},null,2));
  for(const n of [1,2,100,200]){const p=result.record.images[n-1];await fs.writeFile(path.join(evidence,'native-200-page-'+n+'.jpg'),await f.submissions.getAccountManualPage({id:result.id,accountId:result.accountId,filename:p.filename}));}
});

test('Windows真实异常样例与清晰度：静态可预览，脚本、附件、表单、加密和201页不能生成半册',{skip:!enabled,timeout:180000},async t=>{
  const f=await nativeFixture(t),rows=[];
  for(const [name,allowed] of [['normal-1.pdf',true],['normal-12.pdf',true],['rotated.pdf',true],['cropped.pdf',true],['scanned.pdf',true],['attachment.pdf',false],['form.pdf',false],['javascript.pdf',false],['encrypted.pdf',false],['over-201.pdf',false],['huge-page.pdf',false],['malformed.pdf',false]]){
    const file=path.join(fixtures,name);try{await fs.access(file);}catch{assert.fail('6.1合成样例缺失：'+name);}
    const r=await book(f,file);rows.push({name,allowed,receipt:r.receipt,pages:r.record.images.length,elapsed_ms:r.elapsed_ms});assert.equal(r.receipt.state==='succeeded',allowed,name+': '+JSON.stringify(r.receipt));if(!allowed)assert.equal(r.record.images.length,0);
  }
  const detailed=await book(f,path.join(fixtures,'normal-1.pdf'),'detail');assert.equal(detailed.receipt.state,'succeeded');const page=detailed.record.images[0];assert.equal(Math.max(page.width,page.height),Math.min(4096,Math.floor(Math.sqrt(8_000_000/(595.2756/841.8898)))));assert(page.width*page.height<=8_000_000);await fs.writeFile(path.join(evidence,'native-detail.jpg'),await f.submissions.getAccountManualPage({id:detailed.id,accountId:detailed.accountId,filename:page.filename}));
  await fs.writeFile(path.join(evidence,'native-matrix.json'),JSON.stringify(rows,null,2));
});

test('Windows正式执行边界实测：外部读取/所有目录写入/网络拒绝，内存、诊断和进程树受限',{skip:!enabled,timeout:120000},async t=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'ljm-pdf-native-'));t.after(async()=>{const absolute=path.resolve(root);assert.equal(path.dirname(absolute),path.resolve(os.tmpdir()));assert(path.basename(absolute).startsWith('ljm-pdf-native-'));await fs.rm(absolute,{recursive:true,force:true});});
  const tools=path.join(root,'tools'),bin=path.join(tools,'Library','bin');await fs.mkdir(bin,{recursive:true});
  const compiler=path.join(process.env.SystemRoot,'Microsoft.NET',process.arch==='arm64'?'FrameworkArm64':'Framework64','v4.0.30319','csc.exe');await runFile(compiler,['/nologo','/target:exe','/out:'+path.join(bin,'pdfinfo.exe'),path.resolve('outputs/manuals-pdf-phase6-1/native-probe.cs')],{windowsHide:true});
  const task=path.join(root,'task'),input=path.join(task,'work','input');await fs.mkdir(input,{recursive:true});await fs.writeFile(path.join(input,'source.pdf.part'),'SYNTHETIC_ALLOWED');const vault=path.join(root,'vault');await fs.mkdir(vault);await fs.writeFile(path.join(vault,'secret.txt'),'SYNTHETIC_NOT_A_SECRET');
  const options={root:task,toolRoot:tools,cacheDirectory:path.resolve('local-admin/pdf-runtime/cache'),profile:'LJM.ManualPdf.'+randomBytes(12).toString('hex'),verify:false};const session=await openManualPdfWindowsSession(options),rows=[];
  try{
    const access=await session.run('pdfinfo',['access',path.join(input,'source.pdf.part'),path.join(vault,'secret.txt'),path.join(task,'work','output','blocked.txt'),path.join(vault,'secret.txt')]);assert.match(access.stdout.toString(),/ALLOWED_READ=OK/);assert.match(access.stdout.toString(),/BLOCKED_READ=DENIED/);assert.match(access.stdout.toString(),/BLOCKED_WRITE=DENIED/);assert.match(access.stdout.toString(),/SOURCE_WRITE=DENIED/);assert.match(access.stdout.toString(),/ALLOWED_WRITE=UnauthorizedAccessException/);rows.push({...access,stdout:access.stdout.toString()});
    let connections=0;const server=net.createServer(socket=>{connections++;socket.end();});server.listen(0,'127.0.0.1');await once(server,'listening');try{
      const args=['network','127.0.0.1',String(server.address().port)];const before=await runFile(path.join(bin,'pdfinfo.exe'),args,{windowsHide:true,timeout:10000});assert.match(before.stdout,/NETWORK=CONNECTED/);assert.equal(connections,1);
      const network=await session.run('pdfinfo',args);assert.doesNotMatch(network.stdout.toString(),/CONNECTED/);assert.match(network.stdout.toString(),/NETWORK=(?:AccessDenied|TIMEOUT)/);assert.equal(connections,1,'受限进程不能建立监听器连接');
      const after=await runFile(path.join(bin,'pdfinfo.exe'),args,{windowsHide:true,timeout:10000});assert.match(after.stdout,/NETWORK=CONNECTED/);assert.equal(connections,2);rows.push({...network,stdout:network.stdout.toString(),controlBefore:before.stdout,controlAfter:after.stdout,restrictedConnections:0});
    }finally{await new Promise(r=>server.close(r));}
    const memory=await session.run('pdfinfo',['memory']);assert(memory.peak_memory<=512*1024*1024);assert.match(memory.stdout.toString(),/ALLOCATION_REFUSED/);rows.push({...memory,stdout:memory.stdout.toString()});
    const flood=await session.run('pdfinfo',['flood']);assert.equal(flood.output_limited,true);assert.equal(flood.stdout.length,65536);rows.push({...flood,stdout:{bytes:flood.stdout.length}});
    const timeout=await session.run('pdfinfo',['tree'],{timeout:1500});assert.equal(timeout.timeout,true);assert.equal(timeout.active_after,0);assert(timeout.total_processes>=2);rows.push({...timeout,stdout:timeout.stdout.toString()});
    const running=session.run('pdfinfo',['tree'],{timeout:10000});await new Promise(r=>setTimeout(r,1500));await session.cancel();const cancelled=await running;assert.equal(cancelled.cancelled,true);assert.equal(cancelled.active_after,0);assert(cancelled.total_processes>=2);rows.push({...cancelled,stdout:cancelled.stdout.toString()});
  }finally{rows.push(await session.close());await fs.writeFile(path.join(evidence,'native-boundary.json'),JSON.stringify(rows,null,2));}
});
