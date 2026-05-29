import fs from 'node:fs/promises';
import path from 'node:path';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config({ path: path.resolve('.env') });

const { Client } = pg;
const siteUrl = 'https://mgavietnam.com';

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
    <h2>Cau hoi thuong gap</h2>
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

function mediaFor(uploadedMap, slug) {
  const data = uploadedMap[slug];
  if (!data?.thumbnail || !Array.isArray(data.inline) || data.inline.length < 3) {
    throw new Error(`Missing media mapping for ${slug}`);
  }
  return data;
}

function buildServices(uploadedMap) {
  const suaXeNang = mediaFor(uploadedMap, 'sua-xe-nang');
  const thueDau = mediaFor(uploadedMap, 'cho-thue-xe-nang-dau');
  const thueDien = mediaFor(uploadedMap, 'cho-thue-xe-nang-dien');
  const baoDuong = mediaFor(uploadedMap, 'yeu-cau-bao-duong');
  const thueTong = mediaFor(uploadedMap, 'cho-thue-xe-nang-tphcm');
  const suaLocal = mediaFor(uploadedMap, 'sua-xe-nang-tphcm');
  const suaDien = mediaFor(uploadedMap, 'sua-xe-nang-dien-tphcm');
  const xeCu = mediaFor(uploadedMap, 'xe-nang-cu-thanh-ly-tphcm');

  return [
    {
      slug: 'sua-xe-nang',
      title: 'Sua xe nang chuyen nghiep tai TPHCM',
      shortDescription:
        'Dich vu sua xe nang tai TPHCM cho xe dau va xe dien, tap trung chan doan dung loi, thay dung hang muc va giam thoi gian dung may cho kho xuong.',
      metaTitle: 'Sua xe nang tai TPHCM cho xe dau va xe dien | MGA',
      metaDescription:
        'MGA cung cap dich vu sua xe nang tai TPHCM cho loi thuy luc, nang ha, dong co, he thong dien va hao mon van hanh. Ho tro xu ly nhanh cho kho xuong.',
      metaKeywords: 'sua xe nang, sua xe nang tphcm, sua chua xe nang, dich vu sua xe nang',
      ogTitle: 'Sua xe nang tai TPHCM cho xe dau va xe dien | MGA',
      ogDescription:
        'Dich vu sua xe nang cho kho xuong can chan doan nhanh, thay phu tung dung hang muc va on dinh lai van hanh.',
      canonicalUrl: `${siteUrl}/dich-vu/sua-xe-nang`,
      ogImage: suaXeNang.thumbnail,
      thumbnail: suaXeNang.thumbnail,
      description: `
        <div class="service-content">
          <p><strong>Sua xe nang</strong> tai TPHCM khong chi la xu ly cho xe chay lai tam thoi. Voi kho xuong dang van hanh lien tuc, dieu quan trong hon la tim dung nguyen nhan gay loi de tranh dung may lap lai, tranh thay nham phu tung va tranh mat them ca lam viec khi xe da co dau hieu xuong cap tu truoc.</p>
          <p>MGA di theo huong tu van thuc dung: nhin vao loai xe, tai trong, moi truong lam viec va tan suat dung xe truoc khi de xuat cach sua. Cach lam nay phu hop hon voi doanh nghiep dang can giai phap xu ly nhanh nhung van muon kiem soat chi phi ve sau.</p>
          ${figure(suaXeNang.inline[0], 'Ky thuat vien kiem tra tong the xe nang tai kho xuong TPHCM')}
          <h2>Khi nao nen goi sua xe nang ngay?</h2>
          <p>Nhung dau hieu can xu ly som thuong la xe hut luc, nang len nhung khong giu tai on dinh, ri dau thuy luc, kho no may, dong co nong bat thuong, bo dieu khien dien bao loi, binh dien sut nhanh hoac xe giat khi chay. Cang de lau, kha nang loi lan sang cum khac cang cao.</p>
          <h2>Xe dau va xe dien thuong hong o dau khac nhau?</h2>
          <p>Voi xe dau, nhom loi hay gap tap trung o he thong nhien lieu, lam mat, thuy luc, mast va cac diem hao mon do tai nang. Voi xe dien, ky thuat thuong phai kiem tra ky hon o binh dien, bo sac, mo to, contactor, day nguon va mach dieu khien. Neu xe cua ban la xe dien trong kho kin, co the xem them ${link(`${siteUrl}/dich-vu/sua-xe-nang-dien-tphcm`, 'sua xe nang dien TPHCM')} de di dung huong ky thuat.</p>
          <h2>Chan doan dung loi quan trong hon thay nhanh nhu the nao?</h2>
          <p>Nhieu xe nang dung may lap lai vi truoc do chi thay phan ngon gon ma bo qua nguyen nhan goc. Vi du, thay phot ma khong xu ly ap thuy luc bat thuong, thay binh ma khong kiem tra bo sac, hoac thay xich nang ma khong ra soat toan bo cum mast. Dung quy trinh chan doan se giup tranh doi chi phi sai hang muc.</p>
          ${figure(suaXeNang.inline[1], 'Kiem tra he thong nang ha va thuy luc tren xe nang dang van hanh')}
          <h2>Nhung hang muc sua xe nang duoc hoi nhieu</h2>
          <p>Cac nhom cong viec thuong gap gom: nang ha va mast, xilanh va ong dau, phanh, banh xe, dong co dau, loc, bo lam mat, mo to chay, mo to bom, bo sac, contactor va cac diem hao mon tren ca xe dau lan xe dien. Neu sau khi kiem tra can thay vat tu, khach hang co the doi chieu them voi ${link(`${siteUrl}/danh-muc-san-pham/phu-tung-xe-nang`, 'phu tung xe nang')} de chot dung hang muc.</p>
          <h2>Khi nao nen sua, khi nao nen bao duong truoc?</h2>
          <p>Neu xe da bi loi ro rang, mat an toan hoac dang dung may, sua la uu tien so mot. Neu xe chua dung nhung da co dau hieu hut luc, nong may, phanh yeu, roi tai hoac binh sut nhanh, bao duong som se re hon va it giu doan van hanh hon. Doi voi nhom nay, dich vu ${link(`${siteUrl}/dich-vu/yeu-cau-bao-duong`, 'bao duong xe nang dinh ky')} thuong la diem vao hop ly.</p>
          <h2>Can chuan bi gi truoc khi goi ky thuat?</h2>
          <p>Doanh nghiep nen chot truoc 4 thong tin: xe dau hay xe dien, tai trong xe, loi xuat hien luc nao, va dau hieu di kem nhu ri dau, tieng keu, kho no may hay bao loi. Neu can, co the dung bai ${link(`${siteUrl}/bai-viet/checklist-goi-sua-xe-nang-tai-tphcm`, 'checklist goi sua xe nang tai TPHCM')} de chuan bi nhanh cho cuoc goi.</p>
          ${figure(suaXeNang.inline[2], 'Danh gia phu tung hao mon truoc khi de xuat phuong an sua xe nang')}
          <h2>Khi nao sua khong con toi uu?</h2>
          <p>Neu xe da dung nhieu nam, tan suat loi day dac, tong chi phi sua lap lai bat dau vuot qua gia tri van hanh mang lai, doanh nghiep nen dat lai bai toan doi cau hinh. Luc do, viec so sang voi ${link(`${siteUrl}/danh-muc-san-pham/xe-nang-dau`, 'xe nang dau moi')} hoac ${link(`${siteUrl}/danh-muc-san-pham/xe-nang-dien`, 'xe nang dien moi')} se ro hon la tiep tuc xu ly tung dot loi rieng le.</p>
          ${faq([
            {
              q: 'MGA co sua ca xe nang dau va xe nang dien khong?',
              a: 'Co. Dich vu sua xe nang tong duoc xay de nhan ca hai nhom, sau do tach huong chan doan theo he thong dong co, thuy luc hoac he thong dien.',
            },
            {
              q: 'Khi nao nen uu tien sua tai cho?',
              a: 'Khi xe dang nam tai kho xuong, loi anh huong truc tiep den tien do va doanh nghiep can danh gia nhanh tinh trang de quyet dinh sua tai cho hay dua ve xuong.',
            },
            {
              q: 'Co nen mua phu tung truoc khi kiem tra xe khong?',
              a: 'Khong nen chot som neu chua ro nguyen nhan goc. Kiem tra truoc se tranh thay nham part va tranh phat sinh chi phi lap lai.',
            },
          ])}
          <h2>Ket luan</h2>
          <p>Neu xe nang cua ban dang co dau hieu bat thuong, cach tiet kiem nhat thuong khong phai la tri hoan sua ma la xu ly dung luc va dung hang muc. MGA co the ho tro tu danh gia loi den de xuat sua, bao duong hoac thay cau hinh phu hop hon cho kho xuong tai TPHCM.</p>
        </div>
      `,
    },
    {
      slug: 'cho-thue-xe-nang-dau',
      title: 'Cho thue xe nang dau tai TPHCM',
      shortDescription:
        'Dich vu cho thue xe nang dau tai TPHCM cho bai hang, kho xuong ngoai troi va nhu cau tai nang ngan han hoac theo du an.',
      metaTitle: 'Cho thue xe nang dau tai TPHCM theo tai trong | MGA',
      metaDescription:
        'MGA cho thue xe nang dau tai TPHCM cho nhu cau 2.5 tan, 3.5 tan, 5 tan va nhom tai nang hon. Phu hop bai hang, ngoai troi va cong viec chay nhieu ca.',
      metaKeywords: 'cho thue xe nang dau, thue xe nang dau tphcm, thue xe nang tphcm',
      ogTitle: 'Cho thue xe nang dau tai TPHCM theo tai trong | MGA',
      ogDescription:
        'Giai phap thue xe nang dau cho bai hang, san xuat va nhu cau tai nang ngan han tai TPHCM.',
      canonicalUrl: `${siteUrl}/dich-vu/cho-thue-xe-nang-dau`,
      ogImage: thueDau.thumbnail,
      thumbnail: thueDau.thumbnail,
      description: `
        <div class="service-content">
          <p><strong>Cho thue xe nang dau</strong> la giai phap phu hop khi doanh nghiep can xe tai nang trong thoi gian ngan, can bu xe tam thoi khi xe chinh dang sua, hoac can xu ly cao diem xuat nhap hang ma chua muon dau tu mua moi ngay.</p>
          <p>Voi nhom kho xuong ngoai troi, bai hang rong, mat bang khong hoan toan bang phang va lich lam viec nhieu ca, xe nang dau van la cau hinh duoc hoi nhieu vi kha nang dap ung cong viec on dinh hon.</p>
          ${figure(thueDau.inline[0], 'Xe nang dau cho thue dang boc do pallet tai bai hang TPHCM')}
          <h2>Khi nao nen thue xe nang dau thay vi mua?</h2>
          <p>Nhung truong hop ro nhat la nhu cau chi keo dai vai ngay den vai thang, du an co thoi han, cao diem xuat nhap hang theo mua, hoac doanh nghiep dang muon test tai trong truoc khi ra quyet dinh dau tu. Neu van dang can nhac giua thue va mua, bai ${link(`${siteUrl}/bai-viet/khi-nao-nen-thue-xe-nang-thay-vi-mua`, 'khi nao nen thue xe nang thay vi mua')} se giup chot nhanh hon.</p>
          <h2>Nhom 2.5 tan, 3.5 tan va 5 tan khac nhau ra sao?</h2>
          <p>2.5 tan thuong duoc chon cho pallet pho thong va kho xuat nhap hang co cuong do vua. 3.5 tan hop hon khi doanh nghiep muon du tai an toan hon cho hang nang. 5 tan la moc can xem ky hon, vi tu day tro len bai toan nen, loi di, bo cong tac va thoi gian lam viec deu can duoc khoa truoc.</p>
          <h2>Vi sao bai hang ngoai troi thuong uu tien xe dau?</h2>
          <p>Xe dau thuong hop hon voi khu vuc rong, can dich chuyen lien tuc, tai nang va khong bi gioi han nhieu boi ha tang sac. Day la ly do nhieu lead tu bai tong ${link(`${siteUrl}/dich-vu/cho-thue-xe-nang-tphcm`, 'cho thue xe nang TPHCM')} sau do se re sang trang xe dau khi moi truong lam viec nghieng ve ngoai troi.</p>
          ${figure(thueDau.inline[1], 'Xe nang dau 3.5 tan cho thue trong khu vuc xu ly hang nang')}
          <h2>Can chuan bi thong tin gi truoc khi hoi thue?</h2>
          <p>Can co it nhat 5 thong tin: tai thuc te hay nang nhat se nang, chieu cao nang, moi truong trong nha hay ngoai troi, be rong loi di va thoi gian can thue. Khi co du 5 diem nay, viec chon giua ${link(`${siteUrl}/san-pham/xe-nang-dau-mga-2-5-tan`, 'xe nang dau 2.5 tan')}, ${link(`${siteUrl}/san-pham/xe-nang-dau-mga-3-5-tan`, 'xe nang dau 3.5 tan')} va ${link(`${siteUrl}/san-pham/xe-nang-dau-mga-5-0-tan`, 'xe nang dau 5 tan')} se nhanh hon nhieu.</p>
          <h2>Yeu to nao anh huong den chi phi thue?</h2>
          <p>Chi phi thuong thay doi theo tai trong, thoi gian thue, muc do gap, khu vuc giao xe, dieu kien lam viec va yeu cau bo sung nhu side shift hay bo cong tac dac thu. Vi vay, hoi gia ma khong khoa nhu cau thuong cho ra con so kem huu ich.</p>
          <h2>Khi nao nen chuyen sang xe dien?</h2>
          <p>Neu kho cua ban chu yeu lam trong nha, can tieng on thap va khong can chay bai ngoai troi lien tuc, xe dien co the la lua chon hop ly hon. Khi do, nen doi chieu them voi ${link(`${siteUrl}/dich-vu/cho-thue-xe-nang-dien`, 'cho thue xe nang dien')} de tranh thue nham cau hinh.</p>
          ${figure(thueDau.inline[2], 'Xe nang dau tai trong cao dang lam viec tai khu vuc san xuat ngoai troi')}
          <h2>Khi nao thue khong con toi uu?</h2>
          <p>Neu doanh nghiep dang thue lien tuc nhieu thang, tan suat su dung cao va yeu cau cau hinh gan nhu co dinh, tong chi phi thue co the bat dau kem hieu qua hon phuong an mua moi. Luc nay nen doi chieu them voi nhom ${link(`${siteUrl}/danh-muc-san-pham/xe-nang-dau`, 'xe nang dau moi')} de co quyet dinh dai han tot hon.</p>
          ${faq([
            {
              q: 'Xe nang dau cho thue phu hop nhat voi moi truong nao?',
              a: 'Thuong la bai hang, san xuat, khu ngoai troi va cac noi can xu ly tai nang hoac chay nhieu ca trong thoi gian ngan den trung han.',
            },
            {
              q: 'Nen chot tai trong theo tai toi da hay tai trung binh?',
              a: 'Nen dua tren muc tai nang nhat xuat hien thuong xuyen va de mot bien du tai an toan thay vi chot sat nguong.',
            },
            {
              q: 'Thue xe nang dau co the thay xe dang sua tam thoi khong?',
              a: 'Co. Day la mot trong nhung nhu cau pho bien nhat khi kho xuong can giu nhip xuat nhap hang trong luc xe chinh dang nam ky thuat.',
            },
          ])}
          <h2>Ket luan</h2>
          <p>Cho thue xe nang dau phu hop nhat khi doanh nghiep can xu ly nhanh bai toan tai nang ngoai troi ma chua muon khoa von vao xe moi. Chot dung tai trong va moi truong ngay tu dau se giup viec thue hieu qua hon va tranh doi xe giua chung dot cong viec.</p>
        </div>
      `,
    },
    {
      slug: 'cho-thue-xe-nang-dien',
      title: 'Cho thue xe nang dien tai TPHCM',
      shortDescription:
        'Dich vu cho thue xe nang dien tai TPHCM cho kho kin, xuong sach va loi di hep, phu hop nhom 1.5 tan den 3.0 tan.',
      metaTitle: 'Cho thue xe nang dien tai TPHCM cho kho trong nha | MGA',
      metaDescription:
        'MGA cho thue xe nang dien tai TPHCM cho kho kin, xuong sach va moi truong can van hanh em. Ho tro chon xe dung lai, ngoi lai hoac stacker theo mat bang.',
      metaKeywords: 'cho thue xe nang dien, thue xe nang dien tphcm, xe nang dien dung lai, xe nang dien ngoi lai',
      ogTitle: 'Cho thue xe nang dien tai TPHCM cho kho trong nha | MGA',
      ogDescription:
        'Giai phap thue xe nang dien cho kho kin, xuong sach va loi di hep tai TPHCM.',
      canonicalUrl: `${siteUrl}/dich-vu/cho-thue-xe-nang-dien`,
      ogImage: thueDien.thumbnail,
      thumbnail: thueDien.thumbnail,
      description: `
        <div class="service-content">
          <p><strong>Cho thue xe nang dien</strong> phu hop khi doanh nghiep can xu ly cong viec trong nha, muon xe van hanh em, it khi thai va xoay tro linh hoat trong mat bang kho kin. Day cung la lua chon hay duoc can nhac khi doanh nghiep chua muon dau tu xe moi ngay.</p>
          <p>Thuc te, thue xe dien khong chi la chon tai trong. Dieu quan trong hon la chon dung kieu xe theo loi di, tan suat di chuyen, chieu cao ke hang va ca lam viec de tranh thue xe qua to hoac khong hop mat bang.</p>
          ${figure(thueDien.inline[0], 'Xe nang dien cho thue trong kho kin va xuong sach tai TPHCM')}
          <h2>Khi nao nen uu tien thue xe nang dien?</h2>
          <p>Xe dien hop voi kho thanh pham, xuong sach, moi truong can giam tieng on, khu vuc co loi di hep va doanh nghiep muon van hanh trong nha lien tuc. Neu bai toan cua ban nghieng ve ngoai troi va tai nang, nen doi chieu them voi ${link(`${siteUrl}/dich-vu/cho-thue-xe-nang-dau`, 'cho thue xe nang dau')}.</p>
          <h2>Xe dung lai, ngoi lai va stacker khac nhau nhu the nao?</h2>
          <p>Xe dung lai hop voi kho can quay dau linh hoat, loi di hep va tan suat len xuong xe nhieu. Xe ngoi lai hop hon voi quang duong di chuyen dai va ca lam viec lau. Stacker thuong phu hop cac bai toan pallet nhe hon, kho nho va khong can cau hinh forklift day du.</p>
          <h2>Nhom tai trong nao duoc hoi nhieu?</h2>
          <p>Nhu cau pho bien thuong xoay quanh 1.5 tan, 2 tan va 2.5 tan. Neu kho dang phan van giua 1.5 tan va 2 tan, bai ${link(`${siteUrl}/bai-viet/xe-nang-dien-1-5-tan-hay-2-tan-cho-kho-trong-nha`, 'xe nang dien 1.5 tan hay 2 tan cho kho trong nha')} se giup chot nhanh hon.</p>
          ${figure(thueDien.inline[1], 'Xe nang dien dung lai di chuyen trong loi di hep cua kho hang')}
          <h2>Can chot gi truoc khi hoi thue?</h2>
          <p>Doanh nghiep nen khoa 5 diem: tai thuc te, chieu cao nang, be rong loi di, thoi gian su dung moi ngay va dieu kien sac. Khi da ro 5 diem nay, viec so giua ${link(`${siteUrl}/san-pham/xe-nang-dien-mga-1-5-tan`, 'xe nang dien 1.5 tan')}, ${link(`${siteUrl}/san-pham/xe-nang-dien-mga-2-0-tan`, 'xe nang dien 2.0 tan')} va ${link(`${siteUrl}/san-pham/xe-nang-dien-ngoi-lai-mga-1-5-tan`, 'xe nang dien ngoi lai')} se co can cu hon.</p>
          <h2>Yeu to nao tac dong den chi phi thue xe dien?</h2>
          <p>Chi phi phu thuoc vao tai trong, loai xe, thoi gian thue, yeu cau giao xe gap, tinh trang mat bang va nhom binh dien bo sac di kem. Hoi gia ma khong mo ta mat bang thuong khong cho ra phuong an sat nhu cau.</p>
          <h2>Khi nao nen thue thay vi mua?</h2>
          <p>Thue phu hop khi nhu cau dang theo mua, theo du an, khi doanh nghiep muon test cau hinh trong kho that, hoac khi xe hien tai dang sua. Neu tan suat thue bat dau keo dai, hay doi chieu them voi ${link(`${siteUrl}/danh-muc-san-pham/xe-nang-dien`, 'xe nang dien moi')} de tranh chi phi thue tich luy.</p>
          ${figure(thueDien.inline[2], 'Stacker va xe nang dien xu ly pallet trong kho nho')}
          <h2>Khi nao khong nen chon xe nang dien?</h2>
          <p>Neu cong viec nghieng ve bai ngoai troi, nen san khong tot, tai nang cao va phai chay nhieu ca lien tuc ma ha tang sac khong san sang, xe dau se thuc dung hon. Day la ly do trang tong ${link(`${siteUrl}/dich-vu/cho-thue-xe-nang-tphcm`, 'cho thue xe nang TPHCM')} ton tai de giup tach dung huong ngay tu dau.</p>
          ${faq([
            {
              q: 'Kho nho co nen uu tien stacker khong?',
              a: 'Neu tai khong qua lon, khong can toc do di chuyen cao va loi di rat hep, stacker co the la lua chon kinh te hon forklift dien day du.',
            },
            {
              q: 'Xe dien dung lai hay ngoi lai hop cho kho hep?',
              a: 'Da so truong hop kho hep uu tien dung lai vi ban kinh quay dau gon hon, nhung van can doi chieu voi quang duong di chuyen va tan suat lam viec.',
            },
            {
              q: 'Co the thue xe dien de dung tam trong luc cho xe moi khong?',
              a: 'Co. Day la cach pho bien de giu nhip van hanh ma khong phai mua voi khi nhu cau dai han chua chot.',
            },
          ])}
          <h2>Ket luan</h2>
          <p>Cho thue xe nang dien hieu qua nhat khi doanh nghiep khoa dung mat bang va kieu xe ngay tu dau. Chi can sai mot bien nhu loi di hoac tai trong, trai nghiem van hanh se giam rat nhanh du gia thue ban dau co ve hop ly.</p>
        </div>
      `,
    },
    {
      slug: 'yeu-cau-bao-duong',
      title: 'Bao duong xe nang dinh ky tai TPHCM',
      shortDescription:
        'Dich vu bao duong xe nang dinh ky tai TPHCM cho xe dau va xe dien, giup giam hong vat, phat hien som hao mon va giu xe van hanh on dinh.',
      metaTitle: 'Bao duong xe nang dinh ky tai TPHCM | MGA',
      metaDescription:
        'MGA bao duong xe nang tai TPHCM cho xe dau va xe dien theo chu ky van hanh. Giam dung may, phat hien som ri dau, phanh yeu, hao mon va loi he thong dien.',
      metaKeywords: 'bao duong xe nang, bao tri xe nang, bao duong xe nang tphcm, bao tri xe nang tphcm',
      ogTitle: 'Bao duong xe nang dinh ky tai TPHCM | MGA',
      ogDescription:
        'Dich vu bao duong xe nang giup doanh nghiep on dinh doi xe, giam sua dot xuat va kiem soat chi phi van hanh.',
      canonicalUrl: `${siteUrl}/dich-vu/yeu-cau-bao-duong`,
      ogImage: baoDuong.thumbnail,
      thumbnail: baoDuong.thumbnail,
      description: `
        <div class="service-content">
          <p><strong>Bao duong xe nang</strong> la buoc doanh nghiep hay bo qua khi xe van con chay duoc, nhung day lai la cach re nhat de tranh dung may dot ngot. Voi doi xe phai xu ly hang ngay, mot lich bao duong dung luc thuong co gia tri hon mot dot sua lon sau khi xe da nam may.</p>
          <p>Dich vu nay phu hop voi doanh nghiep muon kiem soat rui ro, giu xe on dinh trong mua cao diem va phat hien som nhung diem hao mon truoc khi chung bien thanh loi lon.</p>
          ${figure(baoDuong.inline[0], 'Bao duong dinh ky xe nang tai kho xuong TPHCM')}
          <h2>Vi sao nen bao duong theo chu ky thay vi doi xe hong moi sua?</h2>
          <p>Nhiều loi lon thuong bat dau tu dau hieu nho nhu ri dau, nong may, phanh yeu, tiep diem ban, sac cham hoac xich nang xuong do. Neu cho den luc xe dung han, doanh nghiep se tra gia bang thoi gian dung may, don sua lon hon va kha nang loang loi sang cum khac.</p>
          <h2>Xe dau va xe dien can bao duong khac nhau o dau?</h2>
          <p>Xe dau can nhin sat hon vao dau may, he thong nhien lieu, lam mat, loc va dau thuy luc. Xe dien can theo doi binh, bo sac, tiep diem, day nguon, mo to va cac he thong dieu khien. Day la ly do lich bao duong khong nen dung mot mau chung cho moi xe.</p>
          <h2>Nhung hang muc kiem tra dinh ky quan trong</h2>
          <p>Thong thuong se gom dau dong co, dau thuy luc, loc, ong dau, phanh, banh, mast, chain, cang nang, tiep diem, bo sac, mo to va cac diem bulong chiu luc. Neu doanh nghiep da gap nhieu loi lap lai, can bo sung luon phan danh gia thoi quen van hanh va tai trong thuc te.</p>
          ${figure(baoDuong.inline[1], 'Kiem tra binh dien va he thong dieu khien trong goi bao duong xe nang')}
          <h2>Khi nao nen rut ngan chu ky bao duong?</h2>
          <p>Neu xe chay nhieu ca, thuong xuyen nang sat tai, lam viec trong moi truong bui, nong, am hoac mat bang khong tot, chu ky bao duong nen day hon. Cang de xe lam viec nang, bien do an toan cang phai duoc kep chat hon.</p>
          <h2>Bao duong va sua chua lien ket voi nhau nhu the nao?</h2>
          <p>Bao duong khong thay the sua chua khi xe da loi ro rang, nhung no giup phat hien hang muc sua tu som. Khi phat hien diem bat thuong, doanh nghiep co the chuyen nhanh sang ${link(`${siteUrl}/dich-vu/sua-xe-nang`, 'sua xe nang')} de xu ly truoc khi xe dung may.</p>
          <h2>Khi nao nen chuan bi san phu tung hao mon?</h2>
          <p>Neu doi xe chay lien tuc va cac vat tu nhu loc, phanh, banh, phot hoac ong dau co chu ky thay lap lai, co the chuan bi ton toi thieu. Tuy nhien, voi nhung hang muc chua ro nguyen nhan, van nen kiem tra truoc thay sau va doi chieu qua ${link(`${siteUrl}/danh-muc-san-pham/phu-tung-xe-nang`, 'danh muc phu tung xe nang')}.</p>
          ${figure(baoDuong.inline[2], 'Danh gia banh xe va cum nang ha trong lich bao duong dinh ky')}
          <h2>Goi bao duong nao hop voi doanh nghiep?</h2>
          <p>Khong co mot goi phu hop cho tat ca. Doi xe moi, tan suat vua va mat bang tot se khac doi xe cu, chay nhieu ca va nang sat nguong. Cach chot dung la dua tren gio may, tan suat, tai trong va lich su loi thuc te cua xe.</p>
          ${faq([
            {
              q: 'Bao duong xe nang co can cho den khi xe co loi khong?',
              a: 'Khong. Gia tri lon nhat cua bao duong la tim som dau hieu bat thuong truoc khi xe dung may.',
            },
            {
              q: 'Xe dien co can bao duong dinh ky nhu xe dau khong?',
              a: 'Co. Cac hang muc khac nhau, nhung xe dien van can theo doi binh, bo sac, tiep diem, mo to, phanh va cum nang ha.',
            },
            {
              q: 'Bao duong co giup giam chi phi sua chua khong?',
              a: 'Co, vi nhieu loi lon neu phat hien som se chi can xu ly o muc hao mon nhe thay vi sua cum lon sau khi xe da hong nang.',
            },
          ])}
          <h2>Ket luan</h2>
          <p>Voi doi xe nang dang hoat dong lien tuc, bao duong dinh ky la cach kiem soat rui ro thuc dung nhat. Lam dung chu ky se giup doanh nghiep giam sua dot xuat, giu nhiep xuat nhap hang on dinh va tranh chi phi lon xuat hien vao luc khong mong muon.</p>
        </div>
      `,
    },
    {
      slug: 'cho-thue-xe-nang-tphcm',
      title: 'Cho thue xe nang TPHCM',
      shortDescription:
        'Trang dich vu tong cho thue xe nang tai TPHCM, giup chon nhanh xe dau hay xe dien theo tai trong, moi truong lam viec va thoi gian su dung.',
      metaTitle: 'Cho thue xe nang TPHCM theo nhu cau thuc te | MGA',
      metaDescription:
        'MGA cho thue xe nang TPHCM cho kho xuong, nha may va cao diem xuat nhap hang. Tu van nhanh xe dau, xe dien va tai trong phu hop voi moi truong lam viec.',
      metaKeywords: 'cho thue xe nang tphcm, thue xe nang tphcm, cho thue xe nang, thue xe nang dau, thue xe nang dien',
      ogTitle: 'Cho thue xe nang TPHCM theo nhu cau thuc te | MGA',
      ogDescription:
        'Trang tong cho thue xe nang giup tach nhanh bai toan xe dau, xe dien, tai trong va thoi gian thue tai TPHCM.',
      canonicalUrl: `${siteUrl}/dich-vu/cho-thue-xe-nang-tphcm`,
      ogImage: thueTong.thumbnail,
      thumbnail: thueTong.thumbnail,
      description: `
        <div class="service-content">
          <p><strong>Cho thue xe nang TPHCM</strong> la diem vao tong cho doanh nghiep dang can xe nang nhanh nhung chua chac nen di theo xe dau hay xe dien. Cach dung nhat khong phai hoi gia truoc, ma la khoa truoc tai trong, moi truong va thoi gian su dung de tranh re nham huong.</p>
          <p>Trang nay duoc xay de giup tach nhanh bai toan theo 3 nhom: trong nha hay ngoai troi, tai vua hay tai nang, va thue tam thoi hay co xu huong keo dai nhieu thang.</p>
          ${figure(thueTong.inline[0], 'Dich vu cho thue xe nang tong hop tai TPHCM cho kho xuong va nha may')}
          <h2>Khi nao doanh nghiep nen thue xe nang?</h2>
          <p>Thue hop ly khi nhu cau phat sinh theo mua, theo du an, khi doi xe hien tai dang sua, hoac khi doanh nghiep muon test cau hinh truoc khi mua. Day la cach giu nhiep van hanh ma khong khoa von qua som vao mot phuong an chua du ro.</p>
          <h2>Chon xe dau hay xe dien tu trang tong nay?</h2>
          <p>Neu moi truong nghieng ve bai hang, ngoai troi, mat bang rong va cong viec tai nang, nen di tiep sang ${link(`${siteUrl}/dich-vu/cho-thue-xe-nang-dau`, 'cho thue xe nang dau')}. Neu kho kin, xuong sach, loi di hep va can van hanh em, huong dung hon la ${link(`${siteUrl}/dich-vu/cho-thue-xe-nang-dien`, 'cho thue xe nang dien')}.</p>
          <h2>Nhom tai trong duoc hoi nhieu nhat</h2>
          <p>Thuc te tai TPHCM, nhu cau tap trung nhieu o nhom 1.5 tan, 2 tan, 2.5 tan, 3.5 tan va 5 tan. Kho nho trong nha thuong bat dau o 1.5-2 tan, trong khi bai hang va hang nang thuong dich chuyen sang 2.5-5 tan.</p>
          ${figure(thueTong.inline[1], 'So sanh nhu cau xe nang dau va xe nang dien trong cung mot kho xuong')}
          <h2>Thong tin can chuan bi truoc khi hoi thue</h2>
          <p>Can co toi thieu tai trong nang nhat, chieu cao nang, be rong loi di, moi truong lam viec, thoi gian can thue va tan suat su dung moi ngay. Day la bo thong tin giup doi ky thuat tu van nhanh va tranh doi xe giua chung dot cong viec.</p>
          <h2>Yeu to nao tac dong den gia thue?</h2>
          <p>Gia phu thuoc vao dong xe, tai trong, thoi gian thue, muc do gap, khu vuc giao nhan va yeu cau bo cong tac. Vi vay, mot bang gia chung khong phan anh dung tong chi phi cua moi case.</p>
          <h2>Khi nao nen chuyen tu thue sang mua?</h2>
          <p>Neu nhu cau bat dau on dinh nhieu thang, tan suat dung xe cao va thong so khong con thay doi, doanh nghiep nen doi chieu voi nhom ${link(`${siteUrl}/danh-muc-san-pham/xe-nang-dau`, 'xe nang dau moi')} hoac ${link(`${siteUrl}/danh-muc-san-pham/xe-nang-dien`, 'xe nang dien moi')} de tinh tong chi phi so huu dai han.</p>
          <h2>Trang tong nay nen di tiep ve dau?</h2>
          <p>Neu ban da ro huong, di tiep sang trang xe dau hoac xe dien. Neu van dang phan van thue hay mua, doc them bai ${link(`${siteUrl}/bai-viet/khi-nao-nen-thue-xe-nang-thay-vi-mua`, 'khi nao nen thue xe nang thay vi mua')} de khoa quyet dinh nhanh hon.</p>
          ${figure(thueTong.inline[2], 'Xe nang cho thue dang phuc vu cao diem xuat nhap hang tai TPHCM')}
          ${faq([
            {
              q: 'Cho thue xe nang TPHCM co gom ca xe dau va xe dien khong?',
              a: 'Co. Trang tong nay duoc dung de phan luong nhanh sang nhom xe phu hop theo moi truong va tai trong.',
            },
            {
              q: 'Nen chot tai trong theo hang nang nhat hay theo trung binh?',
              a: 'Nen dua tren nhung muc tai cao xuat hien thuong xuyen va de mot bien du tai an toan.',
            },
            {
              q: 'Neu chua ro nen chon xe nao thi sao?',
              a: 'Hay bat dau bang viec mo ta mat bang, tai trong va thoi gian su dung. Tu 3 diem nay se tach duoc xe dau hay xe dien rat nhanh.',
            },
          ])}
          <h2>Ket luan</h2>
          <p>Cho thue xe nang TPHCM se hieu qua nhat khi doanh nghiep khoa ro nhu cau truoc khi hoi gia. Cang ro moi truong va tai trong, cang de chon dung xe va tranh phat sinh chi phi doi cau hinh giua qua trinh lam viec.</p>
        </div>
      `,
    },
    {
      slug: 'sua-xe-nang-tphcm',
      title: 'Sua xe nang TPHCM',
      shortDescription:
        'Dich vu sua xe nang TPHCM cho kho xuong can ky thuat ho tro nhanh khi xe dau hoac xe dien gap loi nang ha, thuy luc, dong co hoac he thong dien.',
      metaTitle: 'Sua xe nang TPHCM ho tro ky thuat nhanh | MGA',
      metaDescription:
        'MGA sua xe nang TPHCM cho xe dau va xe dien. Tap trung xu ly nhanh loi nang ha, thuy luc, dong co, he thong dien va phu tung hao mon de giam dung may.',
      metaKeywords: 'sua xe nang tphcm, sua xe nang, sua chua xe nang tphcm, dich vu sua xe nang tphcm',
      ogTitle: 'Sua xe nang TPHCM ho tro ky thuat nhanh | MGA',
      ogDescription:
        'Landing page local cho nhu cau sua xe nang tai TPHCM khi kho xuong can xu ly gap tai cho.',
      canonicalUrl: `${siteUrl}/dich-vu/sua-xe-nang-tphcm`,
      ogImage: suaLocal.thumbnail,
      thumbnail: suaLocal.thumbnail,
      description: `
        <div class="service-content">
          <p><strong>Sua xe nang TPHCM</strong> la trang dich vu local cho nhom khach hang can ky thuat ho tro nhanh tai kho xuong. Muc tieu cua trang nay khong phai trinh bay ly thuyet sua xe nang, ma la giup doanh nghiep chot nhanh minh dang gap loai loi nao va nen xu ly theo huong nao de tranh anh huong tien do.</p>
          <p>Khi xe dang dung may hoac mat an toan, toc do phan loai loi dung ngay tu dau thuong quan trong khong kem viec sua nhanh. Neu di sai huong, doanh nghiep vua mat them thoi gian vua tang nguy co thay nham hang muc.</p>
          ${figure(suaLocal.inline[0], 'Ky thuat sua xe nang tai TPHCM trong tinh huong kho xuong can xu ly gap')}
          <h2>Dau hieu nao cho thay can goi sua xe nang TPHCM ngay?</h2>
          <p>Xe nang khong giu tai, nang cham, khong len du do cao, ri dau, nong may, co khoi bat thuong, bao loi dieu khien, sut binh nhanh hoac xe giat khi chay deu la nhung tinh huong nen xu ly som. Day la cac dau hieu cho thay xe khong con on dinh de tiep tuc van hanh binh thuong.</p>
          <h2>Voi trang local, vi sao thong tin ban dau lai quan trong?</h2>
          <p>Chi can biet xe dau hay xe dien, tai trong, vi tri kho, loi xuat hien luc nao va dau hieu di kem, doi ky thuat da co the khoanh pham vi xu ly nhanh hon rat nhieu. Neu chua biet can chuan bi gi, co the xem ${link(`${siteUrl}/bai-viet/checklist-goi-sua-xe-nang-tai-tphcm`, 'checklist goi sua xe nang tai TPHCM')}.</p>
          <h2>Trang nay khac gi voi trang sua xe nang tong?</h2>
          <p>Trang ${link(`${siteUrl}/dich-vu/sua-xe-nang`, 'sua xe nang tong')} noi ro cac nhom loi va phuong an ky thuat rong hon. Con trang local nay nhan manh vao nhu cau xu ly gap tai TPHCM, giup khach hang tu query local di den dung huong lien he nhanh hon.</p>
          ${figure(suaLocal.inline[1], 'Kiem tra he thong thuy luc va mast trong goi sua xe nang TPHCM')}
          <h2>Nhung nhom loi duoc hoi nhieu tai TPHCM</h2>
          <p>Thuong gap nhat la loi he thong nang ha, thuy luc, dong co dau, bo lam mat, phanh, banh xe, bo sac, binh dien va bo dieu khien. Voi xe dien, nhieu case nen di thang sang ${link(`${siteUrl}/dich-vu/sua-xe-nang-dien-tphcm`, 'sua xe nang dien TPHCM')} de noi dung chuyen mon sat hon.</p>
          <h2>Khi nao nen sua tai cho, khi nao nen dua ve xuong?</h2>
          <p>Neu loi nam o hang muc co the tiep can va danh gia nhanh tai kho, xu ly tai cho se tiet kiem thoi gian hon. Neu can tach sau vao dong co, he thong dien phuc tap hoac can dung cu chuyen dung, dua ve xuong co the an toan va hieu qua hon. Quyet dinh nay can dua tren tinh trang that cua xe.</p>
          <h2>Can ket hop voi bao duong hay thay phu tung khong?</h2>
          <p>Neu sau khi sua phat hien cac diem hao mon lap lai, doanh nghiep nen ket hop voi ${link(`${siteUrl}/dich-vu/yeu-cau-bao-duong`, 'bao duong xe nang')} hoac doi chieu vat tu qua ${link(`${siteUrl}/danh-muc-san-pham/phu-tung-xe-nang`, 'phu tung xe nang')} de tranh loi quay lai som.</p>
          ${figure(suaLocal.inline[2], 'Danh gia phu tung can thay sau khi chan doan loi xe nang')}
          ${faq([
            {
              q: 'Trang sua xe nang TPHCM co nhan ca xe dau va xe dien khong?',
              a: 'Co. Day la trang local tong hop, sau do se tach huong ky thuat theo loai xe va he thong loi.',
            },
            {
              q: 'Can cung cap gi khi lien he?',
              a: 'Nen co loai xe, tai trong, vi tri kho, loi gap phai va cac dau hieu di kem de khoanh pham vi nhanh hon.',
            },
            {
              q: 'Neu xe chi moi co dau hieu nhe thi co nen goi ngay khong?',
              a: 'Nen. Nhieu loi lon deu bat dau tu nhung dau hieu nhe nhung lap lai, dac biet voi xe dang chay nhieu ca.',
            },
          ])}
          <h2>Ket luan</h2>
          <p>Voi nhu cau sua xe nang TPHCM, thong tin dung ngay tu dau se giup xu ly nhanh hon rat nhieu. Khoa ro loai xe, dau hieu loi va muc do gap se giup doanh nghiep chon dung huong sua tai cho, dua ve xuong hay ket hop bao duong.</p>
        </div>
      `,
    },
    {
      slug: 'sua-xe-nang-dien-tphcm',
      title: 'Sua xe nang dien TPHCM',
      shortDescription:
        'Dich vu sua xe nang dien tai TPHCM cho loi binh dien, bo sac, mo to, contactor va he thong dieu khien trong kho kin va xuong sach.',
      metaTitle: 'Sua xe nang dien TPHCM cho loi binh va he thong dien | MGA',
      metaDescription:
        'MGA sua xe nang dien tai TPHCM cho loi binh dien, bo sac, mo to, contactor, day nguon va he thong dieu khien. Phu hop kho trong nha va xuong sach.',
      metaKeywords: 'sua xe nang dien tphcm, sua xe nang dien, sua binh xe nang dien, sua bo sac xe nang dien',
      ogTitle: 'Sua xe nang dien TPHCM cho loi binh va he thong dien | MGA',
      ogDescription:
        'Landing page local cho nhu cau sua xe nang dien tai TPHCM trong kho kin, xuong sach va moi truong can van hanh em.',
      canonicalUrl: `${siteUrl}/dich-vu/sua-xe-nang-dien-tphcm`,
      ogImage: suaDien.thumbnail,
      thumbnail: suaDien.thumbnail,
      description: `
        <div class="service-content">
          <p><strong>Sua xe nang dien TPHCM</strong> la trang dich vu local danh rieng cho nhom doanh nghiep dang van hanh xe dien trong kho kin, xuong sach va moi truong can tieng on thap. Voi dong xe nay, thay phu tung nhanh khong du, vi nhieu loi nam o cach he thong dien phan ung voi nhau.</p>
          <p>Neu binh sut nhanh, sac khong vao, xe giat khi di chuyen hoac bo dieu khien bao loi, viec kiem tra dung tuyen se giup tranh thay nham binh, nham bo sac hoac bo qua nguyen nhan nam o mo to va mach dieu khien.</p>
          ${figure(suaDien.inline[0], 'Sua xe nang dien trong kho kin tai TPHCM voi he thong dien can kiem tra ky')}
          <h2>Nhung dau hieu loi dien thuong gap</h2>
          <p>Xe yeu hon binh thuong, pin xuong nhanh, sac lau day, mo to chay khong deu, mat luc keo, can dieu khien phan ung cham, den bao loi sang hoac contactor dong cat bat thuong la nhung trieu chung can duoc kiem tra som.</p>
          <h2>Vi sao khong nen thay binh hoac bo sac theo cam tinh?</h2>
          <p>Voi xe nang dien, nhieu trieu chung giong nhau nhung nguyen nhan khac nhau. Sac khong vao co the do bo sac, do tiep diem, do day nguon, do bo mach hoac do tinh trang binh. Thay sai mot cum lon co the doi chi phi rat cao nhung van khong giai quyet het loi.</p>
          <h2>Khi nao loi nam o mo to, contactor hoac bo dieu khien?</h2>
          <p>Neu xe giat khi chay, mat luc keo tung luc, mo to nong bat thuong, contactor dong ngat lien tuc hoac xe bao loi luc van hanh, kha nang cao loi nam o nhom dieu khien hoac mo to hon la o rieng binh. Day la ly do dich vu nay tach rieng khoi trang ${link(`${siteUrl}/dich-vu/sua-xe-nang`, 'sua xe nang tong')}.</p>
          ${figure(suaDien.inline[1], 'Ky thuat vien do kiem bo sac va binh dien xe nang')}
          <h2>Sua xe nang dien tai kho kin can luu y gi?</h2>
          <p>Kho kin va xuong sach thuong co mat do di chuyen lien tuc, quang duong lap lai va yeu cau van hanh em. Vi vay, cac loi nho o mo to, phanh, banh xe hoac he thong dieu khien de lam tai xe cam nhan ro hon. Kiem tra som se giup tranh doi xe giua ca.</p>
          <h2>Khi nao nen ket hop voi bao duong dinh ky?</h2>
          <p>Neu xe chua dung may nhung da co dau hieu sut hieu suat, bao duong co the giup phat hien som tiep diem ban, bo sac yeu, banh mon, phanh xuong cap hoac mo to nong. Trang ${link(`${siteUrl}/dich-vu/yeu-cau-bao-duong`, 'bao duong xe nang')} la diem di tiep tu nhom nay.</p>
          <h2>Khi nao nen tinh den phuong an doi xe?</h2>
          <p>Neu xe dien da cu, loi lap lai day dac, tong chi phi sua lon bat dau sat gia tri van hanh mang lai, doanh nghiep nen so lai voi ${link(`${siteUrl}/danh-muc-san-pham/xe-nang-dien`, 'xe nang dien moi')} hoac nhom ${link(`${siteUrl}/san-pham/xe-nang-dien-mga-2-0-tan`, 'xe nang dien 2.0 tan')} de chot tong chi phi dai han.</p>
          ${figure(suaDien.inline[2], 'Kiem tra mo to chay va he thong dieu khien xe nang dien')}
          ${faq([
            {
              q: 'Binh dien sut nhanh co chac chan do binh hu khong?',
              a: 'Khong. Nguyen nhan co the den tu bo sac, tiep diem, day nguon, cach su dung hoac he thong dieu khien, can kiem tra truoc khi thay.',
            },
            {
              q: 'Xe nang dien bao loi co nen tiep tuc dung khong?',
              a: 'Khong nen co gang van hanh neu xe da bao loi lap lai hoac mat luc bat thuong, vi co the lam loi nang hon.',
            },
            {
              q: 'Trang nay co phu hop voi xe dien dung lai va ngoi lai khong?',
              a: 'Co. Trang dich vu local nay nhan cho ca hai nhom, sau do chan doan theo loai xe va trieu chung cu the.',
            },
          ])}
          <h2>Ket luan</h2>
          <p>Sua xe nang dien TPHCM hieu qua nhat khi doanh nghiep mo ta dung trieu chung va de ky thuat kiem tra theo he thong thay vi thay cam tinh. Cang xu ly som, cang de giu on dinh cho kho trong nha va xuong sach.</p>
        </div>
      `,
    },
    {
      slug: 'xe-nang-cu-thanh-ly-tphcm',
      title: 'Xe nang cu thanh ly tai TPHCM',
      shortDescription:
        'Trang tu van cho nhu cau tim xe nang cu thanh ly tai TPHCM, giup doanh nghiep chon dung tai trong, danh gia rui ro sua chua va can doi ngan sach.',
      metaTitle: 'Xe nang cu thanh ly tai TPHCM can xem gi truoc khi chot? | MGA',
      metaDescription:
        'Tu van chon xe nang cu thanh ly tai TPHCM theo tai trong, moi truong lam viec va rui ro sua chua sau mua. Phu hop doanh nghiep can toi uu ngan sach.',
      metaKeywords: 'xe nang cu thanh ly tphcm, xe nang cu, mua xe nang cu tphcm, xe nang dau cu',
      ogTitle: 'Xe nang cu thanh ly tai TPHCM can xem gi truoc khi chot? | MGA',
      ogDescription:
        'Landing page tu van cho nhom mua xe nang cu, xe thanh ly theo dot va bai toan can doi ngan sach tai TPHCM.',
      canonicalUrl: `${siteUrl}/dich-vu/xe-nang-cu-thanh-ly-tphcm`,
      ogImage: xeCu.thumbnail,
      thumbnail: xeCu.thumbnail,
      description: `
        <div class="service-content">
          <p><strong>Xe nang cu thanh ly tai TPHCM</strong> la nhom tu khoa thu hut nhieu nguoi mua vi ap luc ngan sach, nhung day cung la nhom de chot sai nhat neu chi nhin vao gia ban dau. Xe nang cu chi thuc su kinh te khi tinh trang ky thuat, tan suat su dung va chi phi sua sau mua nam trong muc co the kiem soat.</p>
          <p>Trang nay di theo huong tu van can trong: bat dau tu bai toan cong viec va muc chap nhan rui ro, sau do moi tinh den gia vao cua xe, thay vi lam nguoc lai.</p>
          ${figure(xeCu.inline[0], 'Tu van xe nang cu thanh ly tai TPHCM cho doanh nghiep can doi ngan sach')}
          <h2>Khi nao mua xe nang cu la phuong an hop ly?</h2>
          <p>Lua chon nay phu hop khi doanh nghiep can giam von dau tu ban dau, tan suat dung xe khong qua cao hoac chap nhan duoc mot muc bao duong sua chua sau mua. Neu doi xe phai chay nhieu ca lien tuc, can tinh ky hon tong chi phi ve sau.</p>
          <h2>Ba cau hoi can khoa truoc khi xem xe cu</h2>
          <p>Can ro tai trong that dang dung, xe se lam trong nha hay ngoai troi, va doanh nghiep chap nhan den dau voi rui ro sua sau mua. Ba diem nay se tach rat nhanh nen nghieng ve xe cu 3 tan, 3.5 tan, 5 tan hay thuc ra nen quay lai xe moi.</p>
          <h2>Nhom xe cu nao duoc hoi nhieu?</h2>
          <p>Thuong la xe nang dau cu 3 tan, 3.5 tan, 5 tan cho bai hang va kho xuong ngoai troi; ngoai ra con co nhom xe dien cu 1.5-2.5 tan cho kho kin. Neu dang can doc sau hon, co the xem them cac bai ${link(`${siteUrl}/bai-viet/mua-xe-nang-cu-tphcm-3-tan-can-luu-y-gi`, 'mua xe nang cu TPHCM 3 tan can luu y gi')} va ${link(`${siteUrl}/bai-viet/mua-xe-nang-cu-tphcm-3-5-tan-co-hop-kho-xuong-khong`, 'mua xe nang cu TPHCM 3.5 tan co hop kho xuong khong')}.</p>
          ${figure(xeCu.inline[1], 'Kiem tra mast va he thong thuy luc tren xe nang cu truoc khi chot mua')}
          <h2>Nhung diem ky thuat nen kiem tra ky</h2>
          <p>Can nhin tong the mast, xich nang, xilanh, dau thuy luc, do ro, phanh, banh, dong co, bo lam mat va cac dau hieu qua tai keo dai. Voi xe dien, bo sung them tinh trang binh, bo sac, mo to va he thong dieu khien.</p>
          <h2>Khi nao gia re hoa ra khong re?</h2>
          <p>Neu xe vao cua thap nhung sau do phai thay lien tuc nhieu cum lon, tong chi phi se tang rat nhanh. Nhieu doanh nghiep tiet kiem duoc luc mua nhung lai mat tien o sua chua, dung may va mat tien do van hanh trong 3-6 thang dau.</p>
          <h2>Khi nao nen doi chieu lai voi xe moi?</h2>
          <p>Neu tan suat cong viec cao, yeu cau do on dinh lon va chi phi sua sau mua co nguy co day len nhanh, nen doi chieu them voi ${link(`${siteUrl}/danh-muc-san-pham/xe-nang-dau`, 'xe nang dau moi')} hoac ${link(`${siteUrl}/danh-muc-san-pham/xe-nang-dien`, 'xe nang dien moi')} truoc khi chot.</p>
          <h2>Can ket hop voi bao duong hoac sua truoc khi dua vao van hanh khong?</h2>
          <p>Co. Voi xe cu, viec kiem tra tong the va lap mot muc bao duong co ban truoc khi dua vao khai thac thuong an toan hon. Neu can xu ly ngay cac diem loi, co the di tiep sang ${link(`${siteUrl}/dich-vu/sua-xe-nang`, 'sua xe nang')} hoac ${link(`${siteUrl}/dich-vu/yeu-cau-bao-duong`, 'bao duong xe nang')}.</p>
          ${figure(xeCu.inline[2], 'Danh gia xe nang cu ngoai troi theo tai trong va muc do hao mon')}
          ${faq([
            {
              q: 'Mua xe nang cu co phu hop voi doanh nghiep chay nhieu ca khong?',
              a: 'Co the phu hop neu xe duoc kiem tra rat ky va doanh nghiep chap nhan ke hoach bao duong sua chua chat hon. Neu can do on dinh cao, nen doi chieu voi xe moi.',
            },
            {
              q: 'Nen chot xe cu theo gia hay theo tinh trang?',
              a: 'Tinh trang ky thuat va do phu hop voi cong viec quan trong hon gia vao cua. Gia re nhung sai bai toan se ton hon rat nhanh.',
            },
            {
              q: 'Co nen kiem tra truoc khi dua xe cu vao lam viec chinh thuc khong?',
              a: 'Nen. Day la buoc giup phat hien som cac diem hao mon va tranh dung may ngay trong giai doan dau van hanh.',
            },
          ])}
          <h2>Ket luan</h2>
          <p>Xe nang cu thanh ly co the la lua chon hop ly neu doanh nghiep mua dung bai toan va nhin du chi phi sau mua. Khoa truoc tai trong, moi truong va muc chap nhan rui ro se giup quyet dinh nay an toan hon nhieu.</p>
        </div>
      `,
    },
  ];
}

