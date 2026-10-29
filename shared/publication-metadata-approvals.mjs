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

// 2026-10-24 所有人明确答复“允许。发布。”：仅此册允许按真实缺项公开照片背面信息。
export const graduationAlbumMissingBackNotice = '资料说明：未提供贴入照片的背面，背面文字待核';

// 2026-10-29 所有人本人核对13项后批准B03，另明确接受本批真实缺项。
// 仅本批20个照片永久号：保存评级/损伤类型待核；其中19件地点未知、18件背面未提供。
export const october29PhotoMissingMetadataNotice = '资料说明：未提供实物检查结果，实物保存状态及评级待核。';
const october29PhotoIds = new Set(Array.from({length:20},(_,i)=>`LJM-20260910-PHO-${String(i+1).padStart(3,'0')}`));
const october29BackIds = new Set([...october29PhotoIds].filter(id=>!['LJM-20260910-PHO-001','LJM-20260910-PHO-003'].includes(id)));
const october29UnknownPlaceIds = new Set([...october29PhotoIds].filter(id=>id!=='LJM-20260910-PHO-001'));

// 2026-10-30 所有人本人核对13项，批准B04的14件照片按真实缺项公开。
// 编号已由本地服务端实际分配；仅承认这些记录尚未提供的地点、背面及实物检查资料。
export const october30PhotoMissingMetadataNotice = '资料说明：未提供可确认属于本件的照片背面，背面文字待核；未提供实物检查结果，实物保存状态及评级待核。';
const october30PhotoIds = new Set(Array.from({length:14},(_,i)=>`LJM-20260910-PHO-${String(i+21).padStart(3,'0')}`));

export const filterApprovedMetadataIssues = (record, issues) => {
  const core = record?.core;
  const october30Approval = october30PhotoIds.has(core?.item_id) && core?.object_type === 'PHO' &&
    core?.batch_id === 'LJM-20260910-B04' && core?.accession_date === '2026-09-10' &&
    record?.metadata?.schema === 'photo' && record?.public_view?.description?.includes(october30PhotoMissingMetadataNotice);
  if (october30Approval) {
    const dims = record.metadata.dimensions ?? {};
    const empty = (field,dim) => !meaningful(core[field]) && !meaningful(dims[dim]?.[field]);
    const allowed = new Set();
    if (empty('condition_grade','D16')) allowed.add('collection_code_required_D16_condition_grade');
    if (empty('condition_details','D16')) allowed.add('collection_code_required_D16_condition_details');
    if (empty('condition_grade','D16') && empty('condition_details','D16') && empty('treatment_notes','D16')) allowed.add('collection_required_D16');
    if (core.place_notes?.includes('未知') &&
      ['country','province','city','district','street_town','specific_place'].every(field=>empty(field,'D02'))) allowed.add('collection_required_D02');
    if (empty('verso_types','D12')) {
      allowed.add('collection_code_required_D12_verso_types');
      if (empty('verso_transcription','D12')) allowed.add('collection_required_D12');
    }
    return issues.filter(issue=>!allowed.has(issue.code));
  }
  const october29Approval = october29PhotoIds.has(core?.item_id) && core?.object_type === 'PHO' &&
    core?.batch_id === 'LJM-20260910-B03' && core?.accession_date === '2026-09-10' &&
    record?.metadata?.schema === 'photo' && record?.public_view?.description?.includes(october29PhotoMissingMetadataNotice);
  if (october29Approval) {
    const dims = record.metadata.dimensions ?? {};
    const empty = (field,dim) => !meaningful(core[field]) && !meaningful(dims[dim]?.[field]);
    const allowed = new Set();
    if (empty('condition_grade','D16')) allowed.add('collection_code_required_D16_condition_grade');
    if (empty('condition_details','D16')) allowed.add('collection_code_required_D16_condition_details');
    if (empty('condition_grade','D16') && empty('condition_details','D16') && empty('treatment_notes','D16')) allowed.add('collection_required_D16');
    if (october29UnknownPlaceIds.has(core.item_id) && core.place_notes?.includes('未知') &&
      ['country','province','city','district','street_town','specific_place'].every(field=>empty(field,'D02'))) allowed.add('collection_required_D02');
    if (october29BackIds.has(core.item_id) && record.public_view.description.includes('未提供可确认属于本件的照片背面，背面文字待核。') && empty('verso_types','D12')) {
      allowed.add('collection_code_required_D12_verso_types');
      if (empty('verso_transcription','D12')) allowed.add('collection_required_D12');
    }
    return issues.filter(issue=>!allowed.has(issue.code));
  }
  const originalApproval = approvedIds.has(core?.item_id) && core?.album_id === 'LJM-A20260909-01' &&
    core?.batch_id === 'LJM-20260909-B01' && core?.accession_date === '2026-09-09' &&
    record?.public_view?.description?.includes(albumMissingMetadataNotice);
  const dalianApproval = dalianIds.has(core?.item_id) && core?.album_id === 'LJM-20261018-ALB-001' &&
    core?.batch_id === 'FSA-20261018-B01' && core?.accession_date === '2026-10-18' &&
    record?.public_view?.description?.includes(dalianMissingMetadataNotice);
  const graduationApproval = core?.item_id === 'LJM-20260910-ALB-001' && core?.object_type === 'ALB' &&
    core?.album_id === 'LJM-A20260910-DOHTO-01' && core?.batch_id === 'LJM-20260910-B02' &&
    core?.accession_date === '2026-09-10' && record?.public_view?.description?.includes(graduationAlbumMissingBackNotice);
  if ((!originalApproval && !dalianApproval && !graduationApproval) || record?.metadata?.schema !== 'photo' ||
    !['PHO', 'ALB'].includes(core?.object_type)) return issues;
  const dimensions = record.metadata.dimensions ?? {};
  const empty = (field, dimension) => !meaningful(core[field]) && !meaningful(dimensions[dimension]?.[field]);
  const allowed = new Set();
  if (empty('verso_types', 'D12')) {
    allowed.add('collection_code_required_D12_verso_types');
    if (empty('verso_transcription', 'D12')) allowed.add('collection_required_D12');
  }
  if (originalApproval || dalianApproval && core.object_type === 'ALB') {
    if (empty('condition_grade', 'D16')) allowed.add('collection_code_required_D16_condition_grade');
    if (empty('condition_details', 'D16')) allowed.add('collection_code_required_D16_condition_details');
    if (empty('condition_grade', 'D16') && empty('condition_details', 'D16') && empty('treatment_notes', 'D16')) allowed.add('collection_required_D16');
  }
  // 仅认可缺失项；非法代码、隐私、图像、身份与其他维度的错误不在授权范围内。
  return issues.filter(issue => !allowed.has(issue.code));
};

