---
name: mga-post-publisher
description: Publish Vietnamese SEO articles for the MGA project from research to database insertion. Use when Codex needs to research keywords, inspect MGA products/services/posts for internal links, brainstorm a long-form article, generate one article image at a time directly in Codex, upload final media to MGA CDN, and insert or update the article directly in PostgreSQL through the project's .env-backed connection.
---

# Mga Post Publisher

## Overview

Use this skill to produce a complete MGA article workflow, not just copywriting. Research first, build a Vietnamese article with at least 5 substantive sections plus FAQ, place internal links to relevant MGA URLs, generate images sequentially directly in Codex, then publish through PostgreSQL.

## Workflow

1. Read [docs/seo-workflow.md](/Users/abc/project/mga/docs/seo-workflow.md) before doing anything else.
2. Read [references/mga-article-reference.md](references/mga-article-reference.md) for MGA-specific routes, tables, payload rules, and image constraints.
3. Use `$seo` at `/Users/abc/.codex/skills/Agentic-SEO-Skill/SKILL.md` for keyword research, search intent, and SERP-informed outline decisions.
4. Use the scripts in this skill for env-first PostgreSQL work instead of hardcoding credentials.

## Execution Rules

- Load project env before any DB action. Use `scripts/run_psql_env.sh`.
- Research current intent before drafting. Do not draft from memory when the angle depends on current SERP patterns.
- Keep the article in Vietnamese.
- Require at least 5 meaningful `h2` sections plus one FAQ section inside the article body.
- Do not recommend or inject `FAQPage` schema for MGA commercial articles. A visible FAQ section is allowed; restricted FAQ rich-result schema is not.
- Add internal links where the next action is natural. Prefer exact product, service, category, or article pages over generic listing pages.
- Generate article images one at a time directly in Codex whenever possible. Do not batch multiple images in one prompt.
- Save the original generated file for each image slot. Do not use screenshots.
- Only fall back to browser-based generation if direct Codex image generation is blocked or the user explicitly requests that route.
- Use only MGA-hosted CDN URLs in final HTML, thumbnail, and OG image fields.
- Insert or update the post directly in PostgreSQL after content and media are finalized.

## Research Workflow

1. Use `$seo` for keyword research and search intent validation.
2. Identify:
   - primary keyword
   - 3-6 secondary keywords
   - dominant intent
   - recurring competitor sections or questions
3. Gather MGA internal link targets with:

```bash
bash .codex/skills/mga-post-publisher/scripts/list_internal_targets.sh
```

4. Select only links that genuinely support the article angle.
5. If the article claims specs, price ranges, or use cases, verify them against MGA pages or DB records before writing them.

## Article Requirements

- Write for the MGA technical consulting voice, not generic AI blog voice.
- Put the target query in:
  - title
  - intro
  - at least one `h2`
  - meta title
  - meta description
- Keep the opening 1-2 paragraphs useful for skimmers.
- End with a short conclusion and next-step internal links.
- Place 2-3 inline images near section breaks when the topic benefits from visuals.
- Use descriptive `alt` text for every image.
- Prefer HTML like:

```html
<figure>
  <img src="https://cdn.mgavietnam.com/posts/example.jpg" alt="Mô tả ảnh tiếng Việt" loading="lazy" />
</figure>
```

## Image Workflow

1. Decide the image plan before generating:
   - 1 thumbnail
   - 2-3 inline images
2. Write one prompt per image. Each prompt should match one section or one article intent.
3. For each image, follow the exact sequence below:
   - prompt 1
   - wait until render completes
   - save original
   - rename to a stable slug-based filename
   - repeat for the next image
4. Do not move to the next image until the current image has finished rendering and the original file has been saved successfully.
5. If the generator offers multiple variants for one prompt, choose the strongest single result for the intended section and save that file before continuing.
6. Upload the saved files to MGA storage and convert them to final `https://cdn.mgavietnam.com/...` URLs before inserting the article into DB.
7. Mirror the strongest image into `post_translations.og_image`. Use the dedicated thumbnail in `posts.thumbnail`.

## Image Generation Rules

- Treat direct image generation inside Codex as the default path for this skill.
- Keep one prompt mapped to one output image.
- Use prompt text that matches:
  - the article angle
  - the exact section context
  - MGA industrial / forklift / warehouse context when relevant
- Save the original generated asset whenever possible.
- If a generation fails or is weak, retry that single image only. Do not continue the rest of the image set until the current slot is resolved.
- Record the mapping between:
  - image slot
  - prompt
  - local filename
  - final CDN URL
- If direct generation is unavailable or the user explicitly asks for it, browser-based generation is allowed as a fallback, but it is no longer mandatory.

## Database Workflow

1. Build the article HTML and metadata first.
2. Create a JSON payload that matches [references/post-payload.md](references/post-payload.md).
3. Render SQL:

```bash
python3 .codex/skills/mga-post-publisher/scripts/render_post_sql.py payload.json --output /tmp/mga-post.sql
```

4. Review the generated SQL.
5. Execute it through the project env:

```bash
bash .codex/skills/mga-post-publisher/scripts/run_psql_env.sh -f /tmp/mga-post.sql
```

6. Re-query the inserted slug or open the live page to verify:
   - title
   - meta description
   - canonical
   - thumbnail / OG image
   - inline images
   - internal links
   - FAQ visibility

## Scripts

- `scripts/run_psql_env.sh`
  - Load the project's `.env`
  - Run `psql` with the resolved MGA DB credentials
- `scripts/list_internal_targets.sh`
  - List publishable product, service, category, and article URLs for internal links
- `scripts/render_post_sql.py`
  - Validate a Vietnamese post payload
  - Enforce MGA article minimums
  - Generate idempotent SQL to insert or update a `vi` article by slug

## Completion Checklist

- Keyword research completed with `$seo`
- Outline matches real search intent
- Article has 5+ `h2` sections and FAQ
- Internal links are MGA-relevant and resolve
- Thumbnail and inline images were generated one at a time
- Each image was rendered, saved, and mapped before moving to the next image
- All final image URLs use `cdn.mgavietnam.com`
- SQL rendered and executed through env-backed `psql`
- Post record and translation record verified after publish

## Output Expectation

When using this skill, return:

1. The chosen keyword set and intent
2. The final title, slug, and outline
3. The image prompt list, one prompt per image
4. The DB publish action and the affected slug or post id
5. Any limitations, especially if direct image generation, media upload, or optional browser fallback could not be completed in the current environment
