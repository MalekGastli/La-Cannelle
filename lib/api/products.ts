import { apiClient } from '../api';

export interface Product {
  id: number;
  name: string;
  description: string;
  category: string;
  customCategory?: string | null;
  price: number;
  cost: number;
  available: boolean;
  minOrderQuantity?: number;
  ingredients: string[];
  ingredientsDe?: string[] | null;
  allergens: string[];
  allergensDe?: string[] | null;
  image?: string;
  popularity: number;
  menus?: number[];
  menuProducts?: Array<{ menuId: number; productId: number }>;
  translations?: Partial<Record<'EN' | 'FR' | 'TR', { name?: string; description?: string }>> | null;
}

export type BulkAction =
  | { action: 'setAvailable'; value: boolean }
  | { action: 'adjustPrice'; value: { mode: 'percent' | 'amount'; amount: number } }
  | { action: 'setCategory'; value: string }
  | { action: 'addToMenu' | 'removeFromMenu'; value: number };

export const productsApi = {
  async getProducts(filters?: {
    category?: string;
    available?: boolean;
    search?: string;
    menuId?: number;
  }): Promise<Product[]> {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.available !== undefined) params.append('available', String(filters.available));
    if (filters?.search) params.append('search', filters.search);
    if (filters?.menuId) params.append('menuId', String(filters.menuId));

    const query = params.toString();
    const endpoint = query ? `/products?${query}` : '/products';

    const response = await apiClient.get<Product[]>(endpoint);
    if (response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to get products');
  },

  async getProductById(id: number): Promise<Product> {
    const response = await apiClient.get<Product>(`/products/${id}`);
    if (response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to get product');
  },

  async createProduct(data: Partial<Product>): Promise<Product> {
    const response = await apiClient.post<Product>('/products', data);
    if (response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to create product');
  },

  async updateProduct(id: number, data: Partial<Product>): Promise<Product> {
    const response = await apiClient.put<Product>(`/products/${id}`, data);
    if (response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to update product');
  },

  async deleteProduct(id: number): Promise<{ deleted?: boolean; archived?: boolean }> {
    const response = await apiClient.delete<{ deleted?: boolean; archived?: boolean }>(`/products/${id}`);
    if (response.error) {
      throw new Error(response.error);
    }
    return response.data || {};
  },

  async bulkUpdate(ids: number[], change: BulkAction): Promise<void> {
    const response = await apiClient.patch('/products/bulk', { ids, ...change });
    if (response.error) throw new Error(response.error);
  },

  async bulkDelete(ids: number[]): Promise<{ deleted: number; archived: number }> {
    const response = await apiClient.delete<{ deleted: number; archived: number }>('/products', { ids });
    if (response.data) return response.data;
    throw new Error(response.error || 'Failed to delete products');
  },

  async duplicateProduct(id: number): Promise<Product> {
    const response = await apiClient.post<Product>(`/products/${id}/duplicate`, {});
    if (response.data) return response.data;
    throw new Error(response.error || 'Failed to duplicate product');
  },
};
