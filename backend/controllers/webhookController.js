const { required } = require('../config/env');
const { verifyGitHubSignature } = require('../services/webhookSignatureService');
const { processDelivery } = require('../services/webhookService');

const receiveGitHubWebhook = async (req, res) => {
  const deliveryId = req.get('X-GitHub-Delivery');
  const eventName = req.get('X-GitHub-Event');
  const signature = req.get('X-Hub-Signature-256');

  if (!deliveryId || !eventName) {
    return res.status(400).json({ status: 'error', message: 'Missing GitHub webhook headers' });
  }
  if (!verifyGitHubSignature(req.body, signature, required('GITHUB_WEBHOOK_SECRET'))) {
    return res.status(401).json({ status: 'error', message: 'Invalid webhook signature' });
  }

  let payload;
  try {
    payload = JSON.parse(req.body.toString('utf8'));
  } catch {
    return res.status(400).json({ status: 'error', message: 'Invalid JSON payload' });
  }

  const result = await processDelivery({ deliveryId, eventName, payload });
  return res.status(202).json({ status: result.duplicate ? 'duplicate' : result.status, ...result });
};

module.exports = { receiveGitHubWebhook };
