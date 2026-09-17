// 随手翻一件：从构建时写入页面的公开档案编号索引中随机挑选一条跳转。
// 按钮由页面提供（data-random-record-button），索引由页面内嵌 JSON 提供
// （id 为 random-record-index）。按钮在页面里默认以 visibility:hidden 占据
// 布局位置，只有脚本成功拿到有效索引后才为其加上 data-random-record-ready
// 让 CSS 淡入显示；索引缺失或为空属于异常路径，此时直接移除按钮，
// 宁可布局轻微跳动也不留一块看不见的空白。禁用 JavaScript 的情况由页面
// 内的 <noscript> 样式将按钮彻底收起。

const ID_PATTERN = /^LJM-\d{8}-[A-Z0-9]{2,5}-\d{3}$/;

const readRandomIndex = (): string[] => {
	try {
		const element = document.querySelector('#random-record-index');
		const parsed = JSON.parse(element?.textContent ?? '[]');
		if (!Array.isArray(parsed)) return [];
		return parsed.filter((value): value is string => typeof value === 'string' && ID_PATTERN.test(value));
	} catch {
		return [];
	}
};

const initializeRandomRecord = () => {
	const buttons = [...document.querySelectorAll<HTMLButtonElement>('[data-random-record-button]')];
	if (buttons.length === 0) return;
	const itemIds = readRandomIndex();
	if (itemIds.length === 0) {
		for (const button of buttons) button.remove();
		return;
	}
	for (const button of buttons) {
		button.dataset.randomRecordReady = '';
		button.addEventListener('click', () => {
			const target = itemIds[Math.floor(Math.random() * itemIds.length)];
			if (target) window.location.assign(`/archive/${target}/`);
		});
	}
};

initializeRandomRecord();
