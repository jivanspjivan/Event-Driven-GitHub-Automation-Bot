import { useEffect, useState } from 'react';
import { Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Divider, InputAdornment, Link, Pagination, Snackbar, Stack, TextField, Typography } from '@mui/material';
import { apiRequest } from '../api';
import formatRepositoryName from '../utils/formatRepositoryName';
import RepositoryDescription from './RepositoryDescription';
import { CheckIcon, GitHubIcon, SearchIcon } from './RepositoryIcons';

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
        transition: 'background-color 160ms ease, transform 160ms ease',
        '&:hover': { bgcolor: '#134e18', transform: 'translateY(-1px)' },
      };

const fixedButtonSize = {
  height: 36,
  minHeight: 36,
  minWidth: 88,
  whiteSpace: 'nowrap',
  flexShrink: 0,
};

const repositoryControlHoverSx = {
  transition: 'background-color 160ms ease, color 160ms ease, transform 160ms ease',
  '&:hover': {
    bgcolor: '#eef4ff',
    color: '#174a7e',
    transform: 'translateY(-1px)',
  },
};

export default function RepositoryPicker({ onSelectionChange }) {
  const [repositories, setRepositories] = useState([]);
  const [selectedRepository, setSelectedRepository] = useState(null);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 5, totalItems: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  const loadRepositories = async ({ bypassCache = false } = {}) => {
    if (bypassCache) setRefreshing(true);
    else setLoading(true);
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
      if (bypassCache) setToast({ severity: 'success', message: 'Repositories refreshed successfully.' });
    } catch (requestError) {
      setError(requestError.message);
      if (bypassCache) setToast({ severity: 'error', message: `Refresh failed: ${requestError.message}` });
    } finally {
      if (bypassCache) setRefreshing(false);
      else setLoading(false);
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
      setToast({
        severity: 'success',
        message: `${formatRepositoryName(data.selectedRepository.name)} selected successfully.`,
      });
    } catch (requestError) {
      setError(requestError.message);
      setToast({ severity: 'error', message: `Repository selection failed: ${requestError.message}` });
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
        <Box sx={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', alignItems: 'start', columnGap: 2, mb: 3, width: '100%' }}>
          <Box>
            <Typography
              component="h2"
              sx={{
                color: '#123b66',
                fontSize: { xs: '1.35rem', sm: '1.65rem' },
                fontWeight: 800,
                lineHeight: 1.2,
                letterSpacing: '-0.02em',
              }}
            >
              Choose a repository
            </Typography>
            <Typography
              sx={{
                color: '#52657a',
                fontSize: { xs: '0.9rem', sm: '1rem' },
                fontWeight: 500,
                lineHeight: 1.6,
                mt: 0.5,
              }}
            >
              Select the repository the automation bot should work with.
            </Typography>
          </Box>
          <Button
            variant="outlined"
            onClick={() => loadRepositories({ bypassCache: true })}
            disabled={loading || refreshing}
            startIcon={refreshing ? <CircularProgress size={16} color="inherit" /> : undefined}
            sx={{ justifySelf: 'end', minWidth: 112 }}
          >
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </Button>
        </Box>
        {selectedRepository && (
          <Alert severity="success" action={<Button color="inherit" size="small" onClick={clearSelection} disabled={savingId !== null}>Change</Button>} sx={{ mb: 3 }}>
            Selected{' '}
            <Link href={selectedRepository.htmlUrl} target="_blank" rel="noreferrer" color="inherit" fontWeight={800} underline="hover">
              {formatRepositoryName(selectedRepository.name)} ↗
            </Link>
          </Alert>
        )}
        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        <TextField
          fullWidth
          size="small"
          label="Search repository by name"
          placeholder="Enter a repository name"
          value={query}
          onChange={(event) => { setQuery(event.target.value); setPage(1); }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start" sx={{ color: '#52657a' }}>
                  <SearchIcon />
                </InputAdornment>
              ),
            },
          }}
          sx={{ mb: 1 }}
        />
        <Typography variant="body2" color="text.secondary" sx={{ display: 'block', width: '100%', mb: 3, textAlign: 'right' }}>
          {pagination.totalItems} repositor{pagination.totalItems === 1 ? 'y' : 'ies'} found
        </Typography>
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
                  <Stack
                    key={repository.id}
                    direction={{ xs: 'column', sm: 'row' }}
                    alignItems={{ sm: 'center' }}
                    justifyContent="space-between"
                    spacing={2}
                    sx={{
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: isSelected ? '#b7e4c7' : 'transparent',
                      bgcolor: isSelected ? '#f8fff8' : 'transparent',
                      my: 0.35,
                      px: { xs: 1.5, sm: 2 },
                      py: 2.5,
                      transition: 'background-color 180ms ease, border-color 180ms ease, box-shadow 180ms ease, transform 180ms ease',
                      ...(isSelected && { boxShadow: '0 3px 12px rgba(46, 125, 50, 0.06)' }),
                      '&:hover': {
                        bgcolor: isSelected ? '#f1f8f2' : '#f7faff',
                        boxShadow: isSelected
                          ? '0 6px 18px rgba(46, 125, 50, 0.1)'
                          : '0 6px 18px rgba(23, 74, 126, 0.1)',
                        transform: 'translateY(-2px)',
                      },
                    }}
                  >
                    <Box sx={{ minWidth: 0, flex: 1, pr: { sm: 2 } }}>
                      <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                        <Box sx={{ color: '#24292f', display: 'flex', flexShrink: 0 }}>
                          <GitHubIcon />
                        </Box>
                        <Typography
                          fontWeight={700}
                          sx={{
                            color: '#174a7e',
                            fontSize: { xs: '1.15rem', sm: '1.3rem' },
                            lineHeight: 1.25,
                            letterSpacing: '0.01em',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            transition: 'color 160ms ease, transform 160ms ease',
                            '&:hover': {
                              color: '#0d47a1',
                              transform: 'translateX(2px)',
                            },
                          }}
                        >
                          {formatRepositoryName(repository.name)}
                        </Typography>
                        <Stack direction="row" spacing={1} sx={{ display: { xs: 'flex', sm: 'none' }, flexShrink: 0 }}>
                          <Link href={repository.htmlUrl} target="_blank" rel="noreferrer" variant="body2" fontWeight={700} underline="none" sx={{ borderRadius: 1, px: 0.5, ...repositoryControlHoverSx }}>Open ↗</Link>
                          <Chip label={repository.private ? 'Private' : 'Public'} size="small" variant="outlined" sx={repositoryControlHoverSx} />
                          <Chip label={permission} size="small" color={permission === 'Read' ? 'default' : 'primary'} variant="outlined" sx={repositoryControlHoverSx} />
                        </Stack>
                      </Stack>
                      <RepositoryDescription
                        description={repository.description}
                        defaultBranch={repository.defaultBranch}
                        techStack={repository.techStack}
                        latestCommit={repository.latestCommit}
                      />
                    </Box>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ display: { xs: 'none', sm: 'flex' }, flexShrink: 0, alignSelf: 'flex-start' }}>
                      <Link
                        href={repository.htmlUrl}
                        target="_blank"
                        rel="noreferrer"
                        variant="body2"
                        fontWeight={700}
                        underline="none"
                        sx={{ borderRadius: 1, mr: 0.5, px: 0.75, py: 0.45, ...repositoryControlHoverSx }}
                      >
                        Open ↗
                      </Link>
                      <Chip label={repository.private ? 'Private' : 'Public'} size="small" variant="outlined" sx={repositoryControlHoverSx} />
                      <Chip label={permission} size="small" color={permission === 'Read' ? 'default' : 'primary'} variant="outlined" sx={repositoryControlHoverSx} />
                      <Button variant={isSelected ? 'outlined' : 'contained'} color="success" disabled={savingId !== null || isSelected} onClick={() => selectRepository(repository.id)} startIcon={isSelected ? <CheckIcon /> : undefined} sx={{ ...repositoryButtonSx(isSelected), ...fixedButtonSize }}>
                        {savingId === repository.id ? 'Selecting…' : isSelected ? 'Selected' : 'Select'}
                      </Button>
                    </Stack>
                    <Button variant={isSelected ? 'outlined' : 'contained'} color="success" disabled={savingId !== null || isSelected} onClick={() => selectRepository(repository.id)} startIcon={isSelected ? <CheckIcon /> : undefined} sx={{ ...repositoryButtonSx(isSelected), ...fixedButtonSize, display: { xs: 'inline-flex', sm: 'none' }, alignSelf: 'flex-start' }}>
                      {savingId === repository.id ? 'Selecting…' : isSelected ? 'Selected' : 'Select'}
                    </Button>
                  </Stack>
                );
              })}
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} alignItems="center" spacing={2} mt={3}>
              <Pagination page={pagination.page} count={pagination.totalPages} onChange={(_, nextPage) => setPage(nextPage)} color="primary" disabled={loading} sx={{ ml: 'auto' }} />
            </Stack>
          </>
        )}
      </CardContent>
      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={3500}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        onClose={() => setToast(null)}
      >
        <Alert severity={toast?.severity || 'success'} variant="filled" onClose={() => setToast(null)} sx={{ width: '100%' }}>
          {toast?.message}
        </Alert>
      </Snackbar>
    </Card>
  );
}
