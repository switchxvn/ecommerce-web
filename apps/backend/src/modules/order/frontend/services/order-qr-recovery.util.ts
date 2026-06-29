export interface TicketQrCandidate {
  id: number;
  orderId: number;
  productId: number;
  productType: string;
  qrCode?: string | null;
  imageQrCode?: string | null;
}

export interface MissingTicketQrItem {
  id: number;
  qrText: string;
  needsImageUpload: boolean;
}

export function getTicketItemsMissingQr(
  items: TicketQrCandidate[],
  timestamp: number = Date.now()
): MissingTicketQrItem[] {
  return items
    .filter((item) => item.productType === 'TICKET' && (!item.qrCode || !item.imageQrCode))
    .map((item) => ({
      id: item.id,
      qrText: item.qrCode || `TICKET-${item.orderId}-${item.productId}-${timestamp}`,
      needsImageUpload: !item.imageQrCode,
    }));
}
