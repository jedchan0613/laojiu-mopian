// 逐页收集唯一汉字，避免把全站正文拼接、再为每次重复出现的字分配数组项。
export const collectVisibleHan = (html, characters = new Set()) => {
	const markup = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');
	for (const match of markup.matchAll(/\p{Script=Han}/gu)) characters.add(match[0]);
	return characters;
};
