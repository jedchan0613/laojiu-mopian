// 登录 / 开通页面交互：请求验证码 → 校验 → 首次开通或直接登录。
// 所有判断以服务端返回为准；页面只负责展示状态，不自行推断邮箱是否已注册。

import { accountFetch, setStatus, toggle } from './account-client';

const form = document.querySelector<HTMLFormElement>('#login-form');
const emailInput = document.querySelector<HTMLInputElement>('#login-email');
const codeStep = document.querySelector<HTMLElement>('#login-code-step');
const codeInput = document.querySelector<HTMLInputElement>('#login-code');
const requestButton = document.querySelector<HTMLButtonElement>('#login-request');
const verifyButton = document.querySelector<HTMLButtonElement>('#login-verify');
const resendButton = document.querySelector<HTMLButtonElement>('#login-resend');
const onboarding = document.querySelector<HTMLElement>('#login-onboarding');
const nicknameInput = document.querySelector<HTMLInputElement>('#login-nickname');
const agreementInput = document.querySelector<HTMLInputElement>('#login-agreement');
const completeButton = document.querySelector<HTMLButtonElement>('#login-complete');
const serviceNote = document.querySelector('#login-service');
const status = document.querySelector('#login-status');

const nextPath = (() => {
	const requested = new URLSearchParams(window.location.search).get('next') ?? '';
	// 浏览器会把 /\example.com 解释成外站地址；必须用 URL 的实际来源再次确认。
	if (requested.startsWith('/') && !requested.startsWith('//') && !requested.includes('\\')) {
		try {
			const target = new URL(requested, window.location.origin);
			if (target.origin === window.location.origin) return `${target.pathname}${target.search}${target.hash}`;
		} catch { /* 无效地址回到用户中心。 */ }
	}
	return '/me/contributions/';
})();

let ticket = '';
let onboardingTicket = '';
let agreementVersion = '';
let registrationOpen = true;
let countdown = 0;
let timer = 0;

const busy = (button: HTMLButtonElement | null, value: boolean, label?: string) => {
	if (!button) return;
	button.disabled = value;
	if (label) button.textContent = label;
};

const startCountdown = (seconds: number) => {
	countdown = Math.max(0, Math.floor(seconds));
	window.clearInterval(timer);
	const tick = () => {
		if (!resendButton) return;
		if (countdown <= 0) {
			window.clearInterval(timer);
			resendButton.disabled = false;
			resendButton.textContent = '重新发送';
			return;
		}
		resendButton.disabled = true;
		resendButton.textContent = `重新发送（${countdown}）`;
		countdown -= 1;
	};
	tick();
	timer = window.setInterval(tick, 1000);
};

const requestCode = async () => {
	const email = emailInput?.value.trim() ?? '';
	if (!email) {
		setStatus(status, '请先填写邮箱。', 'error');
		emailInput?.focus();
		return;
	}
	busy(requestButton, true, '正在发送…');
	setStatus(status, '正在发送验证码，请稍候…');
	try {
		const result = await accountFetch('/api/account/code', { method: 'POST', body: { email } });
		ticket = String(result.ticket ?? '');
		toggle(codeStep, true);
		setStatus(status, `验证码已发送到 ${email}。如果没有收到，请查看垃圾邮件。`, 'ok');
		startCountdown(Number(result.retry_after ?? 60));
		codeInput?.focus();
	} catch (error) {
		setStatus(status, error instanceof Error ? error.message : '暂时无法发送验证码。', 'error');
	} finally {
		busy(requestButton, false, '获取验证码');
	}
};

const verifyCode = async () => {
	const code = codeInput?.value.trim() ?? '';
	if (!/^[0-9]{6}$/.test(code)) {
		setStatus(status, '请输入邮件中收到的 6 位数字验证码。', 'error');
		codeInput?.focus();
		return;
	}
	busy(verifyButton, true, '正在验证…');
	setStatus(status, '正在验证…');
	try {
		const result = await accountFetch('/api/account/verify', {
			method: 'POST',
			body: { email: emailInput?.value.trim() ?? '', ticket, code },
		});
		if (result.state === 'signed_in') {
			setStatus(status, '登录成功，正在进入用户中心…', 'ok');
			window.location.assign(nextPath);
			return;
		}
		onboardingTicket = String(result.onboarding_ticket ?? '');
		if (!registrationOpen) {
			setStatus(status, '邮箱已验证，但新账号开通暂时关闭。已有账号仍可登录。', 'error');
			return;
		}
		agreementVersion = agreementVersion || '';
		toggle(onboarding, true);
		window.clearInterval(timer);
		setStatus(status, '验证通过。这是第一次使用，请阅读说明并完成开通。', 'ok');
		nicknameInput?.focus();
	} catch (error) {
		setStatus(status, error instanceof Error ? error.message : '验证没有通过。', 'error');
	} finally {
		busy(verifyButton, false, '验证并继续');
	}
};

const completeOnboarding = async () => {
	if (!agreementInput?.checked) {
		setStatus(status, '请先阅读并主动勾选同意，才能完成开通。', 'error');
		agreementInput?.focus();
		return;
	}
	if (!agreementVersion) {
		setStatus(status, '页面信息已过期，请重新获取验证码。', 'error');
		return;
	}
	busy(completeButton, true, '正在开通…');
	setStatus(status, '正在开通账号…');
	try {
		await accountFetch('/api/account/onboarding', {
			method: 'POST',
			body: {
				onboarding_ticket: onboardingTicket,
				agreement_version: agreementVersion,
				agreed: true,
				nickname: nicknameInput?.value.trim() ?? '',
			},
		});
		setStatus(status, '账号已开通，正在进入用户中心…', 'ok');
		window.location.assign(nextPath);
	} catch (error) {
		setStatus(status, error instanceof Error ? error.message : '开通没有完成。', 'error');
	} finally {
		busy(completeButton, false, '完成开通');
	}
};

const loadConfiguration = async () => {
	try {
		const config = await accountFetch('/api/account/config');
		agreementVersion = String(config.agreement_version ?? '');
		registrationOpen = config.registration_open !== false;
		if (!config.available) {
			serviceNote?.setAttribute('data-unavailable', '1');
			setStatus(serviceNote, '登录服务暂时不可用：邮件通道尚未配置完成。你仍然可以浏览公开档案，稍后再试。', 'error');
			busy(requestButton, true, '暂时不可用');
			return;
		}
		setStatus(serviceNote, registrationOpen ? '登录通道正常。验证前不会透露邮箱是否已经注册。' : '已有账号可以登录；新账号开通暂时关闭。', 'ok');
	} catch {
		setStatus(serviceNote, '无法连接登录服务，请稍后再试。', 'error');
		busy(requestButton, true, '暂时不可用');
	}
};

form?.addEventListener('submit', (event) => {
	event.preventDefault();
	void requestCode();
});
verifyButton?.addEventListener('click', () => void verifyCode());
resendButton?.addEventListener('click', () => void requestCode());
completeButton?.addEventListener('click', () => void completeOnboarding());
codeInput?.addEventListener('keydown', (event) => {
	if (event.key === 'Enter') {
		event.preventDefault();
		void verifyCode();
	}
});
emailInput?.addEventListener('input', () => {
	// 邮箱改动后旧验证码不再适用，收起验证码步骤，避免误用。
	toggle(codeStep, false);
	window.clearInterval(timer);
	busy(resendButton, false, '重新发送');
	ticket = '';
});

void loadConfiguration();

export {};
