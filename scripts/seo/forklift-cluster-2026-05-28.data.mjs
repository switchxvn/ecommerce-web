const siteUrl = 'https://mgavietnam.com';
const cdnUrl = 'https://cdn.mgavietnam.com';
const articleCategoryId = 6;

function figure(src, alt) {
  return `
    <figure>
      <img src="${src}" alt="${alt}" loading="lazy" />
    </figure>
  `;
}

function link(href, text) {
  return `<a href="${href}">${text}</a>`;
}

function faq(items) {
  return `
    <h2>Câu hỏi thường gặp</h2>
    ${items
      .map(
        (item) => `
      <h3>${item.q}</h3>
      <p>${item.a}</p>
    `,
      )
      .join('')}
  `;
}

const productImageMap = {
  diesel25: `${cdnUrl}/products/xe-nang-dau-mga-2-5-tan.jpg`,
  diesel35: `${cdnUrl}/products/xe-nang-dau-mga-3-5-tan.jpg`,
  diesel50: `${cdnUrl}/products/xe-nang-dau-mga-5-0-tan.jpg`,
  diesel100: `${cdnUrl}/products/xe-nang-dau-mga-10-tan.jpg`,
  electric15: `${cdnUrl}/products/xe-nang-dien-mga-1-5-tan.jpg`,
  electric20: `${cdnUrl}/products/xe-nang-dien-mga-2-0-tan.jpg`,
  electric30: `${cdnUrl}/products/xe-nang-dien-mga-3-0-tan.jpg`,
  rideOn15: `${cdnUrl}/products/xe-nang-dien-ngoi-lai-mga-1-5-tan.jpg`,
};

const serviceImageMap = {
  broadRepairThumb: `${cdnUrl}/services/sua-xe-nang-thumb.png`,
  broadRepairInline1: `${cdnUrl}/services/sua-xe-nang-inline-1.png`,
  broadRepairInline2: `${cdnUrl}/services/sua-xe-nang-inline-2.png`,
  broadRepairInline3: `${cdnUrl}/services/sua-xe-nang-inline-3.png`,
  rentHubThumb: `${cdnUrl}/services/cho-thue-xe-nang-thumb.png`,
  rentHubInline1: `${cdnUrl}/services/cho-thue-xe-nang-inline-1.png`,
  rentHubInline2: `${cdnUrl}/services/cho-thue-xe-nang-inline-2.png`,
  rentHubInline3: `${cdnUrl}/services/cho-thue-xe-nang-inline-3.png`,
  usedThumb: `${cdnUrl}/services/xe-nang-hang-moi-thumb.png`,
  usedInline1: `${cdnUrl}/services/xe-nang-hang-moi-inline-1.png`,
  usedInline2: `${cdnUrl}/services/xe-nang-hang-moi-inline-2.png`,
  usedInline3: `${cdnUrl}/services/xe-nang-hang-moi-inline-3.png`,
};

const generatedPostImageMap = {
  salesThumb: `${cdnUrl}/services/ban-xe-nang-thumb.png`,
  salesInline1: `${cdnUrl}/services/ban-xe-nang-inline-1.png`,
  salesInline2: `${cdnUrl}/services/ban-xe-nang-inline-2.png`,
  salesInline3: `${cdnUrl}/services/ban-xe-nang-inline-3.png`,
  priceThumb: `${cdnUrl}/posts/gia-xe-nang-2026-theo-dong-va-tai-trong-thumb.png`,
  priceInline1: `${cdnUrl}/posts/gia-xe-nang-2026-theo-dong-va-tai-trong-inline-1.png`,
  priceInline2: `${cdnUrl}/posts/gia-xe-nang-2026-theo-dong-va-tai-trong-inline-2.png`,
  priceInline3: `${cdnUrl}/posts/gia-xe-nang-2026-theo-dong-va-tai-trong-inline-3.png`,
  guideThumb: `${cdnUrl}/posts/xe-nang-la-gi-cac-dong-xe-va-cach-chon-thumb.png`,
  guideInline1: `${cdnUrl}/posts/xe-nang-la-gi-cac-dong-xe-va-cach-chon-inline-1.png`,
  guideInline2: `${cdnUrl}/posts/xe-nang-la-gi-cac-dong-xe-va-cach-chon-inline-2.png`,
  guideInline3: `${cdnUrl}/posts/xe-nang-la-gi-cac-dong-xe-va-cach-chon-inline-3.png`,
};

export const requiredServiceSlugs = [
  'ban-xe-nang',
  'xe-nang-hang-moi',
  'cho-thue-xe-nang',
  'sua-xe-nang',
];

export const requiredArticleSlugs = [
  'gia-xe-nang-2026-theo-dong-va-tai-trong',
  'xe-nang-la-gi-cac-dong-xe-va-cach-chon',
];

