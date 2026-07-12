import { useEffect, useState } from 'react';
import { Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Divider, Link, Pagination, Stack, TextField, Typography } from '@mui/material';
import { apiRequest } from '../api';

const repositoryButtonSx = (isSelected) =>
  isSelected
    ? {
        borderColor: '#a5d6a7',
        bgcolor: '#e8f5e9',
        color: '#2e7d32',
        '&.Mui-disabled': {
          borderColor: '#a5d6a7',
          bgcolor: '#e8f5e9',
          color: '#2e7d32',
          opacity: 1,
        },
      }
    : {
        bgcolor: '#1b5e20',
        color: 'white',
        '&:hover': { bgcolor: '#134e18' },
      };

export default function RepositoryPicker({ onSelectionChange }) {
  const [repositories, setRepositories] = useState([]);
  const [selectedRepository, setSelectedRepository] = useState(null);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 5, totalItems: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState('');

  const loadRepositories = async ({ bypassCache = false } = {}) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: '5',
        search: debouncedQuery,
      });
      if (bypassCache) params.set('refresh', 'true');
      const data = await apiRequest(`/api/repositories?${params}`);
      setRepositories(data.repositories);
      setSelectedRepository(data.selectedRepository);
      setPagination(data.pagination);
      if (data.pagination.page !== page) setPage(data.pagination.page);
      onSelectionChange(data.selectedRepository);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => { loadRepositories(); }, [page, debouncedQuery]);

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

  return (
    <Card sx={{ mt: 3 }}>
      <CardContent sx={{ p: { xs: 3, md: 4 }, '&:last-child': { pb: { xs: 3, md: 4 } } }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2} mb={3}>
          <Box>
            <Typography component="h2" variant="h5" fontWeight={700}>Choose a repository</Typography>
            <Typography color="text.secondary">Select the repository the automation bot should work with.</Typography>
          </Box>
          <Button variant="outlined" onClick={() => loadRepositories({ bypassCache: true })} disabled={loading}>Refresh</Button>
        </Stack>
        {selectedRepository && (
          <Alert severity="success" action={<Button color="inherit" size="small" onClick={clearSelection} disabled={savingId !== null}>Change</Button>} sx={{ mb: 3 }}>
            Selected <strong>{selectedRepository.fullName}</strong> · default branch: {selectedRepository.defaultBranch}
          </Alert>
        )}
        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        <TextField fullWidth size="small" label="Search all repositories" placeholder="Repository name, owner, or description" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} sx={{ mb: 3 }} />
        {loading ? (
          <Stack alignItems="center" spacing={2} py={5} role="status"><CircularProgress size={32} /><Typography color="text.secondary">Loading your GitHub repositories…</Typography></Stack>
        ) : repositories.length === 0 ? (
          <Box sx={{ py: 5, textAlign: 'center' }}><Typography fontWeight={600}>No repositories found</Typography><Typography variant="body2" color="text.secondary">Try another search or refresh your GitHub access.</Typography></Box>
        ) : (
          <>
            <Stack divider={<Divider flexItem />}>
              {repositories.map((repository) => {
                const isSelected = selectedRepository?.id === repository.id;
                const permission = repository.permissions?.admin ? 'Admin' : repository.permissions?.push ? 'Write' : 'Read';
                return (
                  <Stack key={repository.id} direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} justifyContent="space-between" spacing={2} sx={{ py: 2.5 }}>
                    <Box sx={{ minWidth: 0, flex: 1, pr: { sm: 2 } }}>
                      <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                        <Typography fontWeight={700} sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{repository.fullName}</Typography>
                        <Stack direction="row" spacing={1} sx={{ display: { xs: 'flex', sm: 'none' }, flexShrink: 0 }}>
                          <Link href={repository.htmlUrl} target="_blank" rel="noreferrer" variant="body2" fontWeight={700} underline="hover">Open ↗</Link>
                          <Chip label={repository.private ? 'Private' : 'Public'} size="small" variant="outlined" />
                          <Chip label={permission} size="small" color={permission === 'Read' ? 'default' : 'primary'} variant="outlined" />
                        </Stack>
                      </Stack>
                      <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>{repository.description || 'No description'} · {repository.defaultBranch}</Typography>
                    </Box>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ display: { xs: 'none', sm: 'flex' }, flexShrink: 0 }}>
                      <Link href={repository.htmlUrl} target="_blank" rel="noreferrer" variant="body2" fontWeight={700} underline="hover" sx={{ mr: 0.5 }}>Open ↗</Link>
                      <Chip label={repository.private ? 'Private' : 'Public'} size="small" variant="outlined" />
                      <Chip label={permission} size="small" color={permission === 'Read' ? 'default' : 'primary'} variant="outlined" />
                      <Button variant={isSelected ? 'outlined' : 'contained'} color="success" disabled={savingId !== null || isSelected} onClick={() => selectRepository(repository.id)} sx={repositoryButtonSx(isSelected)}>
                        {savingId === repository.id ? 'Selecting…' : isSelected ? 'Selected' : 'Select'}
                      </Button>
                    </Stack>
                    <Button variant={isSelected ? 'outlined' : 'contained'} color="success" disabled={savingId !== null || isSelected} onClick={() => selectRepository(repository.id)} sx={{ ...repositoryButtonSx(isSelected), display: { xs: 'inline-flex', sm: 'none' }, alignSelf: 'flex-start' }}>
                      {savingId === repository.id ? 'Selecting…' : isSelected ? 'Selected' : 'Select'}
                    </Button>
                  </Stack>
                );
              })}
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} alignItems="center" justifyContent="space-between" spacing={2} mt={3}>
              <Typography variant="body2" color="text.secondary">
                {pagination.totalItems} repositor{pagination.totalItems === 1 ? 'y' : 'ies'} found
              </Typography>
              <Pagination page={pagination.page} count={pagination.totalPages} onChange={(_, nextPage) => setPage(nextPage)} color="primary" disabled={loading} sx={{ ml: 'auto' }} />
            </Stack>
          </>
        )}
      </CardContent>
    </Card>
  );
}
