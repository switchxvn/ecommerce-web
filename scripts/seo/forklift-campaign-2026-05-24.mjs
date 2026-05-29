import dotenv from 'dotenv';
import pg from 'pg';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const { Client } = pg;

const siteUrl = 'https://mgavietnam.com';
const cdnUrl = 'https://cdn.mgavietnam.com';

const link = (href, label) => `<a href="${href}">${label}</a>`;
const figure = (src, alt) => `<figure><img src="${src}" alt="${alt}" loading="lazy" /></figure>`;

const categoryUpdates = [
  {
    categoryId: 14,
    metaTitle: 'Bán xe nâng dầu mới 2.5-10 tấn tại TPHCM | MGA',
    metaDescription:
      'MGA cung cấp xe nâng dầu mới 2.5-10 tấn cho kho xưởng, bãi hàng và nhà máy tại TPHCM. Xem nhanh cấu hình, dải tải trọng và tư vấn báo giá.',
    metaKeywords: 'bán xe nâng dầu, xe nâng dầu mới, xe nâng dầu tphcm, xe nâng dầu 2.5 tấn, xe nâng dầu 5 tấn',
    ogTitle: 'Bán xe nâng dầu mới 2.5-10 tấn tại TPHCM | MGA',
    ogDescription:
      'Danh mục xe nâng dầu MGA cho nhu cầu tải nặng, làm việc ngoài trời và báo giá nhanh theo tải trọng tại TPHCM.',
    canonicalUrl: `${siteUrl}/danh-muc-san-pham/xe-nang-dau`,
    ogImage: `${cdnUrl}/products/xe-nang-dau-mga-5-0-tan.jpg`,
  },
  {
    categoryId: 15,
    metaTitle: 'Bán xe nâng điện 1.5-3.5 tấn tại TPHCM | MGA',
    metaDescription:
      'Danh mục xe nâng điện MGA cho kho trong nhà, xưởng sạch và lối đi hẹp tại TPHCM. Xem nhanh xe điện 1.5 tấn, 2 tấn, 3 tấn và ngồi lái.',
    metaKeywords: 'bán xe nâng điện, xe nâng điện, xe nâng điện 1.5 tấn, xe nâng điện 2 tấn, xe nâng điện ngồi lái',
    ogTitle: 'Bán xe nâng điện 1.5-3.5 tấn tại TPHCM | MGA',
    ogDescription:
      'Xe nâng điện MGA phù hợp kho trong nhà, vận hành êm và sạch. Hỗ trợ tư vấn nhanh theo tải trọng tại TPHCM.',
    canonicalUrl: `${siteUrl}/danh-muc-san-pham/xe-nang-dien`,
    ogImage: `${cdnUrl}/products/xe-nang-dien-mga-2-0-tan.jpg`,
  },
  {
    categoryId: 19,
    metaTitle: 'Phụ tùng xe nâng dầu, điện sẵn hàng tại TPHCM | MGA',
    metaDescription:
      'Phụ tùng xe nâng dầu và xe nâng điện cho nhu cầu thay thế nhanh tại TPHCM. Tập trung nhóm linh kiện hao mòn, thủy lực, điện và bánh xe.',
    metaKeywords: 'phụ tùng xe nâng, phụ tùng xe nâng dầu, phụ tùng xe nâng điện, sửa xe nâng tphcm, linh kiện xe nâng',
    ogTitle: 'Phụ tùng xe nâng dầu, điện sẵn hàng tại TPHCM | MGA',
    ogDescription:
      'Nhóm phụ tùng xe nâng giúp giảm thời gian dừng máy và kết nối trực tiếp với nhu cầu sửa chữa, bảo dưỡng tại TPHCM.',
    canonicalUrl: `${siteUrl}/danh-muc-san-pham/phu-tung-xe-nang`,
    ogImage: `${cdnUrl}/products/xe-nang-dau-mga-3-0-tan.jpg`,
  },
];

const productMetaUpdates = [
  {
    slug: 'xe-nang-dau-mga-2-5-tan',
    metaTitle: 'Giá xe nâng dầu 2.5 tấn MGA cho kho xưởng | MGA',
    metaDescription:
      'Tham khảo giá xe nâng dầu 2.5 tấn MGA cho kho xưởng và bãi hàng tại TPHCM. Cấu hình động cơ ISUZU, vận hành ổn định và dễ bảo trì.',
    metaKeywords: 'giá xe nâng dầu 2.5 tấn, xe nâng dầu 2.5 tấn, bán xe nâng dầu 2.5 tấn, xe nâng dầu mga 2.5 tấn',
  },
  {
    slug: 'xe-nang-dau-mga-3-0-tan',
    metaTitle: 'Xe nâng dầu 3 tấn MGA cho kho xưởng tại TPHCM | MGA',
    metaDescription:
      'Xe nâng dầu 3 tấn MGA phù hợp kho xưởng, bãi hàng và nhu cầu nâng pallet nặng tại TPHCM. Xem cấu hình, bài toán tải trọng và tư vấn báo giá.',
    metaKeywords: 'xe nâng dầu 3 tấn, bán xe nâng dầu 3 tấn, xe nâng 3 tấn, xe nâng dầu mga 3 tấn',
  },
  {
    slug: 'xe-nang-dau-mga-3-5-tan',
    metaTitle: 'Xe nâng dầu 3.5 tấn MGA bền bỉ cho hàng nặng | MGA',
    metaDescription:
      'Xe nâng dầu 3.5 tấn MGA cho doanh nghiệp cần dư tải tốt hơn nhóm 3 tấn. Phù hợp kho xưởng, bãi ngoài trời và nhu cầu vận hành liên tục.',
    metaKeywords: 'xe nâng dầu 3.5 tấn, bán xe nâng dầu 3.5 tấn, xe nâng dầu mga 3.5 tấn',
  },
  {
    slug: 'xe-nang-dau-mga-5-0-tan',
    metaTitle: 'Xe nâng 5 tấn MGA, báo giá xe nâng dầu 5 tấn | MGA',
    metaDescription:
      'Tham khảo xe nâng 5 tấn MGA cho hàng nặng, bãi vật liệu và khu sản xuất tại TPHCM. Xem nhanh cấu hình xe nâng dầu 5 tấn và nhu cầu vận hành thực tế.',
    metaKeywords: 'xe nâng 5 tấn, xe nâng dầu 5 tấn, bán xe nâng dầu 5 tấn, giá xe nâng 5 tấn',
  },
  {
    slug: 'xe-nang-dau-mga-10-tan',
    metaTitle: 'Xe nâng dầu 10 tấn MGA cho tải siêu nặng | MGA',
    metaDescription:
      'Xe nâng dầu 10 tấn MGA phù hợp bãi công nghiệp, kiện hàng lớn và bài toán tải siêu nặng. Hỗ trợ tư vấn cấu hình và báo giá nhanh tại TPHCM.',
    metaKeywords: 'xe nâng dầu 10 tấn, bán xe nâng dầu 10 tấn, xe nâng 10 tấn',
  },
  {
    slug: 'xe-nang-dien-mga-1-5-tan',
    metaTitle: 'Xe nâng điện 1.5 tấn MGA cho kho trong nhà | MGA',
    metaDescription:
      'Xe nâng điện 1.5 tấn MGA phù hợp kho trong nhà, xưởng sạch và pallet phổ thông. Giải pháp vận hành êm, sạch và tiết kiệm cho khách hàng TPHCM.',
    metaKeywords: 'xe nâng điện 1.5 tấn, bán xe nâng điện 1.5 tấn, xe nâng điện mga 1.5 tấn',
  },
  {
    slug: 'xe-nang-dien-mga-2-0-tan',
    metaTitle: 'Giá xe nâng điện 2 tấn MGA cho kho trong nhà | MGA',
    metaDescription:
      'Tham khảo giá xe nâng điện 2 tấn MGA cho kho trong nhà, nhà xưởng và nhu cầu nâng pallet nặng hơn nhóm 1.5 tấn. Hỗ trợ tư vấn nhanh tại TPHCM.',
    metaKeywords: 'giá xe nâng điện 2 tấn, xe nâng điện 2 tấn, bán xe nâng điện 2 tấn, xe nâng điện mga 2 tấn',
  },
  {
    slug: 'xe-nang-dien-mga-3-0-tan',
    metaTitle: 'Xe nâng điện 3 tấn MGA cho kho tải cao | MGA',
    metaDescription:
      'Xe nâng điện 3 tấn MGA cho kho thành phẩm, khu sản xuất và bài toán nâng pallet nặng trong nhà. Xem cấu hình và nhu cầu sử dụng phù hợp.',
    metaKeywords: 'xe nâng điện 3 tấn, bán xe nâng điện 3 tấn, xe nâng điện mga 3 tấn',
  },
  {
    slug: 'xe-nang-dien-ngoi-lai-mga-1-5-tan',
    metaTitle: 'Xe nâng điện ngồi lái MGA 1.5 tấn cho kho kín | MGA',
    metaDescription:
      'Xe nâng điện ngồi lái MGA 1.5 tấn phù hợp kho kín, xưởng sạch và vận hành pallet phổ thông với yêu cầu ổn định, êm và dễ sử dụng.',
    metaKeywords: 'xe nâng điện ngồi lái, bán xe nâng điện ngồi lái, xe nâng điện ngồi lái 1.5 tấn',
  },
];

const serviceImageMap = {
  repair: `${cdnUrl}/products/xe-nang-dau-mga-3-0-tan.jpg`,
  maintenance: `${cdnUrl}/products/xe-nang-dau-mga-2-5-tan.jpg`,
  rentDiesel: `${cdnUrl}/services/diesel-forklift-rental-service.jpg`,
  rentElectric: `${cdnUrl}/services/electric-forklift-rental-service.jpg`,
  localElectric: `${cdnUrl}/products/xe-nang-dien-mga-2-0-tan.jpg`,
  used: `${cdnUrl}/products/xe-nang-dau-mga-3-5-tan.jpg`,
};