export const categoryUpdates = [
  {
    slug: 'phu-tung-xe-nang',
    categoryId: 19,
    name: 'Phụ tùng xe nâng',
    metaTitle: 'Phụ tùng xe nâng dầu, điện và vật tư hao mòn | MGA',
    metaDescription:
      'Danh mục phụ tùng xe nâng cho xe dầu và xe điện, từ vật tư hao mòn, thủy lực đến điện điều khiển. Xem nhóm part nên chuẩn bị và khi nào cần gọi kỹ thuật.',
    metaKeywords:
      'phụ tùng xe nâng, phụ tùng xe nâng dầu, phụ tùng xe nâng điện, linh kiện xe nâng, vật tư xe nâng',
    ogTitle: 'Phụ tùng xe nâng dầu, điện và vật tư hao mòn | MGA',
    ogDescription:
      'Trang trụ cột cho nhu cầu phụ tùng xe nâng, kết nối giữa vật tư thay thế, sửa chữa và bảo dưỡng định kỳ.',
    canonicalUrl: `${siteUrl}/danh-muc-san-pham/phu-tung-xe-nang`,
    ogImage: productImageMap.diesel25,
    description: `
      <p><strong>Phụ tùng xe nâng</strong> không chỉ là danh sách linh kiện để mua khi xe đã nằm máy. Với doanh nghiệp đang chạy kho xưởng hằng ngày, đây là nhóm nội dung giúp chốt nhanh ba việc: nên chuẩn bị vật tư nào trước, dấu hiệu nào cho thấy part đang mòn nhanh, và khi nào nên dừng việc mua lẻ để chuyển sang kiểm tra kỹ thuật.</p>
      <p>Nếu chỉ nhìn theo tên part, người mua rất dễ rơi vào tình trạng thay đúng món nhưng sai nguyên nhân. Vì vậy trang này được viết theo logic vận hành thực tế, đi từ nhóm hao mòn nhanh đến nhóm thủy lực và điện điều khiển.</p>
      ${figure(serviceImageMap.broadRepairInline1, 'Kỹ thuật viên rà soát phụ tùng hao mòn trên xe nâng tại kho xưởng')}
      <h2>Nhóm phụ tùng xe nâng nào hay phải thay nhất?</h2>
      <p>Nhóm phải quay vòng nhanh nhất thường là lọc, dầu, phanh, bánh xe, ống dầu, phớt, seal và một số chi tiết làm việc liên tục trong cụm nâng hạ. Với xe chạy nhiều ca, những món này không chỉ là chi phí nhỏ lẻ mà còn quyết định việc xe có giữ được nhịp vận hành ổn định hay không.</p>
      <h2>Phụ tùng xe nâng dầu và xe nâng điện khác nhau ở đâu?</h2>
      <p>Xe dầu thường phát sinh nhiều hơn ở lọc, dầu, hệ thống làm mát, ống dầu, cụm thủy lực và các điểm hao mòn cơ khí. Xe điện ngoài nhóm bánh xe và phanh còn phải theo dõi thêm bình điện, bộ sạc, tiếp điểm, mô-tơ và hệ thống điều khiển. Nếu đang đi đúng nhánh xe điện, nên đối chiếu thêm với ${link(`${siteUrl}/dich-vu/sua-xe-nang-dien-tphcm`, 'dịch vụ sửa xe nâng điện tại TPHCM')} để tránh mua part theo cảm tính.</p>
      <h2>Khi nào nên chuẩn bị sẵn vật tư hao mòn?</h2>
      <p>Khi doanh nghiệp đã có lịch bảo dưỡng đều, biết rõ nhóm xe đang chạy theo ca nào và đã xác định được những hạng mục quay vòng nhanh, việc chuẩn bị tồn kho tối thiểu là hợp lý. Cách này phù hợp đặc biệt với các mẫu ${link(`${siteUrl}/san-pham/xe-nang-dau-mga-2-5-tan`, 'xe nâng dầu MGA 2.5 tấn')} hoặc ${link(`${siteUrl}/san-pham/xe-nang-dien-mga-2-0-tan`, 'xe nâng điện MGA 2.0 tấn')} đang làm việc gần như mỗi ngày.</p>
      ${figure(serviceImageMap.broadRepairInline2, 'Kiểm tra cụm nâng hạ, ống dầu và vật tư thủy lực trên xe nâng')}
      <h2>Khi nào không nên mua part trước mà nên gọi kỹ thuật?</h2>
      <p>Nếu xe bắt đầu hụt lực, rò dầu, nâng không đều, báo lỗi điện lặp lại hoặc thay vật tư cơ bản rồi mà triệu chứng không hết, việc mua part trước rất dễ sai hướng. Lúc đó nên đi từ ${link(`${siteUrl}/dich-vu/sua-xe-nang`, 'dịch vụ sửa xe nâng')} để khoanh đúng nguyên nhân rồi mới chốt part.</p>
      <h2>Những nhóm phụ tùng nào liên quan trực tiếp tới bảo dưỡng định kỳ?</h2>
      <p>Lọc, dầu, các chi tiết cao su, phanh, bánh xe, tiếp điểm và một số part trong cụm nâng hạ là nhóm bám sát nhất vào lịch bảo dưỡng. Nếu mục tiêu là giảm dừng máy đột xuất thay vì chỉ chờ xe lỗi mới làm, nên xem song song với ${link(`${siteUrl}/dich-vu/yeu-cau-bao-duong`, 'bảo dưỡng xe nâng định kỳ')} để chốt chu kỳ thay hợp lý hơn.</p>
      <h2>Nên bắt đầu từ linh kiện đơn lẻ hay theo cụm?</h2>
      <p>Với vật tư tiêu hao, có thể bắt đầu từ đơn lẻ. Nhưng khi vấn đề liên quan tới thủy lực, hệ thống nâng hoặc điện điều khiển, tiếp cận theo cụm sẽ an toàn hơn. Mua từng món rời đôi khi tạo cảm giác tiết kiệm, nhưng tổng chi phí sửa sai hướng lại cao hơn.</p>
      ${figure(serviceImageMap.broadRepairInline3, 'Phân loại phụ tùng xe nâng theo nhóm hao mòn, thủy lực và điện điều khiển')}
      ${faq([
        {
          q: 'Có nên giữ tồn kho nhiều phụ tùng xe nâng không?',
          a: 'Chỉ nên giữ nhóm quay vòng nhanh và đã có lịch sử thay rõ ràng. Các cụm lớn hoặc lỗi chưa rõ nguyên nhân vẫn nên kiểm tra trước khi mua.',
        },
        {
          q: 'Nếu xe đã thay part nhưng lỗi vẫn lặp lại thì sao?',
          a: 'Đó thường là dấu hiệu đang thay đúng món nhưng sai nguyên nhân. Khi đó nên chuyển sang hướng kiểm tra kỹ thuật thay vì tiếp tục mua lẻ.',
        },
        {
          q: 'Trang này phù hợp cho cả xe dầu và xe điện không?',
          a: 'Có. Đây là hub trụ cột, sau đó người đọc sẽ được dẫn sang nhánh sửa chữa, bảo dưỡng hoặc model phù hợp hơn.',
        },
      ])}
      <h2>Kết luận</h2>
      <p>Trang phụ tùng xe nâng hiệu quả nhất khi được dùng như một điểm chốt hướng: biết món nào nên chuẩn bị, món nào nên thay theo kỳ và món nào chỉ nên chốt sau khi đã kiểm tra xe. Với doanh nghiệp cần giữ nhịp kho xưởng ổn định, cách nhìn này thực dụng hơn nhiều so với mua part chỉ theo giá hoặc theo thói quen.</p>
    `,
  },
];

