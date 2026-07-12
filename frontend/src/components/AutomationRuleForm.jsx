import { useState } from 'react';
import { Alert, Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';
import { automationApi } from '../api';

export default function AutomationRuleForm({ selectedRepository, defaultAssignee, onRuleCreated = () => {} }) {
  const [label, setLabel] = useState('bug');
  const [assignee, setAssignee] = useState(defaultAssignee);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const createRule = async (event) => {
    event.preventDefault();
    const normalizedLabel = label.trim();
    const normalizedAssignee = assignee.trim();
    if (!normalizedLabel || !normalizedAssignee) {
      setMessage({ type: 'error', text: 'Enter both a label and a developer GitHub login.' });
      return;
    }
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const data = await automationApi.createRule({
        eventName: 'issues',
        actionType: 'triage_issue',
        configuration: { label: normalizedLabel, assignee: normalizedAssignee },
      });
      setMessage({ type: 'success', text: `Rule created for ${selectedRepository.fullName}. New issues will be labelled, assigned, and sent to Slack.` });
      onRuleCreated(data.rule);
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card sx={{ mt: 3 }}>
      <CardContent sx={{ p: { xs: 3, md: 4 }, '&:last-child': { pb: { xs: 3, md: 4 } } }}>
        <Stack spacing={3}>
          <Box>
            <Typography component="h2" variant="h5" fontWeight={700}>Create issue triage automation</Typography>
            <Typography color="text.secondary">When QA opens an issue, add a label, assign the responsible developer, and notify Slack.</Typography>
          </Box>
          {!selectedRepository ? (
            <Alert severity="info">Select a repository before creating an automation rule.</Alert>
          ) : (
            <Box component="form" onSubmit={createRule}>
              <Alert severity="info" sx={{ mb: 3 }}>Repository: <strong>{selectedRepository.fullName}</strong> · Trigger: new issue opened</Alert>
              {message.text && <Alert severity={message.type} sx={{ mb: 3 }}>{message.text}</Alert>}
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField fullWidth label="Issue label" value={label} onChange={(event) => setLabel(event.target.value)} helperText="The label must already exist in the GitHub repository." inputProps={{ maxLength: 50 }} disabled={saving} />
                <TextField fullWidth label="Developer GitHub login" value={assignee} onChange={(event) => setAssignee(event.target.value)} helperText="This user must be assignable to repository issues." disabled={saving} />
              </Stack>
              <Button type="submit" variant="contained" sx={{ mt: 3 }} disabled={saving}>{saving ? 'Creating rule…' : 'Create triage rule'}</Button>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
