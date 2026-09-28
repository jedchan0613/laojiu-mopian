// 阶段三账户投稿隔离测试：草稿、版本、补充、撤回、旧投稿关联与通知。
//
// 全部使用虚构账号、虚构资料与临时目录；不读写真实档案、公开网站构建产物或真实用户资料。

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createSubmissionStore, privacyChecks, consentVersion } from '../submissions.mjs';
import { createAccountStore, agreementVersion } from '../accounts.mjs';
import { createMailer } from '../mail.mjs';

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const siteDirectory = path.join(project, 'site');
const sharp = createRequire(path.join(siteDirectory, 'package.json'))('sharp');
const image = await sharp({ create: { width: 64, height: 48, channels: 3, background: '#a98a68' } }).jpeg().toBuffer();

const ACCOUNT_A = 'usr_0123456789abcdef01234567';
const ACCOUNT_B = 'usr_abcdef0123456789abcdef01';

const completeFields = () => ({
	title: '测试用的虚构旧物',
	description: '这是一份自动检查使用的虚构资料，用来验证草稿、提交与版本流程，不包含真实人物。',
	category: '照片',
	era: '约 1980 年代',
	place: '佛山',
	source_note: '虚构来源：家族旧物箱，已获家人同意展示。',
	people: 'none',
	attribution: 'anonymous',
	credit: '',
});
const blankFields = () => ({ title: '', description: '', category: '', source_note: '', people: 'none', attribution: 'anonymous', credit: '' });
const consents = () => ({ copies: true, rights: true, privacy: true, processing: true });

async function fixture(t, options = {}) {
	const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ljm-account-submissions-'));
	const notifications = [];
	const store = createSubmissionStore({
		root,
		siteDirectory,
		notifier: async (notification) => { notifications.push(notification); },
		...options,
	});
	t.after(async () => {
		const resolved = path.resolve(root);
		assert.equal(path.dirname(resolved), path.resolve(os.tmpdir()));
		assert.ok(path.basename(resolved).startsWith('ljm-account-submissions-'));
		await fs.rm(resolved, { recursive: true, force: true });
	});
	const create = (accountId, mode, overrides = {}) => store.createAccountSubmission({
		accountId,
		mode,
		payload: {
			fields: completeFields(),
			images: [{ name: 'screening-copy.jpg', buffer: image }],
			consents: consents(),
			consent_version: consentVersion,
			...overrides,
		},
	});
	return { root, store, notifications, create };
}

test('草稿：允许不完整内容，跨设备可读，保存后图片与说明都能保留，移除的图片进入私密回收区', async t => {
	const { root, store, create } = await fixture(t);
	const draft = await create(ACCOUNT_A, 'draft', { fields: blankFields() });
	assert.equal(draft.status, 'draft');
	// 重新打开（等价于换一台设备）仍能读到。
	const opened = await store.getAccountSubmission({ id: draft.id, accountId: ACCOUNT_A });
	assert.equal(opened.status, 'draft');
	assert.equal(opened.images.length, 1);
	assert.equal(opened.images[0].filename, 'copy-01.jpg');
	// 补全字段、加一张图、写图片说明。
	const saved = await store.saveAccountSubmission({
		id: draft.id, accountId: ACCOUNT_A, revision: opened.revision,
		payload: {
			fields: { ...completeFields(), title: '补全后的题名' },
			keep: ['copy-01.jpg'],
			notes: { 'copy-01.jpg': '正面' },
			images: [{ name: 'second.jpg', buffer: image, note: '背面' }],
		},
	});
	assert.equal(saved.revision, opened.revision + 1);
	const reloaded = await store.getAccountSubmission({ id: draft.id, accountId: ACCOUNT_A });
	assert.equal(reloaded.fields.title, '补全后的题名');
	assert.equal(reloaded.images.length, 2);
	assert.equal(reloaded.images[0].note, '正面');
	assert.equal(reloaded.images[1].note, '背面');
	// 移除第一张：文件被移入私密回收区，而不是永久删除。
	const trimmed = await store.saveAccountSubmission({
		id: draft.id, accountId: ACCOUNT_A, revision: reloaded.revision,
		payload: { fields: reloaded.fields, keep: ['copy-02.jpg'], notes: { 'copy-02.jpg': '背面' }, images: [] },
	});
	assert.equal(trimmed.image_count, 1);
	const recycleRoot = path.join(root, '.recycle', draft.id);
	const entries = await fs.readdir(recycleRoot);
	assert.equal(entries.length, 1);
	assert.equal((await fs.readdir(path.join(recycleRoot, entries[0]))).includes('copy-01.jpg'), true);
});