const serviceDefinitions = [
  {
    slug: 'sua-xe-nang',
    title: 'Sửa xe nâng chuyên nghiệp tại TPHCM',
    shortDescription:
      'Dịch vụ sửa xe nâng cho xe dầu và xe điện tại TPHCM, ưu tiên chẩn đoán nhanh, thay đúng hạng mục và giảm thời gian dừng máy cho kho xưởng.',
    metaTitle: 'Sửa chữa xe nâng, sửa xe nâng tại TPHCM | MGA',
    metaDescription:
      'Dịch vụ sửa chữa xe nâng tại TPHCM cho xe dầu và xe điện. Hỗ trợ chẩn đoán nhanh, thay phụ tùng đúng hạng mục và tư vấn bảo dưỡng phù hợp.',
    metaKeywords: 'sửa chữa xe nâng, sửa xe nâng, sửa xe nâng tphcm, sửa xe nâng điện',
    ogTitle: 'Sửa chữa xe nâng, sửa xe nâng tại TPHCM | MGA',
    ogDescription:
      'MGA hỗ trợ sửa xe nâng tại TPHCM cho kho xưởng cần xử lý nhanh các lỗi điện, thủy lực, hệ thống nâng và hao mòn vận hành.',
    canonicalUrl: `${siteUrl}/dich-vu/sua-xe-nang`,
    ogImage: serviceImageMap.repair,
    thumbnail: serviceImageMap.repair,
    icon: 'wrench',
    description: `
      <div class="service-content">
        <p>Dịch vụ <strong>sửa xe nâng</strong> tại MGA tập trung vào nhu cầu xử lý nhanh cho kho xưởng tại TPHCM khi xe dầu hoặc xe điện phát sinh lỗi trong quá trình vận hành hàng ngày. Thay vì chỉ sửa tạm để xe chạy lại, đội kỹ thuật đi theo hướng chẩn đoán đúng nguyên nhân để hạn chế lỗi lặp lại và giảm thời gian dừng máy.</p>
        ${figure(serviceImageMap.repair, 'Kỹ thuật viên kiểm tra xe nâng tại kho xưởng TPHCM')}
        <h2>Khi nào nên gọi sửa xe nâng ngay?</h2>
        <p>Doanh nghiệp nên ưu tiên kiểm tra ngay khi xe có dấu hiệu hụt lực nâng, rò dầu thủy lực, khó nổ máy, chập chờn điện điều khiển, bình điện xuống nhanh hoặc mast nâng hạ không ổn định. Với các xe chạy nhiều ca, chậm xử lý thường kéo theo hỏng thêm linh kiện và chi phí phục hồi lớn hơn.</p>
        <h2>Nhóm lỗi được xử lý nhiều</h2>
        <ul>
          <li>Lỗi hệ thống nâng hạ, mast, chain, càng và xilanh thủy lực.</li>
          <li>Lỗi động cơ, hệ thống nhiên liệu, hệ thống làm mát trên xe nâng dầu.</li>
          <li>Lỗi bình điện, bộ sạc, mô-tơ, contactor và bo điều khiển trên xe nâng điện.</li>
          <li>Nhóm hao mòn như bánh xe, phanh, ống dầu, phớt, lọc và phụ tùng thay thế định kỳ.</li>
        </ul>
        <h2>Cách MGA triển khai tại TPHCM</h2>
        <p>Trước khi thay hạng mục lớn, kỹ thuật viên sẽ đối chiếu tần suất sử dụng, tải trọng nâng thực tế và lịch sử bảo dưỡng của xe. Nếu xe đang dùng trong môi trường pallet nặng hoặc chạy ngoài trời nhiều, phương án sửa sẽ khác với xe điện chạy trong kho kín. Đây cũng là lý do nhiều khách hàng cần vừa sửa vừa rà lại cấu hình xe để quyết định có nên đổi sang ${link(`${siteUrl}/danh-muc-san-pham/xe-nang-dau`, 'xe nâng dầu')} hoặc ${link(`${siteUrl}/danh-muc-san-pham/xe-nang-dien`, 'xe nâng điện')} mới.</p>
        <h2>Liên kết dịch vụ và phụ tùng liên quan</h2>
        <p>Nếu xe đang dừng vì linh kiện hao mòn, khách hàng có thể xem thêm nhóm ${link(`${siteUrl}/danh-muc-san-pham/phu-tung-xe-nang`, 'phụ tùng xe nâng')} hoặc chuyển sang ${link(`${siteUrl}/dich-vu/yeu-cau-bao-duong`, 'dịch vụ bảo dưỡng xe nâng')} nếu mục tiêu là ngăn lỗi lặp lại sau khi sửa.</p>
      </div>
    `,
  },
  {
    slug: 'cho-thue-xe-nang-dau',
    title: 'Cho thuê xe nâng dầu tại TPHCM',
    shortDescription:
      'Dịch vụ cho thuê xe nâng dầu tại TPHCM cho nhu cầu kho xưởng, bãi hàng và vận hành tải nặng ngắn hạn hoặc theo dự án.',
    metaTitle: 'Cho thuê xe nâng dầu tại TPHCM, giá tốt | MGA',
    metaDescription:
      'Cho thuê xe nâng dầu tại TPHCM cho nhu cầu tải nặng, bãi ngoài trời và chạy nhiều ca. Tập trung nhóm 2.5-10 tấn và tư vấn cấu hình theo công việc.',
    metaKeywords: 'cho thuê xe nâng dầu, thuê xe nâng dầu tphcm, thuê xe nâng tphcm',
    ogTitle: 'Cho thuê xe nâng dầu tại TPHCM, giá tốt | MGA',
    ogDescription:
      'Dịch vụ thuê xe nâng dầu MGA cho kho xưởng, bãi ngoài trời và công việc tải nặng tại TPHCM.',
    canonicalUrl: `${siteUrl}/dich-vu/cho-thue-xe-nang-dau`,
    ogImage: serviceImageMap.rentDiesel,
    thumbnail: serviceImageMap.rentDiesel,
    icon: 'truck',
    description: `
      <div class="service-content">
        <p>Dịch vụ <strong>cho thuê xe nâng dầu</strong> phù hợp doanh nghiệp đang cần xử lý nhanh việc bốc dỡ, thay xe tạm thời hoặc triển khai dự án ngắn hạn tại TPHCM mà chưa muốn đầu tư mua mới ngay.</p>
        ${figure(serviceImageMap.rentDiesel, 'Xe nâng dầu cho thuê phục vụ kho xưởng tại TPHCM')}
        <h2>Trường hợp nên thuê xe nâng dầu</h2>
        <ul>
          <li>Công việc tăng tải đột biến theo mùa hoặc theo hợp đồng ngắn hạn.</li>
          <li>Kho ngoài trời, bãi hàng hoặc nhà máy cần xe chạy nhiều ca trong thời gian giới hạn.</li>
          <li>Doanh nghiệp muốn thử đúng tải trọng trước khi chốt mua xe mới.</li>
        </ul>
        <h2>Nhóm tải trọng được hỏi nhiều</h2>
        <p>Phổ biến nhất vẫn là 2.5 tấn, 3.0 tấn, 3.5 tấn và 5.0 tấn. Với hàng nặng hoặc bãi công nghiệp, có thể tham chiếu thêm nhóm ${link(`${siteUrl}/san-pham/xe-nang-dau-mga-10-tan`, 'xe nâng dầu 10 tấn')} để xác định đúng bài toán tải trọng.</p>
        <h2>Khu vực phục vụ và cách tư vấn</h2>
        <p>MGA ưu tiên khách hàng tại TPHCM đang cần xử lý nhanh nhu cầu thuê xe nâng dầu cho kho xưởng, bãi hàng hoặc khu sản xuất. Nếu bài toán thuê kéo dài và tần suất cao, đội ngũ sẽ gợi ý luôn phương án mua ${link(`${siteUrl}/danh-muc-san-pham/xe-nang-dau`, 'xe nâng dầu mới')} để so sánh chi phí đầu tư tổng thể.</p>
        <h2>Liên kết sang các trang đích liên quan</h2>
        <p>Người dùng đang cân nhắc giữa thuê và mua nên xem thêm ${link(`${siteUrl}/bai-viet/khi-nao-nen-thue-xe-nang-thay-vi-mua`, 'khi nào nên thuê xe nâng thay vì mua')} và các mẫu ${link(`${siteUrl}/san-pham/xe-nang-dau-mga-2-5-tan`, 'xe nâng dầu 2.5 tấn')}, ${link(`${siteUrl}/san-pham/xe-nang-dau-mga-5-0-tan`, 'xe nâng dầu 5 tấn')}.</p>
      </div>
    `,
  },
  {
    slug: 'cho-thue-xe-nang-dien',
    title: 'Cho thuê xe nâng điện tại TPHCM',
    shortDescription:
      'Cho thuê xe nâng điện cho kho trong nhà, xưởng sạch và nhu cầu vận hành êm tại TPHCM. Phù hợp nhóm 1.5-3.0 tấn và ca làm việc ngắn hạn.',
    metaTitle: 'Cho thuê xe nâng điện tại TPHCM, hỗ trợ nhanh | MGA',
    metaDescription:
      'Dịch vụ cho thuê xe nâng điện tại TPHCM cho kho kín, xưởng sạch và lối đi hẹp. Hỗ trợ chọn xe điện đứng lái, ngồi lái hoặc tải trọng 1.5-3.0 tấn.',
    metaKeywords: 'cho thuê xe nâng điện, thuê xe nâng điện tphcm, thuê xe nâng tphcm',
    ogTitle: 'Cho thuê xe nâng điện tại TPHCM, hỗ trợ nhanh | MGA',
    ogDescription:
      'Giải pháp thuê xe nâng điện cho môi trường trong nhà, xưởng sạch và nhu cầu vận hành êm tại TPHCM.',
    canonicalUrl: `${siteUrl}/dich-vu/cho-thue-xe-nang-dien`,
    ogImage: serviceImageMap.rentElectric,
    thumbnail: serviceImageMap.rentElectric,
    icon: 'battery-charging',
    description: `
      <div class="service-content">
        <p>Dịch vụ <strong>cho thuê xe nâng điện</strong> của MGA phù hợp các kho trong nhà, khu thành phẩm và xưởng sạch cần vận hành êm, ít khí thải và xoay trở linh hoạt tại TPHCM.</p>
        ${figure(serviceImageMap.rentElectric, 'Xe nâng điện cho thuê trong nhà xưởng tại TPHCM')}
        <h2>Nhóm nhu cầu thuê phổ biến</h2>
        <ul>
          <li>Doanh nghiệp cần xe điện ngắn hạn để xử lý cao điểm xuất nhập hàng.</li>
          <li>Kho hẹp muốn thử reach truck hoặc đứng lái trước khi đầu tư mua mới.</li>
          <li>Nhà máy cần xe sạch, ít tiếng ồn và không muốn phát sinh chi phí sở hữu ngay.</li>
        </ul>
        <h2>Nên thuê xe điện loại nào?</h2>
        <p>Với pallet phổ thông và kho vừa, có thể bắt đầu từ ${link(`${siteUrl}/san-pham/xe-nang-dien-mga-1-5-tan`, 'xe nâng điện 1.5 tấn')} hoặc ${link(`${siteUrl}/san-pham/xe-nang-dien-mga-2-0-tan`, 'xe nâng điện 2.0 tấn')}. Nếu cần vị trí ngồi lái ổn định hơn cho ca dài, nhóm ${link(`${siteUrl}/san-pham/xe-nang-dien-ngoi-lai-mga-1-5-tan`, 'xe nâng điện ngồi lái')} phù hợp hơn.</p>
        <h2>Khi nào nên chuyển sang mua mới?</h2>
        <p>Nếu tần suất thuê bắt đầu kéo dài nhiều tháng, doanh nghiệp nên so sánh lại với nhóm ${link(`${siteUrl}/danh-muc-san-pham/xe-nang-dien`, 'xe nâng điện mới')} để tránh chi phí thuê tích lũy cao hơn phương án mua.</p>
      </div>
    `,
  },
  {
    slug: 'yeu-cau-bao-duong',
    title: 'Bảo dưỡng xe nâng định kỳ tại TPHCM',
    shortDescription:
      'Dịch vụ bảo dưỡng xe nâng định kỳ cho xe dầu và xe điện tại TPHCM, tập trung giảm hỏng vặt, kéo dài tuổi thọ và giữ xe hoạt động ổn định.',
    metaTitle: 'Bảo dưỡng xe nâng định kỳ tại TPHCM | MGA',
    metaDescription:
      'MGA cung cấp dịch vụ bảo dưỡng xe nâng tại TPHCM cho xe dầu và xe điện. Kiểm tra định kỳ giúp giảm dừng máy, phát hiện sớm hao mòn và tối ưu chi phí vận hành.',
    metaKeywords: 'bảo dưỡng xe nâng, bảo trì xe nâng, sửa xe nâng tphcm, bảo dưỡng xe nâng tphcm',
    ogTitle: 'Bảo dưỡng xe nâng định kỳ tại TPHCM | MGA',
    ogDescription:
      'Giải pháp bảo dưỡng xe nâng theo chu kỳ vận hành cho kho xưởng tại TPHCM.',
    canonicalUrl: `${siteUrl}/dich-vu/yeu-cau-bao-duong`,
    ogImage: serviceImageMap.maintenance,
    thumbnail: serviceImageMap.maintenance,
    icon: 'shield-check',
    description: `
      <div class="service-content">
        <p>Dịch vụ <strong>bảo dưỡng xe nâng</strong> của MGA dành cho doanh nghiệp muốn kiểm soát rủi ro hỏng vặt trước khi xe dừng máy đột ngột. Đây là điểm nối giữa sửa chữa, thay phụ tùng và kế hoạch vận hành ổn định cho kho xưởng tại TPHCM.</p>
        ${figure(serviceImageMap.maintenance, 'Bảo dưỡng định kỳ xe nâng tại nhà xưởng TPHCM')}
        <h2>Vì sao bảo dưỡng định kỳ quan trọng?</h2>
        <p>Nhiều lỗi lớn trên xe nâng thực tế bắt đầu từ các dấu hiệu nhỏ như rò dầu, nóng máy, phanh yếu, tiếp điểm bẩn hoặc bình điện xuống nhanh. Nếu chờ tới lúc xe dừng hẳn mới sửa, chi phí và thời gian gián đoạn thường cao hơn nhiều.</p>
        <h2>Nội dung kiểm tra thường xuyên</h2>
        <ul>
          <li>Dầu động cơ, dầu thủy lực, lọc và hệ thống làm mát trên xe dầu.</li>
          <li>Bình điện, bộ sạc, tiếp điểm, mô-tơ và hệ thống điện điều khiển trên xe điện.</li>
          <li>Phanh, bánh xe, càng nâng, mast, chain và các điểm siết lực quan trọng.</li>
        </ul>
        <h2>Kết hợp với phụ tùng và sửa chữa</h2>
        <p>Khi phát hiện hạng mục hao mòn, khách hàng có thể chuyển nhanh sang ${link(`${siteUrl}/danh-muc-san-pham/phu-tung-xe-nang`, 'phụ tùng xe nâng')} hoặc ${link(`${siteUrl}/dich-vu/sua-xe-nang`, 'dịch vụ sửa xe nâng')} để xử lý đúng thời điểm.</p>
      </div>
    `,
  },
  {
    slug: 'cho-thue-xe-nang-tphcm',
    title: 'Cho thuê xe nâng TPHCM',
    shortDescription:
      'Trang dịch vụ tổng cho thuê xe nâng tại TPHCM, bao gồm xe nâng dầu và xe nâng điện cho kho xưởng, nhà máy và nhu cầu ngắn hạn theo dự án.',
    metaTitle: 'Cho thuê xe nâng TPHCM, hỗ trợ nhanh theo nhu cầu | MGA',
    metaDescription:
      'Dịch vụ cho thuê xe nâng TPHCM cho nhu cầu bốc dỡ ngắn hạn, kho xưởng, nhà máy và cao điểm xuất nhập hàng. Tư vấn nhanh xe dầu, xe điện theo tải trọng.',
    metaKeywords: 'cho thuê xe nâng, thuê xe nâng tphcm, cho thuê xe nâng tphcm, thuê xe nâng dầu, thuê xe nâng điện',
    ogTitle: 'Cho thuê xe nâng TPHCM, hỗ trợ nhanh theo nhu cầu | MGA',
    ogDescription:
      'Giải pháp thuê xe nâng tại TPHCM cho nhu cầu ngắn hạn, dự án và thay xe tạm thời tại kho xưởng.',
    canonicalUrl: `${siteUrl}/dich-vu/cho-thue-xe-nang-tphcm`,
    ogImage: serviceImageMap.rentDiesel,
    thumbnail: serviceImageMap.rentDiesel,
    icon: 'truck',
    description: `
      <div class="service-content">
        <p><strong>Cho thuê xe nâng TPHCM</strong> là trang đích tổng cho nhóm khách hàng đang cần thuê xe nâng nhanh theo ca, theo dự án hoặc theo giai đoạn cao điểm xuất nhập hàng. Thay vì hỏi rời rạc từng dòng xe, khách hàng có thể bắt đầu từ trang này để xác định trước nên thuê xe dầu hay xe điện.</p>
        ${figure(serviceImageMap.rentDiesel, 'Dịch vụ cho thuê xe nâng tại TPHCM cho kho xưởng')}
        <h2>Nên thuê xe nâng trong trường hợp nào?</h2>
        <ul>
          <li>Nhu cầu phát sinh ngắn hạn, theo mùa hoặc theo công trình.</li>
          <li>Doanh nghiệp cần thay xe tạm thời khi xe chính đang sửa hoặc bảo dưỡng.</li>
          <li>Muốn thử tải trọng thực tế trước khi đầu tư mua xe nâng mới.</li>
        </ul>
        <h2>Chọn xe dầu hay xe điện?</h2>
        <p>Nếu kho làm việc ngoài trời, tải nặng hoặc chạy nhiều ca, nhóm ${link(`${siteUrl}/dich-vu/cho-thue-xe-nang-dau`, 'cho thuê xe nâng dầu')} thường phù hợp hơn. Với kho kín, xưởng sạch và lối đi hẹp, nhóm ${link(`${siteUrl}/dich-vu/cho-thue-xe-nang-dien`, 'cho thuê xe nâng điện')} là hướng an toàn hơn.</p>
        <h2>Nhóm tải trọng dễ triển khai</h2>
        <p>Nhu cầu phổ biến tại TPHCM thường tập trung ở các dải 1.5 tấn, 2.0 tấn, 2.5 tấn, 3.0 tấn và 5.0 tấn. Nếu khách hàng đang vừa thuê vừa so sánh đầu tư, có thể tham khảo thêm ${link(`${siteUrl}/san-pham/xe-nang-dau-mga-2-5-tan`, 'xe nâng dầu 2.5 tấn')} và ${link(`${siteUrl}/san-pham/xe-nang-dien-mga-2-0-tan`, 'xe nâng điện 2.0 tấn')}.</p>
      </div>
    `,
  },
  {
    slug: 'sua-xe-nang-tphcm',
    title: 'Sửa xe nâng TPHCM',
    shortDescription:
      'Dịch vụ sửa xe nâng tại TPHCM cho kho xưởng cần xử lý nhanh lỗi vận hành, hệ thống nâng, thủy lực hoặc linh kiện hao mòn trên xe dầu và xe điện.',
    metaTitle: 'Sửa xe nâng TPHCM, hỗ trợ kỹ thuật nhanh | MGA',
    metaDescription:
      'MGA cung cấp dịch vụ sửa xe nâng TPHCM cho xe dầu và xe điện. Tập trung chẩn đoán lỗi nhanh, thay phụ tùng đúng hạng mục và giảm dừng máy.',
    metaKeywords: 'sửa xe nâng tphcm, sửa xe nâng, sửa chữa xe nâng, bảo dưỡng xe nâng tphcm',
    ogTitle: 'Sửa xe nâng TPHCM, hỗ trợ kỹ thuật nhanh | MGA',
    ogDescription:
      'Dịch vụ sửa xe nâng tại TPHCM cho kho xưởng cần xử lý nhanh các lỗi cơ khí, thủy lực và điện điều khiển.',
    canonicalUrl: `${siteUrl}/dich-vu/sua-xe-nang-tphcm`,
    ogImage: serviceImageMap.repair,
    thumbnail: serviceImageMap.repair,
    icon: 'wrench',
    description: `
      <div class="service-content">
        <p>Trang <strong>sửa xe nâng TPHCM</strong> được tối ưu cho nhóm truy vấn local khi khách hàng cần kỹ thuật hỗ trợ nhanh tại kho xưởng. Đây là trang đích dành cho các tình huống xe nâng không thể chờ lịch bảo dưỡng định kỳ mà cần xử lý ngay để không ảnh hưởng tiến độ xuất nhập hàng.</p>
        ${figure(serviceImageMap.repair, 'Sửa xe nâng tại TPHCM cho nhu cầu vận hành gấp')}
        <h2>Dấu hiệu nên gọi kỹ thuật ngay</h2>
        <ul>
          <li>Xe nâng hụt lực, không giữ tải ổn định hoặc không nâng đúng độ cao.</li>
          <li>Động cơ dầu nóng bất thường, khó nổ máy hoặc có khói lạ.</li>
          <li>Xe điện báo lỗi sạc, yếu bình, giật khi chạy hoặc lỗi điều khiển.</li>
        </ul>
        <h2>Trang đích local kết nối với gì?</h2>
        <p>Khách hàng từ trang này có thể đi tiếp sang ${link(`${siteUrl}/dich-vu/sua-xe-nang`, 'dịch vụ sửa xe nâng tổng')}, ${link(`${siteUrl}/dich-vu/sua-xe-nang-dien-tphcm`, 'dịch vụ sửa xe nâng điện tại TPHCM')} hoặc ${link(`${siteUrl}/danh-muc-san-pham/phu-tung-xe-nang`, 'phụ tùng xe nâng')} để chốt đúng hướng xử lý.</p>
      </div>
    `,
  },
  {
    slug: 'sua-xe-nang-dien-tphcm',
    title: 'Sửa xe nâng điện TPHCM',
    shortDescription:
      'Dịch vụ sửa xe nâng điện tại TPHCM cho lỗi bình điện, bộ sạc, mô-tơ, bo mạch điều khiển và các vấn đề vận hành trong kho kín.',
    metaTitle: 'Sửa xe nâng điện TPHCM, xử lý nhanh lỗi điện | MGA',
    metaDescription:
      'MGA hỗ trợ sửa xe nâng điện tại TPHCM cho lỗi bình điện, bộ sạc, mô-tơ, contactor và bo điều khiển. Phù hợp kho trong nhà và nhu cầu vận hành liên tục.',
    metaKeywords: 'sửa xe nâng điện, sửa xe nâng điện tphcm, sửa chữa xe nâng điện, bảo trì xe nâng điện',
    ogTitle: 'Sửa xe nâng điện TPHCM, xử lý nhanh lỗi điện | MGA',
    ogDescription:
      'Dịch vụ sửa xe nâng điện tại TPHCM cho kho kín, xưởng sạch và các xe điện 1.5-3.0 tấn.',
    canonicalUrl: `${siteUrl}/dich-vu/sua-xe-nang-dien-tphcm`,
    ogImage: serviceImageMap.localElectric,
    thumbnail: serviceImageMap.localElectric,
    icon: 'battery-charging',
    description: `
      <div class="service-content">
        <p><strong>Sửa xe nâng điện TPHCM</strong> là landing page local chuyên cho nhóm khách hàng dùng xe điện trong kho kín, xưởng sạch hoặc môi trường cần tiếng ồn thấp. Các lỗi bình điện, bộ sạc, mô-tơ và bo điều khiển thường cần kỹ thuật hiểu đúng hệ thống điện trước khi thay linh kiện.</p>
        ${figure(serviceImageMap.localElectric, 'Sửa xe nâng điện tại TPHCM cho kho trong nhà')}
        <h2>Nhóm lỗi thường gặp</h2>
        <ul>
          <li>Bình điện tụt nhanh, xe yếu hoặc sạc không vào.</li>
          <li>Xe báo lỗi điều khiển, mất lực kéo hoặc giật khi di chuyển.</li>
          <li>Lỗi mô-tơ bơm, mô-tơ chạy, contactor hoặc hệ thống điện điều khiển.</li>
        </ul>
        <h2>Nên sửa hay đổi sang xe mới?</h2>
        <p>Nếu xe điện đã xuống cấp nhiều, doanh nghiệp nên so sánh thêm với nhóm ${link(`${siteUrl}/danh-muc-san-pham/xe-nang-dien`, 'xe nâng điện mới')} hoặc các model ${link(`${siteUrl}/san-pham/xe-nang-dien-mga-1-5-tan`, 'xe nâng điện 1.5 tấn')}, ${link(`${siteUrl}/san-pham/xe-nang-dien-mga-2-0-tan`, 'xe nâng điện 2.0 tấn')} để cân đối tổng chi phí dài hạn.</p>
      </div>
    `,
  },
  {
    slug: 'xe-nang-cu-thanh-ly-tphcm',
    title: 'Xe nâng cũ thanh lý tại TPHCM',
    shortDescription:
      'Trang tư vấn và nhận lead cho nhu cầu mua xe nâng cũ, xe thanh lý theo đợt và xe nâng dầu cũ tại TPHCM theo hướng lựa chọn cẩn trọng, không hứa thu mua lại.',
    metaTitle: 'Thanh lý xe nâng cũ, tư vấn mua xe cũ tại TPHCM | MGA',
    metaDescription:
      'Tư vấn chọn xe nâng cũ, xe thanh lý theo đợt và xe nâng dầu cũ tại TPHCM. Phù hợp doanh nghiệp muốn cân đối ngân sách nhưng vẫn cần kiểm tra kỹ tình trạng xe.',
    metaKeywords: 'thanh lý xe nâng cũ, xe nâng hàng cũ, xe nâng dầu cũ, mua xe nâng cũ tphcm',
    ogTitle: 'Thanh lý xe nâng cũ, tư vấn mua xe cũ tại TPHCM | MGA',
    ogDescription:
      'Landing page cho nhu cầu mua xe nâng cũ, xe thanh lý tại TPHCM theo hướng tư vấn kỹ thuật và chọn xe đúng bài toán.',
    canonicalUrl: `${siteUrl}/dich-vu/xe-nang-cu-thanh-ly-tphcm`,
    ogImage: serviceImageMap.used,
    thumbnail: serviceImageMap.used,
    icon: 'archive',
    description: `
      <div class="service-content">
        <p>Trang <strong>xe nâng cũ thanh lý tại TPHCM</strong> tập trung cho nhóm người dùng đang tìm xe nâng hàng cũ, xe nâng dầu cũ hoặc xe thanh lý theo đợt để tối ưu ngân sách đầu tư. Nội dung đi theo hướng tư vấn chọn xe cẩn trọng, không hứa thu mua lại hay tạo cảm giác như một sàn listing đại trà.</p>
        ${figure(serviceImageMap.used, 'Tư vấn mua xe nâng cũ thanh lý tại TPHCM')}
        <h2>Nên bắt đầu từ đâu khi mua xe nâng cũ?</h2>
        <p>Thay vì hỏi một câu chung chung về xe nâng cũ, doanh nghiệp nên khóa trước ba yếu tố: tải trọng thật đang dùng, môi trường làm việc trong nhà hay ngoài trời, và mức chấp nhận rủi ro bảo trì sau mua. Nếu hàng hóa vẫn chạy nhiều ca, xe quá cũ có thể làm chi phí sửa phát sinh nhanh hơn phần tiết kiệm lúc mua.</p>
        <h2>Nhóm xe cũ được hỏi nhiều</h2>
        <ul>
          <li>Xe nâng dầu cũ 3 tấn, 3.5 tấn và 5 tấn cho kho xưởng ngoài trời.</li>
          <li>Xe nâng điện cũ 1.5-2.5 tấn cho kho kín, xưởng sạch.</li>
          <li>Xe thanh lý theo đợt khi doanh nghiệp đổi cấu hình hoặc giảm tải đội xe.</li>
        </ul>
        <h2>Điểm tiếp theo nên xem</h2>
        <p>Người dùng từ landing page này nên đi tiếp sang các bài ${link(`${siteUrl}/bai-viet/mua-xe-nang-dau-cu-tphcm-can-kiem-tra-gi`, 'mua xe nâng dầu cũ TPHCM cần kiểm tra gì')}, ${link(`${siteUrl}/bai-viet/mua-xe-nang-dien-cu-tphcm-can-kiem-tra-gi`, 'mua xe nâng điện cũ TPHCM cần kiểm tra gì')} hoặc so sánh lại với nhóm ${link(`${siteUrl}/danh-muc-san-pham/xe-nang-dau`, 'xe nâng dầu mới')} nếu chi phí sửa sau mua có nguy cơ quá cao.</p>
      </div>
    `,
  },
];

