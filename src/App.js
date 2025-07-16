import React from 'react';
import { HashRouter as Router, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import LandingPage from './LandingPage';
import Quiz from './Quiz';
import './App.css';

function QuizWrapper() {
  const navigate = useNavigate();
  const { certificationId } = useParams();
  return (
    <Quiz
      certificationId={certificationId}
      onBackToLanding={() => navigate('/')} 
    />
  );
}

function App() {
  const navigate = useNavigate();
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<LandingPage onStartQuiz={id => navigate(`/quiz/${id}`)} />} />
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
