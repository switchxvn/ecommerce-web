import test from 'node:test';
import assert from 'node:assert/strict';

import {
  categoryUpdates,
  serviceDefinitions,
  articleDefinitions,
  requiredServiceSlugs,
  requiredArticleSlugs,
} from './forklift-cluster-2026-05-28.data.mjs';

function countOccurrences(text, fragment) {
  return (text.match(new RegExp(fragment, 'g')) || []).length;
}

function assertRichContent(item, html, { canonicalPrefix }) {
  assert.ok(html.includes('Câu hỏi thường gặp'), `${item.slug} must include FAQ heading`);
  assert.ok(countOccurrences(html, '<h2>') >= 5, `${item.slug} must include at least 5 h2 sections`);
  assert.ok(countOccurrences(html, '<img ') >= 2, `${item.slug} must include at least 2 inline images`);
  assert.ok(!html.includes('cdn.captreonuisam.com'), `${item.slug} must not include legacy CDN URLs`);

  const imageUrls = [...html.matchAll(/src="([^"]+)"/g)].map((match) => match[1]);
  assert.ok(imageUrls.length >= 2, `${item.slug} must expose image URLs`);
  for (const imageUrl of imageUrls) {
    assert.ok(
      imageUrl.startsWith('https://cdn.mgavietnam.com/'),
      `${item.slug} image must use MGA CDN: ${imageUrl}`,
    );
  }

  assert.equal(
    item.canonicalUrl,
    `${canonicalPrefix}/${item.slug}`,
    `${item.slug} canonical URL must match slug`,
  );
}

test('cluster data contains all required service slugs', () => {
  const slugs = new Set(serviceDefinitions.map((item) => item.slug));
  for (const slug of requiredServiceSlugs) {
    assert.ok(slugs.has(slug), `missing service slug ${slug}`);
  }
});

test('cluster data contains all required article slugs', () => {
  const slugs = new Set(articleDefinitions.map((item) => item.slug));
  for (const slug of requiredArticleSlugs) {
    assert.ok(slugs.has(slug), `missing article slug ${slug}`);
  }
});

test('all services satisfy content and media minimums', () => {
  for (const item of serviceDefinitions) {
    assertRichContent(item, item.description, {
      canonicalPrefix: 'https://mgavietnam.com/dich-vu',
    });
  }
});

test('all articles satisfy content and media minimums', () => {
  for (const item of articleDefinitions) {
    assertRichContent(item, item.content, {
      canonicalPrefix: 'https://mgavietnam.com/bai-viet',
    });
  }
});

test('category update for phụ tùng xe nâng is enriched and MGA-hosted', () => {
  const category = categoryUpdates.find((item) => item.slug === 'phu-tung-xe-nang');
  assert.ok(category, 'missing phu-tung-xe-nang category update');
  assertRichContent(category, category.description, {
    canonicalPrefix: 'https://mgavietnam.com/danh-muc-san-pham',
  });
  assert.ok(
    category.description.includes('https://mgavietnam.com/dich-vu/sua-xe-nang'),
    'phu-tung-xe-nang should link to sua-xe-nang',
  );
  assert.ok(
    category.description.includes('https://mgavietnam.com/dich-vu/yeu-cau-bao-duong'),
    'phu-tung-xe-nang should link to yeu-cau-bao-duong',
  );
});

test('broad and local pages keep distinct positioning', () => {
  const broadRepair = serviceDefinitions.find((item) => item.slug === 'sua-xe-nang');
  const broadRent = serviceDefinitions.find((item) => item.slug === 'cho-thue-xe-nang');

  assert.ok(broadRepair.metaTitle.includes('Sửa xe nâng'), 'broad repair page should target head term');
  assert.ok(!broadRepair.metaTitle.includes('TPHCM'), 'broad repair page should avoid local modifier');
  assert.ok(
    broadRepair.description.includes('https://mgavietnam.com/dich-vu/sua-xe-nang-tphcm'),
    'broad repair page should route local intent to sua-xe-nang-tphcm',
  );
  assert.ok(broadRent.metaTitle.includes('Cho thuê xe nâng'), 'broad rent page should target head term');
  assert.ok(!broadRent.metaTitle.includes('TPHCM'), 'broad rent page should avoid local modifier');
  assert.ok(
    broadRent.description.includes('https://mgavietnam.com/dich-vu/cho-thue-xe-nang-tphcm'),
    'broad rent page should route local intent to cho-thue-xe-nang-tphcm',
  );
});

test('internal-link routing is present on the new pillar pages', () => {
  const pricePillar = articleDefinitions.find((item) => item.slug === 'gia-xe-nang-2026-theo-dong-va-tai-trong');
  const guidePillar = articleDefinitions.find((item) => item.slug === 'xe-nang-la-gi-cac-dong-xe-va-cach-chon');

  assert.ok(
    pricePillar.content.includes('https://mgavietnam.com/dich-vu/ban-xe-nang'),
    'price pillar should link to ban-xe-nang',
  );
  assert.ok(
    guidePillar.content.includes('https://mgavietnam.com/dich-vu/cho-thue-xe-nang'),
    'guide pillar should link to cho-thue-xe-nang',
  );
  assert.ok(
    guidePillar.content.includes('https://mgavietnam.com/dich-vu/sua-xe-nang'),
    'guide pillar should link to sua-xe-nang',
  );
});
