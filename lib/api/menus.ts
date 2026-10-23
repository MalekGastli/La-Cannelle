import { apiClient } from '../api';
import type { Service } from './services';

export interface Menu {
  popularity: any;
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  price?: number;
  image?: string;
  minPeople?: number | null;
  steps?: Array<{
    label: string;
    included: number;
  }>;
  menuProducts?: Array<{
    id: number;
    menuId: number;
    productId: number;
    product: any;
  }>;
  menuServices?: Array<{
    id: number;
    menuId: number;
    serviceId: number;
    service: Service;
  }>;
  products?: number[];
  serviceIds?: number[];
}

export const menusApi = {
  async getMenus(filters?: {
    isActive?: boolean;
    search?: string;
    serviceId?: number;
    includeImages?: boolean;
  }): Promise<Menu[]> {
    const params = new URLSearchParams();
    if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));
    if (filters?.search) params.append('search', filters.search);
    if (filters?.serviceId !== undefined) params.append('serviceId', String(filters.serviceId));
    if (filters?.includeImages !== undefined) params.append('includeImages', String(filters.includeImages));

    const query = params.toString();
    const endpoint = query ? `/menus?${query}` : '/menus';

    const response = await apiClient.get<Menu[]>(endpoint);
    if (response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to get menus');
  },

  async getMenuById(id: number): Promise<Menu> {
    const response = await apiClient.get<Menu>(`/menus/${id}`);
    if (response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to get menu');
  },

  async createMenu(data: Partial<Menu>): Promise<Menu> {
    const response = await apiClient.post<Menu>('/menus', data);
    if (response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to create menu');
  },

  async updateMenu(id: number, data: Partial<Menu>): Promise<Menu> {
    const response = await apiClient.put<Menu>(`/menus/${id}`, data);
    if (response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to update menu');
  },

  async deleteMenu(id: number): Promise<void> {
    const response = await apiClient.delete(`/menus/${id}`);
    if (response.error) {
      throw new Error(response.error);
    }
  },

  async restoreDefaultMenus(): Promise<{
    created: number;
    updated: number;
    totalDefaults: number;
    connectedServices: number;
    availableProducts: number;
  }> {
    const response = await apiClient.post<{
      created: number;
      updated: number;
      totalDefaults: number;
      connectedServices: number;
      availableProducts: number;
    }>(
      '/menus/restore-defaults',
      {}
    );
    if (response.data) return response.data;
    throw new Error(response.error || 'Failed to restore default menus');
  }
  ,

  async restoreLegacyMenusFromBackup(): Promise<{
    restoredMenus: number;
    restoredProducts: number;
    restoredServices: number;
    restoredAccessories: number;
  }> {
    const response = await apiClient.post<{
      restoredMenus: number;
      restoredProducts: number;
      restoredServices: number;
      restoredAccessories: number;
    }>('/menus/restore-legacy', {});
    if (response.data) return response.data;
    throw new Error(response.error || 'Failed to restore legacy menus from backup.sql');
  }
};
