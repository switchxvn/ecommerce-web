import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProductSidebarItemsTable1747800000000 implements MigrationInterface {
  name = 'CreateProductSidebarItemsTable1747800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."product_sidebar_items_item_type_enum" AS ENUM('post', 'service')
    `);

    await queryRunner.query(`
      CREATE TABLE "product_sidebar_items" (
        "id" SERIAL NOT NULL,
        "product_id" integer NOT NULL,
        "item_type" "public"."product_sidebar_items_item_type_enum" NOT NULL,
        "item_id" integer NOT NULL,
        "position" integer NOT NULL DEFAULT '0',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_product_sidebar_items_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_product_sidebar_items_product_id" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_product_sidebar_items_product_id" ON "product_sidebar_items" ("product_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX "public"."IDX_product_sidebar_items_product_id"
    `);

    await queryRunner.query(`
      DROP TABLE "product_sidebar_items"
    `);

    await queryRunner.query(`
      DROP TYPE "public"."product_sidebar_items_item_type_enum"
    `);
  }
}
