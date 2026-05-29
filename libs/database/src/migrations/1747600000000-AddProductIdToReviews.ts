import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductIdToReviews1747600000000 implements MigrationInterface {
  name = 'AddProductIdToReviews1747600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "reviews"
      ADD COLUMN "product_id" integer
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_reviews_product_id" ON "reviews" ("product_id")
    `);

    await queryRunner.query(`
      ALTER TABLE "reviews"
      ADD CONSTRAINT "FK_reviews_product_id_products"
      FOREIGN KEY ("product_id")
      REFERENCES "products"("id")
      ON DELETE SET NULL
      ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "reviews"
      DROP CONSTRAINT "FK_reviews_product_id_products"
    `);

    await queryRunner.query(`
      DROP INDEX "public"."IDX_reviews_product_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "reviews"
      DROP COLUMN "product_id"
    `);
  }
}
