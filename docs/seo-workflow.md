# MGA SEO Workflow

Project-specific SEO execution notes for future category, product, and article SEO work.

## Skills

- Use `$seo` at `/Users/abc/.codex/skills/Agentic-SEO-Skill/SKILL.md` whenever the task involves SEO analysis, keyword research, metadata optimization, schema review, or SEO-driven content decisions.
- Use project env-first PostgreSQL access. Load `.env` before any DB command.

## Database Rules

- Category SEO lives in `category_translations`, not `categories`.
- Product SEO text lives in `product_translations`.
- Product media lives in `products.thumbnail` and `products.gallery`.
- Product specifications live in `product_specifications` and `product_specification_translations`.
- Keep `name`, `description`, and existing slugs unchanged unless the user explicitly asks to change them.

## Canonical Rules

- For category pages, use the real frontend route, not generic `/categories/...`.
- Current category canonical pattern:
  - `https://mgavietnam.com/danh-muc-san-pham/<slug>`

## Category SEO Workflow

1. Research current keywords using `$seo` plus live SERP checks.
2. Inspect the actual frontend route before writing canonical URLs.
3. Update only the approved SEO fields in `category_translations`.
4. Verify live HTML after DB update:
   - `<title>`
   - meta description
   - canonical
   - `og:image` / `twitter:image` when relevant

## Product SEO Workflow

1. Inspect current product data in `products` and `product_translations`.
2. If specs are missing, check trusted MGA-related references before inferring anything.
3. Prefer controlled inference only for clearly supported claims.
4. Update:
   - `short_description`
   - `content`
   - `meta_title`
   - `meta_description`
   - `meta_keywords`
   - `og_title`
   - `og_description`
   - `products.gallery` when useful
5. If specs are available from a trusted source, store them in:
   - `product_specifications`
   - `product_specification_translations`

## Article SEO Workflow

1. Use `$seo` plus live SERP checks before drafting any article.
2. Identify the dominant search intent first:
   - informational
   - commercial investigation
   - transactional support
   - problem / solution troubleshooting
3. Match the article angle to the dominant intent instead of forcing a generic blog format.
4. Build the outline from current SERP patterns:
   - what questions appear in titles and headings
   - what comparisons, checklists, or how-to sections repeat
   - what pain points and buying concerns show up consistently
5. Write for humans first, but make the target query explicit in:
   - title
   - intro
   - at least one `h2`
   - meta title and meta description
6. Use internal links to relevant product pages inside the article body:
   - link where the user naturally expects the next action
   - use descriptive anchors, not vague anchors like `xem thêm` unless context already makes the target obvious
   - prefer links to the exact matching product or category, not a loosely related page
7. If the article discusses a product type, include at least 1-3 links to:
   - the most relevant product pages
   - the matching category page when useful
8. Keep claims aligned with real product data. Do not promise specs, pricing, or features that the linked products do not support.
9. After publishing or DB update, verify:
   - title
   - meta description
   - heading structure
   - internal links resolve correctly
   - linked products are contextually relevant to the article intent
10. Do not reuse one product image across multiple SEO articles in the same topic cluster when it makes cards look repetitive.
11. Give each article its own thumbnail that matches the article intent:
   - comparison article: a compare-style visual
   - cost article: operating / ownership cues
   - buying guide: product-in-use / selection context
   - maintenance article: service / inspection context
12. If the existing media library does not have a good match:
   - generate or source a fitting visual
   - download the original file locally
   - upload it to MGA storage
   - store the final MGA URL in `posts.thumbnail`
13. For long-form SEO articles, add 2-3 inline images inside the article body when the topic benefits from visual support:
   - place them between major sections, not as a block at the top
   - vary the scene by intent, for example comparison / operation / maintenance / buying context
   - use meaningful `alt` text that describes the scene naturally
14. When inline article images are generated in ChatGPT through Vivaldi:
   - save the original rendered files, not screenshots
   - rename them to stable slug-based filenames
   - upload them to MGA storage before inserting into `post_translations.content`
   - only use final `https://cdn.mgavietnam.com/...` URLs in article HTML
   - mirror the same image into `post_translations.og_image` unless there is a stronger social image available

## Article Content Format

- Default to long-form, intent-matched articles rather than thin filler posts.
- Preferred article structure:
  1. Search-intent-aligned intro
  2. Clear answer or framing section early
  3. Practical detail sections with `h2`
  4. Buying / selection / troubleshooting guidance when relevant
  5. Short conclusion with next-step internal links
