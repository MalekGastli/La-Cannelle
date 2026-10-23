import { apiClient } from '../api';

export interface Accessory {
  id: number;
  nameEn: string;
  nameDe?: string | null;
  descriptionEn: string;
  descriptionDe?: string | null;
  detailsEn?: string | null;
  detailsDe?: string | null;
  unitEn?: string | null;
  unitDe?: string | null;
  price: number;
  quantityMode?: 'GUEST_COUNT' | 'FIXED' | 'CLIENT';
  fixedQuantity?: number | null;
  image?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const accessoriesApi = {
  async getAccessories(filters?: { isActive?: boolean; search?: string }): Promise<Accessory[]> {
    const params = new URLSearchParams();
    if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));
    if (filters?.search) params.append('search', filters.search);
    const query = params.toString();
    const endpoint = query ? `/accessories?${query}` : '/accessories';

    const response = await apiClient.get<Accessory[]>(endpoint);
    if (response.data) return response.data;
    throw new Error(response.error || 'Failed to get accessories');
  },

  async getAccessoryById(id: number): Promise<Accessory> {
    const response = await apiClient.get<Accessory>(`/accessories/${id}`);
    if (response.data) return response.data;
    throw new Error(response.error || 'Failed to get accessory');
  },

  async createAccessory(data: Partial<Accessory>): Promise<Accessory> {
    const response = await apiClient.post<Accessory>('/accessories', data);
    if (response.data) return response.data;
    throw new Error(response.error || 'Failed to create accessory');
  },

  async updateAccessory(id: number, data: Partial<Accessory>): Promise<Accessory> {
    const response = await apiClient.put<Accessory>(`/accessories/${id}`, data);
    if (response.data) return response.data;
    throw new Error(response.error || 'Failed to update accessory');
  },

  async deleteAccessory(id: number): Promise<{ deleted?: boolean }> {
    const response = await apiClient.delete<{ deleted?: boolean }>(`/accessories/${id}`);
    if (response.error) throw new Error(response.error);
    return response.data || {};
  },

  async restoreDefaultAccessories(): Promise<{ created: number; totalDefaults: number }> {
    const response = await apiClient.post<{ created: number; totalDefaults: number }>('/accessories/restore-defaults', {});
    if (response.data) return response.data;
    throw new Error(response.error || 'Failed to restore default accessories');
  }
};
