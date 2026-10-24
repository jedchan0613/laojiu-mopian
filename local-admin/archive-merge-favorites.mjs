// 仅复用账号服务自己的SQLite连接；不建立档案数据库或读取档案主库。
import { digest, operationIdPattern, WriteSafetyError } from './write-coordinator.mjs';
const itemPattern=/^LJM-\d{8}-[A-Z]{3}-\d{3}$/;
const fail=(message,code='MERGE_FAVORITES_CONFLICT')=>{throw new WriteSafetyError(message,423,code);};

export function createFavoriteMergeAdapter(database) {
  database.exec(`CREATE TABLE IF NOT EXISTS archive_merge_events (
    merge_id TEXT PRIMARY KEY, primary_id TEXT NOT NULL, secondary_id TEXT NOT NULL,
    status TEXT NOT NULL, before_json TEXT NOT NULL, after_json TEXT NOT NULL DEFAULT '[]');
    CREATE TABLE IF NOT EXISTS archive_item_aliases (
    source_id TEXT PRIMARY KEY, target_id TEXT NOT NULL, merge_id TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS archive_merge_undo_events (
    undo_id TEXT PRIMARY KEY, merge_id TEXT NOT NULL, primary_id TEXT NOT NULL, secondary_id TEXT NOT NULL,
    status TEXT NOT NULL, before_json TEXT NOT NULL, after_json TEXT NOT NULL DEFAULT '[]');`);
  const rows=ids=>database.prepare('SELECT user_id,item_id,created_at FROM favorites WHERE item_id IN (?,?) ORDER BY user_id,item_id').all(...ids).map(row=>({...row}));
  const get=id=>database.prepare('SELECT * FROM archive_merge_events WHERE merge_id=?').get(id);
  const transaction=callback=>{
    database.exec('BEGIN IMMEDIATE');
    try{const value=callback();database.exec('COMMIT');return value;}
    catch(error){database.exec('ROLLBACK');throw error;}
  };
  const active=()=>[...database.prepare("SELECT * FROM archive_merge_events WHERE status IN ('locked','applied')").all(),...database.prepare("SELECT * FROM archive_merge_undo_events WHERE status IN ('locked','applied')").all()];
  const assertPair=(primary,secondary)=>{if(!itemPattern.test(primary)||!itemPattern.test(secondary)||primary===secondary)fail('收藏迁移目标无效。');};
  const inspect=ids=>{assertPair(...ids);const values=rows(ids);return{rows:values,digest:digest(values)};};
  const undoGet=id=>database.prepare('SELECT * FROM archive_merge_undo_events WHERE undo_id=?').get(id);
  const reviewUndo=mergeId=>{
    const parent=get(mergeId);if(!parent||parent.status!=='committed')fail('原收藏迁移未完成或已经撤销。');
    const ids=[parent.primary_id,parent.secondary_id],current=inspect(ids),conflicts=[];
    if(current.digest!==digest(JSON.parse(parent.after_json)))conflicts.push('合并后有新收藏、取消收藏或收藏时间变化，不能覆盖这些新意愿。');
    const alias=database.prepare('SELECT * FROM archive_item_aliases WHERE source_id=?').get(parent.secondary_id);
    if(!alias||alias.target_id!==parent.primary_id||alias.merge_id!==mergeId)conflicts.push('收藏旧号去向已有变化，不能自动撤销。');
    if(active().some(row=>[row.primary_id,row.secondary_id].some(id=>ids.includes(id))))conflicts.push('收藏已有未核实操作，不能叠加恢复。');
    for(const row of JSON.parse(parent.before_json)){const user=database.prepare('SELECT status FROM users WHERE id=?').get(row.user_id);if(!user||user.status==='pending_deletion')conflicts.push('涉及已不存在或注销处理中的账号，不能通过撤销恢复其收藏。');}
    return{digest:current.digest,conflicts:[...new Set(conflicts)],currentCount:current.rows.length,restoredCount:JSON.parse(parent.before_json).length};
  };
  return {
    inspect,reviewUndo,
    resolveForWrite(id){
      if(active().some(row=>[row.primary_id,row.secondary_id].includes(id)))fail('这件档案正在完成合并，收藏暂不能修改，请稍后重试。','MERGE_FAVORITES_LOCKED');
      const alias=database.prepare('SELECT target_id FROM archive_item_aliases WHERE source_id=?').get(id);
      const target=alias?.target_id??id;
      if(active().some(row=>[row.primary_id,row.secondary_id].includes(target)))fail('这件档案正在核对合并结果，请稍后重试。','MERGE_FAVORITES_LOCKED');
      return target;
    },
    assertReadable(userId){
      if(active().some(row=>JSON.parse(row.before_json).some(value=>value.user_id===userId)))fail('收藏中的档案正在完成合并，请稍后刷新。','MERGE_FAVORITES_LOCKED');
    },
    begin({mergeId,primaryId,secondaryId,expectedDigest}){
      if(!operationIdPattern.test(mergeId))fail('收藏迁移操作编号无效。');assertPair(primaryId,secondaryId);
      return transaction(()=>{
        const existing=get(mergeId);
        if(existing){if(existing.primary_id!==primaryId||existing.secondary_id!==secondaryId)fail('同一迁移编号不能用于其他档案。');return{status:existing.status};}
        if(active().some(row=>[row.primary_id,row.secondary_id].some(id=>[primaryId,secondaryId].includes(id))))fail('收藏已有待核对的合并操作。');
        if(database.prepare('SELECT 1 FROM archive_item_aliases WHERE source_id IN (?,?) OR target_id=?').get(primaryId,secondaryId,secondaryId))fail('既有收藏合并链不支持本次方向。');
        const current=inspect([primaryId,secondaryId]);if(current.digest!==expectedDigest)fail('收藏在核对期间发生变化，请重新核对。');
        database.prepare("INSERT INTO archive_merge_events(merge_id,primary_id,secondary_id,status,before_json) VALUES(?,?,?,'locked',?)").run(mergeId,primaryId,secondaryId,JSON.stringify(current.rows));
        return{status:'locked'};
      });
    },
    apply(mergeId){return transaction(()=>{
      const event=get(mergeId);if(!event)fail('收藏迁移日志不存在。');
      if(['applied','committed'].includes(event.status))return{status:event.status};
      if(event.status!=='locked')fail('收藏迁移状态不能提交。');
      const before=JSON.parse(event.before_json),ids=[event.primary_id,event.secondary_id];
      if(digest(rows(ids))!==digest(before))fail('收藏锁定后出现外部写入，已停止提交。');
      const byUser=new Map();for(const row of before){const prior=byUser.get(row.user_id);if(!prior||row.created_at<prior.created_at)byUser.set(row.user_id,row);}
      database.prepare('DELETE FROM favorites WHERE item_id IN (?,?)').run(...ids);
      for(const row of byUser.values())database.prepare('INSERT INTO favorites(user_id,item_id,created_at) VALUES(?,?,?)').run(row.user_id,event.primary_id,row.created_at);
      database.prepare('INSERT INTO archive_item_aliases(source_id,target_id,merge_id) VALUES(?,?,?)').run(event.secondary_id,event.primary_id,mergeId);
      // 旧别名直接指向最终主件，不形成链；该方向首版只允许既有主件继续作主件。
      database.prepare('UPDATE archive_merge_events SET status=?,after_json=? WHERE merge_id=?').run('applied',JSON.stringify(rows(ids)),mergeId);
      return{status:'applied',beforeCount:before.length,afterCount:byUser.size};
    });},
    finalize(mergeId){return transaction(()=>{
      const event=get(mergeId);if(!event||!['applied','committed'].includes(event.status))fail('收藏尚未完成迁移，不能解除门禁。');
      database.prepare("UPDATE archive_merge_events SET status='committed' WHERE merge_id=?").run(mergeId);return{status:'committed'};
    });},
    rollback(mergeId){return transaction(()=>{
      const event=get(mergeId);if(!event)return{status:'not-started'};
      if(event.status==='rolled-back')return{status:event.status};
      if(event.status==='committed')fail('已完成迁移不能直接回退；须使用后续撤销冲突检查。');
      if(event.status==='applied'){
        const ids=[event.primary_id,event.secondary_id],before=JSON.parse(event.before_json);
        if(digest(rows(ids))!==digest(JSON.parse(event.after_json)))fail('迁移后的收藏已有新变化，禁止覆盖。');
        for(const row of before)if(!database.prepare('SELECT 1 FROM users WHERE id=?').get(row.user_id))fail('账号已不存在，不能通过回退恢复账号或收藏。');
        database.prepare('DELETE FROM favorites WHERE item_id IN (?,?)').run(...ids);
        for(const row of before)database.prepare('INSERT INTO favorites(user_id,item_id,created_at) VALUES(?,?,?)').run(row.user_id,row.item_id,row.created_at);
        database.prepare('DELETE FROM archive_item_aliases WHERE source_id=? AND merge_id=?').run(event.secondary_id,mergeId);
      }
      database.prepare("UPDATE archive_merge_events SET status='rolled-back' WHERE merge_id=?").run(mergeId);return{status:'rolled-back'};
    });},
    status(mergeId){const event=get(mergeId);return event?{status:event.status,primaryId:event.primary_id,secondaryId:event.secondary_id}:null;},
    beginUndo({mergeId:undoId,parentMergeId,primaryId,secondaryId,expectedDigest}){
      if(!operationIdPattern.test(undoId)||!operationIdPattern.test(parentMergeId))fail('撤销收藏操作编号无效。');
      return transaction(()=>{
        const prior=undoGet(undoId);if(prior){if(prior.merge_id!==parentMergeId)fail('同一撤销编号不能复用。');return{status:prior.status};}
        const parent=get(parentMergeId),review=reviewUndo(parentMergeId);
        if(parent.primary_id!==primaryId||parent.secondary_id!==secondaryId||review.digest!==expectedDigest||review.conflicts.length)fail(review.conflicts.join('；')||'收藏核对后已有变化。');
        database.prepare("INSERT INTO archive_merge_undo_events(undo_id,merge_id,primary_id,secondary_id,status,before_json) VALUES(?,?,?,?,'locked',?)").run(undoId,parentMergeId,primaryId,secondaryId,JSON.stringify(rows([primaryId,secondaryId])));
        return{status:'locked'};
      });
    },
    applyUndo(undoId){return transaction(()=>{
      const event=undoGet(undoId);if(!event)fail('撤销收藏日志不存在。');if(['applied','committed'].includes(event.status))return{status:event.status};if(event.status!=='locked')fail('撤销收藏状态无效。');
      const parent=get(event.merge_id),ids=[event.primary_id,event.secondary_id],restore=JSON.parse(parent.before_json);
      if(parent.status!=='committed'||digest(rows(ids))!==digest(JSON.parse(event.before_json)))fail('收藏或原合并状态在提交期间变化。');
      for(const row of restore){const user=database.prepare('SELECT status FROM users WHERE id=?').get(row.user_id);if(!user||user.status==='pending_deletion')fail('账号已不存在或正在注销，不能恢复其收藏。');}
      database.prepare('DELETE FROM favorites WHERE item_id IN (?,?)').run(...ids);
      for(const row of restore)database.prepare('INSERT INTO favorites(user_id,item_id,created_at) VALUES(?,?,?)').run(row.user_id,row.item_id,row.created_at);
      const changed=database.prepare('DELETE FROM archive_item_aliases WHERE source_id=? AND target_id=? AND merge_id=?').run(event.secondary_id,event.primary_id,event.merge_id);if(changed.changes!==1)fail('收藏旧号映射变化，已停止恢复。');
      database.prepare("UPDATE archive_merge_undo_events SET status='applied',after_json=? WHERE undo_id=?").run(JSON.stringify(rows(ids)),undoId);return{status:'applied'};
    });},
    finalizeUndo(undoId){return transaction(()=>{
      const event=undoGet(undoId);if(!event||!['applied','committed'].includes(event.status))fail('撤销收藏尚未完成。');
      database.prepare("UPDATE archive_merge_undo_events SET status='committed' WHERE undo_id=?").run(undoId);
      database.prepare("UPDATE archive_merge_events SET status='reverted' WHERE merge_id=?").run(event.merge_id);return{status:'committed'};
    });},
    rollbackUndo(undoId){return transaction(()=>{
      const event=undoGet(undoId);if(!event)return{status:'not-started'};if(event.status==='rolled-back')return{status:event.status};if(event.status==='committed')fail('已完成撤销不能作为失败补偿回滚。');
      if(event.status==='applied'){
        const ids=[event.primary_id,event.secondary_id];if(digest(rows(ids))!==digest(JSON.parse(event.after_json)))fail('恢复后的收藏出现新意愿，不能盲目覆盖。');
        const restore=JSON.parse(event.before_json);for(const row of restore)if(!database.prepare('SELECT 1 FROM users WHERE id=?').get(row.user_id))fail('账号已被清理，不能通过回退复活。');
        if(database.prepare('SELECT 1 FROM archive_item_aliases WHERE source_id=?').get(event.secondary_id))fail('旧号已有其他去向，不能覆盖。');
        database.prepare('DELETE FROM favorites WHERE item_id IN (?,?)').run(...ids);for(const row of restore)database.prepare('INSERT INTO favorites(user_id,item_id,created_at) VALUES(?,?,?)').run(row.user_id,row.item_id,row.created_at);
        database.prepare('INSERT INTO archive_item_aliases(source_id,target_id,merge_id) VALUES(?,?,?)').run(event.secondary_id,event.primary_id,event.merge_id);
      }
      database.prepare("UPDATE archive_merge_undo_events SET status='rolled-back' WHERE undo_id=?").run(undoId);return{status:'rolled-back'};
    });},
    undoStatus(undoId){const event=undoGet(undoId);return event?{status:event.status,primaryId:event.primary_id,secondaryId:event.secondary_id}:null;},
  };
}
