// 2026-10-15 所有人明确批准：本册按真实缺项公开，不新增分类代码。
// 这是一份限定永久编号的发布授权，不改变 Excel 字典或其他档案的必填规则。
export const albumMissingMetadataNotice = '资料说明：照片背面未提供，实物保存状态待核；原册页序未记录。';
const approvedIds = new Set([
  ...Array.from({ length: 55 }, (_, i) => `LJM-20260909-PHO-${String(i + 1).padStart(3, '0')}`),
  'LJM-20260909-ALB-001',
]);
const meaningful = value => Array.isArray(value) ? value.some(meaningful) : value !== undefined && value !== null && String(value).trim() !== '';

// 2026-10-19 所有人授权拆分这套七张照片并直接上线，缺失信息据实说明。
// 只豁免本套未提供的背面资料，以及线上总册不存在的实物保存评级。
export const dalianMissingMetadataNotice = '资料说明：照片背面未提供，背面文字待核；未见实物册页或封面，图序为本次整理顺序。';
const dalianIds = new Set([
  ...Array.from({ length: 7 }, (_, i) => `LJM-20261018-PHO-${String(i + 1).padStart(3, '0')}`),
  'LJM-20261018-ALB-001',
]);

export const filterApprovedMetadataIssues = (record, issues) => {
  const core = record?.core;
  const originalApproval = approvedIds.has(core?.item_id) && core?.album_id === 'LJM-A20260909-01' &&
    core?.batch_id === 'LJM-20260909-B01' && core?.accession_date === '2026-09-09' &&
    record?.public_view?.description?.includes(albumMissingMetadataNotice);
  const dalianApproval = dalianIds.has(core?.item_id) && core?.album_id === 'LJM-20261018-ALB-001' &&
    core?.batch_id === 'FSA-20261018-B01' && core?.accession_date === '2026-10-18' &&
    record?.public_view?.description?.includes(dalianMissingMetadataNotice);
  if ((!originalApproval && !dalianApproval) || record?.metadata?.schema !== 'photo' ||
    !['PHO', 'ALB'].includes(core?.object_type)) return issues;
  const dimensions = record.metadata.dimensions ?? {};
  const empty = (field, dimension) => !meaningful(core[field]) && !meaningful(dimensions[dimension]?.[field]);
  const allowed = new Set();
  if (empty('verso_types', 'D12')) {
    allowed.add('collection_code_required_D12_verso_types');
    if (empty('verso_transcription', 'D12')) allowed.add('collection_required_D12');
  }
  if (originalApproval || core.object_type === 'ALB') {
    if (empty('condition_grade', 'D16')) allowed.add('collection_code_required_D16_condition_grade');
    if (empty('condition_details', 'D16')) allowed.add('collection_code_required_D16_condition_details');
    if (empty('condition_grade', 'D16') && empty('condition_details', 'D16') && empty('treatment_notes', 'D16')) allowed.add('collection_required_D16');
  }
  // 仅认可缺失项；非法代码、隐私、图像、身份与其他维度的错误不在授权范围内。
  return issues.filter(issue => !allowed.has(issue.code));
};

