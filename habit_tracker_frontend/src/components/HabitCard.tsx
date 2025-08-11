import * as MuiIcons from '@mui/icons-material';
import type { Habit } from './Types';

interface HabitCardProps {
  habit: Habit;
}

export default function HabitCard({ habit }: HabitCardProps) {
  // Dynamically get the icon component from MUI Icons
  const IconComponent = (MuiIcons as any)[habit.icon] || MuiIcons.Star;

  return (
    <div className="habit-card bg-black/90 text-white rounded-2xl shadow-md px-6 py-5 flex items-center justify-between">
      <div>
        <h3 className="text-lg font-medium">{habit.name}</h3>
        {habit.goal_description && (
          <p className="text-sm text-gray-300">{habit.goal_description}</p>
        )}
      </div>
      <div className="text-2xl">
        <IconComponent />
      </div>
    </div>
  );
}
