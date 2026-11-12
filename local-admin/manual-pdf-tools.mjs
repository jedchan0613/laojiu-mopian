// 6.1文件处理约定：只做工具盘点、工具输出校验和边界计算；没有接入上传或公开接口。
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';

export const manualPdfLimits=Object.freeze({sourceBytes:20*1024*1024,pages:200,pageBytes:5*1024*1024,bookImageBytes:100*1024*1024,pixels:8_000_000,longEdge:2400,maxLongEdge:4096,memoryBytes:512*1024*1024,pagePoints:14400,aspectRatio:20,diagnosticBytes:64*1024});
export const manualPdfToolNames=Object.freeze(['pdfinfo','pdfdetach','pdftoppm']);
const fail=message=>{throw new Error(message);};
const number=value=>{const n=Number(value);if(!Number.isSafeInteger(n)||n<0)fail('PDF工具数值无法核对。');return n;};
const text=value=>{if(typeof value!=='string'||Buffer.byteLength(value)>manualPdfLimits.diagnosticBytes||value.includes('\u0000'))fail('PDF检查输出缺失或超限。');return value;};

export async function inventoryManualPdfTools(directory,{platform=process.platform,pins={}}={}){
  if(typeof directory!=='string'||!path.isAbsolute(directory))fail('请配置PDF工具的绝对目录，不从PATH猜测工具。');
  const tools=[];
  for(const name of manualPdfToolNames){
    const file=path.join(directory,name+(platform==='win32'?'.exe':''));
    try{const stat=await fs.stat(file);if(!stat.isFile())fail('PDF工具路径不是文件。');const sha256=createHash('sha256').update(await fs.readFile(file)).digest('hex');tools.push({name,present:true,bytes:stat.size,sha256,pinned:/^[a-f0-9]{64}$/.test(pins[name]??'')&&pins[name]===sha256});}
    catch(e){if(e.code!=='ENOENT')throw e;tools.push({name,present:false,pinned:false});}
  }
  return {tools,allPresent:tools.every(t=>t.present),allPinned:tools.every(t=>t.present&&t.pinned)};
}

export function parseManualPdfInfo(raw){
  const lines=text(raw).split(/\r?\n/);
  const single=key=>{const matches=lines.filter(line=>line.startsWith(key+':'));if(matches.length!==1)fail('PDF检查必要字段缺失或重复：'+key);return matches[0].slice(key.length+1).trim();};
  const bool=key=>{const value=single(key);if(value==='no')return false;if(/^yes(?:\s*\(.*\))?$/.test(value))return true;fail('PDF检查标记无效：'+key);};
  const pages=number(single('Pages')),javascript=bool('JavaScript'),encrypted=bool('Encrypted'),form=single('Form');
  if(!['none','AcroForm','XFA'].includes(form))fail('PDF表单标记无法核对。');
  const size=/^(\d+) bytes$/.exec(single('File size'));if(!size)fail('PDF字节数无法核对。');
  const version=single('PDF version');if(!/^\d+\.\d+$/.test(version))fail('PDF版本无法核对。');
  const pageSizes=[];
  for(const line of lines){const match=/^Page(?:\s+(\d+))?\s+size:\s+([\d.]+) x ([\d.]+) pts(?:\s|$)/.exec(line);if(match){const width=Number(match[2]),height=Number(match[3]);if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)fail('PDF页面尺寸无效。');pageSizes.push({page:match[1]?number(match[1]):1,width,height});}}
  return {pages,javascript,encrypted,form,fileBytes:number(size[1]),version,pageSizes};
}

export function parseManualPdfAttachmentCount(raw){
  const rows=text(raw).split(/\r?\n/).map(line=>line.trim()).filter(line=>/^\d+ embedded files?$/.test(line));
  if(rows.length!==1)fail('PDF附件检查未完成，不能按无附件处理。');
  return number(rows[0].split(' ')[0]);
}

export function manualPdfPageProfile(width,height,requestedLongEdge=manualPdfLimits.longEdge){
  if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0||Math.max(width,height)>manualPdfLimits.pagePoints||Math.max(width,height)/Math.min(width,height)>manualPdfLimits.aspectRatio)fail('PDF页面尺寸超过已验证范围。');
  if(!Number.isSafeInteger(requestedLongEdge)||requestedLongEdge<1||requestedLongEdge>manualPdfLimits.maxLongEdge)fail('阅读图片尺寸配置无效。');
  const ratio=Math.min(width,height)/Math.max(width,height);
  let longEdge=Math.min(requestedLongEdge,Math.floor(Math.sqrt(manualPdfLimits.pixels/ratio)));
  while(longEdge*Math.ceil(longEdge*ratio)>manualPdfLimits.pixels)longEdge--;
  const shortEdge=Math.ceil(longEdge*ratio);
  return {longEdge,width:width>=height?longEdge:shortEdge,height:width>=height?shortEdge:longEdge,pixels:longEdge*shortEdge};
}

export function manualPdfReadiness(evidence={}){
  const issues=[];const require=(ok,code)=>{if(ok!==true)issues.push(code);};
  require(evidence.tools?.allPresent,'missing_tools');require(evidence.tools?.allPinned,'unpinned_tools');
  for(const key of ['versionApproved','licencesVerified','fontCoverageVerified','fileReadIsolation','fileWriteIsolation','networkIsolation','memoryHardLimit','timeoutTree','cancellationTree','taskScopedInput','diagnosticLimit','bundlePinned','integrationVerified'])require(evidence[key],key);
  return {ready:issues.length===0,issues};
}

export function manualPdfInspectionIssues({bytes,header,info,attachments,toolchainReady=false,isolationVerified=false,renderDiagnostics=''}={}){
  const issues=[];
  if(toolchainReady!==true)issues.push('tools_not_ready');if(isolationVerified!==true)issues.push('isolation_not_ready');
  if(!Number.isSafeInteger(bytes)||bytes<1||bytes>manualPdfLimits.sourceBytes)issues.push('source_size');
  if(!(header instanceof Uint8Array)||!Buffer.from(header).subarray(0,5).equals(Buffer.from('%PDF-')))issues.push('source_header');
  if(!info||typeof info!=='object')issues.push('inspection_missing');
  else{
    if(!Number.isSafeInteger(info.pages)||info.pages<1||info.pages>manualPdfLimits.pages)issues.push('page_count');
    if(info.encrypted!==false)issues.push('encrypted');if(info.javascript!==false)issues.push('javascript');if(info.form!=='none')issues.push('interactive_form');
    if(info.fileBytes!==bytes)issues.push('source_changed');
    const sizes=info.pageSizes;
    if(!Array.isArray(sizes)||sizes.length!==info.pages||new Set(sizes.map(s=>s.page)).size!==info.pages||sizes.some(s=>!Number.isSafeInteger(s.page)||s.page<1||s.page>info.pages))issues.push('page_geometry_incomplete');
    else for(const size of sizes){try{manualPdfPageProfile(size.width,size.height);}catch{issues.push('page_geometry');break;}}
  }
  if(attachments!==0)issues.push(attachments==null?'attachment_check_missing':'embedded_files');
  if(typeof renderDiagnostics!=='string'||Buffer.byteLength(renderDiagnostics)>manualPdfLimits.diagnosticBytes||/font|syntax error|syntax warning|error:/i.test(renderDiagnostics))issues.push('render_needs_review');
  return issues;
}
