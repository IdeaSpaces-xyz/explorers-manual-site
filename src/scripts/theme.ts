// System, Light, Dark, in the same order as the landing's switch.
const KEY = 'manual-theme';
const NEXT = { system: 'light', light: 'dark', dark: 'system' } as const;
type Theme = keyof typeof NEXT;
const LABEL: Record<Theme, string> = { system: 'System', light: 'Light', dark: 'Dark' };
const BG = { light: '#ffffff', dark: '#050505' };

const button = document.querySelector<HTMLButtonElement>('.theme');
const root = document.documentElement;
const metas = {
  light: document.querySelector<HTMLMetaElement>('meta[name="theme-color"][media*="light"]'),
  dark: document.querySelector<HTMLMetaElement>('meta[name="theme-color"][media*="dark"]'),
};

function stored(): Theme {
  try {
    const value = localStorage.getItem(KEY);
    if (value === 'light' || value === 'dark') return value;
  } catch {
    // Storage can be unavailable; the switch still works for this page.
  }
  return 'system';
}

let theme = stored();

function apply() {
  root.classList.toggle('light', theme === 'light');
  root.classList.toggle('dark', theme === 'dark');
  if (metas.light) metas.light.content = theme === 'dark' ? BG.dark : BG.light;
  if (metas.dark) metas.dark.content = theme === 'light' ? BG.light : BG.dark;
  if (button) {
    button.textContent = LABEL[theme];
    button.title = `Theme: ${theme}. Click for ${NEXT[theme]}.`;
    button.setAttribute('aria-label', `Theme: ${theme}. Switch to ${NEXT[theme]}.`);
  }
}

if (button) {
  button.hidden = false;
  button.addEventListener('click', () => {
    theme = NEXT[theme];
    try {
      if (theme === 'system') localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, theme);
    } catch {
      // As above.
    }
    apply();
  });
}
apply();
