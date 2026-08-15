import { describe, expect, it } from 'vitest';
import {
  createDefaultPopupForm,
  popupToFormState,
  toPopupMutationInput,
  type AdvertisingPopup,
} from './advertising-popup';

describe('advertising popup form helpers', () => {
  it('creates the approved inactive defaults', () => {
    expect(createDefaultPopupForm()).toEqual({
      name: '',
      title: 'Ưu đãi đặt vé hôm nay',
      content:
        '🎫 Đặt vé trực tuyến nhanh chóng\nGiữ chỗ ngay để không bỏ lỡ hành trình của bạn.',
      ctaLabel: 'Đặt vé ngay',
      ctaUrl: '/order-ticket',
      isActive: false,
      startsAt: '',
      endsAt: '',
    });
  });

  it('trims required fields, preserves content formatting, and normalizes blank dates', () => {
    const input = toPopupMutationInput({
      ...createDefaultPopupForm(),
      name: '  Mùa hè  ',
      title: '  Săn vé  ',
      content: '  🎉 Dòng một\nDòng hai  ',
      ctaLabel: '  Đặt ngay  ',
      ctaUrl: '  /order-ticket  ',
      startsAt: '   ',
      endsAt: '',
    });

    expect(input).toMatchObject({
      name: 'Mùa hè',
      title: 'Săn vé',
      content: '  🎉 Dòng một\nDòng hai  ',
      ctaLabel: 'Đặt ngay',
      ctaUrl: '/order-ticket',
      startsAt: null,
      endsAt: null,
    });
  });

  it('converts populated local datetimes to Date values', () => {
    const input = toPopupMutationInput({
      ...createDefaultPopupForm(),
      startsAt: '2026-08-14T09:30',
      endsAt: '2026-08-15T18:45',
    });

    expect(input.startsAt).toBeInstanceOf(Date);
    expect(input.endsAt).toBeInstanceOf(Date);
  });

  it('hydrates an edit form using datetime-local values', () => {
    const popup: AdvertisingPopup = {
      id: 7,
      name: 'Campaign',
      title: 'Title',
      content: 'Line 1\nLine 2',
      ctaLabel: 'Go',
      ctaUrl: '/go',
      isActive: true,
      startsAt: '2026-08-14T02:30:00.000Z',
      endsAt: null,
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-02T00:00:00.000Z',
    };

    const result = popupToFormState(popup);
    expect(result).toMatchObject({
      name: 'Campaign',
      content: 'Line 1\nLine 2',
      endsAt: '',
    });
    expect(result.startsAt).toMatch(/^2026-08-14T\d{2}:30$/);
  });

  it('formats a constructed local date without shifting its wall-clock time', () => {
    const localDate = new Date(2026, 7, 14, 9, 30);
    const result = popupToFormState({
      id: 1,
      name: 'Campaign',
      title: 'Title',
      content: 'Content',
      ctaLabel: 'Go',
      ctaUrl: '/go',
      isActive: false,
      startsAt: localDate,
      endsAt: null,
      createdAt: localDate,
      updatedAt: localDate,
    });

    expect(result.startsAt).toBe('2026-08-14T09:30');
  });

  it('uses a blank datetime-local value for invalid server dates', () => {
    const popup = {
      id: 1,
      name: 'Campaign',
      title: 'Title',
      content: 'Content',
      ctaLabel: 'Go',
      ctaUrl: '/go',
      isActive: false,
      startsAt: 'invalid-date',
      endsAt: null,
      createdAt: 'invalid-date',
      updatedAt: 'invalid-date',
    };

    expect(popupToFormState(popup).startsAt).toBe('');
  });
});
