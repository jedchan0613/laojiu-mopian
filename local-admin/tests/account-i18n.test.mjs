import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { once } from 'node:events';
import { DatabaseSync } from 'node:sqlite';
import { createAccountStore, agreementVersion } from '../accounts.mjs';
import { createAccountHandler } from '../account-server.mjs';
import { createMailer } from '../mail.mjs';
import { localizeAccountPayload } from '../account-i18n.mjs';

async function fixture(t) {
 const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'ljm-language-test-'));
 const deliveries = [];
 const mailer = { available: true, environment: 'development', describe: () => ({ available: true }), send: async payload => { deliveries.push(payload); return { id: 'fake-id' }; } };
 let store = createAccountStore({ directory, mailer, ipSalt: 'language-test-salt' });
 t.after(async () => {
  store.close();
  const resolved = path.resolve(directory);
  assert.equal(path.dirname(resolved), path.resolve(os.tmpdir()));
  assert.ok(path.basename(resolved).startsWith('ljm-language-test-'));
  await fs.rm(resolved, { recursive: true, force: true });
 });
 return { directory, deliveries, mailer, get store() { return store; }, reopen: () => { store = createAccountStore({ directory, mailer, ipSalt: 'language-test-salt' }); return store; } };
}

async function register(f, language = 'zh-CN') {
 const email = 'language-reader@example.invalid';
 const requested = await f.store.requestLoginCode({ email, ip: '10.1.1.1', language });
 const code = f.deliveries.at(-1).variables.code;
 const verified = await f.store.verifyLoginCode({ email, ticket: requested.ticket, code, client: 'language-test', ip: '10.1.1.1', language });
 return f.store.completeOnboarding({ onboardingTicket: verified.onboarding_ticket, agreement: agreementVersion, agreed: true, client: 'language-test', ip: '10.1.1.1', language });
}

test('英文验证码与账号邮件偏好贯通，非法语言不会写入账号', async t => {
 const f = await fixture(t);
 const account = await register(f, 'en');
 assert.equal(f.deliveries[0].variables.language, 'en');
 assert.equal(account.user.preferred_language, 'en');
 const session = f.store.resolveSession(account.token);
 const profile = f.store.updateProfile({ session, notifyProgress: true, preferredLanguage: 'en' });
 assert.equal(profile.preferred_language, 'en');
 assert.equal(f.store.notificationRecipient(account.user.id).preferred_language, 'en');
 assert.throws(() => f.store.updateProfile({ session, nickname: 'must-not-change', preferredLanguage: 'fr' }));
 assert.notEqual(f.store.account({ session }).user.nickname, 'must-not-change');
 await f.store.requestEmailChange({ session, ip: '10.1.1.1' });
 assert.equal(f.deliveries.at(-1).variables.language, 'en');
});

test('旧账号数据库迁移保留账号、收藏和现有会话，默认中文', async t => {
 const f = await fixture(t);
 const account = await register(f);
 const session = f.store.resolveSession(account.token);
 f.store.toggleFavorite({ session, itemId: 'LJM-20260101-PHO-001', action: 'add' });
 f.store.close();
 const database = new DatabaseSync(path.join(f.directory, 'accounts.db'));
 database.exec('ALTER TABLE users DROP COLUMN preferred_language');
 database.exec('UPDATE schema_version SET version = 1');
 database.close();
 const store = f.reopen();
 const restored = store.resolveSession(account.token);
 assert.equal(restored.user.id, account.user.id);
 assert.equal(restored.public.preferred_language, 'zh-CN');
 assert.equal(store.listFavorites({ session: restored })[0].item_id, 'LJM-20260101-PHO-001');
});

test('三种英文邮件模板保持必要通知且不翻译投稿题名', async () => {
 const sent = [];
 const mailer = createMailer({ transport: 'https', environment: 'production', endpoint: 'https://example.invalid/mail', apiKey: 'test-only', from: 'archive@example.invalid', fetchImpl: async (_url, init) => { sent.push(JSON.parse(init.body)); return { ok: true, json: async () => ({ id: 'fake-id' }) }; } });
 await mailer.send({ to: 'reader@example.invalid', template: 'login-code', variables: { language: 'en', code: '123456', minutes: 10, purpose: 'login' } });
 await mailer.send({ to: 'reader@example.invalid', template: 'email-changed-notice', variables: { language: 'en', newEmail: 'new@example.invalid' } });
 await mailer.send({ to: 'reader@example.invalid', template: 'submission-progress', variables: { language: 'en', title: '原始投稿题名', event: 'approved' } });
 assert.match(sent[0].text, /expires in 10 minutes/);
 assert.match(sent[1].text, /All signed-in devices have been signed out/);
 assert.match(sent[2].text, /原始投稿题名/);
 assert.match(sent[2].text, /initial review|Initial review/);
 assert.match(sent[2].text, /no submission body, images or contact details/);
});

test('英文接口只翻译固定状态与错误，保留永久编号和人工回复', async t => {
 const value = localizeAccountPayload({ items: [{ status: 'needs_info', status_label: '待补充', title: '访客原标题', public_message: '站主人工回复', linked_item_id: 'LJM-20260101-PHO-001' }] }, 'en');
 assert.equal(value.items[0].status_label, 'More information needed');
 assert.equal(value.items[0].status, 'needs_info');
 assert.equal(value.items[0].title, '访客原标题');
 assert.equal(value.items[0].public_message, '站主人工回复');
 assert.equal(value.items[0].linked_item_id, 'LJM-20260101-PHO-001');
 const f = await fixture(t);
 const handler = createAccountHandler({ store: f.store, origin: 'http://127.0.0.1:4173', adminOrigin: 'http://127.0.0.1:4173', local: true });
 const server = http.createServer((req, res) => { void handler(req, res, new URL(req.url, 'http://127.0.0.1').pathname); });
 server.listen(0, '127.0.0.1'); await once(server, 'listening');
 t.after(() => new Promise(resolve => server.close(resolve)));
 const response = await fetch(`http://127.0.0.1:${server.address().port}/api/account/me`, { headers: { 'X-LJM-Language': 'en' } });
 assert.equal(response.status, 401);
 assert.match((await response.json()).error, /sign-in|Sign in|sign in/);
 const chinese = await fetch(`http://127.0.0.1:${server.address().port}/api/account/me`);
 assert.equal((await chinese.json()).error, '登录状态已过期，请重新登录。');
});

