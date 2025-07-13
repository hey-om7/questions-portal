import React, { useState } from 'react';
import LandingPage from './LandingPage';
import Quiz from './Quiz';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('landing'); // 'landing' or 'quiz'
  const [selectedCertification, setSelectedCertification] = useState(null);

  const handleStartQuiz = (certificationId) => {
    setSelectedCertification(certificationId);
    setCurrentView('quiz');
  };

  const handleBackToLanding = () => {
    setCurrentView('landing');
    setSelectedCertification(null);
  };

  return (
    <div className="App">
      {currentView === 'landing' ? (
        <LandingPage onStartQuiz={handleStartQuiz} />
      ) : (
        <Quiz 
          certificationId={selectedCertification} 
          onBackToLanding={handleBackToLanding} 
        />
      )}
    </div>
  );
}

export default App;
