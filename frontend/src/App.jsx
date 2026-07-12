import { useEffect, useState } from 'react';
import { API_URL, getCurrentUser } from './api';
import { LoadingScreen, LoginPage } from './components/AuthScreens';
import Dashboard from './components/Dashboard';

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
