const STORAGE_KEY = 'onboarding-completed';

/** Ya vio (o saltó) el tutorial guiado -- no debe aparecer solo de nuevo. */
export function hasSeenOnboarding(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function markOnboardingSeen(): void {
  try {
    localStorage.setItem(STORAGE_KEY, '1');
  } catch {
    // localStorage no disponible (modo privado, etc.): reaparecerá la próxima vez, sin romper nada.
  }
}
