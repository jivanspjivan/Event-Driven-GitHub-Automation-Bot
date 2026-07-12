export const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || 'Something went wrong. Please try again.');
  }

  return response.status === 204 ? null : response.json();
}

export const getCurrentUser = async () => {
  const response = await fetch(`${API_URL}/api/auth/me`, { credentials: 'include' });
  if (response.status === 401) return null;
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || 'Could not check your GitHub session.');
  }
  const body = await response.json();
  return body.user;
};

export const automationApi = {
  listRules: () => apiRequest('/api/automations'),
  createRule: (rule) =>
    apiRequest('/api/automations', { method: 'POST', body: JSON.stringify(rule) }),
  updateRule: (ruleId, changes) =>
    apiRequest(`/api/automations/${ruleId}`, {
      method: 'PATCH',
      body: JSON.stringify(changes),
    }),
  deleteRule: (ruleId) => apiRequest(`/api/automations/${ruleId}`, { method: 'DELETE' }),
  listDeliveries: (page = 1, pageSize = 5) =>
    apiRequest(`/api/automations/deliveries?page=${page}&pageSize=${pageSize}`),
};
