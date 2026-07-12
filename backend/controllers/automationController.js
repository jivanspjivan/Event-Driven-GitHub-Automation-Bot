const automationRuleService = require('../services/automationRuleService');
const logger = require('../config/logger');
const {
  validateConfigurationObject,
  validateCreateRule,
} = require('../services/automationRuleValidation');

const parseRuleId = (value) => {
  const ruleId = Number(value);
  if (!Number.isSafeInteger(ruleId) || ruleId <= 0) {
    const error = new Error('A valid automation rule ID is required');
    error.statusCode = 400;
    throw error;
  }
  return ruleId;
};

const getRules = async (req, res) => {
  const rules = await automationRuleService.listRules(req.session.user.databaseId);
  logger.info('Automation rules listed', {
    userId: req.session.user.databaseId,
    ruleCount: rules.length,
  });
  res.status(200).json({ rules });
};

const getDeliveries = async (req, res) => {
  const page = Number(req.query.page || 1);
  const pageSize = Number(req.query.pageSize || 5);
  if (!Number.isSafeInteger(page) || page <= 0 || !Number.isSafeInteger(pageSize) || pageSize <= 0 || pageSize > 50) {
    return res.status(400).json({ status: 'error', message: 'page and pageSize must be valid positive integers; pageSize cannot exceed 50' });
  }
  const { deliveries, pagination } = await automationRuleService.listDeliveries(
    req.session.user.databaseId,
    { page, pageSize },
  );
  logger.info('Automation deliveries listed', {
    userId: req.session.user.databaseId,
    deliveryCount: deliveries.length,
  });
  return res.status(200).json({ deliveries, pagination });
};

const createRule = async (req, res) => {
  const input = validateCreateRule(req.body);
  const rule = await automationRuleService.createRule(req.session.user.databaseId, input);
  logger.info('Automation rule created', {
    userId: req.session.user.databaseId,
    ruleId: rule.id,
    eventName: rule.eventName,
    actionType: rule.actionType,
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
          : validateConfigurationObject(req.body.configuration),
    },
  );
  if (!rule) return res.status(404).json({ status: 'error', message: 'Automation rule not found' });
  logger.info('Automation rule updated', {
    userId: req.session.user.databaseId,
    ruleId: rule.id,
    enabled: rule.enabled,
    actionType: rule.actionType,
  });
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
  logger.info('Automation rule deleted', {
    userId: req.session.user.databaseId,
    ruleId: parseRuleId(req.params.ruleId),
  });
  return res.status(204).send();
};

module.exports = { getRules, getDeliveries, createRule, updateRule, deleteRule };
