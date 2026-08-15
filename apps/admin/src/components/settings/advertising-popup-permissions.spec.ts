import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import { describe, expect, it } from 'vitest';

const read = (relativePath: string) =>
  readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8');

describe('advertising popup permission contract', () => {
  it('uses backend permission constants for every popup capability', () => {
    const constants = read(
      '../../../../backend/src/modules/auth/constants/permissions.constant.ts'
    );
    for (const code of ['VIEW_SETTINGS', 'EDIT_SETTINGS', 'DELETE_SETTINGS']) {
      expect(constants).toContain(`${code}: '${code}'`);
    }
  });

  it('uses VIEW_SETTINGS for navigation, middleware, and the list page', () => {
    const settings = read('../../pages/settings/index.vue');
    const middleware = read('../../middleware/permission.ts');
    const list = read('../../pages/settings/advertising-popups/index.vue');

    expect(settings).toMatch(
      /group: 'advertising-popup',[\s\S]{0,180}permission: 'VIEW_SETTINGS'/
    );
    expect(middleware).toContain(
      "'/settings/advertising-popups': ['VIEW_SETTINGS']"
    );
    expect(list).toContain("usePagePermissions(['VIEW_SETTINGS'])");
    expect(list).not.toContain('MANAGE_SETTINGS');
  });

  it('requires EDIT_SETTINGS on create and edit pages', () => {
    for (const path of [
      '../../pages/settings/advertising-popups/new.vue',
      '../../pages/settings/advertising-popups/[id].vue',
    ]) {
      const source = read(path);
      expect(source).toContain("usePagePermissions(['EDIT_SETTINGS'])");
      expect(source).not.toContain('MANAGE_SETTINGS');
    }
  });

  it('gates list mutations with EDIT_SETTINGS and DELETE_SETTINGS', () => {
    const list = read('../../pages/settings/advertising-popups/index.vue');
    expect(list).toContain("hasPermission('EDIT_SETTINGS')");
    expect(list).toContain("hasPermission('DELETE_SETTINGS')");
    expect(list).toContain('v-if="canEdit"');
    expect(list).toContain('v-if="canDelete"');
  });
});
