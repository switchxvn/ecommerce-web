import { MigrationInterface, QueryRunner } from 'typeorm';

type CategorySeed = {
  locale: 'vi' | 'en';
  name: string;
  slug: string;
  description: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  ogTitle: string;
  ogDescription: string;
};

const CATEGORY_SEEDS: Array<{
  type: 'news';
  translations: CategorySeed[];
}> = [
  {
    type: 'news',
    translations: [
      {
        locale: 'vi',
        name: 'So sánh sản phẩm',
        slug: 'so-sanh-san-pham',
        description: 'Chuyên mục so sánh các dòng xe nâng, thiết bị và giải pháp để giúp doanh nghiệp chọn đúng cấu hình theo nhu cầu vận hành.',
        metaTitle: 'So sánh sản phẩm xe nâng, thiết bị công nghiệp | MGA Việt Nam',
        metaDescription: 'Tổng hợp các bài viết so sánh xe nâng điện, xe nâng dầu, cấu hình và giải pháp thiết bị để hỗ trợ quyết định mua hàng hiệu quả.',
        metaKeywords: 'so sánh xe nâng, so sánh sản phẩm, xe nâng điện và xe nâng dầu, tư vấn chọn xe nâng',
        ogTitle: 'So sánh sản phẩm xe nâng, thiết bị công nghiệp | MGA Việt Nam',
        ogDescription: 'Các bài viết so sánh sản phẩm giúp doanh nghiệp đánh giá nhanh ưu nhược điểm, chi phí và mức độ phù hợp theo nhu cầu sử dụng.'
      },
      {
        locale: 'en',
        name: 'Product Comparison',
        slug: 'product-comparison',
        description: 'Compare forklift models, industrial equipment, and handling solutions to choose the right configuration for operational needs.',
        metaTitle: 'Forklift and industrial equipment comparisons | MGA Vietnam',
        metaDescription: 'Compare electric forklifts, diesel forklifts, specifications, and equipment solutions to support better purchasing decisions.',
        metaKeywords: 'forklift comparison, product comparison, electric vs diesel forklift, forklift buying guide',
        ogTitle: 'Forklift and industrial equipment comparisons | MGA Vietnam',
        ogDescription: 'Comparison articles that help buyers evaluate pros, cons, costs, and real-world fit before choosing equipment.'
      }
    ]
  },
  {
    type: 'news',
    translations: [
      {
        locale: 'vi',
        name: 'Báo giá và chi phí',
        slug: 'bao-gia-va-chi-phi',
        description: 'Chuyên mục tập trung vào giá bán, chi phí đầu tư, chi phí vận hành và các yếu tố tài chính khi chọn mua thiết bị.',
        metaTitle: 'Báo giá và chi phí xe nâng, thiết bị | MGA Việt Nam',
        metaDescription: 'Tìm hiểu giá xe nâng, chi phí đầu tư, vận hành, bảo trì và các yếu tố ảnh hưởng đến tổng chi phí sở hữu thiết bị.',
        metaKeywords: 'báo giá xe nâng, chi phí xe nâng, chi phí vận hành xe nâng, tổng chi phí sở hữu',
        ogTitle: 'Báo giá và chi phí xe nâng, thiết bị | MGA Việt Nam',
        ogDescription: 'Nội dung về báo giá và chi phí giúp doanh nghiệp ước tính ngân sách đầu tư và tối ưu hiệu quả tài chính.'
      },
      {
        locale: 'en',
        name: 'Pricing and Costs',
        slug: 'pricing-and-costs',
        description: 'Content focused on selling price, capital investment, operating expenses, and cost planning for industrial equipment.',
        metaTitle: 'Forklift pricing and operating cost insights | MGA Vietnam',
        metaDescription: 'Explore forklift pricing, investment planning, operating expenses, maintenance costs, and total cost of ownership.',
        metaKeywords: 'forklift price, forklift costs, operating cost, total cost of ownership',
        ogTitle: 'Forklift pricing and operating cost insights | MGA Vietnam',
        ogDescription: 'Pricing and cost articles that help businesses estimate budgets and evaluate equipment investment more accurately.'
      }
    ]
  },
  {
    type: 'news',
    translations: [
      {
        locale: 'vi',
        name: 'Kiến thức kỹ thuật',
        slug: 'kien-thuc-ky-thuat',
        description: 'Tổng hợp kiến thức kỹ thuật về cấu tạo, thông số, nguyên lý hoạt động và tiêu chuẩn liên quan đến xe nâng và thiết bị công nghiệp.',
        metaTitle: 'Kiến thức kỹ thuật xe nâng, thiết bị công nghiệp | MGA Việt Nam',
        metaDescription: 'Khám phá kiến thức kỹ thuật về xe nâng, cấu tạo, thông số, nguyên lý hoạt động và tiêu chuẩn để hiểu đúng trước khi đầu tư.',
        metaKeywords: 'kiến thức kỹ thuật xe nâng, thông số xe nâng, cấu tạo xe nâng, tiêu chuẩn kỹ thuật',
        ogTitle: 'Kiến thức kỹ thuật xe nâng, thiết bị công nghiệp | MGA Việt Nam',
        ogDescription: 'Chuyên mục giúp người đọc nắm rõ thông số, cấu tạo và nguyên lý hoạt động của thiết bị trước khi lựa chọn.'
      },
      {
        locale: 'en',
        name: 'Technical Knowledge',
        slug: 'technical-knowledge',
        description: 'Technical articles covering specifications, structure, working principles, and related standards for forklifts and industrial equipment.',
        metaTitle: 'Forklift technical knowledge and specifications | MGA Vietnam',
        metaDescription: 'Learn about forklift specifications, structure, operating principles, and technical standards before investing in equipment.',
        metaKeywords: 'forklift technical knowledge, forklift specifications, forklift structure, technical standards',
        ogTitle: 'Forklift technical knowledge and specifications | MGA Vietnam',
        ogDescription: 'A knowledge hub for readers who need to understand equipment specifications and technical concepts before buying.'
      }
    ]
  },
  {
    type: 'news',
    translations: [
      {
        locale: 'vi',
        name: 'Ứng dụng thực tế',
        slug: 'ung-dung-thuc-te',
        description: 'Các bài viết về tình huống ứng dụng thực tế của xe nâng và thiết bị trong kho bãi, nhà xưởng, logistics và sản xuất.',
        metaTitle: 'Ứng dụng thực tế của xe nâng và thiết bị | MGA Việt Nam',
        metaDescription: 'Xem cách xe nâng và thiết bị công nghiệp được ứng dụng trong kho bãi, nhà máy, logistics và các môi trường vận hành thực tế.',
        metaKeywords: 'ứng dụng xe nâng, ứng dụng thực tế, xe nâng trong kho, giải pháp logistics',
        ogTitle: 'Ứng dụng thực tế của xe nâng và thiết bị | MGA Việt Nam',
        ogDescription: 'Nhóm bài viết giúp doanh nghiệp hình dung rõ cách triển khai thiết bị trong từng môi trường làm việc cụ thể.'
      },
      {
        locale: 'en',
        name: 'Real-world Applications',
        slug: 'real-world-applications',
        description: 'Articles about real-world forklift and industrial equipment usage across warehouses, factories, logistics, and manufacturing environments.',
        metaTitle: 'Real-world forklift applications | MGA Vietnam',
        metaDescription: 'Discover how forklifts and industrial equipment are used in warehouses, plants, logistics, and production environments.',
        metaKeywords: 'forklift applications, warehouse forklift use, logistics solutions, industrial equipment use cases',
        ogTitle: 'Real-world forklift applications | MGA Vietnam',
        ogDescription: 'Application-focused content that shows how equipment fits specific operational environments and business needs.'
      }
    ]
  },
  {
    type: 'news',
    translations: [
      {
        locale: 'vi',
        name: 'Hướng dẫn an toàn',
        slug: 'huong-dan-an-toan',
        description: 'Chuyên mục về quy trình, checklist và lưu ý an toàn khi vận hành xe nâng và các thiết bị công nghiệp liên quan.',
        metaTitle: 'Hướng dẫn an toàn khi vận hành xe nâng | MGA Việt Nam',
        metaDescription: 'Tổng hợp hướng dẫn an toàn, checklist kiểm tra và quy trình vận hành xe nâng để giảm rủi ro trong kho và nhà xưởng.',
        metaKeywords: 'an toàn xe nâng, hướng dẫn an toàn, checklist xe nâng, vận hành xe nâng an toàn',
        ogTitle: 'Hướng dẫn an toàn khi vận hành xe nâng | MGA Việt Nam',
        ogDescription: 'Các bài viết tập trung vào an toàn vận hành, kiểm tra trước ca và giảm thiểu rủi ro trong môi trường làm việc.'
      },
      {
        locale: 'en',
        name: 'Safety Guidelines',
        slug: 'safety-guidelines',
        description: 'Safety-focused content covering procedures, checklists, and best practices for forklift and industrial equipment operation.',
        metaTitle: 'Forklift safety guidelines and checklists | MGA Vietnam',
        metaDescription: 'Access forklift safety guides, inspection checklists, and operating procedures to reduce risk in warehouses and industrial sites.',
        metaKeywords: 'forklift safety, safety checklist, safe forklift operation, warehouse safety',
        ogTitle: 'Forklift safety guidelines and checklists | MGA Vietnam',
        ogDescription: 'Safety articles that help teams improve pre-shift checks, operator awareness, and workplace risk control.'
      }
    ]
  }
];

