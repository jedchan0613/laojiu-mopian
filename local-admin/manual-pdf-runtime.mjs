// 仅本机配置启用。工具、执行器、参数和输出规则均由服务端决定。
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {openManualPdfWindowsSession,recoverManualPdfWindowsSession,verifyManualPdfBundle,pdfFileDigest} from './manual-pdf-windows.mjs';
import {parseManualPdfInfo,parseManualPdfAttachmentCount,manualPdfInspectionIssues,manualPdfPageProfile,manualPdfLimits} from './manual-pdf-tools.mjs';
import {manualPdfProfiles,manualPdfGenerationLimits as limits} from '../shared/manual-pdf-generation.mjs';
const here=path.dirname(fileURLToPath(import.meta.url));
const pinsFile=path.join(here,'manual-pdf-toolchain-pins.json');
const engineFiles=[fileURLToPath(import.meta.url),path.join(here,'native','ManualPdfSandbox.cs'),path.join(here,'manual-pdf-windows.mjs'),path.join(here,'manual-pdf-tools.mjs'),path.join(here,'manual-pdf-jobs.mjs'),path.join(here,'..','shared','manual-pdf-generation.mjs'),path.join(here,'..','shared','manual-pdf-review.mjs')];
const engineSnapshot=await Promise.all(engineFiles.map(pdfFileDigest));
const fail=(message,code='processing_failed')=>{throw Object.assign(new Error(message),{name:'SubmissionError',statusCode:409,pdfCode:code});};
export const pdfGenerationMessages=Object.freeze({source_changed:'源PDF与留存摘要不一致，请联系维护者核对。',page_count:'PDF页数无法核对或超过200页，未生成部分整册。',encrypted:'本阶段不处理加密或有密码限制的PDF，请另制有权提供的普通副本。',javascript:'PDF带有脚本，请提供普通静态副本。',interactive_form:'PDF带有交互表单或签名结构，请提供普通静态副本。',embedded_files:'PDF带有嵌入附件，请提供普通静态副本。',page_geometry:'PDF页面尺寸超出已验证范围，请先在本机核对。',page_geometry_incomplete:'未能核对PDF全部页面尺寸。',inspection_missing:'PDF文件信息无法完整读取。',source_size:'源PDF大小不符合本阶段限制。',source_header:'源PDF文件头无法核对。',attachment_check_missing:'PDF附件检查未完成。',diagnostic_limit:'PDF工具诊断达到上限，本次生成已停止。',page_output:'有页面无法完整解码或超出图片边界。',timeout:'本次PDF处理超时，旧预览仍保留。',cancelled:'本次生成已停止，旧预览和已生成页图仍私密保留。',processing_failed:'PDF处理未完成，已有PDF和页图仍私密保留。'});
export function createLocalManualPdfRuntime({settingsFile=path.join(here,'pdf-runtime','local.json'),cacheDirectory=path.join(here,'pdf-runtime','cache'),siteDirectory=path.join(here,'..','site'),pinsPath=pinsFile}={}){
  const require=createRequire(path.join(siteDirectory,'package.json'));let sharp;
  async function settings(){
    let data;try{data=JSON.parse(await fs.readFile(settingsFile,'utf8'));}catch(e){if(e.code==='ENOENT')return null;return null;}
    if(data.schema!==1||data.enabled!==true||!path.isAbsolute(data.tool_directory??'')||Object.keys(data).some(k=>!['schema','enabled','tool_directory'].includes(k)))return null;return data;
  }
  const status=async()=>{
    if(process.platform!=='win32')return {available:false,message:'当前环境尚未配置已验证的PDF受限执行。上传和已有预览仍可使用。'};
    const config=await settings();if(!config)return {available:false,message:'本机尚未配置固定PDF工具，上传和已有预览仍可使用。'};
    const current=await Promise.all(engineFiles.map(pdfFileDigest));if(current.some((hash,index)=>hash!==engineSnapshot[index]))return {available:false,message:'PDF程序已经更新，请保存其他工作后重启本地启动窗口；已有预览仍可阅读。'};
    for(const name of ['pdfinfo','pdfdetach','pdftoppm','pdffonts'])try{if(!(await fs.lstat(path.join(config.tool_directory,'Library','bin',name+'.exe'))).isFile())throw new Error();}catch{return {available:false,message:'本机PDF工具不完整，已暂停新生成；已有文件仍保留。'};}
    return {available:true,message:'本地受限生成已开放，结果仍需逐页核对。'};
  };
  async function configuration(){
    const ready=await status();if(!ready.available)fail(ready.message,'tools_not_ready');
    const config=await settings(),pins=JSON.parse(await fs.readFile(pinsPath,'utf8'));
    sharp??=require('sharp');const fingerprint=createHash('sha256').update(JSON.stringify(pins)).update(engineSnapshot.join(':')).update(JSON.stringify(sharp.versions)).digest('hex');
    return {fingerprint,version:pins.version,toolRoot:config.tool_directory,pins,cacheDirectory};
  }
  async function open(root,job){const config=await configuration();if(config.fingerprint!==job.engine_fingerprint)fail('PDF处理配置已经变化，请重新读取后生成。','configuration_changed');await verifyManualPdfBundle(config.toolRoot,config.pins);return openManualPdfWindowsSession({root,toolRoot:config.toolRoot,pins:config.pins,cacheDirectory,profile:'LJM.ManualPdf.'+job.job_id.slice(3),verify:false});}
  const discard=async result=>{for(const f of [result.stdoutFile,result.stderrFile]){if(!path.isAbsolute(f)||!f.endsWith('.part'))throw new Error('Temporary output path.');await fs.unlink(f).catch(e=>{if(e.code!=='ENOENT')throw e;});}};
  async function command(session,tool,args,options={}){
    const result=await session.run(tool,args,options);
    if(result.cancelled||result.timeout||result.output_limited||result.exit_code!==0){const encrypted=tool==='pdfinfo'&&/incorrect password|encrypted/i.test(result.stderr);await discard(result);const code=result.cancelled?'cancelled':result.timeout?'timeout':result.output_limited?'diagnostic_limit':encrypted?'encrypted':'processing_failed';fail(pdfGenerationMessages[code],code);}return result;
  }
  async function inspect(session,source){
    const warnings=new Set();let diagnosticBytes=0;
    const note=r=>{diagnosticBytes+=Buffer.byteLength(r.stderr);if(diagnosticBytes>limits.diagnosticBytes)fail(pdfGenerationMessages.diagnostic_limit,'diagnostic_limit');if(r.stderr.trim())warnings.add(/font/i.test(r.stderr)?'font_warning':'tool_warning');};
    let info;
    const basic=await command(session,'pdfinfo',['-isodates',source]);try{note(basic);info=parseManualPdfInfo(basic.stdout.toString('utf8'));}catch(e){if(e.pdfCode)throw e;fail(pdfGenerationMessages.inspection_missing,'inspection_missing');}finally{await discard(basic);}
    if(!Number.isSafeInteger(info.pages)||info.pages<1||info.pages>limits.pages)fail(pdfGenerationMessages.page_count,'page_count');
    for(const code of ['encrypted','javascript'])if(info[code]!==false)fail(pdfGenerationMessages[code],code);
    if(info.form!=='none')fail(pdfGenerationMessages.interactive_form,'interactive_form');
    const attached=await command(session,'pdfdetach',['-list',source]);let count;try{note(attached);count=parseManualPdfAttachmentCount(attached.stdout.toString('utf8'));}finally{await discard(attached);}
    if(count!==0)fail(pdfGenerationMessages.embedded_files,'embedded_files');
    const sizes=[],geometry=[];
    for(let first=1;first<=info.pages;first+=20){
      const last=Math.min(info.pages,first+19),r=await command(session,'pdfinfo',['-isodates','-box','-f',String(first),'-l',String(last),source]);
      try{
        note(r);const text=r.stdout.toString('utf8'),batch=parseManualPdfInfo(text);if(batch.pages!==info.pages||batch.fileBytes!==info.fileBytes)fail(pdfGenerationMessages.source_changed,'source_changed');
        sizes.push(...batch.pageSizes);const rotations=new Map(),boxes=new Map();
        for(const line of text.split(/\r?\n/)){
          const rot=/^Page(?:\s+(\d+))?\s+rot:\s+(-?\d+)\s*$/.exec(line);if(rot)rotations.set(Number(rot[1]??1),Number(rot[2]));
          const box=/^(?:Page\s+(\d+)\s+)?(MediaBox|CropBox):\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s*$/.exec(line);if(box){const n=Number(box[1]??1),value=boxes.get(n)??{};value[box[2]]=box.slice(3).map(Number);boxes.set(n,value);}
        }
        for(const size of batch.pageSizes){const rotation=rotations.get(size.page);if(![0,90,180,270].includes(rotation))fail(pdfGenerationMessages.page_geometry,'page_geometry');manualPdfPageProfile(size.width,size.height);const box=boxes.get(size.page);if(!box?.CropBox||!box?.MediaBox||[...box.CropBox,...box.MediaBox].some(n=>!Number.isFinite(n)))fail(pdfGenerationMessages.page_geometry_incomplete,'page_geometry_incomplete');if(box.CropBox.some((n,i)=>Math.abs(n-box.MediaBox[i])>.01))warnings.add('cropbox_differs');geometry.push({...size,rotation});}
      }finally{await discard(r);}
    }
    info.pageSizes=sizes;
    const stat=await fs.stat(source),header=Buffer.alloc(5),f=await fs.open(source,'r');try{await f.read(header,0,5,0);}finally{await f.close();}
    const issues=manualPdfInspectionIssues({bytes:stat.size,header,info,attachments:count,toolchainReady:true,isolationVerified:true});
    if(issues.length){const code=issues[0];fail(pdfGenerationMessages[code]??pdfGenerationMessages.processing_failed,code);}
    const fonts=await command(session,'pdffonts',[source]);try{note(fonts);for(const line of fonts.stdout.toString('utf8').split(/\r?\n/).slice(2).filter(x=>x.trim())){const flags=/\s+(yes|no)\s+(yes|no)\s+(yes|no)\s+\d+\s+\d+\s*$/.exec(line);if(!flags)warnings.add('font_check_needs_review');else if(flags[1]!=='yes')warnings.add('font_not_embedded');}}finally{await discard(fonts);}
    return {pages:info.pages,geometry,warnings:[...warnings],diagnostic_bytes:diagnosticBytes,pdf_version:info.version,inspection:{schema:1,checked_at:new Date().toISOString(),pages:info.pages,encrypted:info.encrypted,javascript:info.javascript,form:info.form,attachments:count,pdf_version:info.version,geometry:geometry.map(g=>({page:g.page,width:g.width,height:g.height,rotation:g.rotation})),warnings:[...warnings]}};
  }
  async function render(session,source,page,profile,geometry){
    const target=manualPdfPageProfile(geometry.width,geometry.height,manualPdfProfiles[profile].longEdge);
    const r=await command(session,'pdftoppm',['-f',String(page),'-l',String(page),'-singlefile','-cropbox','-scale-to',String(target.longEdge),'-jpeg','-jpegopt','quality=90,optimize=y',source],{binary:true,timeout:limits.pageMs});
    try{
      if(r.stdout[0]!==0xff||r.stdout[1]!==0xd8)fail(pdfGenerationMessages.page_output,'page_output');
      sharp??=require('sharp');const image=sharp(r.stdout,{limitInputPixels:manualPdfLimits.pixels,failOn:'warning'}).timeout({seconds:30}),meta=await image.metadata();
      const expected=geometry.rotation%180?geometry.height/geometry.width:geometry.width/geometry.height;
      if(meta.format!=='jpeg'||(meta.pages??1)!==1||!meta.width||!meta.height||Math.max(meta.width,meta.height)>target.longEdge||meta.width*meta.height>manualPdfLimits.pixels||Math.abs(meta.width/meta.height/expected-1)>.015)fail(pdfGenerationMessages.page_output,'page_output');
      const buffer=await image.rotate().toColourspace('srgb').flatten({background:'#fff'}).jpeg({quality:90,chromaSubsampling:'4:4:4'}).toBuffer();
      if(buffer.length>limits.pageBytes)fail(pdfGenerationMessages.page_output,'page_output');
      return {buffer,width:meta.width,height:meta.height,diagnostic_bytes:Buffer.byteLength(r.stderr),warning:r.stderr.trim()?(/font/i.test(r.stderr)?'font_warning':'render_warning'):null,peak_memory:r.peak_memory,elapsed_ms:r.elapsed_ms};
    }catch(e){if(e.pdfCode)throw e;fail(pdfGenerationMessages.page_output,'page_output');}finally{await discard(r);}
  }
  return {status,configuration,open,inspect,render,recover:root=>recoverManualPdfWindowsSession({root,cacheDirectory})};
}
