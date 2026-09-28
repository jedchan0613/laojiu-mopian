/*
 * 注册模块阶段一原型 · 共享脚本
 *
 * 边界（重要）：
 * - 本脚本只运行在 /admin/preview/ 隔离原型页中，供本地查看版式与流程。
 * - 全部数据都是前端假数据，保存在本机浏览器的 localStorage 里，不上传、不发送验证码、
 *   不接收真实投稿、不读取任何真实档案或用户资料，也不会进入公开网站构建。
 * - 不调用任何在线接口；「保存草稿」「提交审核」等操作只做界面演示。
 */

(() => {
	'use strict';

	const STORE_KEY = 'ljm-preview-demo-v1';
	const DEFAULT_STATE = {
		signedIn: false,
		nickname: '',
		email: '',
		favoritesRemoved: [],
		draftSavedAt: '',
	};

	const readState = () => {
		try {
			const raw = window.localStorage.getItem(STORE_KEY);
			return raw ? { ...DEFAULT_STATE, ...JSON.parse(raw) } : { ...DEFAULT_STATE };
		} catch {
			return { ...DEFAULT_STATE };
		}
	};

	const writeState = (patch) => {
		const next = { ...readState(), ...patch };
		try {
			window.localStorage.setItem(STORE_KEY, JSON.stringify(next));
		} catch {
			/* 隐私模式下不可写时保持内存内演示 */
		}
		return next;
	};

	const clearState = () => {
		try {
			window.localStorage.removeItem(STORE_KEY);
		} catch {
			/* 忽略 */
		}
	};

	const $ = (selector, root = document) => root.querySelector(selector);
	const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

	const toast = (message) => {
		$$('.pv-toast').forEach((node) => node.remove());
		const node = document.createElement('div');
		node.className = 'pv-toast';
		node.setAttribute('role', 'status');
		node.textContent = message;
		document.body.append(node);
		window.setTimeout(() => node.remove(), 4600);
	};

	const show = (node, visible) => {
		if (node) node.classList.toggle('pv-hidden', !visible);
	};

	// 演示文本再回填到页面时先转义，避免手动输入的引号等字符破坏原型页面结构。
	const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
		'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
	}[char]));

	/* ------------------------------------------------------------------ */
	/* 原型工具条                                                          */
	/* ------------------------------------------------------------------ */

	const renderToolbar = () => {
		const host = $('[data-preview-toolbar]');
		if (!host) return;
		const state = readState();
		host.className = 'pv-toolbar';
		host.setAttribute('role', 'region');
		host.setAttribute('aria-label', '注册模块原型预览工具条');
		host.innerHTML = [
			'<span class="pv-toolbar-tag">注册模块原型 · 阶段一</span>',
			'<span class="pv-toolbar-note">假数据演示：不发送验证码、不接收真实投稿、不进入公开网站</span>',
			`<span class="pv-toolbar-identity">当前演示身份：<strong>${state.signedIn ? `已登录（${state.nickname || '演示用户'}）` : '未登录'}</strong></span>`,
			'<span class="pv-toolbar-actions">',
			`<button type="button" data-pv-toggle-signin>${state.signedIn ? '退出演示登录' : '模拟登录'}</button>`,
			'<button type="button" data-pv-reset>重置演示数据</button>',
			'<a href="/admin/preview/">原型目录</a>',
			'<a href="/admin/">返回档案管理</a>',
			'</span>',
		].join('');
		$('[data-pv-toggle-signin]', host)?.addEventListener('click', () => {
			const current = readState();
			if (current.signedIn) {
				writeState({ signedIn: false });
				toast('已退出演示登录（原型操作，不影响任何真实账号）。');
			} else {
				writeState({
					signedIn: true,
					nickname: current.nickname || '青禾',
					email: current.email || 'qinghe@example.com',
				});
				toast('已切换为演示登录状态（假账号，不含真实信息）。');
			}
			window.location.reload();
		});
		$('[data-pv-reset]', host)?.addEventListener('click', () => {
			clearState();
			toast('演示数据已重置。');
			window.location.reload();
		});
	};

	/* ------------------------------------------------------------------ */
	/* 需要登录的页面：登录门与内容切换                                     */
	/* ------------------------------------------------------------------ */

	const applyNavState = () => {
		const signedIn = readState().signedIn;
		$$('[data-pv-nav-when]').forEach((node) => {
			const when = node.dataset.pvNavWhen;
			show(node, (when === 'in' && signedIn) || (when === 'out' && !signedIn));
		});
	};

	const initGate = () => {
		const gate = $('[data-pv-gate]');
		const content = $('[data-pv-content]');
		if (!gate || !content) return null;
		const apply = () => {
			const signedIn = readState().signedIn;
			show(gate, !signedIn);
			show(content, signedIn);
		};
		$('[data-pv-gate-signin]')?.addEventListener('click', () => {
			const state = readState();
			writeState({
				signedIn: true,
				nickname: state.nickname || '青禾',
				email: state.email || 'qinghe@example.com',
			});
			renderToolbar();
			apply();
			toast('已切换为演示登录状态。');
		});
		apply();
		return apply;
	};

	/* ------------------------------------------------------------------ */
	/* 通用：原型内自定义确认（替代浏览器原生弹窗）                          */
	/* ------------------------------------------------------------------ */

	const initInlineConfirm = () => {
		$$('[data-pv-confirm-toggle]').forEach((button) => {
			button.addEventListener('click', () => {
				const panel = $(`[data-pv-confirm-panel="${button.dataset.pvConfirmToggle}"]`);
				if (panel) show(panel, panel.classList.contains('pv-hidden'));
			});
		});
		$$('[data-pv-confirm-cancel]').forEach((button) => {
			button.addEventListener('click', () => {
				show($(`[data-pv-confirm-panel="${button.dataset.pvConfirmCancel}"]`), false);
			});
		});
		$$('[data-pv-confirm-accept]').forEach((button) => {
			button.addEventListener('click', () => {
				show($(`[data-pv-confirm-panel="${button.dataset.pvConfirmAccept}"]`), false);
				toast(button.dataset.pvConfirmMessage || '原型演示：操作已确认。');
			});
		});
	};

	/* ------------------------------------------------------------------ */
	/* 原型目录页                                                          */
	/* ------------------------------------------------------------------ */

	const initHub = () => {
		const state = readState();
		const identity = $('[data-pv-hub-identity]');
		if (identity) {
			identity.textContent = state.signedIn
				? `当前演示身份：已登录（${state.nickname || '演示用户'}，${state.email || '演示邮箱'}）`
				: '当前演示身份：未登录。可在右上工具条模拟登录，或进入登录页查看完整流程。';
		}
		$('[data-pv-hub-reset]')?.addEventListener('click', () => {
			clearState();
			toast('演示数据已重置。');
			window.location.reload();
		});
	};

	/* ------------------------------------------------------------------ */
	/* 登录 / 注册页                                                       */
	/* ------------------------------------------------------------------ */

	const initLogin = () => {
		const form = $('[data-pv-login-form]');
		if (!form) return;
		const emailInput = $('[data-pv-email]', form);
		const sendButton = $('[data-pv-send]', form);
		const sendResult = $('[data-pv-send-result]');
		const codeInput = $('[data-pv-code]', form);
		const verifyButton = $('[data-pv-verify]', form);
		const errorBox = $('[data-pv-login-error]');
		const onboard = $('[data-pv-onboard]');
		const done = $('[data-pv-login-done]');
		const already = $('[data-pv-already]');
		const agree = $('[data-pv-agree]');
		const onboardError = $('[data-pv-onboard-error]');
		let countdownTimer = null;

		const setError = (message) => {
			if (errorBox) errorBox.textContent = message || '';
		};

		const startCountdown = (seconds = 60) => {
			let remaining = seconds;
			window.clearInterval(countdownTimer);
			sendButton.disabled = true;
			sendButton.textContent = `${remaining} 秒后可重发`;
			countdownTimer = window.setInterval(() => {
				remaining -= 1;
				if (remaining <= 0) {
					window.clearInterval(countdownTimer);
					sendButton.disabled = false;
					sendButton.textContent = '重新获取验证码';
					return;
				}
				sendButton.textContent = `${remaining} 秒后可重发`;
			}, 1000);
		};

		const finishLogin = (message) => {
			const state = readState();
			const nickname = $('[data-pv-nickname]')?.value.trim() || state.nickname || '默片访客 3721';
			writeState({ signedIn: true, nickname, email: emailInput.value.trim() || state.email || 'qinghe@example.com' });
			renderToolbar();
			show(onboard, false);
			show(done, true);
			show(already, true);
			if (message) toast(message);
			done?.scrollIntoView({ block: 'nearest' });
		};

		if (readState().signedIn) {
			show(already, true);
			show(onboard, false);
		}

		form.addEventListener('submit', (event) => {
			event.preventDefault();
			verifyButton.click();
		});

		sendButton.addEventListener('click', () => {
			const email = emailInput.value.trim();
			if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
				setError('请输入可以正常收信的邮箱地址，例如 name@example.com。');
				return;
			}
			setError('');
			if (sendResult) {
				sendResult.textContent = '如果该邮箱可以注册或已注册，验证码已发送。请检查收件箱与垃圾邮件；验证前不会透露该邮箱是否已注册。';
				show(sendResult, true);
			}
			startCountdown(60);
		});

		verifyButton.addEventListener('click', () => {
			const code = codeInput.value.trim();
			if (!/^\d{6}$/.test(code)) {
				setError('请输入 6 位数字验证码。验证码 10 分钟内有效、仅能使用一次。');
				return;
			}
			setError('');
			show(onboard, true);
			show(done, false);
			onboard?.scrollIntoView({ block: 'nearest' });
		});

		$('[data-pv-complete]')?.addEventListener('click', () => {
			if (!agree?.checked) {
				if (onboardError) onboardError.textContent = '请先阅读并主动勾选同意服务与隐私说明，再完成开通。';
				return;
			}
			if (onboardError) onboardError.textContent = '';
			finishLogin('演示：开通完成，已登录。');
		});

		$$('[data-pv-demo]').forEach((button) => {
			button.addEventListener('click', () => {
				const kind = button.dataset.pvDemo;
				if (kind === 'expired') setError('验证码已过期，请重新获取。验证码 10 分钟内有效。');
				if (kind === 'wrong') setError('验证码不正确，还可以尝试 4 次。');
				if (kind === 'too-many') setError('尝试次数过多，请重新获取新的验证码。');
				if (kind === 'rate') setError('发送太频繁，请 60 秒后再试。每个邮箱和来源地址都会单独限流。');
				if (kind === 'mail-down') setError('登录服务暂时不可用：邮件服务未配置或发送失败，请稍后再试。公开浏览不受影响。');
				if (kind === 'registered-login') {
					setError('');
					finishLogin('演示：已注册用户验证成功，直接登录。');
				}
			});
		});
	};

	/* ------------------------------------------------------------------ */
	/* 我的投稿（列表）                                                    */
	/* ------------------------------------------------------------------ */

	const initSubmissions = () => {
		initGate();
		const list = $('[data-pv-list]');
		const emptyView = $('[data-pv-empty]');
		const skeleton = $('[data-pv-skeleton]');
		const pendingNote = $('[data-pv-pending]');
		if (!list || !emptyView) return;

		const applyView = (isEmpty) => {
			show(list, !isEmpty);
			show(emptyView, isEmpty);
			show(pendingNote, !isEmpty);
		};
		applyView(false);

		$('[data-pv-toggle-empty]')?.addEventListener('click', () => {
			const isEmpty = !emptyView.classList.contains('pv-hidden');
			applyView(!isEmpty);
			toast(isEmpty ? '原型演示：已恢复示例投稿列表。' : '原型演示：这里显示空列表状态。');
		});

		$('[data-pv-demo-loading]')?.addEventListener('click', () => {
			const wasEmpty = !emptyView.classList.contains('pv-hidden');
			show(skeleton, true);
			show(list, false);
			show(emptyView, false);
			toast('原型演示：加载中的骨架屏（约 1 秒）。');
			window.setTimeout(() => {
				show(skeleton, false);
				applyView(wasEmpty);
			}, 1200);
		});

		$$('[data-pv-demo-action]').forEach((button) => {
			button.addEventListener('click', () => {
				toast(button.dataset.pvDemoAction || '原型演示操作。');
			});
		});
	};

	/* ------------------------------------------------------------------ */
	/* 投稿详情                                                            */
	/* ------------------------------------------------------------------ */

	const initDetail = () => {
		initGate();
		const views = $$('[data-pv-view]');
		const switchTo = (name) => {
			views.forEach((view) => show(view, view.dataset.pvView === name));
		};
		$$('[data-pv-show-view]').forEach((button) => {
			button.addEventListener('click', () => {
				switchTo(button.dataset.pvShowView);
				toast('原型演示：已切换到「' + button.textContent.trim() + '」场景。');
			});
		});
		const requested = new URLSearchParams(window.location.search).get('view');
		if (requested && views.some((view) => view.dataset.pvView === requested)) switchTo(requested);
		$$('[data-pv-show-hint]').forEach((button) => {
			button.addEventListener('click', () => {
				const target = $(`[data-pv-hint="${button.dataset.pvShowHint}"]`);
				if (target) {
					show(target, target.classList.contains('pv-hidden'));
					toast('原型演示：已切换这条附加提示。');
				}
			});
		});
		$$('[data-pv-demo-action]').forEach((button) => {
			button.addEventListener('click', () => {
				toast(button.dataset.pvDemoAction || '原型演示操作。');
			});
		});
	};

	/* ------------------------------------------------------------------ */
	/* 我的收藏                                                            */
	/* ------------------------------------------------------------------ */

	const initFavorites = () => {
		initGate();
		const grid = $('[data-pv-fav-grid]');
		const empty = $('[data-pv-fav-empty]');
		if (!grid) return;

		const applyState = () => {
			const { favoritesRemoved } = readState();
			const cards = $$('[data-pv-fav-id]', grid);
			cards.forEach((card) => {
				show(card, !favoritesRemoved.includes(card.dataset.pvFavId));
			});
			const anyVisible = cards.some((card) => !card.classList.contains('pv-hidden'));
			show(empty, !anyVisible);
		};

		grid.addEventListener('click', (event) => {
			const button = event.target.closest('[data-pv-fav-remove]');
			if (!button) return;
			const card = button.closest('[data-pv-fav-id]');
			if (!card) return;
			const removed = [...readState().favoritesRemoved, card.dataset.pvFavId];
			writeState({ favoritesRemoved: removed });
			applyState();
			toast('已取消收藏（原型演示，不影响真实数据）。');
		});

		$('[data-pv-fav-restore]')?.addEventListener('click', () => {
			writeState({ favoritesRemoved: [] });
			applyState();
			toast('已恢复示例收藏。');
		});

		$('[data-pv-fav-clear]')?.addEventListener('click', () => {
			const ids = $$('[data-pv-fav-id]', grid).map((card) => card.dataset.pvFavId);
			writeState({ favoritesRemoved: ids });
			applyState();
			toast('原型演示：这里显示空收藏状态。');
		});

		applyState();
	};

	/* ------------------------------------------------------------------ */
	/* 账户设置                                                            */
	/* ------------------------------------------------------------------ */

	const initSettings = () => {
		initGate();
		$('[data-pv-save-nickname]')?.addEventListener('click', () => {
			const input = $('[data-pv-nickname]');
			const value = input?.value.trim() ?? '';
			if (!value) {
				toast('昵称不能为空。');
				return;
			}
			writeState({ nickname: value });
			renderToolbar();
			toast('昵称已保存（原型演示）。修改昵称不会改写已公开内容的署名。');
		});
		$('[data-pv-export]')?.addEventListener('click', () => {
			toast('已收到数据导出申请（原型演示）。正式流程会先验证本人，再提供私密下载方式；「收到申请」不等于「导出完成」。');
		});
		$$('[data-pv-demo-action]').forEach((button) => {
			button.addEventListener('click', () => {
				toast(button.dataset.pvDemoAction || '原型演示操作。');
			});
		});
	};

	/* ------------------------------------------------------------------ */
	/* 上传向导（三步）                                                     */
	/* ------------------------------------------------------------------ */

	const initContribute = () => {
		initGate();
		const wizard = $('[data-pv-wizard]');
		if (!wizard) return;

		const state = {
			step: 1,
			images: [
				{ id: 'demo-1', name: '示例图片 1（照片正面）', size: '1.8 MB', status: 'ready' },
				{ id: 'demo-2', name: '示例图片 2（照片背面）', size: '1.6 MB', status: 'ready' },
				{ id: 'demo-3', name: '示例图片 3（细节）', size: '1.4 MB', status: 'ready' },
			],
			coverIndex: 0,
			nextId: 4,
		};

		const imageList = $('[data-pv-image-list]', wizard);
		const feedback = $('[data-pv-image-feedback]', wizard);
		const totalLine = $('[data-pv-image-total]', wizard);
		const notesHost = $('[data-pv-image-notes]', wizard);

		const setImageFeedback = (message, tone = 'hint') => {
			if (!feedback) return;
			feedback.textContent = message;
			feedback.className = tone === 'error' ? 'pv-error' : 'pv-hint';
		};

		const renderImages = () => {
			if (!imageList) return;
			imageList.innerHTML = state.images.map((image, index) => [
				`<li class="pv-image-row" data-pv-image-index="${index}">`,
				`<div class="pv-thumb pv-thumb-zoom">${index === state.coverIndex ? '<span class="pv-thumb-tag">封面</span>' : ''}<span>示例图 ${index + 1}</span></div>`,
				'<div>',
				`<h4>${escapeHtml(image.name)}</h4>`,
				`<p class="pv-meta">${image.size} · 状态：${image.status === 'failed' ? '上传失败，可单独重试' : image.status === 'metadata-cleaned' ? '已处理（已去除内嵌信息，仅演示）' : '待保存/提交后上传'}</p>`,
				'<div class="pv-row-actions">',
				`<button type="button" class="pv-btn pv-btn--small" data-pv-image-action="up" data-index="${index}" ${index === 0 ? 'disabled' : ''}>上移</button>`,
				`<button type="button" class="pv-btn pv-btn--small" data-pv-image-action="down" data-index="${index}" ${index === state.images.length - 1 ? 'disabled' : ''}>下移</button>`,
				`<button type="button" class="pv-btn pv-btn--small" data-pv-image-action="cover" data-index="${index}" ${index === state.coverIndex ? 'disabled' : ''}>设为封面</button>`,
				image.status === 'failed'
					? `<button type="button" class="pv-btn pv-btn--small" data-pv-image-action="retry" data-index="${index}">重试这张</button>`
					: '',
				`<button type="button" class="pv-btn pv-btn--small" data-pv-image-action="remove" data-index="${index}">移除</button>`,
				'</div>',
				'</div>',
				'</li>',
			].join(''));
			if (totalLine) {
				totalLine.textContent = state.images.length
					? `共 ${state.images.length} 张（最多 8 张）· 每张不超过 5 MB、合计不超过 20 MB · 封面为「${state.images[state.coverIndex]?.name ?? '未设置'}」`
					: '尚未选择图片。';
			}
			if (notesHost) {
				notesHost.innerHTML = state.images.map((image, index) => [
					'<div class="pv-field">',
					`<label for="pv-note-${index}">示例图片 ${index + 1} 的说明（选填）</label>`,
					`<input id="pv-note-${index}" data-pv-image-note="${index}" maxlength="120" placeholder="例如：正面；背面留言；细节" value="${escapeHtml(image.note ?? '')}" />`,
					'</div>',
				].join(''));
			}
		};

		imageList?.addEventListener('click', (event) => {
			const button = event.target.closest('[data-pv-image-action]');
			if (!button) return;
			const index = Number(button.dataset.index);
			const action = button.dataset.pvImageAction;
			if (action === 'up' && index > 0) {
				[state.images[index - 1], state.images[index]] = [state.images[index], state.images[index - 1]];
				if (state.coverIndex === index) state.coverIndex = index - 1;
				else if (state.coverIndex === index - 1) state.coverIndex = index;
			}
			if (action === 'down' && index < state.images.length - 1) {
				[state.images[index + 1], state.images[index]] = [state.images[index], state.images[index + 1]];
				if (state.coverIndex === index) state.coverIndex = index + 1;
				else if (state.coverIndex === index + 1) state.coverIndex = index;
			}
			if (action === 'cover') state.coverIndex = index;
			if (action === 'remove') {
				state.images.splice(index, 1);
				if (state.coverIndex >= state.images.length) state.coverIndex = Math.max(0, state.images.length - 1);
				setImageFeedback('原型演示：图片只从本次预览列表移除；正式实施时，已经保存的图片不会被永久删除，而是进入私密回收流程。');
			}
			if (action === 'retry') {
				state.images[index].status = 'ready';
				setImageFeedback('原型演示：这一张已重新上传成功。');
			}
			renderImages();
		});

		notesHost?.addEventListener('input', (event) => {
			const input = event.target.closest('[data-pv-image-note]');
			if (!input) return;
			const index = Number(input.dataset.pvImageNote);
			if (state.images[index]) state.images[index].note = input.value;
		});

		$('[data-pv-add-image]')?.addEventListener('click', () => {
			if (state.images.length >= 8) {
				setImageFeedback('一次最多 8 张。请先移除不需要的图片，或分成两次投稿。', 'error');
				return;
			}
			state.images.push({ id: `demo-${state.nextId}`, name: `示例图片 ${state.nextId}（模拟添加）`, size: '1.5 MB', status: 'ready' });
			state.nextId += 1;
			setImageFeedback('已添加一张示例图片（原型演示，不会读取你电脑上的真实文件）。');
			renderImages();
			renderPreview();
		});

		const demoMessages = {
			format: ['不支持 TIFF / RAW 等原始格式，请提交 JPG、PNG 或 WebP 的筛选副本。SVG、PDF、压缩包、动画和多页图片也不接收。', 'error'],
			size: ['「示例图片 大图.jpg」为 6.2 MB，超过单张 5 MB 的限制，请压缩后重试。', 'error'],
			total: ['本次选择的图片合计约 21.4 MB，超过单件 20 MB 的限制。请减少数量或压缩后再试。', 'error'],
			duplicate: ['「示例图片 2」与已选中的「示例图片 1」内容相同，请确认是否重复提交。', 'error'],
			nine: ['一次最多选择 8 张，本次选择了 9 张。请分两次投稿，或先移除多余图片。', 'error'],
			partial: ['原型演示：其中 1 张上传失败，其余图片已成功保存到草稿；失败的图片可以单独重试。', 'hint'],
			cleaned: ['原型演示：示例图片已去除 EXIF/GPS 等内嵌信息并重新编码（正式实施时由服务端完成）；图片上的文字和人物隐私仍需人工检查。', 'hint'],
		};

		$$('[data-pv-image-demo]', wizard).forEach((button) => {
			button.addEventListener('click', () => {
				const message = demoMessages[button.dataset.pvImageDemo];
				if (!message) return;
				setImageFeedback(message[0], message[1]);
				if (button.dataset.pvImageDemo === 'partial') {
					const failed = state.images.find((image) => image.status !== 'failed');
					if (failed) failed.status = 'failed';
					renderImages();
				}
				if (button.dataset.pvImageDemo === 'cleaned') {
					state.images.forEach((image) => { image.status = 'metadata-cleaned'; });
					renderImages();
				}
			});
		});

		/* 步骤切换与校验 */

		const stepButtons = $$('[data-pv-step-target]', wizard);
		const panels = $$('[data-pv-step]', wizard);
		const gotoStep = (step, options = {}) => {
			state.step = step;
			panels.forEach((panel) => show(panel, Number(panel.dataset.pvStep) === step));
			stepButtons.forEach((button) => {
				const active = Number(button.dataset.pvStepTarget) === step;
				button.setAttribute('aria-current', active ? 'step' : 'false');
			});
			show($('[data-pv-stepnav]', wizard), step !== 3);
			if (step === 3) renderPreview();
			if (options.scroll !== false) wizard.scrollIntoView({ block: 'start' });
		};

		stepButtons.forEach((button) => {
			button.addEventListener('click', () => gotoStep(Number(button.dataset.pvStepTarget)));
		});

		$('[data-pv-back]', wizard)?.addEventListener('click', () => gotoStep(Math.max(1, state.step - 1)));
		$('[data-pv-next]', wizard)?.addEventListener('click', () => {
			if (state.step === 1 && state.images.length === 0) {
				setImageFeedback('请先选择 1–8 张图片（原型中可点击「模拟添加一张示例图片」）。', 'error');
				return;
			}
			gotoStep(Math.min(3, state.step + 1));
		});

		/* 第二步字段 */

		const titleInput = $('[data-pv-title]', wizard);
		const descInput = $('[data-pv-description]', wizard);
		$('[data-pv-title-count]') && titleInput?.addEventListener('input', () => {
			$('[data-pv-title-count]').textContent = `${titleInput.value.length} / 60`;
		});
		$('[data-pv-desc-count]') && descInput?.addEventListener('input', () => {
			$('[data-pv-desc-count]').textContent = `${descInput.value.length} / 2000`;
		});
		$('[data-pv-era-unknown]')?.addEventListener('change', (event) => {
			const era = $('[data-pv-era]', wizard);
			if (event.target.checked && era) {
				era.value = '年代未知';
			} else if (era && era.value === '年代未知') {
				era.value = '';
			}
		});
		$$('[data-pv-credit-anonymous], [data-pv-credit-named]', wizard).forEach((radio) => {
			radio.addEventListener('change', () => {
				show($('[data-pv-credit-field]', wizard), $('[data-pv-credit-named]', wizard)?.checked === true);
			});
		});

		const setFieldError = (key, message) => {
			const field = $(`[data-pv-field="${key}"]`, wizard);
			if (field) {
				field.dataset.invalid = message ? 'true' : 'false';
				const box = $('.pv-error', field);
				if (box) box.textContent = message || '';
			}
		};

		const validateForSubmit = () => {
			let ok = true;
			const title = titleInput?.value.trim() ?? '';
			setFieldError('title', title ? '' : '请填写题名，建议不超过 60 字。');
			if (!title) ok = false;
			const category = $('[data-pv-category]', wizard)?.value ?? '';
			setFieldError('category', category ? '' : '请选择藏品分类。');
			if (!category) ok = false;
			const description = descInput?.value.trim() ?? '';
			setFieldError('description', description ? '' : '请填写资料介绍，建议不超过 2000 字。');
			if (!description) ok = false;
			// 大致年代为选填；不知道时可以勾选「年代未知」，这里不产生错误。
			setFieldError('era', '');
			const source = $('[data-pv-source]', wizard)?.value.trim() ?? '';
			setFieldError('source', source ? '' : '请填写来源与展示授权依据；不确定时请如实说明，站主会人工核实。');
			if (!source) ok = false;
			const people = $('input[name="pv-people"]:checked', wizard)?.value ?? '';
			setFieldError('people', people ? '' : '请选择是否可以识别真实人物。');
			if (!people) ok = false;
			const creditOk = $('[data-pv-credit-anonymous]', wizard)?.checked ||
				!$('[data-pv-credit-named]', wizard)?.checked ||
				($('[data-pv-credit]', wizard)?.value.trim() ?? '') !== '';
			setFieldError('credit', creditOk ? '' : '选择「指定署名」时请填写希望公开的署名。');
			if (!creditOk) ok = false;
			return ok;
		};

		/* 第三步预览 */

		const renderPreview = () => {
			const publicHost = $('[data-pv-preview-public]', wizard);
			const adminHost = $('[data-pv-preview-admin]', wizard);
			if (!publicHost || !adminHost) return;
			const title = titleInput?.value.trim() || '（未填写）';
			const category = $('[data-pv-category]', wizard)?.value || '（未选择）';
			const era = $('[data-pv-era]', wizard)?.value.trim() || '（未填写，可选）';
			const place = $('[data-pv-place]', wizard)?.value.trim() || '（未填写，可选）';
			const description = descInput?.value.trim() || '（未填写）';
			const credit = $('[data-pv-credit-named]', wizard)?.checked
				? ($('[data-pv-credit]', wizard)?.value.trim() || '（未填写署名）')
				: '匿名投稿';
			const source = $('[data-pv-source]', wizard)?.value.trim() || '（未填写）';
			const peopleValue = $('input[name="pv-people"]:checked', wizard)?.value ?? '';
			const peopleLabel = { none: '没有可识别的真实人物', yes: '有，需要人工确认', unsure: '不确定，请协助判断' }[peopleValue] || '（未选择）';
			publicHost.innerHTML = [
				'<div class="pv-preview-block">',
				'<h3>将公开的内容</h3>',
				'<ul class="pv-preview-images">',
				state.images.map((image, index) => `<li class="pv-thumb">${index === state.coverIndex ? '<span class="pv-thumb-tag">封面</span>' : ''}<span>示例图 ${index + 1}</span></li>`).join(''),
				'</ul>',
				'<dl>',
				`<dt>题名</dt><dd>${escapeHtml(title)}</dd>`,
				`<dt>藏品分类</dt><dd>${escapeHtml(category)}</dd>`,
				`<dt>大致年代</dt><dd>${escapeHtml(era)}</dd>`,
				`<dt>大致地点</dt><dd>${escapeHtml(place)}</dd>`,
				`<dt>资料介绍</dt><dd>${escapeHtml(description)}</dd>`,
				`<dt>公开署名</dt><dd>${escapeHtml(credit)}</dd>`,
				'</dl>',
				'<p class="pv-hint">以上内容在正式发布前仍会由站主逐项整理和核对；图片上的文字与人物隐私由人工检查，不依赖自动识别。</p>',
				'</div>',
			].join('');
			adminHost.innerHTML = [
				'<div class="pv-preview-block">',
				'<h3>仅站主可见</h3>',
				'<dl>',
				`<dt>来源与授权依据</dt><dd>${escapeHtml(source)}</dd>`,
				`<dt>可识别真实人物情况</dt><dd>${escapeHtml(peopleLabel)}</dd>`,
				`<dt>账号联系邮箱</dt><dd>${escapeHtml(readState().email || '（演示邮箱，不进入公开字段）')}</dd>`,
				`<dt>图片说明</dt><dd>${state.images.map((image, index) => `示例图 ${index + 1}：${escapeHtml(image.note?.trim() || '（未填写）')}`).join('；')}</dd>`,
				'</dl>',
				'<p class="pv-hint">联系方式、来源说明和人工核实过程不进入公开字段；用户勾选的确认项不能代替站主的人工隐私检查。</p>',
				'</div>',
			].join('');
		};

		/* 保存与提交演示 */

		const resultBox = $('[data-pv-submit-feedback]', wizard);
		const success = $('[data-pv-success]', wizard);

		const setResult = (message, tone = 'hint') => {
			if (!resultBox) return;
			resultBox.textContent = message;
			resultBox.className = tone === 'error' ? 'pv-error' : 'pv-hint';
		};

		$('[data-pv-save-draft]')?.addEventListener('click', () => {
			const title = titleInput?.value.trim() ?? '';
			if (!title) {
				setFieldError('title', '请先填写题名，再保存草稿。');
				setResult('草稿尚未保存。已填写的内容仍保留在页面中。', 'error');
				gotoStep(2);
				return;
			}
			const stamp = new Date().toLocaleString('zh-CN', { hour12: false });
			writeState({ draftSavedAt: stamp });
			setResult(`草稿已保存（${stamp}）。保存成功的内容可以在其他设备登录后继续；未保存的修改仍只在本页面中。`);
			toast('原型演示：草稿已保存。');
		});

		$('[data-pv-submit]')?.addEventListener('click', () => {
			const confirmations = $$('[data-pv-confirm]', wizard);
			if (confirmations.some((box) => !box.checked)) {
				setResult('请先逐项阅读并勾选三个确认项；这些确认只代表你的投稿声明，正式公开前仍会人工检查。', 'error');
				return;
			}
			if (!validateForSubmit()) {
				setResult('还有必填内容需要完善，请返回第二步查看标出的字段。', 'error');
				gotoStep(2);
				return;
			}
			setResult('');
			show(success, true);
			success?.scrollIntoView({ block: 'nearest' });
			toast('原型演示：已提交审核（不会真的收到投稿）。');
		});

		$('[data-pv-success-close]')?.addEventListener('click', () => {
			show(success, false);
		});

		$$('[data-pv-submit-demo]', wizard).forEach((button) => {
			button.addEventListener('click', () => {
				const kind = button.dataset.pvSubmitDemo;
				if (kind === 'save-fail') setResult('保存没有成功：连接中断或服务暂不可用。请勿关闭页面，稍后重试；失败时不会显示「已保存」。', 'error');
				if (kind === 'quota') setResult('账号配额已满：当前草稿与未公开资料共占用 196 MB / 200 MB。可以先提交已有草稿，或清理不再需要的草稿（清理会先进入私密回收流程，不会永久删除图片）。', 'error');
				if (kind === 'session') setResult('登录状态已过期，请重新登录后再保存或提交。你填写的内容仍保留在本页面。', 'error');
				if (kind === 'maintenance') setResult('服务维护中：暂时无法保存或提交，公开浏览不受影响。请稍后再试，不要把失败当作提交成功。', 'error');
				if (kind === 'leave') setResult('原型演示：正式实施时，离开页面前会提醒「还有未保存的内容」。未保存的文字与图片选择不会长期保存在浏览器里，保存草稿后才跨设备可见。');
				if (kind === 'duplicate') setResult('原型演示：重复点击「提交审核」不会生成第二份投稿；网络超时后的重试会先核对是否已收到，再决定是否重发。');
			});
		});

		renderImages();
		gotoStep(1, { scroll: false });
	};

	/* ------------------------------------------------------------------ */
	/* 启动                                                                */
	/* ------------------------------------------------------------------ */

	const pages = {
		hub: initHub,
		login: initLogin,
		submissions: initSubmissions,
		detail: initDetail,
		favorites: initFavorites,
		settings: initSettings,
		contribute: initContribute,
	};

	document.addEventListener('DOMContentLoaded', () => {
		applyNavState();
		renderToolbar();
		initInlineConfirm();
		const page = document.body.dataset.previewPage;
		if (page && pages[page]) pages[page]();
	});
})();