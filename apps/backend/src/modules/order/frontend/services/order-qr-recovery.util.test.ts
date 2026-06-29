import * as assert from 'node:assert/strict';
import { test } from 'node:test';
import { getTicketItemsMissingQr } from './order-qr-recovery.util';

test('getTicketItemsMissingQr only returns ticket items missing QR data', () => {
  const result = getTicketItemsMissingQr(
    [
      {
        id: 101,
        orderId: 55,
        productId: 130,
        productType: 'TICKET',
        qrCode: null,
        imageQrCode: null,
      },
      {
        id: 102,
        orderId: 55,
        productId: 130,
        productType: 'TICKET',
        qrCode: 'existing-qr',
        imageQrCode: 'https://cdn.example.com/qr.png',
      },
      {
        id: 103,
        orderId: 55,
        productId: 140,
        productType: 'PHYSICAL',
        qrCode: null,
        imageQrCode: null,
      },
    ] as any[],
    1700000000000
  );

  assert.deepEqual(result, [
    {
      id: 101,
      qrText: 'TICKET-55-130-1700000000000',
      needsImageUpload: true,
    },
  ]);
});
