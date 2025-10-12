// Import all types from the centralized Types file
import type { 
  Habit, 
  HabitWithProgress, 
  //Progress, 
  //CompletedHabit, 
  DashboardData, 
  HabitFormData, 
  ApiError, 
  StatsData, 
  StatsRequestParams, 
  CompleteHabitRequest 
} from '../components/Types';

// API Configuration
import { API_CONFIG, buildUrl } from '../config/api';

// Environment variables
const API_BASE_URL: string = API_CONFIG.BASE_URL;
const PRELOADED_HABITS_URL: string = buildUrl('PRELOADED_HABITS');
const CREATE_HABIT_URL: string = buildUrl('CREATE_HABIT');
const DASHBOARD_URL: string = buildUrl('DASHBOARD');
const STATS_URL: string = buildUrl('STATS');
const HAS_ACTIVE_HABITS_URL: string = buildUrl('ACTIVE_HABITS');

class HabitService {
  private async handleResponse<T>(response: Response): Promise<T> {
    const data = await response.json();
    
    if (!response.ok) {
      const error: ApiError = data;
      throw new Error(error.detail || error.error || `HTTP ${response.status}: Request failed`);
    }
    
    return data as T;
  }

  private async makeRequest<T>(
    url: string, 
    options: RequestInit = {}
  ): Promise<T> {
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });
      
      return this.handleResponse<T>(response);
    } catch (error) {
      console.error(`Error making request to ${url}:`, error);
      throw error;
    }
  }

  // Create a new habit
  async createHabit(habitData: HabitFormData): Promise<HabitWithProgress> {
    return this.makeRequest<HabitWithProgress>(`${CREATE_HABIT_URL}` , {
      method: 'POST',
      body: JSON.stringify(habitData),
    });
  }

  // Get all active user habits (not templates)
  async getHabits(): Promise<HabitWithProgress[]> {
    return this.makeRequest<HabitWithProgress[]>(`${API_BASE_URL}/`);
  }

  // Get template/suggested habits for welcome screen
  async getPreloadedHabits(): Promise<Habit[]> {
    const url = `${PRELOADED_HABITS_URL}`;
    console.log('Making request to:', url); // Add this debug line
    return this.makeRequest<Habit[]>(url);
  }

  // Start tracking a habit from a template
  async startHabitFromTemplate(templateId: number): Promise<HabitWithProgress> {
    return this.makeRequest<HabitWithProgress>(`${API_BASE_URL}/api/habits/templates/${templateId}/start/`, {
      method: 'POST',
    });
  }

  async getActiveHabits(): Promise<boolean> {
    const response = await this.makeRequest<{ has_active_habits: boolean }>(`${HAS_ACTIVE_HABITS_URL}`);
    return response.has_active_habits;
  }

  // Get a single habit
  async getHabit(id: number): Promise<HabitWithProgress> {
    return this.makeRequest<HabitWithProgress>(`${API_BASE_URL}/${id}/`);
  }

  // Update a habit
  async updateHabit(id: number, habitData: Partial<HabitFormData>): Promise<HabitWithProgress> {
    return this.makeRequest<HabitWithProgress>(`${API_BASE_URL}/api/habits/${id}/update/`, {
      method: 'PUT',
      body: JSON.stringify(habitData),
    });
  }

  // Delete a habit
  async deleteHabit(id: number): Promise<{ message: string }> {
    return this.makeRequest<{ message: string }>(`${API_BASE_URL}/api/habits/${id}/delete/`, {
      method: 'DELETE',
    });
  }

  // Get dashboard data (habits + completions)
  async getDashboardData(): Promise<DashboardData> {
    return this.makeRequest<DashboardData>(`${DASHBOARD_URL}`);
  }

  // Complete a habit for today
  async completeHabit(habitId: number, notes: string = ''): Promise<HabitWithProgress> {
    return this.makeRequest<HabitWithProgress>(`${API_BASE_URL}/api/habits/${habitId}/complete/`, {
      method: 'POST',
      body: JSON.stringify({ notes } as CompleteHabitRequest),
    });
  }

  // Remove completion for today
  async uncompleteHabit(habitId: number): Promise<HabitWithProgress> {
    return this.makeRequest<HabitWithProgress>(`${API_BASE_URL}/api/habits/${habitId}/uncomplete/`, {
      method: 'DELETE',
    });
  }

   // Get comprehensive statistics
  async getStatsData(params?: StatsRequestParams): Promise<StatsData> {
    let url = STATS_URL;
    
    if (params) {
      const searchParams = new URLSearchParams();
      if (params.dateRange) searchParams.append('dateRange', params.dateRange);
      if (params.habitIds) {
        params.habitIds.forEach(id => searchParams.append('habitIds', id.toString()));
      }
      
      if (searchParams.toString()) {
        url += `?${searchParams.toString()}`;
      }
    }
    
    return this.makeRequest<StatsData>(url);
  }
}

// Create and export a singleton instance
const habitService = new HabitService();
export default habitService;