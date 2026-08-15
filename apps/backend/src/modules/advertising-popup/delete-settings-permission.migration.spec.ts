import { QueryRunner } from 'typeorm';
import { AddDeleteSettingsPermission1786587100000 } from '../../../../../libs/database/src/migrations/1786587100000-AddDeleteSettingsPermission';

describe('AddDeleteSettingsPermission1786587100000', () => {
  const createQueryRunner = () =>
    ({ query: jest.fn().mockResolvedValue(undefined) }) as unknown as QueryRunner;

  it('idempotently provisions DELETE_SETTINGS for conventional admin roles', async () => {
    const migration = new AddDeleteSettingsPermission1786587100000();
    const queryRunner = createQueryRunner();

    await migration.up(queryRunner);

    const sql = (queryRunner.query as jest.Mock).mock.calls
      .map(([statement]) => statement)
      .join('\n');
    expect(sql).toContain('DELETE_SETTINGS');
    expect(sql).toContain('Delete Settings');
    expect(sql).toContain('Settings Management');
    expect(sql).toContain('uuid_generate_v4()');
    expect(sql).toMatch(/ON CONFLICT \(code\) DO NOTHING/i);
    expect(sql).toContain("'SUPER_ADMIN', 'ADMIN'");
    expect(sql).toMatch(
      /ON CONFLICT \(role_id, permission_id\) DO NOTHING/i,
    );
  });

  it('removes role assignments before deleting the permission', async () => {
    const migration = new AddDeleteSettingsPermission1786587100000();
    const queryRunner = createQueryRunner();

    await migration.down(queryRunner);

    const statements = (queryRunner.query as jest.Mock).mock.calls.map(
      ([statement]) => statement,
    );
    expect(statements).toHaveLength(2);
    expect(statements[0]).toContain('DELETE FROM roles_permissions');
    expect(statements[0]).toContain('DELETE_SETTINGS');
    expect(statements[1]).toContain('DELETE FROM permissions');
    expect(statements[1]).toContain('DELETE_SETTINGS');
  });
});
