import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { enqueueProgressNotification, processProgressNotifications } from '../notification-queue.mjs';

test('独立账户服务从私密队列投递审核提醒，遵守通知偏好且发送失败可重试', async t => {
	const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ljm-notify-test-'));
	t.after(async () => {
		assert.equal(path.dirname(path.resolve(root)), path.resolve(os.tmpdir()));
		await fs.rm(root, { recursive: true, force: true });
	});
	const accountId = 'usr_0123456789abcdef01234567';
	await enqueueProgressNotification(root, { accountId, event: 'needs_info', title: '测试稿件' });
	const delivered = [], recorded = [];
	const options = {
		recipientFor: id => id === accountId ? { email: 'test@example.invalid' } : null,
		send: async message => { delivered.push(message); },
		record: event => { recorded.push(event); },
	};
	await processProgressNotifications(root, options);
	await processProgressNotifications(root, options);
	assert.equal(delivered.length, 1);
	assert.equal(delivered[0].to, 'test@example.invalid');
	assert.equal(recorded[0].status, 'sent');
	await enqueueProgressNotification(root, { accountId, event: 'approved', title: '另一稿件' });
	await processProgressNotifications(root, { ...options, recipientFor: () => null });
	assert.equal(delivered.length, 1);
	await enqueueProgressNotification(root, { accountId, event: 'change_done', title: '第三稿件' });
	await processProgressNotifications(root, { ...options, send: async () => { throw new Error('邮件暂时失败'); } });
	assert.equal(recorded.at(-1).status, 'failed');
	const states = await Promise.all((await fs.readdir(path.join(root, '.notification-queue'))).filter(name => name.endsWith('.json')).map(name => fs.readFile(path.join(root, '.notification-queue', name), 'utf8').then(JSON.parse)));
	assert.ok(states.some(item => item.event === 'change_done' && item.status === 'pending' && item.attempts === 1));
});
