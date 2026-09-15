// 随手翻一件：从构建时写入页面的公开档案编号索引中随机挑选一条跳转。
// 按钮由页面提供（data-random-record-button），索引由页面内嵌 JSON 提供
// （id 为 random-record-index）。没有索引或索引为空时按钮自动隐藏。

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
	for (const button of buttons) {
		// 按钮在页面里默认隐藏，只有脚本成功拿到有效索引后才显示，
		// 与点赞按钮的处理方式一致（未开启 JavaScript 时不会出现无效按钮）。
		if (itemIds.length === 0) continue;
		button.hidden = false;
		button.addEventListener('click', () => {
			const target = itemIds[Math.floor(Math.random() * itemIds.length)];
			if (target) window.location.assign(`/archive/${target}/`);
		});
	}
};

initializeRandomRecord();
