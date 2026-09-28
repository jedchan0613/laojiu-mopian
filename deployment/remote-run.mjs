// 通过腾讯云 TAT 在服务器上执行 shell 命令，并等待返回输出。
//
// 用法：node deployment/remote-run.mjs "<shell 命令>"
//
// 为什么需要它：TAT 接口的 Content 字段必须是 base64 编码，返回的 Output 也是 base64，
// 手工拼接既容易出错也难以核对。这里统一处理编码与轮询。
//
// 可覆盖的环境变量：LJM_TCCLI（tccli 完整路径）、LJM_INSTANCE（实例编号）、LJM_REGION（地域）。

import { execFile } from 'node:child_process';

const TCCLI = process.env.LJM_TCCLI ?? 'C:/Users/35171/.workbuddy/binaries/python/envs/default/Scripts/tccli.exe';
const INSTANCE = process.env.LJM_INSTANCE ?? 'lhins-lhm4aokr';
const REGION = process.env.LJM_REGION ?? 'ap-hongkong';

const command = process.argv[2];
if (!command) {
	console.error('用法：node deployment/remote-run.mjs "<shell 命令>"');
	process.exit(1);
}

const call = (args) => new Promise((resolve, reject) => {
	execFile(TCCLI, args, { maxBuffer: 16 * 1024 * 1024 }, (error, stdout, stderr) => {
		if (error) {
			reject(new Error(stderr?.trim() || error.message));
			return;
		}
		resolve(stdout);
	});
});

const content = Buffer.from(command, 'utf8').toString('base64');
const created = JSON.parse(await call([
	'tat', 'RunCommand',
	'--region', REGION,
	'--InstanceIds', JSON.stringify([INSTANCE]),
	'--CommandType', 'SHELL',
	'--Timeout', '300',
	'--Content', content,
]));
console.log(`调用编号：${created.InvocationId}`);

const finished = ['SUCCESS', 'FAILED', 'TIMEOUT', 'PARTIAL_FAILED', 'CANCELLED'];
for (let attempt = 0; attempt < 60; attempt += 1) {
	await new Promise((resolve) => setTimeout(resolve, 1500));
	const listed = JSON.parse(await call([
		'tat', 'DescribeInvocationTasks',
		'--region', REGION,
		'--Filters', JSON.stringify([{ Name: 'invocation-id', Values: [created.InvocationId] }]),
	]));
	const task = listed.InvocationTaskSet?.[0];
	if (!task || !finished.includes(task.TaskStatus)) continue;
	console.log(`状态：${task.TaskStatus}  退出码：${task.TaskResult?.ExitCode ?? '—'}`);
	if (task.ErrorInfo) console.log(`错误信息：${task.ErrorInfo}`);
	process.stdout.write(Buffer.from(task.TaskResult?.Output ?? '', 'base64').toString('utf8'));
	process.exit(task.TaskStatus === 'SUCCESS' ? 0 : 1);
}
console.error('等待执行结果超时，请稍后用 DescribeInvocationTasks 查询。');
process.exit(1);
