// 仅由能力接口明确开放的本机内部验收环境加载；不包含自动批准或生产发布逻辑。
const $=id=>document.getElementById(id);
const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const storageKey='ljm-private-merge-operation';
const checklist=[
 '确认这两件属于同一件或同一套，且自己有相应维护权限。',
 '核对题名、年代、地点及其他字段；未把猜测当成确证。',
 '核对图片完整、顺序、图注及转录页号，没有误删或错配。',
 '核对姓名、署名和可以识别真实人物的文字，并完成必要处置。',
 '核对门牌、楼栋、室号等精确私人地址，并完成必要处置。',
 '核对身份证号、证件/卡号、账号、电话及其他隐私编码。',
 '重点核对医疗、健康、未成年人及私人叙述等内容。',
 '核对人脸、肖像五官和新组合产生的识别风险。',
 '确认发布副本已完成必要遮盖，原始主档保持不动。',
 '核对图片隐含信息、使用权和公开范围，不把实物所有权等同版权。',
 '核对其他档案引用、相册、收藏和译文影响；无未处理的投稿权属问题。',
 '确认没有未处理的借阅、流转、审批、移交、保全或其他占用；未接入不表示已自动通过。',
 '确认下方保留编号及发布/撤销范围；理解原号留档、后续撤销需另行冲突核查。',
];
const phases={'prepared':'准备私密日志','snapshots-complete':'快照已保存','candidate-ready':'独立候选版本已准备','build-complete':'候选构建已完成','files-prepared':'准备提交前复查','likes-lock-intent':'准备短时保护点赞写入','likes-locked':'已短时保护点赞写入','favorites-locked':'短时保护收藏写入','writing-file':'写入当前应用版本','file-written':'提交文件并核对摘要','files-applied':'文件提交完成','favorites-applied':'收藏迁移已完成','previous-dist-retained':'原公开版本已私密留存','dist-switched':'已切换网站构建','verified':'切换后核对完成','public-switch-intent':'准备切换公开网站','public-switched':'公开网站已切换','committed':'合并完成','rolled-back':'已恢复操作前状态','needs-review':'需要核对，写入保持暂停'};