export const serviceDefinitions = [
  {
    slug: 'sua-xe-nang',
    title: 'Sửa xe nâng: chẩn đoán đúng lỗi, giảm dừng máy | MGA',
    shortDescription:
      'Dịch vụ sửa xe nâng cho xe dầu và xe điện theo hướng chẩn đoán đúng nguyên nhân, thay đúng hạng mục và giảm thời gian dừng máy cho kho xưởng.',
    metaTitle: 'Sửa xe nâng cho xe dầu và xe điện, chẩn đoán đúng lỗi | MGA',
    metaDescription:
      'MGA cung cấp dịch vụ sửa xe nâng cho lỗi thủy lực, nâng hạ, động cơ, hệ thống điện và hao mòn vận hành. Xem khi nào nên sửa, khi nào nên bảo dưỡng trước.',
    metaKeywords: 'sửa xe nâng, sửa chữa xe nâng, dịch vụ sửa xe nâng, sửa xe nâng dầu, sửa xe nâng điện',
    ogTitle: 'Sửa xe nâng cho xe dầu và xe điện, chẩn đoán đúng lỗi | MGA',
    ogDescription:
      'Trang dịch vụ broad cho nhu cầu sửa xe nâng, tách rõ lỗi thủy lực, động cơ, điện điều khiển và luồng xử lý tiếp theo.',
    canonicalUrl: `${siteUrl}/dich-vu/sua-xe-nang`,
    ogImage: serviceImageMap.broadRepairThumb,
    thumbnail: serviceImageMap.broadRepairThumb,
    icon: 'wrench',
    description: `
      <div class="service-content">
        <p>Khi tìm <strong>sửa xe nâng</strong>, điều người vận hành cần không phải là một lời hứa sửa nhanh bằng mọi giá, mà là một hướng xử lý đủ đúng để xe không quay lại lỗi cũ sau vài ngày chạy tiếp. Với kho xưởng đang hoạt động liên tục, chẩn đoán đúng nguyên nhân thường quan trọng hơn cả việc thay thật nhiều phụ tùng trong một lần.</p>
        <p>Trang này được tối ưu cho head-term broad, nên nội dung đi theo hướng giúp doanh nghiệp tự phân loại tình huống: xe đang lỗi ở đâu, mức độ gấp ra sao, và nên đi tiếp sang nhánh local, nhánh bảo dưỡng hay nhánh thay thế linh kiện.</p>
        ${figure(serviceImageMap.broadRepairInline1, 'Kỹ thuật viên kiểm tra tổng thể xe nâng trước khi đề xuất phương án sửa')}
        <h2>Khi nào nên gọi sửa xe nâng ngay?</h2>
        <p>Những dấu hiệu cần xử lý sớm nhất là xe hụt lực, nâng hạ không ổn định, rò dầu, khó nổ máy, nóng bất thường, báo lỗi điện điều khiển hoặc bình tụt nhanh. Nếu xe đang làm việc gần như mỗi ngày, kéo dài thêm vài ca thường làm phạm vi hỏng lan sang cụm khác.</p>
        <h2>Xe dầu và xe điện thường hỏng khác nhau như thế nào?</h2>
        <p>Xe dầu thường tập trung ở động cơ, nhiên liệu, làm mát, thủy lực và cụm nâng hạ. Xe điện hay phát sinh ở bình điện, bộ sạc, mô-tơ, contactor và điều khiển. Nếu lead đang ở nhu cầu xử lý tại chỗ trong khu vực TP.HCM, trang ${link(`${siteUrl}/dich-vu/sua-xe-nang-tphcm`, 'sửa xe nâng TPHCM')} sẽ phù hợp hơn để chốt hướng local nhanh.</p>
        <h2>Vì sao chẩn đoán đúng lỗi quan trọng hơn thay nhanh?</h2>
        <p>Nhiều xe bị thay đúng món nhưng sai nguyên nhân: thay phớt mà không xử lý áp thủy lực bất thường, thay bình mà không kiểm tra bộ sạc, hoặc thay xích nâng mà bỏ qua độ rơ toàn cụm mast. Càng đi sai hướng, tổng chi phí càng cao và xe càng dễ quay lại lỗi cũ.</p>
        ${figure(serviceImageMap.broadRepairInline2, 'Kiểm tra hệ thống nâng hạ và thủy lực trên xe nâng đang làm việc')}
        <h2>Khi nào nên sửa, khi nào nên chuyển sang bảo dưỡng?</h2>
        <p>Nếu xe đã có lỗi rõ, mất an toàn hoặc đang dừng máy thì sửa là ưu tiên. Nếu xe chưa dừng nhưng đã có dấu hiệu nóng máy, phanh yếu, rò dầu hoặc phản hồi chậm, ${link(`${siteUrl}/dich-vu/yeu-cau-bao-duong`, 'bảo dưỡng xe nâng định kỳ')} thường là đường đi kinh tế hơn trước khi lỗi lớn xuất hiện.</p>
        <h2>Khi nào nên chốt phụ tùng sau kiểm tra?</h2>
        <p>Nếu kỹ thuật đã khoanh đúng hạng mục hao mòn, doanh nghiệp có thể chốt nhanh theo ${link(`${siteUrl}/danh-muc-san-pham/phu-tung-xe-nang`, 'danh mục phụ tùng xe nâng')}. Cách đi này tránh tình trạng mua part trước rồi quay lại sửa tiếp vì triệu chứng không hết.</p>
        <h2>Khi nào nên cân nhắc đổi cấu hình thay vì sửa tiếp?</h2>
        <p>Nếu xe đã cũ, lỗi lặp lại dày, chi phí sửa nhiều đợt bắt đầu tiến gần giá trị vận hành mà xe tạo ra, lúc đó nên so lại với ${link(`${siteUrl}/danh-muc-san-pham/xe-nang-dau`, 'xe nâng dầu mới')} hoặc ${link(`${siteUrl}/danh-muc-san-pham/xe-nang-dien`, 'xe nâng điện mới')} thay vì tiếp tục xử lý từng đợt ngắn.</p>
        ${figure(serviceImageMap.broadRepairInline3, 'Đánh giá phụ tùng hao mòn sau khi chẩn đoán lỗi xe nâng')}
        ${faq([
          {
            q: 'Trang sửa xe nâng này có áp dụng cho cả xe dầu và xe điện không?',
            a: 'Có. Đây là landing broad cho cả hai nhóm, sau đó người đọc được dẫn sang nhánh local hoặc nhánh chuyên sâu hơn khi cần.',
          },
          {
            q: 'Nếu đang cần kỹ thuật hỗ trợ nhanh tại TP.HCM thì nên vào đâu?',
            a: `Nên đi tiếp sang ${link(`${siteUrl}/dich-vu/sua-xe-nang-tphcm`, 'sửa xe nâng TPHCM')} để chốt nhanh theo intent local.`,
          },
          {
            q: 'Có nên mua phụ tùng trước khi kiểm tra xe không?',
            a: 'Chỉ nên làm vậy với vật tư hao mòn rất rõ chu kỳ. Với lỗi chưa rõ nguyên nhân, kiểm tra trước sẽ tiết kiệm hơn.',
          },
        ])}
        <h2>Kết luận</h2>
        <p>Dịch vụ sửa xe nâng hiệu quả nhất khi bắt đầu từ chẩn đoán đúng và kết thúc ở quyết định đúng: sửa, bảo dưỡng, thay phụ tùng hay đổi cấu hình. Đó cũng là cách để tránh dừng máy kéo dài và kiểm soát chi phí vận hành tốt hơn.</p>
      </div>
    `,
  },
  {
    slug: 'ban-xe-nang',
    title: 'Bán xe nâng mới cho kho xưởng, bãi hàng và nhà máy | MGA',
    shortDescription:
      'Trang bán xe nâng tổng cho nhu cầu mua xe nâng mới, chia rõ theo môi trường, tải trọng và quyết định nên mua ngay hay nên thuê trước.',
    metaTitle: 'Bán xe nâng mới: chọn đúng xe dầu hay xe điện | MGA',
    metaDescription:
      'MGA bán xe nâng mới cho kho trong nhà, bãi ngoài trời và nhu cầu tải nặng. Xem cách chọn xe dầu, xe điện, dải 1.5-5 tấn và khi nào nên thuê trước khi mua.',
    metaKeywords: 'bán xe nâng, mua xe nâng, bán xe nâng mới, xe nâng dầu, xe nâng điện',
    ogTitle: 'Bán xe nâng mới: chọn đúng xe dầu hay xe điện | MGA',
    ogDescription:
      'Landing commercial cho nhu cầu bán xe nâng mới, gắn với tải trọng, môi trường và cường độ vận hành thực tế.',
    canonicalUrl: `${siteUrl}/dich-vu/ban-xe-nang`,
    ogImage: generatedPostImageMap.salesThumb,
    thumbnail: generatedPostImageMap.salesThumb,
    icon: 'shopping-cart',
    description: `
      <div class="service-content">
        <p><strong>Bán xe nâng</strong> không nên được hiểu đơn giản là đưa ra một danh sách model và báo giá. Với doanh nghiệp đang chuẩn bị đầu tư, quyết định đúng nằm ở việc chốt môi trường làm việc, tải trọng thật, nhịp vận hành và khả năng mở rộng trong 12-24 tháng tới, rồi mới đối chiếu sang đúng dòng xe.</p>
        <p>Trang này là điểm vào broad cho nhu cầu mua xe nâng mới trên phạm vi toàn quốc. Vai trò của nó là giúp người đọc tự tách rõ mình nên đi theo xe dầu, xe điện hay nên thuê thử trước khi khóa vốn vào một cấu hình chưa chắc đã bền với thực tế.</p>
        ${figure(generatedPostImageMap.salesInline1, 'Tư vấn bán xe nâng mới theo môi trường kho xưởng và tải trọng thực tế')}
        <h2>Bán xe nâng nên bắt đầu từ môi trường làm việc hay từ tải trọng?</h2>
        <p>Hai yếu tố này phải khóa gần như cùng lúc, nhưng môi trường thường là lớp lọc đầu tiên. Nếu kho chủ yếu làm trong nhà, yêu cầu sạch và lối đi hẹp, nhánh ${link(`${siteUrl}/danh-muc-san-pham/xe-nang-dien`, 'xe nâng điện')} thường phù hợp hơn. Nếu bãi hàng ngoài trời, tải nặng và chạy nhiều ca, ${link(`${siteUrl}/danh-muc-san-pham/xe-nang-dau`, 'xe nâng dầu')} là hướng thực dụng hơn.</p>
        <h2>Khi nào nên chọn xe dầu thay vì xe điện?</h2>
        <p>Xe dầu phù hợp khi nền làm việc rộng, ngoài trời, tải nặng hoặc công việc cần chạy nhiều ca mà không muốn phụ thuộc vào hạ tầng sạc. Những mốc tải phổ biến như ${link(`${siteUrl}/san-pham/xe-nang-dau-mga-2-5-tan`, 'xe nâng dầu 2.5 tấn MGA')} và ${link(`${siteUrl}/san-pham/xe-nang-dau-mga-5-0-tan`, 'xe nâng dầu 5.0 tấn MGA')} thường là hai điểm bắt đầu dễ đối chiếu nhất.</p>
        <h2>Khi nào xe điện là bài toán đầu tư hợp hơn?</h2>
        <p>Nếu doanh nghiệp cần vận hành êm, giảm khí thải trong kho kín hoặc đang tối ưu diện tích với lối đi hẹp, xe điện sẽ hợp hơn. Các dòng ${link(`${siteUrl}/san-pham/xe-nang-dien-mga-1-5-tan`, 'xe nâng điện 1.5 tấn MGA')}, ${link(`${siteUrl}/san-pham/xe-nang-dien-mga-2-0-tan`, 'xe nâng điện 2.0 tấn MGA')} và ${link(`${siteUrl}/san-pham/xe-nang-dien-ngoi-lai-mga-1-5-tan`, 'xe nâng điện ngồi lái')} thường giúp người mua chốt nhanh theo mặt bằng kho.</p>
        ${figure(generatedPostImageMap.salesInline2, 'So sánh xe nâng dầu và xe nâng điện trước khi chốt phương án mua mới')}
        <h2>Nên khóa 1.5 tấn, 2.5 tấn hay 5 tấn theo cách nào?</h2>
        <p>Đừng nhìn tải danh nghĩa theo kiểu “vừa đủ”. Hãy xác định tải nặng nhất xuất hiện thường xuyên, biên tải an toàn, chiều cao nâng và tần suất làm việc. Nếu hàng đang ở vùng lưng chừng, chênh một bậc tải có thể giúp giảm rất nhiều áp lực vận hành về sau.</p>
        <h2>Khi nào nên thuê trước rồi mới mua?</h2>
        <p>Nếu doanh nghiệp chưa chắc về mặt bằng kho, chưa có dữ liệu đủ tốt về tải hàng hoặc đang muốn test kiểu xe trước khi chốt đầu tư, đi qua ${link(`${siteUrl}/dich-vu/cho-thue-xe-nang`, 'cho thuê xe nâng')} trước thường là lựa chọn thông minh hơn là mua ngay theo cảm tính.</p>
        <h2>Vì sao bán xe nâng không nên tách rời bài toán hậu mãi?</h2>
        <p>Một cấu hình phù hợp nhưng không có đường bảo dưỡng, sửa chữa hay phụ tùng đi kèm vẫn có thể trở thành quyết định đắt. Đây là lý do landing này luôn dẫn tiếp sang ${link(`${siteUrl}/dich-vu/sua-xe-nang`, 'sửa xe nâng')} và ${link(`${siteUrl}/danh-muc-san-pham/phu-tung-xe-nang`, 'phụ tùng xe nâng')} như hai nhánh hỗ trợ dài hạn.</p>
        ${figure(generatedPostImageMap.salesInline3, 'Mua xe nâng mới theo tải trọng và kế hoạch vận hành dài hạn')}
        ${faq([
          {
            q: 'Nếu chưa rõ nên mua xe dầu hay điện thì bắt đầu từ đâu?',
            a: 'Hãy chốt trước môi trường làm việc, tải nặng nhất và cường độ chạy xe. Chỉ ba điểm này đã giúp tách hướng rất nhanh.',
          },
          {
            q: 'Có nên hỏi giá trước khi khóa tải trọng không?',
            a: 'Không nên. Cùng một dải tải nhưng khác chiều cao nâng, bộ công tác và điều kiện vận hành, chênh lệch báo giá có thể khá lớn.',
          },
          {
            q: 'Khi nào nên thuê trước rồi mới quay lại mua?',
            a: `Khi nhu cầu còn mới, còn thay đổi hoặc cần test mặt bằng thật. Khi đó hãy đi từ ${link(`${siteUrl}/dich-vu/cho-thue-xe-nang`, 'trang cho thuê xe nâng')} trước.`,
          },
        ])}
        <h2>Kết luận</h2>
        <p>Trang bán xe nâng hiệu quả nhất khi giúp người mua tránh được hai lỗi phổ biến: mua quá dư cấu hình và mua quá sát nhu cầu. Khóa đúng môi trường, tải trọng và nhịp vận hành trước khi hỏi giá sẽ giúp quyết định đầu tư bền hơn rất nhiều.</p>
      </div>
    `,
  },
  {
    slug: 'xe-nang-hang-moi',
    title: 'Xe nâng hàng mới: khi nào nên đầu tư thay vì đi xe cũ? | MGA',
    shortDescription:
      'Landing tư vấn cho nhu cầu xe nâng hàng mới, tập trung vào bài toán đầu tư, rủi ro sau mua và khi nào xe mới hợp hơn xe cũ thanh lý.',
    metaTitle: 'Xe nâng hàng mới: chọn đúng bài toán đầu tư | MGA',
    metaDescription:
      'Tư vấn xe nâng hàng mới theo tải trọng, môi trường và cường độ vận hành. Xem khi nào xe mới hợp hơn xe cũ thanh lý và khi nào nên thuê thử trước.',
    metaKeywords: 'xe nâng hàng mới, mua xe nâng mới, xe nâng mới, xe nâng hàng',
    ogTitle: 'Xe nâng hàng mới: chọn đúng bài toán đầu tư | MGA',
    ogDescription:
      'Landing commercial cho nhu cầu xe nâng hàng mới, đặt cạnh rủi ro xe cũ và hướng đầu tư thực dụng hơn.',
    canonicalUrl: `${siteUrl}/dich-vu/xe-nang-hang-moi`,
    ogImage: serviceImageMap.usedThumb,
    thumbnail: serviceImageMap.usedThumb,
    icon: 'truck',
    description: `
      <div class="service-content">
        <p>Khi tìm <strong>xe nâng hàng mới</strong>, phần lớn doanh nghiệp không chỉ muốn mua một chiếc xe “mới 100%”. Thứ họ thực sự đang tìm là một phương án đầu tư ổn định hơn: ít rủi ro dừng máy hơn, chủ động phụ tùng hơn và dễ kiểm soát chi phí vận hành trong giai đoạn đầu khai thác.</p>
        <p>Landing này không đi theo kiểu listing sản phẩm. Nó được dựng để giúp người mua trả lời một câu hỏi rõ ràng hơn: với bài toán của mình, đầu tư xe nâng hàng mới có thật sự hợp hơn xe cũ hay chưa?</p>
        ${figure(serviceImageMap.usedInline1, 'Xe nâng hàng mới được đối chiếu với bài toán đầu tư thực tế của doanh nghiệp')}
        <h2>Xe nâng hàng mới phù hợp nhất với kiểu doanh nghiệp nào?</h2>
        <p>Nhóm phù hợp nhất là doanh nghiệp cần độ ổn định cao, vận hành nhiều ca, có tiến độ bốc dỡ phụ thuộc mạnh vào xe và không muốn dành quá nhiều thời gian cho các đợt sửa lặp lại sau mua. Trong bối cảnh đó, xe mới giúp giảm rủi ro hơn hẳn so với việc tối ưu vốn đầu vào bằng xe cũ.</p>
        <h2>Khi nào xe mới hợp hơn xe cũ thanh lý?</h2>
        <p>Nếu cường độ làm việc cao, hàng hóa nặng, hoặc chỉ một lần dừng máy cũng ảnh hưởng tới tiến độ kho xưởng, xe mới gần như luôn là lựa chọn an toàn hơn. Còn nếu ngân sách rất nhạy và nhu cầu chưa dày, người đọc nên đối chiếu lại với ${link(`${siteUrl}/dich-vu/xe-nang-cu-thanh-ly-tphcm`, 'xe nâng cũ thanh lý tại TPHCM')} để cân nhắc phần đánh đổi.</p>
        <h2>Nên chọn xe mới theo môi trường làm việc ra sao?</h2>
        <p>Nếu làm ngoài trời, chạy nhiều ca và ưu tiên tải nặng, hãy đi sang nhánh ${link(`${siteUrl}/danh-muc-san-pham/xe-nang-dau`, 'xe nâng dầu')}. Nếu kho kín, yêu cầu sạch hơn và lối đi hẹp, nên đi sang ${link(`${siteUrl}/danh-muc-san-pham/xe-nang-dien`, 'xe nâng điện')}. Xe mới chỉ thật sự “đúng” khi đúng cả môi trường lẫn tải trọng.</p>
        ${figure(serviceImageMap.usedInline2, 'So sánh xe nâng hàng mới với xe cũ theo rủi ro vận hành và bảo trì')}
        <h2>Xe nâng hàng mới có giúp giảm tổng chi phí dài hạn không?</h2>
        <p>Trong nhiều trường hợp có. Giá vào cửa cao hơn xe cũ, nhưng bù lại doanh nghiệp giảm được các đợt sửa bất ngờ, giảm rủi ro thiếu phụ tùng và giảm thời gian dừng máy. Nếu tiến độ sản xuất phụ thuộc vào xe, khoản chênh đầu tư ban đầu thường dễ được hấp thụ hơn người mua nghĩ.</p>
        <h2>Khi nào nên thuê trước rồi mới chốt xe mới?</h2>
        <p>Nếu mặt bằng kho còn mới, dữ liệu tải chưa đủ rõ hoặc đội vận hành vẫn đang thử quy trình, nên đi qua ${link(`${siteUrl}/dich-vu/cho-thue-xe-nang`, 'cho thuê xe nâng')} trước khi mua. Đây là cách tránh khóa vốn sớm vào một cấu hình chưa chắc đã bền với thực tế.</p>
        <h2>Nên nối từ landing này sang đâu để chốt quyết định?</h2>
        <p>Nếu đã nghiêng về mua mới, người đọc nên đi tiếp sang ${link(`${siteUrl}/dich-vu/ban-xe-nang`, 'trang bán xe nâng')} để chốt nhanh theo tải trọng và kiểu xe. Nếu vẫn còn phân vân giữa mới và cũ, bài ${link(`${siteUrl}/bai-viet/xe-nang-hang-moi-hay-cu-nen-chon-gi`, 'xe nâng hàng mới hay cũ nên chọn gì')} sẽ giúp khóa quyết định tốt hơn.</p>
        ${figure(serviceImageMap.usedInline3, 'Xe nâng hàng mới cho bài toán vận hành ổn định và ít rủi ro hơn xe cũ')}
        ${faq([
          {
            q: 'Xe nâng hàng mới có phù hợp với doanh nghiệp ngân sách nhạy không?',
            a: 'Có thể phù hợp nếu doanh nghiệp nhìn theo tổng chi phí dài hạn thay vì chỉ giá đầu vào. Điều này đặc biệt đúng với đội xe phải chạy đều và ít được phép dừng máy.',
          },
          {
            q: 'Khi nào vẫn nên nghiêng về xe cũ?',
            a: 'Khi tần suất sử dụng chưa cao, vốn đầu tư ban đầu bị giới hạn rõ và doanh nghiệp chấp nhận được mức kiểm tra, bảo dưỡng chặt hơn sau mua.',
          },
          {
            q: 'Nếu vẫn chưa chắc nên mua mới hay thuê trước thì sao?',
            a: `Nên đi qua ${link(`${siteUrl}/dich-vu/cho-thue-xe-nang`, 'trang cho thuê xe nâng')} để kiểm chứng mặt bằng và nhu cầu trước khi khóa vốn.`,
          },
        ])}
        <h2>Kết luận</h2>
        <p>Xe nâng hàng mới không phải lúc nào cũng là phương án rẻ nhất ở điểm bắt đầu, nhưng thường là phương án an toàn hơn khi doanh nghiệp cần độ ổn định dài hạn. Chọn mới hay không nên dựa trên nhịp vận hành thật, không nên chỉ dựa trên cảm giác “giá vào cửa cao hơn”.</p>
      </div>
    `,
  },
  {
    slug: 'cho-thue-xe-nang',
    title: 'Cho thuê xe nâng: chọn đúng xe trước khi tính giá thuê | MGA',
    shortDescription:
      'Landing toàn quốc cho nhu cầu cho thuê xe nâng, tách rõ khi nào nên thuê ngắn hạn, khi nào nên thuê theo dự án và khi nào nên chuyển từ thuê sang mua.',
    metaTitle: 'Cho thuê xe nâng theo tải trọng và môi trường làm việc | MGA',
    metaDescription:
      'MGA cho thuê xe nâng theo nhu cầu ngắn hạn, theo dự án hoặc để test cấu hình trước khi mua. Xem cách tách nhanh xe dầu, xe điện và dải tải phù hợp.',
    metaKeywords: 'cho thuê xe nâng, thuê xe nâng, thuê xe nâng dầu, thuê xe nâng điện',
    ogTitle: 'Cho thuê xe nâng theo tải trọng và môi trường làm việc | MGA',
    ogDescription:
      'Landing broad cho nhu cầu cho thuê xe nâng, nối sang nhánh xe dầu, xe điện và nhánh local TP.HCM khi cần xử lý nhanh.',
    canonicalUrl: `${siteUrl}/dich-vu/cho-thue-xe-nang`,
    ogImage: serviceImageMap.rentHubThumb,
    thumbnail: serviceImageMap.rentHubThumb,
    icon: 'truck',
    description: `
      <div class="service-content">
        <p>Khi tìm <strong>cho thuê xe nâng</strong>, phần lớn người dùng đang có một nhu cầu rất thực dụng: cần xe nhanh, cần đúng tải và chưa chắc bài toán của mình đủ ổn định để mua ngay. Vấn đề là nhiều quyết định thuê đi sai ngay từ bước đầu vì hỏi giá trước khi khóa loại xe, môi trường và thời gian dùng xe.</p>
        <p>Landing này đóng vai trò hub toàn quốc cho keyword broad. Nó giúp người đọc tự tách nhanh bài toán thành ba nhánh: xe dầu hay xe điện, thuê ngắn hạn hay theo dự án, và khi nào nên xem việc thuê như bước đệm trước khi đầu tư mua mới.</p>
        ${figure(serviceImageMap.rentHubInline1, 'Cho thuê xe nâng cho kho xưởng, nhà máy và cao điểm xuất nhập hàng')}
        <h2>Khi nào nên thuê xe nâng thay vì mua ngay?</h2>
        <p>Thuê hợp lý khi nhu cầu phát sinh theo mùa, theo dự án, khi xe chính đang sửa hoặc khi doanh nghiệp muốn test cấu hình thật trước khi chốt mua. Đây cũng là lựa chọn đáng cân nhắc khi dữ liệu tải hàng và mặt bằng kho chưa đủ rõ để mua chuẩn ngay lần đầu.</p>
        <h2>Cho thuê xe nâng nên tách xe dầu và xe điện như thế nào?</h2>
        <p>Nếu bài toán nghiêng về ngoài trời, tải nặng và chạy nhiều ca, hãy đi tiếp sang ${link(`${siteUrl}/dich-vu/cho-thue-xe-nang-dau`, 'cho thuê xe nâng dầu')}. Nếu kho kín, xưởng sạch, yêu cầu vận hành êm hoặc lối đi hẹp, hướng hợp hơn là ${link(`${siteUrl}/dich-vu/cho-thue-xe-nang-dien`, 'cho thuê xe nâng điện')}.</p>
        <h2>Những dải tải nào được hỏi nhiều nhất?</h2>
        <p>Ở nhu cầu phổ biến, 1.5-2 tấn thường rơi vào kho trong nhà; 2.5-3.5 tấn là vùng rất hay gặp ở kho xưởng thông thường; còn 5 tấn trở lên cần xem kỹ hơn về mặt nền, loại hàng và cường độ làm việc. Nếu đã nghiêng về mua mới sau giai đoạn thuê thử, nên đối chiếu thêm ${link(`${siteUrl}/dich-vu/ban-xe-nang`, 'trang bán xe nâng')}.</p>
        ${figure(serviceImageMap.rentHubInline2, 'So sánh xe nâng dầu và xe nâng điện trong cùng nhu cầu thuê ngắn hạn')}
        <h2>Cho thuê xe nâng theo dự án khác gì thuê ngắn hạn xử lý cao điểm?</h2>
        <p>Thuê theo dự án thường cần nhìn rõ lịch bàn giao, quãng thời gian ổn định và mức tải lặp lại. Trong khi đó, thuê xử lý cao điểm lại ưu tiên tốc độ phản ứng và độ sẵn sàng xe. Hai nhánh này có logic chọn xe gần giống nhau nhưng khác ở mức độ linh hoạt cần có.</p>
        <h2>Khi nào nên chuyển từ thuê sang mua?</h2>
        <p>Nếu nhu cầu bắt đầu ổn định nhiều tháng, thông số xe ít thay đổi và tần suất làm việc cao, tổng chi phí thuê có thể không còn tối ưu. Khi đó hãy quay sang các nhánh ${link(`${siteUrl}/danh-muc-san-pham/xe-nang-dau`, 'xe nâng dầu mới')} hoặc ${link(`${siteUrl}/danh-muc-san-pham/xe-nang-dien`, 'xe nâng điện mới')} để so lại tổng chi phí sở hữu dài hạn.</p>
        <h2>Khi nào nên đi sang trang local thay vì ở lại trang broad?</h2>
        <p>Nếu nhu cầu đã rõ là cần xử lý nhanh trong khu vực TP.HCM, người đọc nên đi tiếp sang ${link(`${siteUrl}/dich-vu/cho-thue-xe-nang-tphcm`, 'cho thuê xe nâng TPHCM')}. Trang local giữ vai trò satellite để chốt lead theo địa phương, còn trang broad này giữ nhiệm vụ bắt head-term không gắn vùng địa lý.</p>
        ${figure(serviceImageMap.rentHubInline3, 'Thuê xe nâng như bước đệm trước khi mua cấu hình phù hợp hơn')}
        ${faq([
          {
            q: 'Có nên hỏi giá thuê trước khi khóa loại xe không?',
            a: 'Không nên. Giá chỉ hữu ích khi đã biết tương đối rõ tải trọng, môi trường và thời gian sử dụng.',
          },
          {
            q: 'Nếu chưa biết nên thuê xe dầu hay xe điện thì sao?',
            a: 'Hãy khóa trước môi trường làm việc. Chỉ cần biết trong nhà hay ngoài trời, hướng lựa chọn đã rõ hơn rất nhiều.',
          },
          {
            q: 'Nếu cần thuê nhanh tại TP.HCM thì nên vào đâu?',
            a: `Nên đi sang ${link(`${siteUrl}/dich-vu/cho-thue-xe-nang-tphcm`, 'trang cho thuê xe nâng TPHCM')} để khớp đúng intent local.`,
          },
        ])}
        <h2>Kết luận</h2>
        <p>Cho thuê xe nâng chỉ thật sự tiết kiệm khi doanh nghiệp thuê đúng xe ngay từ đầu. Càng khóa rõ tải trọng, môi trường và thời gian sử dụng, quyết định thuê càng sát nhu cầu và càng dễ chuyển mượt sang quyết định mua khi đã đến lúc.</p>
      </div>
    `,
  },
];

