import { MigrationInterface, QueryRunner } from "typeorm";

export class FixProductCardPriceStyles1745000000038 implements MigrationInterface {
    name = 'FixProductCardPriceStyles1745000000038'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            UPDATE component_style_configs
            SET settings = jsonb_set(
                settings,
                '{priceStyles}',
                COALESCE(settings->'priceStyles', '{}'::jsonb)
                    || jsonb_build_object(
                        'price',
                        '{"fontSize": null, "color": null}'::jsonb
                            || COALESCE(settings->'priceStyles'->'price', '{}'::jsonb)
                    )
                    || jsonb_build_object(
                        'comparePrice',
                        '{"fontSize": null, "color": null}'::jsonb
                            || COALESCE(settings->'priceStyles'->'comparePrice', '{}'::jsonb)
                    ),
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
