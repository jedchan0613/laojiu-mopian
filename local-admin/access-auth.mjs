import { createPublicKey, verify as verifySignature } from 'node:crypto';

const maximumTokenLength = 16 * 1024;
const clockToleranceSeconds = 60;
const keyCacheMilliseconds = 5 * 60 * 1000;

export class AccessAuthenticationError extends Error {
	constructor(message = '登录身份验证未通过，请刷新页面并重新登录。') {
		super(message);
		this.name = 'AccessAuthenticationError';
		this.statusCode = 403;
	}
}

const failAuthentication = () => {
	throw new AccessAuthenticationError();
};

const decodeJsonSegment = (segment) => {
	if (!segment || !/^[A-Za-z0-9_-]+$/.test(segment)) failAuthentication();
	try {
		return JSON.parse(Buffer.from(segment, 'base64url').toString('utf8'));
	} catch {
		failAuthentication();
	}
};

const audienceMatches = (claim, expectedAudience) => {
	const values = Array.isArray(claim) ? claim : [claim];
	return values.some((value) => value === expectedAudience);
};

export const createAccessAuthenticator = ({
	teamDomain,
	audience,
	allowedEmails,
	fetchImplementation = globalThis.fetch,
	now = () => Date.now(),
}) => {
	let cachedKeys = null;
	let cachedAt = 0;

	const loadKeys = async (forceRefresh = false) => {
		if (!forceRefresh && cachedKeys && now() - cachedAt < keyCacheMilliseconds) return cachedKeys;
		let response;
		try {
			response = await fetchImplementation(`${teamDomain}/cdn-cgi/access/certs`, {
				headers: { Accept: 'application/json' },
				signal: AbortSignal.timeout(5000),
			});
		} catch {
			throw new AccessAuthenticationError('暂时无法核验登录身份，请稍后刷新页面重试。');
		}
		if (!response?.ok) {
			throw new AccessAuthenticationError('暂时无法核验登录身份，请稍后刷新页面重试。');
		}
		let body;
		try {
			body = await response.json();
		} catch {
			throw new AccessAuthenticationError('暂时无法核验登录身份，请稍后刷新页面重试。');
		}
		if (!Array.isArray(body?.keys) || body.keys.length === 0) {
			throw new AccessAuthenticationError('暂时无法核验登录身份，请稍后刷新页面重试。');
		}
		cachedKeys = body.keys.filter((key) => key?.kty === 'RSA' && typeof key?.kid === 'string');
		cachedAt = now();
		if (cachedKeys.length === 0) {
			throw new AccessAuthenticationError('暂时无法核验登录身份，请稍后刷新页面重试。');
		}
		return cachedKeys;
	};

	const findKey = async (keyId) => {
		let keys = await loadKeys();
		let key = keys.find((candidate) => candidate.kid === keyId);
		if (!key) {
			keys = await loadKeys(true);
			key = keys.find((candidate) => candidate.kid === keyId);
		}
		if (!key) failAuthentication();
		return key;
	};

	const verifyToken = async (token) => {
		if (typeof token !== 'string' || token.length === 0 || token.length > maximumTokenLength) {
			failAuthentication();
		}
		const segments = token.split('.');
		if (segments.length !== 3) failAuthentication();
		const [encodedHeader, encodedPayload, encodedSignature] = segments;
		const header = decodeJsonSegment(encodedHeader);
		const payload = decodeJsonSegment(encodedPayload);
		if (header?.alg !== 'RS256' || typeof header?.kid !== 'string' || header.kid.length === 0) {
			failAuthentication();
		}
		if (!encodedSignature || !/^[A-Za-z0-9_-]+$/.test(encodedSignature)) failAuthentication();

		const key = await findKey(header.kid);
		let publicKey;
		try {
			publicKey = createPublicKey({ key, format: 'jwk' });
		} catch {
			failAuthentication();
		}
		const verified = verifySignature(
			'RSA-SHA256',
			Buffer.from(`${encodedHeader}.${encodedPayload}`, 'ascii'),
			publicKey,
			Buffer.from(encodedSignature, 'base64url'),
		);
		if (!verified) failAuthentication();

		const nowSeconds = Math.floor(now() / 1000);
		if (payload?.iss !== teamDomain || !audienceMatches(payload?.aud, audience)) failAuthentication();
		if (payload?.type !== 'app') failAuthentication();
		if (typeof payload?.exp !== 'number' || payload.exp < nowSeconds - clockToleranceSeconds) {
			failAuthentication();
		}
		if (typeof payload?.iat !== 'number' || payload.iat > nowSeconds + clockToleranceSeconds) {
			failAuthentication();
		}
		if (payload?.nbf !== undefined &&
			(typeof payload.nbf !== 'number' || payload.nbf > nowSeconds + clockToleranceSeconds)) {
			failAuthentication();
		}
		const email = typeof payload?.email === 'string' ? payload.email.trim().toLowerCase() : '';
		if (!email || !allowedEmails.has(email)) failAuthentication();

		return {
			email,
			subject: typeof payload?.sub === 'string' ? payload.sub : '',
		};
	};

	return {
		verifyRequest: (request) => verifyToken(request.headers['cf-access-jwt-assertion']),
		verifyToken,
	};
};
