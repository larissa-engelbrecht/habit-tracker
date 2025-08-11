export interface Habit {
  id: number;
  name: string;
  icon: string;       // e.g. "WbSunny", "FitnessCenter"
  category: string;
  goal_description?: string;
}