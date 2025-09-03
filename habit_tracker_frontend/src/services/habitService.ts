// Import all types from the centralized Types file
import type { 
  Habit, 
  HabitWithProgress, 
  //Progress, 
  //CompletedHabit, 
  DashboardData, 
  HabitFormData, 
  UserHabitsStatus, 
  ApiError, 
  CompleteHabitRequest 
} from '../components/Types';


// Environment variables
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
  async createHabit(habitData: HabitFormData): Promise<HabitWithProgress> {
    return this.makeRequest<HabitWithProgress>(`${API_BASE_URL}/`, {
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
    return this.makeRequest<Habit[]>(`${PRELOADED_HABITS_URL}`);
  }

  // Check user's habit status - determines which screen to show
  async getUserHabitsStatus(): Promise<UserHabitsStatus> {
    return this.makeRequest<UserHabitsStatus>(`${API_BASE_URL}/status/`);
  }

  // Start tracking a habit from a template
  async startHabitFromTemplate(templateId: number): Promise<HabitWithProgress> {
    return this.makeRequest<HabitWithProgress>(`${API_BASE_URL}/templates/${templateId}/start/`, {
      method: 'POST',
    });
  }

  // Get a single habit
  async getHabit(id: number): Promise<HabitWithProgress> {
    return this.makeRequest<HabitWithProgress>(`${API_BASE_URL}/${id}/`);
  }

  // Update a habit
  async updateHabit(id: number, habitData: Partial<HabitFormData>): Promise<HabitWithProgress> {
    return this.makeRequest<HabitWithProgress>(`${API_BASE_URL}/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(habitData),
    });
  }

  // Delete a habit
  async deleteHabit(id: number): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}/`, {
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
  async pauseHabit(habitId: number): Promise<HabitWithProgress> {
    return this.makeRequest<HabitWithProgress>(`${API_BASE_URL}/${habitId}/pause/`, {
      method: 'POST',
    });
  }

  // Resume a paused habit
  async resumeHabit(habitId: number): Promise<HabitWithProgress> {
    return this.makeRequest<HabitWithProgress>(`${API_BASE_URL}/${habitId}/resume/`, {
      method: 'POST',
    });
  }

  // Get dashboard data (habits + completions)
  async getDashboardData(): Promise<DashboardData> {
    return this.makeRequest<DashboardData>(`${API_BASE_URL}/dashboard/`);
  }

  // Complete a habit for today
  async completeHabit(habitId: number, notes: string = ''): Promise<HabitWithProgress> {
    return this.makeRequest<HabitWithProgress>(`${API_BASE_URL}/${habitId}/complete/`, {
      method: 'POST',
      body: JSON.stringify({ notes } as CompleteHabitRequest),
    });
  }

  // Remove completion for today
  async uncompleteHabit(habitId: number): Promise<HabitWithProgress> {
    return this.makeRequest<HabitWithProgress>(`${API_BASE_URL}/${habitId}/uncomplete/`, {
      method: 'DELETE',
    });
  }
}

// Create and export a singleton instance
const habitService = new HabitService();
export default habitService;