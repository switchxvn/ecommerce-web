import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TRPCError } from '@trpc/server';
import { advertisingPopupRouter, popupWriteSchema } from './advertising-popup.router';

const writeInput = {
  name: 'Homepage promotion',
  title: 'Summer sale',
  content: 'Save today',
  ctaLabel: 'Shop now',
  ctaUrl: '/products',
  startsAt: null,
  endsAt: null,
};

describe('popupWriteSchema', () => {
  it.each([
    '/products',
    '/products?featured=true',
    '/order-ticket?x=1',
    'https://example.com/deals',
    'https://example.com/path?x=1',
  ])(
    'accepts safe CTA URL %s',
    (ctaUrl) => expect(popupWriteSchema.safeParse({ ...writeInput, ctaUrl }).success).toBe(true),
  );

  it.each(['//evil.example', 'http://example.com', 'javascript:alert(1)', 'mailto:test@example.com'])(
    'rejects unsafe CTA URL %s',
    (ctaUrl) => expect(popupWriteSchema.safeParse({ ...writeInput, ctaUrl }).success).toBe(false),
  );

  it.each(['/\\evil.example/path', '/products\\checkout', '\\evil'])(
    'rejects internal paths containing a backslash: %s',
    (ctaUrl) => expect(popupWriteSchema.safeParse({ ...writeInput, ctaUrl }).success).toBe(false),
  );

  it.each(['https:///evil', 'https://?next=/x', 'https://#fragment'])(
    'rejects malformed HTTPS URL %s',
    (ctaUrl) => expect(popupWriteSchema.safeParse({ ...writeInput, ctaUrl }).success).toBe(false),
  );

  it.each(['name', 'title', 'content', 'ctaLabel', 'ctaUrl'] as const)(
    'rejects an empty trimmed %s',
    (field) => expect(popupWriteSchema.safeParse({ ...writeInput, [field]: '   ' }).success).toBe(false),
  );

  it('rejects a schedule whose end is not after its start', () => {
    const startsAt = new Date('2026-08-14T12:00:00Z');
    expect(popupWriteSchema.safeParse({ ...writeInput, startsAt, endsAt: startsAt }).success).toBe(false);
  });

  it('accepts omitted schedule dates', () => {
    const { startsAt: _startsAt, endsAt: _endsAt, ...withoutDates } = writeInput;
    expect(popupWriteSchema.safeParse(withoutDates).success).toBe(true);
  });

  it('accepts a schedule whose end is after its start', () => {
    expect(popupWriteSchema.safeParse({
      ...writeInput,
      startsAt: new Date('2026-08-14T12:00:00Z'),
      endsAt: new Date('2026-08-14T13:00:00Z'),
    }).success).toBe(true);
  });

  it('coerces ISO schedule strings to dates and preserves null', () => {
    const result = popupWriteSchema.parse({
      ...writeInput,
      startsAt: '2026-08-14T12:00:00Z',
      endsAt: '2026-08-14T13:00:00Z',
    });
    expect(result.startsAt).toBeInstanceOf(Date);
    expect(result.endsAt).toBeInstanceOf(Date);
    expect(popupWriteSchema.parse(writeInput)).toEqual(expect.objectContaining({
      startsAt: null,
      endsAt: null,
    }));
  });

  it('rejects invalid schedule date strings', () => {
    expect(popupWriteSchema.safeParse({
      ...writeInput,
      startsAt: 'not-a-date',
    }).success).toBe(false);
  });
});

describe('advertisingPopupRouter', () => {
  const popup = { id: 1, ...writeInput, isActive: false };
  const admin = {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    setActive: jest.fn(),
    delete: jest.fn(),
  };
  const frontend = { findEligible: jest.fn() };
  const context = (authenticated = true) => ({
    user: authenticated ? { id: 99 } : null,
    services: {
      advertisingPopupAdminService: admin,
      advertisingPopupFrontendService: frontend,
      admin: { advertisingPopup: admin },
      frontend: { advertisingPopup: frontend },
    },
  } as any);

  beforeEach(() => jest.clearAllMocks());

  it('returns null from the public active-popup query', async () => {
    frontend.findEligible.mockResolvedValue(null);
    await expect(advertisingPopupRouter.createCaller(context(false)).getActive()).resolves.toBeNull();
    expect(frontend.findEligible).toHaveBeenCalledTimes(1);
  });

  it('wires all protected CRUD operations to the admin service', async () => {
    admin.findAll.mockResolvedValue([popup]);
    admin.findById.mockResolvedValue(popup);
    admin.create.mockResolvedValue(popup);
    admin.update.mockResolvedValue(popup);
    admin.setActive.mockResolvedValue({ ...popup, isActive: true });
    admin.delete.mockResolvedValue(undefined);
    const caller = advertisingPopupRouter.createCaller(context());

    await expect(caller.list()).resolves.toEqual([popup]);
    await expect(caller.getById(1)).resolves.toEqual(popup);
    await expect(caller.create(writeInput)).resolves.toEqual(popup);
    await expect(caller.update({ id: 1, data: { title: 'Updated' } })).resolves.toEqual(popup);
    await expect(caller.setActive({ id: 1, active: true })).resolves.toEqual({ ...popup, isActive: true });
    await expect(caller.delete(1)).resolves.toEqual({ success: true });

    expect(admin.findAll).toHaveBeenCalledWith();
    expect(admin.findById).toHaveBeenCalledWith(1);
    expect(admin.create).toHaveBeenCalledWith(writeInput);
    expect(admin.update).toHaveBeenCalledWith(1, { title: 'Updated' });
    expect(admin.setActive).toHaveBeenCalledWith(1, true);
    expect(admin.delete).toHaveBeenCalledWith(1);
  });

  it.each([
    [new NotFoundException('private detail'), 'NOT_FOUND'],
    [new BadRequestException('private detail'), 'BAD_REQUEST'],
    [new Error('private detail'), 'INTERNAL_SERVER_ERROR'],
  ] as const)('maps service errors without leaking details', async (error, code) => {
    admin.findById.mockRejectedValue(error);
    const result = advertisingPopupRouter.createCaller(context()).getById(1);
    await expect(result).rejects.toMatchObject({ code });
    await expect(result).rejects.not.toMatchObject({ message: 'private detail' });
  });

  it('does not swallow existing TRPC errors', async () => {
    const error = new TRPCError({ code: 'FORBIDDEN', message: 'Denied' });
    admin.findById.mockRejectedValue(error);
    await expect(advertisingPopupRouter.createCaller(context()).getById(1)).rejects.toBe(error);
  });
});
