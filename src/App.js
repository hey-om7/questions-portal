import React, { useState, useEffect } from 'react';
import LandingPage from './LandingPage';
import Quiz from './Quiz';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('landing'); // 'landing' or 'quiz'
  const [selectedCertification, setSelectedCertification] = useState(null);

  // Handle browser back/forward buttons and initial URL parsing
  useEffect(() => {
    const handlePopState = (event) => {
      const path = window.location.pathname;
      
      // Parse URL to determine current view
      if (path === '/') {
        setCurrentView('landing');
        setSelectedCertification(null);
      } else if (path.startsWith('/quiz/')) {
        const certId = path.split('/quiz/')[1];
        if (certId) {
          setCurrentView('quiz');
          setSelectedCertification(certId);
        } else {
          // Invalid quiz URL, redirect to landing
          setCurrentView('landing');
          setSelectedCertification(null);
          window.history.replaceState({ view: 'landing' }, '', '/');
        }
      } else {
        // Unknown path, redirect to landing
        setCurrentView('landing');
        setSelectedCertification(null);
        window.history.replaceState({ view: 'landing' }, '', '/');
      }
    };

    // Listen for browser navigation events
    window.addEventListener('popstate', handlePopState);

    // Handle initial URL on page load
    const path = window.location.pathname;
    if (path === '/') {
      // Root path, set to landing
      setCurrentView('landing');
      setSelectedCertification(null);
    } else if (path.startsWith('/quiz/')) {
      // Direct navigation to quiz
      const certId = path.split('/quiz/')[1];
      if (certId) {
        setCurrentView('quiz');
        setSelectedCertification(certId);
      } else {
        // Invalid quiz URL, redirect to landing
        window.history.replaceState({ view: 'landing' }, '', '/');
        setCurrentView('landing');
        setSelectedCertification(null);
      }
    } else {
      // Unknown path, redirect to landing
      window.history.replaceState({ view: 'landing' }, '', '/');
      setCurrentView('landing');
      setSelectedCertification(null);
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const handleStartQuiz = (certificationId) => {
    setSelectedCertification(certificationId);
    setCurrentView('quiz');
    // Update browser history
    window.history.pushState({ view: 'quiz', certification: certificationId }, '', `/quiz/${certificationId}`);
  };

  const handleBackToLanding = () => {
    setCurrentView('landing');
    setSelectedCertification(null);
    // Update browser history
    window.history.pushState({ view: 'landing' }, '', '/');
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
