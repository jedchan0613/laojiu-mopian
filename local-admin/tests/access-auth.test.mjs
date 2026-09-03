import assert from 'node:assert/strict';
import { generateKeyPairSync, sign } from 'node:crypto';
import test from 'node:test';
import { AccessAuthenticationError, createAccessAuthenticator } from '../access-auth.mjs';

const teamDomain = 'https://example.cloudflareaccess.com';
const audience = 'test-audience';
const allowedEmail = 'owner@example.com';
const nowMilliseconds = Date.UTC(2026, 8, 3, 12, 0, 0);
const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const keyId = 'test-key';
const publicJwk = { ...publicKey.export({ format: 'jwk' }), kid: keyId, alg: 'RS256', use: 'sig' };

const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
const createToken = (overrides = {}) => {
	const header = encode({ alg: 'RS256', typ: 'JWT', kid: keyId });
	const nowSeconds = Math.floor(nowMilliseconds / 1000);
	const payload = encode({
		aud: [audience],
		email: allowedEmail,
		exp: nowSeconds + 3600,
		iat: nowSeconds,
		nbf: nowSeconds,
		iss: teamDomain,
		type: 'app',
		sub: 'test-user',
		...overrides,
	});
	const input = `${header}.${payload}`;
	const signature = sign('RSA-SHA256', Buffer.from(input), privateKey).toString('base64url');
	return `${input}.${signature}`;
};

const createAuthenticator = () => createAccessAuthenticator({
	teamDomain,
	audience,
	allowedEmails: new Set([allowedEmail]),
	fetchImplementation: async () => ({ ok: true, json: async () => ({ keys: [publicJwk] }) }),
	now: () => nowMilliseconds,
});

test('接受签名、签发方、受众和邮箱均正确的 Access JWT', async () => {
	const identity = await createAuthenticator().verifyToken(createToken());
	assert.deepEqual(identity, { email: allowedEmail, subject: 'test-user' });
});

for (const [name, overrides] of [
	['错误的受众', { aud: ['other-audience'] }],
	['未授权邮箱', { email: 'other@example.com' }],
	['已经过期', { exp: Math.floor(nowMilliseconds / 1000) - 120 }],
	['错误的签发方', { iss: 'https://other.cloudflareaccess.com' }],
]) {
	test(`拒绝${name}的 Access JWT`, async () => {
		await assert.rejects(createAuthenticator().verifyToken(createToken(overrides)), AccessAuthenticationError);
	});
}

test('拒绝被改写但未重新签名的 Access JWT', async () => {
	const token = createToken();
	const [header, , signature] = token.split('.');
	const tamperedPayload = encode({
		aud: [audience], email: allowedEmail, exp: Math.floor(nowMilliseconds / 1000) + 3600,
		iat: Math.floor(nowMilliseconds / 1000), iss: teamDomain, type: 'app', sub: 'tampered',
	});
	await assert.rejects(
		createAuthenticator().verifyToken(`${header}.${tamperedPayload}.${signature}`),
		AccessAuthenticationError,
	);
});
