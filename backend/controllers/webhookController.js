const { required } = require('../config/env');
const { verifyGitHubSignature } = require('../services/webhookSignatureService');
const { processDelivery } = require('../services/webhookService');
const logger = require('../config/logger');

const receiveGitHubWebhook = async (req, res) => {
  const deliveryId = req.get('X-GitHub-Delivery');
  const eventName = req.get('X-GitHub-Event');
  const signature = req.get('X-Hub-Signature-256');

  if (!deliveryId || !eventName) {
    logger.warn('GitHub webhook rejected: missing headers', {
      hasDeliveryId: Boolean(deliveryId),
      hasEventName: Boolean(eventName),
    });
    return res.status(400).json({ status: 'error', message: 'Missing GitHub webhook headers' });
  }
  logger.info('GitHub webhook received', { deliveryId, eventName });
  if (!verifyGitHubSignature(req.body, signature, required('GITHUB_WEBHOOK_SECRET'))) {
    logger.warn('GitHub webhook rejected: invalid signature', { deliveryId, eventName });
    return res.status(401).json({ status: 'error', message: 'Invalid webhook signature' });
  }

  let payload;
  try {
    payload = JSON.parse(req.body.toString('utf8'));
  } catch {
    logger.warn('GitHub webhook rejected: invalid JSON', { deliveryId, eventName });
    return res.status(400).json({ status: 'error', message: 'Invalid JSON payload' });
  }

  const result = await processDelivery({ deliveryId, eventName, payload });
  logger.info('GitHub webhook processed', {
    deliveryId,
    eventName,
    repositoryId: payload.repository?.id,
    duplicate: result.duplicate,
    matchedRuleCount: result.matchedRuleCount,
    executedActionCount: result.executedActionCount,
    processingStatus: result.status || 'duplicate',
  });
  return res.status(202).json({ status: result.duplicate ? 'duplicate' : result.status, ...result });
};

module.exports = { receiveGitHubWebhook };