const articleDefinitions = [
  {
    slug: 'gia-xe-nang-dien-2-tan-2026',
    title: 'Giá Xe Nâng Điện 2 Tấn 2026: Nên Chuẩn Bị Ngân Sách Bao Nhiêu?',
    shortDescription: 'Mặt bằng giá xe nâng điện 2 tấn, yếu tố làm lệch giá và cách hỏi báo giá sát nhu cầu vận hành trong kho.',
    metaTitle: 'Giá xe nâng điện 2 tấn 2026: Mức tham khảo mới | MGA',
    metaDescription: 'Tham khảo giá xe nâng điện 2 tấn 2026, các cấu hình ảnh hưởng đến giá và khi nào nên chọn xe điện 2 tấn thay vì 1.5 tấn.',
    metaKeywords: 'giá xe nâng điện 2 tấn, xe nâng điện 2 tấn, bán xe nâng điện 2 tấn',
    thumbnail: `${cdnUrl}/products/xe-nang-dien-mga-2-0-tan.jpg`,
    categoryId: 23,
    content: `
      <p>Nhiều doanh nghiệp khi tìm <strong>giá xe nâng điện 2 tấn</strong> thường muốn chốt thật nhanh một con số để so ngân sách. Tuy nhiên, cùng là xe điện 2 tấn nhưng mức giá thực tế có thể lệch khá nhiều theo chiều cao nâng, bình điện, bộ sạc, môi trường làm việc và chính sách hậu mãi.</p>
      ${figure(`${cdnUrl}/products/xe-nang-dien-mga-2-0-tan.jpg`, 'Xe nâng điện 2 tấn trong kho trong nhà')}
      <h2>Mặt bằng giá xe nâng điện 2 tấn thường nằm ở đâu?</h2>
      <p>Trong thực tế, nhóm xe điện 2 tấn được hỏi nhiều vì đây là dải tải trọng cân bằng giữa khả năng nâng pallet nặng hơn xe 1.5 tấn và chi phí đầu tư vẫn thấp hơn nhiều nhóm 3 tấn. Khi đi vào báo giá, doanh nghiệp nên xem đầy đủ từ mẫu ${link(`${siteUrl}/san-pham/xe-nang-dien-mga-2-0-tan`, 'xe nâng điện MGA 2.0 tấn')} và đối chiếu thêm nhóm ${link(`${siteUrl}/danh-muc-san-pham/xe-nang-dien`, 'xe nâng điện')} để không bị neo vào một cấu hình quá hẹp.</p>
      <h2>Vì sao cùng 2 tấn nhưng giá chênh?</h2>
      <ul>
        <li>Khác loại bình điện hoặc cấu hình sạc.</li>
        <li>Khác chiều cao nâng, mast và bộ công tác đi kèm.</li>
        <li>Khác điều kiện giao xe, bàn giao kỹ thuật và hỗ trợ sau bán.</li>
      </ul>
      ${figure(`${cdnUrl}/products/xe-nang-dien-ngoi-lai-mga-1-5-tan.jpg`, 'So sánh xe điện ngồi lái và xe điện 2 tấn')}
      <h2>Nên chọn 2 tấn hay 1.5 tấn?</h2>
      <p>Nếu kho chỉ xử lý pallet phổ thông và ít nâng sát tải, 1.5 tấn có thể đủ. Nhưng nếu doanh nghiệp muốn dư tải hơn để tránh vận hành sát ngưỡng mỗi ngày, nhóm 2 tấn an toàn hơn. Bạn có thể đọc thêm ${link(`${siteUrl}/bai-viet/xe-nang-dien-1-5-tan-hay-2-tan-cho-kho-trong-nha`, 'so sánh xe nâng điện 1.5 tấn hay 2 tấn')} để chốt nhanh hơn.</p>
      <h2>Kết luận</h2>
      <p>Để hỏi giá sát, hãy chốt trước môi trường làm việc, chiều cao nâng và tần suất dùng xe. Sau đó đối chiếu giữa ${link(`${siteUrl}/san-pham/xe-nang-dien-mga-2-0-tan`, 'xe nâng điện 2 tấn MGA')} và ${link(`${siteUrl}/dich-vu/cho-thue-xe-nang-dien`, 'dịch vụ thuê xe nâng điện')} nếu bạn còn đang cân nhắc bài toán đầu tư.</p>
    `,
  },
  {
    slug: 'xe-nang-5-tan-gia-bao-nhieu',
    title: 'Xe Nâng 5 Tấn Giá Bao Nhiêu? Cách Nhìn Đúng Trước Khi Hỏi Báo Giá',
    shortDescription: 'Tổng hợp yếu tố ảnh hưởng đến giá xe nâng 5 tấn và khi nào nên chọn xe dầu 5 tấn thay vì nhóm tải nhỏ hơn.',
    metaTitle: 'Xe nâng 5 tấn giá bao nhiêu? Hỏi giá đúng cách | MGA',
    metaDescription: 'Phân tích giá xe nâng 5 tấn, cấu hình ảnh hưởng đến báo giá và cách chọn xe dầu 5 tấn cho kho xưởng hoặc bãi vật liệu.',
    metaKeywords: 'xe nâng 5 tấn, giá xe nâng 5 tấn, xe nâng dầu 5 tấn',
    thumbnail: `${cdnUrl}/products/xe-nang-dau-mga-5-0-tan.jpg`,
    categoryId: 23,
    content: `
      <p>Khi doanh nghiệp hỏi <strong>xe nâng 5 tấn giá bao nhiêu</strong>, điều cần tránh nhất là so sánh một con số trần trụi mà bỏ qua cấu hình thật cần dùng. Với nhóm 5 tấn, chỉ cần khác chiều cao nâng, bộ công tác hoặc điều kiện vận hành ngoài trời là báo giá đã lệch đáng kể.</p>
      ${figure(`${cdnUrl}/products/xe-nang-dau-mga-5-0-tan.jpg`, 'Xe nâng dầu 5 tấn cho hàng nặng tại bãi công nghiệp')}
      <h2>Xe nâng 5 tấn phù hợp bài toán nào?</h2>
      <p>Nhóm này phù hợp bãi vật liệu, khu sản xuất, hàng nặng và công việc cần dư tải rõ rệt hơn so với 3.5 tấn. Với khách hàng đang so sánh đầu tư, mẫu ${link(`${siteUrl}/san-pham/xe-nang-dau-mga-5-0-tan`, 'xe nâng dầu MGA 5.0 tấn')} là điểm bắt đầu hợp lý để đối chiếu cấu hình.</p>
      <h2>Những yếu tố làm giá thay đổi mạnh</h2>
      <ul>
        <li>Khung nâng tiêu chuẩn hay mast cao.</li>
        <li>Lốp, side shift, cabin và các bộ công tác đi kèm.</li>
        <li>Điều kiện bàn giao, hậu mãi và tốc độ cấp phụ tùng.</li>
      </ul>
      ${figure(`${cdnUrl}/products/xe-nang-dau-mga-10-tan.jpg`, 'So sánh nhóm xe nâng dầu 5 tấn và 10 tấn')}
      <h2>Khi nào không cần lên 5 tấn?</h2>
      <p>Nếu hàng hóa chủ yếu vẫn nằm ở ngưỡng pallet phổ thông, doanh nghiệp nên so lại với ${link(`${siteUrl}/san-pham/xe-nang-dau-mga-3-5-tan`, 'xe nâng dầu 3.5 tấn')} để tránh đầu tư dư tải. Còn nếu mục tiêu chính là ngoài trời và tải nặng liên tục, nhóm 5 tấn lại là bước đệm hợp lý trước khi lên 7-10 tấn.</p>
    `,
  },
  {
    slug: 'xe-nang-gia-re-nen-mua-gi',
    title: 'Xe Nâng Giá Rẻ Nên Mua Gì? Cách Tránh Rẻ Lúc Đầu, Tốn Về Sau',
    shortDescription: 'Góc nhìn thực tế về xe nâng giá rẻ, nên ưu tiên dòng nào và dấu hiệu của một báo giá rẻ nhưng rủi ro cao.',
    metaTitle: 'Xe nâng giá rẻ nên mua gì để không tốn về sau? | MGA',
    metaDescription: 'Phân tích cách chọn xe nâng giá rẻ theo bài toán thực tế, tránh mua rẻ ban đầu nhưng phát sinh chi phí sửa và dừng máy về sau.',
    metaKeywords: 'xe nâng giá rẻ, xe nâng hàng giá rẻ, bán xe nâng giá rẻ',
    thumbnail: `${cdnUrl}/products/xe-nang-dau-mga-2-5-tan.jpg`,
    categoryId: 23,
    content: `
      <p>Từ khóa <strong>xe nâng giá rẻ</strong> có lượng tìm kiếm lớn, nhưng phía sau nó là hai kiểu nhu cầu khác nhau: một bên muốn tối ưu ngân sách hợp lý, một bên chỉ muốn tìm giá thấp nhất. Vấn đề là xe nâng quá rẻ thường kéo theo rủi ro về phụ tùng, hậu mãi hoặc chi phí sửa phát sinh sau mua.</p>
      ${figure(`${cdnUrl}/products/xe-nang-dau-mga-2-5-tan.jpg`, 'Xe nâng dầu cho doanh nghiệp cân đối ngân sách')}
      <h2>Rẻ theo kiểu nào mới an toàn?</h2>
      <p>Rẻ an toàn là chọn đúng tải trọng, đúng môi trường vận hành và không mua dư cấu hình. Ví dụ, doanh nghiệp dùng trong kho kín có thể xem ${link(`${siteUrl}/danh-muc-san-pham/xe-nang-dien`, 'xe nâng điện')} thay vì mặc định chọn xe dầu. Ngược lại, nếu kho ngoài trời và chạy nhiều ca, mua xe dầu phù hợp còn rẻ hơn việc ép xe điện làm việc sai môi trường.</p>
      <h2>Ba sai lầm khi săn xe nâng giá rẻ</h2>
      <ul>
        <li>So sánh giá mà bỏ qua chi phí vận hành và phụ tùng.</li>
        <li>Chọn xe sát ngưỡng tải khiến hao mòn nhanh.</li>
        <li>Mua theo giá chào mà không có đường hỗ trợ kỹ thuật tại TPHCM.</li>
      </ul>
      <h2>Điểm bắt đầu hợp lý</h2>
      <p>Nếu ngân sách còn nhạy, hãy bắt đầu từ các dải được dùng nhiều như ${link(`${siteUrl}/san-pham/xe-nang-dau-mga-2-5-tan`, 'xe nâng dầu 2.5 tấn')}, ${link(`${siteUrl}/san-pham/xe-nang-dien-mga-1-5-tan`, 'xe nâng điện 1.5 tấn')} hoặc cân nhắc ${link(`${siteUrl}/dich-vu/xe-nang-cu-thanh-ly-tphcm`, 'xe nâng cũ thanh lý tại TPHCM')} nếu chấp nhận được rủi ro kiểm tra kỹ hơn.</p>
    `,
  },
  {
    slug: 'xe-nang-hang-moi-hay-cu-nen-chon-gi',
    title: 'Xe Nâng Hàng Mới Hay Cũ: Chọn Gì Để Hợp Bài Toán Vận Hành?',
    shortDescription: 'So sánh xe nâng hàng mới và xe cũ theo ngân sách, mức độ rủi ro, nhu cầu tải trọng và dịch vụ hậu mãi.',
    metaTitle: 'Xe nâng hàng mới hay cũ: Chọn gì hợp hơn? | MGA',
    metaDescription: 'So sánh xe nâng hàng mới và xe cũ theo ngân sách, rủi ro bảo trì và môi trường sử dụng để doanh nghiệp chốt phương án phù hợp hơn.',
    metaKeywords: 'xe nâng hàng mới, xe nâng hàng cũ, xe nâng hàng mới hay cũ',
    thumbnail: `${cdnUrl}/products/xe-nang-dau-mga-3-5-tan.jpg`,
    categoryId: 22,
    content: `
      <p>Nhu cầu so sánh <strong>xe nâng hàng mới hay cũ</strong> thường xuất hiện khi doanh nghiệp muốn cân bằng giữa ngân sách đầu tư và độ an tâm khi đưa xe vào khai thác. Không có một đáp án chung cho mọi trường hợp; điều quan trọng là nhìn đúng bài toán vận hành thật của kho xưởng.</p>
      ${figure(`${cdnUrl}/products/xe-nang-dau-mga-3-5-tan.jpg`, 'So sánh xe nâng mới và xe nâng cũ theo nhu cầu vận hành')}
      <h2>Khi nào nên nghiêng về xe mới?</h2>
      <p>Nếu doanh nghiệp vận hành nhiều ca, cần độ ổn định cao, phụ thuộc lớn vào tiến độ bốc dỡ và muốn kiểm soát chi phí dừng máy, xe mới thường an toàn hơn. Bạn có thể bắt đầu từ ${link(`${siteUrl}/products`, 'hub sản phẩm xe nâng')} hoặc các nhóm ${link(`${siteUrl}/danh-muc-san-pham/xe-nang-dau`, 'xe nâng dầu')} và ${link(`${siteUrl}/danh-muc-san-pham/xe-nang-dien`, 'xe nâng điện')}.</p>
      <h2>Khi nào xe cũ vẫn hợp lý?</h2>
      <p>Nếu nhu cầu chưa quá dày, ngân sách đầu tư ban đầu giới hạn và doanh nghiệp có thể kiểm tra kỹ tình trạng xe, nhóm xe cũ vẫn đáng cân nhắc. Trường hợp này nên đi qua landing page ${link(`${siteUrl}/dich-vu/xe-nang-cu-thanh-ly-tphcm`, 'xe nâng cũ thanh lý tại TPHCM')} và các bài theo từng tải trọng để giảm rủi ro chọn sai xe.</p>
    `,
  },
  {
    slug: 'xe-nang-dau-hay-dien-cho-kho-ngoai-troi',
    title: 'Xe Nâng Dầu Hay Điện Cho Kho Ngoài Trời? Cách Chọn Đúng Tình Huống',
    shortDescription: 'So sánh nhanh xe nâng dầu và điện cho môi trường ngoài trời, tải nặng và cường độ làm việc cao.',
    metaTitle: 'Xe nâng dầu hay điện cho kho ngoài trời? | MGA',
    metaDescription: 'Phân tích khi nào kho ngoài trời nên chọn xe nâng dầu, khi nào xe điện vẫn có thể dùng được và cách tránh chọn sai môi trường vận hành.',
    metaKeywords: 'xe nâng dầu hay điện, xe nâng dầu, xe nâng điện, so sánh xe nâng dầu điện',
    thumbnail: `${cdnUrl}/products/xe-nang-dau-mga-3-0-tan.jpg`,
    categoryId: 22,
    content: `
      <p>Nhiều doanh nghiệp hỏi <strong>xe nâng dầu hay điện cho kho ngoài trời</strong> khi muốn giảm chi phí vận hành nhưng vẫn phải xử lý công việc ở bãi hàng, sân xuất hoặc khu giao nhận có cường độ cao. Điểm mấu chốt ở đây không phải xe nào “hay hơn” chung chung, mà là xe nào phù hợp hơn với môi trường thực.</p>
      ${figure(`${cdnUrl}/products/xe-nang-dau-mga-3-0-tan.jpg`, 'Xe nâng dầu làm việc trong bãi ngoài trời')}
      <h2>Vì sao xe dầu vẫn chiếm ưu thế ở ngoài trời?</h2>
      <p>Xe dầu thường dễ đáp ứng hơn khi mặt bằng rộng, tải nặng, chạy nhiều ca và có độ gồ ghề nhất định. Các nhóm ${link(`${siteUrl}/san-pham/xe-nang-dau-mga-3-0-tan`, 'xe nâng dầu 3 tấn')} hay ${link(`${siteUrl}/san-pham/xe-nang-dau-mga-5-0-tan`, 'xe nâng dầu 5 tấn')} thường được hỏi nhiều trong bối cảnh này.</p>
      <h2>Khi nào xe điện vẫn dùng được?</h2>
      <p>Nếu “ngoài trời” chỉ là khu vực giao nhận ngắn, nền bằng và doanh nghiệp vẫn quay đầu xe chủ yếu trong kho, xe điện vẫn có thể khả thi. Khi đó nên xem kỹ hơn giữa ${link(`${siteUrl}/san-pham/xe-nang-dien-mga-2-0-tan`, 'xe nâng điện 2.0 tấn')} và cấu hình đứng lái/ngồi lái.</p>
    `,
  },
  {
    slug: 'xe-nang-dien-1-5-tan-hay-2-tan-cho-kho-trong-nha',
    title: 'Xe Nâng Điện 1.5 Tấn Hay 2 Tấn Cho Kho Trong Nhà?',
    shortDescription: 'Gợi ý chọn xe nâng điện 1.5 tấn hay 2 tấn theo loại pallet, biên tải và tần suất sử dụng trong kho kín.',
    metaTitle: 'Xe nâng điện 1.5 tấn hay 2 tấn cho kho trong nhà? | MGA',
    metaDescription: 'So sánh xe nâng điện 1.5 tấn và 2 tấn theo loại pallet, biên tải và mức độ xoay trở để chọn đúng cấu hình cho kho trong nhà.',
    metaKeywords: 'xe nâng điện 1.5 tấn, xe nâng điện 2 tấn, so sánh xe nâng điện 1.5 tấn 2 tấn',
    thumbnail: `${cdnUrl}/products/xe-nang-dien-mga-1-5-tan.jpg`,
    categoryId: 22,
    content: `
      <p>Giữa <strong>xe nâng điện 1.5 tấn và 2 tấn</strong>, nhiều kho trong nhà chọn theo cảm tính và chỉ nhìn vào giá đầu tư ban đầu. Điều này dễ dẫn tới hai cực: hoặc mua dư tải không cần thiết, hoặc chọn xe quá sát ngưỡng khiến hao mòn nhanh.</p>
      ${figure(`${cdnUrl}/products/xe-nang-dien-mga-1-5-tan.jpg`, 'Xe nâng điện 1.5 tấn trong kho trong nhà')}
      <h2>1.5 tấn phù hợp khi nào?</h2>
      <p>Nếu hàng hóa chủ yếu là pallet phổ thông, biên tải không cao và ưu tiên sự gọn gàng trong lối đi hẹp, ${link(`${siteUrl}/san-pham/xe-nang-dien-mga-1-5-tan`, 'xe nâng điện 1.5 tấn')} là điểm bắt đầu hợp lý.</p>
      <h2>2 tấn phù hợp khi nào?</h2>
      <p>Nếu kho thường xuyên có pallet nặng hơn, cần thêm dư tải để vận hành ổn định hoặc muốn tránh cảm giác xe làm việc sát ngưỡng, nhóm ${link(`${siteUrl}/san-pham/xe-nang-dien-mga-2-0-tan`, 'xe nâng điện 2.0 tấn')} phù hợp hơn.</p>
    `,
  },
  {
    slug: 'khi-nao-nen-thue-xe-nang-thay-vi-mua',
    title: 'Khi Nào Nên Thuê Xe Nâng Thay Vì Mua?',
    shortDescription: 'Gợi ý thực dụng cho doanh nghiệp đang phân vân giữa thuê xe nâng ngắn hạn và đầu tư mua mới.',
    metaTitle: 'Khi nào nên thuê xe nâng thay vì mua? | MGA',
    metaDescription: 'Phân tích các tình huống nên thuê xe nâng thay vì mua mới để tối ưu dòng tiền, xử lý cao điểm và thử cấu hình trước khi đầu tư.',
    metaKeywords: 'cho thuê xe nâng, thuê xe nâng hay mua, thuê xe nâng tphcm',
    thumbnail: `${cdnUrl}/services/diesel-forklift-rental-service.jpg`,
    categoryId: 24,
    content: `
      <p>Quyết định <strong>thuê xe nâng hay mua mới</strong> nên xuất phát từ thời gian sử dụng, tần suất làm việc và mức chắc chắn của nhu cầu. Với nhiều doanh nghiệp tại TPHCM, thuê là bước đệm tốt trước khi chốt đầu tư lớn.</p>
      ${figure(`${cdnUrl}/services/diesel-forklift-rental-service.jpg`, 'Dịch vụ cho thuê xe nâng tại TPHCM')}
      <h2>Trường hợp nên thuê</h2>
      <ul>
        <li>Nhu cầu phát sinh theo mùa, theo dự án hoặc đợt cao điểm xuất nhập hàng.</li>
        <li>Xe hiện tại đang sửa và doanh nghiệp cần giải pháp thay thế tạm thời.</li>
        <li>Muốn thử tải trọng hoặc môi trường vận hành trước khi mua xe mới.</li>
      </ul>
      <h2>Trang nên xem tiếp</h2>
      <p>Từ bài này, người dùng nên đi tiếp sang ${link(`${siteUrl}/dich-vu/cho-thue-xe-nang-tphcm`, 'cho thuê xe nâng TPHCM')}, ${link(`${siteUrl}/dich-vu/cho-thue-xe-nang-dau`, 'cho thuê xe nâng dầu')} hoặc ${link(`${siteUrl}/dich-vu/cho-thue-xe-nang-dien`, 'cho thuê xe nâng điện')}.</p>
    `,
  },
  {
    slug: 'checklist-goi-sua-xe-nang-tai-tphcm',
    title: 'Checklist Gọi Sửa Xe Nâng Tại TPHCM: Chuẩn Bị Gì Để Xử Lý Nhanh?',
    shortDescription: 'Danh sách thông tin cần chuẩn bị trước khi gọi sửa xe nâng để kỹ thuật chẩn đoán nhanh và hạn chế dừng máy.',
    metaTitle: 'Checklist gọi sửa xe nâng tại TPHCM | MGA',
    metaDescription: 'Chuẩn bị gì trước khi gọi sửa xe nâng tại TPHCM? Hướng dẫn chốt nhanh loại xe, lỗi gặp phải, môi trường vận hành và dấu hiệu cần ghi nhận.',
    metaKeywords: 'sửa xe nâng tphcm, sửa xe nâng, checklist sửa xe nâng',
    thumbnail: `${cdnUrl}/products/xe-nang-dau-mga-3-0-tan.jpg`,
    categoryId: 24,
    content: `
      <p>Khi xe dừng đột ngột, nhiều doanh nghiệp gọi dịch vụ <strong>sửa xe nâng tại TPHCM</strong> nhưng không chuẩn bị đủ thông tin, dẫn tới kỹ thuật phải dò lại từ đầu. Một checklist ngắn trước cuộc gọi sẽ giúp rút ngắn thời gian xử lý đáng kể.</p>
      ${figure(`${cdnUrl}/products/xe-nang-dau-mga-3-0-tan.jpg`, 'Chuẩn bị thông tin trước khi gọi sửa xe nâng tại TPHCM')}
      <h2>Ba nhóm thông tin quan trọng</h2>
      <ul>
        <li>Xe dầu hay xe điện, tải trọng bao nhiêu, dùng trong nhà hay ngoài trời.</li>
        <li>Lỗi xuất hiện ở lúc nào: đang nâng, đang chạy, lúc nổ máy hay lúc sạc.</li>
        <li>Dấu hiệu đi kèm: rò dầu, tiếng kêu, báo lỗi, hụt lực, nóng máy hoặc bình tụt nhanh.</li>
      </ul>
      <h2>Điểm đến phù hợp sau bài này</h2>
      <p>Nếu lỗi thiên về điện, nên chuyển nhanh sang ${link(`${siteUrl}/dich-vu/sua-xe-nang-dien-tphcm`, 'sửa xe nâng điện TPHCM')}. Nếu xe cần kiểm tra tổng thể hoặc liên quan hao mòn lâu ngày, hướng đúng là ${link(`${siteUrl}/dich-vu/sua-xe-nang-tphcm`, 'sửa xe nâng TPHCM')} và ${link(`${siteUrl}/dich-vu/yeu-cau-bao-duong`, 'bảo dưỡng xe nâng')}.</p>
    `,
  },
  {
    slug: 'phu-tung-xe-nang-dau-nao-hay-phai-thay',
    title: 'Phụ Tùng Xe Nâng Dầu Nào Hay Phải Thay Nhất?',
    shortDescription: 'Tổng hợp các nhóm phụ tùng xe nâng dầu thường hao mòn và khi nào nên thay để tránh dừng máy lớn.',
    metaTitle: 'Phụ tùng xe nâng dầu nào hay phải thay nhất? | MGA',
    metaDescription: 'Danh sách các nhóm phụ tùng xe nâng dầu thường hao mòn như lọc, bánh, phớt, ống dầu và bộ phận hệ thống nâng để chủ động bảo trì.',
    metaKeywords: 'phụ tùng xe nâng dầu, phụ tùng xe nâng, sửa xe nâng dầu',
    thumbnail: `${cdnUrl}/products/xe-nang-dau-mga-2-5-tan.jpg`,
    categoryId: 24,
    content: `
      <p>Với nhóm xe chạy nhiều ca, biết trước <strong>phụ tùng xe nâng dầu</strong> nào hay phải thay sẽ giúp doanh nghiệp chủ động tồn kho tối thiểu và tránh dừng máy kéo dài khi hỏng bất ngờ.</p>
      ${figure(`${cdnUrl}/products/xe-nang-dau-mga-2-5-tan.jpg`, 'Kiểm tra phụ tùng xe nâng dầu tại kho xưởng')}
      <h2>Nhóm hao mòn thường gặp</h2>
      <ul>
        <li>Lọc dầu, lọc nhiên liệu và dầu thủy lực.</li>
        <li>Ống dầu, phớt, seal và các điểm dễ rò.</li>
        <li>Bánh xe, phanh, chain và cụm nâng hạ.</li>
      </ul>
      <h2>Nên mua phụ tùng hay gọi kiểm tra trước?</h2>
      <p>Nếu xe đã có dấu hiệu bất thường, tốt hơn nên đi từ ${link(`${siteUrl}/dich-vu/sua-xe-nang`, 'dịch vụ sửa xe nâng')} hoặc ${link(`${siteUrl}/dich-vu/sua-xe-nang-tphcm`, 'sửa xe nâng TPHCM')} trước khi chốt part để tránh thay nhầm hạng mục. Sau khi chẩn đoán xong, khách hàng mới quay lại ${link(`${siteUrl}/danh-muc-san-pham/phu-tung-xe-nang`, 'danh mục phụ tùng xe nâng')} để mua đúng linh kiện.</p>
    `,
  },
  {
    slug: 'mua-xe-nang-cu-tphcm-3-tan-can-luu-y-gi',
    title: 'Mua Xe Nâng Cũ TPHCM 3 Tấn: Cần Lưu Ý Gì Trước Khi Chốt Xe?',
    shortDescription: 'Tư vấn kiểm tra xe nâng cũ 3 tấn tại TPHCM theo tình trạng vận hành, lịch sử sửa chữa và độ phù hợp với hàng hóa.',
    metaTitle: 'Mua xe nâng cũ TPHCM 3 tấn: Cần lưu ý gì? | MGA',
    metaDescription: 'Hướng dẫn kiểm tra xe nâng cũ 3 tấn tại TPHCM theo tình trạng vận hành, bài toán tải trọng và rủi ro sửa chữa sau mua.',
    metaKeywords: 'mua xe nâng cũ tphcm 3 tấn, xe nâng cũ 3 tấn, xe nâng dầu cũ 3 tấn',
    thumbnail: `${cdnUrl}/products/xe-nang-dau-mga-3-0-tan.jpg`,
    categoryId: 9,
    content: `
      <p>Nhóm <strong>xe nâng cũ 3 tấn</strong> thường được quan tâm vì vừa tầm nhiều kho xưởng, nhưng cũng là nhóm dễ bị “đẹp ngoài, mệt bên trong” nếu người mua không nhìn đúng điểm kỹ thuật.</p>
      ${figure(`${cdnUrl}/products/xe-nang-dau-mga-3-0-tan.jpg`, 'Xe nâng cũ 3 tấn cần kiểm tra gì trước khi mua')}
      <h2>Ba điểm phải chốt trước khi xem xe</h2>
      <ul>
        <li>Tải thật đang dùng có thường xuyên gần ngưỡng 3 tấn hay không.</li>
        <li>Xe làm trong nhà hay ngoài trời để xem có nên nghiêng về dầu hay điện.</li>
        <li>Khả năng chấp nhận chi phí sửa sau mua trong 3-6 tháng đầu.</li>
      </ul>
      <p>Nếu doanh nghiệp muốn so luôn với xe mới, nên đối chiếu thêm ${link(`${siteUrl}/san-pham/xe-nang-dau-mga-3-0-tan`, 'xe nâng dầu MGA 3.0 tấn')} và landing page ${link(`${siteUrl}/dich-vu/xe-nang-cu-thanh-ly-tphcm`, 'xe nâng cũ thanh lý tại TPHCM')}.</p>
    `,
  },
  {
    slug: 'mua-xe-nang-cu-tphcm-3-5-tan-co-hop-kho-xuong-khong',
    title: 'Mua Xe Nâng Cũ TPHCM 3.5 Tấn Có Hợp Kho Xưởng Không?',
    shortDescription: 'Phân tích khi nào xe nâng cũ 3.5 tấn là lựa chọn hợp lý và khi nào nên chuyển sang xe mới để tránh chi phí sửa kéo dài.',
    metaTitle: 'Mua xe nâng cũ TPHCM 3.5 tấn có hợp không? | MGA',
    metaDescription: 'Gợi ý chọn xe nâng cũ 3.5 tấn tại TPHCM theo loại hàng, tần suất dùng xe và chi phí sửa chữa sau mua.',
    metaKeywords: 'mua xe nâng cũ tphcm 3.5 tấn, xe nâng dầu cũ 3.5 tấn',
    thumbnail: `${cdnUrl}/products/xe-nang-dau-mga-3-5-tan.jpg`,
    categoryId: 9,
    content: `
      <p><strong>Xe nâng cũ 3.5 tấn</strong> hấp dẫn với doanh nghiệp muốn có biên tải tốt hơn nhóm 3 tấn nhưng chưa muốn đầu tư xe mới. Điểm cần nhìn kỹ là mức độ khai thác thực tế sau mua có đủ để “gánh” chi phí sửa hay không.</p>
      ${figure(`${cdnUrl}/products/xe-nang-dau-mga-3-5-tan.jpg`, 'Xe nâng cũ 3.5 tấn cho kho xưởng tại TPHCM')}
      <h2>Khi nào 3.5 tấn là lựa chọn hợp lý?</h2>
      <p>Nếu hàng hóa có lúc chạm gần ngưỡng 3 tấn, kho xưởng muốn dư tải hơn và vẫn chấp nhận kiểm tra xe kỹ, 3.5 tấn là phương án đáng cân nhắc. Nếu công việc nặng và liên tục hàng ngày, nên so thêm với ${link(`${siteUrl}/san-pham/xe-nang-dau-mga-3-5-tan`, 'xe nâng dầu MGA 3.5 tấn')} để tính tổng chi phí dài hạn.</p>
    `,
  },
  {
    slug: 'mua-xe-nang-cu-tphcm-5-tan-nen-kiem-tra-gi',
    title: 'Mua Xe Nâng Cũ TPHCM 5 Tấn: Nên Kiểm Tra Gì Đầu Tiên?',
    shortDescription: 'Checklist nhanh cho doanh nghiệp muốn mua xe nâng cũ 5 tấn để làm hàng nặng, bãi vật liệu hoặc sản xuất tải cao.',
    metaTitle: 'Mua xe nâng cũ TPHCM 5 tấn: Nên kiểm tra gì? | MGA',
    metaDescription: 'Checklist mua xe nâng cũ 5 tấn tại TPHCM cho nhu cầu hàng nặng, bãi vật liệu và bài toán tải cao có rủi ro bảo trì lớn.',
    metaKeywords: 'mua xe nâng cũ tphcm 5 tấn, xe nâng dầu cũ 5 tấn, xe nâng cũ 5 tấn',
    thumbnail: `${cdnUrl}/products/xe-nang-dau-mga-5-0-tan.jpg`,
    categoryId: 9,
    content: `
      <p>Với nhóm <strong>xe nâng cũ 5 tấn</strong>, chi phí sửa sau mua có thể tăng rất nhanh nếu người mua chỉ nhìn vào giá vào cửa. Càng lên tải trọng cao, sai sót trong khâu kiểm tra càng đắt.</p>
      ${figure(`${cdnUrl}/products/xe-nang-dau-mga-5-0-tan.jpg`, 'Kiểm tra xe nâng cũ 5 tấn trước khi chốt mua')}
      <h2>Nên nhìn gì đầu tiên?</h2>
      <ul>
        <li>Tình trạng mast, càng nâng, hệ thống thủy lực và độ ổn định khi giữ tải.</li>
        <li>Lịch sử sửa lớn, độ rơ tổng thể và dấu hiệu quá tải kéo dài.</li>
        <li>Môi trường khai thác cũ của xe có tương thích với công việc sắp dùng hay không.</li>
      </ul>
      <p>Nếu kho xưởng của bạn cần xe chạy nặng liên tục, nên đặt lên bàn cả hai phương án: mua cũ có kiểm soát hoặc chuyển sang ${link(`${siteUrl}/san-pham/xe-nang-dau-mga-5-0-tan`, 'xe nâng dầu MGA 5.0 tấn')} mới để tránh dừng máy về sau.</p>
    `,
  },
];

