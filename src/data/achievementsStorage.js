export const GLOBAL_ACHIEVEMENTS_KEY = 'gsm_achievements_global_v1';

export function readGlobalAchievements() {
  try {
    const raw = localStorage.getItem(GLOBAL_ACHIEVEMENTS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed;
  } catch {
    return {};
  }
}

export function writeGlobalAchievements(map) {
  try {
    localStorage.setItem(GLOBAL_ACHIEVEMENTS_KEY, JSON.stringify(map || {}));
  } catch {
    // ignore
  }
}
