import { useEffect, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Link,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { API_URL, apiRequest, automationApi, getCurrentUser } from './api';


function GitHubIcon({ size = 22 }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width={size} height={size} fill="currentColor">
      <path d="M12 .7a11.5 11.5 0 0 0-3.64 22.4c.58.1.79-.25.79-.56v-2.23c-3.22.7-3.9-1.37-3.9-1.37-.52-1.34-1.28-1.7-1.28-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.74-1.55-2.57-.3-5.27-1.29-5.27-5.69 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.16 1.18a10.9 10.9 0 0 1 5.76 0c2.2-1.49 3.16-1.18 3.16-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.71 5.39-5.29 5.68.42.36.79 1.06.79 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .7Z" />
    </svg>
  );
}

function BrandMark({ small = false }) {
  return (
    <Box sx={{ display: 'grid', placeItems: 'center', flexShrink: 0, width: small ? 40 : 56, height: small ? 40 : 56, color: 'white', bgcolor: '#161b22', borderRadius: small ? 3 : 4 }}>
      <GitHubIcon />
    </Box>
  );
}

function PageShell({ children, centered = false }) {
  return (
    <Box component="main" sx={{ minHeight: '100vh', display: centered ? 'grid' : 'block', placeItems: centered ? 'center' : undefined, py: centered ? 5 : { xs: 3, md: 5 } }}>
      {children}
    </Box>
  );
}

function LoadingScreen() {
  return (
    <PageShell centered>
      <Stack alignItems="center" spacing={2} role="status">
        <CircularProgress />
        <Typography color="text.secondary">Checking your GitHub session…</Typography>
      </Stack>
    </PageShell>
  );
}

