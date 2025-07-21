import { Link } from 'react-router-dom';

const habits = [
  { name: 'Morning Routine', icon: '🌞' },
  { name: 'Daily Exercise', icon: '🏋️' },
  { name: 'Hydration', icon: '💧' },
  { name: 'Reading', icon: '📚' },
  { name: 'Meditation', icon: '🧘' },
  { name: 'Healthy Eating', icon: '🥗' },
];

export default function Welcome() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900">What Habits Would You Like to Track?</h2>
      <p className="text-gray-600">Choose from our recommended habits or create your own.</p>
      <ul className="space-y-2">
        {habits.map((habit, index) => (
          <li key={index} className="flex items-center bg-gray-900 text-white p-3 rounded-lg">
            <span className="mr-2">{habit.icon}</span>
            <span>{habit.name}</span>
          </li>
        ))}
      </ul>
      <Link to="/dashboard">
        <button className="w-full bg-black text-white p-3 rounded-lg font-semibold">
          Start Tracking →
        </button>
      </Link>
    </div>
  );
}