import React, { useState, useEffect } from 'react';
import './App.css';

function Quiz({ certificationId, onBackToLanding }) {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    fetch(`${process.env.PUBLIC_URL}/resource/final-questions.json`)
      .then(response => response.json())
      .then(data => {
        setQuestions(data);
      })
      .catch(error => {
        console.error('Error loading questions:', error);
      });
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const currentQuestion = questions[currentQuestionIndex];

  const handleOptionSelect = (optionIndex) => {
    if (showResult) return; // Prevent selection after submission
    
    setSelectedOptions(prev => {
      const isSelected = prev.includes(optionIndex);
      if (isSelected) {
        return prev.filter(index => index !== optionIndex);
      } else {
        return [...prev, optionIndex];
      }
    });
  };

  const handleSubmit = () => {
    if (selectedOptions.length === 0) return;
    
    const correctAnswers = currentQuestion.answer.map(ans => ans - 1); // Convert to 0-based index
    const isAnswerCorrect = selectedOptions.length === correctAnswers.length &&
      selectedOptions.every(option => correctAnswers.includes(option));
    
    setIsCorrect(isAnswerCorrect);
    setShowResult(true);
    
    if (isAnswerCorrect) {
      setScore(prev => prev + 1);
    }
    setTotalAnswered(prev => prev + 1);
  };

  const handleNext = () => {
    setSelectedOptions([]);
    setShowResult(false);
    setIsCorrect(false);
    setCurrentQuestionIndex(prev => prev + 1);
    
    // Scroll to top when moving to next question
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleReset = () => {
    setCurrentQuestionIndex(0);
    setSelectedOptions([]);
    setShowResult(false);
    setIsCorrect(false);
    setScore(0);
    setTotalAnswered(0);
    
    // Scroll to top when resetting quiz
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleBackToLanding = () => {
    onBackToLanding();
  };

  if (questions.length === 0) {
    return (
      <div className="app">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading questions...</p>
        </div>
      </div>
    );
  }

  if (currentQuestionIndex >= questions.length) {
    return (
      <div className="app">
        <div className="quiz-complete">
          <h1>Quiz Complete! 🎉</h1>
          <div className="final-score">
            <h2>Your Score</h2>
            <div className="score-display">
              <span className="score-number">{score}</span>
              <span className="score-total">/ {questions.length}</span>
            </div>
            <div className="score-percentage">
              {Math.round((score / questions.length) * 100)}%
            </div>
          </div>
          <div className="quiz-actions">
            <button className="reset-btn" onClick={handleReset}>
              Take Quiz Again
            </button>
            <button className="back-btn" onClick={handleBackToLanding}>
              Back to Certifications
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {/* Back Button - Outside the quiz container (Desktop only) */}
      {!isMobile && (
        <div className="back-button-outer">
          <button className="back-button" onClick={handleBackToLanding}>
            ← Back to Certifications
          </button>
        </div>
      )}
      
      <div className="quiz-container">
        {/* Back Button - Inside the quiz container (Mobile only) */}
        {isMobile && (
          <div className="back-button-inner">
            <button className="back-button" onClick={handleBackToLanding}>
              ← Back to Certifications
            </button>
          </div>
        )}

        {/* Header */}
        <div className="quiz-header">
          <div className="progress-info">
            <span className="question-counter">
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
              ></div>
            </div>
          </div>
          <div className="score-info">
            <span>Score: {score}/{totalAnswered}</span>
          </div>
        </div>

        {/* Question */}
        <div className="question-section">
          <h2 className="question-text">{currentQuestion.question}</h2>
        </div>

        {/* Options */}
        <div className="options-section">
          {currentQuestion.options.map((option, index) => (
            <button
              key={index}
              className={`option-btn ${
                selectedOptions.includes(index) ? 'selected' : ''
              } ${
                showResult 
                  ? currentQuestion.answer.includes(index + 1) 
                    ? 'correct' 
                    : selectedOptions.includes(index) 
                      ? 'incorrect' 
                      : ''
                  : ''
              }`}
              onClick={() => handleOptionSelect(index)}
              disabled={showResult}
            >
              <span className="option-letter">
                {String.fromCharCode(65 + index)}
              </span>
              <span className="option-text">{option}</span>
              {showResult && currentQuestion.answer.includes(index + 1) && (
                <span className="correct-indicator">✓</span>
              )}
              {showResult && selectedOptions.includes(index) && !currentQuestion.answer.includes(index + 1) && (
                <span className="incorrect-indicator">✗</span>
              )}
            </button>
          ))}
        </div>

        {/* Submit/Next Button */}
        <div className="button-section">
          {!showResult ? (
            <button 
              className="submit-btn" 
              onClick={handleSubmit}
              disabled={selectedOptions.length === 0}
            >
              Submit Answer
            </button>
          ) : (
            <div className="result-section">
              <div className={`result-message ${isCorrect ? 'correct' : 'incorrect'}`}>
                {isCorrect ? '✅ Correct!' : '❌ Incorrect!'}
              </div>
              <button className="next-btn" onClick={handleNext}>
                Next Question
              </button>
            </div>
          )}
        </div>

        {/* Result Details */}
        {showResult && (
          <div className="result-details">
            <h3>Correct Answer{currentQuestion.answer.length > 1 ? 's' : ''}:</h3>
            <div className="correct-answers">
              {currentQuestion.answer.map((ans, index) => (
                <span key={index} className="correct-answer">
                  {String.fromCharCode(64 + ans)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Quiz;