export async function initializeMergeExecution({request,getState,setBusy,onCommitted,say}){
 const capability=await request('/api/merge-capabilities');if(!capability.internalExecutionEnabled)return;
 $('execution-panel').hidden=false;document.querySelector('.phase-badge').textContent=capability.online?'档案合并 · 生产环境':'档案合并 · 本机环境';
 document.querySelector('.stage-note').textContent=capability.online?'当前操作会维护线上正式档案和公开网站。合并和恢复发布均须重新核对13项及编号。':'本机维护：支持合并、恢复草稿和重新核对恢复发布。';
 $('execution-heading').textContent='执行已保存的方案';$('execution-panel').querySelector('.help').textContent='先保存方案，再核对完整图文、13项及保留编号。确认后执行可恢复合并和发布。';if(capability.online){$('execute-submit').textContent='确认合并并发布';document.querySelector('.eyebrow').textContent='老旧默片 · 线上档案工作台';}
 let review=null,pending=null,executing=false,poll=null;
 const status=text=>{$('merge-execution-status').textContent=text;$('execute-progress').textContent=text;};
 const store=()=>{try{pending?sessionStorage.setItem(storageKey,JSON.stringify(pending)):sessionStorage.removeItem(storageKey);}catch{}};
 const resultView=async merge=>{
   $('compare-panel').hidden=false;
   if(merge.legacy){$('merge-execution-result').innerHTML=`<article class="preview-box"><h3>历史手工合并 · 只读追溯</h3><p>${escape(merge.primary_id)} ← ${escape(merge.secondary_id)}</p><p>${escape(merge.message)}</p><p>状态：${escape(merge.status)} · 快照${merge.snapshots?.length??0}件</p></article>`;status('历史操作未重新执行。');return;}
   $('merge-execution-result').innerHTML=`<article class="preview-box"><h3>${merge.status==='reverted'?'合并已撤销':merge.operation_kind==='undo'&&merge.status==='committed'?'两件已恢复发布':merge.status==='committed'?'合并完成':merge.status==='rolled-back'?'本次未提交，已恢复':escape(phases[merge.phase]??merge.status)}</h3><p>保留编号：<strong>${escape(merge.primary_id)}</strong><br>从编号：${escape(merge.secondary_id)}（${merge.status==='committed'?'正式撤销留档':'见操作状态'}）</p><p>操作时间：${escape(merge.completed_at??merge.created_at)}<br>私密快照：${merge.snapshots?.length??0}件</p><details><summary>查看执行记录</summary><ul>${(merge.events??[]).map(event=>`<li>${escape(event.at)} · ${escape(phases[event.phase]??event.phase)}</li>`).join('')}</ul></details><p class="help">日志和快照留在私密目录。恢复入口位于“合并记录与恢复”；恢复发布须重新核对。</p></article>`;
   if(merge.status==='committed'){await onCommitted();document.dispatchEvent(new CustomEvent('merge-records-updated'));$('execute-dialog').close();$('review-merge').disabled=true;say(capability.online?'合并及线上发布已完成；从编号正式留档。':'本机合并已完成；从编号正式留档，生产未变更。','success');}
   status(merge.status==='reverted'?'该合并已撤销，两件已恢复；原日志保留。':phases[merge.phase]??merge.status);
 };
 async function progress(){if(!pending)return;try{const data=await request(`/api/merge-result/${pending.id}/${pending.step}`,{timeout:5000});status(phases[data.merge.phase]??'操作进行中');}catch{/* 原请求可能尚在排队；不把临时查询失败当作执行失败。 */}}
 async function recover(){
   if(!pending||executing)return;setBusy(true);
   try{
     const response=await request('/api/operations/'+pending.id),entry=response.operations.find(row=>row.stepId===pending.step);
     if(!entry){status('原请求尚未有可核实记录；保留本页，稍后再核对。');return;}
     if(['queued','running'].includes(entry.status)){status('原请求仍在执行；不能再次提交。');return;}
     let data;
     try{data=await request(`/api/merge-result/${pending.id}/${pending.step}`);}catch(error){
       if(['failed','cancelled'].includes(entry.status)&&(error.status===404||error.code==='MERGE_RESULT_UNKNOWN')){pending=null;store();$('recover-merge').hidden=true;status('原操作在提交前已结束；可以保留编辑并重新核对执行条件。');return;}
       throw error;
     }
     await resultView(data.merge);
     if(entry.status==='needs_review'){$('repair-merge').hidden=false;pending.requestHash=entry.requestHash;store();status('结果需要核对；写入保持暂停。可检查日志后点击恢复。');}
     else{pending=null;store();$('recover-merge').hidden=true;$('repair-merge').hidden=true;}
   }catch(error){status('尚未核实原请求：'+error.message);}finally{setBusy(false);}
 }
 $('review-merge').addEventListener('click',async()=>{
   const state=getState();if(executing||pending)return status('请先核对上一次合并结果。');
   if(!state.plan||state.dirty||state.pending||state.stale)return say('请先保存当前方案，并完成变化的重新核对。','error');
   setBusy(true);$('review-merge').disabled=true;
   try{
     review=await request('/api/merge-review',{body:{planId:state.plan.planId,planRevision:state.plan.planRevision},timeout:300000});
     $('execute-preview').innerHTML=`<div class="preview-box"><h3>${escape(review.record.core.title)}</h3><p>${escape(review.primaryId)} ← ${escape(review.secondaryId)}</p><p>当前公开${review.beforePublicCount}件 → 合并后${review.afterPublicCount}件；保留${review.imageCount}幅影像，涉及${review.affectedIds.length}件记录。</p><div class="plain-text">${escape(review.record.public_view.description)}</div><details><summary>核对拟采用的电子转录</summary><pre>${escape(review.record.public_view.transcription??'未维护电子转录')}</pre></details><ol>${review.images.map(image=>`<li><a href="${escape(image.url)}" target="_blank" rel="noopener">第${image.position}幅 · ${escape(image.description||image.filename)}</a></li>`).join('')}</ol><ul>${review.warnings.map(value=>`<li>${escape(value)}</li>`).join('')}</ul></div>`;
     $('merge-checklist').innerHTML=checklist.map((text,index)=>`<label class="merge-check"><input type="checkbox" data-merge-check="${index}"><span>${index+1}. ${escape(text)}</span></label>`).join('');
     $('execute-form').reset();$('execute-controls').disabled=false;$('merge-primary-confirm').placeholder=review.primaryId;$('execute-submit').disabled=true;status('请本人逐项核对。有效至 '+new Date(review.expiresAt).toLocaleTimeString('zh-CN'));
     $('execute-dialog').showModal();
   }catch(error){say(error.message,'error');}finally{setBusy(false);$('review-merge').disabled=false;}
 });
 $('execute-form').addEventListener('input',()=>{$('execute-submit').disabled=executing||!review||Date.now()>=Date.parse(review.expiresAt)||$('merge-primary-confirm').value.trim()!==review.primaryId||[...document.querySelectorAll('[data-merge-check]')].some(input=>!input.checked)||!$('authorize-primary').checked||!$('authorize-secondary').checked;});
 $('execute-form').addEventListener('submit',async event=>{
   event.preventDefault();if(executing||pending||$('execute-submit').disabled)return;
   pending={id:crypto.randomUUID(),step:crypto.randomUUID()};store();executing=true;setBusy(true);$('execute-controls').disabled=true;$('execute-submit').disabled=true;$('execute-close').disabled=true;$('cancel-merge').hidden=false;status('正在检查、保存快照和构建独立候选版本…');
   poll=setInterval(progress,2500);
   try{
     const response=await request('/api/merge',{body:{planId:review.planId,planRevision:review.planRevision,reviewId:review.reviewId,confirmPrimaryId:$('merge-primary-confirm').value.trim(),confirmations:[...document.querySelectorAll('[data-merge-check]')].map(input=>input.checked),publicationAuthorization:{publishMergedPrimary:$('authorize-primary').checked,withdrawSecondary:$('authorize-secondary').checked}},operation:pending,timeout:900000});
     await resultView(response.merge);pending=null;store();
   }catch(error){
     $('recover-merge').hidden=false;status('本次结果需核实，未再次提交。'+error.message);
   }finally{clearInterval(poll);executing=false;setBusy(false);$('execute-close').disabled=false;$('cancel-merge').hidden=true;if(pending)await recover();}
 });
 $('execute-close').addEventListener('click',()=>{if(!executing)$('execute-dialog').close();});
 $('execute-dialog').addEventListener('cancel',event=>{if(executing)event.preventDefault();});
 $('cancel-merge').addEventListener('click',async()=>{if(!pending||!executing)return;$('cancel-merge').disabled=true;status('已请求取消；等待实际构建和恢复结束，不会提前报告成功。');try{await request('/api/cancel-operation',{body:{operationId:pending.id},timeout:900000});}catch(error){status(error.message);}finally{$('cancel-merge').disabled=false;}});
 $('recover-merge').addEventListener('click',recover);
 $('repair-merge').addEventListener('click',async()=>{if(!pending?.requestHash||executing)return;setBusy(true);try{await request('/api/merge-recover',{body:{operationId:pending.id,stepId:pending.step,requestHash:pending.requestHash},timeout:300000});await recover();}catch(error){status('未能证明恢复完成，写入仍暂停：'+error.message);}finally{setBusy(false);}});
 document.addEventListener('merge-show-result',async event=>{try{await resultView((await request('/api/merges/'+event.detail)).merge);}catch(error){say(error.message,'error');}});
 document.addEventListener('merge-workspace-changed',()=>{if(!pending&&!executing){review=null;$('review-merge').disabled=false;$('merge-execution-result').textContent='';}});
 window.addEventListener('beforeunload',event=>{if(pending){event.preventDefault();event.returnValue='';}});
 await (await import('./merge-undo.js?v=1')).initializeMergeUndo({request,setBusy,onCommitted,say,capability});
 try{const old=JSON.parse(sessionStorage.getItem(storageKey)??'null');if(old&&/^[a-f0-9-]{36}$/i.test(old.id)&&/^[a-f0-9-]{36}$/i.test(old.step)){pending=old;$('recover-merge').hidden=false;$('compare-panel').hidden=false;$('plan-form').hidden=true;await recover();}}catch{}
}