export class AddSeoNewsCategories1747800000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const category of CATEGORY_SEEDS) {
      const [existingTranslation] = await queryRunner.query(
        `
          SELECT ct.category_id
          FROM category_translations ct
          JOIN categories c ON c.id = ct.category_id
          WHERE c.category_type = $1 AND ct.locale = 'vi' AND ct.slug = $2
          LIMIT 1
        `,
        [category.type, category.translations.find((translation) => translation.locale === 'vi')?.slug]
      );

      let categoryId = existingTranslation?.category_id as number | undefined;

      if (!categoryId) {
        const [createdCategory] = await queryRunner.query(
          `
            INSERT INTO categories (active, is_featured, category_type, created_at, updated_at)
            VALUES (true, false, $1, NOW(), NOW())
            RETURNING id
          `,
          [category.type]
        );

        categoryId = createdCategory.id;
      }

      for (const translation of category.translations) {
        const [existingLocale] = await queryRunner.query(
          `
            SELECT id
            FROM category_translations
            WHERE category_id = $1 AND locale = $2
            LIMIT 1
          `,
          [categoryId, translation.locale]
        );

        if (existingLocale) {
          continue;
        }

        await queryRunner.query(
          `
            INSERT INTO category_translations (
              category_id,
              locale,
              name,
              description,
              slug,
              meta_title,
              meta_description,
              meta_keywords,
              og_title,
              og_description,
              created_at,
              updated_at
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW()
            )
          `,
          [
            categoryId,
            translation.locale,
            translation.name,
            translation.description,
            translation.slug,
            translation.metaTitle,
            translation.metaDescription,
            translation.metaKeywords,
            translation.ogTitle,
            translation.ogDescription
          ]
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const viSlugs = CATEGORY_SEEDS.map((category) =>
      category.translations.find((translation) => translation.locale === 'vi')?.slug
    ).filter(Boolean);

    const categoriesToDelete = await queryRunner.query(
      `
        SELECT DISTINCT ct.category_id
        FROM category_translations ct
        JOIN categories c ON c.id = ct.category_id
        WHERE c.category_type = 'news'
          AND ct.locale = 'vi'
          AND ct.slug = ANY($1)
      `,
      [viSlugs]
    );

    if (!categoriesToDelete.length) {
      return;
    }

    const categoryIds = categoriesToDelete.map((row: { category_id: number }) => row.category_id);

    await queryRunner.query(
      `
        DELETE FROM post_categories
        WHERE category_id = ANY($1)
      `,
      [categoryIds]
    );

    await queryRunner.query(
      `
        DELETE FROM categories
        WHERE id = ANY($1)
      `,
      [categoryIds]
    );
  }
}
