import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import MaterialIcon from '../components/MaterialIcon';
import HabitFormModal from '../components/HabitForm';
import type { Habit, HabitWithProgress } from '../components/Types';
import habitService from '../services/habitService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const PRELOADED_HABITS_URL = API_BASE_URL + import.meta.env.VITE_API_PRELOADED_HABITS_URL;

export default function Welcome() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [selectedHabits, setSelectedHabits] = useState<number[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

useEffect(() => {
  console.log('PRELOADED_HABITS_URL:', PRELOADED_HABITS_URL); // Add this debug line
  
  const loadHabits = async () => {
    try {
      // setLoading(true); // Remove or implement setLoading if needed
      const habitsData = await habitService.getPreloadedHabits();
      console.log('Loaded habits:', habitsData);
      setHabits(habitsData);
    } catch (error) {
      console.error('Error fetching habits:', error);
    }
  };

  loadHabits();
}, []);

  const toggleHabitSelection = (habitId: number) => {
    setSelectedHabits(prev =>
      prev.includes(habitId)
        ? prev.filter(id => id !== habitId)
        : [...prev, habitId]
    );
  };

  const handleHabitCreated = (newHabit: HabitWithProgress) => {
    // Here you'll later call API to create the habit
    console.log("New habit created:", newHabit);
    setHabits(prev => [...prev, newHabit]);
    setSelectedHabits(prev => [...prev, newHabit.id]);
    setIsModalOpen(false);


    // Navigate to dashboard
  navigate('/dashboard');
  };

  const handleStartTracking = () => {
    if (selectedHabits.length === 0) {
      alert("Please select at least one habit to track!");
      return;
    }
    // Navigate to dashboard with selected habits
    navigate('/dashboard', { state: { selectedHabits } });
  };

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
        {/* Preloaded Habits */}
        {habits.map((habit) => (
          <div
            key={habit.id}
            onClick={() => toggleHabitSelection(habit.id)}
            className={`rounded-2xl shadow-md px-6 py-5 flex items-center justify-between cursor-pointer transition-all ${
              selectedHabits.includes(habit.id)
                ? 'bg-green-600 text-white'
                : 'bg-black/90 text-white hover:bg-black'
            }`}
          >
            <div>
              <span className="text-lg font-medium">{habit.name}</span>
              {habit.goal_description && (
                <p className="text-sm opacity-80">{habit.goal_description}</p>
              )}
            </div>
            <MaterialIcon iconName={habit.icon} fontSize="medium" />
          </div>
        ))}

        {/* Custom Habit Button */}
        <div
          onClick={() => setIsModalOpen(true)}
          className="bg-sky-600 text-white rounded-2xl shadow-md px-6 py-5 flex items-center justify-between cursor-pointer hover:bg-sky-400 transition-all"
        >
          <span className="text-lg font-medium">Create Custom Habit</span>
          <MaterialIcon iconName="AutoFixHigh" fontSize="medium" />
        </div>
      </div>

      {/* Show Start Tracking button only when habits are selected */}
      {selectedHabits.length > 0 && (
        <button 
          onClick={handleStartTracking}
          className="mt-8 w-full max-w-md bg-black text-white py-4 rounded-full text-lg font-semibold hover:bg-gray-800 transition-all duration-200"
        >
          Start Tracking {selectedHabits.length} Habit{selectedHabits.length > 1 ? 's' : ''} →
        </button>
      )}

      {/* Modal */}
      <HabitFormModal 
        isOpen={isModalOpen} 
        setIsOpen={setIsModalOpen} 
        onHabitCreated={handleHabitCreated}
      />
    </div>
  );
}