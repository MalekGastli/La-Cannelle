import { apiClient } from '../api';
import type { Service } from './services';

export interface OrderItem {
  productId: number;
  quantity: number;
  price: number;
  name: string;
}

export interface CreateOrderData {
  clientName: string;
  contactEmail: string;
  phone: string;
  eventType: string;
  eventDate: string;
  eventTime: string;
  guests: number;
  location: string;
  specialRequests?: string;
  businessType?: string;
  serviceType?: string;
  serviceId?: number;
  postalCode?: string;
  street?: string;
  houseNumber?: string;
  city?: string;
  captchaToken?: string;
  items: OrderItem[];
  subtotal: number;
  serviceFee: number;
  total: number;
}

export interface Order {
  id: string;
  userId?: number;
  serviceId?: number | null;
  clientName: string;
  contactEmail: string;
  phone: string;
  eventType: string;
  eventDate: string;
  eventTime: string;
  guests: number;
  location: string;
  total: number;
  subtotal: number;
  serviceFee: number;
  status: string;
  paymentStatus: string;
  specialRequests?: string;
  businessType?: string;
  serviceType?: string;
  postalCode?: string;
  street?: string;
  houseNumber?: string;
  city?: string;
  service?: Service | null;
  items: Array<{
    id: number;
    productId: number;
    quantity: number;
    price: number;
    name: string;
    product?: any;
  }>;
  createdAt: string;
  updatedAt: string;
}

export const ordersApi = {
  async createOrder(data: CreateOrderData): Promise<Order> {
    const response = await apiClient.post<Order>('/orders', data);
    if (response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to create order');
  },

  async getOrders(filters?: {
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
  }): Promise<Order[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);
    if (filters?.search) params.append('search', filters.search);

    const query = params.toString();
    const endpoint = query ? `/orders?${query}` : '/orders';

    const response = await apiClient.get<Order[]>(endpoint);
    if (response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to get orders');
  },

  async getOrderById(id: string): Promise<Order> {
    const response = await apiClient.get<Order>(`/orders/${id}`);
    if (response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to get order');
  },

  async updateOrderStatus(id: string, status: string, cancellationReason?: string): Promise<Order> {
    const response = await apiClient.patch<Order>(`/orders/${id}/status`, {
      status,
      cancellationReason,
    });
    if (response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to update order status');
  },

  async deleteOrder(id: string): Promise<{ deletedOrderId: string }> {
    const response = await apiClient.delete<{ deletedOrderId: string }>(`/orders/${id}`);
    if (response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to delete order');
  },

  async deleteAllOrders(): Promise<{ deletedOrders: number; deletedOrderItems: number }> {
    const response = await apiClient.delete<{ deletedOrders: number; deletedOrderItems: number }>('/orders');
    if (response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to delete orders');
  },
};
