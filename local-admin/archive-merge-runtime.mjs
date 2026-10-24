import path from 'node:path';
import {createRequire} from 'node:module';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {assertPublicationImageSignature} from '../shared/publication-image-safety.mjs';
import {mergeFail} from './archive-merge-files.mjs';
const execFileAsync=promisify(execFile);

export function createMergeImageValidator(siteDirectory){
  let sharp;
  return async(bytes,filename)=>{
    try{
    sharp??=createRequire(path.join(siteDirectory,'package.json'))('sharp');
    assertPublicationImageSignature(bytes,{filename});
    const input=sharp(bytes,{failOn:'warning',limitInputPixels:40000000}),metadata=await input.metadata();
    if(!metadata.width||!metadata.height||Math.max(metadata.width,metadata.height)>2000||(metadata.pages??1)>1)mergeFail('图片尺寸超出发布规则、缺少尺寸或包含多页，须先制作合规副本。','MERGE_IMAGE_DECODE_INVALID',422);
    if(metadata.exif||metadata.xmp||metadata.iptc||metadata.tifftagPhotoshop||metadata.comments?.length)mergeFail('图片含未审定的EXIF/文字或嵌入信息，须先制作新副本并重新审核。','MERGE_IMAGE_METADATA_REVIEW',422);
    // metadata()只读文件头；完整解码到像素才算验证，逐张处理以限制内存。
    await input.raw().toBuffer();
    return{width:metadata.width,height:metadata.height,format:metadata.format};
    }catch(error){if(error.statusCode)throw error;mergeFail('图片不能完整解码，未执行合并；请检查发布副本。','MERGE_IMAGE_DECODE_INVALID',422);}
  };
}
export async function buildMergeCandidate({siteDirectory,signal}){
  const command=process.platform==='win32'?process.env.ComSpec??'C:\\Windows\\System32\\cmd.exe':process.env.LJM_NPM_COMMAND??'npm';
  const args=process.platform==='win32'?['/d','/s','/c','npm run build']:['run','build'];
  // 不提前杀掉父shell而遗留构建子进程；取消须等实际构建结束，再由引擎核实并回退。
  const result=await execFileAsync(command,args,{cwd:siteDirectory,env:process.env,windowsHide:true,maxBuffer:12*1024*1024});
  if(signal?.aborted)throw Object.assign(new Error('合并构建已结束，操作取消。'),{name:'OperationCancelledError',statusCode:409,code:'OPERATION_CANCELLED'});
  return result.stdout+'\n'+result.stderr;
}
