import path from 'node:path';
import dotenv from 'dotenv';
import pg from 'pg';

import { categoryUpdates, serviceDefinitions, articleDefinitions } from './forklift-cluster-2026-05-28.data.mjs';

dotenv.config({ path: path.resolve('.env') });

const { Client } = pg;

function getClientConfig() {
  if (process.env.DATABASE_URL) {
    return { connectionString: process.env.DATABASE_URL };
  }

  return {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  };
}

async function resetSequences(client) {
  await client.query(`SELECT setval('posts_id_seq', COALESCE((SELECT MAX(id) FROM posts), 1), true)`);
  await client.query(
    `SELECT setval('post_translations_id_seq', COALESCE((SELECT MAX(id) FROM post_translations), 1), true)`,
  );
  await client.query(`SELECT setval('services_id_seq', COALESCE((SELECT MAX(id) FROM services), 1), true)`);
  await client.query(
    `SELECT setval('service_translations_id_seq', COALESCE((SELECT MAX(id) FROM service_translations), 1), true)`,
  );
}

async function updateCategory(client, item) {
  await client.query(
    `
      UPDATE category_translations
      SET description = $1,
          meta_title = $2,
          meta_description = $3,
          meta_keywords = $4,
          og_title = $5,
          og_description = $6,
          canonical_url = $7,
          og_image = $8,
          updated_at = now()
      WHERE category_id = $9 AND locale = 'vi'
    `,
    [
      item.description,
      item.metaTitle,
      item.metaDescription,
      item.metaKeywords,
      item.ogTitle,
      item.ogDescription,
      item.canonicalUrl,
      item.ogImage,
      item.categoryId,
    ],
  );
}

async function upsertService(client, item) {
  const existing = await client.query(
    `
      SELECT s.id
      FROM services s
      JOIN service_translations st ON st.service_id = s.id
      WHERE st.slug = $1 AND st.locale = 'vi'
      LIMIT 1
    `,
    [item.slug],
  );

  let serviceId = existing.rows[0]?.id;

  if (!serviceId) {
    const inserted = await client.query(
      `
        INSERT INTO services (icon, "order", is_active, is_featured, is_new, thumbnail)
        VALUES ($1, 0, true, true, true, $2)
        RETURNING id
      `,
      [item.icon, item.thumbnail],
    );

    serviceId = inserted.rows[0].id;
  } else {
    await client.query(
      `
        UPDATE services
        SET icon = $1,
            thumbnail = $2,
            is_active = true,
            is_featured = true,
            updated_at = now()
        WHERE id = $3
      `,
      [item.icon, item.thumbnail, serviceId],
    );
  }

  const translationExists = await client.query(
    `SELECT id FROM service_translations WHERE service_id = $1 AND locale = 'vi'`,
    [serviceId],
  );

  if (translationExists.rowCount) {
    await client.query(
      `
        UPDATE service_translations
        SET title = $1,
            description = $2,
            short_description = $3,
            meta_title = $4,
            meta_description = $5,
            meta_keywords = $6,
            og_title = $7,
            og_description = $8,
            og_image = $9,
            canonical_url = $10,
            slug = $11,
            updated_at = now()
        WHERE service_id = $12 AND locale = 'vi'
      `,
      [
        item.title,
        item.description,
        item.shortDescription,
        item.metaTitle,
        item.metaDescription,
        item.metaKeywords,
        item.ogTitle,
        item.ogDescription,
        item.ogImage,
        item.canonicalUrl,
        item.slug,
        serviceId,
      ],
    );
  } else {
    await client.query(
      `
        INSERT INTO service_translations
        (title, description, short_description, locale, meta_title, meta_description, meta_keywords, og_title, og_description, og_image, canonical_url, service_id, slug)
        VALUES ($1, $2, $3, 'vi', $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `,
      [
        item.title,
        item.description,
        item.shortDescription,
        item.metaTitle,
        item.metaDescription,
        item.metaKeywords,
        item.ogTitle,
        item.ogDescription,
        item.ogImage,
        item.canonicalUrl,
        serviceId,
        item.slug,
      ],
    );
  }

  return { id: serviceId, slug: item.slug, title: item.title };
}

async function upsertPost(client, item) {
  const existing = await client.query(
    `
      SELECT p.id
      FROM posts p
      JOIN post_translations pt ON pt.post_id = p.id
      WHERE pt.slug = $1 AND pt.locale = 'vi'
      LIMIT 1
    `,
    [item.slug],
  );

  let postId = existing.rows[0]?.id;

  if (!postId) {
    const inserted = await client.query(
      `
        INSERT INTO posts (title, content, published, thumbnail, short_description)
        VALUES ($1, $2, true, $3, $4)
        RETURNING id
      `,
      [item.title, item.content, item.thumbnail, item.shortDescription],
    );

    postId = inserted.rows[0].id;
  } else {
    await client.query(
      `
        UPDATE posts
        SET title = $1,
            content = $2,
            published = true,
            thumbnail = $3,
            short_description = $4,
            updated_at = now()
        WHERE id = $5
      `,
      [item.title, item.content, item.thumbnail, item.shortDescription, postId],
    );
  }

  const translationExists = await client.query(
    `SELECT id FROM post_translations WHERE post_id = $1 AND locale = 'vi'`,
    [postId],
  );

  if (translationExists.rowCount) {
    await client.query(
      `
        UPDATE post_translations
        SET title = $1,
            content = $2,
            slug = $3,
            short_description = $4,
            meta_title = $5,
            meta_description = $6,
            meta_keywords = $7,
            og_title = $8,
            og_description = $9,
            og_image = $10,
            canonical_url = $11,
            updated_at = now()
        WHERE post_id = $12 AND locale = 'vi'
      `,
      [
        item.title,
        item.content,
        item.slug,
        item.shortDescription,
        item.metaTitle,
        item.metaDescription,
        item.metaKeywords,
        item.ogTitle,
        item.ogDescription,
        item.ogImage,
        item.canonicalUrl,
        postId,
      ],
    );
  } else {
    await client.query(
      `
        INSERT INTO post_translations
        (title, content, locale, post_id, slug, short_description, meta_title, meta_description, meta_keywords, og_title, og_description, og_image, canonical_url)
        VALUES ($1, $2, 'vi', $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `,
      [
        item.title,
        item.content,
        postId,
        item.slug,
        item.shortDescription,
        item.metaTitle,
        item.metaDescription,
        item.metaKeywords,
        item.ogTitle,
        item.ogDescription,
        item.ogImage,
        item.canonicalUrl,
      ],
    );
  }

  await client.query(`DELETE FROM post_categories WHERE post_id = $1`, [postId]);
  await client.query(`INSERT INTO post_categories (post_id, category_id) VALUES ($1, $2)`, [postId, item.categoryId]);

  return { id: postId, slug: item.slug, title: item.title };
}

async function main() {
  const client = new Client(getClientConfig());
  await client.connect();

  const summary = {
    categories: [],
    services: [],
    posts: [],
  };

  try {
    await client.query('BEGIN');
    await resetSequences(client);

    for (const item of categoryUpdates) {
      await updateCategory(client, item);
      summary.categories.push({ slug: item.slug, categoryId: item.categoryId });
    }

    for (const item of serviceDefinitions) {
      summary.services.push(await upsertService(client, item));
    }

    for (const item of articleDefinitions) {
      summary.posts.push(await upsertPost(client, item));
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }

  process.stdout.write(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
