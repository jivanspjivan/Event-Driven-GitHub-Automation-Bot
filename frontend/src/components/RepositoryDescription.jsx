import { useState } from 'react';
import { Box, Chip, Stack, Typography } from '@mui/material';
import { ClockIcon, CommitMessageIcon } from './RepositoryIcons';

const DESCRIPTION_LIMIT = 110;

const formatCommitDate = (value) => {
  if (!value) return 'Date unavailable';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value));
};

export default function RepositoryDescription({ description, defaultBranch, techStack = [], latestCommit }) {
  const [expanded, setExpanded] = useState(false);
  const text = description || 'No description provided.';
  const canExpand = text.length > DESCRIPTION_LIMIT;
  const toggleDescription = () => {
    if (canExpand) setExpanded((current) => !current);
  };

  const handleDescriptionKeyDown = (event) => {
    if (canExpand && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      toggleDescription();
    }
  };

  return (
    <>
      <Typography
        variant="body2"
        color="text.secondary"
        role={canExpand ? 'button' : undefined}
        tabIndex={canExpand ? 0 : undefined}
        aria-expanded={canExpand ? expanded : undefined}
        title={canExpand ? (expanded ? 'Click to collapse description' : 'Click to expand description') : undefined}
        onClick={toggleDescription}
        onKeyDown={handleDescriptionKeyDown}
        sx={{
          display: expanded ? 'block' : '-webkit-box',
          WebkitBoxOrient: expanded ? undefined : 'vertical',
          WebkitLineClamp: expanded ? undefined : 2,
          minHeight: expanded ? undefined : '2.86em',
          overflow: expanded ? 'visible' : 'hidden',
          overflowWrap: 'anywhere',
          cursor: canExpand ? 'pointer' : 'default',
          userSelect: canExpand ? 'none' : 'auto',
          '&:hover': canExpand ? { color: 'text.primary' } : undefined,
          '&:focus-visible': canExpand ? { borderRadius: 1, outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 } : undefined,
        }}
      >
        {text}
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' },
          columnGap: 3,
          rowGap: 1.5,
          mt: 1.25,
          width: '100%',
        }}
      >
        <Stack spacing={0.15} alignItems="flex-start">
          <Typography component="span" fontWeight={800} sx={{ color: '#6d28d9', fontSize: '0.82rem' }}>Default branch</Typography>
          <Typography component="span" color="text.secondary" sx={{ fontSize: '0.75rem', lineHeight: 1.3 }}>{defaultBranch}</Typography>
        </Stack>
        <Stack spacing={0.5} alignItems="flex-start" sx={{ minWidth: 0 }}>
          <Typography component="span" fontWeight={800} sx={{ color: '#6d28d9', fontSize: '0.82rem' }}>Tech stack</Typography>
          {techStack.length ? (
            <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap">
              {techStack.slice(0, 3).map((technology) => (
                <Chip
                  key={technology}
                  label={technology}
                  size="small"
                  sx={{
                    height: 22,
                    borderRadius: '7px',
                    bgcolor: '#ede9fe',
                    color: '#5b21b6',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    '& .MuiChip-label': { px: 1 },
                  }}
                />
              ))}
            </Stack>
          ) : (
            <Typography component="span" color="text.secondary" sx={{ fontSize: '0.75rem', lineHeight: 1.3 }}>Not detected</Typography>
          )}
        </Stack>
        <Stack spacing={0.45} alignItems="flex-start" sx={{ minWidth: 0 }}>
          <Typography component="span" fontWeight={800} sx={{ color: '#6d28d9', fontSize: '0.82rem' }}>Last commit</Typography>
          {latestCommit ? (
            <>
              <Stack direction="row" spacing={0.6} alignItems="center" sx={{ minWidth: 0, width: '100%', color: 'text.secondary' }}>
                <Box sx={{ display: 'flex', flexShrink: 0 }}><CommitMessageIcon /></Box>
                <Typography component="span" title={latestCommit.message} sx={{ fontSize: '0.75rem', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {latestCommit.message}
                </Typography>
              </Stack>
              <Stack direction="row" spacing={0.6} alignItems="center" sx={{ color: 'text.secondary' }}>
                <Box sx={{ display: 'flex', flexShrink: 0 }}><ClockIcon /></Box>
                <Typography component="span" sx={{ fontSize: '0.72rem', lineHeight: 1.3 }}>
                  {formatCommitDate(latestCommit.committedAt)}
                </Typography>
              </Stack>
            </>
          ) : (
            <Typography component="span" color="text.secondary" sx={{ fontSize: '0.75rem' }}>Not available</Typography>
          )}
        </Stack>
      </Box>
    </>
  );
}
