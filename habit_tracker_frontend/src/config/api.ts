/**
 * API Configuration
 * 
 * Centralized API endpoints configuration for the Habit Tracker application.
 * Change the BASE_URL if your backend is running on a different port.
 */

export const API_CONFIG = {
  // Base URL for the Django backend
  BASE_URL: 'http://localhost:8000',
  
  // API Endpoints
  ENDPOINTS: {
    PRELOADED_HABITS: '/api/habits/preloaded/',
    CREATE_HABIT: '/api/habits/create/',
    DASHBOARD: '/api/habits/dashboard/',
    STATS: '/api/habits/stats/',
    ACTIVE_HABITS: '/api/habits/active/',
  }
} as const;

// Helper function to build full URLs
export const buildUrl = (endpoint: keyof typeof API_CONFIG.ENDPOINTS): string => {
  return `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS[endpoint]}`;
};