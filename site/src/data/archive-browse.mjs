/**
 * 先逐件完成筛选和排序，再收拢相册；不把不同成员的字段拼成一次匹配。
 * @param {Array<{ id: string, albumKey?: string }>} records
 * @param {string} mode
 * @returns {Array<{ kind: 'album' | 'item', key: string, memberIds: string[] }>}
 */
export const groupArchiveMatches = (records, mode = 'grouped') => {
  /** @type {Array<{ kind: 'album' | 'item', key: string, memberIds: string[] }>} */
  const groups = [];
  /** @type {Map<string, { kind: 'album', key: string, memberIds: string[] }>} */
  const albumGroups = new Map();
  const seen = new Set();
  for (const record of records) {
    if (!record?.id || seen.has(record.id)) continue;
    seen.add(record.id);
    if (mode === 'items' || !record.albumKey) {
      if (mode !== 'albums') groups.push({ kind: 'item', key: record.id, memberIds: [record.id] });
      continue;
    }
    let group = albumGroups.get(record.albumKey);
    if (!group) {
      group = { kind: 'album', key: record.albumKey, memberIds: [] };
      albumGroups.set(record.albumKey, group);
      groups.push(group);
    }
    group.memberIds.push(record.id);
  }
  return groups;
};
