import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { router, adminProcedure } from '../../procedures';
import { Permissions } from '../../../auth/constants/permissions.constant';
import { requirePermission } from '../../middlewares/permission.middleware';

const ADMIN_TIMEZONE = 'Asia/Ho_Chi_Minh';

function toDateKeyInTimezone(date: Date, timeZone: string = ADMIN_TIMEZONE): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);

  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;

  return `${year}-${month}-${day}`;
}

function formatDateInTimezone(date: Date, timeZone: string = ADMIN_TIMEZONE): string {
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
}

// Schema for device info
const deviceInfoSchema = z.object({
  name: z.string().optional(),
  type: z.string().optional(),
  os: z.string().optional(),
  browser: z.string().optional(),
  ip: z.string().optional()
}).optional();

export const ticketScannerRouter = router({
  // Quét QR code vé
  scanTicket: adminProcedure
    .use(requirePermission(Permissions.SCAN_TICKETS))
    .input(z.object({
      qrCode: z.string(),
      location: z.string().optional(),
      deviceInfo: deviceInfoSchema
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Lấy userId từ context - adminProcedure đảm bảo ctx.user tồn tại
        if (!ctx.user?.id) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Bạn cần đăng nhập để thực hiện chức năng này',
          });
        }
        
        const userId = ctx.user.id;
        
        console.log('Debug - scanTicket context:', {
          hasUserId: !!userId,
          userId,
          qrCode: input.qrCode,
          hasOrderAdminService: !!ctx.services.orderAdminService,
        });
        
        if (!ctx.services.orderAdminService) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Service không khả dụng, vui lòng thử lại sau',
          });
        }
        
        // Kiểm tra thông tin vé trước khi quét
        const ticketInfo = await ctx.services.orderAdminService.findTicketByQrCode(input.qrCode);
        
        if (ticketInfo && ticketInfo.travelDate) {
          const travelDate = new Date(ticketInfo.travelDate);
          const travelDateKey = toDateKeyInTimezone(travelDate);
          const currentDateKey = toDateKeyInTimezone(new Date());

          // Compare date-only in admin timezone to avoid UTC/local drift.
          if (travelDateKey > currentDateKey) {
            const formattedDate = formatDateInTimezone(travelDate);

            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: `Vé chưa tới ngày sử dụng. Ngày đi hợp lệ: ${formattedDate}`,
            });
          }
        }
        
        const result = await ctx.services.orderAdminService.scanTicket(
          input.qrCode,
          userId,
          input.location,
          input.deviceInfo
        );
        
        return result;
      } catch (error) {
        console.error('Error in scanTicket - DETAILED:', error);
        console.error('Error stack:', error.stack);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Lỗi xử lý quét vé: ' + (error.message || 'Unknown error'),
        });
      }
    }),
    
  // Lấy thông tin vé từ QR code
  getTicketByQrCode: adminProcedure
    .use(requirePermission(Permissions.VIEW_TICKETS))
    .input(z.object({
      qrCode: z.string()
    }))
    .query(async ({ ctx, input }) => {
      try {
        // Lấy thông tin vé
        const ticket = await ctx.services.orderAdminService.findTicketByQrCode(input.qrCode);
        
        if (ticket) {
          // Kiểm tra ngày đi
          if (ticket.travelDate) {
            const travelDate = new Date(ticket.travelDate);
            const travelDateKey = toDateKeyInTimezone(travelDate);
            const currentDateKey = toDateKeyInTimezone(new Date());

            if (travelDateKey > currentDateKey) {
              const formattedDate = formatDateInTimezone(travelDate);

              throw new TRPCError({
                code: 'BAD_REQUEST',
                message: `Vé chưa tới ngày sử dụng. Ngày đi hợp lệ: ${formattedDate}`,
              });
            }
          }
          
          // Lấy số lượt quét vé
          const scanCount = await ctx.services.orderAdminService.getTicketScanCount(ticket.id);
          
          // Gắn thêm thông tin số lượt quét vào kết quả
          return {
            ...ticket,
            scanCount
          };
        }
        
        return ticket;
      } catch (error) {
        console.error('Error in getTicketByQrCode:', error);
        
        // Kiểm tra nếu là lỗi thanh toán 
        if (error.message && error.message.includes('chưa được thanh toán')) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: error.message,
          });
        }
        
        // Kiểm tra nếu là lỗi chưa tới ngày đi
        if (error.message && error.message.includes('chưa tới ngày sử dụng')) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: error.message,
          });
        }
        
        // Lỗi mặc định khi không tìm thấy vé
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Không tìm thấy vé với mã QR này',
        });
      }
    }),
    
  // Tìm kiếm vé theo thông tin khách hàng (email hoặc số điện thoại)
  searchCustomerTickets: adminProcedure
    .use(requirePermission(Permissions.SEARCH_TICKETS))
    .input(z.object({
      searchTerm: z.string().min(3),
      ticketStatus: z.string().optional(),
      startOrderDate: z.string().optional(),
      endOrderDate: z.string().optional()
    }))
    .query(async ({ ctx, input }) => {
      try {
        if (!ctx.services.orderAdminService) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Service không khả dụng, vui lòng thử lại sau',
          });
        }

        // Tìm kiếm các đơn hàng có chứa vé (TICKET) dựa trên email hoặc số điện thoại
        // đã bỏ điều kiện lọc paymentStatus để hiển thị cả vé chưa thanh toán
        let searchQuery = `
          SELECT 
            "order"."id" as "orderId",
            "order"."order_code" as "orderCode",
            "order"."status" as "status",
            "order"."customer_name" as "customerName",
            "order"."email" as "email",
            "order"."phone_code" as "phoneCode",
            "order"."phone_number" as "phoneNumber",
            "order"."payment_status" as "paymentStatus",
            "order"."created_at" as "createdAt",
            "item"."id" as "itemId",
            "item"."qr_code" as "qrCode",
            "item"."is_used" as "isUsed",
            "item"."product_type" as "productType",
            "item"."travel_date" as "travelDate",
            "item"."product_snapshot" as "productSnapshot",
            "product"."id" as "productId",
            "translation"."title" as "productTitle"
          FROM 
            "orders" "order"
            INNER JOIN "order_items" "item" ON "item"."order_id" = "order"."id"
            INNER JOIN "products" "product" ON "item"."product_id" = "product"."id"
            LEFT JOIN "product_translations" "translation" ON "translation"."product_id" = "product"."id"
          WHERE 
            "item"."product_type" = 'TICKET'
            AND ("order"."email" ILIKE $1 OR "order"."phone_number" ILIKE $1)
        `;
        
        // Thêm điều kiện lọc trạng thái vé
        if (input.ticketStatus) {
          if (input.ticketStatus === 'used') {
            searchQuery += ` AND "item"."is_used" = true`;
          } else if (input.ticketStatus === 'unused') {
            searchQuery += ` AND "item"."is_used" = false`;
          }
        }
        
        // Thêm điều kiện lọc ngày đơn hàng
        const params = [`%${input.searchTerm}%`];
        let paramCount = 2;
        
        if (input.startOrderDate) {
          searchQuery += ` AND "order"."created_at" >= $${paramCount}`;
          params.push(input.startOrderDate);
          paramCount++;
        }
        
        if (input.endOrderDate) {
          searchQuery += ` AND "order"."created_at" <= $${paramCount}`;
          params.push(input.endOrderDate);
        }

        const entityManager = ctx.services.orderAdminService['orderRepository'].manager;
        
        // Thêm ORDER BY vào câu truy vấn để sắp xếp theo ngày tạo mới nhất (giảm dần)
        searchQuery += ` ORDER BY "order"."created_at" DESC`;
        
        const rawResults = await entityManager.query(searchQuery, params);
        
        if (!rawResults || rawResults.length === 0) {
          return [];
        }

        // Chuyển đổi dữ liệu thô thành định dạng mong muốn
        const tickets = [];
        const processedItemIds = new Set(); // Để tránh trùng lặp

        for (const row of rawResults) {
          // Bỏ qua nếu đã xử lý item này rồi
          if (processedItemIds.has(row.itemId)) {
            continue;
          }
          
          processedItemIds.add(row.itemId);
          
          // Lấy số lượt quét vé
          const scanCount = await ctx.services.orderAdminService.getTicketScanCount(row.itemId);
          
          tickets.push({
            id: row.itemId,
            qrCode: row.qrCode,
            orderId: row.orderId,
            isUsed: row.isUsed,
            productType: row.productType,
            scanCount: scanCount,
            travelDate: row.travelDate,
            productSnapshot: row.productSnapshot,
            product: {
              id: row.productId,
              translations: [{ title: row.productTitle }]
            },
            order: {
              orderCode: row.orderCode,
              status: row.status,
              customerName: row.customerName,
              email: row.email,
              phoneCode: row.phoneCode,
              phoneNumber: row.phoneNumber,
              createdAt: row.createdAt,
              paymentStatus: row.paymentStatus
            }
          });
        }

        return tickets;
      } catch (error) {
        console.error('Error in searchCustomerTickets:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Lỗi khi tìm kiếm vé theo thông tin khách hàng: ' + (error.message || 'Unknown error'),
        });
      }
    }),
    
  // Lấy lịch sử quét vé
  getTicketScanHistory: adminProcedure
    .use(requirePermission(Permissions.VIEW_SCAN_HISTORY))
    .input(z.object({
      orderItemId: z.number(),
      page: z.number().optional().default(1),
      pageSize: z.number().optional().default(10),
      search: z.string().optional(),
      scannerSearch: z.string().optional(),
      status: z.string().optional(),
      startDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
      endDate: z.string().optional().transform(val => val ? new Date(val) : undefined)
    }))
    .query(async ({ ctx, input }) => {
      try {
        const result = await ctx.services.orderAdminService.findScanHistoryForOrderItem({
          orderItemId: input.orderItemId,
          page: input.page,
          pageSize: input.pageSize,
          search: input.search,
          scannerSearch: input.scannerSearch,
          status: input.status,
          startDate: input.startDate,
          endDate: input.endDate
        });
        
        return result;
      } catch (error) {
        console.error('Error in getTicketScanHistory:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Lỗi khi lấy lịch sử quét vé',
        });
      }
    }),
    
  // Lấy tất cả lịch sử soát vé với phân trang
  getAllTicketScans: adminProcedure
    .use(requirePermission(Permissions.VIEW_SCAN_HISTORY))
    .input(z.object({
      page: z.number().optional(),
      pageSize: z.number().optional(),
      search: z.string().optional(),
      scannerSearch: z.string().optional(),
      status: z.string().optional(),
      startDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
      endDate: z.string().optional().transform(val => val ? new Date(val) : undefined)
    }))
    .query(async ({ ctx, input }) => {
      try {
        return await ctx.services.orderAdminService.findAllTicketScans(input);
      } catch (error) {
        console.error('Error in getAllTicketScans:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Lỗi khi lấy dữ liệu lịch sử soát vé',
        });
      }
    }),
    
  // Lấy lịch sử quét vé với phân trang
  getScanHistory: adminProcedure
    .use(requirePermission(Permissions.VIEW_SCAN_HISTORY))
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(10),
      query: z.string().optional()
    }))
    .query(async ({ ctx, input }) => {
      try {
        // Kiểm tra xem ctx.user.id có tồn tại không
        if (!ctx.user?.id) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Bạn cần đăng nhập để thực hiện chức năng này',
          });
        }

        if (!ctx.services.orderAdminService) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Service không khả dụng, vui lòng thử lại sau',
          });
        }
        
        const result = await ctx.services.orderAdminService.getScanHistory(
          input.page,
          input.limit,
          input.query
        );
        
        return result;
      } catch (error) {
        console.error('Error in getScanHistory:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Lỗi khi lấy lịch sử quét vé: ' + (error.message || 'Unknown error'),
        });
      }
    }),
    
  // Lấy lịch sử quét cho một vé cụ thể
  getScanHistoryForOrderItem: adminProcedure
    .use(requirePermission(Permissions.VIEW_SCAN_HISTORY))
    .input(z.object({
      orderItemId: z.number()
    }))
    .query(async ({ ctx, input }) => {
      try {
        // Kiểm tra xem ctx.user.id có tồn tại không
        if (!ctx.user?.id) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Bạn cần đăng nhập để thực hiện chức năng này',
          });
        }

        if (!ctx.services.orderAdminService) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Service không khả dụng, vui lòng thử lại sau',
          });
        }
        
        const result = await ctx.services.orderAdminService.getScanHistoryForOrderItem(
          input.orderItemId
        );
        
        return result;
      } catch (error) {
        console.error('Error in getScanHistoryForOrderItem:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Lỗi khi lấy lịch sử quét cho vé: ' + (error.message || 'Unknown error'),
        });
      }
    }),
}); 
