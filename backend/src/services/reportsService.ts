import { Prisma } from '@prisma/client';
import { prisma, withRetry } from '../prisma';

/** SQL fragment filtering "orders" (aliased `o`) by createdAt; empty when no bounds are given. */
const createdAtFilter = (dateFrom?: Date, dateTo?: Date) => {
  const parts: Prisma.Sql[] = [];
  if (dateFrom) parts.push(Prisma.sql`o."createdAt" >= ${dateFrom}`);
  if (dateTo) parts.push(Prisma.sql`o."createdAt" <= ${dateTo}`);
  return parts.length ? Prisma.sql`WHERE ${Prisma.join(parts, ' AND ')}` : Prisma.empty;
};

// All aggregation happens in PostgreSQL: the old implementation loaded every order (with all
// items) into memory, which grows linearly with the table and would time out on serverless.
export const reportsService = {
  async getRevenueReport(dateFrom?: Date, dateTo?: Date) {
    const filter = createdAtFilter(dateFrom, dateTo);

    const [totals, daily, categories] = await Promise.all([
      withRetry(() =>
        prisma.$queryRaw<Array<{ revenue: number; orders: number }>>`
          SELECT COALESCE(SUM(o."total"), 0)::float8 AS revenue, COUNT(*)::int AS orders
          FROM "orders" o ${filter}`
      ),
      withRetry(() =>
        prisma.$queryRaw<Array<{ date: string; revenue: number; orders: number }>>`
          SELECT to_char(o."createdAt", 'YYYY-MM-DD') AS date,
                 SUM(o."total")::float8 AS revenue, COUNT(*)::int AS orders
          FROM "orders" o ${filter}
          GROUP BY 1 ORDER BY 1`
      ),
      withRetry(() =>
        prisma.$queryRaw<Array<{ category: string; revenue: number }>>`
          SELECT p."category"::text AS category, SUM(oi."price" * oi."quantity")::float8 AS revenue
          FROM "order_items" oi
          JOIN "orders" o ON o."id" = oi."orderId"
          JOIN "products" p ON p."id" = oi."productId"
          ${filter}
          GROUP BY 1 ORDER BY 2 DESC`
      )
    ]);

    const totalRevenue = totals[0]?.revenue ?? 0;
    const totalOrders = totals[0]?.orders ?? 0;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return {
      totalRevenue,
      averageOrderValue,
      totalOrders,
      dailyRevenue: daily.map((row) => ({ date: row.date, revenue: row.revenue, orders: row.orders })),
      byCategory: categories.map((row) => ({
        category: row.category,
        revenue: row.revenue,
        percentage: totalRevenue > 0 ? (row.revenue / totalRevenue) * 100 : 0
      }))
    };
  },

  async getPopularItems(dateFrom?: Date, dateTo?: Date) {
    const filter = createdAtFilter(dateFrom, dateTo);

    const rows = await withRetry(() =>
      prisma.$queryRaw<
        Array<{ id: number; name: string; category: string; orders: number; revenue: number; popularity: number }>
      >`
        SELECT oi."productId" AS id,
               COALESCE(MAX(p."name"), MAX(oi."name")) AS name,
               COALESCE(MAX(p."category"::text), 'UNKNOWN') AS category,
               SUM(oi."quantity")::int AS orders,
               SUM(oi."price" * oi."quantity")::float8 AS revenue,
               COALESCE(MAX(p."popularity"), 0)::int AS popularity
        FROM "order_items" oi
        JOIN "orders" o ON o."id" = oi."orderId"
        LEFT JOIN "products" p ON p."id" = oi."productId"
        ${filter}
        GROUP BY oi."productId"
        ORDER BY revenue DESC
        LIMIT 20`
    );

    return rows;
  },

  async getCustomerAnalytics() {
    const [customerRows, orderCustomerRows, revenue] = await Promise.all([
      withRetry(() => prisma.user.count({ where: { role: 'CLIENT' } })),
      withRetry(() =>
        prisma.$queryRaw<Array<{ with_orders: number; returning: number }>>`
          SELECT COUNT(*)::int AS with_orders,
                 COUNT(*) FILTER (WHERE c.n > 1)::int AS returning
          FROM (
            SELECT o."userId", COUNT(*) AS n
            FROM "orders" o
            JOIN "users" u ON u."id" = o."userId" AND u."role" = 'CLIENT'
            GROUP BY o."userId"
          ) c`
      ),
      withRetry(() => prisma.order.aggregate({ _sum: { total: true } }))
    ]);

    const totalCustomers = customerRows;
    const withOrders = orderCustomerRows[0]?.with_orders ?? 0;
    const returningCustomers = orderCustomerRows[0]?.returning ?? 0;
    const newCustomers = totalCustomers - withOrders;

    const retentionRate = withOrders > 0 ? (returningCustomers / withOrders) * 100 : 0;
    const avgCustomerValue = withOrders > 0 ? (revenue._sum.total || 0) / withOrders : 0;

    return {
      newCustomers,
      returningCustomers,
      retentionRate: Math.round(retentionRate * 10) / 10,
      avgCustomerValue: Math.round(avgCustomerValue * 100) / 100
    };
  }
};
