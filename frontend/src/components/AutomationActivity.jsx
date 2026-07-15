import { useEffect, useRef, useState } from 'react';
import { Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Pagination, Stack, Typography } from '@mui/material';
import { automationApi } from '../api';
import formatRepositoryName from '../utils/formatRepositoryName';
import { GitHubEventIcon, PauseIcon, PlayIcon, TrashIcon } from './AutomationIcons';
import FeedbackToast from './FeedbackToast';

const statusColor = (status) => ['completed', 'success'].includes(status) ? 'success' : status === 'failed' ? 'error' : status === 'ignored' ? 'default' : 'warning';
const actionLabel = (type) => type === 'github_issue_triage' ? 'GitHub label and assignment' : type === 'slack_notification' ? 'Slack notification' : type === 'record_event' ? 'Event recording' : type;
const titleCase = (value = '') => value.replace(/[_-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
const eventName = (event, action) => {
  const eventLabels = {
    issues: 'Issue',
    pull_request: 'Pull request',
    push: 'Code pushed',
    create: 'Branch or tag created',
  };
  const label = eventLabels[event] || titleCase(event);
  if (!action || action === 'event') return label;
  return `${label} ${titleCase(action).toLowerCase()}`;
};
const ruleEventName = (event) => event === 'issues' ? 'New issue automation' : `${eventName(event)} automation`;

export default function AutomationActivity({ selectedRepository, refreshVersion }) {
  const [rules, setRules] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [deliveryPage, setDeliveryPage] = useState(1);
  const [deliveryPagination, setDeliveryPagination] = useState({ page: 1, pageSize: 5, totalItems: 0, totalPages: 1 });
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [workingRuleId, setWorkingRuleId] = useState(null);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const requestInFlight = useRef(false);

  const loadActivity = async ({ background = false } = {}) => {
    if (!selectedRepository) { setRules([]); setDeliveries([]); setInitialLoading(false); return; }
    if (requestInFlight.current) return;
    requestInFlight.current = true;
    if (background) setRefreshing(true);
    else setInitialLoading(true);
    setError('');
    try {
      const [rulesData, deliveriesData] = await Promise.all([automationApi.listRules(), automationApi.listDeliveries(deliveryPage, 5)]);
      setRules(rulesData.rules);
      setDeliveries(deliveriesData.deliveries);
      setDeliveryPagination(deliveriesData.pagination);
      if (deliveriesData.pagination.page !== deliveryPage) setDeliveryPage(deliveriesData.pagination.page);
    } catch (requestError) { setError(requestError.message); }
    finally {
      requestInFlight.current = false;
      setInitialLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadActivity();
    if (!selectedRepository) return undefined;
    const timer = window.setInterval(() => loadActivity({ background: true }), 10_000);
    return () => window.clearInterval(timer);
  }, [selectedRepository?.id, refreshVersion, deliveryPage]);

  const toggleRule = async (rule) => {
    setWorkingRuleId(rule.id); setError('');
    try {
      const data = await automationApi.updateRule(rule.id, { enabled: !rule.enabled });
      setRules((current) => current.map((item) => item.id === rule.id ? data.rule : item));
      setToast({
        severity: 'success',
        message: `${ruleEventName(rule.eventName)} ${rule.enabled ? 'disabled' : 'enabled'} successfully.`,
      });
    } catch (requestError) {
      setError(requestError.message);
      setToast({ severity: 'error', message: `Could not ${rule.enabled ? 'disable' : 'enable'} rule: ${requestError.message}` });
    }
    finally { setWorkingRuleId(null); }
  };

  const removeRule = async (rule) => {
    if (!window.confirm(`Delete the ${rule.actionType} automation rule?`)) return;
    setWorkingRuleId(rule.id); setError('');
    try {
      await automationApi.deleteRule(rule.id);
      setRules((current) => current.filter((item) => item.id !== rule.id));
      setToast({ severity: 'success', message: `${ruleEventName(rule.eventName)} deleted successfully.` });
    }
    catch (requestError) {
      setError(requestError.message);
      setToast({ severity: 'error', message: `Could not delete rule: ${requestError.message}` });
    }
    finally { setWorkingRuleId(null); }
  };

  if (!selectedRepository) return null;
  const repositoryName = formatRepositoryName(selectedRepository.name);
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3, mt: 3 }}>
      <Card sx={{ boxShadow: '0 7px 24px rgba(23, 74, 126, 0.08)' }}><CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
          <Box>
            <Typography component="h2" fontWeight={800} sx={{ color: '#123b66', fontSize: '24px', lineHeight: 1.25 }}>Automation rules</Typography>
            <Typography color="text.secondary" sx={{ fontSize: '0.78rem', mt: 0.35 }}>Repository · <Box component="span" fontWeight={700}>{repositoryName}</Box></Typography>
          </Box>
          <Button size="small" onClick={() => loadActivity({ background: true })} disabled={refreshing}>{refreshing ? 'Refreshing…' : 'Refresh'}</Button>
        </Stack>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {initialLoading ? <Stack alignItems="center" py={4}><CircularProgress size={28} /></Stack> : rules.length === 0 ? <Alert severity="info">No automation rules exist for this repository.</Alert> : (
          <Stack spacing={1.5}>
            {rules.map((rule) => (
              <Box key={rule.id} sx={{ borderRadius: 2.5, bgcolor: '#fbfcfe', boxShadow: '0 2px 10px rgba(23, 74, 126, 0.08)', px: 2, py: 1.75 }}><Stack direction={{ xs: 'column', sm: 'row' }} alignItems="flex-start" justifyContent="space-between" spacing={2}>
                <Box sx={{ minWidth: 0, width: '100%' }}><Stack direction="row" spacing={1} alignItems="center" mb={0.65} sx={{ flexWrap: 'wrap', rowGap: 0.75 }}><Typography fontWeight={800} sx={{ color: '#174a7e', fontSize: '1rem' }}>{ruleEventName(rule.eventName)}</Typography><Chip size="small" label={rule.enabled ? 'Enabled' : 'Disabled'} color={rule.enabled ? 'success' : 'default'} /></Stack>
                  <Typography color="text.secondary" sx={{ fontSize: '0.76rem', lineHeight: 1.45 }}>{rule.actionType === 'triage_issue' ? `Label ${rule.configuration.label} → assign @${rule.configuration.assignee} → notify Slack` : 'Record incoming event'}</Typography>
                </Box>
                <Stack direction="row" spacing={0.75} alignItems="center" flexShrink={0} sx={{ width: { xs: '100%', sm: 'auto' } }}>
                  <Button size="small" variant="outlined" startIcon={rule.enabled ? <PauseIcon /> : <PlayIcon />} disabled={workingRuleId !== null} onClick={() => toggleRule(rule)} sx={{ flex: { xs: 1, sm: 'initial' }, height: 30, whiteSpace: 'nowrap', fontWeight: 700 }}>{rule.enabled ? 'Disable' : 'Enable'}</Button>
                  <Button size="small" variant="contained" color="error" startIcon={<TrashIcon />} disabled={workingRuleId !== null} onClick={() => removeRule(rule)} sx={{ flex: { xs: 1, sm: 'initial' }, height: 30, whiteSpace: 'nowrap', bgcolor: '#c62828', fontWeight: 700, boxShadow: 'none', '&:hover': { bgcolor: '#a91f1f', boxShadow: '0 4px 10px rgba(198, 40, 40, 0.22)' } }}>Delete</Button>
                </Stack>
              </Stack></Box>
            ))}
          </Stack>
        )}
      </CardContent></Card>
      <Card sx={{ boxShadow: '0 7px 24px rgba(23, 74, 126, 0.08)' }}><CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
        <Typography component="h2" fontWeight={800} sx={{ color: '#123b66', fontSize: '24px', lineHeight: 1.25 }}>Recent webhook deliveries</Typography>
        <Typography color="text.secondary" mb={2} sx={{ fontSize: '0.78rem', mt: 0.35 }}>Repository · <Box component="span" fontWeight={700}>{repositoryName}</Box></Typography>
        {initialLoading ? <Stack alignItems="center" py={4}><CircularProgress size={28} /></Stack> : deliveries.length === 0 ? <Alert severity="info">No GitHub webhook deliveries have been recorded yet.</Alert> : (
          <><Stack>{deliveries.map((delivery, deliveryIndex) => (
            <Box key={delivery.deliveryId} sx={{ position: 'relative', pl: 4.5, pb: deliveryIndex === deliveries.length - 1 ? 0 : 2 }}>
              {deliveryIndex !== deliveries.length - 1 && <Box sx={{ position: 'absolute', top: 28, bottom: 0, left: 14, width: '2px', bgcolor: '#dbe5f0' }} />}
              <Box sx={{ position: 'absolute', top: 10, left: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: '50%', bgcolor: '#eef4ff', color: '#174a7e', boxShadow: '0 0 0 4px white' }}><GitHubEventIcon size={17} /></Box>
              <Box sx={{ borderRadius: 2.5, bgcolor: '#fbfcfe', boxShadow: '0 2px 10px rgba(23, 74, 126, 0.08)', px: 2, py: 1.5 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} mb={0.45}><Typography fontWeight={800} sx={{ color: '#174a7e', fontSize: '1rem' }}>{eventName(delivery.eventName, delivery.actionName)}</Typography><Chip size="small" label={delivery.status} color={statusColor(delivery.status)} /></Stack>
              <Typography color="text.secondary" sx={{ fontSize: '0.74rem' }}>{delivery.executedActionCount} action(s) · {new Date(delivery.receivedAt).toLocaleString()}</Typography>
              {delivery.jobId && (
                <Typography color="text.secondary" sx={{ display: 'block', fontSize: '0.68rem', mt: 0.25 }}>
                  Workflow job #{delivery.jobId} · attempt {delivery.attemptCount} of {delivery.maxRetryCount + 1}
                  {delivery.status === 'unprocessed' && delivery.nextAttemptAt
                    ? ` · next run ${new Date(delivery.nextAttemptAt).toLocaleString()}`
                    : ''}
                </Typography>
              )}
              {delivery.actionResults?.length > 0 && <Stack spacing={0.75} sx={{ mt: 1.5 }}>{delivery.actionResults.map((result, index) => (
                <Box key={`${delivery.deliveryId}-${result.actionType}-${index}`} sx={{ bgcolor: 'grey.100', borderRadius: 2, px: 1.5, py: 1 }}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}><Typography variant="body2" fontWeight={600}>{actionLabel(result.actionType)}</Typography><Chip size="small" label={result.status} color={statusColor(result.status)} /></Stack>
                  {result.errorMessage && <Typography variant="caption" color="error.main" sx={{ display: 'block', mt: 0.5 }}>{result.errorMessage}</Typography>}
                </Box>
              ))}</Stack>}
              {delivery.errorMessage && <Typography variant="body2" color="error.main" sx={{ mt: 0.75, overflowWrap: 'anywhere' }}>{delivery.errorMessage}</Typography>}
              </Box>
            </Box>
          ))}</Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} alignItems="center" justifyContent="space-between" spacing={2} mt={3}>
            <Typography variant="body2" color="text.secondary">
              {deliveryPagination.totalItems} deliver{deliveryPagination.totalItems === 1 ? 'y' : 'ies'} recorded
            </Typography>
            <Pagination page={deliveryPagination.page} count={deliveryPagination.totalPages} onChange={(_, nextPage) => setDeliveryPage(nextPage)} color="primary" disabled={refreshing} sx={{ ml: 'auto' }} />
          </Stack></>
        )}
      </CardContent></Card>
      <FeedbackToast toast={toast} onClose={() => setToast(null)} />
    </Box>
  );
}
