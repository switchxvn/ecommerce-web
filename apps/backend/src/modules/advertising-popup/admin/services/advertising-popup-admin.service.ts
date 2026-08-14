import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { AdvertisingPopup } from '../../entities/advertising-popup.entity';

export interface PopupWriteInput {
  name: string;
  title: string;
  content: string;
  ctaLabel: string;
  ctaUrl: string;
  startsAt: Date | null;
  endsAt: Date | null;
  isActive?: boolean;
}

export type PopupUpdateInput = Omit<PopupWriteInput, 'isActive'>;

@Injectable()
export class AdvertisingPopupAdminService {
  constructor(
    @InjectRepository(AdvertisingPopup)
    private readonly repository: Repository<AdvertisingPopup>,
    private readonly dataSource: DataSource,
  ) {}

  findAll(): Promise<AdvertisingPopup[]> {
    return this.repository.find({ order: { createdAt: 'DESC', id: 'DESC' } });
  }

  async findById(id: number): Promise<AdvertisingPopup> {
    const record = await this.repository.findOne({ where: { id } });
    if (!record) throw new NotFoundException('Advertising popup not found');
    return record;
  }

  async create(input: PopupWriteInput): Promise<AdvertisingPopup> {
    const { isActive = false, ...fields } = input;
    if (!isActive) {
      return this.repository.save(this.repository.create({ ...fields, isActive: false }));
    }

    return this.dataSource.transaction(async (manager) => {
      const created = await manager.save(
        manager.create(AdvertisingPopup, { ...fields, isActive: false }),
      );
      return this.setActiveWithManager(manager, created, true);
    });
  }

  async update(id: number, input: PopupUpdateInput): Promise<AdvertisingPopup> {
    const { isActive: _activationState, ...fields } = input as PopupUpdateInput & {
      isActive?: unknown;
    };
    const record = await this.repository.preload({ id, ...fields });
    if (!record) throw new NotFoundException('Advertising popup not found');
    return this.repository.save(record);
  }

  setActive(id: number, active: boolean): Promise<AdvertisingPopup> {
    return this.dataSource.transaction(async (manager) => {
      const record = await manager.findOne(AdvertisingPopup, { where: { id } });
      if (!record) throw new NotFoundException('Advertising popup not found');
      return this.setActiveWithManager(manager, record, active);
    });
  }

  async delete(id: number): Promise<void> {
    const record = await this.findById(id);
    if (record.isActive) {
      throw new BadRequestException('An active advertising popup cannot be deleted');
    }
    await this.repository.remove(record);
  }

  private async setActiveWithManager(
    manager: EntityManager,
    record: AdvertisingPopup,
    active: boolean,
  ): Promise<AdvertisingPopup> {
    if (active) {
      await manager.update(
        AdvertisingPopup,
        { isActive: true },
        { isActive: false },
      );
    }
    return manager.save(AdvertisingPopup, { ...record, isActive: active });
  }
}
