import { TRPCError } from '@trpc/server';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { ProductSnapshot, ProductType } from '../../order/entities/order-item.entity';
import { OrderStatus, PaymentStatus, OrderType } from '@ew/shared';
import { RefundReason, RefundStatus, RefundType } from '../../order/entities/order-refund.entity';
import { generateOrderCode } from '../../order/utils/order-code.util';
import { CreateRefundDto } from '../../order/frontend/services/order-frontend.service';
import { adminProcedure, publicProcedure, router } from '../procedures';

const addressSchema = z.object({
  fullName: z.string(),
  phone: z.string(),
  email: z.string().email().optional(),
  address: z.string(),
  city: z.string(),
  state: z.string().optional(),
  country: z.string(),
  postalCode: z.string().optional(),
}).strict();

const orderItemSchema = z.object({
  productId: z.number(),
  variantId: z.number().optional(),
  quantity: z.number().min(1),
  unitPrice: z.number(),
  totalPrice: z.number(),
  productType: z.nativeEnum(ProductType),
  travelDate: z.string().transform((str) => new Date(str)).optional(),
});

const createOrderSchema = z.object({
  userId: z.string().uuid().optional(),
  phoneCode: z.string(),
  phoneNumber: z.string(),
  email: z.string().email().optional(),
  customerName: z.string().optional(),
  orderType: z.nativeEnum(OrderType).optional(),
  shippingAddress: addressSchema.optional(),
  billingAddress: addressSchema.optional(),
  paymentMethod: z.string(),
  payment_method_id: z.number(),
  notes: z.string().optional(),
  items: z.array(orderItemSchema).min(1),
  totalAmount: z.number(),
  returnUrl: z.string(),
  cancelUrl: z.string(),
}).passthrough();

const quickPurchaseSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required'),
  phoneCode: z.string().min(1, 'Phone code is required'),
  phoneNumber: z.string().min(1, 'Phone number is required'),
  email: z.string().email().optional(),
  message: z.string().max(1000).optional(),
  productId: z.number().optional(),
  productName: z.string().optional(),
}).strict();

// Schema cho yêu cầu hoàn trả
const refundItemSchema = z.object({
  orderItemId: z.number(),
  quantity: z.number().min(1),
  reason: z.string().optional(),
  newDate: z.string().optional()
});

const createRefundSchema = z.object({
  orderCode: z.string(),
  requesterPhone: z.string(),
  requesterPhoneCode: z.string(),
  requesterName: z.string(),
  requesterEmail: z.string().email().optional(),
  refundReason: z.nativeEnum(RefundReason),
  refundType: z.nativeEnum(RefundType),
  details: z.string().optional(),
  items: z.array(refundItemSchema).min(1)
}).strict();

