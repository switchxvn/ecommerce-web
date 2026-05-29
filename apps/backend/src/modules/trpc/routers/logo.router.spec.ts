import { describe, expect, it } from 'vitest';

import { resolvePublicLogoByType } from './logo.router';

describe('resolvePublicLogoByType', () => {
  const mainLogo = {
    id: 1,
    type: 'main',
    lightModeUrl: 'https://cdn.example.com/logo.png',
  };

  it('does not fall back to the main logo when favicon is missing', async () => {
    const findOneByType = async (type: string) => (type === 'favicon' ? null : mainLogo);

    await expect(resolvePublicLogoByType(findOneByType, 'favicon')).resolves.toBeNull();
  });

  it('still falls back to the main logo for other missing logo types', async () => {
    const findOneByType = async (type: string) => {
      if (type === 'main_mobile') return null;
      if (type === 'main') return mainLogo;
      return null;
    };

    await expect(resolvePublicLogoByType(findOneByType, 'main_mobile')).resolves.toEqual(mainLogo);
  });
});