export const articleDefinitions = [
  {
    slug: 'gia-xe-nang-2026-theo-dong-va-tai-trong',
    title: 'Giá xe nâng 2026 theo dòng và tải trọng: nên nhìn như thế nào?',
    shortDescription:
      'Bài pillar cho keyword giá xe nâng, giúp doanh nghiệp nhìn đúng các yếu tố làm lệch giá và biết khi nào nên mua mới, khi nào nên thuê trước.',
    metaTitle: 'Giá xe nâng 2026 theo dòng và tải trọng | MGA',
    metaDescription:
      'Tham khảo giá xe nâng dầu, giá xe nâng điện và các yếu tố làm lệch báo giá theo tải trọng, chiều cao nâng, môi trường làm việc và hậu mãi.',
    metaKeywords: 'giá xe nâng, giá xe nâng dầu, giá xe nâng điện, xe nâng 2.5 tấn, xe nâng 5 tấn',
    ogTitle: 'Giá xe nâng 2026 theo dòng và tải trọng | MGA',
    ogDescription:
      'Bài trụ cột giúp hỏi giá xe nâng đúng cách, tránh neo vào một con số mà bỏ qua cấu hình thực tế.',
    canonicalUrl: `${siteUrl}/bai-viet/gia-xe-nang-2026-theo-dong-va-tai-trong`,
    thumbnail: generatedPostImageMap.priceThumb,
    ogImage: generatedPostImageMap.priceThumb,
    categoryId: articleCategoryId,
    content: `
      <p>Khi hỏi <strong>giá xe nâng</strong>, điều nhiều doanh nghiệp muốn nhất là một con số để chốt ngân sách nhanh. Nhưng cùng là xe nâng, mức giá có thể lệch đáng kể chỉ vì khác môi trường làm việc, chiều cao nâng, bộ công tác, loại động lực hoặc chất lượng hậu mãi đi kèm. Vì vậy, nhìn giá xe nâng như một “mức cố định” thường là cách dễ dẫn tới quyết định sai nhất.</p>
      <p>Bài viết này đóng vai trò pillar cho cluster giá, nên mục tiêu không phải liệt kê một bảng giá đóng. Mục tiêu là giúp người đọc biết cách hỏi giá sao cho sát nhu cầu, biết mình nên so ở điểm nào và biết khi nào nên chuyển từ hỏi giá sang chốt cấu hình.</p>
      ${figure(generatedPostImageMap.priceInline1, 'Giá xe nâng cần được nhìn theo tải trọng và môi trường làm việc thực tế')}
      <h2>Giá xe nâng bị chi phối bởi những yếu tố nào?</h2>
      <p>Ba nhóm tác động mạnh nhất là tải trọng, chiều cao nâng và môi trường làm việc. Sau đó mới đến bộ công tác đi kèm, loại lốp, điều kiện bàn giao và mức hỗ trợ sau bán. Đây là lý do giá giữa một xe nâng 2.5 tấn dùng phổ thông và một xe 5 tấn cho bãi vật liệu không thể so bằng một con số “giá tốt” đơn lẻ.</p>
      <h2>Giá xe nâng dầu và giá xe nâng điện khác nhau theo logic nào?</h2>
      <p>Với ${link(`${siteUrl}/danh-muc-san-pham/xe-nang-dau`, 'xe nâng dầu')}, người mua thường nhìn nhiều vào tải nặng, môi trường ngoài trời và cường độ chạy xe. Với ${link(`${siteUrl}/danh-muc-san-pham/xe-nang-dien`, 'xe nâng điện')}, bài toán lại nghiêng hơn về kho trong nhà, độ sạch, độ êm và mức phù hợp của kiểu xe với mặt bằng kho.</p>
      <h2>Vì sao xe nâng 2.5 tấn và xe nâng 5 tấn không nên được hỏi giá cùng một kiểu?</h2>
      <p>Xe nâng 2.5 tấn thường là dải rất phổ biến, nhưng khi lên ${link(`${siteUrl}/san-pham/xe-nang-dau-mga-5-0-tan`, 'xe nâng dầu 5.0 tấn MGA')}, người mua đã bước sang một lớp nhu cầu khác: hàng nặng hơn, yêu cầu nền bãi khác hơn và chi phí cấu hình cũng rộng hơn. Vì vậy, cùng là “hỏi giá xe nâng”, cách hỏi đúng của hai dải tải này không giống nhau.</p>
      ${figure(generatedPostImageMap.priceInline2, 'Giá xe nâng điện và giá xe nâng dầu cần được so theo môi trường và kiểu vận hành')}
      <h2>Khi nào giá xe nâng điện có vẻ cao nhưng vẫn hợp lý hơn?</h2>
      <p>Nếu kho làm trong nhà, chạy lặp tuyến ngắn, cần vận hành êm và ít khí thải, xe điện có thể là lựa chọn hợp lý hơn dù giá đầu tư đầu vào nhìn qua có vẻ cao hơn. Khi đó, nên đối chiếu các dải như ${link(`${siteUrl}/san-pham/xe-nang-dien-mga-1-5-tan`, 'xe nâng điện 1.5 tấn MGA')} và ${link(`${siteUrl}/san-pham/xe-nang-dien-mga-2-0-tan`, 'xe nâng điện 2.0 tấn MGA')} thay vì so chung với xe dầu theo một khung giá.</p>
      <h2>Khi nào nên hỏi giá theo cấu hình, không nên hỏi giá “xe nâng chung chung”?</h2>
      <p>Nếu doanh nghiệp đã chốt được tải trọng, môi trường, chiều cao nâng và quãng đường di chuyển, thì đã đến lúc chuyển sang hỏi theo cấu hình. Càng hỏi cụ thể, báo giá càng có giá trị. Hỏi chung chung chỉ tạo ra một con số để tham khảo, nhưng khó dùng để ra quyết định thật.</p>
      <h2>Khi nào nên thuê trước thay vì cố chốt giá mua ngay?</h2>
      <p>Nếu kho còn mới, nhu cầu chưa ổn định hoặc doanh nghiệp muốn test kiểu xe trước khi đầu tư dài hạn, nên đi từ ${link(`${siteUrl}/dich-vu/cho-thue-xe-nang`, 'cho thuê xe nâng')} trước. Cách này giúp tránh chốt mua chỉ vì một mức giá nghe có vẻ hợp lý ở thời điểm đầu.</p>
      ${figure(generatedPostImageMap.priceInline3, 'Hỏi giá xe nâng đúng cách bắt đầu từ dữ liệu tải và nhu cầu thật của kho xưởng')}
      <h2>Nên đi tiếp từ bài giá này sang đâu để chốt nhanh hơn?</h2>
      <p>Nếu đã rõ đang nghiêng về mua mới, hãy đi tiếp sang ${link(`${siteUrl}/dich-vu/ban-xe-nang`, 'trang bán xe nâng')} để tách hướng dầu hay điện. Nếu còn chưa chắc cần dòng nào, bài ${link(`${siteUrl}/bai-viet/xe-nang-la-gi-cac-dong-xe-va-cach-chon`, 'xe nâng là gì, các dòng xe và cách chọn')} sẽ giúp khóa logic lựa chọn trước khi quay lại chuyện báo giá.</p>
      ${faq([
        {
          q: 'Có nên hỏi giá xe nâng trước khi khóa tải trọng không?',
          a: 'Không nên. Khi chưa khóa tải và môi trường, con số nhận được chỉ có giá trị tham khảo rất hạn chế.',
        },
        {
          q: 'Giá xe nâng điện có luôn cao hơn xe dầu không?',
          a: 'Không thể kết luận theo cách đó. Mỗi loại phù hợp một bài toán khác nhau, và tổng chi phí hiệu quả còn phụ thuộc môi trường vận hành.',
        },
        {
          q: 'Nếu chưa chắc mua mới hay thuê trước thì sao?',
          a: `Hãy so thêm với ${link(`${siteUrl}/dich-vu/cho-thue-xe-nang`, 'trang cho thuê xe nâng')} trước khi khóa vốn vào một cấu hình.`,
        },
      ])}
      <h2>Kết luận</h2>
      <p>Giá xe nâng chỉ thật sự hữu ích khi nó gắn với đúng nhu cầu vận hành. Hỏi giá đúng cách không giúp rẻ hơn ngay lập tức, nhưng giúp tránh quyết định đắt hơn về sau do mua sai dòng, sai tải hoặc sai môi trường.</p>
    `,
  },
  {
    slug: 'xe-nang-la-gi-cac-dong-xe-va-cach-chon',
    title: 'Xe nâng là gì? Các dòng xe và cách chọn đúng theo nhu cầu',
    shortDescription:
      'Bài pillar trung tâm cho keyword xe nâng, giải thích các dòng xe, khác biệt xe dầu - xe điện và cách chọn theo mặt bằng, tải trọng, ngân sách.',
    metaTitle: 'Xe nâng là gì? Các dòng xe và cách chọn đúng | MGA',
    metaDescription:
      'Tìm hiểu xe nâng là gì, các dòng xe nâng dầu - điện - đứng lái - ngồi lái và cách chọn theo môi trường làm việc, tải trọng và ngân sách đầu tư.',
    metaKeywords: 'xe nâng, xe nâng dầu, xe nâng điện, xe nâng hàng, chọn xe nâng',
    ogTitle: 'Xe nâng là gì? Các dòng xe và cách chọn đúng | MGA',
    ogDescription:
      'Bài pillar giải thích các dòng xe nâng và dẫn người đọc sang đúng hub mua, thuê, sửa hoặc danh mục sản phẩm phù hợp hơn.',
    canonicalUrl: `${siteUrl}/bai-viet/xe-nang-la-gi-cac-dong-xe-va-cach-chon`,
    thumbnail: generatedPostImageMap.guideThumb,
    ogImage: generatedPostImageMap.guideThumb,
    categoryId: articleCategoryId,
    content: `
      <p>Từ khóa <strong>xe nâng</strong> có intent khá rộng: có người chỉ mới tìm hiểu xe nâng là gì, có người đang so dầu với điện, có người lại chuẩn bị hỏi giá hoặc thuê xe ngay. Vì vậy một bài pillar tốt cho từ khóa này không nên cố chốt bán quá sớm, mà cần giúp người đọc tự xác định mình đang ở đúng nhánh nhu cầu nào.</p>
      <p>Bài viết dưới đây đi theo hướng đó. Thay vì nói chung chung về “xe nâng”, nó tách từng lớp quyết định quan trọng: dùng trong nhà hay ngoài trời, tải nặng hay tải phổ thông, nên mua ngay hay nên thuê thử trước, và khi nào cần nghĩ tới hậu mãi, sửa chữa hay phụ tùng.</p>
      ${figure(generatedPostImageMap.guideInline1, 'Xe nâng là gì và nên chọn theo môi trường làm việc nào')}
      <h2>Xe nâng là gì và thường được dùng để giải quyết việc gì?</h2>
      <p>Xe nâng là thiết bị nâng hạ và di chuyển hàng hóa, pallet hoặc kiện hàng trong kho, nhà máy, bãi vật liệu và khu logistics. Điểm quan trọng không nằm ở định nghĩa, mà ở chỗ mỗi loại xe nâng chỉ phù hợp với một số môi trường và nhịp làm việc nhất định.</p>
      <h2>Các dòng xe nâng phổ biến hiện nay gồm những gì?</h2>
      <p>Ở nhu cầu phổ biến nhất, có thể chia thành ba nhánh dễ hiểu: ${link(`${siteUrl}/danh-muc-san-pham/xe-nang-dau`, 'xe nâng dầu')} cho ngoài trời và tải nặng; ${link(`${siteUrl}/danh-muc-san-pham/xe-nang-dien`, 'xe nâng điện')} cho kho trong nhà; và các biến thể như đứng lái, ngồi lái, stacker hoặc xe tay thấp để khớp với lối đi và cường độ làm việc cụ thể hơn.</p>
      <h2>Khi nào nên chọn xe nâng dầu?</h2>
      <p>Xe nâng dầu thường phù hợp với bãi hàng, nền làm việc rộng, hàng nặng hoặc nhu cầu chạy nhiều ca. Những mốc như ${link(`${siteUrl}/san-pham/xe-nang-dau-mga-2-5-tan`, 'xe nâng dầu 2.5 tấn')}, ${link(`${siteUrl}/san-pham/xe-nang-dau-mga-3-5-tan`, 'xe nâng dầu 3.5 tấn')} và ${link(`${siteUrl}/san-pham/xe-nang-dau-mga-5-0-tan`, 'xe nâng dầu 5 tấn')} thường là dải dễ bắt đầu so nhất.</p>
      ${figure(generatedPostImageMap.guideInline2, 'Xe nâng điện cho kho trong nhà và xe nâng dầu cho ngoài trời có logic chọn khác nhau')}
      <h2>Khi nào xe nâng điện hợp hơn?</h2>
      <p>Nếu kho kín, yêu cầu sạch, ít tiếng ồn hoặc lối đi hẹp, xe điện là hướng nên ưu tiên hơn. Tùy mặt bằng, người đọc có thể đi tiếp sang ${link(`${siteUrl}/san-pham/xe-nang-dien-mga-2-0-tan`, 'xe nâng điện 2.0 tấn MGA')}, ${link(`${siteUrl}/san-pham/xe-nang-dien-mga-3-0-tan`, 'xe nâng điện 3.0 tấn MGA')} hoặc ${link(`${siteUrl}/san-pham/xe-nang-dien-ngoi-lai-mga-1-5-tan`, 'xe nâng điện ngồi lái')} để đối chiếu sâu hơn.</p>
      <h2>Nên chọn theo tải trọng hay theo mặt bằng kho trước?</h2>
      <p>Hai yếu tố này phải đi cùng nhau. Chọn đúng tải nhưng xe quá cồng kềnh cho lối đi hẹp cũng là chọn sai. Ngược lại, chọn đúng kiểu xe nhưng tải quá sát ngưỡng sẽ làm xe luôn làm việc căng tải. Cách chọn xe nâng đúng luôn bắt đầu từ dữ liệu hàng hóa và mặt bằng thật.</p>
      <h2>Khi nào nên mua, khi nào nên thuê?</h2>
      <p>Nếu nhu cầu đã ổn định và doanh nghiệp hiểu rõ tải trọng, ${link(`${siteUrl}/dich-vu/ban-xe-nang`, 'bán xe nâng')} sẽ là nhánh nên đi tiếp. Nếu còn đang test mặt bằng, chưa rõ dữ liệu hoặc cần phản ứng nhanh ngắn hạn, hãy chuyển sang ${link(`${siteUrl}/dich-vu/cho-thue-xe-nang`, 'cho thuê xe nâng')} trước khi chốt mua.</p>
      <h2>Tại sao hậu mãi, sửa chữa và phụ tùng cũng phải được tính ngay từ đầu?</h2>
      <p>Một chiếc xe phù hợp nhưng không có đường hỗ trợ kỹ thuật, phụ tùng hoặc bảo dưỡng đi kèm vẫn có thể trở thành quyết định rủi ro. Đó là lý do người tìm hiểu xe nâng nên biết sẵn các nhánh ${link(`${siteUrl}/dich-vu/sua-xe-nang`, 'sửa xe nâng')}, ${link(`${siteUrl}/danh-muc-san-pham/phu-tung-xe-nang`, 'phụ tùng xe nâng')} và ${link(`${siteUrl}/dich-vu/yeu-cau-bao-duong`, 'bảo dưỡng xe nâng')} ngay từ giai đoạn đầu.</p>
      ${figure(generatedPostImageMap.guideInline3, 'Chọn xe nâng đúng giúp quyết định mua, thuê và bảo trì liền mạch hơn')}
      <h2>Nếu đang ở giai đoạn rất sớm thì nên bắt đầu từ đâu?</h2>
      <p>Hãy bắt đầu bằng ba câu hỏi: hàng nặng nhất là bao nhiêu, xe làm chủ yếu trong nhà hay ngoài trời, và xe sẽ chạy theo ca như thế nào. Chỉ với ba điểm này, người đọc đã có thể tách được phần lớn nhánh sản phẩm và dịch vụ phù hợp.</p>
      ${faq([
        {
          q: 'Xe nâng dầu có luôn tốt hơn xe điện không?',
          a: 'Không. Mỗi loại chỉ tốt hơn khi nó đúng với môi trường làm việc và nhịp vận hành thực tế.',
        },
        {
          q: 'Nếu mới tìm hiểu xe nâng thì có nên hỏi giá ngay không?',
          a: `Nên đọc trước bài ${link(`${siteUrl}/bai-viet/gia-xe-nang-2026-theo-dong-va-tai-trong`, 'giá xe nâng 2026 theo dòng và tải trọng')} để biết mình cần hỏi giá theo cấu hình nào.`,
        },
        {
          q: 'Nếu cần hỗ trợ vận hành hoặc sửa chữa sau khi chọn xe thì sao?',
          a: `Khi đó hãy đi tiếp sang ${link(`${siteUrl}/dich-vu/sua-xe-nang`, 'dịch vụ sửa xe nâng')} hoặc ${link(`${siteUrl}/danh-muc-san-pham/phu-tung-xe-nang`, 'hub phụ tùng xe nâng')} để chốt luồng hỗ trợ phù hợp.`,
        },
      ])}
      <h2>Kết luận</h2>
      <p>Hiểu xe nâng là gì chỉ là bước đầu. Điều tạo ra quyết định đúng là biết mình đang ở nhánh nhu cầu nào: mua, thuê, sửa hay chỉ mới khóa loại xe phù hợp. Khi đi đúng nhánh, mọi bước sau đó từ hỏi giá đến chốt đầu tư sẽ chính xác hơn nhiều.</p>
    `,
  },
];
