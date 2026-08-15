import { describe, expect, it } from 'vitest';
import { resolveRequiredPermissions } from './permission-route';

const permissions = {
  '/settings': ['ACCESS_ADMIN_SETTINGS'],
  '/settings/advertising-popups': ['MANAGE_SETTINGS'],
};

describe('resolveRequiredPermissions', () => {
  it.each([
    ['/settings/advertising-popups', ['MANAGE_SETTINGS']],
    ['/settings/advertising-popups/new', ['MANAGE_SETTINGS']],
    ['/settings/advertising-popups/42', ['MANAGE_SETTINGS']],
  ])(
    'inherits the longest matching route permissions for %s',
    (path, expected) => {
      expect(resolveRequiredPermissions(path, permissions)).toEqual(expected);
    }
  );

  it('does not match unrelated routes', () => {
    expect(resolveRequiredPermissions('/products', permissions)).toEqual([]);
  });
});
