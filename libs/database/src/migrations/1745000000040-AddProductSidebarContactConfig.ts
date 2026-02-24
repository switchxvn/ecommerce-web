import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProductSidebarContactConfig1745000000040 implements MigrationInterface {
    name = 'AddProductSidebarContactConfig1745000000040'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const themeResult = await queryRunner.query(`
            SELECT id FROM themes WHERE is_active = true LIMIT 1
        `);

        let themeId;
        if (themeResult.length > 0) {
            themeId = themeResult[0].id;
        } else {
            const insertResult = await queryRunner.query(`
                INSERT INTO themes (name, is_active, created_at, updated_at)
                VALUES ('Default Theme', true, NOW(), NOW())
                RETURNING id
            `);
            themeId = insertResult[0].id;
        }

        await queryRunner.query(`
            INSERT INTO component_style_configs (
                theme_id,
                type,
                title,
                settings,
                is_active,
                created_at,
                updated_at
            )
            VALUES (
                ${themeId},
                'product-sidebar-contact',
                'Product Sidebar Contact Information',
                '{
                    "contactInfo": {
                        "title": "Tư vấn mua hàng",
                        "representativeName": "Nguyễn Văn A",
                        "position": "Chuyên viên kinh doanh",
                        "phoneNumber": "0900 000 000",
                        "email": "sales@example.com",
                        "availability": "8:00 - 21:00, Thứ 2 - Chủ nhật",
                        "note": "Gọi điện hoặc nhắn Zalo để được tư vấn nhanh chóng"
                    }
                }'::jsonb,
                true,
                NOW(),
                NOW()
            )
            ON CONFLICT (theme_id, type) DO UPDATE
            SET settings = EXCLUDED.settings,
                title = EXCLUDED.title,
                updated_at = NOW()
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DELETE FROM component_style_configs
            WHERE type = 'product-sidebar-contact'
        `);
    }
}
