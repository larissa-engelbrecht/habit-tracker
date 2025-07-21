import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Welcome from './pages/Welcome';
import ThemeToggle from './components/ThemeToggle';
//import Dashboard from './pages/Dashboard';
//import Stats from './pages/Stats';

function App() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="w-[480px] sm:w-[520px] h-screen bg-white dark:bg-black text-black dark:text-white shadow-xl overflow-hidden">
      <div className="absolute top-4 right-4">
          <ThemeToggle />
      </div> 
        <Router>
          <Routes>
            <Route path="/" element={<Welcome />} />
            {/* Uncomment these routes when the components are ready */}
            {/* <Route path="/dashboard" element={<Dashboard />} /> */}
            {/* <Route path="/stats" element={<Stats />} /> */}
          </Routes>
        </Router>
      </div>
    </div>
  );
}


export default App
