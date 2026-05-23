BEGIN;

INSERT INTO seo (
  title,
  description,
  og_title,
  og_description,
  og_image,
  keywords,
  canonical_url,
  page_path,
  robots_txt,
  is_active,
  created_at,
  updated_at
)
VALUES
  (
    'Giới thiệu MGA Vietnam | Xe nâng, phụ tùng và dịch vụ kỹ thuật',
    'Tìm hiểu MGA Vietnam qua năng lực tư vấn xe nâng, phụ tùng chính hãng, bảo trì kỹ thuật và hỗ trợ vận hành cho doanh nghiệp.',
    'Giới thiệu MGA Vietnam | Xe nâng, phụ tùng và dịch vụ kỹ thuật',
    'MGA Vietnam cung cấp giải pháp xe nâng, phụ tùng chính hãng và dịch vụ kỹ thuật đồng hành cùng vận hành kho xưởng, nhà máy và logistics.',
    '/images/og-default.jpg',
    'MGA Vietnam, xe nâng MGA, phụ tùng xe nâng, dịch vụ xe nâng',
    'https://mgavietnam.com/gioi-thieu',
    '/gioi-thieu',
    'index,follow',
    TRUE,
    NOW(),
    NOW()
  ),
  (
    'About MGA Vietnam | Forklifts, spare parts, and technical service',
    'Learn how MGA Vietnam supports forklift operations with equipment consulting, genuine spare parts, maintenance, and technical service.',
    'About MGA Vietnam | Forklifts, spare parts, and technical service',
    'MGA Vietnam supports warehouse and industrial operations with forklift solutions, spare parts, maintenance, and responsive technical service.',
    '/images/og-default.jpg',
    'MGA Vietnam, forklifts, forklift spare parts, forklift service Vietnam',
    'https://mgavietnam.com/about',
    '/about',
    'index,follow',
    TRUE,
    NOW(),
    NOW()
  )
ON CONFLICT (page_path) DO UPDATE
SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  og_title = EXCLUDED.og_title,
  og_description = EXCLUDED.og_description,
  og_image = EXCLUDED.og_image,
  keywords = EXCLUDED.keywords,
  canonical_url = EXCLUDED.canonical_url,
  robots_txt = EXCLUDED.robots_txt,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

UPDATE about_sections
SET
  type = 'hero',
  component_name = 'AboutHeroSection',
  "order" = 1,
  is_active = TRUE,
  settings = $json$
  {
    "heroHeight": "520px",
    "backgroundColor": "#0f172a",
    "textColor": "#ffffff",
    "padding": "0",
    "heroOverlayOpacity": 0,
    "animation": {
      "enabled": true,
      "type": "fade",
      "duration": 1000,
      "delay": 0
    }
  }
  $json$::jsonb
WHERE id = 14;

UPDATE about_sections
SET
  type = 'content',
  component_name = 'AboutContentSection',
  "order" = 2,
  is_active = TRUE,
  settings = $json$
  {
    "imageUrl": "https://cdn.mgavietnam.com/logo-mga.png",
    "imageAlt": "MGA Vietnam",
    "imagePosition": "right",
    "backgroundColor": "bg-white",
    "textColor": "text-slate-900",
    "padding": "py-16 lg:py-20"
  }
  $json$::jsonb
WHERE id = 15;

UPDATE about_sections
SET
  type = 'features',
  component_name = 'AboutFeaturesSection',
  "order" = 3,
  is_active = TRUE,
  settings = $json$
  {
    "backgroundColor": "bg-slate-950",
    "textColor": "text-white",
    "padding": "py-16 lg:py-20"
  }
  $json$::jsonb
WHERE id = 16;

UPDATE about_sections
SET
  type = 'team',
  component_name = 'AboutTeamSection',
  "order" = 4,
  is_active = FALSE,
  settings = $json$
  {
    "teamColumns": 3,
    "teamMembers": [],
    "backgroundColor": "bg-slate-100",
    "textColor": "text-slate-900",
    "padding": "py-16 lg:py-20"
  }
  $json$::jsonb
WHERE id = 17;

