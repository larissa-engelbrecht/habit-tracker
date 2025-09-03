// Base Habit interface - matches Django model
export interface Habit {
  id: number;
  name: string;
  goal_description?: string;
  category: 'Health' | 'Work' | 'Personal' | 'Other';
  periodicity: 'daily' | 'weekly' | 'monthly';
  frequency: number;
  specific_days: string[];
  preferred_time?: string;
  icon: string;
  creation_date: string;
  duration_weeks: number;
  is_template: boolean;
  is_active: boolean;
  started_date?: string;
  paused_date?: string;
}

// Progress tracking for habits
export interface Progress {
  completed: number;
  total: number;
}

// Habit with progress info (for Dashboard)
export interface HabitWithProgress extends Habit {
  progress?: Progress;
  completed_today: boolean;
}

// Completed habit info for dashboard
export interface CompletedHabit {
  id: string;
  name: string;
  category: string;
  icon: string;
  completedDate: string;
}

// Dashboard data structure
export interface DashboardData {
  habits: HabitWithProgress[];
  completedHabits: CompletedHabit[];
}

// Form data for creating/updating habits
export interface HabitFormData {
  name: string;
  goal_description?: string;
  category: 'Health' | 'Work' | 'Personal' | 'Other';
  periodicity: 'daily' | 'weekly' | 'monthly';
  frequency: number;
  specific_days: string[];
  preferred_time?: string;
  icon: string;
  duration_weeks?: number;
}

// Template habit (for welcome screen)
export interface TemplateHabit {
  id: number;
  name: string;
  goal_description?: string;
  category: string;
  periodicity: string;
  frequency: number;
  specific_days: string[];
  preferred_time?: string;
  icon: string;
}

// User habits status
export interface UserHabitsStatus {
  has_habits: boolean;
  habit_count: number;
}

// API Error response
export interface ApiError {
  detail?: string;
  error?: string;
}

// Request types
export interface CompleteHabitRequest {
  notes?: string;
}

// Form validation errors
export interface FormErrors {
  name?: string;
  category?: string;
  periodicity?: string;
  icon?: string;
  [key: string]: string | undefined;
}