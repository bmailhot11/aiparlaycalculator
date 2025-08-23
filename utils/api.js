// API utility to handle proper URL construction
export function getApiUrl(endpoint) {
  // In production, always use the www subdomain for API calls
  if (typeof window !== 'undefined' && window.location.hostname === 'betchekr.com') {
    return `https://www.betchekr.com${endpoint}`;
  }
  
  // For local development and www.betchekr.com, use relative URLs
  return endpoint;
}

// Wrapper for fetch that handles the API URL properly
export async function apiFetch(endpoint, options = {}) {
  const url = getApiUrl(endpoint);
  return fetch(url, options);
}