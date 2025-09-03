// Type definitions
export interface HabitData {
  name: string;
  description?: string;
  category: string;
  periodicity: 'daily' | 'weekly' | 'monthly';
  goal_description?: string;
  preferred_time?: string;
  icon?: string;
  is_active?: boolean;
}

export interface Progress {
  completed: number;
  total: number;
}

export interface Habit extends HabitData {
  id: number;
  completed_today: boolean;
  progress?: Progress;
  created_at: string;
  updated_at: string;
}

export interface CompletedHabit {
  id: string;
  name: string;
  category: string;
  icon: string;
  completedDate: string;
}

export interface DashboardData {
  habits: Habit[];
  completedHabits: CompletedHabit[];
}

export interface UserHabitsStatus {
  has_habits: boolean;
  habit_count: number;
}

export interface ApiError {
  detail?: string;
  error?: string;
}

export interface CompleteHabitRequest {
  notes?: string;
}

// Environment variables with proper typing
const API_BASE_URL: string = import.meta.env.REACT_APP_API_URL || '';
const PRELOADED_HABITS_URL: string = API_BASE_URL + (import.meta.env?.VITE_API_PRELOADED_HABITS_URL || '');

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
  async createHabit(habitData: HabitData): Promise<Habit> {
    return this.makeRequest<Habit>(`${API_BASE_URL}/habits/`, {
      method: 'POST',
      body: JSON.stringify(habitData),
    });
  }

  // Get all active user habits (not templates)
  async getHabits(): Promise<Habit[]> {
    return this.makeRequest<Habit[]>(`${API_BASE_URL}/habits/`);
  }

  // Get template/suggested habits for welcome screen
  async getPreloadedHabits(): Promise<Habit[]> {
    return this.makeRequest<Habit[]>(PRELOADED_HABITS_URL);
  }

  // Check user's habit status - determines which screen to show
  async getUserHabitsStatus(): Promise<UserHabitsStatus> {
    return this.makeRequest<UserHabitsStatus>(`${API_BASE_URL}/habits/status/`);
  }

  // Start tracking a habit from a template
  async startHabitFromTemplate(templateId: number): Promise<Habit> {
    return this.makeRequest<Habit>(`${API_BASE_URL}/habits/templates/${templateId}/start/`, {
      method: 'POST',
    });
  }

  // Get a single habit
  async getHabit(id: number): Promise<Habit> {
    return this.makeRequest<Habit>(`${API_BASE_URL}/habits/${id}/`);
  }

  // Update a habit
  async updateHabit(id: number, habitData: Partial<HabitData>): Promise<Habit> {
    return this.makeRequest<Habit>(`${API_BASE_URL}/habits/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(habitData),
    });
  }

  // Delete a habit
  async deleteHabit(id: number): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/habits/${id}/`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete habit');
      }

      return true;
    } catch (error) {
      console.error('Error deleting habit:', error);
      throw error;
    }
  }

  // Pause a habit (stop tracking without deleting)
  async pauseHabit(habitId: number): Promise<Habit> {
    return this.makeRequest<Habit>(`${API_BASE_URL}/habits/${habitId}/pause/`, {
      method: 'POST',
    });
  }

  // Resume a paused habit
  async resumeHabit(habitId: number): Promise<Habit> {
    return this.makeRequest<Habit>(`${API_BASE_URL}/habits/${habitId}/resume/`, {
      method: 'POST',
    });
  }

  // Get dashboard data (habits + completions)
  async getDashboardData(): Promise<DashboardData> {
    return this.makeRequest<DashboardData>(`${API_BASE_URL}/habits/dashboard/`);
  }

  // Complete a habit for today
  async completeHabit(habitId: number, notes: string = ''): Promise<Habit> {
    return this.makeRequest<Habit>(`${API_BASE_URL}/habits/${habitId}/complete/`, {
      method: 'POST',
      body: JSON.stringify({ notes } as CompleteHabitRequest),
    });
  }

  // Remove completion for today
  async uncompleteHabit(habitId: number): Promise<Habit> {
    return this.makeRequest<Habit>(`${API_BASE_URL}/habits/${habitId}/uncomplete/`, {
      method: 'DELETE',
    });
  }
}

// Create and export a singleton instance
const habitService = new HabitService();
export default habitService;