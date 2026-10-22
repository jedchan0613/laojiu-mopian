// 只插入缓存import；遇到不明确结构停止，不重写认证、路由或其他域名。
export const publicCacheName = 'laojiumopian-public-cache.caddy';
export const errorCacheName = 'laojiumopian-error-cache.caddy';

export function preparePublicCacheConfig(source, directory = '/etc/caddy') {
	return prepareManagedSnippetConfig(source, directory, publicCacheName, errorCacheName);
}

// 缓存和公开防护使用同一个保守解析器；各自只管理自己命名的import。
export function prepareManagedSnippetConfig(source, directory, normalName, errorsName) {
	if (/[\r\n"`]/.test(directory)) throw new Error('缓存规则目录无效。');
	if (![normalName, errorsName].every(name => /^[a-z][a-z0-9-]+\.caddy$/.test(name)) || normalName === errorsName) throw new Error('托管规则名称无效。');
	const newline = source.includes('\r\n') ? '\r\n' : '\n';
	const lines = source.split(/\r?\n/);
	const stack = [], blocks = [], imports = [];
	let pending = [];
	for (const [index, line] of lines.entries()) {
		if (/<<\w/.test(line)) throw new Error('配置含多行字面量，请人工核对，不自动修改。');
		const tokens = (line.match(/"(?:\\.|[^"\\])*"|`[^`]*`|[^\s]+/g) ?? []);
		const comment = tokens.findIndex(token => token.startsWith('#'));
		if (comment >= 0) tokens.splice(comment);
		if (tokens[0] === 'import') {
			const name = tokens[1]?.replace(/^"|"$/g, '');
			if ([normalName, errorsName].some(base => name?.split('/').at(-1) === base)) {
				if (tokens.length !== 2) throw new Error('已有缓存import包含未知参数，停止自动修改。');
				imports.push({ index, name, owner: stack.at(-1) });
			}
		}
		let prefix = [];
		for (const token of tokens) {
			if (token === '{') {
				const block = { start: index, parent: stack.at(-1), header: [...(stack.length ? [] : pending), ...prefix], children: [] };
				block.parent?.children.push(block);
				blocks.push(block); stack.push(block); prefix = []; pending = [];
			} else if (token === '}') {
				const block = stack.pop();
				if (!block) throw new Error('配置括号不匹配。');
				block.end = index; prefix = [];
			} else prefix.push(token);
		}
		if (!stack.length && !tokens.includes('}')) pending.push(...prefix);
	}
	if (stack.length) throw new Error('配置括号不匹配。');
	const publicBlocks = blocks.filter(block => !block.parent && block.header.flatMap(token => token.split(',')).some(token => token.replace(/^https:\/\//, '').replace(/:443$/, '') === 'laojiumopian.com'));
	if (publicBlocks.length !== 1) throw new Error('没有找到唯一的正式站点块，停止自动修改。');
	const site = publicBlocks[0];
	const errors = site.children.filter(block => block.header[0] === 'handle_errors');
	if (!errors.length) throw new Error('正式站缺少既有错误处理，请人工核对。');
	for (const block of [site, ...errors]) {
		if (block.start === block.end || !/^\s*[^#]*\{\s*(?:#.*)?$/.test(lines[block.start])) throw new Error('站点或错误块不是独立多行结构，停止自动修改。');
	}
	for (const entry of imports) {
		const isPublic = entry.name.split('/').at(-1) === normalName;
		if (isPublic ? entry.owner !== site : !errors.includes(entry.owner)) throw new Error('已有缓存import不在预期站点/错误块内，停止自动修改。');
	}
	const remove = new Set(imports.map(entry => entry.index));
	const insert = new Map([[site.start, `\timport "${directory}/${normalName}"`], ...errors.map(block => [block.start, `${lines[block.start].match(/^\s*/)[0]}\timport "${directory}/${errorsName}"`])]);
	return lines.flatMap((line, index) => remove.has(index) ? [] : insert.has(index) ? [line, insert.get(index)] : [line]).join(newline);
}
