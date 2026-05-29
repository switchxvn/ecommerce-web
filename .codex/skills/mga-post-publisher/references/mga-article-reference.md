# MGA Article Reference

## Routes

- Product detail: `https://mgavietnam.com/san-pham/<slug>`
- Service detail: `https://mgavietnam.com/dich-vu/<slug>`
- Category detail: `https://mgavietnam.com/danh-muc-san-pham/<slug>`
- Post detail (vi): `https://mgavietnam.com/bai-viet/<slug>`

## Required Read Before Drafting

- Project workflow: [docs/seo-workflow.md](/Users/abc/project/mga/docs/seo-workflow.md)
- SEO skill: `/Users/abc/.codex/skills/Agentic-SEO-Skill/SKILL.md`

## Article Minimums

- Language: Vietnamese
- Structure: at least 5 substantive `h2` sections plus FAQ
- Intent: based on current keyword research, not guessed
- Internal links: use relevant MGA products, services, categories, or posts
- Images:
  - 1 dedicated thumbnail
  - 2-3 inline images when the topic benefits from visual support
  - one prompt per image in ChatGPT/Vivaldi
  - original downloads only, not screenshots
- Final image hosting: `https://cdn.mgavietnam.com/...`

## PostgreSQL Content Model

Primary tables for article publishing:

- `posts`
  - `id`
  - `title`
  - `content`
  - `short_description`
  - `thumbnail`
  - `published`
  - `author_id`
- `post_translations`
  - `post_id`
  - `locale`
  - `title`
  - `content`
  - `slug`
  - `short_description`
  - `meta_title`
  - `meta_description`
  - `meta_keywords`
  - `og_title`
  - `og_description`
  - `og_image`
  - `canonical_url`
- `post_categories`
- `tags`
- `post_tags`

## Internal Link Sources

Use `scripts/list_internal_targets.sh` to inspect likely candidates across:

- `product_translations` + `products`
- `service_translations` + `services`
- `category_translations` + `categories`
- `post_translations` + `posts`

Prefer URLs that match the section being discussed. Avoid stuffing many links into one paragraph.

## Publish Rules

- Load `.env` before any DB command.
- Do not hardcode credentials.
- Treat slug as unique for `post_translations`.
- Use article canonical URL as `https://mgavietnam.com/bai-viet/<slug>`.
- Keep `posts.thumbnail` and `post_translations.og_image` on MGA CDN.
- Keep all inline image `src` values on MGA CDN.

## FAQ Rule

- Visible FAQ section in the article body is required.
- Do not add `FAQPage` schema for MGA commercial pages.
