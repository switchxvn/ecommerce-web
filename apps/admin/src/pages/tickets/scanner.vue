<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useTrpc } from '@/composables/useTrpc';
import { useI18n } from 'vue-i18n';
import { navigateTo } from 'nuxt/app';
import { TicketIcon, HistoryIcon, SearchIcon, UserIcon, PrinterIcon } from 'lucide-vue-next';
import { OrderStatus } from '@ew/shared';
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
      customerEmail?: string;
      customerPhone?: string;
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
    customerEmail?: string;
    customerPhone?: string;
    createdAt: string;
    paymentStatus: string;
  };
  scanCount?: number;
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
const showConfirmModal = ref(false);
const currentQrCode = ref('');
const errorMessage = ref('');

// Trang hiển thị trong tab
const activeTab = ref('scanner');

// Scan history pagination
const page = ref(1);
const pageSize = ref(10);
const totalItems = ref(0);
const scanHistoryList = ref<ScanHistory[]>([]);
const isLoadingScanHistoryList = ref(false);
const searchQuery = ref('');
const dateRange = ref({
  start: null as string | null,
  end: null as string | null,
});

// History pagination
const historyPage = ref(1);
const historyPageSize = ref(10);
const historyTotalItems = ref(0);
const historySearchQuery = ref('');
const historyScanDateRange = ref({
  start: null as string | null,
  end: null as string | null,
});

