import { Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Container, Stack, Typography } from '@mui/material';
import { API_URL } from '../api';
import { BrandMark, GitHubIcon } from './Brand';
import PageShell from './PageShell';

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
      <Container maxWidth="sm">
        <Card sx={{ overflow: 'hidden', '&::before': { display: 'block', height: 5, content: '""', background: 'linear-gradient(90deg, #2563eb, #7c3aed)' } }}>
          <CardContent sx={{ p: { xs: 4, md: 6 }, textAlign: 'center', '&:last-child': { pb: { xs: 4, md: 6 } } }}>
            <Stack alignItems="center" spacing={2.5}>
              <BrandMark />
              <Chip label="Test workspace" color="primary" size="small" />
              <Box>
                <Typography component="h1" variant="h4" fontWeight={700} gutterBottom>GitHub Automation Bot</Typography>
                <Typography color="text.secondary">Connect your GitHub account to test the authentication and automation flow.</Typography>
              </Box>
              {error && <Alert severity="error" sx={{ width: '100%', textAlign: 'left' }}>{error}</Alert>}
              <Button fullWidth size="large" variant="contained" color="inherit" startIcon={<GitHubIcon />} onClick={login} sx={{ bgcolor: '#161b22', color: 'white', '&:hover': { bgcolor: '#30363d' } }}>
                Continue with GitHub
              </Button>
              <Typography variant="body2" color="text.secondary">You will be redirected to GitHub to authorize access.</Typography>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </PageShell>
  );
}