test('提交：字段必须完整、必须逐项确认，提交后生成只读版本并且不能再按草稿编辑', async t => {
	const { store, create } = await fixture(t);
	const draft = await create(ACCOUNT_A, 'draft', { fields: blankFields() });
	// 字段不完整时不能提交。
	await assert.rejects(store.submitAccountSubmission({ id: draft.id, accountId: ACCOUNT_A, revision: 1, payload: { consents: consents(), consent_version: consentVersion } }));
	const opened = await store.getAccountSubmission({ id: draft.id, accountId: ACCOUNT_A });
	await store.saveAccountSubmission({
		id: draft.id, accountId: ACCOUNT_A, revision: opened.revision,
		payload: { fields: completeFields(), keep: ['copy-01.jpg'], notes: {}, images: [] },
	});
	// 未逐项确认也不能提交。
	await assert.rejects(store.submitAccountSubmission({ id: draft.id, accountId: ACCOUNT_A, revision: 2, payload: { consents: { copies: true }, consent_version: consentVersion } }));
	await assert.rejects(store.submitAccountSubmission({ id: draft.id, accountId: ACCOUNT_A, revision: 2, payload: { consents: consents(), consent_version: 'old-version' } }));
	const submitted = await store.submitAccountSubmission({ id: draft.id, accountId: ACCOUNT_A, revision: 2, payload: { consents: consents(), consent_version: consentVersion } });
	assert.equal(submitted.status, 'pending');
	assert.equal(submitted.version_count, 1);
	// 提交后不能再按草稿编辑，也不能重复提交。
	await assert.rejects(store.saveAccountSubmission({ id: draft.id, accountId: ACCOUNT_A, revision: submitted.revision, payload: { fields: completeFields(), keep: ['copy-01.jpg'], notes: {}, images: [] } }));
	await assert.rejects(store.submitAccountSubmission({ id: draft.id, accountId: ACCOUNT_A, revision: submitted.revision, payload: { consents: consents(), consent_version: consentVersion } }));
});

test('跨用户隔离：B 读不到、改不了、也拿不到 A 的草稿与图片', async t => {
	const { store, create } = await fixture(t);
	const draft = await create(ACCOUNT_A, 'draft');
	await assert.rejects(store.getAccountSubmission({ id: draft.id, accountId: ACCOUNT_B }), { statusCode: 404 });
	await assert.rejects(store.getAccountImage({ id: draft.id, accountId: ACCOUNT_B, filename: 'copy-01.jpg' }), { statusCode: 404 });
	await assert.rejects(store.saveAccountSubmission({ id: draft.id, accountId: ACCOUNT_B, revision: 1, payload: { fields: completeFields(), keep: [], notes: {}, images: [] } }), { statusCode: 404 });
	await assert.rejects(store.withdrawAccountSubmission({ id: draft.id, accountId: ACCOUNT_B }), { statusCode: 404 });
	await assert.rejects(store.discardAccountSubmission({ id: draft.id, accountId: ACCOUNT_B }), { statusCode: 404 });
	assert.equal((await store.listAccountSubmissions({ accountId: ACCOUNT_B })).length, 0);
	assert.equal((await store.listAccountSubmissions({ accountId: ACCOUNT_A })).length, 1);
	// 图片路径不能穿越。
	await assert.rejects(store.getAccountImage({ id: draft.id, accountId: ACCOUNT_A, filename: '../record.json' }), { statusCode: 404 });
	// 账号编号格式必须合法。
	await assert.rejects(store.listAccountSubmissions({ accountId: 'not-an-account' }), { statusCode: 403 });
});

test('并发编辑：修订号不一致时拒绝覆盖较新内容', async t => {
	const { store, create } = await fixture(t);
	const draft = await create(ACCOUNT_A, 'draft');
	const payload = { fields: completeFields(), keep: ['copy-01.jpg'], notes: {}, images: [] };
	const saved = await store.saveAccountSubmission({ id: draft.id, accountId: ACCOUNT_A, revision: 1, payload });
	assert.equal(saved.revision, 2);
	// 另一个窗口使用旧修订号保存时必须失败，而不是静默覆盖。
	await assert.rejects(store.saveAccountSubmission({ id: draft.id, accountId: ACCOUNT_A, revision: 1, payload }), { statusCode: 409 });
});

