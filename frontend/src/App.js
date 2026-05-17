import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Notes from './pages/Notes';
import Quiz from './pages/Quiz';
import Results from './pages/Results';
import Profile from './pages/Profile';
import ExamCountdown from './pages/ExamCountdown';
import MathSolver from './pages/MathSolver';
import Payment from './pages/Payment';
import StudyGroups from './pages/StudyGroups';

function App() {
  return (
    <Router>
      <ToastContainer position="top-right" autoClose={3000} />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/notes" element={<Notes />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/results" element={<Results />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/exam-countdown" element={<ExamCountdown />} />
        <Route path="/math-solver" element={<MathSolver />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/study-groups" element={<StudyGroups />} />
      </Routes>
    </Router>
  );
}

export default App;