const SUPPORTED_EVENTS = new Set(['push', 'pull_request', 'issues']);
const SUPPORTED_ACTIONS = new Set(['record_event', 'triage_issue']);

const validationError = (message) => {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
};

const validateConfigurationObject = (configuration) => {
  if (configuration === undefined) return {};
  if (!configuration || Array.isArray(configuration) || typeof configuration !== 'object') {
    throw validationError('configuration must be a JSON object');
  }
  return configuration;
};

const validateCreateRule = ({ eventName, actionType, configuration }) => {
  const normalizedEvent = String(eventName || '').trim();
  const normalizedAction = String(actionType || 'record_event').trim();
  const normalizedConfiguration = validateConfigurationObject(configuration);

  if (!SUPPORTED_EVENTS.has(normalizedEvent)) {
    throw validationError(`eventName must be one of: ${[...SUPPORTED_EVENTS].join(', ')}`);
  }
  if (!SUPPORTED_ACTIONS.has(normalizedAction)) {
    throw validationError(`actionType must be one of: ${[...SUPPORTED_ACTIONS].join(', ')}`);
  }
  if (normalizedAction === 'triage_issue') {
    if (normalizedEvent !== 'issues') {
      throw validationError('triage_issue can only be used with the issues event');
    }
    const label = String(normalizedConfiguration.label || '').trim();
    const assignee = String(normalizedConfiguration.assignee || '').trim();
    if (!label || label.length > 50) {
      throw validationError('triage_issue requires a label of 1 to 50 characters');
    }
    if (!/^[a-zd](?:[a-zd-]{0,37}[a-zd])?$/i.test(assignee)) {
      throw validationError('triage_issue requires a valid GitHub assignee login');
    }
    return {
      eventName: normalizedEvent,
      actionType: normalizedAction,
      configuration: { label, assignee },
    };
  }

  return {
    eventName: normalizedEvent,
    actionType: normalizedAction,
    configuration: normalizedConfiguration,
  };
};

module.exports = { validateConfigurationObject, validateCreateRule };
