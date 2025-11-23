// API service for connecting frontend to backend

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

class ApiService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
          ...this.getAuthHeaders(),
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || 'Request failed' };
      }

      return { data };
    } catch (error: any) {
      return { error: error.message || 'Network error' };
    }
  }

  // Authentication
  async register(email: string, password: string, name?: string) {
    return this.request<{ user: any; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
  }

  async login(email: string, password: string) {
    const response = await this.request<{ user: any; token: string }>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }
    );

    if (response.data?.token) {
      localStorage.setItem('auth_token', response.data.token);
      localStorage.setItem('user_id', String(response.data.user.id));
    }

    return response;
  }

  logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_id');
  }

  getUserId(): string | null {
    return localStorage.getItem('user_id') || 'anon';
  }

  // Transactions
  async addTransaction(
    date: string,
    amount: number,
    category: string,
    type: 'expense' | 'revenue',
    description?: string,
    merchant?: string
  ) {
    const userId = this.getUserId();
    return this.request('/transactions', {
      method: 'POST',
      body: JSON.stringify({
        date,
        amount: type === 'expense' ? -Math.abs(amount) : Math.abs(amount),
        category,
        description,
        merchant,
        userId,
      }),
    });
  }

  async uploadCSV(file: File) {
    const userId = this.getUserId();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/upload_csv`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        return { error: data.error || 'Upload failed' };
      }
      return { data };
    } catch (error: any) {
      return { error: error.message || 'Upload failed' };
    }
  }

  async uploadExcel(file: File) {
    const userId = this.getUserId();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/upload_excel`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        return { error: data.error || 'Upload failed' };
      }
      return { data };
    } catch (error: any) {
      return { error: error.message || 'Upload failed' };
    }
  }

  async getTransactions(userId?: string) {
    const uid = userId || this.getUserId();
    return this.request<any[]>(`/transactions?userId=${uid}`);
  }

  async getCategories(userId?: string) {
    const uid = userId || this.getUserId();
    return this.request<any[]>(`/categories?userId=${uid}`);
  }

  // Forecast
  async getForecast(userId?: string, days = 14) {
    const uid = userId || this.getUserId();
    return this.request<{ dates: string[]; balances: number[] }>(
      `/forecast?userId=${uid}&days=${days}`
    );
  }

  // Actions
  async getActions(forecast: any, categories: any[]) {
    return this.request<{ actions: any[] }>('/actions', {
      method: 'POST',
      body: JSON.stringify({ forecast, categories }),
    });
  }

  // Simulation
  async simulate(action: any, userId?: string) {
    const uid = userId || this.getUserId();
    return this.request('/simulate', {
      method: 'POST',
      body: JSON.stringify({ userId: uid, action }),
    });
  }

  // Anomalies
  async getAnomalies(userId?: string) {
    const uid = userId || this.getUserId();
    return this.request<{ anomalies: any[] }>(`/anomalies?userId=${uid}`);
  }

  // Apply all actions
  async applyActions(actions: any[], userId?: string) {
    const uid = userId || this.getUserId();
    // This will simulate applying all actions and update transactions
    // For now, we'll just simulate each one
    const results = [];
    for (const action of actions) {
      const result = await this.simulate(action, uid);
      if (result.data) {
        results.push(result.data);
      }
    }
    return { data: results };
  }
}

export const api = new ApiService();

