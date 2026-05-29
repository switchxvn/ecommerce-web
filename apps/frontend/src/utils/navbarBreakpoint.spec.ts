import { describe, expect, it } from 'vitest';

import { resolveTopMenuMode, TOP_MENU_BREAKPOINT } from './navbarBreakpoint';

describe('resolveTopMenuMode', () => {
  it('returns unknown until the client viewport is available', () => {
    expect(resolveTopMenuMode(null)).toBe('unknown');
    expect(resolveTopMenuMode(undefined)).toBe('unknown');
  });

  it('uses the mobile menu below the top menu breakpoint', () => {
    expect(resolveTopMenuMode(TOP_MENU_BREAKPOINT - 1)).toBe('mobile');
  });

  it('uses the desktop menu at and above the top menu breakpoint', () => {
    expect(resolveTopMenuMode(TOP_MENU_BREAKPOINT)).toBe('desktop');
    expect(resolveTopMenuMode(TOP_MENU_BREAKPOINT + 200)).toBe('desktop');
  });
});