test('撤回与回收区：未进入整理的投稿撤回后回到草稿，草稿可以移入回收区', async t => {
	const { store, create } = await fixture(t);
	const created = await create(ACCOUNT_A, 'pending');
	const withdrawn = await store.withdrawAccountSubmission({ id: created.id, accountId: ACCOUNT_A });
	assert.equal(withdrawn.status, 'draft');
	assert.equal(withdrawn.status_label, '草稿');
	const discarded = await store.discardAccountSubmission({ id: created.id, accountId: ACCOUNT_A });
	assert.equal(discarded.status, 'withdrawn');
	// 已撤回的投稿不能再按草稿编辑，也不能再次丢弃。
	await assert.rejects(store.discardAccountSubmission({ id: created.id, accountId: ACCOUNT_A }));
	await assert.rejects(store.saveAccountSubmission({ id: created.id, accountId: ACCOUNT_A, revision: discarded.revision, payload: { fields: completeFields(), keep: [], notes: {}, images: [] } }));
});

test('进入整理流程后：撤回变成停止处理申请，修改与撤下申请只能提交一次且必须写明原因', async t => {
	const { store, notifications, create } = await fixture(t);
	const created = await create(ACCOUNT_A, 'pending');
	await store.review(created.id, { revision: 1, status: 'approved', rights_reviewed: true, public_message: '', private_note: '' });
	const approved = await store.detail(created.id);
	assert.equal(approved.status, 'approved');
	await store.transfer(approved.id, {
		revision: approved.revision, title: '整理后的题名', description: '已核实的说明',
		object_type: 'PHO', accession_date: '2026-09-27',
		checks: privacyChecks.map(() => true), images: ['copy-01.jpg'],
	}, async () => 'LJM-20260927-PHO-001');
	// 撤回：已经转入档案草稿，因此变成停止处理申请，而不是回到可自由编辑的草稿。
	const afterWithdraw = await store.withdrawAccountSubmission({ id: approved.id, accountId: ACCOUNT_A });
	assert.equal(afterWithdraw.withdrawal_requested, true);
	assert.equal(afterWithdraw.linked_item_id, 'LJM-20260927-PHO-001');
	// 修改与撤下申请。
	await assert.rejects(store.requestAccountChange({ id: approved.id, accountId: ACCOUNT_A, kind: 'modify', note: '' }));
	await assert.rejects(store.requestAccountChange({ id: approved.id, accountId: ACCOUNT_A, kind: 'other', note: '原因' }));
	const requested = await store.requestAccountChange({ id: approved.id, accountId: ACCOUNT_A, kind: 'modify', note: '题名需要更正一个字。' });
	assert.equal(requested.change_request.kind, 'modify');
	assert.equal(requested.change_request.status, 'received');
	await assert.rejects(store.requestAccountChange({ id: approved.id, accountId: ACCOUNT_A, kind: 'modify', note: '再来一次。' }), { statusCode: 409 });
	// 审核过程中确实产生了进度通知。
	assert.ok(notifications.some((notification) => notification.event === 'approved'));
});

test('旧投稿关联：必须同时提供账号、原编号与原密钥', async t => {
	const { store } = await fixture(t);
	// 先走免注册投稿拿到编号与密钥。
	const key = randomBytes(32).toString('hex');
	const created = await store.create({
		key, website: '', title: '测试用虚构资料', description: '这是一份自动检查使用的虚构资料，不包含真实人物。',
		category: '照片', era: '', name: '测试投稿人', contact_type: 'email', contact: 'synthetic@example.invalid',
		attribution: 'anonymous', credit: '', people: 'none', consent_version: consentVersion, consents: consents(),
		images: [{ name: 'screening-copy.jpg', buffer: image }],
	});
	// 密钥错误、编号错误都不能认领。
	await assert.rejects(store.claimSubmission({ id: created.id, key: randomBytes(32).toString('hex'), accountId: ACCOUNT_A }), { statusCode: 404 });
	await assert.rejects(store.claimSubmission({ id: 'TG-000000000000000000000000', key, accountId: ACCOUNT_A }), { statusCode: 404 });
	// 正确凭据：认领成功并出现在账号投稿列表里。
	assert.equal((await store.claimSubmission({ id: created.id, key, accountId: ACCOUNT_A })).claimed, true);
	assert.equal((await store.claimSubmission({ id: created.id, key, accountId: ACCOUNT_A })).repeated, true);
	assert.equal((await store.listAccountSubmissions({ accountId: ACCOUNT_A })).length, 1);
	// 另一个账号不能抢走已经被认领的投稿。
	await assert.rejects(store.claimSubmission({ id: created.id, key, accountId: ACCOUNT_B }), { statusCode: 409 });
});