export const orderRouter = router({
  // Frontend routes
  getOrder: publicProcedure
    .input(z.number())
    .query(async ({ ctx, input }) => {
      const order = await ctx.services.orderFrontendService.findOrderById(input);
      if (!order) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Order not found',
        });
      }
      return order;
    }),

  getOrderByCode: publicProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const order = await ctx.services.orderFrontendService.findOrderByCode(input);
      if (!order) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Order not found',
        });
      }
      return order;
    }),

  getUserOrders: publicProcedure
    .input(z.string().uuid())
    .query(async ({ ctx, input }) => {
      return ctx.services.orderFrontendService.findOrdersByUserId(input);
    }),

  createOrder: publicProcedure
    .input(createOrderSchema)
    .mutation(async ({ ctx, input }) => {
      const { returnUrl, cancelUrl, items, ...orderData } = input;

      const isDigitalProduct = items.every(item => item.productType !== ProductType.PHYSICAL);
      
      // Get products with their variants and translations
      const products = await Promise.all(
        items.map(item => 
          ctx.services.productFrontendService.findById(item.productId)
        )
      );

      // Generate unique order code
      const orderCode = generateOrderCode();

      // Get payment description template from settings
      const paymentDescriptionTemplate = await ctx.services.settingsService.findByKey('payment_description_template');
      const paymentDescription = (paymentDescriptionTemplate?.value || 'Thanh toán đơn hàng {order_code}')
        .replace('{order_code}', orderCode);

      const mappedItems = items.map((item, index) => {
        const product = products[index];
        if (!product) throw new TRPCError({ 
          code: 'NOT_FOUND',
          message: `Product with ID ${item.productId} not found`
        });

        const productSnapshot: ProductSnapshot = {
          id: product.id,
          title: product.translations.find(t => t.locale === 'vi')?.title || product.translations[0]?.title || '',
          translations: product.translations
            .filter(t => t.locale === 'vi')
            .map(t => ({
              locale: t.locale,
              title: t.title,
              description: t.shortDescription
            })),
        };

        // Find matching variant
        const variant = product.variants?.find(v => v.id === item.variantId);
        if (variant) {
          productSnapshot.variant = {
            id: variant.id,
            name: variant.translations.find(t => t.locale === 'vi')?.name || variant.translations[0]?.name || '',
            price: variant.price
          };
        }

        return {
          ...item,
          productCode: isDigitalProduct ? randomUUID() : null,
          qrCode: item.productType === ProductType.TICKET ? randomUUID() : null,
          productSnapshot,
          travelDate: item.travelDate
        };
      });

      const result = await ctx.services.orderFrontendService.createOrderWithPayment(
        {
          orderCode,
          phoneCode: orderData.phoneCode,
          phoneNumber: orderData.phoneNumber,
          email: orderData.email,
          userId: orderData.userId,
          customerName: orderData.customerName,
          orderType: orderData.orderType,
          shippingAddress: orderData.shippingAddress,
          billingAddress: orderData.billingAddress,
          paymentMethod: orderData.paymentMethod,
          notes: orderData.notes,
          totalAmount: orderData.totalAmount,
          payment_method_id: orderData.payment_method_id,
          return_url: returnUrl,
          cancel_url: cancelUrl,
          payment_description: paymentDescription
        },
        mappedItems,
        {
          order_code: orderCode,
          return_url: returnUrl,
          cancel_url: cancelUrl
        }
      );

      return result;
    }),

  quickPurchase: publicProcedure
    .input(quickPurchaseSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const orderCode = generateOrderCode();
        const notes: string[] = ['Quick purchase request'];

        if (input.productName) {
          const productLine = input.productId
            ? `Product: ${input.productName} (ID: ${input.productId})`
            : `Product: ${input.productName}`;
          notes.push(productLine);
        }

        if (input.message) {
          notes.push(`Customer note: ${input.message}`);
        }

        await ctx.services.orderFrontendService.createOrder({
          orderCode,
          phoneCode: input.phoneCode,
          phoneNumber: input.phoneNumber,
          email: input.email,
          customerName: input.customerName,
          totalAmount: 0,
          paymentMethod: 'quick_purchase',
          status: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
          orderType: OrderType.STANDARD,
          notes: notes.join('\n'),
        });

        return {
          success: true,
          orderCode,
        };
      } catch (error) {
        console.error('Error creating quick purchase order:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create quick purchase order',
        });
      }
    }),

  // Admin routes
  admin: router({
    getAllOrders: adminProcedure
      .input(z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(10),
        status: z.nativeEnum(OrderStatus).optional(),
        paymentStatus: z.nativeEnum(PaymentStatus).optional(),
        search: z.string().optional(),
      }))
      .query(async ({ ctx, input }) => {
        return ctx.services.orderAdminService.findAllOrders(input);
      }),

    getOrderById: adminProcedure
      .input(z.number())
      .query(async ({ ctx, input }) => {
        const order = await ctx.services.orderAdminService.findOrderById(input);
        if (!order) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Order not found',
          });
        }
        return order;
      }),

    updateOrderStatus: adminProcedure
      .input(z.object({
        id: z.number(),
        status: z.nativeEnum(OrderStatus),
      }))
      .mutation(async ({ ctx, input }) => {
        return ctx.services.orderAdminService.updateOrderStatus(
          input.id,
          input.status
        );
      }),

    updatePaymentStatus: adminProcedure
      .input(z.object({
        id: z.number(),
        paymentStatus: z.nativeEnum(PaymentStatus),
      }))
      .mutation(async ({ ctx, input }) => {
        return ctx.services.orderAdminService.updatePaymentStatus(
          input.id,
          input.paymentStatus
        );
      }),

    deleteOrder: adminProcedure
      .input(z.number())
      .mutation(async ({ ctx, input }) => {
        await ctx.services.orderAdminService.deleteOrder(input);
        return { success: true };
      }),

    updateOrderItemUsageStatus: adminProcedure
      .input(z.object({
        orderItemId: z.number(),
        isUsed: z.boolean(),
      }))
      .mutation(async ({ ctx, input }) => {
        return ctx.services.orderAdminService.updateOrderItemUsageStatus(
          input.orderItemId,
          input.isUsed
        );
      }),

    getAllRefunds: adminProcedure
      .input(z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(10),
        status: z.nativeEnum(RefundStatus).optional(),
        search: z.string().optional(),
      }))
      .query(async ({ ctx, input }) => {
        return ctx.services.orderAdminService.findAllRefunds(input);
      }),

    getRefundById: adminProcedure
      .input(z.number())
      .query(async ({ ctx, input }) => {
        const refund = await ctx.services.orderAdminService.findRefundById(input);
        if (!refund) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Không tìm thấy yêu cầu hoàn trả',
          });
        }
        return refund;
      }),

    updateRefundStatus: adminProcedure
      .input(z.object({
        id: z.number(),
        status: z.nativeEnum(RefundStatus),
        adminNotes: z.string().optional()
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          return ctx.services.orderAdminService.updateRefundStatus(
            input.id,
            input.status,
            input.adminNotes
          );
        } catch (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: error.message || 'Không thể cập nhật trạng thái yêu cầu hoàn trả',
          });
        }
      }),
  }),

  // Thêm các route cho hoàn trả
  validateOrder: publicProcedure
    .input(z.object({
      orderCode: z.string(),
      phoneNumber: z.string()
    }))
    .query(async ({ ctx, input }) => {
      try {
        let order;
        
        // Kiểm tra xem phương thức findOrderByCodeAndPhone có tồn tại không
        if (typeof ctx.services.orderFrontendService.findOrderByCodeAndPhone === 'function') {
          order = await ctx.services.orderFrontendService.findOrderByCodeAndPhone(
            input.orderCode,
            input.phoneNumber
          );
        } else {
          // Nếu không tồn tại thì sử dụng findOrderByCode và kiểm tra số điện thoại
          order = await ctx.services.orderFrontendService.findOrderByCode(input.orderCode);
          
          if (order && order.phoneNumber !== input.phoneNumber) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Số điện thoại không chính xác cho đơn hàng này',
            });
          }
        }
        
        if (!order) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Không tìm thấy đơn hàng với mã đơn và số điện thoại này',
          });
        }
        
        // Kiểm tra loại đơn hàng - chỉ cho phép đơn hàng vé (TICKET) được đổi
        if (order.orderType !== OrderType.TICKET) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Chỉ cho phép đổi ngày cho đơn hàng loại vé',
          });
        }
        
        // Kiểm tra trạng thái thanh toán
        if (order.paymentStatus !== PaymentStatus.PAID) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Đơn hàng chưa thanh toán. Chỉ có thể đổi vé cho đơn hàng đã thanh toán',
          });
        }
        
        // Lọc các vé hợp lệ để đổi
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Lọc ticket items và kiểm tra điều kiện
        const validItems = [];
        const invalidItems = [];
        
        for (const item of order.items) {
          if (item.productType !== ProductType.TICKET) {
            continue;
          }
          
          // Kiểm tra xem vé đã được sử dụng chưa
          if (item.isUsed) {
            invalidItems.push({
              ...item,
              invalidReason: 'Vé đã được sử dụng'
            });
            continue;
          }
          
          // Kiểm tra ngày sử dụng vé
          const travelDate = item.travelDate ? new Date(item.travelDate) : null;
          if (travelDate && travelDate < today) {
            invalidItems.push({
              ...item,
              invalidReason: 'Vé đã hết hạn sử dụng'
            });
            continue;
          }
          
          // Kiểm tra lịch sử quét vé
          const scanHistory = await ctx.services.orderFrontendService.getTicketScanHistory(item.id);
          if (scanHistory && scanHistory.length > 0) {
            invalidItems.push({
              ...item,
              invalidReason: 'Vé đã được sử dụng (đã có lịch sử quét)'
            });
            continue;
          }
          
          validItems.push(item);
        }
        
        // Nếu không có vé hợp lệ
        if (validItems.length === 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Không có vé hợp lệ để đổi. Các vé trong đơn hàng đã được sử dụng hoặc đã hết hạn',
          });
        }
        
        // Trả về đơn hàng với chỉ các vé hợp lệ
        order.items = validItems;
        return order;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Đã xảy ra lỗi khi xác thực đơn hàng',
        });
      }
    }),

  getTicketScanHistory: publicProcedure
    .input(z.object({
      orderItemId: z.number()
    }))
    .query(async ({ ctx, input }) => {
      try {
        return await ctx.services.orderFrontendService.getTicketScanHistory(input.orderItemId);
      } catch (error) {
        console.error('Error getting ticket scan history:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Không thể lấy lịch sử quét vé, vui lòng thử lại sau',
        });
      }
    }),

  createRefundRequest: publicProcedure
    .input(createRefundSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Sử dụng type assertion để chỉ định rõ ràng input là CreateRefundDto
        const createRefundDto: CreateRefundDto = {
          orderCode: input.orderCode,
          requesterName: input.requesterName,
          requesterPhone: input.requesterPhone,
          requesterPhoneCode: input.requesterPhoneCode,
          requesterEmail: input.requesterEmail,
          refundReason: input.refundReason,
          refundType: input.refundType,
          details: input.details,
          items: input.items.map(item => ({
            orderItemId: item.orderItemId,
            quantity: item.quantity,
            reason: item.reason,
            newDate: item.newDate
          }))
        };
        
        const result = await ctx.services.orderFrontendService.createRefundRequest(createRefundDto);
        return result;
      } catch (error) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error.message || 'Không thể tạo yêu cầu hoàn trả',
        });
      }
    }),

  getRefundStatus: publicProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      try {
        const refund = await ctx.services.orderFrontendService.findRefundByCode(input);
        
        if (!refund) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Không tìm thấy yêu cầu hoàn trả với mã này',
          });
        }
        
        return refund;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Đã xảy ra lỗi khi kiểm tra trạng thái hoàn trả',
        });
      }
    }),

  getRefundsByOrderCode: publicProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      try {
        return ctx.services.orderFrontendService.findRefundsByOrderCode(input);
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Đã xảy ra lỗi khi lấy danh sách yêu cầu hoàn trả',
        });
      }
    }),
}); 
