const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';

export async function fetchHealthStatus() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/health`);
    return await res.json();
  } catch (err) {
    console.warn('Backend server not reachable at', BACKEND_URL);
    return null;
  }
}

export async function fetchPresets() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/presets`);
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.warn('Failed to fetch presets from backend');
    return [];
  }
}
