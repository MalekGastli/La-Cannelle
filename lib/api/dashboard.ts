import { apiClient } from '../api';

export interface DashboardStats {
  orders: {
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
  };
  revenue: {
    today: number;
    week: number;
    month: number;
    growth: number;
  };
  todaysEvents: Array<{
    id: string;
    client: string;
    time: string;
    guests: number;
    status: string;
  }>;
  recentOrders: Array<{
    id: string;
    client: string;
    amount: number;
    status: string;
    date: string;
  }>;
}

export const dashboardApi = {
  async getDashboard(): Promise<DashboardStats> {
    const response = await apiClient.get<DashboardStats>('/dashboard');
    if (response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to get dashboard stats');
  },
};
