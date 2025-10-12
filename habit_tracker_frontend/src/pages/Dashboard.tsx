import { useState, useEffect } from 'react';
import { CheckCircle, Circle, TrendingUp, Target, Clock, Trash2, Loader, AlertCircle, Edit, Plus, BarChart3 } from 'lucide-react';
import type { HabitWithProgress } from '../components/Types';
import MaterialIcon from '../components/MaterialIcon';
import WeeklyCalendar from "../components/WeeklyCalendar"
import habitService from '../services/habitService';
import { useNavigate } from 'react-router-dom';
import HabitFormModal from '../components/HabitForm';
import UniversalModal from '../components/UniversalModal';
import { useModal } from '../hooks/useUniversalModal';

export default function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('daily');
  const [habits, setHabits] = useState<HabitWithProgress[]>([]);
  const [completingHabits, setCompletingHabits] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [habitsCompletedToday, setHabitsCompletedToday] = useState<Set<number>>(new Set());

  const { modalState, showSuccess, showError, showConfirm, closeModal } = useModal();

  const [deletingHabits, setDeletingHabits] = useState<Set<number>>(new Set());
  const [habitToEdit, setHabitToEdit] = useState<HabitWithProgress | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await habitService.getDashboardData();
      setHabits(data.habits || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError('Failed to load habits. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleHabitUpdated = (updatedHabit: HabitWithProgress) => {
    setHabits(prev => prev.map(h => 
      h.id === updatedHabit.id ? updatedHabit : h
    ));
    
    setIsModalOpen(false);
    setHabitToEdit(null);
    
    showSuccess('Habit Updated', `"${updatedHabit.name}" has been successfully updated!`);
  };

  const handleEditHabit = (habitId: number) => {
    const habit = habits.find(h => h.id === habitId);
    if (habit) {
      setHabitToEdit(habit);
      setIsModalOpen(true);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setHabitToEdit(null);
  };

  // FIXED: Immediate UI update with optimistic rendering and reload
  const toggleHabitCompletion = async (habitId: number): Promise<void> => {
    if (completingHabits.has(habitId)) return;
    
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;
    
    setCompletingHabits(prev => new Set(prev).add(habitId));
    
    try {
      // Make API call
      let updatedHabit: HabitWithProgress;
      
      if (habit.completed_today) {
        updatedHabit = await habitService.uncompleteHabit(habitId);
        // Remove from today's completed set
        setHabitsCompletedToday(prev => {
          const next = new Set(prev);
          next.delete(habitId);
          return next;
        });
      } else {
        updatedHabit = await habitService.completeHabit(habitId);
        // Add to today's completed set
        setHabitsCompletedToday(prev => new Set(prev).add(habitId));
      }
      
      // Reload dashboard to get fresh data
      await loadDashboardData();
      
    } catch (err) {
      console.error('Failed to toggle habit completion:', err);
      showError('Update Failed', 'Failed to update habit. Please try again.');
    } finally {
      setCompletingHabits(prev => {
        const next = new Set(prev);
        next.delete(habitId);
        return next;
      });
    }
  };

  const handleDeleteHabit = async (habitId: number): Promise<void> => {
    if (deletingHabits.has(habitId)) return;
    
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    showConfirm(
      'Delete Habit',
      `Are you sure you want to delete "${habit.name}"? This action cannot be undone and will remove all completion history.`,
      async () => {
        setDeletingHabits(prev => new Set(prev).add(habitId));
        
        try {
          await habitService.deleteHabit(habitId);
          setHabits(prev => prev.filter(h => h.id !== habitId));
          
          showSuccess(
            'Habit Deleted',
            `"${habit.name}" has been successfully deleted.`
          );
          
        } catch (err) {
          console.error('Failed to delete habit:', err);
          showError(
            'Delete Failed',
            `Failed to delete "${habit.name}". Please try again.`
          );
        } finally {
          setDeletingHabits(prev => {
            const next = new Set(prev);
            next.delete(habitId);
            return next;
          });
        }
      },
      () => {
        console.log('Delete cancelled');
      },
      'Yes',
      'No'
    );
  };

  const handleHabitCreated = (newHabit: HabitWithProgress) => {
    setHabits(prev => [...prev, newHabit]);
    setIsModalOpen(false);
    
    showSuccess('Habit Created', `"${newHabit.name}" has been added to your habits!`);
    navigate('/dashboard');
  };

  // FIXED: Updated filtering to use get_completion_status for "achieved" tab
  const filteredHabits = habits.filter(habit => {
    if (activeTab === 'all') return true;
    if (activeTab === 'today') {
      // For daily habits, check completed_today
      // For weekly/monthly, check if ANY completion was made today (even if period not complete)
      if (habit.periodicity === 'daily') {
        return habit.completed_today;
      } else {
        // Show if completed today OR if progress increased (indicating today's completion)
        return habit.completed_today || (habit.progress && habit.progress.completed > 0);
      }
    }
    if (activeTab === 'achieved') {
      // Check if habit has completion_status and is complete
      return habit.completion_status?.is_complete === true;
    }
    return habit.periodicity === activeTab;
  });

  const overallProgress = habits.reduce((acc, habit) => {
    acc.completed += habit.progress?.completed || 0;
    acc.total += habit.progress?.total || 0;
    return acc;
  }, { completed: 0, total: 0 });

  const progressPercentage = overallProgress.total > 0 
    ? Math.round((overallProgress.completed / overallProgress.total) * 100)
    : 0;

  const HabitCard = ({ habit }: { habit: HabitWithProgress }) => {
    const isCompleted = habit.completed_today;
    const progressPercent = habit.progress?.total && habit.progress.total > 0 
      ? (habit.progress.completed / habit.progress.total) * 100 
      : 0;
    const isCompleting = completingHabits.has(habit.id);
    const isDeleting = deletingHabits.has(habit.id);
    
    // Check if habit is fully achieved
    const isAchieved = habit.completion_status?.is_complete === true;
    
    // For weekly/monthly habits: check if we've reached the frequency limit for this period
    const hasReachedPeriodLimit = habit.progress && habit.progress.completed >= habit.progress.total;
    
    // Determine if button should be disabled
    const isButtonDisabled = isCompleting || (habit.periodicity !== 'daily' && hasReachedPeriodLimit);

    return (
      <div className={`bg-white rounded-lg border-2 p-4 hover:shadow-md transition-shadow ${
        isAchieved ? 'border-yellow-300 bg-gradient-to-r from-yellow-50 to-white' : 'border-gray-200'
      }`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="text-2xl">
              {typeof habit.icon === 'string' && /^[A-Za-z0-9_-]+$/.test(habit.icon)
                ? <MaterialIcon iconName={habit.icon} fontSize="large" />
                : <span>{habit.icon}</span>
              }
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-gray-900">{habit.name}</h3>
                {isAchieved && (
                  <span className="text-xl" title="Goal Achieved!">🏆</span>
                )}
                {!isAchieved && isCompleted && (
                  <span className="text-sm text-green-600" title="Completed Today">✓</span>
                )}
              </div>
              <p className="text-sm text-gray-500">{habit.goal_description}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              habit.category === 'Health' ? 'bg-green-100 text-green-800' :
              habit.category === 'Work' ? 'bg-blue-100 text-blue-800' :
              habit.category === 'Personal' ? 'bg-purple-100 text-purple-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {habit.category}
            </span>
            <button
              onClick={() => handleEditHabit(habit.id)}
              className="p-1 hover:bg-gray-100 rounded"
              title="Edit habit"
            >
              <Edit size={16} className="text-blue-500" />
            </button>
            <button
              onClick={() => handleDeleteHabit(habit.id)}
              disabled={isDeleting}
              className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
              title={isDeleting ? "Deleting..." : "Delete habit"}
            >
              {isDeleting ? (
                <Loader size={16} className="text-gray-400 animate-spin" />
              ) : (
                <Trash2 size={16} className="text-red-500 hover:text-red-700" />
              )}
            </button>
          </div>
        </div>

        {/* Achievement Banner */}
        {isAchieved && habit.completion_status && (
          <div className="mb-3 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">🎉</span>
              <span className="font-bold text-yellow-900">Goal Achieved!</span>
            </div>
            <p className="text-sm text-yellow-800">
              Completed after {habit.completion_status.days_elapsed} days
              {habit.completion_status.target_date && (
                <> • Finished on {new Date(habit.completion_status.target_date).toLocaleDateString()}</>
              )}
            </p>
          </div>
        )}

        {habit.progress && (
          <div className="mb-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-600">
                {habit.progress.completed} of {habit.progress.total} completed
              </span>
              <span className="text-sm font-medium text-gray-900">
                {Math.round(progressPercent)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all ${
                  isAchieved ? 'bg-yellow-500' :
                  progressPercent >= 100 ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min(progressPercent, 100)}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Show duration/completion info if available */}
        {habit.completion_status && !habit.completion_status.is_ongoing && !isAchieved && habit.completion_status.completion_percentage != null && (
          <div className="mb-3 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Progress: {habit.completion_status.completion_percentage}%</span>
              {(habit.completion_status.days_remaining ?? 0) > 0 && (
                <span className="text-blue-600 font-medium">
                  {habit.completion_status.days_remaining} days remaining
                </span>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {habit.preferred_time && (
              <span className="flex items-center gap-1 text-sm text-gray-500">
                <Clock size={12} />
                {habit.preferred_time.slice(0, 5)}
              </span>
            )}
            <span className="text-sm text-gray-500 capitalize">
              {habit.periodicity}
            </span>
            {habit.completion_status?.is_ongoing && (
              <span className="text-xs text-gray-400">• Ongoing</span>
            )}
          </div>
          
          {isAchieved ? (
            <div className="flex gap-2">
              <button
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
                title="Archive this habit"
              >
                Archive
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {/* Show completion status for non-daily habits */}
              {habit.periodicity !== 'daily' && isCompleted && (
                <span className="text-xs text-green-600 font-medium">
                  +1 today
                </span>
              )}
              
              <button
                onClick={() => toggleHabitCompletion(habit.id)}
                disabled={isButtonDisabled}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  hasReachedPeriodLimit && habit.periodicity !== 'daily'
                    ? 'bg-green-100 text-green-800 cursor-not-allowed opacity-75'
                    : isCompleting
                    ? 'bg-blue-100 text-blue-800 opacity-50 cursor-not-allowed'
                    : isCompleted && habit.periodicity === 'daily'
                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                    : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                }`}
                title={
                  hasReachedPeriodLimit && habit.periodicity !== 'daily'
                    ? `Completed ${habit.progress?.completed}/${habit.progress?.total} for this ${habit.periodicity === 'weekly' ? 'week' : 'month'}`
                    : isCompleted && habit.periodicity === 'daily'
                    ? "Click to undo"
                    : "Mark as done"
                }
              >
                {isCompleting ? (
                  <>
                    <Loader size={16} className="animate-spin" />
                    Updating...
                  </>
                ) : hasReachedPeriodLimit && habit.periodicity !== 'daily' ? (
                  <>
                    <CheckCircle size={16} />
                    Period Complete
                  </>
                ) : isCompleted ? (
                  <>
                    <CheckCircle size={16} />
                    {habit.periodicity === 'daily' ? 'Completed' : 'Mark Again'}
                  </>
                ) : (
                  <>
                    <Circle size={16} />
                    Mark Done
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex-1 bg-gray-50 flex items-center justify-center">
        <Loader className="animate-spin" size={48} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-3 text-red-500" size={48} />
          <p className="text-gray-900 font-medium">{error}</p>
          <button 
            onClick={loadDashboardData}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="p-4">
          <div className="max-w-7xl mx-auto space-y-6 pb-6">
            
            {/* Header */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate('/stats')}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <BarChart3 size={16} />
                    Stats
                  </button>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-3 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors text-sm font-medium"
                  >
                    <Plus size={16} />
                    Add Habit
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{habits.length}</div>
                  <div className="text-xs text-gray-600">Active Habits</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {habits.filter(h => h.completed_today).length}
                  </div>
                  <div className="text-xs text-gray-600">Completed Today</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{progressPercentage}%</div>
                  <div className="text-xs text-gray-600">Overall Progress</div>
                </div>
              </div>
            </div>

            {/* Weekly Calendar */}
            <WeeklyCalendar />

            {/* FIXED: Updated tabs with "Done Today" and "Achieved" */}
            <div className="bg-white rounded-lg border border-gray-200 p-1">
              <div className="flex space-x-1">
                {[
                  { key: "daily", label: "Daily" },
                  { key: "weekly", label: "Weekly" },
                  { key: "monthly", label: "Monthly" },
                  { key: "all", label: "All" },
                  { key: "today", label: "Done Today" },
                  { key: "achieved", label: "Achieved" }
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === tab.key
                        ? "bg-black text-white"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Habits List */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {activeTab === "all" ? "All" : 
                 activeTab === "today" ? "Done Today" : 
                 activeTab === "achieved" ? "Achieved" : 
                 activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Habits
              </h2>

              {filteredHabits.length > 0 ? (
                <div className="grid gap-4">
                  {filteredHabits.map((habit) => (
                    <HabitCard key={habit.id} habit={habit} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Target size={48} className="mx-auto mb-3 opacity-50" />
                  <p>No {activeTab === "all" ? "" : 
                      activeTab === "today" ? "habits completed today" : 
                      activeTab === "achieved" ? "achieved habits" : 
                      activeTab} habits found</p>
                  <p className="text-sm mt-1">
                    {habits.length === 0
                      ? "Create your first habit to get started!"
                      : activeTab === "today" 
                      ? "Complete some habits to see them here!"
                      : activeTab === "achieved"
                      ? "Finish a habit's duration to see achievements here!"
                      : `Create your first ${activeTab} habit`}
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <HabitFormModal 
            isOpen={isModalOpen} 
            setIsOpen={handleModalClose}
            onHabitCreated={handleHabitCreated}
            onHabitUpdated={handleHabitUpdated}
            habitToEdit={habitToEdit}
          />
          
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
    </div>
  );
}