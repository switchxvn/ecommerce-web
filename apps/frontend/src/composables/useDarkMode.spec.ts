import { resolveThemeMode } from './useDarkMode';

describe('resolveThemeMode', () => {
  it('defaults to light mode when no preference is stored', () => {
    expect(resolveThemeMode(null, true)).toEqual({
      mode: 'light',
      isDark: false,
    });
  });

  it('uses explicit dark mode when stored', () => {
    expect(resolveThemeMode('dark', false)).toEqual({
      mode: 'dark',
      isDark: true,
    });
  });

  it('uses system preference only for auto mode', () => {
    expect(resolveThemeMode('auto', true)).toEqual({
      mode: 'auto',
      isDark: true,
    });
    expect(resolveThemeMode('auto', false)).toEqual({
      mode: 'auto',
      isDark: false,
    });
  });

});
