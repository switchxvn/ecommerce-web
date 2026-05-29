#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

"${SCRIPT_DIR}/run_psql_env.sh" <<'SQL'
\pset footer off
\pset format aligned

WITH targets AS (
  SELECT
    'product' AS type,
    p.id AS entity_id,
    pt.slug,
    pt.title,
    'https://mgavietnam.com/san-pham/' || pt.slug AS url
  FROM product_translations pt
  JOIN products p ON p.id = pt.product_id
  WHERE pt.locale = 'vi' AND COALESCE(p.published, false) = true AND pt.slug IS NOT NULL

  UNION ALL

  SELECT
    'service' AS type,
    s.id AS entity_id,
    st.slug,
    st.title,
    'https://mgavietnam.com/dich-vu/' || st.slug AS url
  FROM service_translations st
  JOIN services s ON s.id = st.service_id
  WHERE st.locale = 'vi' AND COALESCE(s.is_active, false) = true AND st.slug IS NOT NULL

  UNION ALL

  SELECT
    'category' AS type,
    c.id AS entity_id,
    ct.slug,
    ct.name AS title,
    'https://mgavietnam.com/danh-muc-san-pham/' || ct.slug AS url
  FROM category_translations ct
  JOIN categories c ON c.id = ct.category_id
  WHERE ct.locale = 'vi' AND COALESCE(c.active, false) = true AND ct.slug IS NOT NULL

  UNION ALL

  SELECT
    'post' AS type,
    p.id AS entity_id,
    pt.slug,
    pt.title,
    'https://mgavietnam.com/bai-viet/' || pt.slug AS url
  FROM post_translations pt
  JOIN posts p ON p.id = pt.post_id
  WHERE pt.locale = 'vi' AND COALESCE(p.published, false) = true AND pt.slug IS NOT NULL
)
SELECT type, entity_id, slug, title, url
FROM targets
ORDER BY type, title;
SQL
