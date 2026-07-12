import { useEffect, useRef, useState } from 'react';
import { Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Divider, Stack, Typography } from '@mui/material';
import { automationApi } from '../api';

const statusColor = (status) => ['completed', 'success'].includes(status) ? 'success' : status === 'failed' ? 'error' : status === 'ignored' ? 'default' : 'warning';
const actionLabel = (type) => type === 'github_issue_triage' ? 'GitHub label and assignment' : type === 'slack_notification' ? 'Slack notification' : type === 'record_event' ? 'Event recording' : type;

export default function AutomationActivity({ selectedRepository, refreshVersion }) {
  const [rules, setRules] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [workingRuleId, setWorkingRuleId] = useState(null);
  const [error, setError] = useState('');
  const requestInFlight = useRef(false);

  const loadActivity = async ({ background = false } = {}) => {
    if (!selectedRepository) { setRules([]); setDeliveries([]); setInitialLoading(false); return; }
    if (requestInFlight.current) return;
    requestInFlight.current = true;
    if (background) setRefreshing(true);
    else setInitialLoading(true);
    setError('');
    try {
      const [rulesData, deliveriesData] = await Promise.all([automationApi.listRules(), automationApi.listDeliveries()]);
      setRules(rulesData.rules);
      setDeliveries(deliveriesData.deliveries);
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
  }, [selectedRepository?.id, refreshVersion]);

  const toggleRule = async (rule) => {
    setWorkingRuleId(rule.id); setError('');
    try {
      const data = await automationApi.updateRule(rule.id, { enabled: !rule.enabled });
      setRules((current) => current.map((item) => item.id === rule.id ? data.rule : item));
    } catch (requestError) { setError(requestError.message); }
    finally { setWorkingRuleId(null); }
  };

  const removeRule = async (rule) => {
    if (!window.confirm(`Delete the ${rule.actionType} automation rule?`)) return;
    setWorkingRuleId(rule.id); setError('');
    try { await automationApi.deleteRule(rule.id); setRules((current) => current.filter((item) => item.id !== rule.id)); }
    catch (requestError) { setError(requestError.message); }
    finally { setWorkingRuleId(null); }
  };

  if (!selectedRepository) return null;
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3, mt: 3 }}>
      <Card><CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
          <Box><Typography component="h2" variant="h6" fontWeight={700}>Automation rules</Typography><Typography variant="body2" color="text.secondary">Rules for {selectedRepository.fullName}</Typography></Box>
          <Button size="small" onClick={() => loadActivity({ background: true })} disabled={refreshing}>{refreshing ? 'Refreshing…' : 'Refresh'}</Button>
        </Stack>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {initialLoading ? <Stack alignItems="center" py={4}><CircularProgress size={28} /></Stack> : rules.length === 0 ? <Alert severity="info">No automation rules exist for this repository.</Alert> : (
          <Stack divider={<Divider flexItem />}>
            {rules.map((rule) => (
              <Box key={rule.id} sx={{ py: 2 }}><Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
                <Box><Stack direction="row" spacing={1} alignItems="center" mb={0.75}><Typography fontWeight={700}>{rule.configuration.label || rule.actionType}</Typography><Chip size="small" label={rule.enabled ? 'Enabled' : 'Disabled'} color={rule.enabled ? 'success' : 'default'} /></Stack>
                  <Typography variant="body2" color="text.secondary">{rule.actionType === 'triage_issue' ? `New issue → label ${rule.configuration.label} → assign @${rule.configuration.assignee} → notify Slack` : `${rule.eventName} → record event`} · action: {rule.actionType}</Typography>
                </Box>
                <Stack direction="row" spacing={1}><Button size="small" variant="outlined" disabled={workingRuleId !== null} onClick={() => toggleRule(rule)}>{rule.enabled ? 'Disable' : 'Enable'}</Button><Button size="small" color="error" disabled={workingRuleId !== null} onClick={() => removeRule(rule)}>Delete</Button></Stack>
              </Stack></Box>
            ))}
          </Stack>
        )}
      </CardContent></Card>
      <Card><CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
        <Typography component="h2" variant="h6" fontWeight={700}>Recent webhook deliveries</Typography><Typography variant="body2" color="text.secondary" mb={2}>Latest automation outcomes for this repository</Typography>
        {initialLoading ? <Stack alignItems="center" py={4}><CircularProgress size={28} /></Stack> : deliveries.length === 0 ? <Alert severity="info">No GitHub webhook deliveries have been recorded yet.</Alert> : (
          <Stack divider={<Divider flexItem />}>{deliveries.map((delivery) => (
            <Box key={delivery.deliveryId} sx={{ py: 2 }}>
              <Stack direction="row" justifyContent="space-between" spacing={2} mb={0.75}><Typography fontWeight={700}>{delivery.eventName}.{delivery.actionName || 'event'}</Typography><Chip size="small" label={delivery.status} color={statusColor(delivery.status)} /></Stack>
              <Typography variant="body2" color="text.secondary">{delivery.executedActionCount} action(s) executed · {new Date(delivery.receivedAt).toLocaleString()}</Typography>
              {delivery.jobId && (
                <Typography variant="caption" color="text.secondary">
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
          ))}</Stack>
        )}
      </CardContent></Card>
    </Box>
  );
}
