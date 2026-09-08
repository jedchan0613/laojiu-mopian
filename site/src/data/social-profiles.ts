export type SocialPlatform = 'douyin' | 'xiaohongshu' | 'wechat';

export interface SocialProfile {
	platform: SocialPlatform;
	label: string;
	account: string;
	url: string;
	qrImage?: string;
	qrImageWidth?: number;
	qrImageHeight?: number;
}

/**
 * 公开网站的社交账号入口。
 *
 * - 抖音、小红书：填写 account；如有可核对的主页地址，再填写 url；也可以只展示二维码。
 * - 微信：填写 account；如需展示二维码，只能使用 /social/ 下已经确认可公开的发布副本。
 * - 留空时只在本地开发预览中显示“待补充”，正式构建不会输出无效入口。
 */
export const socialProfiles: SocialProfile[] = [
	{
		platform: 'douyin',
		label: '抖音',
		account: '985855105',
		url: '',
		qrImage: '/social/douyin-qr-public.jpg',
		qrImageWidth: 984,
		qrImageHeight: 1470,
	},
	{
		platform: 'xiaohongshu',
		label: '小红书',
		account: '272683137',
		url: '',
		qrImage: '/social/xiaohongshu-qr-public.jpg',
		qrImageWidth: 987,
		qrImageHeight: 1347,
	},
	{
		platform: 'wechat',
		label: '微信',
		account: 'jedtchen',
		url: '',
		qrImage: '/social/wechat-qr-public.jpg',
		qrImageWidth: 856,
		qrImageHeight: 1211,
	},
];
