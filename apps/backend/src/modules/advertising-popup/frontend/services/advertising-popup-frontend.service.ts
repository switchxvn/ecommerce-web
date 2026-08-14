import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdvertisingPopup } from '../../entities/advertising-popup.entity';

@Injectable()
export class AdvertisingPopupFrontendService {
  constructor(
    @InjectRepository(AdvertisingPopup)
    private readonly repository: Repository<AdvertisingPopup>,
  ) {}

  findEligible(now = new Date()): Promise<AdvertisingPopup | null> {
    return this.repository
      .createQueryBuilder('popup')
      .where('popup.isActive = :isActive', { isActive: true })
      .andWhere('(popup.startsAt IS NULL OR popup.startsAt <= :now)', { now })
      .andWhere('(popup.endsAt IS NULL OR popup.endsAt > :now)', { now })
      .orderBy('popup.createdAt', 'DESC')
      .addOrderBy('popup.id', 'DESC')
      .getOne();
  }
}
