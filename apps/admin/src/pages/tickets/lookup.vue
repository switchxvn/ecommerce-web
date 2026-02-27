<script setup lang="ts">
import { useTrpc } from '@/composables/useTrpc';
import { PrinterIcon, SearchIcon, UserIcon } from 'lucide-vue-next';
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import PageHeader from '../../components/common/header/PageHeader.vue';
import PhoneInput from '../../components/form/PhoneInput.vue';
import TicketPrintModal from '../../components/tickets/TicketPrintModal.vue';
import { useLocalization } from "../../composables/useLocalization";

// Mock toast function để tránh lỗi SSR với vue-toastification
const toast = {
  success: (msg: string) => console.log('SUCCESS:', msg),
  error: (msg: string) => console.log('ERROR:', msg),
  warning: (msg: string) => console.log('WARNING:', msg),
  info: (msg: string) => console.log('INFO:', msg)
};

// Nếu chạy ở client side, thì mới import useToast
if (process.client) {
  import('vue-toastification').then((module) => {
    const useToast = module.useToast;
    if (typeof useToast === 'function') {
      const clientToast = useToast();
      toast.success = clientToast.success;
      toast.error = clientToast.error;
      toast.warning = clientToast.warning;
      toast.info = clientToast.info;
    }
  }).catch(err => {
    console.error('Failed to load toast module:', err);
  });
}

// Định nghĩa kiểu dữ liệu
interface ScanResult {
  success: boolean;
  message: string;
  orderItem?: {
    id: number;
    qrCode: string;
    orderId: number;
    quantity?: number;
    isUsed: boolean;
    travelDate?: string;
    productType?: string;
    productSnapshot?: {
      id: number;
      title: string;
      variant?: {
        id: number;
        name: string;
        price: number;
      };
      translations: {
        locale: string;
        title: string;
        description?: string;
      }[];
    };
    product?: {
      translations?: {
        title: string;
      }[];
    };
    order?: {
      orderCode: string;
      status?: string;
      customerName?: string;
      email?: string;
      phoneNumber?: string;
      phoneCode?: string;
      createdAt: string;
      paymentStatus: string;
    };
  };
  scanHistory?: any;
  isFirstScan?: boolean;
  scanCount?: number;
}

interface ScanHistory {
  id: number;
  scannedAt: string;
  scannedBy: string;
  location?: string;
  orderItemId?: number;
  deviceInfo?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
  scanner?: {
    id?: string;
    email?: string;
    profile?: {
      firstName?: string;
      lastName?: string;
    };
  };
  orderItem?: any;
  isFirstScan?: boolean;
  scanCount?: number;
}

interface CustomerTicket {
  id: number;
  qrCode: string;
  orderId: number;
  quantity?: number;
  isUsed: boolean;
  travelDate?: string;
  productType?: string;
  productSnapshot?: {
    id: number;
    title: string;
    variant?: {
      id: number;
      name: string;
      price: number;
    };
    translations: {
      locale: string;
      title: string;
      description?: string;
    }[];
  };
  product?: {
    translations?: {
      title: string;
    }[];
  };
  order?: {
    orderCode: string;
    status: string;
    customerName?: string;
    phoneNumber?: string;
    phoneCode?: string;
    email?: string;
    createdAt: string;
    paymentStatus: string;
  };
  scanCount?: number;
}

// Kiểu dữ liệu cho kích thước in ấn
interface PrintSize {
  id: string;
  name: string;
  width: string;
  height: string;
  description?: string;
}

