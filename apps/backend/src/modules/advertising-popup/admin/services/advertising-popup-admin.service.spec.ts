import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { AdvertisingPopup } from '../../entities/advertising-popup.entity';
import {
  AdvertisingPopupAdminService,
  PopupWriteInput,
} from './advertising-popup-admin.service';

const popup = (overrides: Partial<AdvertisingPopup> = {}): AdvertisingPopup =>
  ({
    id: 1,
    name: 'Campaign',
    title: 'Welcome',
    content: 'Hello',
    ctaLabel: 'Shop now',
    ctaUrl: '/products',
    isActive: false,
    startsAt: null,
    endsAt: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  }) as AdvertisingPopup;

const input: PopupWriteInput = {
  name: 'Campaign',
  title: 'Welcome',
  content: 'Hello',
  ctaLabel: 'Shop now',
  ctaUrl: '/products',
  startsAt: null,
  endsAt: null,
};

describe('AdvertisingPopupAdminService', () => {
  let repository: jest.Mocked<Repository<AdvertisingPopup>>;
  let manager: jest.Mocked<EntityManager>;
  let dataSource: jest.Mocked<DataSource>;
  let service: AdvertisingPopupAdminService;

  beforeEach(() => {
    repository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      preload: jest.fn(),
      remove: jest.fn(),
    } as unknown as jest.Mocked<Repository<AdvertisingPopup>>;
    manager = {
      findOne: jest.fn(),
      update: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    } as unknown as jest.Mocked<EntityManager>;
    dataSource = {
      transaction: jest.fn(async (callback) => callback(manager)),
    } as unknown as jest.Mocked<DataSource>;
    service = new AdvertisingPopupAdminService(repository, dataSource);
  });

  it('lists popups newest first', async () => {
    const records = [popup({ id: 2 }), popup({ id: 1 })];
    repository.find.mockResolvedValue(records);

    await expect(service.findAll()).resolves.toBe(records);
    expect(repository.find).toHaveBeenCalledWith({
      order: { createdAt: 'DESC', id: 'DESC' },
    });
  });

  it('finds a popup by id', async () => {
    const record = popup();
    repository.findOne.mockResolvedValue(record);

    await expect(service.findById(1)).resolves.toBe(record);
    expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  it('throws when a popup id is missing', async () => {
    repository.findOne.mockResolvedValue(null);

    await expect(service.findById(404)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('creates an inactive popup without a transaction', async () => {
    const created = popup();
    repository.create.mockReturnValue(created);
    repository.save.mockResolvedValue(created);

    await expect(service.create(input)).resolves.toBe(created);
    expect(repository.create).toHaveBeenCalledWith({ ...input, isActive: false });
    expect(repository.save).toHaveBeenCalledWith(created);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('creates an active popup through the activation transaction', async () => {
    const selected = popup({ id: 3, isActive: false });
    const activated = popup({ id: 3, isActive: true });
    manager.create.mockReturnValue(selected);
    manager.save.mockResolvedValue(activated);

    await expect(service.create({ ...input, isActive: true })).resolves.toBe(activated);
    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    expect(manager.create).toHaveBeenCalledWith(AdvertisingPopup, {
      ...input,
      isActive: false,
    });
    expect(manager.update).toHaveBeenCalledWith(
      AdvertisingPopup,
      { isActive: true },
      { isActive: false },
    );
    expect(manager.save).toHaveBeenNthCalledWith(1, selected);
    expect(manager.save).toHaveBeenNthCalledWith(
      2,
      AdvertisingPopup,
      expect.objectContaining({ id: 3, isActive: true }),
    );
    expect(manager.update.mock.invocationCallOrder[0]).toBeLessThan(
      manager.save.mock.invocationCallOrder[1],
    );
  });

  it('updates writable popup fields', async () => {
    const updated = popup({ title: 'Updated' });
    repository.preload.mockResolvedValue(updated);
    repository.save.mockResolvedValue(updated);

    await expect(service.update(1, { ...input, title: 'Updated' })).resolves.toBe(updated);
    expect(repository.preload).toHaveBeenCalledWith({
      id: 1,
      ...input,
      title: 'Updated',
    });
    expect(repository.save).toHaveBeenCalledWith(updated);
  });

  it('throws when updating a missing popup', async () => {
    repository.preload.mockResolvedValue(undefined);

    await expect(service.update(404, input)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('deactivates the selected popup transactionally', async () => {
    const selected = popup({ isActive: true });
    const saved = popup({ isActive: false });
    manager.findOne.mockResolvedValue(selected);
    manager.save.mockResolvedValue(saved);

    await expect(service.setActive(1, false)).resolves.toBe(saved);
    expect(manager.update).not.toHaveBeenCalled();
    expect(manager.save).toHaveBeenCalledWith(
      AdvertisingPopup,
      expect.objectContaining({ id: 1, isActive: false }),
    );
  });

  it('deactivates all active popups before activating the selected popup', async () => {
    const selected = popup();
    const saved = popup({ isActive: true });
    manager.findOne.mockResolvedValue(selected);
    manager.save.mockResolvedValue(saved);

    await expect(service.setActive(1, true)).resolves.toBe(saved);
    expect(manager.update).toHaveBeenCalledWith(
      AdvertisingPopup,
      { isActive: true },
      { isActive: false },
    );
    expect(manager.save).toHaveBeenCalledWith(
      AdvertisingPopup,
      expect.objectContaining({ id: 1, isActive: true }),
    );
    expect(manager.update.mock.invocationCallOrder[0]).toBeLessThan(
      manager.save.mock.invocationCallOrder[0],
    );
  });

  it('throws when activating a missing popup', async () => {
    manager.findOne.mockResolvedValue(null);

    await expect(service.setActive(404, true)).rejects.toBeInstanceOf(NotFoundException);
    expect(manager.update).not.toHaveBeenCalled();
    expect(manager.save).not.toHaveBeenCalled();
  });

  it('deletes an inactive popup', async () => {
    const record = popup();
    repository.findOne.mockResolvedValue(record);
    repository.remove.mockResolvedValue(record);

    await expect(service.delete(1)).resolves.toBeUndefined();
    expect(repository.remove).toHaveBeenCalledWith(record);
  });

  it('rejects deletion of an active popup', async () => {
    repository.findOne.mockResolvedValue(popup({ isActive: true }));

    await expect(service.delete(1)).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.remove).not.toHaveBeenCalled();
  });
});
