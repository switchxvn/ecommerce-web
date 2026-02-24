import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProductCardPriceFontWeight1745000000039 implements MigrationInterface {
    name = 'AddProductCardPriceFontWeight1745000000039'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            UPDATE component_style_configs
            SET settings = jsonb_set(
                settings,
                '{priceStyles}',
                COALESCE(settings->'priceStyles', '{}'::jsonb)
                    || jsonb_build_object(
                        'price',
                        '{"fontWeight": null}'::jsonb
                            || COALESCE(settings->'priceStyles'->'price', '{}'::jsonb)
                    )
                    || jsonb_build_object(
                        'comparePrice',
                        '{"fontWeight": null}'::jsonb
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
            SET settings = jsonb_set(
                settings,
                '{priceStyles}',
                COALESCE(settings->'priceStyles', '{}'::jsonb)
                    || jsonb_build_object(
                        'price',
                        COALESCE(settings->'priceStyles'->'price', '{}'::jsonb) - 'fontWeight'
                    )
                    || jsonb_build_object(
                        'comparePrice',
                        COALESCE(settings->'priceStyles'->'comparePrice', '{}'::jsonb) - 'fontWeight'
                    ),
                true
            )
            WHERE type = 'product-card'
        `);
    }
}
