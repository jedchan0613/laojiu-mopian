// 管理进程与独立账户进程共用的私密进度提醒队列。这里不保存收件邮箱，发送前再查用户偏好。
import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const queueDirectory = root => path.join(path.resolve(root), '.notification-queue');
const writeAtomic = async (file, value) => {
	const temporary = `${file}.${randomUUID()}.tmp`;
	await fs.writeFile(temporary, JSON.stringify(value), { mode: 0o600, flag: 'wx' });
	await fs.rename(temporary, file);
};

export async function enqueueProgressNotification(root, notification) {
	if (!/^usr_[a-f0-9]{24}$/.test(String(notification?.accountId ?? '')) || !['needs_info', 'approved', 'declined', 'published', 'change_done', 'change_rejected'].includes(notification?.event)) {
		throw new Error('进度提醒内容无效。');
	}
	const directory = queueDirectory(root);
	await fs.mkdir(directory, { recursive: true, mode: 0o700 });
	const file = path.join(directory, `${randomUUID()}.json`);
	await writeAtomic(file, { accountId: notification.accountId, event: notification.event, title: String(notification.title ?? '').slice(0, 80), status: 'pending', attempts: 0, next_attempt_at: '' });
}

export async function processProgressNotifications(root, { recipientFor, send, record }) {
	const directory = queueDirectory(root);
	let files;
	try { files = (await fs.readdir(directory)).filter(name => /^[a-f0-9-]{36}\.json$/.test(name)); }
	catch (error) { if (error.code === 'ENOENT') return; throw error; }
	for (const name of files) {
		const file = path.join(directory, name);
		const item = JSON.parse(await fs.readFile(file, 'utf8'));
		if (item.status !== 'pending' || (item.next_attempt_at && Date.parse(item.next_attempt_at) > Date.now())) continue;
		const recipient = recipientFor(item.accountId);
		if (!recipient) { await writeAtomic(file, { ...item, status: 'skipped' }); continue; }
		try {
			await send({ to: recipient.email, template: 'submission-progress', variables: { event: item.event, title: item.title } });
			await writeAtomic(file, { ...item, status: 'sent', sent_at: new Date().toISOString() });
			try { record({ accountId: item.accountId, template: 'submission-progress', status: 'sent' }); } catch { /* 审计写入故障不重发已投递的邮件。 */ }
		} catch (error) {
			const attempts = (item.attempts ?? 0) + 1;
			try { record({ accountId: item.accountId, template: 'submission-progress', status: 'failed', error: error instanceof Error ? error.message : String(error) }); } catch { /* 保留队列项供下次重试。 */ }
			await writeAtomic(file, { ...item, attempts, next_attempt_at: new Date(Date.now() + Math.min(3600, 60 * 2 ** Math.min(attempts, 6)) * 1000).toISOString() });
		}
	}
}