async function upsertSeo(client, seoRow) {
  await client.query(
    `
      INSERT INTO seo (page_path, title, description, og_title, og_description, og_image, keywords, canonical_url, robots_txt, is_active)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,true)
      ON CONFLICT (page_path) DO UPDATE
      SET title = EXCLUDED.title,
          description = EXCLUDED.description,
          og_title = EXCLUDED.og_title,
          og_description = EXCLUDED.og_description,
          og_image = EXCLUDED.og_image,
          keywords = EXCLUDED.keywords,
          canonical_url = EXCLUDED.canonical_url,
          robots_txt = EXCLUDED.robots_txt,
          updated_at = now()
    `,
    [
      '/products',
      seoRow.title,
      seoRow.description,
      seoRow.ogTitle,
      seoRow.ogDescription,
      seoRow.ogImage,
      seoRow.keywords,
      seoRow.canonicalUrl,
      'index,follow',
    ],
  );
}

async function updateCategories(client) {
  for (const item of categoryUpdates) {
    await client.query(
      `
        UPDATE category_translations
        SET meta_title = $1,
            meta_description = $2,
            meta_keywords = $3,
            og_title = $4,
            og_description = $5,
            canonical_url = $6,
            og_image = $7,
            updated_at = now()
        WHERE category_id = $8 AND locale = 'vi'
      `,
      [
        item.metaTitle,
        item.metaDescription,
        item.metaKeywords,
        item.ogTitle,
        item.ogDescription,
        item.canonicalUrl,
        item.ogImage,
        item.categoryId,
      ],
    );
  }
}

