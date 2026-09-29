// 真实发信自检工具：只用于确认邮件通道可用与送达情况，不参与网站运行、不写入任何业务数据。
//
// 用法：node local-admin/mail-test.mjs 收件邮箱
// 密钥读取顺序：环境变量 → local-admin/accounts/mail.env（该目录已在 .gitignore 中忽略）
//
// mail.env 内容示例（只放在本机，不要提交到仓库）：
//   LJM_MAIL_API_KEY=re_你的密钥
//   LJM_MAIL_FROM=老旧默片 <no-reply@laojiumopian.com>
//   LJM_MAIL_PROXY=http://127.0.0.1:15236   （仅当本机需要代理才能访问境外接口时才填；服务器上不需要）
//
// 说明：Node 自带的请求不会自动使用系统代理。配置了 LJM_MAIL_PROXY 时，本工具改用 curl
// 通过该代理发送（curl 会走代理隧道）；没有配置时直接使用 Node 内置请求。

import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createMailer, mailTemplates } from './mail.mjs';

const adminDirectory = path.dirname(fileURLToPath(import.meta.url));
const environmentFile = path.join(adminDirectory, 'accounts', 'mail.env');

const readEnvironmentFile = () => {
	const values = {};
	try {
		for (const line of fs.readFileSync(environmentFile, 'utf8').split(/\r?\n/)) {
			const trimmed = line.trim();
			if (!trimmed || trimmed.startsWith('#')) continue;
			const separator = trimmed.indexOf('=');
			if (separator < 1) continue;
			values[trimmed.slice(0, separator).trim()] = trimmed.slice(separator + 1).trim();
		}
	} catch {
		// 没有配置文件时只使用环境变量。
	}
	return values;
};

const fileValues = readEnvironmentFile();
const setting = (name, fallback = '') => process.env[name]?.trim() || fileValues[name] || fallback;

const recipient = process.argv[2]?.trim() ?? '';
if (!recipient) {
	console.error('用法：node local-admin/mail-test.mjs 收件邮箱');
	process.exit(1);
}
if (!/^[^\s@]+@[^\s@]+\.[a-z0-9-]+$/i.test(recipient)) {
	console.error(`收件邮箱格式不正确：${recipient}`);
	process.exit(1);
}

const from = setting('LJM_MAIL_FROM', '老旧默片 <no-reply@laojiumopian.com>');
const endpoint = setting('LJM_MAIL_API_ENDPOINT', 'https://api.resend.com/emails');
const apiKey = setting('LJM_MAIL_API_KEY');
const proxy = setting('LJM_MAIL_PROXY');

if (!apiKey || apiKey.includes('把这里换成')) {
	console.error('还没有填入正式的 API 密钥。请编辑这个文件：');
	console.error(`  ${environmentFile}`);
	console.error('把 LJM_MAIL_API_KEY= 后面换成 Resend 里复制的密钥（re_ 开头）。');
	process.exit(1);
}

const { subject, text } = mailTemplates['login-code']({ code: '123456', minutes: 10, purpose: 'login' });

// 通过代理发送：请求体走标准输入，不落在命令行上。
const sendThroughProxy = () => new Promise((resolve, reject) => {
	const child = execFile('curl', [
		'-sS',
		'--proxy', proxy,
		'--ssl-no-revoke',
		'--max-time', '45',
		'-X', 'POST', endpoint,
		'-H', 'Content-Type: application/json',
		'-H', `Authorization: Bearer ${apiKey}`,
		'--data-binary', '@-',
	], { maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
		if (error) {
			reject(new Error(`${error.message}${stderr ? `（${stderr.trim()}）` : ''}`));
			return;
		}
		resolve(stdout.trim());
	});
	child.stdin.end(JSON.stringify({ from, to: [recipient], subject, text }));
});

const mailer = createMailer({
	transport: 'https',
	environment: 'development',
	endpoint,
	apiKey,
	from,
});

console.log(`发信接口：${endpoint}`);
console.log(`发件人：${from}`);
console.log(`收件人：${recipient}`);
console.log(`连接方式：${proxy ? `经本机代理 ${proxy}` : '直连'}`);
console.log('正在发送…');

try {
	if (proxy) {
		const response = await sendThroughProxy();
		console.log(`服务商返回：${response || '（没有返回内容）'}`);
	} else {
		const result = await mailer.send({ to: recipient, template: 'login-code', variables: { code: '123456', minutes: 10, purpose: 'login' } });
		console.log(`服务商返回编号：${result.id}`);
	}
	console.log('发送请求已完成。请检查收件箱，也看一下垃圾邮件／推广邮件文件夹。');
	console.log('提醒：这封测试邮件里的 123456 是假的，不能用于登录。');
} catch (error) {
	console.error(`发送失败：${error instanceof Error ? error.message : String(error)}`);
	console.error('常见原因：网络到不了服务商、域名尚未验证通过、密钥权限不对（应选 Sending access）、发件地址与已验证域名不一致。');
	process.exit(1);
}
