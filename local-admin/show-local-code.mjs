// 显示本机最新的登录验证码。
//
// 本地预览时邮件不会真的发出去，而是写进 local-admin/accounts/mail-outbox/。
// 这个脚本把最新一封里的验证码读出来，省得去翻文件。

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const adminDirectory = path.dirname(fileURLToPath(import.meta.url));
const outbox = path.join(adminDirectory, 'accounts', 'mail-outbox');

console.log('');
console.log('  本地预览：登录验证码');
console.log('  ────────────────────────────');

let files = [];
try {
	files = fs.readdirSync(outbox).filter((name) => name.endsWith('.json')).sort();
} catch {
	files = [];
}

if (!files.length) {
	console.log('  还没有收到任何验证码。');
	console.log('');
	console.log('  请先在浏览器里打开 http://127.0.0.1:4173/login/');
	console.log('  填写邮箱并点「获取验证码」，然后再运行本脚本。');
	console.log('');
	process.exit(0);
}

const latest = files[files.length - 1];
const message = JSON.parse(fs.readFileSync(path.join(outbox, latest), 'utf8'));
const code = (String(message.text ?? '').match(/[0-9]{6}/) ?? [])[0] ?? '（没找到 6 位数字）';

console.log(`  收件邮箱：${message.to ?? '未知'}`);
console.log(`  验证码：  ${code}`);
console.log(`  发送时间：${message.created_at ? new Date(message.created_at).toLocaleString('zh-CN') : '未知'}`);
console.log('  ────────────────────────────');
console.log(`  本机共 ${files.length} 封；上面是最近的一封。`);
console.log('');
console.log('  提示：验证码 10 分钟内有效，只能使用一次。');
console.log('');
