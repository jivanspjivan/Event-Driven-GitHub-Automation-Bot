const automationRuleService = require('../services/automationRuleService');

const SUPPORTED_EVENTS = new Set(['push', 'pull_request', 'issues']);

const parseRuleId = (value) => {
  const ruleId = Number(value);
  if (!Number.isSafeInteger(ruleId) || ruleId <= 0) {
    const error = new Error('A valid automation rule ID is required');
    error.statusCode = 400;
    throw error;
  }
  return ruleId;
};

const validateConfiguration = (configuration) => {
  if (configuration === undefined) return {};
  if (!configuration || Array.isArray(configuration) || typeof configuration !== 'object') {
    const error = new Error('configuration must be a JSON object');
    error.statusCode = 400;
    throw error;
  }
  return configuration;
};

const getRules = async (req, res) => {
  const rules = await automationRuleService.listRules(req.session.user.databaseId);
  res.status(200).json({ rules });
};

const createRule = async (req, res) => {
  const eventName = String(req.body.eventName || '').trim();
  if (!SUPPORTED_EVENTS.has(eventName)) {
    return res.status(400).json({
      status: 'error',
      message: `eventName must be one of: ${[...SUPPORTED_EVENTS].join(', ')}`,
    });
  }

  const rule = await automationRuleService.createRule(req.session.user.databaseId, {
    eventName,
    configuration: validateConfiguration(req.body.configuration),
  });
  return res.status(201).json({ rule });
};

const updateRule = async (req, res) => {
  if (req.body.enabled !== undefined && typeof req.body.enabled !== 'boolean') {
    return res.status(400).json({ status: 'error', message: 'enabled must be a boolean' });
  }
  if (req.body.enabled === undefined && req.body.configuration === undefined) {
    return res.status(400).json({ status: 'error', message: 'No rule changes were provided' });
  }

  const rule = await automationRuleService.updateRule(
    req.session.user.databaseId,
    parseRuleId(req.params.ruleId),
    {
      enabled: req.body.enabled,
      configuration:
        req.body.configuration === undefined
          ? undefined
          : validateConfiguration(req.body.configuration),
    },
  );
  if (!rule) return res.status(404).json({ status: 'error', message: 'Automation rule not found' });
  return res.status(200).json({ rule });
};

const deleteRule = async (req, res) => {
  const deleted = await automationRuleService.deleteRule(
    req.session.user.databaseId,
    parseRuleId(req.params.ruleId),
  );
  if (!deleted) {
    return res.status(404).json({ status: 'error', message: 'Automation rule not found' });
  }
  return res.status(204).send();
};

module.exports = { getRules, createRule, updateRule, deleteRule };
