import { Alert, Snackbar } from '@mui/material';

export default function FeedbackToast({ toast, onClose }) {
  return (
    <Snackbar
      open={Boolean(toast)}
      autoHideDuration={3500}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      onClose={onClose}
    >
      <Alert
        severity={toast?.severity || 'success'}
        variant="filled"
        onClose={onClose}
        sx={{ width: '100%', fontWeight: 600 }}
      >
        {toast?.message}
      </Alert>
    </Snackbar>
  );
}