function LoginPage({ error }) {
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

function RepositoryPicker({ onSelectionChange }) {
  const [repositories, setRepositories] = useState([]);
  const [selectedRepository, setSelectedRepository] = useState(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState('');

  const loadRepositories = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiRequest('/api/repositories');
      setRepositories(data.repositories);
      setSelectedRepository(data.selectedRepository);
      onSelectionChange(data.selectedRepository);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRepositories();
  }, []);

  const selectRepository = async (repositoryId) => {
    setSavingId(repositoryId);
    setError('');
    try {
      const data = await apiRequest('/api/repositories/selection', {
        method: 'PUT',
        body: JSON.stringify({ repositoryId }),
      });
      setSelectedRepository(data.selectedRepository);
      onSelectionChange(data.selectedRepository);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSavingId(null);
    }
  };

  const clearSelection = async () => {
    setSavingId(selectedRepository?.id);
    setError('');
    try {
      await apiRequest('/api/repositories/selection', { method: 'DELETE' });
      setSelectedRepository(null);
      onSelectionChange(null);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSavingId(null);
    }
  };

  const normalizedQuery = query.trim().toLowerCase();
  const filteredRepositories = repositories.filter((repository) =>
    `${repository.fullName} ${repository.description || ''}`.toLowerCase().includes(normalizedQuery),
  );

  return (
    <Card sx={{ mt: 3 }}>
      <CardContent sx={{ p: { xs: 3, md: 4 }, '&:last-child': { pb: { xs: 3, md: 4 } } }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2} mb={3}>
          <Box>
            <Typography component="h2" variant="h5" fontWeight={700}>Choose a repository</Typography>
            <Typography color="text.secondary">Select the repository the automation bot should work with.</Typography>
          </Box>
          <Button variant="outlined" onClick={loadRepositories} disabled={loading}>Refresh</Button>
        </Stack>

        {selectedRepository && (
          <Alert
            severity="success"
            action={<Button color="inherit" size="small" onClick={clearSelection} disabled={savingId !== null}>Change</Button>}
            sx={{ mb: 3 }}
          >
            Selected <strong>{selectedRepository.fullName}</strong> · default branch: {selectedRepository.defaultBranch}
          </Alert>
        )}
        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        <TextField
          fullWidth
          size="small"
          label="Search repositories"
          placeholder="Repository name or description"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          disabled={loading}
          sx={{ mb: 3 }}
        />

        {loading ? (
          <Stack alignItems="center" spacing={2} py={5} role="status">
            <CircularProgress size={32} />
            <Typography color="text.secondary">Loading your GitHub repositories…</Typography>
          </Stack>
        ) : filteredRepositories.length === 0 ? (
          <Box sx={{ py: 5, textAlign: 'center' }}>
            <Typography fontWeight={600}>No repositories found</Typography>
            <Typography variant="body2" color="text.secondary">Try another search or refresh your GitHub access.</Typography>
          </Box>
        ) : (
          <Stack divider={<Divider flexItem />}>
            {filteredRepositories.map((repository) => {
              const isSelected = selectedRepository?.id === repository.id;
              const permission = repository.permissions?.admin
                ? 'Admin'
                : repository.permissions?.push
                  ? 'Write'
                  : 'Read';

              return (
                <Stack key={repository.id} direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} justifyContent="space-between" spacing={2} sx={{ py: 2.5 }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                      <Link href={repository.htmlUrl} target="_blank" rel="noreferrer" fontWeight={700} underline="hover" sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {repository.fullName}
                      </Link>
                      <Chip label={repository.private ? 'Private' : 'Public'} size="small" variant="outlined" />
                      <Chip label={permission} size="small" color={permission === 'Read' ? 'default' : 'primary'} variant="outlined" />
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
                      {repository.description || 'No description'} · {repository.defaultBranch}
                    </Typography>
                  </Box>
                  <Button
                    variant={isSelected ? 'contained' : 'outlined'}
                    color={isSelected ? 'success' : 'primary'}
                    disabled={savingId !== null || isSelected}
                    onClick={() => selectRepository(repository.id)}
                    sx={{ flexShrink: 0 }}
                  >
                    {savingId === repository.id ? 'Selecting…' : isSelected ? 'Selected' : 'Select'}
                  </Button>
                </Stack>
              );
            })}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}

function AutomationRuleForm({ selectedRepository, defaultAssignee, onRuleCreated = () => {} }) {
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
      setMessage({
        type: 'success',
        text: `Rule created for ${selectedRepository.fullName}. New issues will be labelled and assigned automatically.`,
      });
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
            <Typography color="text.secondary">
              When QA opens an issue, add a label and assign the responsible developer.
            </Typography>
          </Box>

          {!selectedRepository ? (
            <Alert severity="info">Select a repository before creating an automation rule.</Alert>
          ) : (
            <Box component="form" onSubmit={createRule}>
              <Alert severity="info" sx={{ mb: 3 }}>
                Repository: <strong>{selectedRepository.fullName}</strong> · Trigger: new issue opened
              </Alert>
              {message.text && <Alert severity={message.type} sx={{ mb: 3 }}>{message.text}</Alert>}
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField
                  fullWidth
                  label="Issue label"
                  value={label}
                  onChange={(event) => setLabel(event.target.value)}
                  helperText="The label must already exist in the GitHub repository."
                  inputProps={{ maxLength: 50 }}
                  disabled={saving}
                />
                <TextField
                  fullWidth
                  label="Developer GitHub login"
                  value={assignee}
                  onChange={(event) => setAssignee(event.target.value)}
                  helperText="This user must be assignable to repository issues."
                  disabled={saving}
                />
              </Stack>
              <Button type="submit" variant="contained" sx={{ mt: 3 }} disabled={saving}>
                {saving ? 'Creating rule…' : 'Create triage rule'}
              </Button>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

function Dashboard({ user, onLogout, loggingOut, error }) {
  const [selectedRepository, setSelectedRepository] = useState(null);

  return (
    <PageShell>
      <Container maxWidth="lg">
        <Stack component="nav" direction="row" alignItems="center" justifyContent="space-between" mb={5}>
          <Link href="/dashboard" color="text.primary" underline="none">
            <Stack direction="row" alignItems="center" spacing={1.5}><BrandMark small /><Typography fontWeight={700}>Automation Bot</Typography></Stack>
          </Link>
          <Button variant="outlined" color="inherit" disabled={loggingOut} onClick={onLogout}>{loggingOut ? 'Signing out…' : 'Sign out'}</Button>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 3 }}>
          <Card>
            <CardContent sx={{ p: { xs: 3, md: 5 }, '&:last-child': { pb: { xs: 3, md: 5 } } }}>
              <Chip label="Connected" color="success" size="small" sx={{ mb: 2 }} />
              <Typography component="h1" variant="h3" fontWeight={700} gutterBottom>Welcome, {user.name || user.login}</Typography>
              <Typography variant="h6" color="text.secondary" fontWeight={400} mb={4}>Your GitHub OAuth flow is working and the backend session is active.</Typography>
              <Box sx={{ bgcolor: 'grey.100', borderRadius: 3, p: 3 }}>
                <Typography component="h2" variant="subtitle2" fontWeight={700} mb={2}>Flow status</Typography>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Box sx={{ width: 12, height: 12, flexShrink: 0, bgcolor: 'success.main', borderRadius: '50%', boxShadow: '0 0 0 5px rgba(46, 125, 50, .12)' }} />
                  <Box><Typography fontWeight={600}>Authentication complete</Typography><Typography variant="body2" color="text.secondary">Ready for the next automation step</Typography></Box>
                </Stack>
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <Avatar src={user.avatarUrl} alt={`${user.login}'s avatar`} sx={{ width: 96, height: 96, mx: 'auto', mb: 2, boxShadow: '0 0 0 5px #eef2f7' }} />
              <Typography component="h2" variant="h6">{user.name || user.login}</Typography>
              <Typography color="text.secondary" mb={3}>@{user.login}</Typography>
              <Button component="a" href={user.profileUrl} target="_blank" rel="noreferrer" fullWidth variant="outlined" color="inherit">View GitHub profile</Button>
            </CardContent>
          </Card>
        </Box>
        <RepositoryPicker onSelectionChange={setSelectedRepository} />
        <AutomationRuleForm
          selectedRepository={selectedRepository}
          defaultAssignee={user.login}
        />
      </Container>
    </PageShell>
  );
}

export default function App() {
  const [state, setState] = useState({ loading: true, user: null, error: '' });
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    getCurrentUser()
      .then((user) => setState({ loading: false, user, error: '' }))
      .catch((error) => setState({ loading: false, user: null, error: error.message }));
  }, []);

  const logout = async () => {
    setLoggingOut(true);
    setState((current) => ({ ...current, error: '' }));
    try {
      const response = await fetch(`${API_URL}/api/auth/logout`, { method: 'POST', credentials: 'include' });
      if (!response.ok) throw new Error('Could not sign out. Please try again.');
      window.history.replaceState({}, '', '/');
      setState({ loading: false, user: null, error: '' });
    } catch (error) {
      setState((current) => ({ ...current, error: error.message }));
    } finally {
      setLoggingOut(false);
    }
  };

  if (state.loading) return <LoadingScreen />;
  if (!state.user) return <LoginPage error={state.error} />;
  return <Dashboard user={state.user} onLogout={logout} loggingOut={loggingOut} error={state.error} />;
}
