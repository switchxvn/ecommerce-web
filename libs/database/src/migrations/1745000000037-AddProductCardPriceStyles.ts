import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProductCardPriceStyles1745000000037 implements MigrationInterface {
    name = 'AddProductCardPriceStyles1745000000037'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            UPDATE component_style_configs
            SET settings = jsonb_set(
                jsonb_set(
                    settings,
                    '{priceStyles,price}',
                    '{"fontSize": null, "color": null}'::jsonb || COALESCE(settings->'priceStyles'->'price', '{}'::jsonb),
                    true
                ),
                '{priceStyles,comparePrice}',
                '{"fontSize": null, "color": null}'::jsonb || COALESCE(settings->'priceStyles'->'comparePrice', '{}'::jsonb),
                true
            )
            WHERE type = 'product-card'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            UPDATE component_style_configs
            SET settings = settings - 'priceStyles'
            WHERE type = 'product-card'
        `);
    }
}
