import { apiClient } from '../api';

export type ServiceOccasion = 'BUSINESS' | 'PRIVATE' | 'BOTH';

export interface Service {
  id: number;
  name: string;
  nameDe?: string | null;
  occasion: ServiceOccasion;
  description?: string | null;
  descriptionDe?: string | null;
  image?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const servicesApi = {
  async getServices(filters?: { occasion?: ServiceOccasion | 'business' | 'private'; isActive?: boolean; search?: string }) {
    const params = new URLSearchParams();
    if (filters?.occasion) params.append('occasion', String(filters.occasion).toUpperCase());
    if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));
    if (filters?.search) params.append('search', filters.search);

    const query = params.toString();
    const endpoint = query ? `/services?${query}` : '/services';

    const response = await apiClient.get<Service[]>(endpoint);
    if (response.data) return response.data;
    throw new Error(response.error || 'Failed to get services');
  },

  async createService(data: Partial<Service>) {
    const response = await apiClient.post<Service>('/services', data);
    if (response.data) return response.data;
    throw new Error(response.error || 'Failed to create service');
  },

  async updateService(id: number, data: Partial<Service>) {
    const response = await apiClient.put<Service>(`/services/${id}`, data);
    if (response.data) return response.data;
    throw new Error(response.error || 'Failed to update service');
  },

  async deleteService(id: number) {
    const response = await apiClient.delete(`/services/${id}`);
    if (response.error) throw new Error(response.error);
  },

  async restoreDefaultServices(): Promise<{ created: number; totalDefaults: number }> {
    const response = await apiClient.post<{ created: number; totalDefaults: number }>('/services/restore-defaults', {});
    if (response.data) return response.data;
    throw new Error(response.error || 'Failed to restore default services');
  }
};
