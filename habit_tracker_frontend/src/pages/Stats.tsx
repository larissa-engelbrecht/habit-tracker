import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, Award, Target, Calendar, Flame, Star, BarChart3, Zap, ArrowLeft } from 'lucide-react';
import MaterialIcon from '../components/MaterialIcon';
import habitService from '../services/habitService';

import type { StreakData, HabitStats, OverallStats, StatsData } from '../components/Types';

export default function Stats() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [overallStats, setOverallStats] = useState<OverallStats>({
    totalHabits: 0,
    totalCompletions: 0,
    averageCompletionRate: 0,
    bestStreak: null,
    worstPerformer: null,
    bestPerformer: null,
    daysActive: 0
  });
  const [habitStats, setHabitStats] = useState<HabitStats[]>([]);
  const [streakData, setStreakData] = useState<StreakData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load real stats data from API
  useEffect(() => {
    loadStatsData();
  }, []);

  const loadStatsData = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading stats data...');
      const statsData: StatsData = await habitService.getStatsData();
      console.log('Stats data received:', statsData);
      
      setOverallStats(statsData.overallStats);
      setHabitStats(statsData.habitStats || []);
      setStreakData(statsData.streakData || []);

    } catch (err) {
      console.error('Failed to load stats data:', err);
      setError('Failed to load statistics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Function to handle navigation back to dashboard
  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color, 
    subtitle,
    trend 
  }: {
    title: string;
    value: string | number;
    icon: any;
    color: string;
    subtitle?: string;
    trend?: 'up' | 'down' | 'neutral';
  }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon size={20} className="text-white" />
        </div>
        {trend && (
          <div className={`text-sm flex items-center gap-1 ${
            trend === 'up' ? 'text-emerald-600' : 
            trend === 'down' ? 'text-red-600' : 'text-gray-600'
          }`}>
            {trend === 'up' ? <TrendingUp size={16} /> : trend === 'down' ? <TrendingDown size={16} /> : null}
          </div>
        )}
      </div>
      <div className="space-y-1">
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        {subtitle && <div className="text-sm text-gray-500">{subtitle}</div>}
      </div>
      <div className="text-xs text-gray-400 mt-2">{title}</div>
    </div>
  );

  const HabitStatCard = ({ habit }: { habit: HabitStats }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-3">
        <div className="text-2xl">
          <MaterialIcon iconName={habit.habitIcon} fontSize="large" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate">{habit.habitName}</h3>
          <p className="text-sm text-gray-500">{habit.category}</p>
        </div>
        <div className="text-right">
          <div className={`text-xl font-bold ${
            habit.completionRate >= 80 ? 'text-emerald-600' :
            habit.completionRate >= 60 ? 'text-blue-600' :
            'text-red-600'
          }`}>
            {habit.completionRate}%
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Completions</span>
          <span className="font-medium">{habit.totalCompletions}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Avg per week</span>
          <span className="font-medium">{habit.averagePerWeek.toFixed(1)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Current streak</span>
          <span className="font-medium flex items-center gap-1">
            <Flame size={14} className={habit.currentStreak > 0 ? 'text-orange-500' : 'text-gray-400'} />
            {habit.currentStreak} days
          </span>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="mt-3">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all ${
              habit.completionRate >= 80 ? 'bg-emerald-500' :
              habit.completionRate >= 60 ? 'bg-blue-500' :
              'bg-red-500'
            }`}
            style={{ width: `${habit.completionRate}%` }}
          ></div>
        </div>
      </div>
    </div>
  );

  const StreakCard = ({ streak }: { streak: StreakData }) => {
    const isActive = streak.currentStreak > 0;
    const daysSinceLastComplete = streak.lastCompletedDate 
      ? Math.floor((Date.now() - new Date(streak.lastCompletedDate).getTime()) / (1000 * 60 * 60 * 24))
      : null;

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="text-2xl">
            <MaterialIcon iconName={streak.habitIcon} fontSize="large" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-gray-900">{streak.habitName}</h3>
            <p className="text-sm text-gray-500">
              {daysSinceLastComplete === 0 ? 'Completed today' :
               daysSinceLastComplete === 1 ? 'Last completed yesterday' :
               daysSinceLastComplete ? `Last completed ${daysSinceLastComplete} days ago` :
               'Never completed'}
            </p>
          </div>
          <div className={`p-2 rounded-full ${isActive ? 'bg-orange-100' : 'bg-gray-100'}`}>
            <Flame className={`${isActive ? 'text-orange-600' : 'text-gray-400'}`} size={20} />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className={`text-2xl font-bold ${isActive ? 'text-orange-600' : 'text-gray-400'}`}>
              {streak.currentStreak}
            </div>
            <div className="text-xs text-gray-500">Current Streak</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{streak.longestStreak}</div>
            <div className="text-xs text-gray-500">Best Streak</div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex-1 bg-white flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="animate-pulse mx-auto mb-4" size={48} />
          <h2 className="text-xl font-semibold text-gray-900">Loading your stats...</h2>
          <p className="text-gray-600 mt-2">Calculating your progress</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex-1 bg-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <BarChart3 className="mx-auto mb-4 text-red-500" size={48} />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Stats</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={loadStatsData}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No habits state
  if (overallStats.totalHabits === 0) {
    return (
      <div className="flex-1 bg-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <BarChart3 className="mx-auto mb-4 text-gray-400" size={48} />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Statistics Yet</h2>
          <p className="text-gray-600 mb-4">Start tracking habits to see your statistics!</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-white scrollbar-hide">
      <div className="p-4">
        <div className="max-w-7xl mx-auto space-y-6 pb-6">
          
          {/* Header with Back Button */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleBackToDashboard}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center"
                  aria-label="Back to Dashboard"
                >
                  <ArrowLeft size={20} className="text-gray-600" />
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Statistics</h1>
              </div>
              <div className="text-sm text-gray-500">
                {overallStats.daysActive} days tracking
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg border border-gray-200 p-1">
            <div className="flex space-x-1">
              {[
                { key: "overview", label: "Overview" },
                { key: "streaks", label: "Streaks" },
                { key: "habits", label: "By Habit" }
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

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Key Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <StatCard
                  title="Total Habits"
                  value={overallStats.totalHabits}
                  icon={Target}
                  color="bg-blue-600"
                  subtitle="Active habits"
                />
                <StatCard
                  title="Completions"
                  value={overallStats.totalCompletions}
                  icon={Award}
                  color="bg-emerald-600"
                  subtitle="All time"
                  trend="up"
                />
                <StatCard
                  title="Success Rate"
                  value={`${overallStats.averageCompletionRate}%`}
                  icon={TrendingUp}
                  color="bg-black"
                  subtitle="Average"
                />
                <StatCard
                  title="Days Active"
                  value={overallStats.daysActive}
                  icon={Calendar}
                  color="bg-gray-700"
                  subtitle="Tracking period"
                />
              </div>

              {/* Highlights */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">Highlights</h2>
                
                {overallStats.bestStreak && (
                  <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg border border-orange-200 p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-orange-500 rounded-full">
                        <Flame className="text-white" size={24} />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-orange-700 font-medium">Best Current Streak</div>
                        <div className="text-lg font-bold text-gray-900">{overallStats.bestStreak.habitName}</div>
                        <div className="text-2xl font-bold text-orange-600">{overallStats.bestStreak.currentStreak} days</div>
                      </div>
                    </div>
                  </div>
                )}

                {overallStats.bestPerformer && (
                  <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-lg border border-emerald-200 p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-emerald-500 rounded-full">
                        <Star className="text-white" size={24} />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-emerald-700 font-medium">Top Performer</div>
                        <div className="text-lg font-bold text-gray-900">{overallStats.bestPerformer.habitName}</div>
                        <div className="text-2xl font-bold text-emerald-600">{overallStats.bestPerformer.completionRate}% completion</div>
                      </div>
                    </div>
                  </div>
                )}

                {overallStats.worstPerformer && (
                  <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-lg border border-red-200 p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-red-500 rounded-full">
                        <Zap className="text-white" size={24} />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-red-700 font-medium">Needs Attention</div>
                        <div className="text-lg font-bold text-gray-900">{overallStats.worstPerformer.habitName}</div>
                        <div className="text-2xl font-bold text-red-600">{overallStats.worstPerformer.completionRate}% completion</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Streaks Tab */}
          {activeTab === 'streaks' && (
            <div className="space-y-4">
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Active Streaks</h2>
                <p className="text-sm text-gray-600">Track your consistency across all habits</p>
              </div>
              
              {streakData.length === 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                  <Flame className="mx-auto mb-3 text-gray-400" size={48} />
                  <p className="text-gray-600">No streaks yet. Complete habits to build streaks!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {streakData.map((streak) => (
                    <StreakCard key={streak.habitId} streak={streak} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* By Habit Tab */}
          {activeTab === 'habits' && (
            <div className="space-y-4">
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Habit Performance</h2>
                <p className="text-sm text-gray-600">Detailed statistics for each habit</p>
              </div>
              
              {habitStats.length === 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                  <BarChart3 className="mx-auto mb-3 text-gray-400" size={48} />
                  <p className="text-gray-600">No habit statistics available</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {habitStats.map((habit) => (
                    <HabitStatCard key={habit.habitId} habit={habit} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}