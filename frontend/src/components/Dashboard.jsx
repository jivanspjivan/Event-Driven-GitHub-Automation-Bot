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
        <Stack component="nav" direction="row" alignItems="center" justifyContent="space-between" mb={5}>
          <Link href="/dashboard" color="text.primary" underline="none"><Stack direction="row" alignItems="center" spacing={1.5}><BrandMark small /><Typography fontWeight={700}>Automation Bot</Typography></Stack></Link>
          <Button variant="outlined" color="inherit" disabled={loggingOut} onClick={onLogout}>{loggingOut ? 'Signing out…' : 'Sign out'}</Button>
        </Stack>
        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 3 }}>
          <Card><CardContent sx={{ p: { xs: 3, md: 5 }, '&:last-child': { pb: { xs: 3, md: 5 } } }}>
            <Chip label="Connected" color="success" size="small" sx={{ mb: 2 }} />
            <Typography component="h1" variant="h3" fontWeight={700} gutterBottom>Welcome, {user.name || user.login}</Typography>
            <Typography variant="h6" color="text.secondary" fontWeight={400} mb={4}>Your GitHub OAuth flow is working and the backend session is active.</Typography>
            <Box sx={{ bgcolor: 'grey.100', borderRadius: 3, p: 3 }}><Typography component="h2" variant="subtitle2" fontWeight={700} mb={2}>Flow status</Typography><Stack direction="row" alignItems="center" spacing={2}><Box sx={{ width: 12, height: 12, flexShrink: 0, bgcolor: 'success.main', borderRadius: '50%', boxShadow: '0 0 0 5px rgba(46, 125, 50, .12)' }} /><Box><Typography fontWeight={600}>Authentication complete</Typography><Typography variant="body2" color="text.secondary">Ready for GitHub and Slack automation</Typography></Box></Stack></Box>
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
