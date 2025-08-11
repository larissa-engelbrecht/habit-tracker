import { useEffect, useState } from 'react';
import axios from 'axios';
import MaterialIcon from '../components/MaterialIcon';
import type { Habit } from '../components/Types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const PRELOADED_HABITS_URL = API_BASE_URL + import.meta.env.VITE_API_PRELOADED_HABITS_URL;

export default function Welcome() {

 const [habits, setHabits] = useState<Habit[]>([]);

  useEffect(() => {
    axios.get<Habit[]>(PRELOADED_HABITS_URL)
      .then(response => setHabits(response.data))
      .catch(error => console.error('Error fetching habits:', error));
  }, []);


  return (
    <div className="px-6 py-6 flex flex-col items-center w-full">
    <div className="text-center max-w-md w-full mb-10">
        <h2 className="text-3xl font-bold text-black mb-3">
          What Habits Would You Like to Track?
        </h2>
        <p className="text-gray-600 text-base">
          Choose from our recommended habits or create your own.
        </p>
      </div>

      <div className="w-full max-w-md flex flex-col space-y-4">
        {habits.map((habit) => (
          <div
            key={habit.id}
            className="bg-black/90 text-white rounded-2xl shadow-md px-6 py-5 flex items-center justify-between"
          >
            <span className="text-lg font-medium">{habit.name}</span>
            <MaterialIcon iconName={habit.icon} fontSize="medium" />
          </div>
        ))}

        <div className="bg-black/90 text-white rounded-2xl shadow-md px-6 py-5 flex items-center justify-between">
            <span className="text-lg font-medium">Custom Habit</span>
            <MaterialIcon iconName="AutoFixHigh" fontSize="medium" />
          </div>
      </div>

      <button className="mt-12 w-full max-w-md bg-black text-white py-4 rounded-full text-lg font-semibold hover:bg-gray-800 transition-all duration-200">
        Start Tracking →
      </button> 
         
    </div>
  );
}