UPDATE about_sections
SET
  type = 'milestone',
  component_name = 'AboutMilestoneSection',
  "order" = 5,
  is_active = FALSE,
  settings = $json$
  {
    "milestoneLayout": "grid",
    "milestones": [],
    "backgroundColor": "bg-white",
    "textColor": "text-slate-900",
    "padding": "py-16 lg:py-20"
  }
  $json$::jsonb
WHERE id = 18;

DELETE FROM about_section_translations
WHERE section_id IN (14, 15, 16, 17, 18)
  AND locale IN ('vi', 'en');

INSERT INTO about_section_translations (
  section_id,
  locale,
  title,
  subtitle,
  content,
  data,
  created_at,
  updated_at
)
VALUES
  (
    14,
    'vi',
    'MGA Vietnam',
    'Giải pháp xe nâng, phụ tùng và dịch vụ kỹ thuật cho vận hành kho xưởng',
    '<p>MGA Vietnam tập trung vào các nhu cầu nâng hạ thực tế của doanh nghiệp, từ lựa chọn thiết bị phù hợp đến hỗ trợ kỹ thuật trong quá trình khai thác.</p><p>Trang giới thiệu này được xây dựng để khách hàng hiểu rõ định hướng dịch vụ, phạm vi hỗ trợ và cách MGA đồng hành với bài toán vận hành hàng ngày.</p>',
    '{}'::jsonb,
    NOW(),
    NOW()
  ),
  (
    14,
    'en',
    'MGA Vietnam',
    'Forklifts, spare parts, and technical service for warehouse and industrial operations',
    '<p>MGA Vietnam focuses on practical material-handling needs, from equipment selection to technical support during daily operations.</p><p>This page explains how MGA approaches service delivery, support scope, and customer collaboration for forklift-related operations.</p>',
    '{}'::jsonb,
    NOW(),
    NOW()
  ),
  (
    15,
    'vi',
    'Đồng hành cùng bài toán nâng hạ của doanh nghiệp',
    'Tư vấn đúng nhu cầu, triển khai rõ ràng, hỗ trợ xuyên suốt vòng đời thiết bị',
    '<p>MGA Vietnam cung cấp thông tin và hỗ trợ xoay quanh xe nâng, phụ tùng và dịch vụ kỹ thuật để doanh nghiệp có cơ sở lựa chọn phương án phù hợp với môi trường làm việc.</p><p>Thay vì sử dụng mô tả chung chung, MGA ưu tiên làm rõ nhu cầu tải trọng, tần suất vận hành, không gian thao tác và yêu cầu bảo trì để tư vấn giải pháp sát thực tế hơn.</p>',
    $json$
    {
      "eyebrow": "Giới thiệu",
      "imageAlt": "MGA Vietnam",
      "highlights": [
        {
          "title": "Tư vấn cấu hình xe nâng",
          "description": "Làm rõ nhu cầu vận hành để chọn nhóm thiết bị phù hợp tải trọng, nhiên liệu và không gian làm việc."
        },
        {
          "title": "Phụ tùng và vật tư",
          "description": "Hỗ trợ nhu cầu thay thế, bảo dưỡng và duy trì khả năng vận hành ổn định cho thiết bị."
        },
        {
          "title": "Dịch vụ kỹ thuật",
          "description": "Phối hợp bảo trì, kiểm tra và xử lý các nhu cầu kỹ thuật trong quá trình khai thác."
        },
        {
          "title": "Hỗ trợ sau bán hàng",
          "description": "Duy trì kết nối để khách hàng có đầu mối trao đổi khi cần thông tin vận hành hoặc dịch vụ."
        }
      ]
    }
    $json$::jsonb,
    NOW(),
    NOW()
  ),
  (
    15,
    'en',
    'Supporting real forklift operating needs',
    'Requirement-led consulting, clear delivery, and service support across the equipment lifecycle',
    '<p>MGA Vietnam provides information and support around forklifts, spare parts, and technical service so businesses can evaluate suitable options for their operating environment.</p><p>Instead of generic messaging, MGA focuses on load profile, operating frequency, workspace constraints, and maintenance expectations to recommend more practical solutions.</p>',
    $json$
    {
      "eyebrow": "About",
      "imageAlt": "MGA Vietnam",
      "highlights": [
        {
          "title": "Forklift configuration consulting",
          "description": "Clarify operating needs before choosing equipment class, fuel type, and handling profile."
        },
        {
          "title": "Spare parts and consumables",
          "description": "Support replacement and maintenance needs to help keep equipment available for work."
        },
        {
          "title": "Technical service coordination",
          "description": "Assist with maintenance planning, inspection, and technical service requirements."
        },
        {
          "title": "After-sales support",
          "description": "Keep a clear contact point for operating questions and service follow-up."
        }
      ]
    }
    $json$::jsonb,
    NOW(),
    NOW()
  ),
  (
    16,
    'vi',
    'Cách MGA triển khai hỗ trợ khách hàng',
    'Một quy trình làm việc gọn, rõ và bám sát thực tế vận hành',
    '<p>MGA Vietnam xây dựng quy trình hỗ trợ theo hướng dễ trao đổi, dễ theo dõi và giảm sai lệch giữa nhu cầu thực tế với giải pháp được đề xuất.</p>',
    $json$
    {
      "items": [
        {
          "title": "Tiếp nhận bối cảnh vận hành",
          "description": "Ghi nhận nhu cầu sử dụng, môi trường làm việc và yêu cầu kỹ thuật ban đầu."
        },
        {
          "title": "Đề xuất nhóm giải pháp phù hợp",
          "description": "Ưu tiên cấu hình phù hợp phạm vi công việc thay vì mô tả dàn trải."
        },
        {
          "title": "Phối hợp phụ tùng và dịch vụ",
          "description": "Chuẩn bị đầu mối xử lý cho các nhu cầu bảo trì, thay thế và hỗ trợ kỹ thuật."
        },
        {
          "title": "Theo dõi sau bàn giao",
          "description": "Duy trì trao đổi để cập nhật nhu cầu phát sinh trong quá trình vận hành."
        },
        {
          "title": "Hỗ trợ thông tin sản phẩm",
          "description": "Bổ sung tài liệu, thông tin tham khảo và trao đổi kỹ thuật khi khách hàng cần."
        },
        {
          "title": "Đồng hành dài hạn",
          "description": "Giữ nhịp hỗ trợ ổn định để doanh nghiệp có đầu mối làm việc xuyên suốt."
        }
      ]
    }
    $json$::jsonb,
    NOW(),
    NOW()
  ),
  (
    16,
    'en',
    'How MGA supports customers',
    'A focused workflow built around practical operating requirements',
    '<p>MGA Vietnam structures its support flow to keep communication clear, execution traceable, and recommendations grounded in actual operating needs.</p>',
    $json$
    {
      "items": [
        {
          "title": "Capture the operating context",
          "description": "Document workload, environment, and initial technical expectations."
        },
        {
          "title": "Recommend a suitable solution group",
          "description": "Prioritize fit for purpose instead of broad generic messaging."
        },
        {
          "title": "Coordinate parts and service support",
          "description": "Prepare clear follow-up for maintenance, replacement, and service requests."
        },
        {
          "title": "Follow up after delivery",
          "description": "Keep communication open for issues or needs that appear during operations."
        },
        {
          "title": "Provide product information support",
          "description": "Share reference material and technical clarification when customers need it."
        },
        {
          "title": "Support long-term collaboration",
          "description": "Maintain a stable point of contact throughout the service relationship."
        }
      ]
    }
    $json$::jsonb,
    NOW(),
    NOW()
  ),
  (
    17,
    'vi',
    'Đội ngũ MGA',
    'Section hiện được giữ ở trạng thái tắt',
    NULL,
    '{"teamMembers":[]}'::jsonb,
    NOW(),
    NOW()
  ),
  (
    17,
    'en',
    'MGA team',
    'This section is intentionally inactive',
    NULL,
    '{"teamMembers":[]}'::jsonb,
    NOW(),
    NOW()
  ),
  (
    18,
    'vi',
    'Lộ trình phát triển dịch vụ',
    'Section hiện được giữ ở trạng thái tắt',
    NULL,
    '{"milestones":[]}'::jsonb,
    NOW(),
    NOW()
  ),
  (
    18,
    'en',
    'Service development timeline',
    'This section is intentionally inactive',
    NULL,
    '{"milestones":[]}'::jsonb,
    NOW(),
    NOW()
  );

COMMIT;
