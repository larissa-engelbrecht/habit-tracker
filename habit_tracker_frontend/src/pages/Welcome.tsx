
const habits = [
  { name: 'Morning Routine', icon: '🌞' },
  { name: 'Exercise', icon: '🏋️' },
  { name: 'Hydration', icon: '💧' },
  { name: 'Reading', icon: '📖' },
];

export default function Welcome() {
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
        {habits.map((habit, index) => (
          <div
            key={index}
            className="bg-black/90 text-white rounded-2xl shadow-md px-6 py-5 flex items-center justify-between"
          >
            <span className="text-lg font-medium">{habit.name}</span>
            <span className="text-2xl">{habit.icon}</span>
          </div>
        ))}

        <div className="bg-black/90 text-white rounded-2xl shadow-md px-6 py-5 flex items-center justify-between">
            <span className="text-lg font-medium">Custom Habit</span>
            <span className="text-2xl">cog</span>
          </div>
      </div>

      <button className="mt-12 w-full max-w-md bg-black text-white py-4 rounded-full text-lg font-semibold hover:bg-gray-800 transition-all duration-200">
        Start Tracking →
      </button> 
         
    </div>
  );
}
