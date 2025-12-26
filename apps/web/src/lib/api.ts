const API_BASE = '/api/v1';

interface ApiError {
  error: string;
  code?: string;
  details?: unknown;
}

class ApiClient {
  private accessToken: string | null = null;

  setToken(token: string | null) {
    this.accessToken = token;
    if (token) {
      localStorage.setItem('accessToken', token);
    } else {
      localStorage.removeItem('accessToken');
    }
  }

  getToken(): string | null {
    if (this.accessToken) return this.accessToken;
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('accessToken');
    }
    return this.accessToken;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      const error = data as ApiError;
      throw new Error(error.error || 'An error occurred');
    }

    return data as T;
  }

  // Auth
  async register(email: string, password: string) {
    return this.request<{
      user: { id: string; email: string; onboardingCompleted: boolean };
      tokens: { accessToken: string; refreshToken: string };
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async login(email: string, password: string) {
    return this.request<{
      user: { id: string; email: string; onboardingCompleted: boolean };
      tokens: { accessToken: string; refreshToken: string };
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async getMe() {
    return this.request<{
      id: string;
      email: string;
      onboardingCompleted: boolean;
      onboardingStep: number;
      profile: any;
      preferences: any;
    }>('/auth/me');
  }

  // Onboarding
  async getOnboardingStatus() {
    return this.request<{
      currentStep: number;
      totalPhases: number;
      completed: boolean;
      phases: any[];
    }>('/onboarding/status');
  }

  async getOnboardingQuestions() {
    return this.request<{
      totalPhases: number;
      phases: any[];
    }>('/onboarding/questions');
  }

  async submitOnboardingResponses(responses: Record<string, unknown>) {
    return this.request<{ success: boolean; currentStep: number }>(
      '/onboarding/responses',
      {
        method: 'POST',
        body: JSON.stringify({ responses }),
      }
    );
  }

  async completeOnboarding() {
    return this.request<{ success: boolean; message: string }>(
      '/onboarding/complete',
      { method: 'POST' }
    );
  }

  async skipOnboarding() {
    return this.request<{ message: string }>('/onboarding/skip', {
      method: 'POST',
    });
  }

  // Workouts
  async getTodaysWorkout() {
    return this.request<{
      workout: any;
      motivation: string;
    }>('/workouts/today');
  }

  async generateWorkout() {
    return this.request<any>('/workouts/generate', { method: 'POST' });
  }

  async getWorkouts(limit = 10, offset = 0) {
    return this.request<{
      workouts: any[];
      pagination: { total: number; limit: number; offset: number };
    }>(`/workouts?limit=${limit}&offset=${offset}`);
  }

  async getWorkout(id: string) {
    return this.request<any>(`/workouts/${id}`);
  }

  async startWorkout(id: string) {
    return this.request<any>(`/workouts/${id}/start`, { method: 'POST' });
  }

  async completeWorkout(id: string, notes?: string) {
    return this.request<{ workout: any; analysis: any }>(
      `/workouts/${id}/complete`,
      {
        method: 'POST',
        body: JSON.stringify({ notes }),
      }
    );
  }

  async logSet(
    workoutId: string,
    exerciseId: string,
    data: {
      setNumber: number;
      repsCompleted: number;
      weightUsed?: number;
      rpe?: number;
    }
  ) {
    return this.request<any>(
      `/workouts/${workoutId}/exercises/${exerciseId}/log`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  async swapExercise(workoutId: string, exerciseId: string) {
    return this.request<any>(
      `/workouts/${workoutId}/exercises/${exerciseId}/swap`,
      { method: 'POST' }
    );
  }

  // Exercises
  async getExercises(params?: {
    category?: string;
    muscle?: string;
    search?: string;
    limit?: number;
  }) {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.muscle) query.set('muscle', params.muscle);
    if (params?.search) query.set('search', params.search);
    if (params?.limit) query.set('limit', String(params.limit));
    return this.request<{ exercises: any[]; pagination: any }>(
      `/exercises?${query}`
    );
  }

  async getExercise(id: string) {
    return this.request<any>(`/exercises/${id}`);
  }

  async getExerciseCoaching(id: string) {
    return this.request<{ tips: string }>(`/exercises/${id}/coaching`);
  }

  // Progress
  async getDashboard() {
    return this.request<{
      profile: any;
      stats: {
        totalWorkouts: number;
        thisWeekWorkouts: number;
        currentStreak: number;
        weeklyVolume: number;
        weeklyTime: number;
        achievementsUnlocked: number;
      };
      latestMeasurement: any;
    }>('/progress/dashboard');
  }

  async getWeeklySummary() {
    return this.request<{ summary: string }>('/progress/weekly-summary');
  }

  async getStreaks() {
    return this.request<{
      currentStreak: number;
      longestStreak: number;
      thisWeek: { workoutDays: number[]; totalWorkouts: number };
    }>('/progress/streaks');
  }

  async logBodyMeasurement(data: {
    weightKg?: number;
    bodyFatPercent?: number;
  }) {
    return this.request<any>('/progress/body', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const api = new ApiClient();
