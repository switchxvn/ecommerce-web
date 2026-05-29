import { describe, expect, it } from 'vitest';

import {
  addIdsToHeadings,
  createIdFromText,
  formatFullPostContent,
} from './contentFormatter';

describe('contentFormatter', () => {
  it('creates stable heading ids from Vietnamese text', () => {
    expect(createIdFromText('Xe nâng điện đứng lái')).toBe('xe-nang-dien-dung-lai');
  });

  it('adds ids to existing html headings without overwriting existing ids', () => {
    const content = '<h2>Giới thiệu chung</h2><p>Body</p><h3 id="co-san">Có sẵn</h3>';

    expect(addIdsToHeadings(content)).toBe(
      '<h2 id="gioi-thieu-chung">Giới thiệu chung</h2><p>Body</p><h3 id="co-san">Có sẵn</h3>',
    );
  });

  it('formats markdown-like post content into paragraphs and heading anchors', () => {
    const content = 'Đoạn mở đầu\n\n## Tính năng nổi bật\n\nChi tiết phần thân';

    expect(formatFullPostContent(content)).toContain('<p>Đoạn mở đầu</p>');
    expect(formatFullPostContent(content)).toContain('<h2 id="tinh-nang-noi-bat">Tính năng nổi bật</h2>');
    expect(formatFullPostContent(content)).toContain('<p>Chi tiết phần thân</p>');
  });
});
