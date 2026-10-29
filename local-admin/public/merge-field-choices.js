// 只整理方案中的字段选择；不保存方案、不处理附件或发布状态。
export function chooseMergeFieldSource(fields, choices, source) {
  if (!['primary', 'secondary'].includes(source)) throw new TypeError('请选择主档案或从档案。');
  const next = structuredClone(choices), paths = [];
  for (const field of fields) {
    if (field.readonly || !field.allowedChoices?.includes(source)) continue;
    const decision = choices[field.path] ?? (field.defaultChoice ? { choice: field.defaultChoice } : null);
    if (decision?.choice === source) continue;
    next[field.path] = { choice: source };
    paths.push(field.path);
  }
  return {
    choices: next,
    changed: paths.length,
    undo: paths.length ? { before: structuredClone(choices), after: structuredClone(next), paths } : null,
  };
}

export function undoMergeFieldSource(choices, undo) {
  const next = structuredClone(choices);
  let restored = 0, kept = 0;
  for (const fieldPath of undo?.paths ?? []) {
    // 批量选择后又逐项修改的内容继续保留，避免撤销时丢掉较新的人工编辑。
    if (JSON.stringify(choices[fieldPath]) !== JSON.stringify(undo.after[fieldPath])) { kept++; continue; }
    if (Object.hasOwn(undo.before, fieldPath)) next[fieldPath] = structuredClone(undo.before[fieldPath]);
    else delete next[fieldPath];
    restored++;
  }
  return { choices: next, restored, kept };
}
