import { OrderModel, DASHBOARD_PERIODS, type DashboardPeriod } from "../models/order.model";
import { ProductModel } from "../models/product.model";
import { AnalyticsModel } from "../models/analytics.model";

export { DASHBOARD_PERIODS };
export type { DashboardPeriod };

function serializeBestSeller(row: Awaited<ReturnType<typeof AnalyticsModel.bestSellingProducts>>[number]) {
  return {
    productId: row.product_id,
    name: row.name,
    imageUrl: row.image_url,
    unitsSold: parseInt(row.units_sold, 10),
    revenue: parseFloat(row.revenue),
    orderCount: parseInt(row.order_count, 10)
  };
}

function serializeCouponPerformance(row: Awaited<ReturnType<typeof AnalyticsModel.couponPerformance>>[number]) {
  const totalDiscountGiven = parseFloat(row.total_discount_given);
  const revenueFromOrders = parseFloat(row.revenue_from_orders);
  return {
    id: row.id,
    code: row.code,
    discountType: row.discount_type,
    discountValue: parseFloat(row.discount_value),
    isActive: row.is_active,
    redemptionCount: parseInt(row.redemption_count, 10),
    totalDiscountGiven,
    revenueFromOrders,

    revenuePerDiscountRupee: totalDiscountGiven > 0 ? Math.round((revenueFromOrders / totalDiscountGiven) * 100) / 100 : null
  };
}

export const DashboardService = {
  async stats() {
    // Was: fetch up to 1000 full product rows and count low/out-of-stock in JS.
    // Now: three cheap, independent aggregates run in parallel; product stock
    // counts are computed in a single index-only scan in Postgres. Same fields,
    // same definitions, same result shape as before.
    const [totalSales, orderCount, stockSummary] = await Promise.all([
      OrderModel.totalRevenue(),
      OrderModel.countAll(),
      ProductModel.stockSummary()
    ]);

    return {
      totalSales,
      orderCount,
      productCount: stockSummary.productCount,
      lowStockCount: stockSummary.lowStockCount,
      outOfStockCount: stockSummary.outOfStockCount
    };
  },

  async salesSeries(period: DashboardPeriod) {
    const points = await OrderModel.salesSeriesForPeriod(period);
    return { period, points };
  },

  async bestSellingProducts(limit = 10, sinceDays?: number) {
    const rows = await AnalyticsModel.bestSellingProducts(limit, sinceDays);
    return rows.map(serializeBestSeller);
  },

  async couponPerformance(limit = 20) {
    const rows = await AnalyticsModel.couponPerformance(limit);
    return rows.map(serializeCouponPerformance);
  }
};
