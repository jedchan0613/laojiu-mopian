// 账户页面共享的请求封装。
// 统一携带账户请求标记（服务端会校验来源与标记，防止其他网页代为提交），
// 统一把后端返回的中文提示转成可直接展示的错误信息。

export type AccountResponse = Record<string, any>;

export const accountFetch = async (path: string, options: { method?: string; body?: unknown } = {}): Promise<AccountResponse> => {
	const headers: Record<string, string> = { 'X-LJM-Account-Request': '1' };
	if (options.body !== undefined) headers['Content-Type'] = 'application/json';
	let response: Response;
	try {
		response = await fetch(path, {
			method: options.method ?? 'GET',
			credentials: 'same-origin',
			headers,
			body: options.body === undefined ? undefined : JSON.stringify(options.body),
		});
	} catch {
		throw new Error('网络连接失败，请检查网络后重试；已填写的内容不会自动丢失。');
	}
	let payload: AccountResponse = {};
	try {
		payload = await response.json();
	} catch {
		payload = {};
	}
	if (!response.ok) {
		const error = new Error(typeof payload.error === 'string' && payload.error ? payload.error : '暂时无法完成操作，请稍后再试。');
		(error as Error & { status?: number }).status = response.status;
		throw error;
	}
	return payload;
};

export const setStatus = (element: Element | null, message: string, tone: 'info' | 'ok' | 'error' = 'info') => {
	if (!element) return;
	element.textContent = message;
	if (tone === 'info') element.removeAttribute('data-tone');
	else element.setAttribute('data-tone', tone);
};

export const toggle = (element: Element | null, visible: boolean) => {
	if (element instanceof HTMLElement) element.hidden = !visible;
};

export const formatDate = (value: string) => {
	if (!value) return '';
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;
	return new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
};
