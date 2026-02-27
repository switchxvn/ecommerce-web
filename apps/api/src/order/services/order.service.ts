import { BadRequestException, HttpException, HttpStatus, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../../../../backend/src/modules/order/entities/order.entity';
import { OrderAdminService } from '../../../../backend/src/modules/order/admin/services/order-admin.service';
import { PaymentFrontendService } from '../../../../backend/src/modules/payment/frontend/services/payment-frontend.service';
import { MailService } from '../../../../backend/src/modules/mail/services/mail.service';
import { CreateOrderDto } from '../dtos/create-order.dto';
import { OrderCancelDto, OrderConfirmDto } from '../dtos/order-action.dto';
import { OrderItemResponseDto, OrderResponseDto, ProductSnapshotDto } from '../dtos/order-response.dto';
import { TicketService } from '../../ticket/services/ticket.service';
import { Product, ProductType } from '../../../../backend/src/modules/product/entities/product.entity';
import { OrderItem, ProductSnapshot } from '../../../../backend/src/modules/order/entities/order-item.entity';
import * as crypto from 'crypto';

const ADMIN_TIMEZONE = 'Asia/Ho_Chi_Minh';

function formatDateViGmt7(date: Date): string {
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: ADMIN_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
}

// Extended Order type with additional metadata properties
type ExtendedOrder = Order & {
  metadata?: Record<string, any>;
};

// Extended OrderItem type with additional metadata properties
type ExtendedOrderItem = OrderItem & {
  metadata?: Record<string, any>;
};

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly orderAdminService: OrderAdminService,
    private readonly paymentService: PaymentFrontendService,
    private readonly mailService: MailService,
    private readonly ticketService: TicketService,
  ) {}

  async createOrder(createOrderDto: CreateOrderDto): Promise<OrderResponseDto> {
    try {
      this.logger.log('Creating new order', { email: createOrderDto.email });

      // Calculate total amount for the order
      const totalAmount = createOrderDto.items.reduce(
        (sum, item) => sum + (item.quantity * item.unitPrice), 
        0
      );

      // Prepare order data
      const orderCode = this.generateOrderCode();
      const orderData: Partial<Order> = {
        orderCode,
        customerName: createOrderDto.customerName,
        email: createOrderDto.email,
        phoneCode: '+84', // Default to Vietnam
        phoneNumber: createOrderDto.phone,
        paymentMethod: createOrderDto.paymentMethod,
        status: 'pending' as any,
        paymentStatus: 'pending' as any,
        orderType: 'standard' as any,
        totalAmount,
        notes: JSON.stringify({
          returnUrl: createOrderDto.returnUrl,
          ...createOrderDto.metadata
        })
      };

      // Create new order
      const newOrder = await this.orderRepository.save(orderData);

      // Create order items - split each ticket into separate records
      const orderItems: OrderItem[] = [];
      
      for (const item of createOrderDto.items) {
        // Get product information for snapshot
        const productSnapshot = await this.buildProductSnapshot(item.ticketId, item.variantId);
        
        // Create individual tickets for TICKET product type
        for (let i = 0; i < item.quantity; i++) {
          const orderItem = new OrderItem();
          orderItem.order = newOrder;
          orderItem.productId = item.ticketId;
          orderItem.quantity = 1; // Each ticket has quantity of 1
          orderItem.unitPrice = item.unitPrice;
          orderItem.totalPrice = item.unitPrice; // Total = unit price since quantity = 1
          orderItem.productType = 'TICKET' as any;
          orderItem.productSnapshot = productSnapshot;
          orderItem.travelDate = item.selectedDate ? new Date(item.selectedDate) : null;
          orderItems.push(orderItem);
        }
      }

      await this.orderItemRepository.save(orderItems);

      // Get complete order information and return
      return this.getOrderById(newOrder.id);
    } catch (error) {
      this.logger.error('Error creating order:', error);
      throw error;
    }
  }

  private generateOrderCode(): string {
    const prefix = 'ORD';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}${timestamp}${random}`;
  }

  async getOrderById(id: number): Promise<OrderResponseDto> {
    try {
      // Get order information with relations
      const order = await this.orderRepository.findOne({
        where: { id },
        relations: ['items', 'items.product', 'items.product.translations']
      });

      if (!order) {
        throw new NotFoundException(`Order with ID ${id} not found`);
      }

      // Convert data to response format
      return this.mapToResponseDto(order);
    } catch (error) {
      this.logger.error(`Error fetching order with ID ${id}:`, error);
      throw error;
    }
  }

  async confirmOrder(confirmDto: OrderConfirmDto): Promise<OrderResponseDto> {
    try {
      const { orderId, transactionId, paymentReference, metadata } = confirmDto;
      
      // Check current order status
      const order = await this.orderRepository.findOne({
        where: { id: orderId },
        relations: ['items']
      });
      
      if (!order) {
        throw new NotFoundException(`Order with ID ${orderId} not found`);
      }
      
      if (order.paymentStatus === 'paid') {
        this.logger.log(`Order ${orderId} is already paid`);
        return this.getOrderById(orderId);
      }

      // Update order status
      order.paymentStatus = 'paid' as any;
      order.status = 'confirmed' as any;
      
      // Update transaction information in notes
      const notesData = order.notes ? JSON.parse(order.notes) : {};
      order.notes = JSON.stringify({
        ...notesData,
        transactionId,
        paymentReference,
        confirmedAt: new Date().toISOString(),
        ...metadata
      });
      
      await this.orderRepository.save(order);
      
      // Generate QR codes for each individual ticket
      for (const item of order.items) {
        try {
          // Generate unique QR code for each ticket
          const ticketToken = this.generateTicketToken(order.id, item.id);
          const qrCodeUrl = await this.generateQrCodeUrl(ticketToken);
          
          // Update item with individual QR code
          item.qrCode = ticketToken;
          item.imageQrCode = qrCodeUrl;
          await this.orderItemRepository.save(item);
          
          this.logger.log(`Generated QR code for ticket ${item.id}: ${ticketToken}`);
        } catch (error) {
          this.logger.error(`Failed to generate QR code for order item ${item.id}:`, error);
        }
      }
      
      // Send confirmation email with digital tickets
      const updatedOrder = await this.getOrderById(orderId);
      await this.sendTicketConfirmationEmail(updatedOrder);
      
      return updatedOrder;
    } catch (error) {
      this.logger.error('Error confirming order:', error);
      throw error;
    }
  }

  private generateTicketToken(orderId: number, itemId: number): string {
    const timestamp = Date.now();
    const randomPart = crypto.randomBytes(8).toString('hex'); // Increase random length
    const uniqueId = crypto.randomUUID().split('-')[0]; // Add UUID segment
    return `TKT-${orderId}-${itemId}-${timestamp}-${randomPart}-${uniqueId}`;
  }

  private async generateQrCodeUrl(ticketToken: string): Promise<string> {
    // URL to verify tickets with unique token
    const baseUrl = this.configService.get('TICKET_VERIFICATION_URL', 'https://verify.example.com');
    return `${baseUrl}/verify/${ticketToken}`;
  }

  async cancelOrder(cancelDto: OrderCancelDto): Promise<OrderResponseDto> {
    try {
      const { orderId, reason, metadata } = cancelDto;
      
      // Check current order status
      const order = await this.orderRepository.findOne({
        where: { id: orderId }
      });
      
      if (!order) {
        throw new NotFoundException(`Order with ID ${orderId} not found`);
      }
      
      // Only pending orders can be cancelled
      if (order.status !== 'pending') {
        throw new BadRequestException(`Cannot cancel order with status ${order.status}`);
      }
      
      // Update status and cancellation information
      order.status = 'cancelled' as any;
      
      // Update cancellation reason in notes
      const notesData = order.notes ? JSON.parse(order.notes) : {};
      order.notes = JSON.stringify({
        ...notesData,
        cancellationReason: reason,
        cancelledAt: new Date().toISOString(),
        ...metadata
      });
      
      await this.orderRepository.save(order);
      
      return this.getOrderById(orderId);
    } catch (error) {
      this.logger.error('Error cancelling order:', error);
      throw error;
    }
  }

  /**
   * Build product snapshot from current product data
   */
  private async buildProductSnapshot(productId: number, variantId?: number): Promise<ProductSnapshot> {
    try {
      const product = await this.productRepository.findOne({
        where: { id: productId },
        relations: ['translations', 'variants', 'variants.translations']
      });

      if (!product) {
        // Fallback snapshot if product not found
        return {
          id: productId,
          title: `Product #${productId}`,
          translations: [{ locale: 'vi', title: `Product #${productId}` }]
        };
      }

      const snapshot: ProductSnapshot = {
        id: product.id,
        title: product.translations?.[0]?.title || `Product #${product.id}`,
        translations: product.translations.map(t => ({
          locale: t.locale,
          title: t.title,
          description: t.shortDescription || t.content
        }))
      };

      // Add variant information if specified
      if (variantId && product.variants) {
        const variant = product.variants.find(v => v.id === variantId);
        if (variant) {
          snapshot.variant = {
            id: variant.id,
            name: variant.translations?.[0]?.name || `Variant #${variant.id}`,
            price: Number(variant.price) || Number(product.price) || 0
          };
        }
      }

      return snapshot;
    } catch (error) {
      this.logger.error(`Failed to build product snapshot for product ${productId}:`, error);
      // Return fallback snapshot
      return {
        id: productId,
        title: `Product #${productId}`,
        translations: [{ locale: 'vi', title: `Product #${productId}` }]
      };
    }
  }

  // Helper methods for data conversion
  private mapToResponseDto(order: Order): OrderResponseDto {
    const returnUrl = order.notes ? 
      JSON.parse(order.notes)?.returnUrl || null : null;
    
    const paymentUrl = order.notes ? 
      JSON.parse(order.notes)?.payment_url || null : null;

    return {
      id: order.id,
      orderCode: order.orderCode,
      customerName: order.customerName || '',
      email: order.email || '',
      phone: order.phoneNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      totalAmount: Number(order.totalAmount),
      createdAt: order.createdAt.toISOString(),
      items: order.items ? order.items.map(item => this.mapToItemResponseDto(item)) : [],
      returnUrl,
      paymentUrl,
    };
  }

  private mapToItemResponseDto(item: OrderItem): OrderItemResponseDto {
    const title = item.product?.translations?.[0]?.title || 
      item.productSnapshot?.translations?.[0]?.title || 
      `Product #${item.productId}`;

    return {
      id: item.id,
      productId: item.productId,
      title,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      totalPrice: Number(item.totalPrice),
      isUsed: item.isUsed,
      qrCode: item.qrCode,
      qrCodeImageUrl: item.imageQrCode,
      travelDate: item.travelDate ? item.travelDate.toISOString().split('T')[0] : null,
      productSnapshot: item.productSnapshot as ProductSnapshotDto,
    };
  }

  private async sendTicketConfirmationEmail(order: OrderResponseDto): Promise<void> {
    try {
      if (!order.email) {
        this.logger.warn(`No email address for order ${order.id}, skipping ticket confirmation email`);
        return;
      }

      // Prepare email data
      const emailData = {
        customerName: order.customerName,
        orderCode: order.orderCode,
        orderDate: formatDateViGmt7(new Date()),
        totalAmount: order.totalAmount.toLocaleString('vi-VN', { 
          style: 'currency', 
          currency: 'VND' 
        }),
        tickets: order.items.map(item => ({
          ticketName: item.title,
          ticketPrice: item.unitPrice.toLocaleString('vi-VN', { 
            style: 'currency', 
            currency: 'VND' 
          }),
          selectedDate: item.travelDate 
            ? formatDateViGmt7(new Date(item.travelDate))
            : '',
          qrCodeUrl: item.qrCodeImageUrl || '',
        })),
      };

      // Send email using the mail service
      await this.mailService.sendMail({
        to: order.email,
        subject: `Vé điện tử - Mã đơn hàng #${order.orderCode}`,
        template: {
          id: 'TICKET_CONFIRMATION',
          data: emailData
        }
      });

      this.logger.log(`Ticket confirmation email sent to ${order.email} for order ${order.id}`);
    } catch (error) {
      this.logger.error(`Failed to send ticket confirmation email for order ${order.id}:`, error);
      // Don't throw error as this is a secondary process and shouldn't affect main flow
    }
  }
} 
