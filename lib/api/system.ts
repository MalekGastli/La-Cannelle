import { apiClient } from '../api';

export interface SystemStatus {
  id: number;
  orderingPaused: boolean;
  pauseReason?: string;
  pauseUntil?: string;
  capacityLimit: number;
  currentReservations: number;
  dailyLimit: number;
  perHourLimit: number;
  weekendMultiplier: number;
  enableAutoPause: boolean;
}

export interface ClosedDate {
  id: number;
  date: string;
  reason: string;
  recurring: boolean;
  createdAt: string;
}

export const systemApi = {
  async getSystemStatus(): Promise<SystemStatus> {
    const response = await apiClient.get<SystemStatus>('/system/status');
    if (response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to get system status');
  },

  async updateSystemStatus(data: Partial<SystemStatus>): Promise<SystemStatus> {
    const response = await apiClient.put<SystemStatus>('/system/status', data);
    if (response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to update system status');
  },

  async getClosedDates(): Promise<ClosedDate[]> {
    const response = await apiClient.get<ClosedDate[]>('/system/closed-dates');
    if (response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to get closed dates');
  },

  async createClosedDate(data: { date: string; reason: string; recurring: boolean }): Promise<ClosedDate> {
    const response = await apiClient.post<ClosedDate>('/system/closed-dates', data);
    if (response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to create closed date');
  },

  async deleteClosedDate(id: number): Promise<void> {
    const response = await apiClient.delete(`/system/closed-dates/${id}`);
    if (response.error) {
      throw new Error(response.error);
    }
  },
};
