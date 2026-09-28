// 邮件发送层：零依赖。
//
// 三种通道：
// - https：生产通道。使用服务商的 HTTPS 接口 + Node 内置 fetch，只需 API 地址、密钥、发件人。
// - file ：开发与测试通道。把邮件写入本机私密目录的投递文件，便于本地端到端验证。
//          生产环境（LJM_ACCOUNT_ENV=production）必须拒绝该通道，防止测试验证码进入线上。
// - none ：未配置。available=false，调用方必须显示"登录服务暂时不可用"，不能假装成功。
//
// 邮件正文只包含必要的验证码或通知文字，不附私密图片、投稿内容或用户联系方式（与方案 G 一致）。

import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

export class MailError extends Error {
	constructor(message, statusCode = 502) {
		super(message);
		this.name = 'MailError';
		this.statusCode = statusCode;
	}
}

const purposeLabels = {
	login: '登录或开通账号',
	email_change_old: '验证当前邮箱',
	email_change_new: '验证新邮箱',
};

const progressLabels = {
	needs_info: '需要你补充资料',
	approved: '初审通过，已进入整理',
	declined: '这次暂不采用',
	published: '已经公开发布',
};

export const mailTemplates = {
	'login-code': ({ code, minutes, purpose }) => ({
		subject: `老旧默片：${purposeLabels[purpose] ?? '登录'}验证码`,
		text: [
			`你的验证码是：${code}`,
			'',
			`验证码 ${minutes} 分钟内有效，只能使用一次；连续多次输入错误需要重新获取。`,
			'如果不是你本人操作，忽略这封邮件即可，你的账号不会有任何变化。',
			'',
			'老旧默片 · 普通人的生活档案',
		].join('\n'),
	}),
	'email-changed-notice': ({ newEmail }) => ({
		subject: '老旧默片：账号邮箱已变更',
		text: [
			'你的账号绑定邮箱刚刚完成变更。',
			'',
			`新邮箱：${newEmail}`,
			'',
			'为了安全，本次变更已经退出所有已登录设备，请使用新邮箱重新登录。',
			'如果不是你本人操作，请立刻通过网站的联系入口告知站主。',
			'',
			'老旧默片 · 普通人的生活档案',
		].join('\n'),
	}),
	'submission-progress': ({ event, title }) => ({
		subject: `老旧默片：投稿有新进展——${progressLabels[event] ?? '处理结果已更新'}`,
		text: [
			`你提交的资料「${title || '未命名'}」有新的处理结果：${progressLabels[event] ?? '处理结果已更新'}。`,
			'',
			'请登录网站的用户中心查看完整说明与下一步操作。',
			'',
			'这封邮件只用于提醒，不包含投稿正文、图片或联系方式。你可以在账户设置里关闭这类提醒。',
			'',
			'老旧默片 · 普通人的生活档案',
		].join('\n'),
	}),
};

/**
 * @param {object} options
 * @param {'https'|'file'|'none'} options.transport
 * @param {'development'|'production'} options.environment
 * @param {string} [options.directory] file 通道的私密投递目录
 * @param {string} [options.endpoint] https 通道的接口地址
 * @param {string} [options.apiKey] https 通道的密钥（只从服务器私密环境文件读取）
 * @param {string} [options.from] 发件人
 * @param {Function} [options.fetchImpl] 便于测试注入
 * @param {number} [options.timeoutMs]
 */
export function createMailer({
	transport = 'none',
	environment = 'development',
	directory = '',
	endpoint = '',
	apiKey = '',
	from = '',
	fetchImpl = globalThis.fetch,
	timeoutMs = 10_000,
} = {}) {
	if (!['https', 'file', 'none'].includes(transport)) throw new MailError('邮件通道只能是 https、file 或 none。');
	if (!['development', 'production'].includes(environment)) throw new MailError('运行环境只能是 development 或 production。');
	// 生产环境必须拒绝测试投递通道，避免测试验证码或绕过方式进入线上。
	if (environment === 'production' && transport === 'file') {
		throw new MailError('生产环境不允许使用本机测试投递通道。');
	}
	const configured = transport === 'file'
		? Boolean(directory)
		: transport === 'https'
			? Boolean(endpoint && apiKey && from && typeof fetchImpl === 'function')
			: false;

	const describe = () => ({
		available: configured,
		transport: configured ? transport : 'none',
		from: configured && transport === 'https' ? from : '',
		environment,
	});

	const render = (template, variables) => {
		const builder = mailTemplates[template];
		if (!builder) throw new MailError(`未知的邮件模板：${template}。`);
		return builder(variables ?? {});
	};

	return {
		environment,
		get available() {
			return configured;
		},
		describe,

		async send({ to, template, variables }) {
			if (!configured) throw new MailError('邮件通道尚未配置完成。', 503);
			const recipient = String(to ?? '').trim();
			if (!/^[^\s@]+@[^\s@]+\.[a-z0-9-]+$/i.test(recipient)) throw new MailError('收件邮箱格式不正确。');
			const { subject, text } = render(template, variables);
			const messageId = randomUUID();

			if (transport === 'file') {
				await fs.mkdir(directory, { recursive: true, mode: 0o700 });
				const file = path.join(directory, `${Date.now()}-${messageId}.json`);
				await fs.writeFile(file, `${JSON.stringify({
					id: messageId,
					to: recipient,
					template,
					subject,
					text,
					// 本地测试通道额外记录用途，便于端到端检查区分同一邮箱的多次投递；生产通道不落盘。
					variables,
					created_at: new Date().toISOString(),
				}, null, 2)}\n`, { mode: 0o600, flag: 'wx' });
				return { id: messageId, transport: 'file' };
			}

			let response;
			try {
				response = await fetchImpl(endpoint, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${apiKey}`,
					},
					body: JSON.stringify({ from, to: [recipient], subject, text }),
					signal: AbortSignal.timeout(timeoutMs),
				});
			} catch (error) {
				// 只报告失败类别，不泄漏密钥或接口细节。
				throw new MailError(`邮件服务暂时无法连接：${String(error?.name ?? 'network_error')}。`);
			}
			if (!response.ok) {
				const detail = await response.text().catch(() => '');
				throw new MailError(`邮件服务返回错误（${response.status}）${detail ? `：${detail.slice(0, 200)}` : '。'}`);
			}
			const payload = await response.json().catch(() => ({}));
			return { id: String(payload?.id ?? messageId), transport: 'https' };
		},
	};
}
