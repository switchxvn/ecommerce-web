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
    const fields = this.pickWritableFields(input);
    const isActive = (input as PopupWriteInput & { isActive?: unknown }).isActive === true;
    if (!isActive) {
      return this.repository.save(this.repository.create({ ...fields, isActive: false }));
    }

    return this.dataSource.transaction(async (manager) => {
      const created = await manager.save(
        manager.create(AdvertisingPopup, { ...fields, isActive: false }),
      );
      const selected = await this.findLocked(manager, created.id);
      return this.setActiveWithManager(manager, selected, true);
    });
  }

  async update(id: number, input: PopupUpdateInput): Promise<AdvertisingPopup> {
    const fields = this.pickWritableFields(input);
    const record = await this.repository.preload({ id, ...fields });
    if (!record) throw new NotFoundException('Advertising popup not found');
    return this.repository.save(record);
  }

  setActive(id: number, active: boolean): Promise<AdvertisingPopup> {
    return this.dataSource.transaction(async (manager) => {
      const record = await this.findLocked(manager, id);
      return this.setActiveWithManager(manager, record, active);
    });
  }

  delete(id: number): Promise<void> {
    return this.dataSource.transaction(async (manager) => {
      const record = await this.findLocked(manager, id);
      if (record.isActive) {
        throw new BadRequestException('An active advertising popup cannot be deleted');
      }
      await manager.remove(AdvertisingPopup, record);
    });
  }

  private pickWritableFields(input: PopupUpdateInput): PopupUpdateInput {
    return {
      name: input.name,
      title: input.title,
      content: input.content,
      ctaLabel: input.ctaLabel,
      ctaUrl: input.ctaUrl,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
    };
  }

  private async findLocked(
    manager: EntityManager,
    id: number,
  ): Promise<AdvertisingPopup> {
    const record = await manager.findOne(AdvertisingPopup, {
      where: { id },
      lock: { mode: 'pessimistic_write' },
    });
    if (!record) throw new NotFoundException('Advertising popup not found');
    return record;
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
