/**
 * Centralized API configuration with initialization validation.
 *
 * This module provides a single source of truth for backend API URLs,
 * with environment validation in production to fail fast on misconfiguration.
 */

const REQUIRED_ENV_VARS = ['BACKEND_URL'] as const;

/**
 * Validates that required environment variables are set.
 * Called lazily on first API call, not at module load (to allow builds).
 */
let validated = false;
function validateEnvironment(): void {
  if (validated) return;
  validated = true;

  const missing = REQUIRED_ENV_VARS.filter(
    (key) => !process.env[key]
  );
  // Only throw in production AND at runtime (not during build)
  // Build phase: NEXT_PHASE === 'phase-production-build'
  const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';
  if (missing.length > 0 && process.env.NODE_ENV === 'production' && !isBuildPhase) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. ` +
      `Set BACKEND_URL in your deployment environment.`
    );
  }
}

/**
 * Base URL for the Python FastAPI backend.
 * - In development: defaults to http://localhost:8000
 * - In production: must be set via BACKEND_URL environment variable
 */
export const API_BASE_URL = process.env.BACKEND_URL ||
  (process.env.NODE_ENV === 'development' ? 'http://localhost:8000' : '');

/**
 * Get validated API base URL.
 * Validates environment on first call in production.
 */
export function getApiBaseUrl(): string {
  validateEnvironment();
  return API_BASE_URL;
}

/**
 * All backend API endpoints, centralised for consistency.
 * Use these in API route handlers to avoid hardcoded URLs.
 */
export const API_ENDPOINTS = {
  // Core endpoints
  chat: `${API_BASE_URL}/chat`,
  analyze: `${API_BASE_URL}/analyze`,
  score: `${API_BASE_URL}/score`,
  psychologyCost: `${API_BASE_URL}/psychology-cost`,
  priceCheck: `${API_BASE_URL}/price-check`,
  uploadScanImage: `${API_BASE_URL}/upload-scan-image`,

  // Profile endpoints
  profile: `${API_BASE_URL}/profile`,
  profileById: (userId: string) => `${API_BASE_URL}/profile/${userId}`,
  profileInsights: (userId: string) => `${API_BASE_URL}/profile/${userId}/insights`,

  // User-specific endpoints
  userScans: (userId: string) => `${API_BASE_URL}/users/${userId}/scans`,
  userScanById: (userId: string, scanId: string) =>
    `${API_BASE_URL}/users/${userId}/scans/${scanId}`,
  userEmotionalTax: (userId: string) => `${API_BASE_URL}/users/${userId}/emotional-tax`,
} as const;
