export const DEFAULT_PREFERENCES = { font: 'be-vietnam', theme: 'light' };

export function loadPreferences(storage) {
  try {
    const saved = JSON.parse(storage.getItem('research-navigator-preferences') || '{}');
    return {
      font: ['be-vietnam', 'inter', 'segoe', 'system', 'arial', 'tahoma'].includes(saved.font) ? saved.font : DEFAULT_PREFERENCES.font,
      theme: ['light', 'dark', 'system'].includes(saved.theme) ? saved.theme : DEFAULT_PREFERENCES.theme,
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}