// Định nghĩa kiểu cho Setting
interface Setting {
  id: number;
  key: string;
  value: string;
  group?: string;
  description?: string;
  is_public: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const { t } = useLocalization();
const trpc = useTrpc();

// State refs
const qrCode = ref('');
const isLoading = ref(false);
const scanResult = ref<ScanResult | null>(null);
const showHistory = ref(false);
const scanHistories = ref<ScanHistory[]>([]);
const historyOrderItemId = ref<number | null>(null);
const isLoadingHistory = ref(false);
const errorMessage = ref('');

// Tìm kiếm khách hàng
const customerEmail = ref('');
const customerPhone = ref('');
const customerPhoneCode = ref('+84');
const isSearchingCustomer = ref(false);
const customerTickets = ref<CustomerTicket[]>([]);
const showCustomerSearch = ref(false);
const customerTip = ref(true);
const ticketStatus = ref('');
const orderDateRange = ref({
  start: null as string | null,
  end: null as string | null,
});

// In ấn
const showPrintModal = ref(false);
const selectedTicket = ref<CustomerTicket | null>(null);
const selectedPrintSize = ref('XP_PRINTER');
const isPrinting = ref(false);
const printSizes = ref<PrintSize[]>([
  { id: 'XP_PRINTER', name: 'Máy in XP', width: '72mm', height: '297mm', description: 'Khổ máy in XP (72mm)' },
  { id: 'A4', name: 'A4', width: '210mm', height: '297mm', description: 'Khổ tiêu chuẩn A4' },
  { id: 'A5', name: 'A5', width: '148mm', height: '210mm', description: 'Khổ nhỏ A5 (nửa A4)' },
  { id: 'TICKET', name: 'Vé nhỏ', width: '80mm', height: '180mm', description: 'Khổ vé nhỏ' },
  { id: 'LABEL', name: 'Nhãn vé', width: '50mm', height: '30mm', description: 'Nhãn vé nhỏ' }
]);

const debounceTimer = ref<NodeJS.Timeout | null>(null);

// Cấu hình in vé
const ticketSettings = ref({
  title: 'VÉ CÁP TREO NÚI SAM',
  subtitle: 'Châu Đốc, An Giang',
  hotline: 'Hotline: 0869 519 678',
  location: 'KDL Cáp Treo',
  footer: 'Vui lòng giữ vé cẩn thận và trình cho nhân viên khi vào cổng',
  thankYou: 'Cảm ơn quý khách đã lựa chọn dịch vụ của chúng tôi!',
  logo: '',
  qrSize: '175',
  backgroundColor: '#ffffff',
  textColor: '#000000',
  borderColor: '#cccccc',
  label: {
    title: 'VÉ CÁP TREO NÚI SAM',
    footer: 'Vui lòng giữ vé cẩn thận',
    qrSize: '70',
    fontSize: '6',
    padding: '3mm',
    headerFontSize: '8'
  }
});

// Methods
const scanTicket = async () => {
  if (!qrCode.value) {
    toast.error(t('Vui lòng nhập mã QR'));
    return;
  }

  // Reset trạng thái lỗi và kết quả trước đó
  errorMessage.value = '';
  scanResult.value = null;

  console.log('Tra cứu mã QR:', qrCode.value);
  isLoading.value = true;
  
  // Lưu giá trị QR tạm thời
  const scannedQrCode = qrCode.value;
  
  // Reset input ngay lập tức để sẵn sàng cho lần quét tiếp theo
  qrCode.value = '';
  
  try {
    // Kiểm tra vé 
    const orderItem = await trpc.admin.ticketScanner.getTicketByQrCode.query({
      qrCode: scannedQrCode
    });
    
    if (orderItem) {
      scanResult.value = {
        success: true,
        message: orderItem.isUsed 
          ? 'Vé hợp lệ nhưng đã được sử dụng trước đó.'
          : 'Vé hợp lệ và chưa sử dụng.',
        orderItem: orderItem,
        isFirstScan: !orderItem.isUsed,
        scanCount: orderItem.scanCount || 0
      };
      
      // Tải lịch sử quét của vé này để hiển thị
      if (orderItem.id) {
        historyOrderItemId.value = orderItem.id;
        loadScanHistory(orderItem.id);
        showHistory.value = true;
      }
    } else {
      errorMessage.value = t('Không tìm thấy vé với mã QR này');
      toast.error(errorMessage.value);
    }
  } catch (error: any) {
    console.error('Error looking up ticket:', error);
    console.error('Error details:', error?.data?.httpStatus, error?.message);
    
    // Hiển thị thông báo lỗi cụ thể từ server nếu có
    let msg = t('Không tìm thấy thông tin vé');
    
    if (error?.message) {
      // Hiển thị thông báo lỗi cụ thể từ server
      msg = error.message;
    } else if (error?.data?.message) {
      // Hiển thị thông báo lỗi từ TRPC response
      msg = error.data.message;
    }
    
    // Lưu thông báo lỗi để hiển thị trong UI
    errorMessage.value = msg;
    toast.error(msg);
  } finally {
    isLoading.value = false;
    
    // Focus lại vào input sau khi xử lý xong
    setTimeout(() => {
      const qrInput = document.getElementById('qr-input');
      if (qrInput) {
        qrInput.focus();
      }
    }, 100);
  }
};

// Tìm kiếm vé theo thông tin khách hàng (email hoặc số điện thoại)
const searchCustomerTickets = async () => {
  if (!customerEmail.value && !customerPhone.value) {
    toast.error(t('Vui lòng nhập email hoặc số điện thoại của khách hàng'));
    return;
  }

  customerTickets.value = [];
  isSearchingCustomer.value = true;
  errorMessage.value = '';

  try {
    const searchTerm = customerEmail.value || (customerPhone.value ? customerPhone.value : '');
    const result = await trpc.admin.ticketScanner.searchCustomerTickets.query({
      searchTerm: searchTerm,
      ticketStatus: ticketStatus.value || undefined,
      startOrderDate: orderDateRange.value.start || undefined,
      endOrderDate: orderDateRange.value.end || undefined
    });

    if (result && result.length > 0) {
      customerTickets.value = result as CustomerTicket[];
    } else {
      toast.warning(t('Không tìm thấy vé nào cho khách hàng này'));
    }
  } catch (error: any) {
    console.error('Error searching customer tickets:', error);
    let errorMsg = t('Lỗi khi tìm kiếm thông tin vé của khách hàng');
    
    if (error?.message) {
      errorMsg = error.message;
    } else if (error?.data?.message) {
      errorMsg = error.data.message;
    }
    
    toast.error(errorMsg);
  } finally {
    isSearchingCustomer.value = false;
  }
};

// Xem thông tin vé được tìm thấy từ khách hàng
const viewCustomerTicket = (ticketQrCode: string) => {
  qrCode.value = ticketQrCode;
  scanTicket();
};

// Toggle hiển thị phần tìm kiếm khách hàng
const toggleCustomerSearch = () => {
  showCustomerSearch.value = !showCustomerSearch.value;
  if (showCustomerSearch.value) {
    // Reset dữ liệu khi hiển thị form tìm kiếm
    customerEmail.value = '';
    customerPhone.value = '';
    customerTickets.value = [];
  }
};

// Đóng phần tip hướng dẫn
const closeTip = () => {
  customerTip.value = false;
};

// Load scan history for a specific ticket
const loadScanHistory = async (orderItemId: number) => {
  if (!orderItemId) return;
  
  isLoadingHistory.value = true;
  try {
    const result = await trpc.admin.ticketScanner.getTicketScanHistory.query({
      orderItemId: orderItemId,
      page: 1,
      pageSize: 10
    });
    
    // Thêm số thứ tự quét cho mỗi lịch sử
    if (result.items && result.items.length > 0) {
      scanHistories.value = result.items.map((history, index) => {
        // Thứ tự ngược lại vì danh sách được sắp xếp theo thời gian mới nhất
        // (lần quét gần nhất sẽ có index = 0)
        const scanNumber = result.items.length - index;
        return {
          ...history,
          scanCount: history.isFirstScan ? 1 : scanNumber
        };
      });
    } else {
      scanHistories.value = [];
    }
  } catch (error) {
    console.error('Error loading scan history:', error);
    toast.error(t('Không thể tải lịch sử quét vé'));
  } finally {
    isLoadingHistory.value = false;
  }
};

// Format date
const formatDate = (date: string | undefined) => {
  if (!date) return '';
  return new Date(date).toLocaleString();
};

// Format ngày theo kiểu Việt Nam
const formatVietnameseDate = (date: Date): string => {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  
  // Định dạng "22 tháng 03 năm 2023 (22/03/2023)"
  return `${day} tháng ${month < 10 ? '0' + month : month} năm ${year}`;
};

// Mở modal in vé
const openPrintModal = (ticket: CustomerTicket) => {
  // Đảm bảo thông tin khách hàng luôn có sẵn
  // Nếu không có order, tạo một order mới với thông tin từ order hiện tại
  const enhancedTicket: CustomerTicket = {
    ...ticket,
    order: ticket.order ? {
      ...ticket.order,
      customerName: ticket.order.customerName || '',
      email: ticket.order.email || '',
      phoneNumber: ticket.order.phoneNumber || '',
      phoneCode: ticket.order.phoneCode || ''
    } : {
      orderCode: '',
      status: '',
      customerName: '',
      email: '',
      phoneNumber: '',
      phoneCode: '',
      createdAt: '',
      paymentStatus: ''
    }
  };
  
  selectedTicket.value = enhancedTicket;
  showPrintModal.value = true;
};

// Tải cấu hình in vé từ Settings
const loadTicketPrintSettings = async () => {
  try {
    // Lấy cài đặt theo group 'ticket'
    const settingsData = await trpc.admin.setting.getAllSettings.query() as any;
    
    // Kiểm tra xem settingsData có tồn tại không
    if (!settingsData) return;
    
    // Lọc các settings bắt đầu bằng 'ticket.print.'
    const printSettings = Array.isArray(settingsData) ? 
      settingsData.filter((setting: any) => setting.key && setting.key.startsWith('ticket.print.')) : 
      [];
    
    if (printSettings.length > 0) {
      // Tạo map từ settings
      const settingsMap: Record<string, string> = {};
      const labelSettingsMap: Record<string, string> = {};
      
      printSettings.forEach((setting: any) => {
        if (setting.key.startsWith('ticket.print.label.')) {
          const key = setting.key.replace('ticket.print.label.', '');
          labelSettingsMap[key] = setting.value;
        } else {
          const key = setting.key.replace('ticket.print.', '');
          settingsMap[key] = setting.value;
        }
      });
      
      // Cập nhật cấu hình - sử dụng đối tượng mới
      ticketSettings.value = {
        title: settingsMap.title || 'VÉ THAM QUAN',
        subtitle: settingsMap.subtitle || '',
        location: settingsMap.location || 'KDL Cáp Treo',
        hotline: settingsMap.hotline || '0869 519 678',
        footer: settingsMap.footer || 'Vui lòng giữ vé cẩn thận và trình cho nhân viên khi vào cổng',
        thankYou: settingsMap.thankYou || 'Cảm ơn quý khách đã lựa chọn dịch vụ của chúng tôi!',
        logo: settingsMap.logo || '',
        qrSize: settingsMap.qrSize || '175',
        backgroundColor: settingsMap.backgroundColor || '#ffffff',
        textColor: settingsMap.textColor || '#000000',
        borderColor: settingsMap.borderColor || '#cccccc',
        label: {
          title: labelSettingsMap.title || 'VÉ THAM QUAN',
          footer: labelSettingsMap.footer || 'Vui lòng giữ vé cẩn thận',
          qrSize: labelSettingsMap.qrSize || '70',
          fontSize: labelSettingsMap.fontSize || '6',
          padding: labelSettingsMap.padding || '3mm',
          headerFontSize: labelSettingsMap.headerFontSize || '8'
        }
      };
    }
  } catch (error) {
    console.error('Error loading ticket print settings:', error);
  }
};

// In vé
const printTicket = async (size: string) => {
  if (!selectedTicket.value) return;
  
  isPrinting.value = true;
  try {
    // Debug thông tin khách hàng
   
    
    // Chuẩn bị nội dung in
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error(t('Không thể mở cửa sổ in. Vui lòng kiểm tra cài đặt chặn popup trên trình duyệt.'));
      return;
    }
    
    // Lấy size in đã chọn
    const selectedSize = printSizes.value.find(s => s.id === size);
    const isLabel = size === 'LABEL';
    const isXPPrinter = size === 'XP_PRINTER';
    
    // Tạo CSS cho trang in
    const printCSS = `
      @page {
        size: ${selectedSize?.width} ${selectedSize?.height};
        margin: 0;
      }
      @media print {
        body {
          margin: 0;
          padding: 0;
          width: ${selectedSize?.width};
          height: ${selectedSize?.height};
        }
        .print-container {
          width: 100%;
          height: 100%;
          page-break-after: always;
        }
      }
      body {
        font-family: 'Arial', sans-serif;
        margin: 0;
        padding: 0;
        background-color: ${ticketSettings.value.backgroundColor};
      }
      .print-container {
        padding: ${isLabel ? ticketSettings.value.label.padding : isXPPrinter ? '6mm' : '10mm'};
        box-sizing: border-box;
        border: 1px solid ${ticketSettings.value.borderColor};
        background-color: ${ticketSettings.value.backgroundColor};
        color: ${ticketSettings.value.textColor};
      }
      .ticket-header {
        text-align: center;
      }
      .ticket-header h1 {
        font-size: ${isLabel ? `${ticketSettings.value.label.headerFontSize}pt` : isXPPrinter ? '13pt' : '16pt'};
        margin: 0 0 ${isLabel ? '1mm' : '2mm'} 0;
        font-weight: bold;
        color: ${ticketSettings.value.textColor};
      }
      .ticket-header h2 {
        font-size: ${isLabel ? '5.6pt' : isXPPrinter ? '11pt' : '14pt'};
        margin: ${isLabel ? '1mm' : '2mm'} 0;
        font-weight: normal;
        color: ${ticketSettings.value.textColor};
      }
      .ticket-header div {
        font-size: ${isLabel ? '4.8pt' : isXPPrinter ? '10pt' : '12pt'};
      }
      .ticket-info {
        margin-bottom: ${isLabel ? '2mm' : '5mm'};
      }
      .info-row {
        display: flex;
        margin-bottom: ${isLabel ? '1mm' : '2mm'};
        font-size: ${isLabel ? '4.8pt' : isXPPrinter ? '10pt' : '11pt'};
      }
      .info-label {
        font-weight: bold;
        width: ${isLabel ? '40%' : '35%'};
      }
      .info-value {
        flex: 1;
      }
      .ticket-qr {
        text-align: center;
        margin: ${isLabel ? '3mm auto' : isXPPrinter ? '4mm auto' : '5mm auto'};
        padding: ${isLabel ? '2mm' : isXPPrinter ? '2mm' : '3mm'};
        border: 1px dashed #e0e0e0;
        border-radius: ${isLabel ? '2mm' : isXPPrinter ? '2mm' : '3mm'};
        background-color: #f9f9f9;
        width: ${isLabel ? '90%' : isXPPrinter ? '90%' : '60mm'};
        margin-left: auto;
        margin-right: auto;
      }
      .ticket-qr img {
        max-width: 100%;
        height: auto;
        margin: 0 auto;
        display: block;
        ${isXPPrinter ? 'width: 126px; height: 126px;' : ''}
      }
      .ticket-qr .mt-2 {
        margin-top: ${isLabel ? '1mm' : isXPPrinter ? '1.5mm' : '2mm'};
      }
      .ticket-qr .text-center {
        text-align: center;
      }
      .ticket-qr .font-bold {
        font-weight: bold;
        font-size: ${isLabel ? '4.8pt' : isXPPrinter ? '8pt' : '9pt'};
      }
      .ticket-footer {
        margin-top: ${isLabel ? '2mm' : isXPPrinter ? '3mm' : '5mm'};
        text-align: center;
        font-size: ${isLabel ? '4.8pt' : isXPPrinter ? '8pt' : '9pt'};
        color: #666;
        border-top: ${isLabel ? 'none' : '1px solid #ddd'};
        padding-top: ${isLabel ? '1mm' : isXPPrinter ? '1.5mm' : '3mm'};
      }
      .customer-info {
        margin-top: ${isLabel ? '2mm' : isXPPrinter ? '3mm' : '5mm'};
        padding: ${isLabel ? '2mm' : isXPPrinter ? '2mm' : '5mm'};
        border: 1px dashed #ccc;
        border-radius: ${isLabel ? '2mm' : isXPPrinter ? '2mm' : '3mm'};
        background-color: #f9f9f9;
      }
      .customer-info-title {
        font-weight: bold;
        margin-bottom: ${isLabel ? '1mm' : isXPPrinter ? '1.5mm' : '2mm'};
        font-size: ${isLabel ? '5.6pt' : isXPPrinter ? '10pt' : '12pt'};
        text-align: center;
        color: #444;
      }
      .customer-detail {
        margin-bottom: ${isLabel ? '1mm' : isXPPrinter ? '1mm' : '2mm'};
        font-size: ${isLabel ? '4.8pt' : isXPPrinter ? '9pt' : '11pt'};
      }
    `;
    
    // Tạo nội dung HTML cho trang in
    const ticket = selectedTicket.value;
    const qrCodeSize = isLabel ? ticketSettings.value.label.qrSize : isXPPrinter ? '126' : ticketSettings.value.qrSize;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${qrCodeSize}x${qrCodeSize}&data=${encodeURIComponent(ticket.qrCode)}`;
    
    // Format ngày đi nếu có
    let travelDateDisplay = '';
    if (ticket.travelDate) {
      const travelDate = new Date(ticket.travelDate);
      travelDateDisplay = formatVietnameseDate(travelDate);
    }
    
    // Lấy tên sản phẩm từ productSnapshot hoặc product
    const productTitle = getProductTitle(ticket);
    
    // Lấy thông tin variant nếu có
    const variantInfo = ticket.productSnapshot?.variant ? 
      `${ticket.productSnapshot.variant.name} - ${formatCurrency(ticket.productSnapshot.variant.price)}` : '';
    
    // Header và footer content dựa trên kích thước in
    let headerContent = '';
    let footerContent = '';
    
    if (isLabel) {
      // Simplified content for small label
      headerContent = `
        <h1>${ticketSettings.value.label.title}</h1>
      `;
      footerContent = `
        <div>Mã QR: ${ticket.qrCode}</div>
        <div>${ticketSettings.value.location}</div>
        <div>${ticketSettings.value.label.footer}</div>
      `;
    } else {
      // Full content for larger sizes
      headerContent = `
        <h1>${ticketSettings.value.title}</h1>
        <h2>${ticketSettings.value.subtitle}</h2>
        <h3>${ticketSettings.value.hotline}</h3>
      `;
      footerContent = `
        <div>${ticketSettings.value.footer}</div>
        <div class="mt-2 text-sm font-medium text-blue-600">${ticketSettings.value.thankYou}</div>
      `;
    }
    
    // Thêm logo nếu có
    const logoHtml = ticketSettings.value.logo && !isLabel ? 
      `<div class="ticket-logo"><img src="${ticketSettings.value.logo}" alt="Logo" style="max-width: 60px; margin-bottom: 3mm;"/></div>` : 
      '';
    
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>In vé</title>
        <style>${printCSS}</style>
      </head>
      <body>
        <div class="print-container">
          <div class="ticket-header">
            ${logoHtml}
            ${headerContent}
          </div>
          
          ${!isLabel ? `
          <div class="ticket-info">
            <div class="info-row">
              <div class="info-label">Mã ĐH:</div>
              <div class="info-value">${ticket.order?.orderCode || ''}</div>
            </div>
           
            ${ticket.travelDate ? `
            <div class="info-row">
              <div class="info-label">Ngày đi:</div>
              <div class="info-value">${travelDateDisplay}</div>
            </div>
            ` : ''}
            <div class="info-row">
              <div class="info-label">Trạng thái:</div>
              <div class="info-value">${ticket.isUsed ? 'Đã sử dụng' : 'Chưa sử dụng'}</div>
            </div>
          
            ${ticket.productSnapshot?.variant ? `
            <div class="info-row">
              <div class="info-label">Loại vé:</div>
              <div class="info-value">${ticket.productSnapshot.variant.name} - ${formatCurrency(ticket.productSnapshot.variant.price)}</div>
            </div>
            ` : ''}

            ${ticket.order?.customerName ? `
            <div class="info-row">
              <div class="info-label">KH:</div>
              <div class="info-value">${ticket.order.customerName}</div>
            </div>
            ` : ''}
         
          </div>
          ` : `
          <div class="ticket-info">
            ${ticket.travelDate ? `
            <div class="info-row">
              <div class="info-label">Ngày:</div>
              <div class="info-value">${formatVietnameseDate(new Date(ticket.travelDate))}</div>
            </div>
            ` : ''}
            ${ticket.productSnapshot?.variant ? `
            <div class="info-row">
              <div class="info-label">Loại:</div>
              <div class="info-value">${ticket.productSnapshot.variant.name}</div>
            </div>
            ` : ''}
            ${ticket.order?.customerName ? `
            <div class="info-row">
              <div class="info-label">Khách:</div>
              <div class="info-value">${ticket.order.customerName}</div>
            </div>
            ` : ''}
            ${ticket.order?.phoneNumber ? `
            <div class="info-row">
              <div class="info-label">SĐT:</div>
              <div class="info-value">${ticket.order.phoneCode} ${ticket.order.phoneNumber}</div>
            </div>
            ` : ''}
          </div>
          `}
          
          <div class="ticket-qr">
            <img src="${qrCodeUrl}" alt="QR Code" />
            <div class="mt-2 text-center font-bold">${ticket.qrCode}</div>
          </div>
          
          <div class="ticket-footer">
            ${footerContent}
          </div>
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Hiển thị thông báo đang chờ tải QR code
    toast.info(t('Đang chờ tải hình ảnh QR...'));
    
    // Thiết lập thời gian tối đa chờ để tránh trường hợp không thể tải được hình
    const maxWaitTime = setTimeout(() => {
      try {
        printWindow.print();
        printWindow.close();
        
        // Đóng modal sau khi in
        showPrintModal.value = false;
        selectedTicket.value = null;
        selectedPrintSize.value = 'XP_PRINTER'; // Reset lại kích thước in mặc định
        
        toast.success(t('Đã gửi lệnh in vé'));
      } catch (error) {
        console.error('Timeout when loading QR code, but still try to print:', error);
        toast.warning(t('Hình QR có thể chưa tải hoàn tất, nhưng vẫn tiến hành in'));
      }
    }, 5000); // Thời gian chờ tối đa 5 giây
    
    // Kiểm tra khi hình ảnh đã tải xong
    const checkImagesLoaded = () => {
      // Chờ để DOM được render
      setTimeout(() => {
        const images = printWindow.document.querySelectorAll('img');
        let loadedImages = 0;
        
        if (images.length === 0) {
          // Không có hình ảnh, tiến hành in luôn
          clearTimeout(maxWaitTime);
          printWindow.print();
          printWindow.close();
          
          // Đóng modal sau khi in
          showPrintModal.value = false;
          selectedTicket.value = null;
          selectedPrintSize.value = 'XP_PRINTER';
          
          toast.success(t('Đã gửi lệnh in vé'));
          return;
        }
        
        // Đếm số lượng hình ảnh đã tải
        const onImageLoad = () => {
          loadedImages++;
          
          // Khi tất cả hình ảnh đã tải xong
          if (loadedImages === images.length) {
            clearTimeout(maxWaitTime);
            toast.success(t('Hình ảnh QR đã tải xong, đang tiến hành in...'));
            
            // Thêm một khoảng thời gian ngắn để đảm bảo mọi thứ đã sẵn sàng
            setTimeout(() => {
              printWindow.print();
              printWindow.close();
              
              // Đóng modal sau khi in
              showPrintModal.value = false;
              selectedTicket.value = null;
              selectedPrintSize.value = 'XP_PRINTER';
              
              toast.success(t('Đã gửi lệnh in vé'));
            }, 500);
          }
        };
        
        // Kiểm tra từng hình ảnh
        images.forEach(img => {
          if (img.complete) {
            loadedImages++;
          } else {
            img.addEventListener('load', onImageLoad);
            img.addEventListener('error', onImageLoad); // Đếm cả khi lỗi
          }
        });
        
        // Nếu tất cả đã tải xong ngay từ đầu
        if (loadedImages === images.length) {
          clearTimeout(maxWaitTime);
          toast.success(t('Hình ảnh QR đã tải xong, đang tiến hành in...'));
          
          setTimeout(() => {
            printWindow.print();
            printWindow.close();
            
            // Đóng modal sau khi in
            showPrintModal.value = false;
            selectedTicket.value = null;
            selectedPrintSize.value = 'XP_PRINTER';
            
            toast.success(t('Đã gửi lệnh in vé'));
          }, 500);
        }
      }, 100); // Đợi 100ms để đảm bảo DOM đã render
    };
    
    // Gọi hàm kiểm tra khi hình ảnh đã tải xong
    checkImagesLoaded();
  } catch (error) {
    console.error('Error printing ticket:', error);
    toast.error(t('Lỗi khi in vé'));
  } finally {
    isPrinting.value = false;
  }
};

// Đóng modal in vé
const closePrintModal = () => {
  showPrintModal.value = false;
  selectedTicket.value = null;
};

// Reset error message
const resetError = () => {
  errorMessage.value = '';
};

// Auto-scan on paste or when the value is long enough (for barcode scanners)
const handleInput = () => {
  // Reset error message khi người dùng nhập mã QR mới
  if (errorMessage.value) {
    resetError();
  }
  
  // Hủy timer cũ nếu có
  if (debounceTimer.value) {
    clearTimeout(debounceTimer.value);
  }
  
  // Chỉ tự động quét khi đủ số ký tự
  if (qrCode.value.length >= 15) {
    // Đặt một timer để đợi máy quét hoàn thành (500ms)
    debounceTimer.value = setTimeout(() => {
      scanTicket();
    }, 500);
  }
};

// Thêm handler cho sự kiện keydown
const handleKeyDown = (e: KeyboardEvent) => {
  // Nếu nhấn Enter, thực hiện quét ngay lập tức
  if (e.key === 'Enter' && qrCode.value) {
    // Hủy timer debounce nếu có
    if (debounceTimer.value) {
      clearTimeout(debounceTimer.value);
      debounceTimer.value = null;
    }
    
    // Thực hiện quét ngay
    scanTicket();
  }
};

// Auto-focus on QR input when component is mounted
onMounted(() => {
  const qrInput = document.getElementById('qr-input');
  if (qrInput) {
    qrInput.focus();
  }
  
  // Tải cấu hình in vé
  loadTicketPrintSettings();
});

// Format tên người dùng từ user profile
const formatUserName = (history: ScanHistory) => {
  // Nếu có profile với first name và last name
  if (history.scanner?.profile?.firstName && history.scanner?.profile?.lastName) {
    return `${history.scanner.profile.firstName} ${history.scanner.profile.lastName}`;
  }
  
  // Nếu chỉ có first name
  if (history.scanner?.profile?.firstName) {
    return history.scanner.profile.firstName;
  }
  
  // Nếu chỉ có last name
  if (history.scanner?.profile?.lastName) {
    return history.scanner.profile.lastName;
  }
  
  // Nếu có email
  if (history.scanner?.email) {
    return history.scanner.email;
  }
  
  // Trường hợp mặc định hiển thị userId
  return history.scannedBy || t('Unknown');
};

// Thêm hàm lấy tiêu đề sản phẩm từ productSnapshot hoặc product
const getProductTitle = (item: any): string => {
  if (item?.productSnapshot?.translations && item.productSnapshot.translations.length > 0) {
    // Ưu tiên lấy từ productSnapshot, tìm tiêu đề tiếng Việt trước
    const viTranslation = item.productSnapshot.translations.find((t: any) => t.locale === 'vi');
    if (viTranslation) return viTranslation.title;
    
    // Nếu không có tiếng Việt, lấy tiêu đề đầu tiên
    return item.productSnapshot.translations[0].title;
  }
  
  // Fallback to product translations
  if (item?.product?.translations && item.product.translations.length > 0) {
    return item.product.translations[0].title;
  }
  
  return t('products.unknown');
};

// Lấy thông tin variant từ productSnapshot
const getVariantInfo = (item: any): string => {
  if (item?.productSnapshot?.variant) {
    return `${item.productSnapshot.variant.name} - ${formatCurrency(item.productSnapshot.variant.price)}`;
  }
  return '';
};

// Format tiền tệ
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

// Thêm hàm kiểm tra vé quá hạn
const isTicketExpired = (ticket: any): boolean => {
  if (!ticket.travelDate) return false;
  const travelDate = new Date(ticket.travelDate);
  const today = new Date();
  // Reset time to compare dates only
  travelDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return travelDate < today;
};

// Thêm hàm kiểm tra vé chưa thanh toán
const isTicketUnpaid = (ticket: any): boolean => {
  return ticket.order?.paymentStatus !== 'paid';
};

// Thêm hàm kiểm tra vé có thể in được không
const canPrintTicket = (ticket: any): boolean => {
  return !isTicketExpired(ticket) && !isTicketUnpaid(ticket);
};

// Thêm hàm lấy thông báo lý do không thể in vé
const getPrintDisabledReason = (ticket: any): string => {
  if (isTicketExpired(ticket)) {
    return t('Không thể in vé quá hạn');
  }
  if (isTicketUnpaid(ticket)) {
    return t('Không thể in vé chưa thanh toán');
  }
  return t('In vé');
};
</script>

<template>
  <div class="p-4 space-y-6">
    <!-- Header -->
    <PageHeader
      :title="t('Tra cứu vé')"
      :description="t('Tra cứu thông tin vé và in ấn')"
    />

    <div class="bg-white p-6 rounded-lg shadow-md">
      <h2 class="text-xl font-semibold mb-4">{{ t('Tra cứu mã QR') }}</h2>
      
      <div class="mb-6">
        <label for="qr-input" class="block text-sm font-medium text-gray-700 mb-2">
          {{ t('Nhập mã QR') }}
        </label>
        <div class="flex space-x-2">
          <input
            id="qr-input"
            v-model="qrCode"
            @input="handleInput"
            @keydown="handleKeyDown"
            type="text"
            class="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            :placeholder="t('Nhập hoặc quét mã QR')"
            :disabled="isLoading"
          />
          <button
            @click="scanTicket"
            :disabled="isLoading || !qrCode"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            <span v-if="isLoading">{{ t('Đang tra cứu...') }}</span>
            <span v-else>{{ t('Tra cứu') }}</span>
          </button>
        </div>
        <p class="text-sm text-gray-500 mt-2">
          {{ t('Sử dụng máy quét mã QR hoặc nhập mã thủ công') }}
        </p>
        <p class="text-sm font-medium text-blue-600 mt-1">
          {{ t('Nếu sử dụng máy quét mã vạch, vui lòng nhấn Enter sau khi quét hoặc đợi hệ thống tự xử lý.') }}
        </p>
      </div>

      <!-- Nút chuyển đổi sang tìm kiếm theo thông tin khách hàng -->
      <button 
        @click="toggleCustomerSearch" 
        class="mb-6 flex items-center space-x-2 text-blue-600 hover:text-blue-800"
      >
        <UserIcon class="w-4 h-4" />
        <span>{{ showCustomerSearch ? t('Quay lại tra cứu mã QR') : t('Tìm theo thông tin khách hàng') }}</span>
      </button>

      <!-- Tìm kiếm theo thông tin khách hàng -->
      <div v-if="showCustomerSearch" class="mb-6 p-6 bg-blue-50 rounded-lg border border-blue-100">
        <h3 class="text-lg font-semibold mb-4 text-blue-800">{{ t('Tìm vé theo thông tin khách hàng') }}</h3>
        
        <!-- Hướng dẫn tìm vé -->
        <div v-if="customerTip" class="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg relative">
          <button @click="closeTip" class="absolute top-2 right-2 text-yellow-500 hover:text-yellow-700">
            <span class="sr-only">Close</span>
            <i class="fas fa-times"></i>
          </button>
          <div class="flex items-start">
            <div class="flex-shrink-0 text-yellow-500">
              <i class="fas fa-lightbulb text-xl"></i>
            </div>
            <div class="ml-3">
              <h4 class="text-sm font-bold text-yellow-800">{{ t('Mẹo tìm kiếm:') }}</h4>
              <ul class="mt-1 text-sm text-yellow-700 list-disc pl-5 space-y-1">
                <li>{{ t('Nhập đúng email hoặc số điện thoại để tìm chính xác') }}</li>
                <li>{{ t('Có thể tìm kiếm vé theo trạng thái đã/chưa sử dụng') }}</li>
                <li>{{ t('Sử dụng bộ lọc ngày đặt hàng để thu hẹp kết quả') }}</li>
              </ul>
            </div>
          </div>
        </div>
        
        <!-- Form tìm kiếm -->
        <div class="space-y-4">
          <p class="text-sm text-gray-600">{{ t('Nhập email hoặc số điện thoại để tìm vé, có thể tìm theo 1 trong 2 thông tin') }}</p>
          
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <!-- Email input -->
            <div>
              <label for="customer-email" class="block text-sm font-medium text-gray-700 mb-1">
                {{ t('Email khách hàng') }}
              </label>
              <input
                id="customer-email"
                v-model="customerEmail"
                type="email"
                class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 h-[42px]"
                :placeholder="t('Nhập email khách hàng')"
                :disabled="isSearchingCustomer"
              />
            </div>
            
            <!-- Phone input -->
            <div>
              <label for="customer-phone" class="block text-sm font-medium text-gray-700 mb-1">
                {{ t('Số điện thoại khách hàng') }}
              </label>
              <PhoneInput
                v-model="customerPhone"
                v-model:phoneCode="customerPhoneCode"
                :disabled="isSearchingCustomer"
                :placeholder="t('Nhập số điện thoại')"
                class="phone-input-scanner"
              />
            </div>
          </div>
          
          <!-- Bộ lọc bổ sung -->
          <div class="mt-4 border-t pt-4 border-blue-200">
            <h4 class="font-medium text-blue-800 mb-3">{{ t('Bộ lọc bổ sung') }}</h4>
            
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <!-- Trạng thái vé filter -->
              <div>
                <label for="ticket-status" class="block text-sm font-medium text-gray-700 mb-1">
                  {{ t('Trạng thái vé') }}
                </label>
                <select
                  id="ticket-status"
                  v-model="ticketStatus"
                  class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 h-[42px]"
                  :disabled="isSearchingCustomer"
                >
                  <option value="">{{ t('Tất cả') }}</option>
                  <option value="used">{{ t('Đã sử dụng') }}</option>
                  <option value="unused">{{ t('Chưa sử dụng') }}</option>
                </select>
              </div>
              
              <!-- Ngày đặt hàng filter -->
              <div>
                <label for="order-date-from" class="block text-sm font-bold text-gray-700 mb-1">
                  {{ t('Từ ngày') }}
                </label>
                <input
                  id="order-date-from"
                  v-model="orderDateRange.start"
                  type="date"
                  class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 h-[42px]"
                  :disabled="isSearchingCustomer"
                />
              </div>
              
              <div>
                <label for="order-date-to" class="block text-sm font-bold text-gray-700 mb-1">
                  {{ t('Đến ngày') }}
                </label>
                <input
                  id="order-date-to"
                  v-model="orderDateRange.end"
                  type="date"
                  class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 h-[42px]"
                  :disabled="isSearchingCustomer"
                />
              </div>
            </div>
          </div>
          
          <div class="flex justify-end">
            <button
              @click="searchCustomerTickets"
              :disabled="isSearchingCustomer || (!customerEmail && !customerPhone)"
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              <span v-if="isSearchingCustomer">{{ t('Đang tìm...') }}</span>
              <span v-else>{{ t('Tìm kiếm') }}</span>
            </button>
          </div>
          
          <!-- Kết quả tìm kiếm -->
          <div v-if="customerTickets.length > 0" class="mt-4">
            <h4 class="font-semibold text-gray-700 mb-3">{{ t('tickets.customerTickets') }}</h4>
            <div class="border rounded-md overflow-hidden">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">{{ t('orders.orderID') }}</th>
                    <th class="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">{{ t('products.title') }}</th>
                    <th class="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">{{ t('tickets.status') }}</th>
                    <th class="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">{{ t('Số vé đã đặt') }}</th>
                    <th class="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">{{ t('tickets.scanCount') }}</th>
                    <th class="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">{{ t('orders.status') }}</th>
                    <th class="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">{{ t('orders.date') }}</th>
                    <th class="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">{{ t('orders.customer.name') }}</th>
                    <th class="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">{{ t('actions.view') }}</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr v-for="ticket in customerTickets" :key="ticket.id">
                    <td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {{ ticket.order?.orderCode || t('N/A') }}
                    </td>
                    <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {{ getProductTitle(ticket) }}
                      <div v-if="ticket.productSnapshot?.variant" class="text-xs text-gray-600 mt-1">
                        {{ getVariantInfo(ticket) }}
                      </div>
                    </td>
                    <td class="px-4 py-3 whitespace-nowrap text-sm">
                      <span
                        :class="[
                          'px-2 py-1 rounded-full text-xs font-bold',
                          isTicketExpired(ticket)
                            ? 'bg-red-100 text-red-800 border border-red-500'
                            : ticket.isUsed 
                              ? 'bg-orange-100 text-orange-800 border border-orange-500' 
                              : 'bg-green-100 text-green-800 border border-green-500'
                        ]"
                      >
                        {{ isTicketExpired(ticket) 
                            ? t('QUÁ HẠN') 
                            : ticket.isUsed 
                              ? t('ĐÃ SỬ DỤNG') 
                              : t('CHƯA SỬ DỤNG') }}
                      </span>
                    </td>
                    <td class="px-4 py-3 whitespace-nowrap text-sm font-semibold">
                      <span class="px-2 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-300">
                        {{ ticket.quantity || 0 }}
                      </span>
                    </td>
                    <td class="px-4 py-3 whitespace-nowrap text-sm font-semibold">
                      <span class="px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
                        {{ ticket.scanCount || 0 }}
                      </span>
                    </td>
                    <td class="px-4 py-3 whitespace-nowrap text-sm">
                      <span
                        :class="[
                          'px-2 py-1 rounded-full text-xs font-bold',
                          ticket.order?.paymentStatus === 'paid' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        ]"
                      >
                        {{ ticket.order?.paymentStatus === 'paid' ? t('ĐÃ THANH TOÁN') : t('CHƯA THANH TOÁN') }}
                      </span>
                    </td>
                    <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {{ formatDate(ticket.order?.createdAt) }}
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-500">
                      <div class="space-y-1">
                        <p class="font-medium">{{ ticket.order?.customerName || t('N/A') }}</p>
                        <p v-if="ticket.order?.email" class="text-xs">{{ ticket.order.email }}</p>
                        <p v-if="ticket.order?.phoneNumber" class="text-xs">{{ ticket.order.phoneCode }} {{ ticket.order.phoneNumber }}</p>
                      </div>
                    </td>
                    <td class="px-4 py-3 whitespace-nowrap text-sm">
                      <div class="flex space-x-2">
                        <button 
                          @click="viewCustomerTicket(ticket.qrCode)"
                          class="p-1 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                          title="Xem thông tin vé"
                        >
                          <SearchIcon class="w-4 h-4" />
                        </button>
                        
                        <button 
                          @click="openPrintModal(ticket)"
                          :disabled="!canPrintTicket(ticket)"
                          :class="[
                            'p-1 rounded focus:outline-none focus:ring-2 focus:ring-offset-2',
                            !canPrintTicket(ticket)
                              ? 'bg-gray-400 text-white cursor-not-allowed'
                              : 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
                          ]"
                          :title="getPrintDisabledReason(ticket)"
                        >
                          <PrinterIcon class="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Thông báo lỗi -->
      <div v-if="errorMessage" class="mb-6 p-4 rounded-lg border-2 border-red-500 bg-red-50 text-red-800">
        <div class="flex items-start">
          <div class="flex-shrink-0 mt-0.5">
            <i class="fas fa-exclamation-triangle text-red-600 text-2xl"></i>
          </div>
          <div class="ml-3">
            <h3 class="text-lg font-bold">
              {{ errorMessage.includes('chưa được thanh toán') ? 'VÉ CHƯA THANH TOÁN' : 'LỖI TRA CỨU VÉ' }}
            </h3>
            <p class="mt-1">{{ errorMessage }}</p>
          </div>
        </div>
      </div>

      <!-- Scan Result -->
      <div v-if="scanResult" class="mt-6">
        <div
          :class="[
            'p-4 mb-4 rounded-md border-2',
            scanResult.success 
              ? scanResult.isFirstScan 
                ? 'bg-green-50 text-green-800 border-green-500' 
                : 'bg-orange-50 text-orange-800 border-orange-500'
              : 'bg-red-50 text-red-800 border-red-500'
          ]"
        >
          <div class="flex">
            <div class="flex-shrink-0">
              <i
                :class="[
                  'text-2xl',
                  scanResult.success 
                    ? scanResult.isFirstScan 
                      ? 'fas fa-check-circle text-green-600' 
                      : 'fas fa-exclamation-triangle text-orange-600'
                    : 'fas fa-times-circle text-red-600'
                ]"
              ></i>
            </div>
            <div class="ml-3">
              <h3 class="text-base font-bold">{{ scanResult.message }}</h3>
            </div>
          </div>
        </div>

        <!-- Ticket Details (if success) -->
        <div v-if="scanResult.success && scanResult.orderItem" class="bg-gray-50 p-6 rounded-md border border-gray-200">
          <div class="flex justify-between mb-4">
            <h3 class="font-bold text-xl">{{ t('Thông tin vé') }}</h3>
            <button 
              v-if="scanResult.orderItem"
              @click="openPrintModal(scanResult.orderItem as any)"
              :disabled="!canPrintTicket(scanResult.orderItem)"
              :class="[
                'flex items-center space-x-1 px-3 py-1 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2',
                !canPrintTicket(scanResult.orderItem)
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
              ]"
            >
              <PrinterIcon class="w-4 h-4" />
              <span>{{ getPrintDisabledReason(scanResult.orderItem) }}</span>
            </button>
          </div>
          
          <div class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-3">
                <div>
                  <p class="text-sm font-bold text-gray-700 uppercase">{{ t('Sản phẩm') }}</p>
                  <p class="font-medium text-base">{{ getProductTitle(scanResult.orderItem) }}</p>
                  <p v-if="scanResult.orderItem.productSnapshot?.variant" class="text-sm text-gray-600 mt-1">
                    {{ getVariantInfo(scanResult.orderItem) }}
                  </p>
                </div>
                
                <div>
                  <p class="text-sm font-bold text-gray-700 uppercase">{{ t('Mã đơn hàng') }}</p>
                  <p class="font-medium text-base">#{{ scanResult.orderItem.order?.orderCode || scanResult.orderItem.orderId }}</p>
                </div>

                <div>
                  <p class="text-sm font-bold text-gray-700 uppercase">{{ t('Số vé đã đặt') }}</p>
                  <p class="font-medium text-base">{{ scanResult.orderItem.quantity || 0 }}</p>
                </div>
                
                <div>
                  <p class="text-sm font-bold text-gray-700 uppercase">{{ t('Mã QR') }}</p>
                  <p class="font-medium text-base">{{ scanResult.orderItem.qrCode }}</p>
                </div>
                
                <div>
                  <p class="text-sm font-bold text-gray-700 uppercase">{{ t('Trạng thái') }}</p>
                  <div class="mt-1">
                    <span 
                      :class="[
                        'px-3 py-1 rounded-full text-base font-bold inline-block',
                        isTicketExpired(scanResult.orderItem) 
                          ? 'bg-red-100 text-red-800 border border-red-500'
                          : scanResult.isFirstScan 
                            ? 'bg-green-100 text-green-800 border border-green-500' 
                            : 'bg-orange-100 text-orange-800 border border-orange-500'
                      ]"
                    >
                      {{ isTicketExpired(scanResult.orderItem) 
                          ? t('QUÁ HẠN') 
                          : scanResult.isFirstScan 
                            ? t('CHƯA SỬ DỤNG') 
                            : t('ĐÃ SỬ DỤNG') }}
                    </span>
                  </div>
                </div>
                
                <div>
                  <p class="text-sm font-bold text-gray-700 uppercase">{{ t('Lượt quét') }}</p>
                  <p class="font-bold text-lg mt-1">
                    <span class="px-3 py-1 rounded-full text-base font-bold inline-block bg-blue-100 text-blue-800 border border-blue-500">
                      {{ scanResult.scanCount || 0 }}
                    </span>
                  </p>
                </div>
              </div>
              
              <div class="space-y-3">
                <!-- Hiển thị ngày đi nếu có -->
                <div v-if="scanResult.orderItem.travelDate">
                  <p class="text-sm font-bold text-gray-700 uppercase">{{ t('Ngày đi') }}</p>
                  <p class="font-medium text-base">
                    {{ formatVietnameseDate(new Date(scanResult.orderItem.travelDate)) }}
                    <span 
                      v-if="new Date(scanResult.orderItem.travelDate).setHours(0,0,0,0) === new Date().setHours(0,0,0,0)" 
                      class="ml-2 px-2 py-1 rounded-md text-xs font-bold bg-green-100 text-green-800 border border-green-500"
                    >
                      {{ t('HÔM NAY') }}
                    </span>
                    <span 
                      v-if="isTicketExpired(scanResult.orderItem)"
                      class="ml-2 px-2 py-1 rounded-md text-xs font-bold bg-red-100 text-red-800 border border-red-500"
                    >
                      {{ t('QUÁ HẠN') }}
                    </span>
                  </p>
                </div>
                
                <!-- Thông tin khách hàng (nếu có) -->
                <template v-if="scanResult.orderItem.order">
                  <div v-if="scanResult.orderItem.order.customerName">
                    <p class="text-sm font-bold text-gray-700 uppercase">{{ t('Khách hàng') }}</p>
                    <p class="font-medium text-base">{{ scanResult.orderItem.order.customerName }}</p>
                  </div>
                  
                  <div v-if="scanResult.orderItem.order.email">
                    <p class="text-sm font-bold text-gray-700 uppercase">{{ t('Email') }}</p>
                    <p class="font-medium text-base">{{ scanResult.orderItem.order.email }}</p>
                  </div>
                  
                  <div v-if="scanResult.orderItem.order.phoneNumber">
                    <p class="text-sm font-bold text-gray-700 uppercase">{{ t('Số điện thoại') }}</p>
                    <p class="font-medium text-base">{{ scanResult.orderItem.order.phoneCode }} {{ scanResult.orderItem.order.phoneNumber }}</p>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>

        <!-- Thêm chi tiết sản phẩm từ productSnapshot -->
        <div v-if="scanResult?.orderItem?.productSnapshot" class="mt-4 pt-4 border-t border-gray-200">
          <p class="text-sm font-bold text-gray-700 uppercase mb-2">{{ t('tickets.productDetails') }}</p>
          <div class="bg-white p-4 rounded-md border border-gray-200">
            <div v-if="scanResult?.orderItem?.productSnapshot?.translations && scanResult.orderItem.productSnapshot.translations.length > 0">
              <div v-for="(translation, index) in scanResult.orderItem.productSnapshot.translations" :key="index" class="mb-2">
                <p class="font-medium">
                  <span class="text-xs font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full mr-2">
                    {{ translation.locale.toUpperCase() }}
                  </span>
                  {{ translation.title }}
                </p>
                <p v-if="translation.description" class="text-sm text-gray-600 mt-1">
                  {{ translation.description }}
                </p>
              </div>
            </div>
            
            <div v-if="scanResult?.orderItem?.productSnapshot?.variant" class="mt-3 pt-3 border-t border-dashed border-gray-200">
              <p class="text-sm font-bold text-gray-700 uppercase mb-1">{{ t('tickets.ticketType') }}</p>
              <div class="flex items-center">
                <span class="px-2 py-1 bg-purple-100 text-purple-800 rounded-md text-sm font-medium mr-2">
                  {{ scanResult.orderItem.productSnapshot.variant.name }}
                </span>
                <span class="font-bold text-base text-blue-700">
                  {{ formatCurrency(scanResult.orderItem.productSnapshot.variant.price) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Lịch sử quét vé -->
      <div v-if="showHistory && scanHistories.length > 0" class="mt-6 bg-white p-6 rounded-lg shadow-md">
        <h3 class="text-lg font-semibold mb-4">{{ t('Lịch sử quét vé') }}</h3>
        
        <div class="border rounded-md overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">{{ t('Thời gian') }}</th>
                <th class="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">{{ t('Người quét') }}</th>
                <th class="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">{{ t('Địa điểm') }}</th>
                <th class="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">{{ t('Thiết bị') }}</th>
                <th class="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">{{ t('Trạng thái') }}</th>
                <th class="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">{{ t('Lần quét thứ #') }}</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="history in scanHistories" :key="history.id">
                <td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{{ formatDate(history.scannedAt) }}</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{{ formatUserName(history) }}</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{{ history.location || t('Không rõ') }}</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{{ history.deviceInfo?.name || t('Không rõ') }}</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm">
                  <span 
                    :class="[
                      'px-2 py-1 rounded-full text-xs font-bold',
                      history.isFirstScan ? 'bg-green-100 text-green-800 border border-green-500' : 'bg-orange-100 text-orange-800 border border-orange-500'
                    ]"
                  >
                    {{ history.isFirstScan ? t('LẦN ĐẦU') : t('ĐÃ DÙNG') }}
                  </span>
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900">
                  <span class="px-3 py-1 rounded-full text-base font-bold inline-block bg-blue-100 text-blue-800 border border-blue-500">
                    {{ history.scanCount || '?' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    
    <!-- Replace the old print modal with the new component -->
    <TicketPrintModal
      :show="showPrintModal"
      :ticket="selectedTicket"
      :is-printing="isPrinting"
      @close="closePrintModal"
      @print="printTicket"
    />
  </div>
</template>

<style scoped>
.phone-input-scanner :deep(input) {
  height: 42px !important;
}

.phone-input-scanner :deep(.phone-code-selector button) {
  height: 42px !important;
}
</style>
