import { Capacitor } from '@capacitor/core';

// Railway backend URL
const RAILWAY_API_URL = 'https://clearmind-production-f34a.up.railway.app';

// Get the appropriate API base URL based on platform
export function getApiBaseUrl() {
  // On native platforms, use the full Railway URL
  if (Capacitor.getPlatform() !== 'web') {
    return RAILWAY_API_URL;
  }

  // On web, use relative URL (works with vite proxy in dev, or same-origin in prod)
  return '';
}

// API endpoints
export const API_ENDPOINTS = {
  analyze: () => `${getApiBaseUrl()}/api/analyze`,
  exercises: () => `${getApiBaseUrl()}/api/exercises`,
  auth: {
    login: () => `${getApiBaseUrl()}/api/auth/login`,
    register: () => `${getApiBaseUrl()}/api/auth/register`,
    me: () => `${getApiBaseUrl()}/api/auth/me`,
  }
};

// Helper for making API requests with error handling
export async function apiRequest(endpoint, options = {}) {
  const url = typeof endpoint === 'function' ? endpoint() : endpoint;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    // If offline and it's a network error, let the caller handle it
    if (!navigator.onLine || error.message === 'Failed to fetch') {
      throw new Error('offline');
    }
    throw error;
  }
}

export default { getApiBaseUrl, API_ENDPOINTS, apiRequest };
