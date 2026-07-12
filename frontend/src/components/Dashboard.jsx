import { useState } from 'react';
import { Alert, Avatar, Box, Button, Card, CardContent, Chip, Container, Link, Stack, Typography } from '@mui/material';
import { BrandMark } from './Brand';
import PageShell from './PageShell';
import RepositoryPicker from './RepositoryPicker';
import AutomationRuleForm from './AutomationRuleForm';
import AutomationActivity from './AutomationActivity';
import SignOutIcon, { ExternalLinkIcon } from './DashboardIcons';
import formatRepositoryName from '../utils/formatRepositoryName';
import { CheckIcon } from './RepositoryIcons';

const dashboardCardHoverSx = {
  transition: 'transform 180ms ease, box-shadow 180ms ease',
  '&:hover': {
    transform: 'scale(0.99) translateY(-2px)',
    boxShadow: '0 10px 28px rgba(23, 74, 126, 0.12)',
  },
};

export default function Dashboard({ user, onLogout, loggingOut, error }) {
  const [selectedRepository, setSelectedRepository] = useState(null);
  const [automationRefreshVersion, setAutomationRefreshVersion] = useState(0);
  const displayName = formatRepositoryName(user.name || user.login);
  const profileStats = [
    { label: 'Repositories', value: user.publicRepositories },
    { label: 'Followers', value: user.followers },
    { label: 'Following', value: user.following },
  ];
  const connectionStatuses = [
    { label: 'GitHub', connected: user.githubConnected !== false },
    { label: 'Slack', connected: Boolean(user.slackConnected) },
    { label: 'Repository', connected: Boolean(selectedRepository) },
  ];
  return (
    <PageShell>
      <Container maxWidth="lg">
        <Box component="nav" sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr auto', md: '1fr auto 1fr' }, alignItems: 'center', mb: 2.5 }}>
          <Box sx={{ display: { xs: 'none', md: 'block' } }} />
          <Link href="/dashboard" color="text.primary" underline="none" sx={{ justifySelf: { xs: 'start', md: 'center' } }}>
            <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
              <BrandMark small />
              <Typography component="span" fontWeight={800} sx={{ fontSize: { xs: '1.1rem', sm: '1.65rem' } }}>GitHub Automation Bot</Typography>
            </Stack>
          </Link>
          <Button
            variant="contained"
            color="error"
            disabled={loggingOut}
            onClick={onLogout}
            startIcon={<SignOutIcon />}
            sx={{
              justifySelf: 'end',
              borderRadius: 2,
              px: { xs: 1.25, sm: 1.75 },
              py: 0.7,
              fontWeight: 700,
              textTransform: 'none',
              bgcolor: '#b85c5c',
              boxShadow: '0 3px 9px rgba(155, 70, 70, 0.14)',
              '&:hover': { bgcolor: '#a94f4f', boxShadow: '0 5px 12px rgba(155, 70, 70, 0.2)', transform: 'translateY(-1px)' },
              transition: 'box-shadow 160ms ease, transform 160ms ease',
            }}
          >
            {loggingOut ? 'Signing out…' : 'Sign out'}
          </Button>
        </Box>
        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 2.4fr) minmax(280px, 0.9fr)' }, alignItems: 'start', gap: 3 }}>
          <Card sx={dashboardCardHoverSx}><CardContent sx={{ p: { xs: 2.25, md: 2.75 }, '&:last-child': { pb: { xs: 2.25, md: 2.75 } } }}>
            <Chip label="GitHub workspace" color="primary" size="small" sx={{ mb: 1 }} />
            <Typography component="h1" fontWeight={700} sx={{ fontSize: { xs: '1.4rem', sm: '1.7rem' }, lineHeight: 1.2, mb: 0.5 }}>Welcome, {displayName}</Typography>
            <Typography color="text.secondary" fontWeight={400} mb={1.5} sx={{ fontSize: { xs: '0.85rem', sm: '0.9rem' }, lineHeight: 1.4 }}>
              Automatically triage new GitHub issues, assign the right developer, notify Slack, and track every action from one dashboard.
            </Typography>
            <Box sx={{ bgcolor: 'grey.100', borderRadius: 2.5, p: 1.5 }}>
              <Typography component="h2" fontWeight={700} mb={0.75} sx={{ fontSize: '0.85rem' }}>Get started</Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={0.75} alignItems={{ sm: 'flex-start' }}>
                {[
                  'Connect Repository',
                  'Create Rules',
                  'Test Automation',
                ].map((step) => (
                  <Stack key={step} direction="row" alignItems="flex-start" spacing={0.75} sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 21, height: 21, flexShrink: 0, borderRadius: '50%', bgcolor: '#dcfce7', color: '#15803d' }}>
                      <CheckIcon size={14} />
                    </Box>
                    <Typography fontWeight={600} sx={{ fontSize: '0.78rem', lineHeight: '21px' }}>{step}</Typography>
                  </Stack>
                ))}
              </Stack>
              <Stack
                direction="row"
                spacing={0.75}
                useFlexGap
                flexWrap="wrap"
                sx={{ borderTop: '1px solid', borderColor: 'divider', mt: 1.25, pt: 1.1 }}
              >
                {connectionStatuses.map((connection) => (
                  <Stack
                    key={connection.label}
                    direction="row"
                    alignItems="center"
                    spacing={0.55}
                    sx={{ borderRadius: 2, bgcolor: connection.connected ? '#f0fdf4' : '#f5f5f5', px: 1, py: 0.45 }}
                  >
                    <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: connection.connected ? '#22c55e' : '#9ca3af' }} />
                    <Typography fontWeight={700} sx={{ color: connection.connected ? '#166534' : 'text.secondary', fontSize: '0.7rem' }}>
                      {connection.label} · {connection.connected ? 'Connected' : 'Not connected'}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>
          </CardContent></Card>
          <Card sx={dashboardCardHoverSx}>
            <CardContent sx={{ p: 2.5, textAlign: 'center' }}>
              <Avatar src={user.avatarUrl} alt={`${user.login}'s avatar`} sx={{ width: 80, height: 80, mx: 'auto', mb: 1.5, boxShadow: '0 0 0 4px #eef2f7' }} />
              <Typography component="h2" variant="h6" fontWeight={700}>{displayName}</Typography>
              <Stack direction="row" justifyContent="center" divider={<Box sx={{ width: '1px', bgcolor: 'divider' }} />} sx={{ my: 1.75 }}>
                {profileStats.map((stat) => (
                  <Box key={stat.label} sx={{ flex: 1, minWidth: 0, px: 1 }}>
                    <Typography fontWeight={900} color="text.primary" sx={{ fontSize: '1.15rem', lineHeight: 1.2 }}>
                      {Number.isInteger(stat.value) ? stat.value : '—'}
                    </Typography>
                    <Typography color="text.secondary" sx={{ fontSize: '0.72rem' }}>{stat.label}</Typography>
                  </Box>
                ))}
              </Stack>
              <Button component="a" href={user.profileUrl} target="_blank" rel="noreferrer" fullWidth variant="outlined" color="inherit" endIcon={<ExternalLinkIcon />}>
                View GitHub profile
              </Button>
            </CardContent>
          </Card>
        </Box>
        <RepositoryPicker onSelectionChange={setSelectedRepository} />
        <AutomationRuleForm selectedRepository={selectedRepository} defaultAssignee={user.login} onRuleCreated={() => setAutomationRefreshVersion((current) => current + 1)} />
        <AutomationActivity selectedRepository={selectedRepository} refreshVersion={automationRefreshVersion} />
      </Container>
    </PageShell>
  );
}
