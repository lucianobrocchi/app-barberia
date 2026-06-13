export const ONBOARDING_KEY = 'adda_onboarding_seen_v1';

export function hasSeenOnboarding() {
  try {
    return localStorage.getItem(ONBOARDING_KEY) === '1';
  } catch {
    return true; // si no hay storage, no molestamos
  }
}

export function markOnboardingSeen() {
  try {
    localStorage.setItem(ONBOARDING_KEY, '1');
  } catch {
    /* ignore */
  }
}
