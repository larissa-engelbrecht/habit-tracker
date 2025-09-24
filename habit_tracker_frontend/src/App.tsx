import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import Welcome from './pages/Welcome';
import Dashboard from './pages/Dashboard';
import Stats from './pages/Stats';
import MaterialIcon from './components/MaterialIcon';
import { useHasActiveHabits } from './hooks/useHasActiveHabits';

function AppRouter() {
  const navigate = useNavigate();
  const hasActive = useHasActiveHabits();

  useEffect(() => {
    if (hasActive === null) return; // still loading
    if (hasActive) {
      console.log("we are on the dashboard because there are active habits " + hasActive);
      navigate('/dashboard');
    } else {
      navigate('/');
    }
  }, [hasActive]);

  if (hasActive === null) return <div>Loading...</div>; // optional loading state

  return (
    <Routes>
      <Route path="/" element={<Welcome />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/stats" element={<Stats />} />
    </Routes>
  );
}

function App() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="w-[500px] sm:w-[500px] h-[90vh] max-h-[950px] bg-white text-black shadow-2xl rounded-2xl overflow-hidden border border-gray-200 relative">
        {/* Mobile header bar */}
        <div className="w-full h-7 bg-gray-100 flex justify-between items-center text-xs text-gray-600 mb-4 px-4">
          <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
          <div className="flex items-center gap-1">
            <MaterialIcon iconName="SignalCellular4Bar" fontSize="small" className="text-green-500" />
            <MaterialIcon iconName="Wifi" fontSize="small" className="text-blue-500" />
            <MaterialIcon iconName="Battery80" fontSize="small" className="text-green-600" />
          </div>
        </div>

        {/* Main content */}
        <div className="h-[calc(90vh-1.75rem)] overflow-y-auto scrollbar-hide">
          <Router>
            <AppRouter />
          </Router>
        </div>
      </div>
    </div>
  );
}

export default App;