- Keep the first 1-2 paragraphs strong enough to satisfy users who only skim.
- Use concise emphasis only where it improves comprehension:
  - bold a small number of phrases for core problem, product type, or key decision factor
  - do not turn the article into visually noisy keyword stuffing
- Favor content that can rank and convert:
  - answer the query clearly
  - reduce ambiguity
  - surface the right related product at the right moment
- When inserting product links in articles:
  - place them after explaining why the product is relevant
  - prefer exact-match anchors like `xe nâng điện MGA 2.5 tấn` or `máy phát điện MGA 350KVA`
  - avoid stuffing multiple product links into one paragraph
- For article thumbnails:
  - prefer one dedicated thumbnail per article, not one shared product image for an entire article cluster
  - keep the visual system consistent inside the same cluster, but vary subject and composition enough that cards do not look duplicated
  - avoid baking large text blocks, fake logos, watermarks, or collage borders into the image
  - target a clean 16:9 editorial thumbnail that still reads well in small cards

## Product Content Format

- Default to long-form product content, not a single short intro paragraph.
- Use structured HTML with multiple `h2` sections so the product page TOC stays useful.
- Preferred section order:
  1. Opening overview and intended usage
  2. Key advantages / notable strengths
  3. Real-world use cases or operating environments
  4. Configuration options and what buyers should check
  5. Selection guidance / buying notes
- Keep specifications in the dedicated spec tab, but reference the important operating context in the main content.
- Aim for practical, buyer-oriented copy rather than generic filler.
- Use light emphasis only where it improves scanning for humans:
  - bold 1-2 short phrases for load capacity, engine, or operating environment
  - examples: `tải trọng nâng 2.5 tấn`, `động cơ ISUZU`, `kho xưởng và bãi hàng`
  - do not repeat the same bolded keyword block excessively
- When working from inferred or partially verified source data, state flexible claims carefully:
  - use wording like `tham chiếu theo cấu hình`, `có thể tùy chọn`, `phù hợp cho`
  - avoid hard claims that are not grounded in a trusted source
- For media inside content:
  - use 2-4 images when the page has enough supporting visuals
  - place images between sections, not all at the top
  - only use `cdn.mgavietnam.com` URLs in final content
  - for SEO articles, prefer 2-3 inline images in the body plus a separate thumbnail

## Image Rules

- Do not leave third-party image URLs in final product/category content.
- Do not leave third-party image URLs in final article thumbnails or article OG images.
- If an external image is selected:
  1. Download it locally.
  2. Upload it to the MGA storage target.
  3. Replace content/gallery URLs with the MGA-hosted URL.
- If an article thumbnail is generated externally or through ChatGPT/OpenAI:
  1. Save the original generated file locally instead of using a screenshot.
  2. Rename it to a stable slug-based filename.
  3. Upload it to MGA storage, normally under `posts/`.
  4. Use the resulting `https://cdn.mgavietnam.com/...` URL in both the post thumbnail and article OG image.
- If inline article images are generated externally or through ChatGPT/OpenAI:
  1. Save the original generated file locally instead of using a screenshot.
  2. Rename it to a stable slug-based filename.
  3. Upload it to MGA storage, normally under `posts/`.
  4. Insert the MGA-hosted image URLs into `post_translations.content` at section breaks using `<figure><img ...></figure>`.
- Current active upload target:
  - bucket: `mgamv`
  - public URL: `https://cdn.mgavietnam.com`
- Avoid using `cdn.captreonuisam.com` for new SEO/product image work on this project.

## Verified Upload Behavior

- Uploading into bucket `mgamv` with the current S3-compatible config produces public files under:
  - `https://cdn.mgavietnam.com/<key>`
- This was verified with both:
  - `rclone`
  - direct S3 `PutObject`

## Verification Checklist

- DB snapshot before and after updates
- Live page check after update
- No empty SEO title/description after update
- No broken external image URLs left in content
- New uploaded assets resolve on `cdn.mgavietnam.com`

## Notes From This Session

- Category OG images were added using related post/product media.
- Product `xe-nang-dau-mga-2-5-tan` was upgraded with:
  - rewritten SEO copy
  - gallery images
  - HTML description with images
  - technical specifications
- External reference images used during drafting were re-uploaded to MGA storage and replaced with `cdn.mgavietnam.com` URLs.