async function updateProducts(client) {
  for (const item of productMetaUpdates) {
    await client.query(
      `
        UPDATE product_translations
        SET meta_title = $1,
            meta_description = $2,
            meta_keywords = $3,
            og_title = $1,
            og_description = $2,
            updated_at = now()
        WHERE slug = $4 AND locale = 'vi'
      `,
      [item.metaTitle, item.metaDescription, item.metaKeywords, item.slug],
    );
  }
}

async function upsertService(client, item) {
  const existing = await client.query(
    `
      SELECT s.id
      FROM services s
      JOIN service_translations st ON st.service_id = s.id
      WHERE st.slug = $1 AND st.locale = 'vi'
      LIMIT 1
    `,
    [item.slug],
  );

  let serviceId = existing.rows[0]?.id;
  if (!serviceId) {
    const inserted = await client.query(
      `
        INSERT INTO services (icon, "order", is_active, is_featured, is_new, thumbnail)
        VALUES ($1, 0, true, true, true, $2)
        RETURNING id
      `,
      [item.icon, item.thumbnail],
    );
    serviceId = inserted.rows[0].id;
  } else {
    await client.query(
      `UPDATE services SET icon = $1, thumbnail = $2, is_active = true, is_featured = true, updated_at = now() WHERE id = $3`,
      [item.icon, item.thumbnail, serviceId],
    );
  }

  const translationExists = await client.query(
    `SELECT id FROM service_translations WHERE service_id = $1 AND locale = 'vi'`,
    [serviceId],
  );

  if (translationExists.rowCount) {
    await client.query(
      `
        UPDATE service_translations
        SET title = $1,
            description = $2,
            short_description = $3,
            meta_title = $4,
            meta_description = $5,
            meta_keywords = $6,
            og_title = $7,
            og_description = $8,
            og_image = $9,
            canonical_url = $10,
            slug = $11,
            updated_at = now()
        WHERE service_id = $12 AND locale = 'vi'
      `,
      [
        item.title,
        item.description,
        item.shortDescription,
        item.metaTitle,
        item.metaDescription,
        item.metaKeywords,
        item.ogTitle,
        item.ogDescription,
        item.ogImage,
        item.canonicalUrl,
        item.slug,
        serviceId,
      ],
    );
  } else {
    await client.query(
      `
        INSERT INTO service_translations
        (title, description, short_description, locale, meta_title, meta_description, meta_keywords, og_title, og_description, og_image, canonical_url, service_id, slug)
        VALUES ($1,$2,$3,'vi',$4,$5,$6,$7,$8,$9,$10,$11,$12)
      `,
      [
        item.title,
        item.description,
        item.shortDescription,
        item.metaTitle,
        item.metaDescription,
        item.metaKeywords,
        item.ogTitle,
        item.ogDescription,
        item.ogImage,
        item.canonicalUrl,
        serviceId,
        item.slug,
      ],
    );
  }
}

