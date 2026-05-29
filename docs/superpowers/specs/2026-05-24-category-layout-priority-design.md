# Category Layout Priority Design

## Context

Trang danh mục sản phẩm hiện đặt khối nội dung hỗ trợ SEO và điều hướng (`Báo giá nhanh theo nhóm nhu cầu`, `Link nhanh theo intent thương mại`, `FAQ`) phía trên khu vực danh sách sản phẩm. Với nhóm trang có mục tiêu mua hàng rõ, bố cục này làm giảm ưu tiên thị giác của product grid, trong khi danh sách sản phẩm mới là nội dung người dùng mong đợi nhìn thấy đầu tiên.

Phạm vi thay đổi áp dụng cho trang danh mục tại `apps/frontend/src/pages/categories/[slug].vue`, tận dụng sidebar filter hiện có và không thay đổi logic fetch dữ liệu sản phẩm.

## Goals

- Đưa danh sách sản phẩm thành điểm nhìn chính khi người dùng vào trang danh mục.
- Giữ lại các internal link quan trọng và nội dung hỗ trợ SEO, nhưng hạ chúng xuống vị trí phụ trợ.
- Làm cho cụm điều hướng phụ trong sidebar dễ hiểu hơn với người dùng phổ thông.
- Hạn chế thay đổi logic sản phẩm, bộ lọc, phân trang, và trạng thái empty/error hiện có.

## Non-Goals

- Không thay đổi nguồn dữ liệu category support hoặc logic sinh quick links/FAQ.
- Không thiết kế lại card sản phẩm, bộ lọc, hoặc hệ thống phân trang.
- Không tối ưu lại copy toàn bộ trang ngoài các tiêu đề trực tiếp liên quan đến khối quick links.

## Proposed Layout

### 1. Header vùng đầu trang

Giữ phần đầu trang ở mức gọn:

- Breadcrumb
- H1 danh mục
- Mô tả ngắn của danh mục

Không hiển thị khối support hai cột ở ngay dưới header nữa.

### 2. Subcategory strip

Nếu danh mục có `children`, hiển thị ngay dưới header dưới dạng nhóm link/chip gọn để người dùng có thể nhảy nhanh sang phân nhóm con trước khi xem danh sách sản phẩm.

### 3. Main content priority

Khu vực chính giữ layout hai cột:

- Cột trái: sidebar
- Cột phải: product grid

Danh sách sản phẩm và summary/sort vẫn nằm ở cột phải như hiện tại, nhưng sẽ được kéo lên gần đầu trang hơn vì các khối content dài đã bị dời xuống dưới.

### 4. Sidebar composition

Sidebar desktop được tách thành ba lớp nội dung theo thứ tự:

1. `Bộ lọc sản phẩm`
2. `Xem nhanh theo nhu cầu`
3. `Cần tư vấn nhanh?` nếu có dữ liệu hỗ trợ phù hợp

`Xem nhanh theo nhu cầu` sẽ dùng lại danh sách quick links hiện có từ `categorySupport.quickLinks`, nhưng thay đổi nhãn để dễ hiểu với người dùng. Mục này là khối phụ trợ, không cạnh tranh với product grid.

`Cần tư vấn nhanh?` là khối CTA ngắn, ưu tiên số điện thoại hoặc link liên hệ nếu trang đã có thông tin hỗ trợ tương ứng. Nếu chưa có dữ liệu hoặc tạo cảm giác quá dày, có thể hoãn ở bước triển khai đầu tiên.

Mobile sidebar tiếp tục ưu tiên filter drawer. Khối quick links không cần nhét vào drawer nếu làm drawer quá dài; có thể hiển thị thành block riêng bên dưới bộ lọc mobile hoặc bỏ qua ở mobile trong iteration đầu để tránh tăng ma sát.

### 5. Support content below grid

Các khối nội dung dài chuyển xuống dưới product grid:

- Khối `Báo giá nhanh theo nhóm nhu cầu`
- Khối `FAQ`

Vai trò của chúng chuyển thành:

- Bổ trợ SEO
- Trả lời câu hỏi thường gặp sau khi người dùng đã nhìn thấy danh sách sản phẩm
- Cung cấp điều hướng sâu thêm nếu người dùng chưa thấy model phù hợp

## Copy Changes

Đổi tiêu đề:

- Từ `Link nhanh theo intent thương mại`
- Thành `Xem nhanh theo nhu cầu`

Lý do: cụm cũ mang tính nội bộ/SEO, khó hiểu với người dùng phổ thông. Cụm mới diễn đạt đúng hành vi người dùng hơn.

## Component Boundaries

Ưu tiên thay đổi nhỏ trong phạm vi hiện có:

- `apps/frontend/src/pages/categories/[slug].vue`
  - Sắp xếp lại thứ tự các section
  - Truyền dữ liệu cần thiết xuống sidebar nếu tách block quick links/CTA thành component con
- `apps/frontend/src/components/sidebar/CategorySidebar.vue`
  - Thêm vùng hiển thị quick links/CTA hỗ trợ nếu chọn render trực tiếp trong sidebar component
- `apps/frontend/src/components/sidebar/CategoryMobileSidebar.vue`
  - Chỉ chỉnh nếu cần hỗ trợ mobile cho quick links; nếu không, giữ nguyên ở iteration đầu

Nếu phần markup sidebar tăng đáng kể, có thể tách ra một component nhỏ kiểu `CategorySupportSidebarCard`, nhưng chỉ nên làm nếu giúp code rõ hơn; không tách component chỉ để chia file cơ học.

## Data Flow

- `categorySupport` tiếp tục được tính tại page level.
- Quick links và dữ liệu CTA được truyền xuống sidebar desktop như props.
- FAQ và support summary vẫn render tại page level, nhưng dời xuống sau product grid.
- Không thay đổi query params, filter state, pagination state, hoặc fetch cycle.

## Error and Empty States

- Invalid category, loading skeleton, filtered empty state, và empty category state phải giữ nguyên hành vi.
- Với danh mục không có sản phẩm hoặc không có filter sidebar, không ép hiển thị sidebar chỉ để chứa quick links nếu làm bố cục mất cân bằng. Khi đó support content có thể tiếp tục render ở vùng dưới như fallback.

## Testing

- Cập nhật test của trang danh mục nếu đang phụ thuộc vào cấu trúc cũ.
- Thêm hoặc sửa test để xác nhận:
  - tiêu đề quick links mới xuất hiện đúng khi có `categorySupport`
  - product grid vẫn render bình thường
  - breadcrumb và heading không bị ảnh hưởng
- Nếu không có test cấu trúc phù hợp, tối thiểu chạy test hiện có của page này và kiểm tra thủ công giao diện desktop/mobile.

## Risks

- Sidebar có thể trở nên dài nếu vừa có filter vừa có quick links và CTA.
- Mobile drawer có thể bị quá tải nếu chèn toàn bộ support content vào cùng một nơi.
- Một số danh mục có thể không có dữ liệu support đủ tốt cho sidebar mới, cần fallback gọn.

## Recommended Implementation Order

1. Dời các section support ra khỏi đầu trang và đưa product area lên trên.
2. Thêm block `Xem nhanh theo nhu cầu` vào sidebar desktop.
3. Chỉ thêm CTA sidebar nếu sau khi nhìn bố cục vẫn cần.
4. Kiểm tra mobile để quyết định có giữ quick links ngoài drawer hay bỏ qua ở bước đầu.