// Tìm kiếm khách hàng
const customerSearch = ref('');
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
    toast.error(t('Please enter QR code'));
    return;
  }

  // Reset trạng thái lỗi và kết quả trước đó
  errorMessage.value = '';
  scanResult.value = null;

  console.log('Scanning QR code:', qrCode.value);
  isLoading.value = true;
  
  // Lưu qrCode tạm thời để xử lý
  const scannedQrCode = qrCode.value;
  
  // Reset input ngay lập tức để sẵn sàng cho lần quét tiếp theo
  qrCode.value = '';
  
  try {
    // Lấy thông tin thiết bị
    const deviceInfo = {
      name: navigator.userAgent,
      type: 'Browser',
      os: navigator.platform,
      browser: navigator.appName,
    };

    console.log('Calling API with:', { qrCode: scannedQrCode, deviceInfo });
    
    // Kiểm tra vé trước, không lưu log ngay
    const orderItem = await trpc.admin.ticketScanner.getTicketByQrCode.query({
      qrCode: scannedQrCode
    });
    
    if (orderItem) {
      // Kiểm tra trạng thái đơn hàng
      if (orderItem.order && orderItem.order.status !== OrderStatus.CONFIRMED) {
        // Không hiển thị modal và thông tin vé nếu đơn hàng chưa xác nhận
        errorMessage.value = t('Đơn hàng chưa được xác nhận. Vui lòng liên hệ admin để xác nhận đơn hàng.');
        toast.error(errorMessage.value);
        
        // Focus lại vào input sau khi hiển thị lỗi
        setTimeout(() => {
          const qrInput = document.getElementById('qr-input');
          if (qrInput) {
            qrInput.focus();
          }
        }, 100);
        
        return;
      }
      
      // Kiểm tra travel_date
      if (orderItem.travelDate) {
        const travelDate = new Date(orderItem.travelDate);
        const currentDate = new Date();
        
        // Reset thời gian về 00:00:00 để chỉ so sánh ngày
        currentDate.setHours(0, 0, 0, 0);
        travelDate.setHours(0, 0, 0, 0);
        
        // Kiểm tra nếu ngày đi lớn hơn ngày hiện tại (chưa tới ngày)
        if (travelDate > currentDate) {
          // Vé chưa tới ngày đi - không hiển thị popup và thông tin vé
          const formattedDate = formatVietnameseDate(travelDate);
          errorMessage.value = t('Vé chưa tới ngày sử dụng. Ngày đi hợp lệ: ') + formattedDate;
          toast.error(errorMessage.value);
          
          // Focus lại vào input sau khi hiển thị lỗi
          setTimeout(() => {
            const qrInput = document.getElementById('qr-input');
            if (qrInput) {
              qrInput.focus();
            }
          }, 100);
          
          return;
        }
        
        if (travelDate < currentDate) {
          // Vé đã hết hạn - không hiển thị popup và thông tin vé
          const formattedDate = formatVietnameseDate(travelDate);
          errorMessage.value = t('Vé đã hết hạn sử dụng. Ngày đi: ') + formattedDate;
          toast.error(errorMessage.value);
          
          // Focus lại vào input sau khi hiển thị lỗi
          setTimeout(() => {
            const qrInput = document.getElementById('qr-input');
            if (qrInput) {
              qrInput.focus();
            }
          }, 100);
          
          return;
        }
      } else if (orderItem.productType === 'TICKET') {
        // Nếu là vé tham quan mà không có ngày đi - không hiển thị popup và thông tin vé
        errorMessage.value = t('Vé không có thông tin ngày đi. Vui lòng kiểm tra lại.');
        toast.warning(errorMessage.value);
        
        // Focus lại vào input sau khi hiển thị lỗi
        setTimeout(() => {
          const qrInput = document.getElementById('qr-input');
          if (qrInput) {
            qrInput.focus();
          }
        }, 100);
        
        return;
      }
      
      scanResult.value = {
        success: true,
        message: orderItem.isUsed 
          ? 'Vé hợp lệ nhưng đã được quét trước đó.'
          : 'Vé hợp lệ và đây là lần đầu tiên sử dụng.',
        orderItem: orderItem,
        isFirstScan: !orderItem.isUsed,
        scanCount: orderItem.scanCount || 0
      };
      
      // Lưu QR code hiện tại để khi xác nhận mới lưu log
      currentQrCode.value = scannedQrCode;
      
      // Hiển thị modal xác nhận
      showConfirmModal.value = true;
      
      // Luôn tải lịch sử quét của vé này để hiển thị
      if (orderItem.id) {
        historyOrderItemId.value = orderItem.id;
        loadScanHistory(orderItem.id);
        showHistory.value = true;
      }
    } else {
      errorMessage.value = t('Không tìm thấy vé với mã QR này');
      toast.error(errorMessage.value);
      
      // Focus lại vào input sau khi hiển thị lỗi
      setTimeout(() => {
        const qrInput = document.getElementById('qr-input');
        if (qrInput) {
          qrInput.focus();
        }
      }, 100);
    }
  } catch (error: any) {
    console.error('Error scanning ticket:', error);
    console.error('Error details:', error?.data?.httpStatus, error?.message);
    
    // Hiển thị thông báo lỗi cụ thể từ server nếu có
    let msg = t('Failed to scan ticket');
    
    if (error?.message) {
      // Hiển thị thông báo lỗi cụ thể từ server
      msg = error.message;
    } else if (error?.data?.message) {
      // Hiển thị thông báo lỗi từ TRPC response
      msg = error.data.message;
    }
    
    // Lưu thông báo lỗi để hiển thị trong UI
    errorMessage.value = msg;
    
    // Hiển thị thông báo trong toast nếu không phải lỗi vé chưa thanh toán
    if (!msg.includes('chưa được thanh toán')) {
      toast.error(msg);
    }
    
    // Focus lại vào input sau khi hiển thị lỗi
    setTimeout(() => {
      const qrInput = document.getElementById('qr-input');
      if (qrInput) {
        qrInput.focus();
      }
    }, 100);
  } finally {
    isLoading.value = false;
    
    // Focus lại vào input sau khi xử lý xong nếu không hiển thị modal xác nhận
    if (!showConfirmModal.value) {
      setTimeout(() => {
        const qrInput = document.getElementById('qr-input');
        if (qrInput) {
          qrInput.focus();
        }
      }, 100);
    }
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

// Sử dụng vé được tìm thấy từ khách hàng
const useCustomerTicket = (ticketQrCode: string) => {
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
  
  historyOrderItemId.value = orderItemId;
  loadHistoryScanHistory();
};

// Load history scan history with pagination
const loadHistoryScanHistory = async () => {
  if (!historyOrderItemId.value) return;
  
  isLoadingHistory.value = true;
  try {
    const result = await trpc.admin.ticketScanner.getTicketScanHistory.query({
      orderItemId: historyOrderItemId.value,
      page: historyPage.value,
      pageSize: historyPageSize.value,
      scannerSearch: historySearchQuery.value || undefined,
      startDate: historyScanDateRange.value.start || undefined,
      endDate: historyScanDateRange.value.end || undefined,
    });
    
    scanHistories.value = result.items;
    historyTotalItems.value = result.total;
  } catch (error) {
    console.error('Error loading history scan history:', error);
    toast.error(t('Failed to load history scan history'));
  } finally {
    isLoadingHistory.value = false;
  }
};

// Load all scan history with pagination
const loadAllScanHistory = async () => {
  isLoadingScanHistoryList.value = true;
  try {
    const result = await trpc.admin.ticketScanner.getAllTicketScans.query({
      page: page.value,
      pageSize: pageSize.value,
      search: searchQuery.value || undefined,
      scannerSearch: undefined,
      status: undefined,
      startDate: dateRange.value.start || undefined,
      endDate: dateRange.value.end || undefined,
    });
    
    scanHistoryList.value = result.items;
    totalItems.value = result.total;
  } catch (error) {
    console.error('Error loading all scan history:', error);
    toast.error(t('Failed to load scan history list'));
  } finally {
    isLoadingScanHistoryList.value = false;
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
  return `${day} tháng ${month < 10 ? '0' + month : month} năm ${year} (${day < 10 ? '0' + day : day}/${month < 10 ? '0' + month : month}/${year})`;
};

// Kiểm tra xem ngày có phải là ngày hôm nay không
const isDateToday = (dateStr: string | Date): boolean => {
  const date = new Date(dateStr);
  const today = new Date();
  
  return date.getDate() === today.getDate() && 
         date.getMonth() === today.getMonth() && 
         date.getFullYear() === today.getFullYear();
};

// Kiểm tra xem ngày có phải là ngày trong tương lai không
const isDateInFuture = (dateStr: string | Date): boolean => {
  const date = new Date(dateStr);
  const today = new Date();
  
  // Reset thời gian về 00:00:00 để chỉ so sánh ngày
  date.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  return date > today;
};

// Kiểm tra xem ngày có phải là ngày trong quá khứ không
const isDateInPast = (dateStr: string | Date): boolean => {
  const date = new Date(dateStr);
  const today = new Date();
  
  // Reset thời gian về 00:00:00 để chỉ so sánh ngày
  date.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  return date < today;
};

// Handle pagination change
const onPageChange = (newPage: number) => {
  page.value = newPage;
  loadAllScanHistory();
};

// Handle search
const handleSearch = () => {
  page.value = 1; // Reset to first page
  loadAllScanHistory();
};

// Clear search
const clearSearch = () => {
  searchQuery.value = '';
  dateRange.value = { start: null, end: null };
  handleSearch();
};

// Handle tab change
const switchTab = (tab: string) => {
  if (tab === 'scanner') {
    navigateTo('/tickets/scanner');
  } else if (tab === 'history') {
    navigateTo('/tickets/history');
  }
};

// Đóng confirm modal và thực hiện quét vé (lưu log)
const closeConfirmModal = async () => {
  showConfirmModal.value = false;
  
  if (scanResult.value?.success && currentQrCode.value) {
    try {
      isLoading.value = true;
      // Lấy thông tin thiết bị
      const deviceInfo = {
        name: navigator.userAgent,
        type: 'Browser',
        os: navigator.platform,
        browser: navigator.appName,
      };
      
      // Kiểm tra lại trạng thái đơn hàng trước khi gọi API (đề phòng trường hợp trạng thái đơn hàng bị thay đổi)
      const orderItem = await trpc.admin.ticketScanner.getTicketByQrCode.query({
        qrCode: currentQrCode.value
      });
      
      if (orderItem && orderItem.order && orderItem.order.status !== OrderStatus.CONFIRMED) {
        // Hiển thị lỗi nếu đơn hàng chưa xác nhận
        errorMessage.value = t('Đơn hàng chưa được xác nhận. Vui lòng liên hệ admin để xác nhận đơn hàng.');
        toast.error(errorMessage.value);
        isLoading.value = false;
        currentQrCode.value = '';
        return;
      }
      
      // Kiểm tra lại travel_date trước khi gọi API scan
      if (orderItem && orderItem.travelDate) {
        const travelDate = new Date(orderItem.travelDate);
        const currentDate = new Date();
        
        // Reset thời gian về 00:00:00 để chỉ so sánh ngày
        currentDate.setHours(0, 0, 0, 0);
        travelDate.setHours(0, 0, 0, 0);
        
        // Kiểm tra nếu ngày đi lớn hơn ngày hiện tại (chưa tới ngày)
        if (travelDate > currentDate) {
          // Vé chưa tới ngày đi
          const formattedDate = formatVietnameseDate(travelDate);
          errorMessage.value = t('Vé chưa tới ngày sử dụng. Ngày đi hợp lệ: ') + formattedDate;
          toast.error(errorMessage.value);
          isLoading.value = false;
          currentQrCode.value = '';
          return;
        }
        
        if (travelDate < currentDate) {
          // Vé đã hết hạn
          const formattedDate = formatVietnameseDate(travelDate);
          errorMessage.value = t('Vé đã hết hạn sử dụng. Ngày đi: ') + formattedDate;
          toast.error(errorMessage.value);
          isLoading.value = false;
          currentQrCode.value = '';
          return;
        }
      }
      
      // Gọi API để lưu log quét vé
      const result = await trpc.admin.ticketScanner.scanTicket.mutate({
        qrCode: currentQrCode.value,
        location: 'Admin Dashboard',
        deviceInfo
      });
      
      // Kiểm tra kết quả từ API
      if (result.success) {
        // Hiển thị thông báo thành công
        toast.success(t('Đã lưu thông tin quét vé thành công'));
        
        // Cập nhật lại kết quả với thông tin mới nhất
        scanResult.value = result;
        
        // Cập nhật scanCount trong customerTickets nếu vé được quét từ danh sách tìm kiếm khách hàng
        if (customerTickets.value.length > 0 && result.orderItem) {
          const ticketIndex = customerTickets.value.findIndex(ticket => ticket.qrCode === currentQrCode.value);
          if (ticketIndex !== -1) {
            // Cập nhật scanCount và isUsed cho vé tương ứng
            customerTickets.value[ticketIndex].scanCount = (result.scanCount || 0);
            customerTickets.value[ticketIndex].isUsed = true;
          }
        }
        
        // Tự động lấy lịch sử quét của vé này
        if (result.orderItem) {
          historyOrderItemId.value = result.orderItem.id;
          loadScanHistory(result.orderItem.id);
          showHistory.value = true;
        }
        
        // Reset focus về ô input sau khi đóng modal để sẵn sàng quét tiếp
        setTimeout(() => {
          const qrInput = document.getElementById('qr-input');
          if (qrInput) {
            qrInput.focus();
          }
        }, 100);
      } else {
        // Hiển thị thông báo lỗi
        errorMessage.value = result.message;
        toast.error(result.message);
      }
    } catch (error: any) {
      console.error('Error saving scan log:', error);
      
      // Xử lý thông báo lỗi
      let errorMsg = t('Lỗi khi lưu thông tin quét vé: ') + (error?.message || 'Unknown error');
      
      // Nếu lỗi có data.message thì hiển thị
      if (error?.data?.message) {
        errorMsg = error.data.message;
      }
      
      // Lưu và hiển thị thông báo lỗi
      errorMessage.value = errorMsg;
      toast.error(errorMsg);
    } finally {
      isLoading.value = false;
      currentQrCode.value = '';
    }
  }
};

// Đóng modal và hủy quy trình quét vé (không lưu log)
const cancelAction = () => {
  showConfirmModal.value = false;
  toast.warning(t('Đã hủy quét vé - không lưu thông tin'));
  currentQrCode.value = '';
  errorMessage.value = '';
  
  // Focus lại vào input sau khi đóng modal
  setTimeout(() => {
    const qrInput = document.getElementById('qr-input');
    if (qrInput) {
      qrInput.focus();
    }
  }, 100);
  
  // Vẫn giữ lịch sử quét hiển thị, không reset lại
  // Chỉ cần đảm bảo không gọi API lưu log
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
      customerEmail: ticket.order.customerEmail || '',
      customerPhone: ticket.order.customerPhone || '',
      phoneCode: ticket.order.phoneCode || ''
    } : {
      orderCode: '',
      status: '',
      customerName: '',
      customerEmail: '',
      customerPhone: '',
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
    // Gọi API lấy tất cả settings
    const settingsData = await trpc.admin.settings.getAll.query();
    
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
            ${ticket.order?.customerPhone ? `
            <div class="info-row">
              <div class="info-label">SĐT:</div>
              <div class="info-value">${ticket.order.phoneCode || ''} ${ticket.order.customerPhone}</div>
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
  
  // Chỉ tự động quét khi không có modal đang hiển thị và đủ số ký tự
  if (!showConfirmModal.value && qrCode.value.length >= 15) {
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

// Handle history pagination change
const onHistoryPageChange = (newPage: number) => {
  historyPage.value = newPage;
  loadHistoryScanHistory();
};

// Handle history search
const searchHistoryScans = () => {
  historyPage.value = 1; // Reset to first page
  loadHistoryScanHistory();
};

// Clear history search
const clearHistorySearch = () => {
  historySearchQuery.value = '';
  historyScanDateRange.value = { start: null, end: null };
  searchHistoryScans();
};

// Lấy title cho nút sử dụng vé
const getTicketButtonTitle = (ticket: CustomerTicket): string => {
  if (ticket.order?.paymentStatus !== 'paid') {
    return t('tickets.unpaid');
  }
  if (ticket.travelDate && isDateInFuture(ticket.travelDate)) {
    return t('tickets.futureDate');
  }
  return '';
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
      :title="t('Ticket Scanner')"
      :description="t('Scan tickets for admission and view scan history')"
    />

    <!-- Tabs -->
    <nav class="flex items-center space-x-1 rounded-lg bg-white border border-slate-200 p-1 w-fit">
      <button
        v-for="tab in [
          { id: 'scanner', name: 'Scanner', icon: TicketIcon },
          { id: 'history', name: 'Scan History', icon: HistoryIcon }
        ]"
        :key="tab.id"
        @click="switchTab(tab.id)"
        class="flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-all relative"
        :class="{
          'bg-primary text-white': activeTab === tab.id,
          'text-slate-600 hover:text-slate-900 hover:bg-slate-50': activeTab !== tab.id
        }"
      >
        <component :is="tab.icon" class="w-4 h-4" />
        {{ t(tab.name) }}
      </button>
    </nav>

    <!-- Scanner Tab -->
    <div v-if="activeTab === 'scanner'" class="space-y-6">
      <div class="bg-white p-6 rounded-lg shadow-md">
        <h2 class="text-xl font-semibold mb-4">{{ t('Scan QR Code') }}</h2>
        
        <div class="mb-6">
          <label for="qr-input" class="block text-sm font-medium text-gray-700 mb-2">
            {{ t('Enter QR Code') }}
          </label>
          <div class="flex space-x-2">
            <input
              id="qr-input"
              v-model="qrCode"
              @input="handleInput"
              @keydown="handleKeyDown"
              type="text"
              class="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              :placeholder="t('Enter or scan QR code')"
              :disabled="isLoading || showConfirmModal"
            />
            <button
              @click="scanTicket"
              :disabled="isLoading || !qrCode || showConfirmModal"
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              <span v-if="isLoading">{{ t('Scanning...') }}</span>
              <span v-else>{{ t('Scan') }}</span>
            </button>
          </div>
          <p class="text-sm text-gray-500 mt-2">
            {{ t('Use a QR code scanner or manually enter the code') }}
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
          <span>{{ showCustomerSearch ? t('Quay lại quét mã QR') : t('Tìm theo thông tin khách hàng') }}</span>
        </button>

        <!-- Tìm kiếm theo thông tin khách hàng -->
        <div v-if="showCustomerSearch" class="mb-6 p-6 bg-blue-50 rounded-lg border border-blue-100">
          <h3 class="text-lg font-semibold mb-4 text-blue-800">{{ t('Tìm vé theo thông tin khách hàng') }}</h3>
          
          <!-- Hướng dẫn nhân viên soát vé -->
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
                <h4 class="text-sm font-bold text-yellow-800">{{ t('Mẹo cho nhân viên soát vé:') }}</h4>
                <ul class="mt-1 text-sm text-yellow-700 list-disc pl-5 space-y-1">
                  <li>{{ t('Yêu cầu khách hàng xuất trình CMND/CCCD để đối chiếu thông tin') }}</li>
                  <li>{{ t('Kiểm tra tên, email, SĐT trên đơn hàng có khớp với thông tin của khách') }}</li>
                  <li>{{ t('Chỉ sử dụng vé có trạng thái "Đã thanh toán"') }}</li>
                  <li>{{ t('Ưu tiên kiểm tra mã QR nếu khách hàng có mã') }}</li>
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
              <h4 class="font-semibold text-gray-700 mb-3">{{ t('Vé của khách hàng') }}</h4>
              <div class="border rounded-md overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200 table-fixed">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-32">{{ t('Mã đơn hàng') }}</th>
                      <th class="px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-40">{{ t('Sản phẩm') }}</th>
                      <th class="px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-28">{{ t('Trạng thái vé') }}</th>
                      <th class="px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-24">{{ t('Số vé đặt') }}</th>
                      <th class="px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-20">{{ t('Lượt quét') }}</th>
                      <th class="px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-32">{{ t('Trạng thái đơn') }}</th>
                      <th class="px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-44">{{ t('Ngày mua') }}</th>
                      <th class="px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-40">{{ t('Thông tin KH') }}</th>
                      <th class="px-3 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider w-36 bg-gray-100">{{ t('Hành động') }}</th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-200">
                    <tr v-for="ticket in customerTickets" :key="ticket.id">
                      <td class="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {{ ticket.order?.orderCode || t('N/A') }}
                      </td>
                      <td class="px-3 py-3 text-sm text-gray-500">
                        {{ getProductTitle(ticket) }}
                        <div v-if="ticket.productSnapshot?.variant" class="text-xs text-gray-600 mt-1">
                          {{ getVariantInfo(ticket) }}
                        </div>
                      </td>
                      <td class="px-3 py-3 whitespace-nowrap text-sm">
                        <span
                          :class="[
                            'px-2 py-1 rounded-full text-xs font-bold inline-block',
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
                      <td class="px-3 py-3 whitespace-nowrap text-sm font-semibold">
                        <span class="px-2 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-300">
                          {{ ticket.quantity || 0 }}
                        </span>
                      </td>
                      <td class="px-3 py-3 whitespace-nowrap text-sm font-semibold">
                        <span class="px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
                          {{ ticket.scanCount || 0 }}
                        </span>
                      </td>
                      <td class="px-3 py-3 whitespace-nowrap text-sm">
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
                      <td class="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                        {{ formatDate(ticket.order?.createdAt) }}
                        <div v-if="ticket.travelDate" class="mt-1">
                          <span class="text-xs font-bold">{{ t('Ngày đi') }}: </span>
                          <span 
                            v-if="ticket.travelDate" 
                            :class="[
                              'px-2 py-1 rounded-full text-xs',
                              isDateInFuture(ticket.travelDate) 
                                ? 'bg-blue-100 text-blue-800 border border-blue-300' 
                                : isDateToday(ticket.travelDate)
                                  ? 'bg-green-100 text-green-800 border border-green-500'
                                  : 'bg-gray-100 text-gray-800 border border-gray-300'
                            ]"
                          >
                            {{ formatDate(ticket.travelDate) }}
                            <span v-if="isDateToday(ticket.travelDate)">
                              ({{ t('Hôm nay') }})
                            </span>
                            <span v-else-if="isDateInFuture(ticket.travelDate)">
                              ({{ t('Chưa tới ngày') }})
                            </span>
                            <span v-else>
                              ({{ t('Đã qua') }})
                            </span>
                          </span>
                        </div>
                      </td>
                      <td class="px-3 py-3 text-sm text-gray-500">
                        <div class="space-y-1">
                          <p class="font-medium">{{ ticket.order?.customerName || t('N/A') }}</p>
                          <p v-if="ticket.order?.customerEmail" class="text-xs">{{ ticket.order.customerEmail }}</p>
                          <p v-if="ticket.order?.customerPhone" class="text-xs">{{ ticket.order.customerPhone }}</p>
                        </div>
                      </td>
                      <td class="px-3 py-3 whitespace-nowrap text-sm border-l border-gray-200 bg-gray-50">
                        <div class="flex justify-center space-x-2">
                          <button 
                            @click="useCustomerTicket(ticket.qrCode)"
                            :disabled="Boolean(ticket.order?.paymentStatus !== 'paid' || (ticket.travelDate && isDateInFuture(ticket.travelDate)))"
                            :class="[
                              'px-4 py-2 rounded-md text-white font-medium shadow-sm',
                              ticket.order?.paymentStatus === 'paid' && !(ticket.travelDate && isDateInFuture(ticket.travelDate))
                                ? 'bg-blue-600 hover:bg-blue-700 font-bold'
                                : 'bg-gray-400 cursor-not-allowed'
                            ]"
                            :title="getTicketButtonTitle(ticket)"
                          >
                            {{ t('Sử dụng vé này') }}
                          </button>
                          
                          <button 
                            @click="openPrintModal(ticket)"
                            :disabled="!canPrintTicket(ticket)"
                            :class="[
                              'px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center space-x-1',
                              !canPrintTicket(ticket)
                                ? 'bg-gray-400 text-white cursor-not-allowed'
                                : 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
                            ]"
                            :title="getPrintDisabledReason(ticket)"
                          >
                            <PrinterIcon class="w-4 h-4" />
                            <span>{{ t('In vé') }}</span>
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

        <!-- Thông báo lỗi vé chưa thanh toán -->
        <div v-if="errorMessage" class="mb-6 p-4 rounded-lg border-2 border-red-500 bg-red-50 text-red-800">
          <div class="flex items-start">
            <div class="flex-shrink-0 mt-0.5">
              <i class="fas fa-exclamation-triangle text-red-600 text-2xl"></i>
            </div>
            <div class="ml-3">
              <h3 class="text-lg font-bold">
                {{ errorMessage.includes('chưa được thanh toán') ? 'VÉ CHƯA THANH TOÁN' : 
                   errorMessage.includes('chưa tới ngày sử dụng') ? 'VÉ CHƯA TỚI NGÀY ĐI' : 'LỖI QUÉT VÉ' }}
              </h3>
              <p class="mt-1">{{ errorMessage }}</p>
              <p v-if="errorMessage.includes('chưa được thanh toán')" class="mt-2 font-semibold">
                Vui lòng kiểm tra trạng thái thanh toán của đơn hàng trước khi cho phép người dùng vào.
              </p>
              <p v-if="errorMessage.includes('chưa tới ngày sử dụng')" class="mt-2 font-semibold">
                Vui lòng kiểm tra ngày đi trên vé và thông báo cho khách hàng quay lại đúng ngày.
              </p>
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
              <h3 class="font-bold text-xl">{{ t('Ticket Details') }}</h3>
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
                :title="getPrintDisabledReason(scanResult.orderItem)"
              >
                <PrinterIcon class="w-4 h-4" />
                <span>{{ getPrintDisabledReason(scanResult.orderItem) }}</span>
              </button>
            </div>
            <div class="space-y-4">
              <div class="grid grid-cols-5 gap-6">
                <div class="border-r border-gray-200 pr-4">
                  <p class="text-sm font-bold text-gray-700 uppercase">{{ t('Product') }}</p>
                  <p class="font-medium text-base">{{ getProductTitle(scanResult.orderItem) }}</p>
                  <p v-if="scanResult.orderItem.productSnapshot?.variant" class="text-sm text-gray-600 mt-1">
                    {{ getVariantInfo(scanResult.orderItem) }}
                  </p>
                </div>
                <div class="border-r border-gray-200 pr-4">
                  <p class="text-sm font-bold text-gray-700 uppercase">{{ t('Order ID') }}</p>
                  <p class="font-medium text-base">#{{ scanResult.orderItem.order?.orderCode || scanResult.orderItem.orderId }}</p>
                </div>
                <div class="border-r border-gray-200 pr-4">
                  <p class="text-sm font-bold text-gray-700 uppercase">{{ t('Số vé đã đặt') }}</p>
                  <p class="font-medium text-base">{{ scanResult.orderItem.quantity || 0 }}</p>
                </div>
                <div class="border-r border-gray-200 pr-4">
                  <p class="text-sm font-bold text-gray-700 uppercase">{{ t('Status') }}</p>
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
                            ? t('LẦN ĐẦU SỬ DỤNG') 
                            : t('ĐÃ SỬ DỤNG TRƯỚC ĐÓ') }}
                    </span>
                  </div>
                </div>
                <div>
                  <p class="text-sm font-bold text-gray-700 uppercase">{{ t('Lượt quét') }}</p>
                  <p class="font-bold text-lg mt-1">
                    <span 
                      :class="[
                        'px-3 py-1 rounded-full text-base font-bold inline-block',
                        scanResult.isFirstScan 
                          ? 'bg-green-100 text-green-800 border border-green-500' 
                          : 'bg-blue-100 text-blue-800 border border-blue-500'
                      ]"
                    >
                      {{ scanResult.isFirstScan ? t('MỚI #1') : scanResult.scanCount || 0 }}
                    </span>
                  </p>
                </div>
              </div>
              
              <!-- Hiển thị ngày đi cho vé -->
              <div v-if="scanResult.orderItem.travelDate" class="mt-2 border-t border-gray-200 pt-4">
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

              <!-- Thêm chi tiết sản phẩm từ productSnapshot -->
              <div v-if="scanResult.orderItem.productSnapshot" class="mt-2 border-t border-gray-200 pt-4">
                <p class="text-sm font-bold text-gray-700 uppercase mb-2">{{ t('Chi tiết sản phẩm') }}</p>
                <div class="bg-white p-4 rounded-md border border-gray-200">
                  <div v-if="scanResult.orderItem.productSnapshot.translations && scanResult.orderItem.productSnapshot.translations.length > 0">
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
                  
                  <div v-if="scanResult.orderItem.productSnapshot.variant" class="mt-3 pt-3 border-t border-dashed border-gray-200">
                    <p class="text-sm font-bold text-gray-700 uppercase mb-1">{{ t('Loại vé') }}</p>
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
          </div>

          <!-- Scan History Section -->
          <div v-if="showHistory && historyOrderItemId" class="mt-6 bg-white p-6 rounded-md border border-gray-200">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-bold text-xl">{{ t('Lịch sử quét vé') }}</h3>
              
              <!-- Tìm kiếm trong lịch sử quét -->
              <div class="flex space-x-2">
                <input
                  v-model="historySearchQuery"
                  type="text"
                  class="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  :placeholder="t('Tìm theo người quét')"
                />
                <button
                  @click="searchHistoryScans"
                  class="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <SearchIcon class="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <!-- Filter by date -->
            <div class="flex flex-wrap gap-4 mb-4">
              <div class="flex-1 min-w-[240px]">
                <label for="history-date-from" class="block text-sm font-bold text-gray-700 mb-1">
                  {{ t('Từ ngày') }}
                </label>
                <input
                  id="history-date-from"
                  v-model="historyScanDateRange.start"
                  type="date"
                  class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div class="flex-1 min-w-[240px]">
                <label for="history-date-to" class="block text-sm font-bold text-gray-700 mb-1">
                  {{ t('Đến ngày') }}
                </label>
                <input
                  id="history-date-to"
                  v-model="historyScanDateRange.end"
                  type="date"
                  class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div class="flex items-end space-x-2">
                <button
                  @click="searchHistoryScans"
                  class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  {{ t('Lọc') }}
                </button>
                
                <button
                  @click="clearHistorySearch"
                  class="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                >
                  {{ t('Xóa bộ lọc') }}
                </button>
              </div>
            </div>
            
            <!-- Loading state -->
            <div v-if="isLoadingHistory" class="text-center py-8">
              <i class="fas fa-spinner fa-spin mr-2"></i>
              {{ t('common.loading') }}
            </div>
            
            <!-- No history found -->
            <div v-else-if="scanHistories.length === 0" class="text-center py-8 bg-gray-50 rounded-md">
              <p class="text-gray-500">{{ t('tickets.noScanHistory') }}</p>
            </div>
            
            <!-- History table -->
            <div v-else class="overflow-x-auto border rounded-md">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      {{ t('tickets.scanTime') }}
                    </th>
                    <th class="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      {{ t('tickets.scanner') }}
                    </th>
                    <th class="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      {{ t('tickets.scanCount') }}
                    </th>
                    <th class="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      {{ t('tickets.location') }}
                    </th>
                    <th class="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      {{ t('tickets.status') }}
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr v-for="history in scanHistories" :key="history.id">
                    <td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {{ formatDate(history.scannedAt) }}
                    </td>
                    <td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {{ formatUserName(history) }}
                    </td>
                    <td class="px-4 py-3 whitespace-nowrap text-sm">
                      <span class="px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
                        {{ history.scanCount || '?' }}
                      </span>
                    </td>
                    <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {{ history.location || t('Không xác định') }}
                    </td>
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
                  </tr>
                </tbody>
              </table>
            </div>
            
            <!-- Pagination for history -->
            <div v-if="historyTotalItems > 0" class="mt-4 flex justify-between items-center">
              <div class="text-sm text-gray-500">
                {{ t('components.common.pagination.showing') }} {{ (historyPage - 1) * historyPageSize + 1 }} 
                {{ t('components.common.pagination.to') }} {{ Math.min(historyPage * historyPageSize, historyTotalItems) }} 
                {{ t('components.common.pagination.of') }} {{ historyTotalItems }} 
                {{ t('components.common.pagination.results') }}
              </div>
              <div class="flex space-x-1">
                <button
                  v-for="p in Math.ceil(historyTotalItems / historyPageSize)"
                  :key="p"
                  @click="onHistoryPageChange(p)"
                  :class="[
                    'px-3 py-1 rounded-md text-sm font-medium',
                    p === historyPage
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  ]"
                >
                  {{ p }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- History Tab -->
    <div v-if="activeTab === 'history'" class="space-y-6">
      <div class="bg-white p-6 rounded-lg shadow-md">
        <h2 class="text-xl font-bold mb-4">{{ t('Scan History') }}</h2>
        
        <!-- Search and Filters -->
        <div class="mb-6 space-y-4">
          <div class="flex flex-wrap gap-4">
            <div class="flex-1 min-w-[240px]">
              <label for="search-input" class="block text-sm font-bold text-gray-700 mb-1">
                {{ t('Search') }}
              </label>
              <input
                id="search-input"
                v-model="searchQuery"
                type="text"
                class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                :placeholder="t('Search by QR code or product')"
              />
            </div>
            
            <div class="flex-1 min-w-[240px]">
              <label for="date-from" class="block text-sm font-bold text-gray-700 mb-1">
                {{ t('From Date') }}
              </label>
              <input
                id="date-from"
                v-model="dateRange.start"
                type="date"
                class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            
            <div class="flex-1 min-w-[240px]">
              <label for="date-to" class="block text-sm font-bold text-gray-700 mb-1">
                {{ t('To Date') }}
              </label>
              <input
                id="date-to"
                v-model="dateRange.end"
                type="date"
                class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div class="flex justify-end space-x-3">
            <button
              @click="clearSearch"
              class="px-3 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
            >
              {{ t('Clear') }}
            </button>
            <button
              @click="handleSearch"
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-bold"
            >
              {{ t('Search') }}
            </button>
          </div>
        </div>
        
        <!-- Scan History Table -->
        <div>
          <div v-if="isLoadingScanHistoryList" class="text-center py-8">
            <i class="fas fa-spinner fa-spin mr-2"></i>
            {{ t('Loading...') }}
          </div>
          <div v-else-if="scanHistoryList.length === 0" class="text-center py-8 text-gray-500">
            {{ t('No scan history found') }}
          </div>
          <div v-else class="border rounded-md overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    {{ t('Time') }}
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    {{ t('Product') }}
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    {{ t('QR Code') }}
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    {{ t('Lần quét thứ #') }}
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    {{ t('Scanned By') }}
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    {{ t('Status') }}
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    {{ t('Location') }}
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="history in scanHistoryList" :key="history.id">
                  <td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    {{ formatDate(history.scannedAt) }}
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    {{ history.orderItem?.product?.translations?.[0]?.title || t('Unknown Product') }}
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap text-sm font-semibold text-blue-600">
                    {{ history.orderItem?.qrCode || t('N/A') }}
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900">
                    <span class="px-2 py-1 rounded-full text-base font-bold inline-block bg-blue-100 text-blue-800 border border-blue-300">
                      {{ history.scanCount || '?' }}
                    </span>
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    {{ formatUserName(history) }}
                  </td>
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
                  <td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    {{ history.location || t('Not specified') }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <!-- Pagination -->
          <div v-if="totalItems > 0" class="mt-4 flex justify-between items-center">
            <div class="text-sm text-gray-500">
              {{ t('components.common.pagination.showing') }} {{ (page - 1) * pageSize + 1 }} 
              {{ t('components.common.pagination.to') }} {{ Math.min(page * pageSize, totalItems) }} 
              {{ t('components.common.pagination.of') }} {{ totalItems }} 
              {{ t('components.common.pagination.results') }}
            </div>
            <div class="flex space-x-1">
              <button
                v-for="p in Math.ceil(totalItems / pageSize)"
                :key="p"
                @click="onPageChange(p)"
                :class="[
                  'px-3 py-1 rounded-md text-sm font-medium',
                  p === page
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                ]"
              >
                {{ p }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Confirm Modal -->
    <div v-if="showConfirmModal" class="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6 m-4">
        <div class="flex items-start justify-between mb-4">
          <h3 class="text-lg font-medium text-gray-900">
            {{ t('Ticket scan result') }}
          </h3>
          <button @click="closeConfirmModal" class="text-gray-400 hover:text-gray-500">
            <span class="sr-only">Close</span>
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="mb-6">
          <div 
            :class="[
              'rounded-lg p-4 mb-4',
              scanResult?.isFirstScan ? 'bg-green-50' : 'bg-orange-50'
            ]"
          >
            <div class="flex">
              <i 
                :class="[
                  'text-2xl mr-3',
                  scanResult?.isFirstScan ? 'fas fa-check-circle text-green-600' : 'fas fa-exclamation-triangle text-orange-600'
                ]"
              ></i>
              <div>
                <p class="font-bold text-lg">
                  {{ scanResult?.message }}
                </p>
                <p v-if="scanResult?.orderItem" class="mt-2">
                  <strong>{{ t('Product') }}:</strong> {{ getProductTitle(scanResult.orderItem) }}
                </p>
                <p v-if="scanResult?.orderItem?.productSnapshot?.variant" class="mt-1 text-sm">
                  <strong>{{ t('Variant') }}:</strong> {{ getVariantInfo(scanResult.orderItem) }}
                </p>
                <p v-if="scanResult?.orderItem" class="mt-1">
                  <strong>{{ t('Ticket status') }}:</strong> 
                  <span 
                    :class="[
                      'font-bold',
                      scanResult.isFirstScan ? 'text-green-600' : 'text-orange-600'
                    ]"
                  >
                    {{ scanResult.isFirstScan ? t('LẦN ĐẦU SỬ DỤNG') : t('ĐÃ SỬ DỤNG TRƯỚC ĐÓ') }}
                  </span>
                </p>
                <p v-if="!scanResult?.isFirstScan" class="mt-3">
                  <strong class="mr-2">{{ t('Số lần quét trước đó') }}:</strong> 
                  <span class="font-bold text-blue-600 bg-blue-100 px-3 py-1 rounded-full text-sm border border-blue-300 ml-1 inline-block">
                    {{ scanResult?.scanCount || 0 }}
                  </span>
                </p>
                <!-- Hiển thị ngày đi trong modal xác nhận -->
                <p v-if="scanResult?.orderItem?.travelDate" class="mt-3">
                  <strong>{{ t('Ngày đi') }}:</strong> 
                  <span class="font-bold ml-1">
                    {{ formatVietnameseDate(new Date(scanResult.orderItem.travelDate)) }}
                  </span>
                  <span 
                    v-if="new Date(scanResult.orderItem.travelDate).setHours(0,0,0,0) === new Date().setHours(0,0,0,0)" 
                    class="ml-2 px-2 py-1 rounded-md text-xs font-bold bg-green-100 text-green-800 border border-green-500"
                  >
                    {{ t('HÔM NAY') }}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Thêm chi tiết sản phẩm từ productSnapshot trong modal xác nhận -->
        <div v-if="scanResult?.orderItem?.productSnapshot" class="bg-white p-4 rounded-md border border-gray-200 mb-4">
          <h4 class="font-medium text-base mb-2">{{ t('tickets.productDetails') }}</h4>
          
          <div v-if="scanResult.orderItem.productSnapshot.translations && scanResult.orderItem.productSnapshot.translations.length > 0">
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
          
          <div v-if="scanResult.orderItem.productSnapshot.variant" class="mt-3 pt-3 border-t border-dashed border-gray-200">
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
        
        <div class="flex justify-end space-x-3">
          <button
            @click="cancelAction"
            class="px-5 py-2 border border-transparent rounded-md font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            {{ t('Không tiếp tục') }}
          </button>
          
          <button
            @click="closeConfirmModal"
            class="px-5 py-2 bg-blue-600 border border-transparent rounded-md font-bold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {{ t('Tiếp tục') }}
          </button>
        </div>
      </div>
    </div>
    
    <!-- Thêm TicketPrintModal -->
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
