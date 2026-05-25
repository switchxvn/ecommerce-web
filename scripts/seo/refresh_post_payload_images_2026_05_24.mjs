import fs from 'node:fs/promises';
import path from 'node:path';

const payloadDir = path.resolve('scripts/seo/generated-post-payloads/2026-05-24');
const uploadManifestPath = path.resolve('scripts/seo/generated-post-media/2026-05-24/uploaded.json');

const replacements = {
  'ban-xe-nang-dien-tai-tphcm-nen-chon-mau-nao': {
    thumbnail: 'posts/ban-xe-nang-dien-tai-tphcm-nen-chon-mau-nao-thumb.png',
    images: [
      'posts/ban-xe-nang-dien-tai-tphcm-nen-chon-mau-nao-inline-1.png',
      'posts/ban-xe-nang-dien-tai-tphcm-nen-chon-mau-nao-inline-2.png',
      'posts/ban-xe-nang-dien-tai-tphcm-nen-chon-mau-nao-inline-3.png',
    ],
  },
  'cho-thue-xe-nang-dau-tai-tphcm-nen-thue-2-5-tan-hay-5-tan': {
    thumbnail: 'posts/cho-thue-xe-nang-dau-tai-tphcm-nen-thue-2-5-tan-hay-5-tan-thumb.png',
    images: [
      'posts/cho-thue-xe-nang-dau-tai-tphcm-nen-thue-2-5-tan-hay-5-tan-inline-1.png',
      'posts/cho-thue-xe-nang-dau-tai-tphcm-nen-thue-2-5-tan-hay-5-tan-inline-2.png',
      'posts/cho-thue-xe-nang-dau-tai-tphcm-nen-thue-2-5-tan-hay-5-tan-inline-3.png',
    ],
  },
  'cho-thue-xe-nang-dien-tai-tphcm-chon-xe-dung-lai-hay-stacker': {
    thumbnail: 'posts/cho-thue-xe-nang-dien-tai-tphcm-chon-xe-dung-lai-hay-stacker-thumb.png',
    images: [
      'posts/cho-thue-xe-nang-dien-tai-tphcm-chon-xe-dung-lai-hay-stacker-inline-1.png',
      'posts/cho-thue-xe-nang-dien-tai-tphcm-chon-xe-dung-lai-hay-stacker-inline-2.png',
      'posts/cho-thue-xe-nang-dien-tai-tphcm-chon-xe-dung-lai-hay-stacker-inline-3.png',
    ],
  },
};

const uploaded = JSON.parse(await fs.readFile(uploadManifestPath, 'utf8'));
const urlByKey = Object.fromEntries(uploaded.map((item) => [item.key, item.url]));

for (const [slug, config] of Object.entries(replacements)) {
  const filePath = path.join(payloadDir, `${slug}.json`);
  const payload = JSON.parse(await fs.readFile(filePath, 'utf8'));
  const imageUrls = config.images.map((key) => {
    const url = urlByKey[key];
    if (!url) {
      throw new Error(`Missing uploaded URL for ${key}`);
    }
    return url;
  });
  const thumbnailUrl = urlByKey[config.thumbnail];
  if (!thumbnailUrl) {
    throw new Error(`Missing uploaded URL for ${config.thumbnail}`);
  }

  payload.thumbnail = thumbnailUrl;
  payload.og_image = thumbnailUrl;

  let imageIndex = 0;
  payload.content_html = payload.content_html.replace(/<img([^>]+)src="[^"]+"/g, (match, rest) => {
    const nextUrl = imageUrls[imageIndex];
    if (!nextUrl) {
      throw new Error(`Too many inline images found in ${slug}`);
    }
    imageIndex += 1;
    return `<img${rest}src="${nextUrl}"`;
  });

  if (imageIndex !== imageUrls.length) {
    throw new Error(`Expected ${imageUrls.length} inline images in ${slug}, found ${imageIndex}`);
  }

  await fs.writeFile(filePath, JSON.stringify(payload, null, 2) + '\n', 'utf8');
}
