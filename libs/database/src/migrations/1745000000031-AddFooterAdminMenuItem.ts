import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFooterAdminMenuItem1745000000031 implements MigrationInterface {
  name = 'AddFooterAdminMenuItem1745000000031';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const parent = await queryRunner.query(
      `SELECT id FROM admin_menu_items WHERE code = 'settings' LIMIT 1`
    );
    const parentId = parent[0]?.id ?? null;

    const inserted = await queryRunner.query(
      `
        INSERT INTO admin_menu_items 
          (code, icon, icon_type, path, parent_id, "order", is_active, available_for_roles, created_at, updated_at)
        VALUES 
          ('footer-settings', 'LayoutTemplate', 'lucide', '/settings/footer', $1, 50, true, 'SUPER_ADMIN', NOW(), NOW())
        RETURNING id
      `,
      [parentId]
    );

    const footerMenuId = inserted[0]?.id;

    if (footerMenuId) {
      await queryRunner.query(
        `
          INSERT INTO admin_menu_item_translations (admin_menu_item_id, locale, name)
          VALUES 
            ($1, 'en', 'Footer'),
            ($1, 'vi', 'Chân trang')
        `,
        [footerMenuId]
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const footerMenu = await queryRunner.query(
      `SELECT id FROM admin_menu_items WHERE code = 'footer-settings' LIMIT 1`
    );
    const footerMenuId = footerMenu[0]?.id;

    if (footerMenuId) {
      await queryRunner.query(
        `DELETE FROM admin_menu_item_translations WHERE admin_menu_item_id = $1`,
        [footerMenuId]
      );
    }

    await queryRunner.query(
      `DELETE FROM admin_menu_items WHERE code = 'footer-settings'`
    );
  }
}
