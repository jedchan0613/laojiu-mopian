import { manualLanguages, manualCompleteness, projectManualArchivePages, safeManualSourceUrl } from '../shared/manual-catalog.mjs';

// 只供已保存的私密草稿预览。草稿允许缺项，原文链接与页图仍需逐项验证。
export function medicineDraftPreview(catalog, archives) {
  const [version] = catalog.documents;
  const issues = [];
  const issue = message => issues.push({where: version.manual_key, message});
  const medicines = version.medicine_keys.map(key => catalog.medicines.find(item => item.medicine_key === key));
  if (medicines.some(item => !item)) issue('关联的药品已变化，请重新核对。');
  let pages = [];
  if (version.linked_archive_id) {
    try {
      if (!version.display_basis?.trim()) throw new Error();
      const archive = archives.find(item => item.core?.item_id === version.linked_archive_id);
      pages = projectManualArchivePages(archive, version.page_map);
    } catch {
      issue('请核对已审核档案、阅读展示依据和所选页图。');
    }
  } else if (version.page_map.length) {
    issue('请先关联这些页图所属的已审核档案。');
  }
  if (version.contents.some(entry => !entry.label || !Number.isInteger(entry.page) || entry.page < 1 || entry.page > pages.length)) {
    issue('请核对目录中的标题和跳转页序。');
  }
  const official_sources = version.official_sources.map(source => {
    const href = safeManualSourceUrl(source.url);
    return {name: source.name || '官方来源', href, checked_on: source.checked_on, available: Boolean(href && source.available)};
  });
  const names = medicines.filter(Boolean).map(item => ({
    name: item.generic_name || item.original_title,
    detail: [item.dosage_form, item.strength, ...item.companies.map(company => company.name)].filter(Boolean).join(' · ')
  }));
  const document = issues.length ? null : {
    title: names[0]?.name || '药品说明书',
    edition_display: version.edition_display || '版本未注明',
    region_display: version.region_display || '地区未注明', languages: version.languages,
    completeness: version.completeness, missing_note: version.missing_note,
    approval_date_text: version.approval_date_text, revision_date_text: version.revision_date_text,
    collected_on: version.collected_on,
    pages, contents: version.contents, official_sources, archive_id: version.linked_archive_id
  };
  return {issues, document, medicines: names, models: [], brands: [], labels: {languages: manualLanguages, completeness: manualCompleteness}};
}
