import { describe, expect, it } from 'vitest';
import { resolveTicketMobileAction } from './ticketDetailMobile';

describe('resolveTicketMobileAction', () => {
  it('returns hidden outside mobile or while buy box is visible', () => {
    expect(resolveTicketMobileAction({
      isMobile: false,
      buyBoxInView: false,
      hasProduct: true,
      hasCartProduct: true,
      totalTickets: 2,
      hasSelectedDate: true,
      shouldShowPriceRequest: false,
    })).toBe('hidden');

    expect(resolveTicketMobileAction({
      isMobile: true,
      buyBoxInView: true,
      hasProduct: true,
      hasCartProduct: true,
      totalTickets: 2,
      hasSelectedDate: true,
      shouldShowPriceRequest: false,
    })).toBe('hidden');
  });

  it('returns request-price when the page should request a quote', () => {
    expect(resolveTicketMobileAction({
      isMobile: true,
      buyBoxInView: false,
      hasProduct: true,
      hasCartProduct: false,
      totalTickets: 0,
      hasSelectedDate: false,
      shouldShowPriceRequest: true,
    })).toBe('request-price');
  });

  it('returns add-to-cart only after ticket quantity and date are selected', () => {
    expect(resolveTicketMobileAction({
      isMobile: true,
      buyBoxInView: false,
      hasProduct: true,
      hasCartProduct: true,
      totalTickets: 2,
      hasSelectedDate: true,
      shouldShowPriceRequest: false,
    })).toBe('add-to-cart');
  });

  it('falls back to scroll-to-booking when the user still needs to complete the form', () => {
    expect(resolveTicketMobileAction({
      isMobile: true,
      buyBoxInView: false,
      hasProduct: true,
      hasCartProduct: true,
      totalTickets: 0,
      hasSelectedDate: false,
      shouldShowPriceRequest: false,
    })).toBe('scroll-to-booking');
  });
});
