// 2026-10-15 所有人明确批准：本册按真实缺项公开，不新增分类代码。
// 这是一份限定永久编号的发布授权，不改变 Excel 字典或其他档案的必填规则。
export const albumMissingMetadataNotice = '资料说明：照片背面未提供，实物保存状态待核；原册页序未记录。';
const approvedIds = new Set([
  ...Array.from({ length: 55 }, (_, i) => `LJM-20260909-PHO-${String(i + 1).padStart(3, '0')}`),
  'LJM-20260909-ALB-001',
]);
const meaningful = value => Array.isArray(value) ? value.some(meaningful) : value !== undefined && value !== null && String(value).trim() !== '';

export const filterApprovedMetadataIssues = (record, issues) => {
  const core = record?.core;
  if (!approvedIds.has(core?.item_id) || core?.album_id !== 'LJM-A20260909-01' ||
    core?.batch_id !== 'LJM-20260909-B01' || core?.accession_date !== '2026-09-09' ||
    record?.metadata?.schema !== 'photo' || !['PHO', 'ALB'].includes(core?.object_type) ||
    !record?.public_view?.description?.includes(albumMissingMetadataNotice)) return issues;
  const dimensions = record.metadata.dimensions ?? {};
  const empty = (field, dimension) => !meaningful(core[field]) && !meaningful(dimensions[dimension]?.[field]);
  const allowed = new Set();
  if (empty('verso_types', 'D12')) {
    allowed.add('collection_code_required_D12_verso_types');
    if (empty('verso_transcription', 'D12')) allowed.add('collection_required_D12');
  }
  if (empty('condition_grade', 'D16')) allowed.add('collection_code_required_D16_condition_grade');
  if (empty('condition_details', 'D16')) allowed.add('collection_code_required_D16_condition_details');
  if (empty('condition_grade', 'D16') && empty('condition_details', 'D16') && empty('treatment_notes', 'D16')) allowed.add('collection_required_D16');
  // 仅认可缺失项；非法代码、隐私、图像、身份与其他维度的错误不在授权范围内。
  return issues.filter(issue => !allowed.has(issue.code));
};
