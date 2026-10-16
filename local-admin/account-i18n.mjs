import {fixedText} from '../shared/fixed-text.mjs';
import {normalizeLocale} from '../shared/locale-config.mjs';
import {thaiText} from '../shared/thai-text.mjs';
// Locale changes presentation only. No state code, permissions or personal text is changed.
export const normalizeAccountLanguage = value => normalizeLocale(value);
const labels = {
  '正常': 'Active', '已暂停': 'Suspended', '注销处理中': 'Deletion in progress',
  '数据导出申请': 'Data export request', '账号注销申请': 'Account deletion request', '账号恢复申诉': 'Account reinstatement appeal',
  '已收到申请': 'Request received', '处理中': 'In progress', '已完成': 'Completed', '未通过': 'Declined',
  '草稿': 'Draft', '待审核': 'Awaiting review', '待补充': 'More information needed', '初审通过': 'Initial review approved', '整理中': 'In preparation', '暂不采用': 'Not selected', '已撤回': 'Withdrawn', '已停止处理': 'Processing stopped',
};
const errors = {
  '请输入正确的邮箱地址。': 'Enter a valid email address.', '请输入正确的新邮箱地址。': 'Enter a valid new email address.',
  '登录状态已过期，请重新登录。': 'Your sign-in has expired. Sign in again.',
  '登录服务暂时不可用，邮件通道尚未配置完成。': 'Sign-in is temporarily unavailable because email delivery is not configured.',
  '验证码暂时无法发送，请稍后再试。': 'Your code cannot be sent right now. Try again later.',
  '验证码不正确或已失效，请重新获取。': 'The code is incorrect or no longer valid. Request a new code.',
  '验证码已使用，请重新获取。': 'This code has already been used. Request a new code.',
  '验证码已过期，请重新获取。': 'This code has expired. Request a new code.',
  '验证码尝试次数过多，请重新获取。': 'Too many code attempts. Request a new code.',
  '请输入收到的验证码。': 'Enter the code you received.',
  '本次验证已失效，请重新开始。': 'This verification is no longer valid. Start again.',
  '本次验证已超时，请重新开始。': 'This verification has timed out. Start again.',
  '昵称不能包含特殊符号。': 'Your nickname cannot contain special characters.',
  '该邮箱请求验证码过于频繁，请稍后再试。': 'Too many code requests for this email. Try again later.',
  '当前网络请求验证码过于频繁，请稍后再试。': 'Too many code requests from this network. Try again later.',
  '今日邮件额度已用完，请稍后再试。': 'The daily email limit has been reached. Try again later.',
  '该账号已暂停使用。你可以通过联系入口申请恢复或申请数据导出与注销。': 'This account is suspended. Contact the curator to request reinstatement, data export or deletion.',
  '该账号正在处理注销，暂时无法登录。如需帮助，请通过联系入口告知站主。': 'Account deletion is in progress and sign-in is unavailable. Contact the curator if you need help.',
  '请先阅读并主动同意服务与隐私说明。': 'Read and actively agree to the service and privacy terms.',
  '协议版本已更新，请刷新页面后重新阅读。': 'The terms have changed. Refresh the page and read them again.',
  '该邮箱已经开通账号，请直接登录。': 'An account already exists for this email. Sign in instead.',
  '不支持这种语言。': 'This language is not supported.',
  '新邮箱与当前邮箱相同，不需要更换。': 'The new email is the same as your current email.',
  '该邮箱已经绑定其他账号，请更换另一个邮箱。': 'This email is linked to another account. Use a different email.',
  '账号邮箱已变化，请重新开始更换流程。': 'The account email has changed. Start the email change again.',
  '档案编号格式不正确。': 'The record ID format is invalid.',
  '不支持这种申请类型。': 'This request type is not supported.',
  '为了账号安全，请先退出并重新登录，然后再提交这类申请。': 'For account security, sign out and sign in again before submitting this request.',
  '今天提交的申请过多，请稍后再试。': 'Too many requests today. Try again later.',
  '提交内容过大。': 'The submitted content is too large.', '提交格式无效。': 'The submission format is invalid.',
  '提交内容必须是有效表单。': 'Submit a valid form.', '提交内容无法读取。': 'The submitted content could not be read.',
  '已阻止来自其他网页的请求。': 'A request from another website was blocked.',
  '缺少来源信息，请从网站页面重试。': 'The request source is missing. Try again from the website.',
  '请求标记无效。': 'The request marker is invalid.', '无法确认请求来源。': 'The request source could not be verified.',
  '当前访问过于频繁，请稍后再试。': 'Too many requests. Try again later.',
  '图片清单或说明格式无效，请刷新后重试。': 'The image list or descriptions are invalid. Refresh and try again.',
  '投稿功能暂不可用。': 'Submissions are temporarily unavailable.', '不支持此操作。': 'This action is not supported.',
  '新账号开通暂时关闭，已有账号仍可登录。': 'Registration is temporarily closed. Existing accounts can still sign in.',
  '新投稿暂时暂停接收，已有投稿仍可查看和撤回。': 'New submissions are paused. Existing submissions can still be viewed and withdrawn.',
  '投稿编辑暂时暂停，已保存的内容仍可查看。': 'Submission editing is paused. Saved content can still be viewed.',
  '缺少原有图片清单，请刷新后重试。': 'The existing image list is missing. Refresh and try again.',
  '提交审核暂时暂停，草稿仍会保存。': 'Review submissions are paused. Your draft will still be saved.',
  '此地址不存在。': 'This address does not exist.',
};
export const localizeAccountError = (text, locale, status = 400) => {
  if (normalizeAccountLanguage(locale) === 'zh-CN' || typeof text !== 'string') return text;
  if(['ja','ko','zh-Hant'].includes(normalizeLocale(locale)))return fixedText(localizeAccountError(text,'en',status),locale,text);
  if (locale==='th') { const english=localizeAccountError(text,'en',status); return thaiText(english) !== english ? thaiText(english) : !/[\u3400-\u9fff]/.test(text) && !errors[text] ? text : 'ดำเนินการไม่สำเร็จ โปรดตรวจสอบข้อมูลแล้วลองอีกครั้ง'; }
  if (errors[text]) return errors[text];
  const rules = [
    [/^操作太频繁，请在 (\d+) 秒后再试。$/, n => `Too many requests. Try again in ${n} seconds.`],
    [/^请等待 (\d+) 秒后再重新发送验证码。$/, n => `Wait ${n} seconds before requesting another code.`],
    [/^验证码不正确，还可以尝试 (\d+) 次。$/, n => `Incorrect code. ${n} attempts remain.`],
    [/^昵称请控制在 (\d+) 字以内。$/, n => `Keep your nickname within ${n} characters.`],
    [/^收藏数量已达上限（(\d+) 件），请先取消部分收藏。$/, n => `The limit of ${n} favorites has been reached. Remove some favorites first.`],
  ];
  for (const [pattern, format] of rules) { const match = text.match(pattern); if (match) return format(match[1]); }
  if (!/[\u3400-\u9fff]/.test(text)) return text;
  return status === 401 ? 'Please sign in again.' : status === 403 ? 'This action is not permitted. Check your account and try again.' : status === 429 ? 'Too many requests. Please try again later.' : status >= 500 ? 'The service is temporarily unavailable. Please try again later.' : 'The request could not be completed. Check the form and try again.';
};
export const localizeAccountPayload = (value, locale, status = 200) => {
  if (normalizeAccountLanguage(locale) === 'zh-CN' || !value || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(entry => localizeAccountPayload(entry, locale, status));
  return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key,
    key === 'error' ? localizeAccountError(entry, locale, status)
      : ['status_label', 'kind_label'].includes(key) ? fixedText(labels[entry] ?? entry,locale,entry)
      : entry && typeof entry === 'object' ? localizeAccountPayload(entry, locale, status) : entry,
  ]));
};