test('进度通知：只在状态真正变化时触发，通知器失败也不影响审核结果', async t => {
	const { store, notifications, create } = await fixture(t);
	const created = await create(ACCOUNT_A, 'pending');
	await store.review(created.id, { revision: 1, status: 'needs_info', public_message: '请补充资料来源。', private_note: '' });
	assert.equal(notifications.length, 1);
	assert.equal(notifications[0].event, 'needs_info');
	assert.equal(notifications[0].accountId, ACCOUNT_A);
	// 通知内容里不含投稿正文或联系方式。
	assert.ok(!JSON.stringify(notifications[0]).includes('synthetic'));
	const current = await store.detail(created.id);
	await store.review(created.id, { revision: current.revision, status: 'needs_info', public_message: '再次说明。', private_note: '' });
	assert.equal(notifications.length, 1);
	// 通知器抛错时审核仍然成功保存。
	const failingRoot = path.join(os.tmpdir(), `ljm-notify-${randomBytes(6).toString('hex')}`);
	const failing = createSubmissionStore({ root: failingRoot, siteDirectory, notifier: async () => { throw new Error('synthetic notification failure'); } });
	t.after(async () => { await fs.rm(path.resolve(failingRoot), { recursive: true, force: true }); });
	const draft = await failing.createAccountSubmission({
		accountId: ACCOUNT_A, mode: 'pending',
		payload: { fields: completeFields(), images: [{ name: 'a.jpg', buffer: image }], consents: consents(), consent_version: consentVersion },
	});
	const reviewed = await failing.review(draft.id, { revision: 1, status: 'declined', public_message: '这次暂不采用。', private_note: '' });
	assert.equal(reviewed.status, 'declined');
});

test('通知偏好：默认关闭，开启后才返回收件人，注销处理中不再提醒', async t => {
	const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ljm-account-pref-'));
	const mailDirectory = path.join(root, 'mail-outbox');
	const store = createAccountStore({
		directory: path.join(root, 'accounts'),
		mailer: createMailer({ transport: 'file', environment: 'development', directory: mailDirectory }),
		environment: 'development',
		ipSalt: 'test-salt',
	});
	t.after(async () => {
		store.close();
		await fs.rm(path.resolve(root), { recursive: true, force: true });
	});
	const readCode = async (to) => {
		const files = (await fs.readdir(mailDirectory)).filter((name) => name.endsWith('.json')).sort();
		for (let index = files.length - 1; index >= 0; index -= 1) {
			const message = JSON.parse(await fs.readFile(path.join(mailDirectory, files[index]), 'utf8'));
			if (message.to === to) return message.text.match(/\d{6}/)?.[0] ?? '';
		}
		throw new Error('没有找到验证码邮件。');
	};
	const email = 'pref@example.invalid';
	const issued = await store.requestLoginCode({ email, ip: '10.0.0.1' });
	const verified = await store.verifyLoginCode({ email, ticket: issued.ticket, code: await readCode(email), client: 'test', ip: '10.0.0.1' });
	const account = await store.completeOnboarding({ onboardingTicket: verified.onboarding_ticket, agreement: agreementVersion, agreed: true, nickname: '', client: 'test', ip: '10.0.0.1' });
	// 默认关闭：不返回收件人。
	assert.equal(store.notificationRecipient(account.user.id), null);
	const session = store.resolveSession(account.token);
	store.updateProfile({ session, notifyProgress: true });
	assert.equal(store.notificationRecipient(account.user.id).email, email);
	// 提交注销申请后不再提醒。
	store.createRequest({ session: store.resolveSession(account.token), kind: 'deletion' });
	assert.equal(store.notificationRecipient(account.user.id), null);
	// 未知账号不会误判。
	assert.equal(store.notificationRecipient('usr_ffffffffffffffffffffffff'), null);
});
