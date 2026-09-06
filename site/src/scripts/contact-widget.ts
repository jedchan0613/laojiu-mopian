type ContactReceipt = { id: string; key: string; created_at: string };
type ContactConfig = { available: boolean; consent_version: string };

const root = document.querySelector<HTMLElement>('[data-contact-widget]');

if (root && root.dataset.ready !== 'true') {
	root.dataset.ready = 'true';
	const $ = <T extends Element>(selector: string) => root.querySelector<T>(selector)!;
	const launcher = $<HTMLButtonElement>('[data-contact-launcher]');
	const panel = $<HTMLElement>('[data-contact-panel]');
	const closeButton = $<HTMLButtonElement>('[data-contact-close]');
	const service = $<HTMLElement>('[data-contact-service]');
	const fields = $<HTMLFieldSetElement>('[data-contact-fields]');
	const form = $<HTMLFormElement>('[data-contact-form]');
	const feedback = $<HTMLElement>('[data-contact-feedback]');
	const fallback = $<HTMLElement>('[data-contact-fallback]');
	const categoryInput = $<HTMLInputElement>('[data-contact-category]');
	const pagePathInput = $<HTMLInputElement>('[data-contact-page-path]');
	const referenceField = $<HTMLElement>('[data-contact-reference-field]');
	const correctionLink = $<HTMLElement>('[data-contact-correction-link]');
	const contextTitle = $<HTMLElement>('[data-contact-context-title]');
	const contextCopy = $<HTMLElement>('[data-contact-context-copy]');
	const channel = $<HTMLSelectElement>('[data-contact-channel]');
	const valueField = $<HTMLElement>('[data-contact-value-field]');
	const contactValue = $<HTMLInputElement>('[data-contact-value]');
	const message = $<HTMLTextAreaElement>('[data-contact-message]');
	const count = $<HTMLElement>('[data-contact-count]');
	const submitButton = $<HTMLButtonElement>('[data-contact-submit]');
	const receiptSection = $<HTMLElement>('[data-contact-receipt]');
	const receiptId = $<HTMLElement>('[data-contact-receipt-id]');
	const receiptKey = $<HTMLElement>('[data-contact-receipt-key]');
	const lookupForm = $<HTMLFormElement>('[data-contact-lookup-form]');
	const lookupId = $<HTMLInputElement>('[data-contact-lookup-id]');
	const lookupKey = $<HTMLInputElement>('[data-contact-lookup-key]');
	const lookupResult = $<HTMLElement>('[data-contact-lookup-result]');
	const storageKey = 'ljm-contact-receipt-v1';
	let consentVersion = '';
	let receipt: ContactReceipt | null = null;
	let requestKey = '';

	const categoryCopy: Record<string, [string, string]> = {
		collab: ['合作洽谈', '请简要说明合作方向、时间安排和希望采用的联系方式。'],
		privacy: ['隐私问题', '请指出相关档案或页面及风险；此类来信会优先进入人工核对。'],
		other: ['其他事宜', '建议、问题或想说的话，都可以在这里简要说明。'],
	};

	const createKey = () => {
		const bytes = crypto.getRandomValues(new Uint8Array(32));
		return [...bytes].map((value) => value.toString(16).padStart(2, '0')).join('');
	};

	const jsonRequest = async (url: string, payload?: object) => {
		const response = await fetch(url, payload === undefined ? { cache: 'no-store' } : {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', 'X-LJM-Contact': '1' },
			body: JSON.stringify(payload),
		});
		const result = await response.json().catch(() => { throw new Error('联系通道返回了无法读取的结果。'); });
		if (!response.ok) throw new Error(result.error || '操作没有完成，请稍后重试。');
		return result;
	};

	const setOpen = (open: boolean) => {
		panel.hidden = !open;
		launcher.setAttribute('aria-expanded', String(open));
		if (open) requestAnimationFrame(() => closeButton.focus());
		else launcher.focus();
	};

	const setView = (view: 'compose' | 'lookup') => {
		root.querySelectorAll<HTMLButtonElement>('[data-contact-view-button]').forEach((button) => {
			button.setAttribute('aria-selected', String(button.dataset.contactViewButton === view));
		});
		root.querySelectorAll<HTMLElement>('[data-contact-view]').forEach((section) => {
			section.hidden = section.dataset.contactView !== view;
		});
		if (view === 'lookup' && receipt) {
			lookupId.value = receipt.id;
			lookupKey.value = receipt.key;
		}
	};

	const setCategory = (category: string) => {
		const selected = categoryCopy[category] ? category : 'privacy';
		categoryInput.value = selected;
		root.querySelectorAll<HTMLButtonElement>('[data-contact-category-button]').forEach((button) => {
			button.setAttribute('aria-pressed', String(button.dataset.contactCategoryButton === selected));
		});
		contextTitle.textContent = categoryCopy[selected][0];
		contextCopy.textContent = categoryCopy[selected][1];
		referenceField.hidden = selected !== 'privacy';
		correctionLink.hidden = selected !== 'privacy';
	};

	const setChannel = () => {
		const labels: Record<string, string> = { email: '您的邮箱', wechat: '您的微信号', phone: '您的电话号码' };
		const noReply = channel.value === 'none';
		valueField.hidden = noReply;
		contactValue.required = !noReply;
		contactValue.value = noReply ? '' : contactValue.value;
		contactValue.type = channel.value === 'email' ? 'email' : 'text';
		contactValue.placeholder = labels[channel.value] ?? '';
	};

	const receiptText = () => receipt
		? `老旧默片联系回执\n联系编号：${receipt.id}\n查询密钥：${receipt.key}\n收到时间：${new Date(receipt.created_at).toLocaleString('zh-CN', { hour12: false })}\n\n请勿公开分享查询密钥。`
		: '';

	const showReceipt = (next: ContactReceipt) => {
		receipt = next;
		receiptId.textContent = next.id;
		receiptKey.textContent = next.key;
		form.hidden = true;
		receiptSection.hidden = false;
		try { sessionStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* 回执仍可在当前页面查看。 */ }
		requestAnimationFrame(() => receiptSection.focus());
	};

	const checkService = async () => {
		try {
			const config = await jsonRequest('/api/contact/config') as ContactConfig;
			if (!config.available || !config.consent_version) throw new Error('联系通道尚未启用。');
			consentVersion = config.consent_version;
			fields.disabled = false;
			service.textContent = config.available ? '私密联系通道可用。' : '联系通道暂时不可用。';
			service.removeAttribute('data-unavailable');
			fallback.hidden = true;
		} catch {
			consentVersion = '';
			fields.disabled = true;
			service.textContent = '私密联系通道暂时不可用，请稍后再试。';
			service.setAttribute('data-unavailable', '');
			fallback.hidden = false;
		}
	};

	launcher.addEventListener('click', () => setOpen(panel.hidden));
	closeButton.addEventListener('click', () => setOpen(false));
	document.addEventListener('keydown', (event) => {
		if (event.key === 'Escape' && !panel.hidden) setOpen(false);
	});

	root.querySelectorAll<HTMLButtonElement>('[data-contact-view-button]').forEach((button) => {
		button.addEventListener('click', () => setView(button.dataset.contactViewButton === 'lookup' ? 'lookup' : 'compose'));
	});
	root.querySelectorAll<HTMLButtonElement>('[data-contact-category-button]').forEach((button) => {
		button.addEventListener('click', () => setCategory(button.dataset.contactCategoryButton ?? 'privacy'));
	});
	channel.addEventListener('change', setChannel);
	message.addEventListener('input', () => { count.textContent = `${message.value.length} / 2000`; });

	form.addEventListener('submit', async (event) => {
		event.preventDefault();
		if (!consentVersion || submitButton.disabled) return;
		submitButton.disabled = true;
		feedback.textContent = '正在私密提交…';
		requestKey ||= createKey();
		const data = new FormData(form);
		const payload = {
			key: requestKey,
			website: String(data.get('website') ?? ''),
			category: String(data.get('category') ?? ''),
			page_path: String(data.get('page_path') ?? ''),
			reference: String(data.get('reference') ?? ''),
			name: String(data.get('name') ?? ''),
			contact_type: String(data.get('contact_type') ?? ''),
			contact: String(data.get('contact') ?? ''),
			message: String(data.get('message') ?? ''),
			consent_version: consentVersion,
			processing: data.get('processing') === 'on',
		};
		try {
			const result = await jsonRequest('/api/contact', payload);
			showReceipt({ id: result.id, key: requestKey, created_at: result.created_at });
			requestKey = '';
			feedback.textContent = '';
		} catch (error) {
			feedback.textContent = error instanceof Error ? error.message : '提交失败，请稍后重试。';
		} finally {
			submitButton.disabled = false;
		}
	});

	$<HTMLButtonElement>('[data-contact-copy-receipt]').addEventListener('click', async (event) => {
		const button = event.currentTarget as HTMLButtonElement;
		try { await navigator.clipboard.writeText(receiptText()); button.textContent = '已复制'; }
		catch { button.textContent = '请手动保存回执'; }
	});

	$<HTMLButtonElement>('[data-contact-save-receipt]').addEventListener('click', () => {
		if (!receipt) return;
		const url = URL.createObjectURL(new Blob([receiptText()], { type: 'text/plain;charset=utf-8' }));
		const anchor = document.createElement('a');
		anchor.href = url;
		anchor.download = `${receipt.id}-联系回执.txt`;
		anchor.click();
		setTimeout(() => URL.revokeObjectURL(url), 1000);
	});

	$<HTMLButtonElement>('[data-contact-open-lookup]').addEventListener('click', () => setView('lookup'));

	lookupForm.addEventListener('submit', async (event) => {
		event.preventDefault();
		const button = lookupForm.querySelector<HTMLButtonElement>('button[type="submit"]')!;
		if (button.disabled) return;
		button.disabled = true;
		lookupResult.textContent = '正在查询…';
		try {
			const result = await jsonRequest('/api/contact/lookup', {
				id: lookupId.value.trim().toUpperCase(),
				key: lookupKey.value.trim(),
			});
			lookupResult.textContent = `${result.status_label}${result.message ? `\n站主的说明：${result.message}` : '\n暂时还没有新的说明。'}`;
		} catch (error) {
			lookupResult.textContent = error instanceof Error ? error.message : '查询失败，请稍后重试。';
		} finally {
			button.disabled = false;
		}
	});

	pagePathInput.value = `${location.pathname}${location.search}`.slice(0, 500);
	const archiveId = location.pathname.match(/^\/archive\/(LJM-[A-Z0-9-]+)\/?$/)?.[1];
	if (archiveId) {
		const reference = referenceField.querySelector<HTMLInputElement>('input');
		if (reference) reference.value = archiveId;
	}
	try {
		const saved = JSON.parse(sessionStorage.getItem(storageKey) || 'null');
		if (saved && /^LX-[A-F0-9]{24}$/.test(saved.id) && /^[a-f0-9]{64}$/.test(saved.key)) receipt = saved;
	} catch { /* 不长期保存留言正文或联系方式。 */ }
	setChannel();
	setCategory('privacy');
	void checkService();
}
