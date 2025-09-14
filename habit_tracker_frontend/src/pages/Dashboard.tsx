import { useState, useEffect } from 'react';
import { CheckCircle, Circle, TrendingUp, Target, Clock, MoreHorizontal, Loader, AlertCircle } from 'lucide-react';
import type { HabitWithProgress, CompletedHabit } from '../components/Types';
import MaterialIcon from '../components/MaterialIcon';
import WeeklyCalendar from "../components/WeeklyCalendar"
import habitService from '../services/habitService';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<string>('daily');
  const [habits, setHabits] = useState<HabitWithProgress[]>([]);
  const [completedHabits, setCompletedHabits] = useState<CompletedHabit[]>([]);
  const [showCompleted, setShowCompleted] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [completingHabits, setCompletingHabits] = useState<Set<number>>(new Set());

  // Load dashboard data on component mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await habitService.getDashboardData();
      setHabits(data.habits || []);
      setCompletedHabits(data.completedHabits || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError('Failed to load habits. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle habit completion toggle
  const toggleHabitCompletion = async (habitId: number): Promise<void> => {
    if (completingHabits.has(habitId)) return; // Prevent double-clicking
    
    setCompletingHabits(prev => new Set(prev).add(habitId));
    
    try {
      const habit = habits.find(h => h.id === habitId);
      if (!habit) return;
      
      let updatedHabit: HabitWithProgress;
      
      if (habit.completed_today) {
        // Uncomplete the habit
        updatedHabit = await habitService.uncompleteHabit(habitId);
      } else {
        // Complete the habit
        updatedHabit = await habitService.completeHabit(habitId);
      }
      
      // Update the habit in local state
      setHabits(prev => prev.map(h => 
        h.id === habitId ? updatedHabit : h
      ));
      
      // If habit was completed, add to completed list
      if (updatedHabit.completed_today) {
        const newCompletedHabit: CompletedHabit = {
          id: `${habitId}-${Date.now()}`,
          name: updatedHabit.name,
          category: updatedHabit.category,
          icon: updatedHabit.icon,
          completedDate: new Date().toISOString()
        };
        setCompletedHabits(prev => [newCompletedHabit, ...prev.slice(0, 9)]); // Keep last 10
      }
      
    } catch (err) {
      console.error('Failed to toggle habit completion:', err);
      setError('Failed to update habit. Please try again.');
    } finally {
      setCompletingHabits(prev => {
        const next = new Set(prev);
        next.delete(habitId);
        return next;
      });
    }
  };

  // Filter habits by periodicity
  const filteredHabits = habits.filter(habit => 
    activeTab === 'all' ? true : habit.periodicity === activeTab
  );

  // Calculate overall progress
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

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="text-2xl">
              {typeof habit.icon === 'string' && /^[A-Za-z0-9_-]+$/.test(habit.icon)
                ? <MaterialIcon iconName={habit.icon} fontSize="large" />
                : <span>{habit.icon}</span>
              }
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{habit.name}</h3>
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
            <button className="p-1 hover:bg-gray-100 rounded">
              <MoreHorizontal size={16} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
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
                  progressPercent >= 100 ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min(progressPercent, 100)}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Action buttons */}
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
          </div>
          
          <button
            onClick={() => toggleHabitCompletion(habit.id)}
            disabled={isCompleting}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors disabled:opacity-50 ${
              isCompleted 
                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
            }`}
          >
            {isCompleting ? (
              <>
                <Loader size={16} className="animate-spin" />
                Updating...
              </>
            ) : isCompleted ? (
              <>
                <CheckCircle size={16} />
                Completed
              </>
            ) : (
              <>
                <Circle size={16} />
                Mark Done
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  const CompletedHabitCard = ({ habit }: { habit: CompletedHabit }) => (
    <div className="bg-gray-50 rounded-lg border border-gray-200 p-3">
      <div className="flex items-center gap-3">
        <span className="text-lg opacity-75">
          {typeof habit.icon === 'string' && /^[A-Za-z0-9_-]+$/.test(habit.icon)
            ? <MaterialIcon iconName={habit.icon} fontSize="small" />
            : <span>{habit.icon}</span>
          }
        </span>
        <div className="flex-1">
          <h4 className="font-medium text-gray-700">{habit.name}</h4>
          <p className="text-sm text-gray-500">
            Completed {new Date(habit.completedDate).toLocaleDateString()}
          </p>
        </div>
        <CheckCircle size={20} className="text-green-500" />
      </div>
    </div>
  );

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="animate-spin mx-auto mb-4" size={48} />
          <h2 className="text-xl font-semibold text-gray-900">Loading your habits...</h2>
          <p className="text-gray-600 mt-2">This may take a moment</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadDashboardData}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

return (
   <div className="flex-1 overflow-y-auto bg-gray-50 scrollbar-hide">
    <div className="p-2">
      <div className="max-w-7xl mx-auto space-y-6 pb-6">
      
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Habit Dashboard</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={loadDashboardData}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              title="Refresh"
            >
              <Loader size={18} />
            </button>
            <span className="text-sm text-gray-500">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
        </div>

        {/* Overall Progress */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
          <div className="flex items-center gap-4 mb-3">
            <TrendingUp className="text-blue-600" size={24} />
            <div>
              <h2 className="font-semibold text-gray-900">Overall Progress</h2>
              <p className="text-sm text-gray-600">
                {overallProgress.completed} of {overallProgress.total} habits
                completed
              </p>
            </div>
          </div>
          <div className="w-full bg-white rounded-full h-4">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-4 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <div className="text-right mt-2">
            <span className="text-2xl font-bold text-gray-900">
              {progressPercentage}%
            </span>
          </div>
        </div>
      </div>

      {/* Main Content - Full Width Vertical Stack */}
      <div className="space-y-6">
        
        {/* Calendar */}
        <WeeklyCalendar />

        {/* Tabs */}
        <div className="bg-white rounded-lg border border-gray-200 p-1">
          <div className="flex space-x-1">
            {[
              { key: "daily", label: "Daily", count: habits.filter(h => h.periodicity === "daily").length },
              { key: "weekly", label: "Weekly", count: habits.filter(h => h.periodicity === "weekly").length },
              { key: "monthly", label: "Monthly", count: habits.filter(h => h.periodicity === "monthly").length },
              { key: "all", label: "All", count: habits.length }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? "bg-blue-500 text-white"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        {/* Habits Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 capitalize">
              {activeTab === "all" ? "All" : activeTab} Habits
            </h2>
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              <Target size={16} />
              {showCompleted ? "Hide" : "Show"} Completed
            </button>
          </div>

          {filteredHabits.length > 0 ? (
            <div className="grid gap-4">
              {filteredHabits.map((habit) => (
                <HabitCard key={habit.id} habit={habit} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Target size={48} className="mx-auto mb-3 opacity-50" />
              <p>No {activeTab === "all" ? "" : activeTab} habits found</p>
              <p className="text-sm mt-1">
                {habits.length === 0
                  ? "Create your first habit to get started!"
                  : `Create your first ${activeTab} habit`}
              </p>
            </div>
          )}
        </div>

        {/* Completed Section */}
        {showCompleted && completedHabits.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <CheckCircle className="text-green-500" size={20} />
              Recently Completed
            </h2>
            <div className="grid gap-3">
              {completedHabits.map((habit) => (
                <CompletedHabitCard key={habit.id} habit={habit} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
  </div>
);
}