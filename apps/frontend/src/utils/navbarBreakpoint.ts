export const TOP_MENU_BREAKPOINT = 1400;

export type TopMenuMode = 'desktop' | 'mobile' | 'unknown';

export function resolveTopMenuMode(width?: number | null): TopMenuMode {
  if (typeof width !== 'number' || Number.isNaN(width)) {
    return 'unknown';
  }

  return width >= TOP_MENU_BREAKPOINT ? 'desktop' : 'mobile';
}
