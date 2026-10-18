// 仅用于 HTML 中的 JSON 脚本数据块；普通文字、属性继续由框架转义。
// JSON 解析后逐字还原，不删除或改写档案内容。
export function serializeHtmlJson(value) {
	const json = JSON.stringify(value);
	if (typeof json !== 'string') throw new TypeError('脚本数据必须能够序列化为 JSON。');
	const escapes = { '<': '\\u003c', '>': '\\u003e', '&': '\\u0026', '\u2028': '\\u2028', '\u2029': '\\u2029' };
	return json.replace(/[<>&\u2028\u2029]/g, (character) => escapes[character]);
}