async function upsertPost(client, item) {
  const existing = await client.query(
    `
      SELECT p.id
      FROM posts p
      JOIN post_translations pt ON pt.post_id = p.id
      WHERE pt.slug = $1 AND pt.locale = 'vi'
      LIMIT 1
    `,
    [item.slug],
  );

  let postId = existing.rows[0]?.id;
  if (!postId) {
    const inserted = await client.query(
      `
        INSERT INTO posts (title, content, published, thumbnail, short_description)
        VALUES ($1, $2, true, $3, $4)
        RETURNING id
      `,
      [item.title, item.content, item.thumbnail, item.shortDescription],
    );
    postId = inserted.rows[0].id;
  } else {
    await client.query(
      `
        UPDATE posts
        SET title = $1,
            content = $2,
            published = true,
            thumbnail = $3,
            short_description = $4,
            updated_at = now()
        WHERE id = $5
      `,
      [item.title, item.content, item.thumbnail, item.shortDescription, postId],
    );
  }

  const translationExists = await client.query(
    `SELECT id FROM post_translations WHERE post_id = $1 AND locale = 'vi'`,
    [postId],
  );

  if (translationExists.rowCount) {
    await client.query(
      `
        UPDATE post_translations
        SET title = $1,
            content = $2,
            slug = $3,
            short_description = $4,
            meta_title = $5,
            meta_description = $6,
            meta_keywords = $7,
            og_title = $8,
            og_description = $9,
            og_image = $10,
            canonical_url = $11,
            updated_at = now()
        WHERE post_id = $12 AND locale = 'vi'
      `,
      [
        item.title,
        item.content,
        item.slug,
        item.shortDescription,
        item.metaTitle,
        item.metaDescription,
        item.metaKeywords,
        item.metaTitle,
        item.metaDescription,
        item.thumbnail,
        `${siteUrl}/bai-viet/${item.slug}`,
        postId,
      ],
    );
  } else {
    await client.query(
      `
        INSERT INTO post_translations
        (title, content, locale, post_id, slug, short_description, meta_title, meta_description, meta_keywords, og_title, og_description, og_image, canonical_url)
        VALUES ($1,$2,'vi',$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      `,
      [
        item.title,
        item.content,
        postId,
        item.slug,
        item.shortDescription,
        item.metaTitle,
        item.metaDescription,
        item.metaKeywords,
        item.metaTitle,
        item.metaDescription,
        item.thumbnail,
        `${siteUrl}/bai-viet/${item.slug}`,
      ],
    );
  }

  await client.query(`DELETE FROM post_categories WHERE post_id = $1`, [postId]);
  await client.query(`INSERT INTO post_categories (post_id, category_id) VALUES ($1, $2)`, [postId, item.categoryId]);
}

