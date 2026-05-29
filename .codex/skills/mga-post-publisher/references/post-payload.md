# Post Payload

`render_post_sql.py` expects a JSON object with these fields:

```json
{
  "slug": "gia-xe-nang-dien-2-tan",
  "title": "Giá xe nâng điện 2 tấn mới nhất cho kho xưởng",
  "content_html": "<h2>...</h2>",
  "short_description": "Tóm tắt ngắn cho card và mở bài.",
  "meta_title": "Giá xe nâng điện 2 tấn | MGA",
  "meta_description": "Mô tả SEO khoảng 140-160 ký tự.",
  "meta_keywords": "gia xe nang dien 2 tan, xe nang dien 2 tan",
  "og_title": "Giá xe nâng điện 2 tấn | MGA",
  "og_description": "Mô tả social ngắn.",
  "thumbnail": "https://cdn.mgavietnam.com/posts/gia-xe-nang-dien-2-tan-thumb.jpg",
  "og_image": "https://cdn.mgavietnam.com/posts/gia-xe-nang-dien-2-tan-thumb.jpg",
  "canonical_url": "https://mgavietnam.com/bai-viet/gia-xe-nang-dien-2-tan",
  "status": "published",
  "author_id": "optional",
  "category_ids": [14],
  "tags": ["xe nâng điện", "báo giá", "kho xưởng"]
}
```

Notes:

- `content_html` may also be passed as `content`.
- `status` accepts `published` or `draft`.
- `author_id` is optional. If omitted, the generated SQL falls back to the first active user.
- `category_ids` and `tags` are optional.
- The script validates:
  - Vietnamese article body exists
  - at least 5 `h2` sections exist
  - FAQ or `Câu hỏi thường gặp` appears in the body
  - at least 2 inline `<img>` tags exist
  - all image URLs point to `cdn.mgavietnam.com`
