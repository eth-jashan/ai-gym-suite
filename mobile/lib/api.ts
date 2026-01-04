import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

// API Configuration - Update this with your backend URL
// For ngrok: replace with your ngrok URL (e.g., 'https://abc123.ngrok-free.app/api/v1')
const NGROK_URL = 'https://8ce4eb31c270.ngrok-free.app/api/v1'; // Set your ngrok URL here when testing

const API_URL = NGROK_URL || (__DEV__
  ? 'http://localhost:3001/api/v1'  // Development
  : 'https://api.yourdomain.com/api/v1');  // Production

class ApiClient {
  private client: AxiosInstance;
  private authToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
    });

    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        if (this.authToken) {
          config.headers.Authorization = `Bearer ${this.authToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        // Log full error details for debugging
        console.error('=== API Error ===');
        console.error('URL:', error.config?.url);
        console.error('Method:', error.config?.method?.toUpperCase());
        console.error('Status:', error.response?.status);
        console.error('Status Text:', error.response?.statusText);
        console.error('Response Data:', JSON.stringify(error.response?.data, null, 2));
        console.error('Request Headers:', JSON.stringify(error.config?.headers, null, 2));
        if (error.config?.data) {
          console.error('Request Body:', error.config.data);
        }
        console.error('=================');

        const message = this.getErrorMessage(error);
        return Promise.reject(new Error(message));
      }
    );
  }

  setAuthToken(token: string) {
    this.authToken = token;
  }

  clearAuthToken() {
    this.authToken = null;
  }

  private getErrorMessage(error: AxiosError): string {
    if (error.response) {
      const data = error.response.data as { message?: string; error?: string };
      return data.message || data.error || 'An error occurred';
    }
    if (error.request) {
      return 'Network error. Please check your connection.';
    }
    return error.message || 'An unexpected error occurred';
  }

  async get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
    const response = await this.client.get<T>(url, { params });
    return response.data;
  }

  async post<T>(url: string, data: Record<string, unknown>): Promise<T> {
    const response = await this.client.post<T>(url, data);
    return response.data;
  }

  async put<T>(url: string, data: Record<string, unknown>): Promise<T> {
    const response = await this.client.put<T>(url, data);
    return response.data;
  }

  async delete<T>(url: string): Promise<T> {
    const response = await this.client.delete<T>(url);
    return response.data;
  }
}

export const api = new ApiClient();
