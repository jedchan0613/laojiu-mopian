import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { serializeHtmlJson } from '../../shared/html-json.mjs';

const value = { title: '</ScRiPt><span data-synthetic-injected="yes">无害测试</span>',
	caption: '<!-- </script> & " \' \\ \n中文 日本語 ภาษาไทย 한국어 繁體 😀 \u2028\u2029',
	nested: [null, false, 12, { original: '\\u003c不是重复转义' }] };

test('脚本 JSON 输出不能生成 HTML 标签，并且解析后原文逐字一致', () => {
	const json = serializeHtmlJson(value);
	assert.doesNotMatch(json, /[<>&\u2028\u2029]/);
	assert.deepEqual(JSON.parse(json), value);
	assert.throws(() => serializeHtmlJson(undefined), TypeError);
});

test('真实 Astro 编译和渲染不截断数据块、不创建额外标签', async () => {
	const require = createRequire(new URL('../../site/package.json', import.meta.url));
	const { transform } = await import(pathToFileURL(require.resolve('@astrojs/compiler-rs')));
	const { experimental_AstroContainer } = await import(pathToFileURL(require.resolve('astro/container')));
	const runtime = pathToFileURL(require.resolve('astro/compiler-runtime')).href;
	for (const type of ['application/json', 'application/ld+json']) {
		const source = `---\nconst { value, serializeHtmlJson } = Astro.props;\n---\n<script type="${type}" id="synthetic-data" set:html={serializeHtmlJson(value)} />`;
		const compiled = await transform(source, { filename: 'synthetic-html-json.astro' });
		const code = compiled.code.replaceAll('"astro/runtime/server/index.js"', JSON.stringify(runtime))
			.replace(', createMetadata as $$createMetadata', '').replace(/export const \$\$metadata = [\s\S]*?\n\}\);/, '');
		const component = (await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)).default;
		const container = await experimental_AstroContainer.create();
		const html = await container.renderToString(component, { props: { value, serializeHtmlJson } });
		const match = /^<script\b[^>]*>([\s\S]*?)<\/script>\s*$/.exec(html);
		assert.ok(match, html);
		assert.deepEqual(JSON.parse(match[1]), value);
		assert.equal((html.match(/<\/script>/gi) ?? []).length, 1);
		assert.doesNotMatch(html, /<span|<img|<iframe/i);
	}
});

test('所有已知 HTML 脚本数据出口使用同一个安全函数，属性上下文保留框架转义', async () => {
	for (const relative of ['pages/archive/[id].astro', 'pages/archive/index.astro', 'layouts/BaseLayout.astro', 'pages/index.astro', 'pages/404.astro']) {
		const source = await fs.readFile(new URL(`../../site/src/${relative}`, import.meta.url), 'utf8');
		assert.match(source, /import \{ serializeHtmlJson \} from/);
		assert.doesNotMatch(source, /set:html=\{JSON\.stringify/);
		assert.match(source, /serializeHtmlJson\(/);
	}
});
