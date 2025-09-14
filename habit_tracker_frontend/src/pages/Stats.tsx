import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Award, Target, Calendar, Flame, Star, BarChart3, Zap } from 'lucide-react';
import MaterialIcon from '../components/MaterialIcon';

import type { StreakData, HabitStats, OverallStats } from '../components/Types';

export default function Stats() {
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

  // Mock data for demonstration - replace with actual API calls
  useEffect(() => {
    // Simulate API loading
    setTimeout(() => {
      setOverallStats({
        totalHabits: 5,
        totalCompletions: 127,
        averageCompletionRate: 78,
        bestStreak: {
          habitId: 1,
          habitName: "Morning Exercise",
          habitIcon: "FitnessCenter",
          currentStreak: 12,
          longestStreak: 21,
          lastCompletedDate: new Date().toISOString()
        },
        worstPerformer: {
          habitId: 3,
          habitName: "Reading",
          habitIcon: "MenuBook",
          category: "Personal",
          totalCompletions: 8,
          completionRate: 32,
          averagePerWeek: 2.1,
          createdDays: 25
        },
        bestPerformer: {
          habitId: 1,
          habitName: "Morning Exercise",
          habitIcon: "FitnessCenter",
          category: "Health",
          totalCompletions: 45,
          completionRate: 89,
          averagePerWeek: 6.2,
          createdDays: 50
        },
        daysActive: 45
      });

      setHabitStats([
        {
          habitId: 1,
          habitName: "Morning Exercise",
          habitIcon: "FitnessCenter",
          category: "Health",
          totalCompletions: 45,
          completionRate: 89,
          averagePerWeek: 6.2,
          createdDays: 50
        },
        {
          habitId: 2,
          habitName: "Hydration",
          habitIcon: "LocalDrink",
          category: "Health",
          totalCompletions: 38,
          completionRate: 76,
          averagePerWeek: 5.3,
          createdDays: 50
        },
        {
          habitId: 3,
          habitName: "Reading",
          habitIcon: "MenuBook",
          category: "Personal",
          totalCompletions: 25,
          completionRate: 62,
          averagePerWeek: 4.5,
          createdDays: 40
        },
        {
          habitId: 4,
          habitName: "Morning Routine",
          habitIcon: "WbSunny",
          category: "Personal",
          totalCompletions: 19,
          completionRate: 54,
          averagePerWeek: 3.8,
          createdDays: 35
        }
      ]);

      setStreakData([
        {
          habitId: 1,
          habitName: "Morning Exercise",
          habitIcon: "FitnessCenter",
          currentStreak: 12,
          longestStreak: 21,
          lastCompletedDate: new Date().toISOString()
        },
        {
          habitId: 2,
          habitName: "Hydration",
          habitIcon: "LocalDrink",
          currentStreak: 7,
          longestStreak: 15,
          lastCompletedDate: new Date().toISOString()
        },
        {
          habitId: 3,
          habitName: "Reading",
          habitIcon: "MenuBook",
          currentStreak: 0,
          longestStreak: 8,
          lastCompletedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          habitId: 4,
          habitName: "Morning Routine",
          habitIcon: "WbSunny",
          currentStreak: 3,
          longestStreak: 12,
          lastCompletedDate: new Date().toISOString()
        }
      ]);

      setLoading(false);
    }, 1000);
  }, []);

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
            trend === 'up' ? 'text-green-600' : 
            trend === 'down' ? 'text-red-600' : 'text-gray-500'
          }`}>
            {trend === 'up' && <TrendingUp size={16} />}
            {trend === 'down' && <TrendingDown size={16} />}
          </div>
        )}
      </div>
      <div className="space-y-1">
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        <p className="text-sm font-medium text-gray-900">{title}</p>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>
    </div>
  );

  const HabitStatsCard = ({ habit }: { habit: HabitStats }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="text-2xl">
          <MaterialIcon iconName={habit.habitIcon} fontSize="large" />
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-gray-900">{habit.habitName}</h3>
          <p className="text-sm text-gray-500">{habit.category}</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-gray-900">{habit.completionRate}%</div>
          <div className="text-xs text-gray-500">Success Rate</div>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Total Completions</span>
          <span className="font-medium">{habit.totalCompletions}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Per Week</span>
          <span className="font-medium">{habit.averagePerWeek}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Active Days</span>
          <span className="font-medium">{habit.createdDays}</span>
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
          <div 
            className={`h-2 rounded-full transition-all ${
              habit.completionRate >= 80 ? 'bg-green-500' :
              habit.completionRate >= 60 ? 'bg-yellow-500' :
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
            <Flame className={`${isActive ? 'text-orange-500' : 'text-gray-400'}`} size={20} />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className={`text-2xl font-bold ${isActive ? 'text-orange-500' : 'text-gray-400'}`}>
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
      <div className="flex-1 bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="animate-pulse mx-auto mb-4" size={48} />
          <h2 className="text-xl font-semibold text-gray-900">Loading your stats...</h2>
          <p className="text-gray-600 mt-2">Calculating your progress</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-white scrollbar-hide">
      <div className="p-4">
        <div className="max-w-7xl mx-auto space-y-6 pb-6">
          
          {/* Header */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-900">Statistics</h1>
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
                      ? "bg-blue-500 text-white"
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
                  color="bg-blue-500"
                  subtitle="Active habits"
                />
                <StatCard
                  title="Completions"
                  value={overallStats.totalCompletions}
                  icon={Award}
                  color="bg-green-500"
                  subtitle="All time"
                  trend="up"
                />
                <StatCard
                  title="Success Rate"
                  value={`${overallStats.averageCompletionRate}%`}
                  icon={TrendingUp}
                  color="bg-purple-500"
                  subtitle="Average"
                />
                <StatCard
                  title="Days Active"
                  value={overallStats.daysActive}
                  icon={Calendar}
                  color="bg-orange-500"
                  subtitle="Tracking period"
                />
              </div>

              {/* Highlights */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">Highlights</h2>
                
                {overallStats.bestStreak && (
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200 p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-500 rounded-full">
                        <Flame className="text-white" size={20} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">🔥 Best Current Streak</h3>
                        <p className="text-sm text-gray-600">
                          {overallStats.bestStreak.currentStreak} days with{' '}
                          <span className="font-medium">{overallStats.bestStreak.habitName}</span>
                        </p>
                      </div>
                      <div className="text-2xl font-bold text-orange-600">
                        {overallStats.bestStreak.currentStreak}
                      </div>
                    </div>
                  </div>
                )}

                {overallStats.bestPerformer && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-500 rounded-full">
                        <Star className="text-white" size={20} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">⭐ Top Performer</h3>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">{overallStats.bestPerformer.habitName}</span>{' '}
                          with {overallStats.bestPerformer.completionRate}% success rate
                        </p>
                      </div>
                      <div className="text-2xl font-bold text-green-600">
                        {overallStats.bestPerformer.completionRate}%
                      </div>
                    </div>
                  </div>
                )}

                {overallStats.worstPerformer && (
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200 p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-yellow-500 rounded-full">
                        <Zap className="text-white" size={20} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">⚡ Needs Attention</h3>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">{overallStats.worstPerformer.habitName}</span>{' '}
                          could use some focus ({overallStats.worstPerformer.completionRate}% success)
                        </p>
                      </div>
                      <div className="text-2xl font-bold text-yellow-600">
                        {overallStats.worstPerformer.completionRate}%
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
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Flame className="text-orange-500" size={20} />
                Current Streaks
              </h2>
              <div className="grid gap-4">
                {streakData
                  .sort((a, b) => b.currentStreak - a.currentStreak)
                  .map((streak) => (
                    <StreakCard key={streak.habitId} streak={streak} />
                  ))}
              </div>

              {/* All-time best streaks */}
              <div className="mt-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Award className="text-gold-500" size={20} />
                  Personal Records
                </h2>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="space-y-3">
                    {streakData
                      .sort((a, b) => b.longestStreak - a.longestStreak)
                      .slice(0, 3)
                      .map((streak, index) => (
                        <div key={streak.habitId} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            index === 0 ? 'bg-yellow-500 text-white' :
                            index === 1 ? 'bg-gray-400 text-white' :
                            'bg-orange-600 text-white'
                          }`}>
                            {index + 1}
                          </div>
                          <MaterialIcon iconName={streak.habitIcon} fontSize="medium" />
                          <div className="flex-1">
                            <span className="font-medium">{streak.habitName}</span>
                          </div>
                          <div className="text-lg font-bold text-gray-900">
                            {streak.longestStreak} days
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Habits Tab */}
          {activeTab === 'habits' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Habit Performance</h2>
              <div className="grid gap-4">
                {habitStats
                  .sort((a, b) => b.completionRate - a.completionRate)
                  .map((habit) => (
                    <HabitStatsCard key={habit.habitId} habit={habit} />
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}