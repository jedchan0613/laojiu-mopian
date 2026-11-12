// 仅供私密本机通道和隔离进程管道。固定长度、背压和截止时间防止无界缓冲。
import {once} from 'node:events';
export const pdfFrameLimits=Object.freeze({json:65536,source:20*1024**2,image:5*1024**2});
export const pdfProtocolError=()=>Object.assign(new Error('PDF处理通道无法核对。'),{pdfCode:'processing_failed',statusCode:503});
export function createPdfFrameReader(stream){
  const iterator=stream[Symbol.asyncIterator]();let buffered=Buffer.alloc(0),reading=false;
  async function take(size){
    const pieces=[];let left=size;
    while(left){if(!buffered.length){const next=await iterator.next();if(next.done)throw pdfProtocolError();buffered=Buffer.from(next.value);}
      const n=Math.min(left,buffered.length);pieces.push(buffered.subarray(0,n));buffered=buffered.subarray(n);left-=n;}
    return Buffer.concat(pieces,size);
  }
  return {async header(){if(reading)throw pdfProtocolError();reading=true;try{const prefix=await take(4),length=prefix.readUInt32BE();if(length<2||length>pdfFrameLimits.json)throw pdfProtocolError();const value=JSON.parse((await take(length)).toString('utf8'));if(!value||typeof value!=='object'||Array.isArray(value)||!Number.isSafeInteger(value.bytes)||value.bytes<0)throw pdfProtocolError();return value;}finally{reading=false;}},
    async body(size,maximum){if(reading||!Number.isSafeInteger(size)||size<0||size>maximum)throw pdfProtocolError();reading=true;try{return await take(size);}finally{reading=false;}},
    async frame(maximum=0){const header=await this.header();return {header,body:await this.body(header.bytes,maximum)};},
    async finish(){stream.destroy?.();await iterator.return?.().catch(()=>{});}
  };
}
export async function writePdfFrame(stream,header,body=Buffer.alloc(0)){
  if(!Buffer.isBuffer(body))throw pdfProtocolError();const metadata=Buffer.from(JSON.stringify({...header,bytes:body.length}));if(metadata.length>pdfFrameLimits.json)throw pdfProtocolError();
  const prefix=Buffer.alloc(4);prefix.writeUInt32BE(metadata.length);
  for(const part of [prefix,metadata,body])if(part.length){
    if(stream.destroyed||stream.writableEnded)throw pdfProtocolError();
    if(!stream.write(part))await new Promise((resolve,reject)=>{
      const clean=()=>{stream.off('drain',drained);stream.off('error',failed);stream.off('close',closed);},drained=()=>{clean();resolve();},failed=error=>{clean();reject(error);},closed=()=>{clean();reject(pdfProtocolError());};
      stream.once('drain',drained);stream.once('error',failed);stream.once('close',closed);
    });
  }
}
export async function pdfDeadline(promise,ms,onTimeout=()=>{}){
  let timer;const expiry=new Promise((_,reject)=>{timer=setTimeout(()=>{onTimeout();reject(Object.assign(pdfProtocolError(),{pdfCode:'timeout'}));},ms);timer.unref?.();});
  try{return await Promise.race([promise,expiry]);}finally{clearTimeout(timer);}
}
