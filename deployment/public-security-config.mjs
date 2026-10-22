import { prepareManagedSnippetConfig } from './public-cache-config.mjs';

export const publicSecurityName = 'laojiumopian-public-security.caddy';
export const errorSecurityName = 'laojiumopian-error-security.caddy';
export const publicSecurityHeaders = Object.freeze({
 'x-content-type-options': 'nosniff',
 'x-frame-options': 'DENY',
 'referrer-policy': 'strict-origin-when-cross-origin',
 'content-security-policy': "base-uri 'self'; object-src 'none'; frame-ancestors 'none'",
});
export const hstsHeader = 'max-age=300';
export const preparePublicSecurityConfig = (source, directory = '/etc/caddy') => prepareManagedSnippetConfig(source, directory, publicSecurityName, errorSecurityName);
