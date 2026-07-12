import { useState } from 'react';
import { Alert, Avatar, Box, Button, Card, CardContent, Chip, Container, Link, Stack, Typography } from '@mui/material';
import { BrandMark } from './Brand';
import PageShell from './PageShell';
import RepositoryPicker from './RepositoryPicker';
import AutomationRuleForm from './AutomationRuleForm';
import AutomationActivity from './AutomationActivity';

export default function Dashboard({ user, onLogout, loggingOut, error }) {
  const [selectedRepository, setSelectedRepository] = useState(null);
  const [automationRefreshVersion, setAutomationRefreshVersion] = useState(0);
  return (
    <PageShell>
      <Container maxWidth="lg">
        <Box component="nav" sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr auto', md: '1fr auto 1fr' }, alignItems: 'center', mb: 5 }}>
          <Box sx={{ display: { xs: 'none', md: 'block' } }} />
          <Link href="/dashboard" color="text.primary" underline="none" sx={{ justifySelf: { xs: 'start', md: 'center' } }}>
            <Stack direction="row" alignItems="center" justifyContent="center" spacing={1.5}>
              <BrandMark small />
              <Typography component="span" fontWeight={800} sx={{ fontSize: { xs: '1.2rem', sm: '2rem' } }}>GitHub Automation Bot</Typography>
            </Stack>
          </Link>
          <Button variant="contained" color="error" disabled={loggingOut} onClick={onLogout} sx={{ justifySelf: 'end' }}>
            {loggingOut ? 'Signing out…' : 'Sign out'}
          </Button>
        </Box>
        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 3 }}>
          <Card><CardContent sx={{ p: { xs: 3, md: 5 }, '&:last-child': { pb: { xs: 3, md: 5 } } }}>
            <Chip label="GitHub workspace" color="primary" size="small" sx={{ mb: 2 }} />
            <Typography component="h1" fontWeight={700} gutterBottom sx={{ fontSize: { xs: '1.65rem', sm: '2.1rem' }, lineHeight: 1.25 }}>Welcome, {user.name || user.login}</Typography>
            <Typography color="text.secondary" fontWeight={400} mb={4} sx={{ fontSize: { xs: '0.92rem', sm: '1rem' }, lineHeight: 1.6 }}>
              Automatically triage new GitHub issues, assign the right developer, notify Slack, and track every action from one dashboard.
            </Typography>
            <Box sx={{ bgcolor: 'grey.100', borderRadius: 3, p: 3 }}>
              <Typography component="h2" variant="subtitle1" fontWeight={700} mb={2}>Get started</Typography>
              <Stack spacing={1.5}>
                {[
                  'Select the GitHub repository you want to automate.',
                  'Create a rule with an issue label and developer assignee.',
                  'Open an issue and monitor GitHub, Slack, and retry results below.',
                ].map((step, index) => (
                  <Stack key={step} direction="row" alignItems="center" spacing={1.5}>
                    <Chip label={index + 1} size="small" color="primary" />
                    <Typography variant="body2">{step}</Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>
          </CardContent></Card>
          <Card><CardContent sx={{ p: 3, textAlign: 'center' }}><Avatar src={user.avatarUrl} alt={`${user.login}'s avatar`} sx={{ width: 96, height: 96, mx: 'auto', mb: 2, boxShadow: '0 0 0 5px #eef2f7' }} /><Typography component="h2" variant="h6">{user.name || user.login}</Typography><Typography color="text.secondary" mb={3}>@{user.login}</Typography><Button component="a" href={user.profileUrl} target="_blank" rel="noreferrer" fullWidth variant="outlined" color="inherit">View GitHub profile</Button></CardContent></Card>
        </Box>
        <RepositoryPicker onSelectionChange={setSelectedRepository} />
        <AutomationRuleForm selectedRepository={selectedRepository} defaultAssignee={user.login} onRuleCreated={() => setAutomationRefreshVersion((current) => current + 1)} />
        <AutomationActivity selectedRepository={selectedRepository} refreshVersion={automationRefreshVersion} />
      </Container>
    </PageShell>
  );
}
