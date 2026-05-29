import { describe, expect, it } from 'vitest';
import { serializeVietnamTimestamp } from './post-timestamp.util';

describe('serializeVietnamTimestamp', () => {
  it('converts a UTC-runtime parsed timestamp to the correct UTC ISO string', () => {
    const parsedTimestamp = {
      getTime: () => Date.parse('2026-05-24T08:26:29.619Z'),
      getTimezoneOffset: () => 0,
    } as Date;

    expect(serializeVietnamTimestamp(parsedTimestamp)).toBe('2026-05-24T01:26:29.619Z');
  });

  it('converts a Vietnam-runtime parsed timestamp to the same UTC ISO string', () => {
    const parsedTimestamp = {
      getTime: () => Date.parse('2026-05-24T01:26:29.619Z'),
      getTimezoneOffset: () => -420,
    } as Date;

    expect(serializeVietnamTimestamp(parsedTimestamp)).toBe('2026-05-24T01:26:29.619Z');
  });
});
