import { describe, expect, it } from 'vitest';

import { Mail, Phone } from 'lucide-vue-next';

import { resolveFooterContactIcon } from './footerContactIcon';

describe('resolveFooterContactIcon', () => {
  it('returns stable svg icon components for footer branch contacts', () => {
    expect(resolveFooterContactIcon('phone')).toBe(Phone);
    expect(resolveFooterContactIcon('email')).toBe(Mail);
  });
});
