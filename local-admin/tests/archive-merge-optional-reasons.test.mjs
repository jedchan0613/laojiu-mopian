import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { executionFixture } from './helpers/merge-execution-fixture.mjs';
import { actor, operation } from './helpers/merge-fixture.mjs';

test('空依据及非推荐主件空理由可进入审核；旧理由诊断不阻断，其他缺项和13项仍阻断', async t => {
  const f = await executionFixture(t), ids = [...f.ids].reverse();
  const pf = await f.planner.preflight(ids, actor), payload = f.payload(pf);
  payload.primaryId = ids[0]; payload.secondaryId = ids[1]; payload.sourceReason = ''; payload.primaryReason = '';
  assert.notEqual(payload.primaryId, pf.recommendedPrimary);
  const plan = await f.planner.save(payload, actor, operation());
  assert.deepEqual(plan.unresolved, []);
  const file = path.join(f.directory, 'plans', plan.planId + '.json');
  const legacy = { ...plan, unresolved: [
    { path: 'sourceReason', message: '请补充同一件/同一套的具体依据。' },
    { path: 'primaryReason', message: '请说明人工选择主档案的理由。' },
  ] };
  const oldBytes = JSON.stringify(legacy); await fs.writeFile(file, oldBytes);
  const review = await f.engine.review({ planId: plan.planId, planRevision: plan.planRevision }, actor);
  assert.ok(review.reviewId); assert.equal(await fs.readFile(file, 'utf8'), oldBytes);
  await assert.rejects(f.engine.execute({ planId: plan.planId, planRevision: plan.planRevision,
    reviewId: review.reviewId, confirmPrimaryId: ids[0], confirmations: Array(13).fill(false),
    publicationAuthorization: { publishMergedPrimary: true, withdrawSecondary: true },
  }, actor, operation()), { code: 'MERGE_CONFIRMATION_REQUIRED' });
  legacy.unresolved.push({ path: 'core.title', message: '题名尚未明确选择。' });
  await fs.writeFile(file, JSON.stringify(legacy));
  await assert.rejects(f.engine.review({ planId: plan.planId, planRevision: plan.planRevision }, actor), { code: 'MERGE_PLAN_INCOMPLETE' });
});
