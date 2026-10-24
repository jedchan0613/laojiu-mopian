// 私密本机恢复入口。任何公开恢复都需要新的人工检查，不沿用原合并授权。
const $=id=>document.getElementById(id);
const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const storageKey='ljm-private-merge-undo-operation';
const labels={committed:'已完成',reverted:'已撤销合并','rolled-back':'未提交，已恢复','needs_review':'需要核对','drafts-created':'恢复草稿已生成','proposal-only':'恢复提案已另存'};
const checks=[
 '确认本人有权恢复这两件及其关联资料。','核对两件题名、年代、地点等信息，没有把推测当成确证。',
 '逐张核对原图片、顺序、图注和电子转录，未遗漏页。','核对姓名、落款和可以识别人物的文字。',
 '核对门牌、楼栋、室号等精确私人地址。','核对证件号、卡号、账号、电话及其他隐私编码。',
 '重点核对医疗、健康、未成年人和私人叙述。','核对人脸、肖像及恢复组合后的识别风险。',
 '确认发布副本经过必要遮盖，原始主档保持不动。','核对隐含图片信息、使用权及公开范围。',
 '核对相册、引用、收藏和译文的恢复影响。','确认没有未处理的借阅、审批、移交、保全或其他占用。',
 '确认两个完整编号和恢复范围，理解这是一次新的发布操作。',
];

