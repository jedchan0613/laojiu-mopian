import test from 'node:test';
import assert from 'node:assert/strict';
import { collectVisibleHan } from '../../shared/public-build-text.mjs';

test('逐页字形检查保留生僻字，忽略脚本样式并去重大量重复正文', () => {
	const characters = collectVisibleHan('<p>正文龘𠀀</p><script>私密脚本</script><style>隐藏</style>');
	collectVisibleHan('正文'.repeat(200000), characters);
	assert.deepEqual([...characters].sort(), [...'正文龘𠀀'].sort());
});
