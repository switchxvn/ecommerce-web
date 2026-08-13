import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableCheck,
  TableIndex,
} from 'typeorm';

export class CreateAdvertisingPopups1786587000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'advertising_popups',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'name', type: 'varchar' },
          { name: 'title', type: 'varchar' },
          { name: 'content', type: 'text' },
          { name: 'cta_label', type: 'varchar' },
          { name: 'cta_url', type: 'text' },
          { name: 'is_active', type: 'boolean', default: false },
          { name: 'starts_at', type: 'timestamptz', isNullable: true },
          { name: 'ends_at', type: 'timestamptz', isNullable: true },
          { name: 'created_at', type: 'timestamptz', default: 'now()' },
          { name: 'updated_at', type: 'timestamptz', default: 'now()' },
        ],
        checks: [
          new TableCheck({
            name: 'CHK_advertising_popups_valid_schedule',
            expression:
              '"starts_at" IS NULL OR "ends_at" IS NULL OR "ends_at" > "starts_at"',
          }),
        ],
      }),
    );

    await queryRunner.createIndex(
      'advertising_popups',
      new TableIndex({
        name: 'IDX_advertising_popups_one_active',
        columnNames: ['is_active'],
        isUnique: true,
        where: '"is_active" = true',
      }),
    );

    await queryRunner.manager.insert('advertising_popups', {
      name: 'Khuyến mãi vé cáp treo Núi Sam',
      title: 'Ưu đãi vé khứ hồi Núi Sam chỉ 250.000đ',
      content: `✨ Chỉ với 250.000đ/vé khứ hồi người lớn, bạn sẽ nhận ngay:
🚠 Vé cáp treo khứ hồi ngắm toàn cảnh Núi Sam từ trên cao.
🍱 01 suất ăn miễn phí với thực đơn hấp dẫn.
🥤 01 ly nước miễn phí giúp chuyến đi thêm trọn vẹn.

📅 Ưu đãi áp dụng từ Thứ 2 đến Thứ 5 hằng tuần.`,
      cta_label: 'Đặt vé ngay',
      cta_url: '/order-ticket',
      is_active: false,
    });
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex(
      'advertising_popups',
      'IDX_advertising_popups_one_active',
    );
    await queryRunner.dropTable('advertising_popups');
  }
}
