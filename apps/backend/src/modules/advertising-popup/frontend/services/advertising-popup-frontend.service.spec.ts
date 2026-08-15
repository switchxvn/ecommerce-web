import { Repository, SelectQueryBuilder } from 'typeorm';
import { AdvertisingPopup } from '../../entities/advertising-popup.entity';
import { AdvertisingPopupFrontendService } from './advertising-popup-frontend.service';

describe('AdvertisingPopupFrontendService', () => {
  let repository: jest.Mocked<Repository<AdvertisingPopup>>;
  let queryBuilder: jest.Mocked<SelectQueryBuilder<AdvertisingPopup>>;
  let service: AdvertisingPopupFrontendService;

  beforeEach(() => {
    queryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
    } as unknown as jest.Mocked<SelectQueryBuilder<AdvertisingPopup>>;
    repository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    } as unknown as jest.Mocked<Repository<AdvertisingPopup>>;
    service = new AdvertisingPopupFrontendService(repository);
  });

  it('returns the deterministically newest popup eligible at the supplied time', async () => {
    const now = new Date('2026-08-13T12:00:00Z');
    const record = { id: 1 } as AdvertisingPopup;
    queryBuilder.getOne.mockResolvedValue(record);

    await expect(service.findEligible(now)).resolves.toBe(record);
    expect(repository.createQueryBuilder).toHaveBeenCalledWith('popup');
    expect(queryBuilder.where).toHaveBeenCalledWith('popup.isActive = :isActive', {
      isActive: true,
    });
    expect(queryBuilder.andWhere).toHaveBeenNthCalledWith(
      1,
      '(popup.startsAt IS NULL OR popup.startsAt <= :now)',
      { now },
    );
    expect(queryBuilder.andWhere).toHaveBeenNthCalledWith(
      2,
      '(popup.endsAt IS NULL OR popup.endsAt > :now)',
      { now },
    );
    expect(queryBuilder.orderBy).toHaveBeenCalledWith('popup.createdAt', 'DESC');
    expect(queryBuilder.addOrderBy).toHaveBeenCalledWith('popup.id', 'DESC');
  });

  it('returns null when no popup is eligible', async () => {
    queryBuilder.getOne.mockResolvedValue(null);

    await expect(service.findEligible()).resolves.toBeNull();
  });
});
