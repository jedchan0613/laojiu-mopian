import { getCodeEntry, isTranslatedArchiveLocale, translateLabel } from './code-dictionary';

export interface PublicUsagePolicy {
	statusLabel: string;
	canDownloadPublicationCopy: boolean;
	title: string;
	description: string;
	attribution: string;
}

const policies: Record<string, Omit<PublicUsagePolicy, 'statusLabel'>> = {
	PD: {
		canDownloadPublicationCopy: true,
		title: '可下载网页发布副本',
		description: '这件档案已核验为公版或无著作权限制，可下载网站使用的压缩发布副本。',
		attribution: '转载或研究引用时，建议保留题名、永久编号与“老旧默片”来源。',
	},
	LIC: {
		canDownloadPublicationCopy: false,
		title: '已获展示许可，暂不开放下载',
		description: '现有许可足以支持网页展示，但下载与再利用范围没有单独确认。',
		attribution: '如需使用，请先核对具体许可范围，并在引用中保留题名、永久编号与来源。',
	},
	OWN: {
		canDownloadPublicationCopy: false,
		title: '持有实物，暂不开放下载',
		description: '持有实物不等同于拥有著作权，因此网站不主动提供图片下载。',
		attribution: '页面可用于浏览和规范引用，不代表授权复制或再发布。',
	},
	RES: {
		canDownloadPublicationCopy: false,
		title: '权利受限，不提供下载',
		description: '这件档案存在明确的合同、隐私或著作权限制。',
		attribution: '页面内容仅供当前公开展示范围内浏览。',
	},
	UNK: {
		canDownloadPublicationCopy: false,
		title: '权利尚未核验，不提供下载',
		description: '在权利情况明确前，网站只提供在线浏览和规范引用。',
		attribution: '公开展示不等于授权复制、下载或再发布。',
	},
};


const englishPolicies: Record<string, Omit<PublicUsagePolicy, 'statusLabel'>> = {
  PD: { canDownloadPublicationCopy: true, title: 'Download the website publication copy', description: 'This item has been verified as public domain or free of copyright restrictions. You may download the compressed copy used on this website.', attribution: 'When republishing or citing it for research, please retain the title, permanent identifier and Laojiu Mopian source credit.' },
  LIC: { canDownloadPublicationCopy: false, title: 'Display permission obtained; downloads unavailable', description: 'The current permission covers website display. The scope for downloading and reuse has not been separately confirmed.', attribution: 'Before using the material, check the specific permission and retain its title, permanent identifier and source in your citation.' },
  OWN: { canDownloadPublicationCopy: false, title: 'Physical object held; downloads unavailable', description: 'Possession of the physical object does not establish copyright ownership, so the website does not offer image downloads.', attribution: 'The page may be viewed and cited. This does not grant permission to copy or republish its contents.' },
  RES: { canDownloadPublicationCopy: false, title: 'Rights restricted; downloads unavailable', description: 'This item is subject to specific contractual, privacy or copyright restrictions.', attribution: 'The content may only be viewed within the scope of its current public display.' },
  UNK: { canDownloadPublicationCopy: false, title: 'Rights unverified; downloads unavailable', description: 'Until the rights are clarified, the website offers online viewing and citation only.', attribution: 'Public display does not grant permission to copy, download or republish.' },
};
export const getPublicUsagePolicy = (rightsStatus: string | undefined, locale: string = 'zh-CN'): PublicUsagePolicy => {
  const normalizedStatus = rightsStatus?.trim() || 'UNK';
  const selected = isTranslatedArchiveLocale(locale) ? englishPolicies : policies;
  const originalPolicy = selected[normalizedStatus] ?? selected.UNK;
  const policy = {...originalPolicy, ...Object.fromEntries(Object.entries(originalPolicy).filter(([,value]) => typeof value === 'string').map(([key,value]) => [key, translateLabel(value as string, locale)]))};
  return { statusLabel: getCodeEntry(normalizedStatus, locale)?.label ?? (isTranslatedArchiveLocale(locale) ? translateLabel('Rights unknown', locale) : '权利不明'), ...policy };
};
