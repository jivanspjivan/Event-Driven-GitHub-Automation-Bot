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
      <CardContent sx={{ p: { xs: 2.25, md: 2.75 }, '&:last-child': { pb: { xs: 2.25, md: 2.75 } } }}>
        <Stack spacing={1.75}>
          <Box>
            <Typography component="h2" fontWeight={750} sx={{ fontSize: { xs: '1.25rem', sm: '1.45rem' }, lineHeight: 1.25 }}>Create issue triage automation</Typography>
            <Typography color="text.secondary" sx={{ mt: 0.35, fontSize: '0.9rem', lineHeight: 1.45 }}>When QA opens an issue, add a label, assign the responsible developer, and notify Slack.</Typography>
          </Box>
          {!selectedRepository ? (
            <Alert severity="info">Select a repository before creating an automation rule.</Alert>
          ) : (
            <Box component="form" onSubmit={createRule}>
              <Alert severity="info" sx={{ mb: 1.75, py: 0.25 }}>Repository: <strong>{selectedRepository.fullName}</strong> · Trigger: new issue opened</Alert>
              {message.text && <Alert severity={message.type} sx={{ mb: 1.75, py: 0.25 }}>{message.text}</Alert>}
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
                <TextField size="small" fullWidth label="Issue label" value={label} onChange={(event) => setLabel(event.target.value)} helperText="The label must already exist in the GitHub repository." inputProps={{ maxLength: 50 }} disabled={saving} />
                <TextField size="small" fullWidth label="Developer GitHub login" value={assignee} onChange={(event) => setAssignee(event.target.value)} helperText="This user must be assignable to repository issues." disabled={saving} />
              </Stack>
              <Button
                type="submit"
                variant="contained"
                disabled={saving}
                sx={{
                  mt: 1.75,
                  minHeight: 44,
                  px: 3.5,
                  bgcolor: '#1557b0',
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  textTransform: 'none',
                  boxShadow: '0 5px 14px rgba(21, 87, 176, 0.25)',
                  '&:hover': { bgcolor: '#0d47a1', boxShadow: '0 7px 18px rgba(21, 87, 176, 0.34)', transform: 'translateY(-1px)' },
                  transition: 'background-color 160ms ease, box-shadow 160ms ease, transform 160ms ease',
                }}
              >
                {saving ? 'Creating rule…' : 'Create triage rule'}
              </Button>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
