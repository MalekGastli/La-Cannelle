import { apiClient } from '../api';

export type RevenueReport = {
  totalRevenue: number;
  averageOrderValue: number;
  totalOrders: number;
  dailyRevenue: Array<{ date: string; revenue: number; orders: number }>;
  byCategory: Array<{ category: string; revenue: number; percentage: number }>;
};

export type PopularItem = {
  id: number;
  name: string;
  category: string;
  orders: number;
  revenue: number;
  popularity: number;
};

export type CustomerAnalytics = {
  newCustomers: number;
  returningCustomers: number;
  retentionRate: number;
  avgCustomerValue: number;
};

const toIsoDate = (value?: string | Date) => {
  if (!value) return undefined;
  if (value instanceof Date) return value.toISOString();
  return value;
};

export const reportsApi = {
  async getRevenueReport(filters?: { dateFrom?: string | Date; dateTo?: string | Date }): Promise<RevenueReport> {
    const params = new URLSearchParams();
    const dateFrom = toIsoDate(filters?.dateFrom);
    const dateTo = toIsoDate(filters?.dateTo);
    if (dateFrom) params.append('dateFrom', dateFrom);
    if (dateTo) params.append('dateTo', dateTo);
    const query = params.toString();
    const endpoint = query ? `/reports/revenue?${query}` : '/reports/revenue';

    const response = await apiClient.get<RevenueReport>(endpoint);
    if (response.data) return response.data;
    throw new Error(response.error || 'Failed to get revenue report');
  },

  async getPopularItems(filters?: { dateFrom?: string | Date; dateTo?: string | Date }): Promise<PopularItem[]> {
    const params = new URLSearchParams();
    const dateFrom = toIsoDate(filters?.dateFrom);
    const dateTo = toIsoDate(filters?.dateTo);
    if (dateFrom) params.append('dateFrom', dateFrom);
    if (dateTo) params.append('dateTo', dateTo);
    const query = params.toString();
    const endpoint = query ? `/reports/popular-items?${query}` : '/reports/popular-items';

    const response = await apiClient.get<PopularItem[]>(endpoint);
    if (response.data) return response.data;
    throw new Error(response.error || 'Failed to get popular items');
  },

  async getCustomerAnalytics(): Promise<CustomerAnalytics> {
    const response = await apiClient.get<CustomerAnalytics>('/reports/customers');
    if (response.data) return response.data;
    throw new Error(response.error || 'Failed to get customer analytics');
  }
};
