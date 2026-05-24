import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { Suspense, lazy } from 'react';
import 'react-toastify/dist/ReactToastify.css';

const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Upload = lazy(() => import('./pages/Upload'));
const Notes = lazy(() => import('./pages/Notes'));
const Quiz = lazy(() => import('./pages/Quiz'));
const Results = lazy(() => import('./pages/Results'));
const Profile = lazy(() => import('./pages/Profile'));
const ExamCountdown = lazy(() => import('./pages/ExamCountdown'));
const MathSolver = lazy(() => import('./pages/MathSolver'));
const Payment = lazy(() => import('./pages/Payment'));
const StudyGroups = lazy(() => import('./pages/StudyGroups'));
const Competition = lazy(() => import('./pages/Competition'));

function PageLoader() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Loading...</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss={false}
        draggable
        pauseOnHover={false}
        limit={3}
      />
      <Suspense fallback={<PageLoader />}>
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
          <Route path="/competition" element={<Competition />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;