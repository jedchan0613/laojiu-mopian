// Linux隔离进程使用与既有Windows相同的结构、字体和图片校验规则。
import fs from 'node:fs/promises';
import {parseManualPdfInfo,parseManualPdfAttachmentCount,manualPdfInspectionIssues,manualPdfPageProfile,manualPdfLimits} from './manual-pdf-tools.mjs';
import {manualPdfProfiles,manualPdfGenerationLimits as limits} from '../shared/manual-pdf-generation.mjs';
import {pdfGenerationMessages} from '../shared/manual-pdf-errors.mjs';
const fail=(message,code='processing_failed')=>{throw Object.assign(new Error(message),{name:'SubmissionError',statusCode:409,pdfCode:code});};
export function createLinuxPdfProcessor({command,loadSharp}) {
let sharp;const discard=async()=>{};
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
      sharp??=loadSharp();const image=sharp(r.stdout,{limitInputPixels:manualPdfLimits.pixels,failOn:'warning'}).timeout({seconds:30}),meta=await image.metadata();
      const expected=geometry.rotation%180?geometry.height/geometry.width:geometry.width/geometry.height;
      if(meta.format!=='jpeg'||(meta.pages??1)!==1||!meta.width||!meta.height||Math.max(meta.width,meta.height)>target.longEdge||meta.width*meta.height>manualPdfLimits.pixels||Math.abs(meta.width/meta.height/expected-1)>.015)fail(pdfGenerationMessages.page_output,'page_output');
      const buffer=await image.rotate().toColourspace('srgb').flatten({background:'#fff'}).jpeg({quality:90,chromaSubsampling:'4:4:4'}).toBuffer();
      if(buffer.length>limits.pageBytes)fail(pdfGenerationMessages.page_output,'page_output');
      return {buffer,width:meta.width,height:meta.height,diagnostic_bytes:Buffer.byteLength(r.stderr),warning:r.stderr.trim()?(/font/i.test(r.stderr)?'font_warning':'render_warning'):null,peak_memory:r.peak_memory,elapsed_ms:r.elapsed_ms};
    }catch(e){if(e.pdfCode)throw e;fail(pdfGenerationMessages.page_output,'page_output');}finally{await discard(r);}
  }
return {inspect,render};
}
