import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('advertising_popups')
export class AdvertisingPopup {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'varchar', name: 'cta_label' })
  ctaLabel: string;

  @Column({ type: 'text', name: 'cta_url' })
  ctaUrl: string;

  @Column({ name: 'is_active', default: false })
  isActive: boolean;

  @Column({ type: 'timestamptz', name: 'starts_at', nullable: true })
  startsAt: Date | null;

  @Column({ type: 'timestamptz', name: 'ends_at', nullable: true })
  endsAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
