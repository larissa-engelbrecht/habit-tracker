import { useEffect, useState } from 'react';
import habitService from '../services/habitService';

export function useHasActiveHabits() {
  const [hasActive, setHasActive] = useState<boolean | null>(null); // null = loading

  useEffect(() => {
    const fetchActiveHabits = async () => {
      try {
        const habits = await habitService.getActiveHabits(); // your API
        setHasActive(habits);
      } catch (err) {
        console.error('Failed to fetch habits', err);
        setHasActive(false); // fallback
      }
    };

    fetchActiveHabits();
  }, []);

  return hasActive;
}
