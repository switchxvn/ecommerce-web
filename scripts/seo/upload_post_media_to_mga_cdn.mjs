import fs from 'node:fs/promises';
import path from 'node:path';
import dotenv from 'dotenv';
import pg from 'pg';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

dotenv.config({ path: path.resolve('.env') });

const { Client } = pg;

async function main() {
  const manifestPath = process.argv[2];
  if (!manifestPath) {
    throw new Error('Usage: node scripts/seo/upload_post_media_to_mga_cdn.mjs <manifest.json>');
  }

  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
  if (!Array.isArray(manifest) || manifest.length === 0) {
    throw new Error('Manifest must be a non-empty JSON array');
  }

  const clientConfig = process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT || 5432),
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
      };

  const client = new Client(clientConfig);
  await client.connect();

  const configResult = await client.query(`
    select endpoint, region, bucket, access_key, secret_key, public_url
    from upload_config
    where is_active = true
    order by id asc
    limit 1
  `);
  await client.end();

  if (configResult.rows.length === 0) {
    throw new Error('No active upload_config found');
  }

  const config = configResult.rows[0];
  const s3 = new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    credentials: {
      accessKeyId: config.access_key,
      secretAccessKey: config.secret_key,
    },
    forcePathStyle: true,
  });

  const uploaded = [];

  for (const item of manifest) {
    if (!item.source || !item.key) {
      throw new Error(`Manifest item missing source/key: ${JSON.stringify(item)}`);
    }

    const buffer = await fs.readFile(item.source);
    const ext = path.extname(item.key).toLowerCase();
    const contentType = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png';

    await s3.send(
      new PutObjectCommand({
        Bucket: config.bucket,
        Key: item.key,
        Body: buffer,
        ContentType: contentType,
        ACL: 'public-read',
      }),
    );

    uploaded.push({
      source: item.source,
      key: item.key,
      url: `${config.public_url}/${item.key}`,
    });
  }

  process.stdout.write(JSON.stringify(uploaded, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
