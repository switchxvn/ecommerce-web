import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DashboardStats } from '../entities/dashboard-stats.entity';
import { Order } from '../../order/entities/order.entity';
import { PaymentStatus } from '@ew/shared';

@Injectable()
export class DashboardStatsService {
  private readonly logger = new Logger(DashboardStatsService.name);

  constructor(
    @InjectRepository(DashboardStats)
    private dashboardStatsRepository: Repository<DashboardStats>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>
  ) {}

  async calculateAndUpdateStats(): Promise<DashboardStats> {
    try {
      // Get current stats
      const currentStats = await this.dashboardStatsRepository.findOne({
        where: {},
        order: { createdAt: 'DESC' }
      }) || new DashboardStats();

      // Calculate new stats
      const [
        totalRevenue,
        totalOrders,
        totalCustomers
      ] = await Promise.all([
        this.calculateTotalRevenue(),
        this.calculateTotalOrders(),
        this.calculateTotalCustomers()
      ]);

      // Calculate changes
      const revenueChange = this.calculatePercentageChange(currentStats.revenue, totalRevenue);
      const ordersChange = this.calculatePercentageChange(currentStats.orders, totalOrders);
      const customersChange = this.calculatePercentageChange(currentStats.customers, totalCustomers);
      
      // Calculate conversion rate (orders/customers ratio)
      const conversionRate = totalCustomers > 0 ? (totalOrders / totalCustomers) * 100 : 0;
      const conversionRateChange = this.calculatePercentageChange(currentStats.conversionRate, conversionRate);

      // Create new stats record
      const newStats = this.dashboardStatsRepository.create({
        revenue: totalRevenue,
        revenueChange,
        orders: totalOrders,
        ordersChange,
        customers: totalCustomers,
        customersChange,
        conversionRate,
        conversionRateChange
      });

      return await this.dashboardStatsRepository.save(newStats);
    } catch (error) {
      this.logger.error('Failed to calculate and update dashboard stats:', error);
      throw error;
    }
  }

  private calculatePercentageChange(oldValue: number | string, newValue: number | string): number {
    const previous = Number(oldValue ?? 0);
    const current = Number(newValue ?? 0);
    if (previous === 0) return current > 0 ? 100 : 0;
    const change = ((current - previous) / previous) * 100;
    return Number.isFinite(change) ? change : 0;
  }

  private async calculateTotalRevenue(): Promise<number> {
    const result = await this.orderRepository
      .createQueryBuilder('order')
      .select('SUM(order.totalAmount)', 'total')
      .where('order.paymentStatus = :status', { status: PaymentStatus.PAID })
      .getRawOne();
    return Number(result?.total || 0);
  }

  private async calculateTotalOrders(): Promise<number> {
    return await this.orderRepository.count();
  }

  private async calculateTotalCustomers(): Promise<number> {
    const result = await this.orderRepository
      .createQueryBuilder('order')
      .select('COUNT(DISTINCT order.email)', 'total')
      .where('order.email IS NOT NULL')
      .getRawOne();
    return Number(result?.total || 0);
  }
} 
