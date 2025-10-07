import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MaterialIcon from '../components/MaterialIcon';
import HabitFormModal from '../components/HabitForm';
import UniversalModal from '../components/UniversalModal';
import { ArrowLeft } from 'lucide-react';
import { useModal } from '../hooks/useUniversalModal';
import type { Habit, HabitWithProgress } from '../components/Types';
import habitService from '../services/habitService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const PRELOADED_HABITS_URL = API_BASE_URL + import.meta.env.VITE_API_PRELOADED_HABITS_URL;

export default function Welcome() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [selectedHabits, setSelectedHabits] = useState<number[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [hasActiveHabits, setHasActiveHabits] = useState(false);
  const navigate = useNavigate();

  const { modalState, showSuccess, showError, closeModal } = useModal();

  useEffect(() => {
    checkActiveHabitsAndLoadTemplates();
  }, []);

  const checkActiveHabitsAndLoadTemplates = async () => {
    try {
      //setLoading(true);
      
      // Check if user has any active habits
      const hasActive = await habitService.getActiveHabits();
      setHasActiveHabits(hasActive);
      
      // Load available templates (backend now filters out started ones)
      const habitsData = await habitService.getPreloadedHabits();
      console.log('Loaded habits:', habitsData);
      setHabits(habitsData);
    } catch (error) {
      console.error('Error loading data:', error);
      showError(
        'Loading Failed',
        'Failed to load habit templates. Please try again.'
      );
    } finally {
      //setLoading(false);
    }
  };

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

    showSuccess(
        'Habit Created',
        `"${newHabit.name}" has been created successfully!`
      );
      
      // Navigate to dashboard after a brief delay
      setTimeout(() => navigate('/dashboard'), 1500);
  };

 const handleStartTracking = async () => {
    if (selectedHabits.length === 0) {
      showError(
        'No Habits Selected',
        'Please select at least one habit to track!'
      );
      return;
    }

    setIsActivating(true);

    try {
      const activationPromises = selectedHabits.map(habitId => 
        habitService.startHabitFromTemplate(habitId)
      );

      const activatedHabits = await Promise.all(activationPromises);
      console.log('Successfully activated habits:', activatedHabits);

      showSuccess(
        'Habits Activated',
        `Successfully activated ${activatedHabits.length} habit${activatedHabits.length > 1 ? 's' : ''}!`
      );

      // Navigate to dashboard after a brief delay
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (error) {
      console.error('Error activating habits:', error);
      showError(
        'Activation Failed',
        'Failed to activate some habits. Please try again.'
      );
      setIsActivating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 px-6 py-6">
      <div className="max-w-4xl mx-auto">
        {/* Back button for returning users */}
        {hasActiveHabits && (
          <button
            onClick={() => navigate('/dashboard')}
            className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Dashboard
          </button>
        )}

        {/* Dynamic header based on whether user has habits */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-black mb-3">
            {hasActiveHabits 
              ? "Add New Habits" 
              : "What Habits Would You Like to Track?"
            }
          </h2>
          <p className="text-gray-600 text-base">
            {hasActiveHabits 
              ? "Choose from our curated templates or create your own custom habit."
              : "Choose from our recommended habits or create your own."
            }
          </p>
        </div>

        {/* No templates available message */}
        {habits.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">
              {hasActiveHabits 
                ? "You've started all available templates! Create a custom habit instead."
                : "No habit templates available at the moment."
              }
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 bg-sky-600 text-white rounded-full font-medium hover:bg-sky-500 transition-colors"
            >
              Create Custom Habit
            </button>
          </div>
        )}

        {/* Habit templates grid */}
        {habits.length > 0 && (
          <div className="w-full max-w-2xl mx-auto flex flex-col space-y-4">
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
              className="bg-sky-600 text-white rounded-2xl shadow-md px-6 py-5 flex items-center justify-between cursor-pointer hover:bg-sky-500 transition-all"
            >
              <span className="text-lg font-medium">Create Custom Habit</span>
              <MaterialIcon iconName="AutoFixHigh" fontSize="medium" />
            </div>
          </div>
        )}

        {/* Show Start Tracking button only when habits are selected */}
        {selectedHabits.length > 0 && (
          <div className="w-full max-w-2xl mx-auto mt-8">
            <button 
              onClick={handleStartTracking}
              disabled={isActivating}
              className="w-full bg-black text-white py-4 rounded-full text-lg font-semibold hover:bg-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isActivating 
                ? 'Activating Habits...' 
                : `Start Tracking ${selectedHabits.length} Habit${selectedHabits.length > 1 ? 's' : ''} →`
              }
            </button>
          </div>
        )}

        {/* Modal */}
        <HabitFormModal 
          isOpen={isModalOpen} 
          setIsOpen={setIsModalOpen} 
          onHabitCreated={handleHabitCreated}
        />

        {/* Universal Modal */}
        <UniversalModal 
          isOpen={modalState.isOpen}
          type={modalState.type}
          title={modalState.title}
          message={modalState.message}
          onConfirm={modalState.onConfirm}
          onCancel={modalState.onCancel}
          onClose={closeModal}
          confirmText={modalState.confirmText}
          cancelText={modalState.cancelText}
          showCancel={modalState.showCancel}
          autoClose={modalState.autoClose}
          autoCloseDelay={modalState.autoCloseDelay}
        />
      </div>
    </div>
  );
}