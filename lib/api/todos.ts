import { apiClient } from '../api';

export interface Todo {
  id: number;
  text: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export const todosApi = {
  async getTodos(filters?: { completed?: boolean }): Promise<Todo[]> {
    const params = new URLSearchParams();
    if (filters?.completed !== undefined) params.append('completed', String(filters.completed));
    const query = params.toString();
    const endpoint = query ? `/todos?${query}` : '/todos';
    const response = await apiClient.get<Todo[]>(endpoint);
    if (response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to get todos');
  },

  async createTodo(data: { text: string }): Promise<Todo> {
    const response = await apiClient.post<Todo>('/todos', data);
    if (response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to create todo');
  },

  async updateTodo(id: number, data: Partial<{ text: string; completed: boolean }>): Promise<Todo> {
    const response = await apiClient.put<Todo>(`/todos/${id}`, data);
    if (response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to update todo');
  },

  async deleteTodo(id: number): Promise<{ deleted?: boolean }> {
    const response = await apiClient.delete<{ deleted?: boolean }>(`/todos/${id}`);
    if (response.error) {
      throw new Error(response.error);
    }
    return response.data || {};
  }
};

