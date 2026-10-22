import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { installPublicCache } from './public-cache-install.mjs';
import { preparePublicSecurityConfig, publicSecurityName, errorSecurityName } from './public-security-config.mjs';
import { verifyPublicSecurity } from './verify-public-security.mjs';
import { verifyPublicCache } from './verify-public-cache.mjs';

export const installPublicSecurity = options => installPublicCache({ ...options, prepareConfig: preparePublicSecurityConfig, label: '公开防护', snippetSources: [[publicSecurityName, 'Caddyfile.public-security.example'], [errorSecurityName, 'Caddyfile.error-security.example']] });

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
 const mode = process.argv[2] ?? '--check';
 if (!['--check', '--apply'].includes(mode) || process.argv.length > 3) throw new Error('用法：public-security-install.mjs [--check|--apply]，默认只检查。');
 if (process.getuid?.() !== 0) throw new Error('请使用sudo读取正式Caddy配置；默认检查不重载服务。');
 const backupDirectory = `/srv/laojiumopian-admin/build-work/public-security-${new Date().toISOString().replace(/[:.]/g, '-')}-${randomUUID()}`;
 const execute = promisify(execFile);
 const result = await installPublicSecurity({
  configFile: '/etc/caddy/Caddyfile', snippetsDirectory: '/etc/caddy', sourceDirectory: path.dirname(fileURLToPath(import.meta.url)), backupDirectory, apply: mode === '--apply',
  validate: async file => { const result = await execute('caddy', ['validate', '--config', file, '--adapter', 'caddyfile']); await fs.appendFile(path.join(backupDirectory, 'validation.log'), result.stdout + result.stderr, { mode: 0o600 }); },
  reload: () => execute('systemctl', ['reload', 'caddy']),
  verify: async () => {
   await verifyPublicSecurity({ baseUrl: 'https://laojiumopian.com', reportFile: path.join(backupDirectory, 'security-verification.json') });
   await verifyPublicCache({ baseUrl: 'https://laojiumopian.com', reportFile: path.join(backupDirectory, 'cache-verification.json'), adminOrigin: 'http://127.0.0.1:4174' });
  },
 });
 console.log(JSON.stringify(result));
 console.log(result.applied ? '公开防护已应用并核验，恢复备份已保留；HSTS在访客端最多继续保留五分钟。' : '仅检查通过，未改正式配置或重载Caddy。');
}
