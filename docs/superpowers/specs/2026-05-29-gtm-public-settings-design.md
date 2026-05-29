# GTM Public Settings Design

## Goal

Chuẩn hoá tích hợp Google Tag Manager cho `apps/frontend` theo hướng:

- lấy `google_tag_manager_id` từ public settings API
- inject GTM snippet chuẩn ngay khi vào trang
- không hardcode container ID trong frontend
- không trì hoãn tải GTM theo interaction hoặc idle callback

Mục tiêu chính là giữ tracking ổn định hơn cho landing/session đầu, đồng thời tách bạch analytics script khỏi logic SEO/meta hiện có.

## Current State

Frontend hiện có nhiều mảnh tích hợp tracking nhưng chưa nhất quán:

- `src/plugins/gtm.server.ts` đang set fallback hardcode `GTM-T89X4CKH`
- `src/layouts/default.vue` inject GTM bằng `useHead`, nhưng chỉ khi `shouldLoadTracking` được bật sau interaction hoặc idle timeout
- `src/composables/useGoogleAnalytics.ts` chứa logic GTM và GA4, nhưng chưa là entrypoint chính
- `src/composables/useTracking.ts` và `src/middleware/tracking.global.ts` đang gửi event/page view theo hướng `window.gtag`
- admin đã có public setting `google_tag_manager_id`

Kết quả là project có chỗ gắn GTM, nhưng hành vi runtime chưa đúng chuẩn Google snippet và chưa lấy ID từ public settings API làm nguồn sự thật.

## Recommended Approach

Triển khai GTM theo một nguồn cấu hình duy nhất:

- frontend fetch `google_tag_manager_id` từ public settings API ở tầng app sớm nhất có thể
- khi có ID hợp lệ, inject đúng GTM snippet chuẩn vào `head`
- đồng thời inject `noscript iframe` tương ứng
- loại bỏ hardcode GTM ID và cơ chế delay load

Khuyến nghị này giữ quyền cấu hình ở backend/admin, đồng thời tránh cài trực tiếp GA4 trong app shell. Mọi page view và event marketing sẽ được quản lý qua GTM container.

## Architecture

### 1. GTM configuration source

Nguồn GTM ID là public settings API, cụ thể key:

- `google_tag_manager_id`

Frontend sẽ không dùng hardcoded container. Nếu API trả về rỗng hoặc lỗi, GTM sẽ không được inject.

### 2. GTM bootstrap in frontend

Tạo một luồng bootstrap GTM riêng, có các trách nhiệm:

- đọc public setting `google_tag_manager_id`
- validate ID theo format `GTM-...`
- lưu ID vào state dùng chung của Nuxt
- tạo head payload cho script và noscript

Luồng này cần chạy ở cấp cao của app để GTM có mặt từ page đầu tiên mà người dùng thấy, thay vì đợi interaction.

### 3. Head injection

Chỉ có một nơi inject GTM snippet. Thiết kế ưu tiên:

- inject tại app/layout cấp cao
- dùng `useHead` với GTM snippet chuẩn
- tránh duplicate script nếu state thay đổi hoặc layout rerender

### 4. Event tracking compatibility

Event tracking hiện tại sẽ tiếp tục hoạt động, nhưng cần dịch chuyển trọng tâm từ `window.gtag` sang `dataLayer`/GTM-friendly behavior. Trong bước đầu:

- giữ middleware page view hiện có nếu chưa gây duplicate
- ưu tiên đảm bảo GTM bootstrap ổn định trước
- sau đó kiểm tra và loại bỏ duplicate pageview nếu container GTM đã tự bắn page_view

## SSR and Timing Constraints

Có một giới hạn kỹ thuật cần nêu rõ:

- nếu public settings API chỉ fetch được ở client sau mount, GTM sẽ không xuất hiện sớm bằng SSR/env injection
- nếu hạ tầng hiện tại cho phép fetch settings trong SSR context, nên bootstrap ngay từ SSR để head HTML đầu tiên đã có GTM

Triển khai sẽ ưu tiên thứ tự sau:

1. tận dụng cơ chế public settings hiện có để lấy ID ở thời điểm sớm nhất
2. nếu settings có thể lấy trong SSR/plugin async, inject từ SSR
3. nếu chưa thể SSR ngay, vẫn inject ngay khi dữ liệu public settings về, không delay thêm bằng interaction/idle

## File-Level Changes

Phạm vi thay đổi dự kiến:

- `apps/frontend/src/plugins/gtm.server.ts`
  - bỏ hardcoded fallback
  - đổi vai trò sang bootstrap state từ nguồn dữ liệu thực, hoặc xoá nếu không còn phù hợp

- `apps/frontend/src/layouts/default.vue`
  - bỏ `shouldLoadTracking`
  - bỏ deferred GTM loading
  - chỉ giữ một điểm inject GTM chuẩn

- `apps/frontend/src/composables/useGoogleAnalytics.ts`
  - tách hoặc thu hẹp trách nhiệm nếu file này đang trộn cả GTM và GA4
  - tránh để composable không được gọi nhưng vẫn là nơi chứa logic chuẩn

- `apps/frontend/src/composables/useTracking.ts`
  - rà soát tương thích với GTM-first approach
  - giảm phụ thuộc trực tiếp vào `window.gtag` nếu có thể

- `apps/frontend/src/middleware/tracking.global.ts`
  - xác minh page view có bị duplicate sau khi GTM hoạt động chuẩn hay không

## Validation Rules

ID GTM chỉ được coi là hợp lệ khi:

- là string không rỗng sau trim
- khớp pattern `^GTM-[A-Z0-9]+$`

Nếu không hợp lệ:

- không inject script
- không inject noscript
- không throw lỗi làm hỏng render

## Error Handling

Các lỗi khi đọc settings API phải fail-safe:

- app vẫn render bình thường
- chỉ bỏ qua GTM
- log chẩn đoán ở mức vừa phải trong dev
- không hardcode fallback container vì dễ bắn nhầm dữ liệu production/staging

## Testing Strategy

Ưu tiên test hành vi sau:

- khi API trả `google_tag_manager_id` hợp lệ thì head có GTM script và noscript
- khi API trả rỗng thì không có GTM snippet
- không còn phụ thuộc vào interaction/idle để GTM xuất hiện
- không duplicate snippet qua nhiều lần render

Test có thể nằm ở mức unit/plugin/composable tùy pattern test hiện có trong app frontend.

## Out of Scope

Những việc sau không nằm trong thay đổi này:

- triển khai GA4 trực tiếp ngoài GTM
- cấu hình tag/rule bên trong GTM container
- consent mode/cookie banner
- refactor toàn bộ analytics stack của frontend

## Success Criteria

Hoàn thành khi:

- admin cấu hình `google_tag_manager_id` qua public settings
- frontend lấy đúng ID từ API
- GTM snippet chuẩn được inject ngay khi vào trang
- không còn hardcoded GTM ID
- không còn cơ chế trì hoãn GTM theo interaction/idle
- page render không lỗi khi settings API thiếu hoặc lỗi
