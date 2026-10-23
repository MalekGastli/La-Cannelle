import { apiClient } from '../api';

export interface CustomerSummary {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  joinDate: string;
  totalOrders: number;
  totalSpent: number;
  lastOrder: string | null;
  status?: string;
  tier?: string;
  location?: string | null;
  preferences?: any;
  allergies?: any;
  notes?: string | null;
}

export const customersApi = {
  async getCustomers(filters?: { status?: string; tier?: string; search?: string }): Promise<CustomerSummary[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.tier) params.append('tier', filters.tier);
    if (filters?.search) params.append('search', filters.search);

    const query = params.toString();
    const endpoint = query ? `/customers?${query}` : '/customers';

    const response = await apiClient.get<CustomerSummary[]>(endpoint);
    if (response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to get customers');
  },

  async getCustomerById(id: number): Promise<CustomerSummary> {
    const response = await apiClient.get<CustomerSummary>(`/customers/${id}`);
    if (response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to get customer');
  }
};
