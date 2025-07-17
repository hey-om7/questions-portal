import React from 'react';
import { HashRouter as Router, Routes, Route, useNavigate, useParams, useLocation } from 'react-router-dom';
import LandingPage from './LandingPage';
import Quiz from './Quiz';
import './App.css';

function QuizWrapper() {
  const navigate = useNavigate();
  const { certificationId } = useParams();
  const location = useLocation();
  // Extract filepath from query string
  const query = new URLSearchParams(location.search);
  const filepath = query.get('filepath');
  return (
    <Quiz
      certificationId={certificationId}
      filepath={filepath}
      onBackToLanding={() => navigate('/')} 
    />
  );
}

function App() {
  const navigate = useNavigate();
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<LandingPage onStartQuiz={(id, filepath) => navigate(`/quiz/${id}?filepath=${encodeURIComponent(filepath || '')}`)} />} />
        <Route path="/quiz/:certificationId" element={<QuizWrapper />} />
      </Routes>
    </div>
  );
}

export default function AppWithRouter() {
  return (
    <Router>
      <App />
    </Router>
  );
}
