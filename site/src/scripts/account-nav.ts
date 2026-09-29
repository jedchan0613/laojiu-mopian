// 主导航的登录入口：默认显示「登录」，确认已登录后切换为「我的」。
// 请求在页面加载完成后再发出，不阻塞首屏；失败时保持默认入口，不做任何猜测。

const link = document.querySelector<HTMLAnchorElement>('[data-account-nav]');

if (link) {
	const sync = async () => {
		try {
			const response = await fetch('/api/account/me', { credentials: 'same-origin', headers: { Accept: 'application/json' } });
			if (!response.ok) return;
			const payload = await response.json();
			if (!payload?.user) return;
			link.textContent = '我的';
			link.setAttribute('href', '/me/contributions/');
			link.setAttribute('data-account-nickname', String(payload.user.nickname ?? ''));
		} catch {
			// 账户服务未启动或离线时保持「登录」入口，访客仍可正常浏览公开页面。
		}
	};
	if (document.readyState === 'complete') void sync();
	else window.addEventListener('load', () => void sync(), { once: true });
}

export {};
