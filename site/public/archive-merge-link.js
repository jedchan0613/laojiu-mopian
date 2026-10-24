const node=document.getElementById('merge-link-data');let sequence=0;
async function followCurrentMapping(){
 const serial=++sequence;
 if(node)try{
  const data=JSON.parse(node.textContent),response=await fetch(data.records,{cache:'no-cache',headers:{Accept:'application/json'}});
  const payload=response.ok?await response.json():null,targetId=payload?.aliases?.[data.sourceId],positions=payload?.alias_pages?.[data.sourceId];
  if(serial!==sequence)return;
  if(targetId&&payload.records.some(row=>row.id===targetId)&&new URL(data.target,location.origin).origin===location.origin&&data.target.endsWith('/archive/'+targetId+'/')){
   const match=/^#image-([1-9]\d*)$/.exec(location.hash),index=match?positions?.[match[1]]:location.hash?null:Object.values(positions??{}).find(value=>value!==null);
   if(Number.isSafeInteger(index)&&index>0)location.replace(data.target+'#image-'+index);
  }
 }catch{/* 当前公开状态无法核实时保留明确链接，不自动跳转。 */}
}
window.addEventListener('hashchange',followCurrentMapping);
followCurrentMapping();
