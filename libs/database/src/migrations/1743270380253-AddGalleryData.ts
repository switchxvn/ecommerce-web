import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGalleryData1743270380253 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Insert gallery data
    const galleryData = Array.from({ length: 21 }, (_, i) => ({
      image: `https://cdn.captreonuisam.com/gallery/${i + 1}.jpg`,
      translations: [
        {
          locale: 'vi',
          title: `Hình ảnh ${i + 1}`,
          description: `Mô tả hình ảnh ${i + 1}`
        },
        {
          locale: 'en',
          title: `Image ${i + 1}`,
          description: `Description for image ${i + 1}`
        },
        {
          locale: 'ko',
          title: `이미지 ${i + 1}`,
          description: `이미지 ${i + 1}에 대한 설명`
        }
      ]
    }));

    for (let i = 0; i < galleryData.length; i++) {
      const gallery = galleryData[i];

      // Insert gallery
      const result = await queryRunner.query(`
        INSERT INTO galleries (image, sequence, is_active)
        VALUES ($1, $2, true)
        RETURNING id
      `, [gallery.image, i + 1]);

      const galleryId = result[0].id;

      // Insert translations
      for (const translation of gallery.translations) {
        await queryRunner.query(`
          INSERT INTO gallery_translations (gallery_id, locale, title, description)
          VALUES ($1, $2, $3, $4)
        `, [galleryId, translation.locale, translation.title, translation.description]);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Delete all gallery translations
    await queryRunner.query(`DELETE FROM gallery_translations`);

    // Delete all galleries
    await queryRunner.query(`DELETE FROM galleries`);
  }
}