async function main() {
  const uploadedPath = process.argv[2];
  if (!uploadedPath) {
    throw new Error('Usage: node scripts/seo/refresh_service_pages_2026_05_25.mjs <uploaded.json>');
  }

  const uploaded = JSON.parse(await fs.readFile(uploadedPath, 'utf8'));
  const uploadedMap = Array.isArray(uploaded)
    ? uploaded.reduce((acc, item) => {
        const match = item.key.match(/^services\/(.+)-(thumb|inline-\d+)\.(png|jpg|jpeg)$/);
        if (!match) return acc;
        const [, slug, slot] = match;
        if (!acc[slug]) acc[slug] = { inline: [] };
        if (slot === 'thumb') {
          acc[slug].thumbnail = item.url;
        } else {
          const index = Number(slot.replace('inline-', '')) - 1;
          acc[slug].inline[index] = item.url;
        }
        return acc;
      }, {})
    : uploaded;

  const services = buildServices(uploadedMap);

  const clientConfig = process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT || 5432),
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
      };

  const client = new Client(clientConfig);
  await client.connect();

  try {
    await client.query('BEGIN');
    for (const item of services) {
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

      if (!existing.rowCount) {
        throw new Error(`Service slug not found: ${item.slug}`);
      }

      const serviceId = existing.rows[0].id;

      await client.query(
        `
          UPDATE services
          SET thumbnail = $1,
              is_active = true,
              updated_at = now()
          WHERE id = $2
        `,
        [item.thumbnail, serviceId],
      );

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
              updated_at = now()
          WHERE service_id = $11 AND locale = 'vi'
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
        ],
      );
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }

  process.stdout.write(JSON.stringify(services.map(({ slug, title, thumbnail }) => ({ slug, title, thumbnail })), null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
