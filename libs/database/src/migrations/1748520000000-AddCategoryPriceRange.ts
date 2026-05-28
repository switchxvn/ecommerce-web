import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCategoryPriceRange1748520000000 implements MigrationInterface {
    name = 'AddCategoryPriceRange1748520000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "categories" ADD "price_range_min" numeric(15,0)`);
        await queryRunner.query(`ALTER TABLE "categories" ADD "price_range_max" numeric(15,0)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "price_range_max"`);
        await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "price_range_min"`);
    }
}
