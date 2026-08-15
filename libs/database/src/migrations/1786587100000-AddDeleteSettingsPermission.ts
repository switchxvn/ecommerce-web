import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDeleteSettingsPermission1786587100000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO permissions (
        id,
        name,
        code,
        group_name,
        description,
        created_at,
        updated_at
      )
      VALUES (
        uuid_generate_v4(),
        'Delete Settings',
        'DELETE_SETTINGS',
        'Settings Management',
        'Can delete advertising popup campaigns and other settings records',
        NOW(),
        NOW()
      )
      ON CONFLICT (code) DO NOTHING;
    `);

    await queryRunner.query(`
      INSERT INTO roles_permissions (role_id, permission_id)
      SELECT roles.id, permissions.id
      FROM roles
      CROSS JOIN permissions
      WHERE roles.code IN ('SUPER_ADMIN', 'ADMIN')
        AND permissions.code = 'DELETE_SETTINGS'
      ON CONFLICT (role_id, permission_id) DO NOTHING;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM roles_permissions
      WHERE permission_id IN (
        SELECT id
        FROM permissions
        WHERE code = 'DELETE_SETTINGS'
      );
    `);

    await queryRunner.query(`
      DELETE FROM permissions
      WHERE code = 'DELETE_SETTINGS';
    `);
  }
}
