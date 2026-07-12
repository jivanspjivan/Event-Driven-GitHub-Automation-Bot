import { Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Container, Link, Stack, Typography } from '@mui/material';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import GitHubIcon from '@mui/icons-material/GitHub';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';
import TimelineRoundedIcon from '@mui/icons-material/TimelineRounded';
import { API_URL } from '../api';
import PageShell from './PageShell';

const loginFeatures = [
  {
    title: 'Automatic Issue Triage',
    description: 'Automatically label and assign GitHub issues.',
    icon: <BoltRoundedIcon />,
    color: '#7c3aed',
    background: '#f3e8ff',
  },
  {
    title: 'Slack Notifications',
    description: 'Receive instant updates for repository events.',
    icon: <NotificationsNoneRoundedIcon />,
    color: '#2563eb',
    background: '#dbeafe',
  },
  {
    title: 'Live Webhook Monitoring',
    description: 'Track webhook deliveries in real time.',
    icon: <TimelineRoundedIcon />,
    color: '#0f766e',
    background: '#ccfbf1',
  },
];

export function LoadingScreen() {
  return (
    <PageShell centered>
      <Stack alignItems="center" spacing={2} role="status">
        <CircularProgress />
        <Typography color="text.secondary">Checking your GitHub session…</Typography>
      </Stack>
    </PageShell>
  );
}

export function LoginPage({ error }) {
  const login = () => window.location.assign(`${API_URL}/api/auth/github`);
  return (
    <PageShell centered>
      <Box
        sx={{
          position: 'fixed',
          inset: 0,
          display: 'grid',
          placeItems: 'center',
          overflowY: 'auto',
          background: 'radial-gradient(circle at 50% 42%, rgba(59, 130, 246, 0.10) 0, rgba(59, 130, 246, 0.035) 230px, transparent 470px), #f8fafc',
          px: { xs: 2, sm: 3 },
          py: { xs: 3, sm: 5 },
        }}
      >
        <Container maxWidth={false} disableGutters sx={{ width: '100%', maxWidth: 548 }}>
          <Card
            sx={{
              '@keyframes loginCardEnter': {
                from: { opacity: 0, transform: 'translateY(12px) scale(0.99)' },
                to: { opacity: 1, transform: 'translateY(0) scale(1)' },
              },
              border: '1px solid #e5e7eb',
              borderRadius: '20px',
              bgcolor: '#fbfcfe',
              boxShadow: '0 24px 64px rgba(15, 23, 42, 0.075), 0 6px 18px rgba(15, 23, 42, 0.04)',
              animation: 'loginCardEnter 420ms ease-out both',
              '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
            }}
          >
            <CardContent sx={{ p: { xs: 3, sm: 6 }, '&:last-child': { pb: { xs: 3, sm: 6 } } }}>
              <Stack spacing={0}>
                <Stack alignItems="center" textAlign="center">
                  <Box
                    sx={{
                      display: 'grid',
                      placeItems: 'center',
                      width: 80,
                      height: 80,
                      mx: 'auto',
                      mb: 3,
                      borderRadius: '50%',
                      bgcolor: '#f1f5f9',
                      color: '#0f172a',
                      boxShadow: 'inset 0 0 0 1px #e2e8f0',
                    }}
                  >
                    <GitHubIcon sx={{ fontSize: 60 }} />
                  </Box>
                  <Chip
                    label="GitHub Automation"
                    icon={<BoltRoundedIcon />}
                    size="small"
                    sx={{
                      height: 24,
                      mb: 2,
                      border: '1px solid #bfdbfe',
                      borderRadius: '999px',
                      bgcolor: '#eff6ff',
                      color: '#2563eb',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      letterSpacing: '0.025em',
                      width: 'fit-content',
                      alignSelf: 'center',
                      mx: 'auto',
                      '& .MuiChip-icon': { ml: 0.9, mr: -0.35, color: '#2563eb', fontSize: 14 },
                      '& .MuiChip-label': { px: 1.25 },
                    }}
                  />
                  <Typography
                    component="h1"
                    sx={{
                      color: '#0f172a',
                      fontSize: { xs: '2.1rem', sm: '38px' },
                      fontWeight: 800,
                      lineHeight: 1.08,
                      letterSpacing: '-0.04em',
                      whiteSpace: { sm: 'nowrap' },
                    }}
                  >
                    GitHub Automation Bot
                  </Typography>
                  <Typography sx={{ mt: 2, color: '#64748b', fontSize: '16px', lineHeight: 1.65 }}>
                    Connect your GitHub account to automate issue triage, pull request workflows, webhook events, and Slack notifications.
                  </Typography>
                </Stack>

                <Stack spacing={2.5} sx={{ my: 4 }}>
                  {loginFeatures.map((feature) => (
                    <Stack
                      key={feature.title}
                      direction="row"
                      alignItems="center"
                      spacing={2}
                      sx={{
                        borderRadius: 2,
                        transition: 'background-color 200ms ease, transform 200ms ease',
                        '&:hover': { bgcolor: '#f8fafc', transform: 'translateX(3px)' },
                        '@media (prefers-reduced-motion: reduce)': { transition: 'none', '&:hover': { transform: 'none' } },
                      }}
                    >
                      <Box
                        sx={{
                          display: 'grid',
                          placeItems: 'center',
                          width: 42,
                          height: 42,
                          flexShrink: 0,
                          borderRadius: '50%',
                          bgcolor: feature.background,
                          color: feature.color,
                          '& .MuiSvgIcon-root': { fontSize: 21 },
                        }}
                      >
                        {feature.icon}
                      </Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ color: '#1e293b', fontSize: '0.9rem', fontWeight: 750, lineHeight: 1.35 }}>
                          {feature.title}
                        </Typography>
                        <Typography sx={{ mt: 0.25, color: '#64748b', fontSize: '0.78rem', lineHeight: 1.45 }}>
                          {feature.description}
                        </Typography>
                      </Box>
                    </Stack>
                  ))}
                </Stack>

                {error && <Alert severity="error" sx={{ mb: 2.5, textAlign: 'left' }}>{error}</Alert>}
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<GitHubIcon sx={{ fontSize: '24px !important' }} />}
                  onClick={login}
                  sx={{
                    height: 54,
                    borderRadius: '12px',
                    bgcolor: '#111827',
                    color: '#ffffff',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    boxShadow: '0 8px 18px rgba(17, 24, 39, 0.18)',
                    cursor: 'pointer',
                    transition: 'background-color 200ms ease, box-shadow 200ms ease, transform 200ms ease',
                    '&:hover': {
                      bgcolor: '#242b36',
                      boxShadow: '0 8px 18px rgba(17, 24, 39, 0.20)',
                      transform: 'translateY(-1px)',
                    },
                    '&:focus-visible': { outline: '3px solid rgba(37, 99, 235, 0.35)', outlineOffset: 2 },
                  }}
                >
                  Continue with GitHub
                </Button>
                <Typography sx={{ mt: 2, color: '#64748b', fontSize: '13px', lineHeight: 1.5, textAlign: 'center' }}>
                  By continuing, you authorize this application to access your GitHub repositories.
                </Typography>
                <Typography sx={{ mt: 1.25, color: '#94a3b8', fontSize: '13px', lineHeight: 1.5, textAlign: 'center' }}>
                  Need help?{' '}
                  <Link href="mailto:jivanparatpure2002@gmail.com" underline="hover" sx={{ color: '#2563eb', fontWeight: 600 }}>
                    jivanparatpure2002@gmail.com
                  </Link>
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Container>
      </Box>
    </PageShell>
  );
}
