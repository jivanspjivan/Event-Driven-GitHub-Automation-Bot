import { useState } from 'react';
import { Button, Typography } from '@mui/material';

const DESCRIPTION_LIMIT = 110;

export default function RepositoryDescription({ description, defaultBranch }) {
  const [expanded, setExpanded] = useState(false);
  const text = description || 'No description provided.';
  const canExpand = text.length > DESCRIPTION_LIMIT;
  const visibleText = canExpand && !expanded ? `${text.slice(0, DESCRIPTION_LIMIT).trimEnd()}…` : text;

  return (
    <>
      <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
        {visibleText}
        {canExpand && (
          <Button
            size="small"
            variant="text"
            onClick={() => setExpanded((current) => !current)}
            sx={{ minWidth: 0, ml: 0.75, p: 0, verticalAlign: 'baseline', fontWeight: 700 }}
          >
            {expanded ? 'See less' : 'See more'}
          </Button>
        )}
      </Typography>
      <Typography variant="caption" color="text.disabled">Default branch: {defaultBranch}</Typography>
    </>
  );
}
