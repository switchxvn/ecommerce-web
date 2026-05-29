import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddServiceIdToReviews1748481000000 implements MigrationInterface {
  name = 'AddServiceIdToReviews1748481000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "reviews"
      ADD COLUMN "service_id" integer NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "reviews"
      ADD CONSTRAINT "FK_reviews_service_id_services_id"
      FOREIGN KEY ("service_id") REFERENCES "services"("id")
      ON DELETE SET NULL
      ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "reviews"
      DROP CONSTRAINT "FK_reviews_service_id_services_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "reviews"
      DROP COLUMN "service_id"
    `);
  }
}
