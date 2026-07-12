import { useEffect, useState } from 'react';
import { Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Divider, Link, Stack, TextField, Typography } from '@mui/material';
import { apiRequest } from '../api';

export default function RepositoryPicker({ onSelectionChange }) {
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

  useEffect(() => { loadRepositories(); }, []);

  const selectRepository = async (repositoryId) => {
    setSavingId(repositoryId);
    setError('');
    try {
      const data = await apiRequest('/api/repositories/selection', { method: 'PUT', body: JSON.stringify({ repositoryId }) });
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
    `${repository.fullName} ${repository.description || ''}`.toLowerCase().includes(normalizedQuery));

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
          <Alert severity="success" action={<Button color="inherit" size="small" onClick={clearSelection} disabled={savingId !== null}>Change</Button>} sx={{ mb: 3 }}>
            Selected <strong>{selectedRepository.fullName}</strong> · default branch: {selectedRepository.defaultBranch}
          </Alert>
        )}
        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        <TextField fullWidth size="small" label="Search repositories" placeholder="Repository name or description" value={query} onChange={(event) => setQuery(event.target.value)} disabled={loading} sx={{ mb: 3 }} />
        {loading ? (
          <Stack alignItems="center" spacing={2} py={5} role="status"><CircularProgress size={32} /><Typography color="text.secondary">Loading your GitHub repositories…</Typography></Stack>
        ) : filteredRepositories.length === 0 ? (
          <Box sx={{ py: 5, textAlign: 'center' }}><Typography fontWeight={600}>No repositories found</Typography><Typography variant="body2" color="text.secondary">Try another search or refresh your GitHub access.</Typography></Box>
        ) : (
          <Stack divider={<Divider flexItem />}>
            {filteredRepositories.map((repository) => {
              const isSelected = selectedRepository?.id === repository.id;
              const permission = repository.permissions?.admin ? 'Admin' : repository.permissions?.push ? 'Write' : 'Read';
              return (
                <Stack key={repository.id} direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} justifyContent="space-between" spacing={2} sx={{ py: 2.5 }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                      <Link href={repository.htmlUrl} target="_blank" rel="noreferrer" fontWeight={700} underline="hover" sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{repository.fullName}</Link>
                      <Chip label={repository.private ? 'Private' : 'Public'} size="small" variant="outlined" />
                      <Chip label={permission} size="small" color={permission === 'Read' ? 'default' : 'primary'} variant="outlined" />
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>{repository.description || 'No description'} · {repository.defaultBranch}</Typography>
                  </Box>
                  <Button variant={isSelected ? 'contained' : 'outlined'} color={isSelected ? 'success' : 'primary'} disabled={savingId !== null || isSelected} onClick={() => selectRepository(repository.id)} sx={{ flexShrink: 0 }}>
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
