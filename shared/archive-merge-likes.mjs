export function validateLikesSnapshot(value){
 if(!value||value.version!==1||!value.items||typeof value.items!=='object'||Array.isArray(value.items))throw new Error('点赞库不是现有服务的有效格式，不能把未知当0。');
 for(const[id,row]of Object.entries(value.items))if(!/^LJM-\d{8}-[A-Z0-9]{2,5}-\d{3}$/.test(id)||!row||!Array.isArray(row.voters)||new Set(row.voters).size!==row.voters.length||row.voters.some(voter=>typeof voter!=='string'||!/^[a-f0-9]{64}$/.test(voter)))throw new Error('点赞库包含异常记录，不能承诺核对通过。');
 return value;
}