async function main() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  });

  await client.connect();
  try {
    await client.query('BEGIN');

    await client.query(`SELECT setval('posts_id_seq', COALESCE((SELECT MAX(id) FROM posts), 1), true)`);
    await client.query(`SELECT setval('post_translations_id_seq', COALESCE((SELECT MAX(id) FROM post_translations), 1), true)`);
    await client.query(`SELECT setval('services_id_seq', COALESCE((SELECT MAX(id) FROM services), 1), true)`);
    await client.query(`SELECT setval('service_translations_id_seq', COALESCE((SELECT MAX(id) FROM service_translations), 1), true)`);
    await client.query(`SELECT setval('seo_id_seq', COALESCE((SELECT MAX(id) FROM seo), 1), true)`);

    await upsertSeo(client, {
      title: 'Xe nâng hàng mới, báo giá xe nâng dầu điện tại TPHCM | MGA',
      description:
        'MGA cung cấp xe nâng dầu, xe nâng điện, phụ tùng và giải pháp cho kho xưởng tại TPHCM. Xem nhanh nhóm 2.5-5 tấn, xe nâng giá tốt và tư vấn báo giá.',
      ogTitle: 'Xe nâng hàng mới, báo giá xe nâng dầu điện tại TPHCM | MGA',
      ogDescription:
        'Hub sản phẩm cho nhóm keyword xe nâng, bán xe nâng, xe nâng công nghiệp và báo giá theo tải trọng tại TPHCM.',
      ogImage: `${cdnUrl}/products/xe-nang-dau-mga-5-0-tan.jpg`,
      keywords: 'xe nâng, bán xe nâng, giá xe nâng, xe nâng công nghiệp, xe nâng hàng, xe nâng giá rẻ',
      canonicalUrl: `${siteUrl}/san-pham`,
    });

    await updateCategories(client);
    await updateProducts(client);

    for (const item of serviceDefinitions) {
      await upsertService(client, item);
    }

    for (const item of articleDefinitions) {
      await upsertPost(client, item);
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
