export type TicketMobileAction =
  | 'hidden'
  | 'scroll-to-booking'
  | 'add-to-cart'
  | 'request-price';

interface ResolveTicketMobileActionInput {
  isMobile: boolean;
  buyBoxInView: boolean;
  hasProduct: boolean;
  hasCartProduct: boolean;
  totalTickets: number;
  hasSelectedDate: boolean;
  shouldShowPriceRequest: boolean;
}

export function resolveTicketMobileAction(
  input: ResolveTicketMobileActionInput,
): TicketMobileAction {
  if (!input.isMobile || input.buyBoxInView || !input.hasProduct) {
    return 'hidden';
  }

  if (input.shouldShowPriceRequest) {
    return 'request-price';
  }

  if (input.hasCartProduct && input.totalTickets > 0 && input.hasSelectedDate) {
    return 'add-to-cart';
  }

  return 'scroll-to-booking';
}
