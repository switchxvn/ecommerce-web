#!/usr/bin/env python3
import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any


CDN_HOST = "https://cdn.mgavietnam.com/"
SITE_POST_PREFIX = "https://mgavietnam.com/bai-viet/"


def fail(message: str) -> None:
    print(f"ERROR: {message}", file=sys.stderr)
    raise SystemExit(1)


def sql_quote(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def slugify(value: str) -> str:
    value = value.strip().lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    value = re.sub(r"-{2,}", "-", value).strip("-")
    return value


def read_payload(path: Path) -> dict[str, Any]:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        fail(f"Payload file not found: {path}")
    except json.JSONDecodeError as exc:
        fail(f"Invalid JSON: {exc}")


def get_text(payload: dict[str, Any], *keys: str, required: bool = False) -> str:
    for key in keys:
        value = payload.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    if required:
        fail(f"Missing required text field: one of {', '.join(keys)}")
    return ""


def require_cdn_url(name: str, url: str) -> None:
    if not url.startswith(CDN_HOST):
        fail(f"{name} must use {CDN_HOST}")


def validate_content(content_html: str) -> list[str]:
    h2_count = len(re.findall(r"<h2\b", content_html, flags=re.IGNORECASE))
    if h2_count < 5:
        fail("Article must contain at least 5 <h2> sections")

    if not re.search(r"faq|câu hỏi thường gặp", content_html, flags=re.IGNORECASE):
        fail("Article must contain an FAQ section")

    image_urls = re.findall(r'<img[^>]+src="([^"]+)"', content_html, flags=re.IGNORECASE)
    if len(image_urls) < 2:
        fail("Article must contain at least 2 inline images")

    for image_url in image_urls:
        require_cdn_url("inline image", image_url)

    return image_urls


def to_sql_text_array(items: list[str]) -> str:
    if not items:
        return "ARRAY[]::text[]"
    return "ARRAY[" + ", ".join(sql_quote(item) for item in items) + "]"


def to_sql_int_array(items: list[int]) -> str:
    if not items:
        return "ARRAY[]::integer[]"
    return "ARRAY[" + ", ".join(str(item) for item in items) + "]"


def build_sql(payload: dict[str, Any]) -> str:
    slug = get_text(payload, "slug", required=True)
    title = get_text(payload, "title", required=True)
    content = get_text(payload, "content_html", "content", required=True)
    short_description = get_text(payload, "short_description", "shortDescription", required=True)
    meta_title = get_text(payload, "meta_title", "metaTitle", required=True)
    meta_description = get_text(payload, "meta_description", "metaDescription", required=True)
    meta_keywords = get_text(payload, "meta_keywords", "metaKeywords")
    og_title = get_text(payload, "og_title", "ogTitle") or meta_title
    og_description = get_text(payload, "og_description", "ogDescription") or meta_description
    thumbnail = get_text(payload, "thumbnail", required=True)
    og_image = get_text(payload, "og_image", "ogImage", required=True)
    canonical_url = get_text(payload, "canonical_url", "canonicalUrl") or f"{SITE_POST_PREFIX}{slug}"
    status = get_text(payload, "status") or "draft"
    author_id = get_text(payload, "author_id", "authorId")

    require_cdn_url("thumbnail", thumbnail)
    require_cdn_url("og_image", og_image)
    if not canonical_url.startswith(SITE_POST_PREFIX):
        fail(f"canonical_url must start with {SITE_POST_PREFIX}")

    validate_content(content)

    category_ids = payload.get("category_ids") or payload.get("categoryIds") or []
    if not isinstance(category_ids, list) or not all(isinstance(item, int) for item in category_ids):
        fail("category_ids must be an array of integers")

    tags_raw = payload.get("tags") or []
    if not isinstance(tags_raw, list) or not all(isinstance(item, str) and item.strip() for item in tags_raw):
        fail("tags must be an array of non-empty strings")
    tags = list(dict.fromkeys(item.strip() for item in tags_raw))

    if slugify(slug) != slug:
        fail("slug must already be lowercase hyphen-case")

    published = status.lower() == "published"
    if status.lower() not in {"published", "draft"}:
        fail("status must be 'published' or 'draft'")

    tag_records = [{"name": tag, "slug": slugify(tag)} for tag in tags]
    tag_name_array = to_sql_text_array([record["name"] for record in tag_records])
    tag_slug_array = to_sql_text_array([record["slug"] for record in tag_records])
    category_id_array = to_sql_int_array(category_ids)
    author_provided = bool(author_id)

    return f"""DO $$
DECLARE
  v_post_id integer;
  v_translation_id integer;
  v_author_id users.id%TYPE;
  v_tag_name text;
  v_tag_slug text;
  v_tag_id integer;
  v_tag_names text[] := {tag_name_array};
  v_tag_slugs text[] := {tag_slug_array};
  v_category_ids integer[] := {category_id_array};
BEGIN
  SELECT pt.post_id, pt.id
  INTO v_post_id, v_translation_id
  FROM post_translations pt
  WHERE pt.slug = {sql_quote(slug)} AND pt.locale = 'vi'
  LIMIT 1;

  IF {'true' if author_provided else 'false'} THEN
    v_author_id := {sql_quote(author_id)};
  ELSE
    SELECT u.id
    INTO v_author_id
    FROM users u
    WHERE COALESCE(u.is_active, false) = true
    ORDER BY u.created_at ASC
    LIMIT 1;
  END IF;

  IF v_author_id IS NULL THEN
    RAISE EXCEPTION 'No active user found for author_id fallback';
  END IF;

  IF v_post_id IS NULL THEN
    INSERT INTO posts (
      title,
      content,
      short_description,
      thumbnail,
      published,
      author_id
    ) VALUES (
      {sql_quote(title)},
      {sql_quote(content)},
      {sql_quote(short_description)},
      {sql_quote(thumbnail)},
      {'true' if published else 'false'},
      v_author_id
    )
    RETURNING id INTO v_post_id;

    INSERT INTO post_translations (
      post_id,
      locale,
      title,
      content,
      slug,
      short_description,
      meta_title,
      meta_description,
      meta_keywords,
      og_title,
      og_description,
      og_image,
      canonical_url
    ) VALUES (
      v_post_id,
      'vi',
      {sql_quote(title)},
      {sql_quote(content)},
      {sql_quote(slug)},
      {sql_quote(short_description)},
      {sql_quote(meta_title)},
      {sql_quote(meta_description)},
      {sql_quote(meta_keywords)},
      {sql_quote(og_title)},
      {sql_quote(og_description)},
      {sql_quote(og_image)},
      {sql_quote(canonical_url)}
    )
    RETURNING id INTO v_translation_id;
  ELSE
    UPDATE posts
    SET
      title = {sql_quote(title)},
      content = {sql_quote(content)},
      short_description = {sql_quote(short_description)},
      thumbnail = {sql_quote(thumbnail)},
      published = {'true' if published else 'false'},
      author_id = v_author_id,
      updated_at = NOW()
    WHERE id = v_post_id;

    UPDATE post_translations
    SET
      title = {sql_quote(title)},
      content = {sql_quote(content)},
      slug = {sql_quote(slug)},
      short_description = {sql_quote(short_description)},
      meta_title = {sql_quote(meta_title)},
      meta_description = {sql_quote(meta_description)},
      meta_keywords = {sql_quote(meta_keywords)},
      og_title = {sql_quote(og_title)},
      og_description = {sql_quote(og_description)},
      og_image = {sql_quote(og_image)},
      canonical_url = {sql_quote(canonical_url)},
      updated_at = NOW()
    WHERE id = v_translation_id;

    DELETE FROM post_categories WHERE post_id = v_post_id;
    DELETE FROM post_tags WHERE post_id = v_post_id;
  END IF;

  IF array_length(v_category_ids, 1) IS NOT NULL THEN
    INSERT INTO post_categories (post_id, category_id)
    SELECT v_post_id, category_id
    FROM unnest(v_category_ids) AS category_id;
  END IF;

  IF array_length(v_tag_names, 1) IS NOT NULL THEN
    FOR i IN 1 .. array_length(v_tag_names, 1) LOOP
      v_tag_name := v_tag_names[i];
      v_tag_slug := v_tag_slugs[i];

      INSERT INTO tags (name, slug, is_active, "order", created_at, updated_at)
      VALUES (v_tag_name, v_tag_slug, true, 0, NOW(), NOW())
      ON CONFLICT (slug) DO UPDATE
      SET name = EXCLUDED.name, updated_at = NOW()
      RETURNING id INTO v_tag_id;

      INSERT INTO post_tags (post_id, tag_id, created_at, updated_at)
      VALUES (v_post_id, v_tag_id, NOW(), NOW());
    END LOOP;
  END IF;

  RAISE NOTICE 'Published slug %, post_id %', {sql_quote(slug)}, v_post_id;
END $$;
"""


def main() -> None:
    parser = argparse.ArgumentParser(description="Render MGA article upsert SQL from JSON payload")
    parser.add_argument("payload", type=Path)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()

    payload = read_payload(args.payload)
    sql = build_sql(payload)

    if args.output:
        args.output.write_text(sql, encoding="utf-8")
    else:
        print(sql)


if __name__ == "__main__":
    main()
