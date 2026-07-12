import { Box } from '@mui/material';

export default function PageShell({ children, centered = false }) {
  return (
    <Box component="main" sx={{ minHeight: '100vh', display: centered ? 'grid' : 'block', placeItems: centered ? 'center' : undefined, py: centered ? 5 : { xs: 3, md: 5 } }}>
      {children}
    </Box>
  );
}