export async function initializeMergeUndo({request,setBusy,onCommitted,say,capability}){
 if(!capability.undoEnabled)return;
 const panel=document.createElement('section');panel.className='panel undo-panel';panel.id='undo-panel';
 panel.innerHTML='<div class="section-heading"><h2>合并记录与恢复</h2><button type="button" id="refresh-merges">刷新记录</button></div><p class="help">恢复默认只生成私密草稿；恢复发布需重新检查两件和所有影响。历史记录不设自动删除期限。</p><div id="merge-history"></div><button type="button" id="undo-recover" hidden>核对上一次恢复结果</button><button type="button" id="undo-repair" hidden>核对并恢复中断操作</button><p id="undo-status" role="status" aria-live="polite"></p><div id="undo-result"></div>';
 document.querySelector('.plans-panel').append(panel);
 const dialog=document.createElement('dialog');dialog.id='undo-dialog';dialog.setAttribute('aria-labelledby','undo-heading');
 dialog.innerHTML='<h2 id="undo-heading">核对撤销合并的影响</h2><p>先对照原件和后续变化。生成草稿不会改变当前网站；恢复发布是新的发布操作。</p><div id="undo-preview"></div><form id="undo-form"><fieldset id="undo-controls"><legend>恢复方式</legend><label>选择方式<select id="undo-mode"><option value="drafts">仅生成恢复草稿（默认）</option><option value="republish">恢复两件并重新发布</option></select></label><label class="merge-check" id="undo-replace-label" hidden><input id="undo-replace" type="checkbox">已有草稿时，先备份原草稿和图片，再替换成恢复草稿（不勾选则另存提案）</label><div id="undo-publication" hidden><div id="undo-checklist"></div><label>输入原主档案完整编号<input id="undo-primary" autocomplete="off" spellcheck="false"></label><label>输入原从档案完整编号<input id="undo-secondary" autocomplete="off" spellcheck="false"></label><label class="merge-check"><input id="undo-scope" type="checkbox">同意恢复发布两件、恢复本次合并改动过的引用、收藏和旧号去向；相关译文回到待核对状态</label><label class="merge-check" id="undo-consume-label" hidden><input id="undo-consume" type="checkbox">同意先备份、再结算这次未编辑的恢复草稿</label></div></fieldset><p id="undo-progress" role="status" aria-live="polite"></p><div class="section-actions"><button type="button" id="undo-close">返回</button><button type="button" id="undo-cancel" hidden>请求取消并等待结果</button><button type="submit" class="primary" id="undo-submit" disabled>生成恢复草稿</button></div></form>';
 document.body.append(dialog);
 let review=null,pending=null,running=false,timer=null;
 const status=text=>{$('undo-status').textContent=text;$('undo-progress').textContent=text;};
 const store=()=>{try{pending?sessionStorage.setItem(storageKey,JSON.stringify(pending)):sessionStorage.removeItem(storageKey);}catch{}};
 const endpoint=()=>`/api/merge-undo-result/${pending.mode}/${pending.id}/${pending.step}`;
 async function refresh(){const data=await request('/api/merges');$('merge-history').innerHTML=data.merges.filter(row=>row.operationKind==='merge').map(row=>`<article class="plan-card"><strong>${escape(row.primaryId)} ← ${escape(row.secondaryId)}</strong><small>${escape(new Date(row.createdAt).toLocaleString('zh-CN'))} · ${escape(labels[row.status]??row.status)}</small><button type="button" data-merge-result="${escape(row.mergeId)}">查看记录</button>${row.status==='committed'?` <button type="button" data-undo="${escape(row.mergeId)}">检查恢复条件</button>`:''}</article>`).join('')||'<p class="help">当前身份还没有可查看的合并记录。</p>';}
 async function showResult(undo){
   const isDraft=undo.mode==='drafts';
   const message=undo.status==='rolled-back'?'本次恢复未提交，已回到操作前状态；提案与核对证据保留。':undo.status==='needs_review'?'尚未证明恢复完成，写入保持暂停，请核对原操作。':isDraft?(['drafts-created','proposal-only'].includes(undo.status)?(undo.proposalOnly?'现有草稿和公开内容未改动，恢复提案保存在私密操作记录中。':'已生成两件SUS/Y/U0恢复草稿，当前公开内容和收藏未改动。'):'恢复尚未结束，请等待实际结果。'):undo.status==='committed'?'两件已恢复发布；原合并与本次恢复日志均保留。':'请按执行记录核对恢复状态。';
   $('undo-result').innerHTML=`<article class="preview-box"><h3>${escape(labels[undo.status]??undo.status)}</h3><p>${escape(message)}</p><ul>${(undo.records??[{itemId:undo.primary_id},{itemId:undo.secondary_id}]).map(row=>`<li>${escape(row.itemId)} ${escape(row.title??'')}</li>`).join('')}</ul></article>`;
   status(labels[undo.status]??undo.status);
   if(['drafts-created','proposal-only','committed'].includes(undo.status)){dialog.close();await onCommitted();await refresh();if(!isDraft&&undo.parent_merge_id)document.dispatchEvent(new CustomEvent('merge-show-result',{detail:undo.parent_merge_id}));say(isDraft?'恢复草稿或提案已保存；当前网站未改变。':'两件已在本机恢复发布；生产环境未改变。','success');}
 }
 async function recover(){
   if(!pending||running)return;setBusy(true);
   try{
     const entries=(await request('/api/operations/'+pending.id)).operations,entry=entries.find(row=>row.stepId===pending.step);
     if(!entry)return status('尚无可靠的操作收据，请稍后核对，不要重新提交。');
     if(['queued','running'].includes(entry.status))return status('原操作仍在执行，请等待实际结束。');
     let undo;try{undo=(await request(endpoint())).undo;}catch(error){if(['failed','cancelled'].includes(entry.status)&&(error.status===404||error.code==='MERGE_RESULT_UNKNOWN')){pending=null;store();$('undo-recover').hidden=true;return status('操作在提交前已结束；可重新检查恢复条件。');}throw error;}
     await showResult(undo);
     if(entry.status==='needs_review'){pending.requestHash=entry.requestHash;store();$('undo-repair').hidden=false;status('需要核对中断操作，写入保持暂停。');}
     else{pending=null;store();$('undo-recover').hidden=true;$('undo-repair').hidden=true;}
   }catch(error){status('原操作结果尚未核实：'+error.message);}finally{setBusy(false);}
 }
 function validate(){
   const publish=$('undo-mode').value==='republish';$('undo-publication').hidden=!publish;$('undo-replace-label').hidden=publish||!review?.hasExistingDrafts;
   $('undo-submit').textContent=publish?'确认恢复两件并在本机发布':'生成恢复草稿';
   $('undo-submit').disabled=running||Boolean(pending)||!review||Date.now()>=Date.parse(review.expiresAt)||(publish?(!review.canPublish||$('undo-primary').value.trim()!==review.primaryId||$('undo-secondary').value.trim()!==review.secondaryId||[...document.querySelectorAll('[data-undo-check]')].some(row=>!row.checked)||!$('undo-scope').checked||review.hasExistingDrafts&&!$('undo-consume').checked):!review.canCreateDrafts);
 }
 async function begin(mergeId){
   if(running||pending)return status('请先核对上一次操作的结果。');setBusy(true);
   try{
     review=await request('/api/merge-undo-review',{body:{mergeId},timeout:300000});
     $('undo-preview').innerHTML=`<p>${escape(review.message)}</p><div class="issue-list ${review.conflicts.length?'blocked':''}">${review.conflicts.length?'<strong>以下变化阻止自动恢复发布：</strong><ul>'+review.conflicts.map(row=>`<li>${escape(row.itemId??'')} ${escape(row.message)}</li>`).join('')+'</ul>':'未发现阻止恢复发布的后续变化。'}</div>${(review.existingDrafts??[]).map(row=>`<details><summary>${escape(row.itemId)}：已有草稿${row.unchangedRecovery?'（本次未编辑的恢复草稿）':'（后续工作，将优先保留）'}</summary><pre>${escape(JSON.stringify(row.record,null,2))}</pre></details>`).join('')}${review.threeWay.map(row=>`<details><summary>${escape(row.itemId)}：合并后出现的新变化</summary>${row.changes.map(change=>`<h4>${escape(change.path)}</h4><div class="undo-three"><pre>合并前：${escape(JSON.stringify(change.before,null,2))}</pre><pre>合并后：${escape(JSON.stringify(change.merged,null,2))}</pre><pre>当前：${escape(JSON.stringify(change.current,null,2))}</pre></div>`).join('')}</details>`).join('')}<div class="record-comparison">${review.originals.map(row=>`<article class="source-card"><h3>${escape(row.record?.core.title??'快照缺失')}</h3><p>${escape(row.record?.core.item_id)}</p><p>${escape(row.record?.public_view.description)}</p><details><summary>电子转录</summary><pre>${escape(row.record?.public_view.transcription??'未维护')}</pre></details>${row.images.map(image=>`<a href="${escape(image.url)}" target="_blank" rel="noopener"><img src="${escape(image.url)}" alt="第${image.position}幅历史发布副本" loading="lazy"></a>`).join('')}</article>`).join('')}</div>`;
     $('undo-form').reset();$('undo-controls').disabled=false;$('undo-primary').placeholder=review.primaryId;$('undo-secondary').placeholder=review.secondaryId;
     $('undo-checklist').innerHTML=checks.map((text,index)=>`<label class="merge-check"><input type="checkbox" data-undo-check="${index}"><span>${index+1}. ${escape(text)}</span></label>`).join('');
     $('undo-consume-label').hidden=!review.hasExistingDrafts;$('undo-mode').querySelector('[value="republish"]').disabled=!review.canPublish;validate();status('请核对恢复方案。核对有效至 '+new Date(review.expiresAt).toLocaleTimeString('zh-CN'));dialog.showModal();
   }catch(error){say(error.message,'error');}finally{setBusy(false);}
 }
 $('merge-history').addEventListener('click',event=>{const undo=event.target.closest('[data-undo]'),result=event.target.closest('[data-merge-result]');if(undo)begin(undo.dataset.undo);if(result)document.dispatchEvent(new CustomEvent('merge-show-result',{detail:result.dataset.mergeResult}));});
 $('refresh-merges').addEventListener('click',()=>refresh().catch(error=>say(error.message,'error')));
 $('undo-form').addEventListener('input',validate);$('undo-mode').addEventListener('change',validate);
 $('undo-form').addEventListener('submit',async event=>{
   event.preventDefault();validate();if($('undo-submit').disabled)return;
   const mode=$('undo-mode').value;
   const body={mergeId:review.mergeId,reviewId:review.reviewId,mode,...(mode==='drafts'?{replaceExistingDrafts:$('undo-replace').checked}:{confirmPrimaryId:$('undo-primary').value.trim(),confirmSecondaryId:$('undo-secondary').value.trim(),confirmations:[...document.querySelectorAll('[data-undo-check]')].map(row=>row.checked),publicationAuthorization:{restorePrimary:true,restoreSecondary:true,restoreReferences:$('undo-scope').checked,...(review.hasExistingDrafts?{consumeRecoveryDrafts:$('undo-consume').checked}:{})}})};
   pending={id:crypto.randomUUID(),step:crypto.randomUUID(),mode};store();running=true;setBusy(true);$('undo-controls').disabled=true;$('undo-close').disabled=true;$('undo-submit').disabled=true;$('undo-cancel').hidden=false;status('正在准备私密快照并检查恢复条件…');
   timer=setInterval(async()=>{try{const{undo}=await request(endpoint(),{timeout:5000});status(labels[undo.status]??'恢复进行中：'+undo.phase);}catch{}},2500);
   try{const result=await request('/api/merge-undo',{body,operation:pending,timeout:900000});await showResult(result.undo);pending=null;store();}
   catch(error){$('undo-recover').hidden=false;status('结果需要核实，不会重复提交。'+error.message);}
   finally{clearInterval(timer);running=false;setBusy(false);$('undo-close').disabled=false;$('undo-cancel').hidden=true;if(pending)await recover();}
 });
 $('undo-close').addEventListener('click',()=>{if(!running)dialog.close();});dialog.addEventListener('cancel',event=>{if(running)event.preventDefault();});
 $('undo-cancel').addEventListener('click',async()=>{if(!running||!pending)return;$('undo-cancel').disabled=true;status('已请求取消，等待实际恢复结束。');try{await request('/api/cancel-operation',{body:{operationId:pending.id},timeout:900000});}catch(error){status(error.message);}finally{$('undo-cancel').disabled=false;}});
 $('undo-recover').addEventListener('click',recover);
 $('undo-repair').addEventListener('click',async()=>{if(!pending?.requestHash||running)return;try{await request('/api/merge-recover',{body:{operationId:pending.id,stepId:pending.step,requestHash:pending.requestHash},timeout:300000});await recover();}catch(error){status('仍不能证明恢复完成：'+error.message);}});
 document.addEventListener('merge-records-updated',()=>refresh().catch(error=>say(error.message,'error')));
 window.addEventListener('beforeunload',event=>{if(pending){event.preventDefault();event.returnValue='';}});
 await refresh();
 try{const old=JSON.parse(sessionStorage.getItem(storageKey)??'null');if(old&&/^[a-f0-9-]{36}$/i.test(old.id)&&/^[a-f0-9-]{36}$/i.test(old.step)&&['drafts','republish'].includes(old.mode)){pending=old;$('undo-recover').hidden=false;await recover();}}catch{}
}
