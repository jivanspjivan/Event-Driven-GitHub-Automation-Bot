const test = require('node:test');
const assert = require('node:assert/strict');
process.env.DATABASE_URL ||= 'postgresql://test:test@localhost:5432/test';
const { captureAction } = require('../services/webhookService');

test('captures downstream action success and failure without throwing', async () => {
  assert.deepEqual(await captureAction('slack_notification', async () => {}), {
    actionType: 'slack_notification',
    status: 'completed',
  });

  assert.deepEqual(
    await captureAction('slack_notification', async () => {
      throw new Error('Slack unavailable');
    }),
    {
      actionType: 'slack_notification',
      status: 'failed',
      errorMessage: 'Slack unavailable',
    },
  );
});
