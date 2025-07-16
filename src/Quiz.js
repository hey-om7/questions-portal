import React, { useState, useEffect } from 'react';
import './App.css';

function shuffleArrayWithMapping(array) {
  const arr = array.map((item, idx) => ({ item, originalIndex: idx }));
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function Quiz({ certificationId, onBackToLanding }) {
  // LocalStorage key (namespace by certificationId if present)
  const storageKey = certificationId ? `quizState_${certificationId}` : 'quizState';

  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState([]); // Array of arrays, one per question
  const [showResult, setShowResult] = useState([]); // Array of booleans, one per question
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [shuffledOptions, setShuffledOptions] = useState([]); // Array of arrays, one per question
  const [optionIndexMap, setOptionIndexMap] = useState([]); // Array of arrays, one per question

  // Restore state from localStorage on mount (after questions are loaded)
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

  // Restore quiz state from localStorage after questions are loaded, or shuffle if not present
  useEffect(() => {
    if (questions.length === 0) return;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCurrentQuestionIndex(parsed.currentQuestionIndex || 0);
        setSelectedOptions(parsed.selectedOptions || Array(questions.length).fill([]));
        setShowResult(parsed.showResult || Array(questions.length).fill(false));
        if (Array.isArray(parsed.optionIndexMap) && parsed.optionIndexMap.length === questions.length && Array.isArray(parsed.shuffledOptions) && parsed.shuffledOptions.length === questions.length) {
          setOptionIndexMap(parsed.optionIndexMap);
          setShuffledOptions(parsed.shuffledOptions);
        } else {
          // If not valid, shuffle
          const newShuffledOptions = [];
          const newOptionIndexMap = [];
          for (let i = 0; i < questions.length; i++) {
            const shuffled = shuffleArrayWithMapping(questions[i].options);
            newShuffledOptions.push(shuffled.map(obj => obj.item));
            newOptionIndexMap.push(shuffled.map(obj => obj.originalIndex));
          }
          setShuffledOptions(newShuffledOptions);
          setOptionIndexMap(newOptionIndexMap);
        }
      } catch (e) {
        setSelectedOptions(Array(questions.length).fill([]));
        setShowResult(Array(questions.length).fill(false));
        const newShuffledOptions = [];
        const newOptionIndexMap = [];
        for (let i = 0; i < questions.length; i++) {
          const shuffled = shuffleArrayWithMapping(questions[i].options);
          newShuffledOptions.push(shuffled.map(obj => obj.item));
          newOptionIndexMap.push(shuffled.map(obj => obj.originalIndex));
        }
        setShuffledOptions(newShuffledOptions);
        setOptionIndexMap(newOptionIndexMap);
      }
    } else {
      setSelectedOptions(Array(questions.length).fill([]));
      setShowResult(Array(questions.length).fill(false));
      const newShuffledOptions = [];
      const newOptionIndexMap = [];
      for (let i = 0; i < questions.length; i++) {
        const shuffled = shuffleArrayWithMapping(questions[i].options);
        newShuffledOptions.push(shuffled.map(obj => obj.item));
        newOptionIndexMap.push(shuffled.map(obj => obj.originalIndex));
      }
      setShuffledOptions(newShuffledOptions);
      setOptionIndexMap(newOptionIndexMap);
    }
  }, [questions]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Helper to get current question's shuffled options and index map
  const getCurrentShuffledOptions = () => {
    if (shuffledOptions.length === questions.length) {
      return shuffledOptions[currentQuestionIndex] || [];
    }
    return [];
  };
  const getCurrentOptionIndexMap = () => {
    if (optionIndexMap.length === questions.length) {
      return optionIndexMap[currentQuestionIndex] || [];
    }
    return [];
  };

  const currentQuestion = questions[currentQuestionIndex];
  const currentShuffledOptions = getCurrentShuffledOptions();
  const currentOptionIndexMap = getCurrentOptionIndexMap();
  const currentSelectedOptions = selectedOptions[currentQuestionIndex] || [];
  const currentShowResult = showResult[currentQuestionIndex] || false;

  // Only save to localStorage after a question is submitted
  const saveProgress = (nextQuestionIndex, nextSelectedOptions, nextShowResult, nextOptionIndexMap, nextShuffledOptions) => {
    const stateToSave = {
      currentQuestionIndex: nextQuestionIndex,
      selectedOptions: nextSelectedOptions,
      showResult: nextShowResult,
      optionIndexMap: nextOptionIndexMap,
      shuffledOptions: nextShuffledOptions,
    };
    localStorage.setItem(storageKey, JSON.stringify(stateToSave));
  };

  const handleOptionSelect = (optionIndex) => {
    if (currentShowResult) return; // Prevent selection after submission
    setSelectedOptions(prev => {
      const updated = [...prev];
      const isSelected = (updated[currentQuestionIndex] || []).includes(optionIndex);
      if (!updated[currentQuestionIndex]) updated[currentQuestionIndex] = [];
      if (isSelected) {
        updated[currentQuestionIndex] = updated[currentQuestionIndex].filter(index => index !== optionIndex);
      } else {
        updated[currentQuestionIndex] = [...updated[currentQuestionIndex], optionIndex];
      }
      return updated;
    });
  };

  const handleSubmit = () => {
    if ((currentSelectedOptions || []).length === 0) return;
    const selectedOriginalIndices = (currentSelectedOptions || []).map(idx => currentOptionIndexMap[idx]);
    const correctAnswers = currentQuestion.answer.map(ans => ans - 1); // Convert to 0-based index
    const isAnswerCorrect =
      selectedOriginalIndices.length === correctAnswers.length &&
      selectedOriginalIndices.every(option => correctAnswers.includes(option));
    setIsCorrect(isAnswerCorrect);
    setShowResult(prev => {
      const updated = [...prev];
      updated[currentQuestionIndex] = true;
      // Save progress after submitting
      saveProgress(
        currentQuestionIndex,
        selectedOptions.map((opts, idx) => idx === currentQuestionIndex ? currentSelectedOptions : opts),
        updated,
        optionIndexMap,
        shuffledOptions
      );
      return updated;
    });
    if (isAnswerCorrect) {
      setScore(prev => prev + 1);
    }
    setTotalAnswered(prev => prev + 1);
  };

  const handleNext = () => {
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
    setSelectedOptions(Array(questions.length).fill([]));
    setShowResult(Array(questions.length).fill(false));
    setIsCorrect(false);
    setScore(0);
    setTotalAnswered(0);
    // Re-shuffle all options
    const newShuffledOptions = [];
    const newOptionIndexMap = [];
    for (let i = 0; i < questions.length; i++) {
      const shuffled = shuffleArrayWithMapping(questions[i].options);
      newShuffledOptions.push(shuffled.map(obj => obj.item));
      newOptionIndexMap.push(shuffled.map(obj => obj.originalIndex));
    }
    setShuffledOptions(newShuffledOptions);
    setOptionIndexMap(newOptionIndexMap);
    // Clear localStorage
    localStorage.removeItem(storageKey);
    // Scroll to top when resetting quiz
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleBackToLanding = () => {
    localStorage.removeItem(storageKey);
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
    // Quiz complete, clear localStorage
    localStorage.removeItem(storageKey);
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
          {currentShuffledOptions.map((option, index) => (
            <button
              key={index}
              className={`option-btn ${
                (currentSelectedOptions || []).includes(index) ? 'selected' : ''
              } ${
                currentShowResult 
                  ? currentQuestion.answer.includes(currentOptionIndexMap[index] + 1) 
                    ? 'correct' 
                    : (currentSelectedOptions || []).includes(index) 
                      ? 'incorrect' 
                      : ''
                  : ''
              }`}
              onClick={() => handleOptionSelect(index)}
              disabled={currentShowResult}
            >
              <span className="option-letter">
                {String.fromCharCode(65 + index)}
              </span>
              <span className="option-text">{option}</span>
              {currentShowResult && currentQuestion.answer.includes(currentOptionIndexMap[index] + 1) && (
                <span className="correct-indicator">✓</span>
              )}
              {currentShowResult && (currentSelectedOptions || []).includes(index) && !currentQuestion.answer.includes(currentOptionIndexMap[index] + 1) && (
                <span className="incorrect-indicator">✗</span>
              )}
            </button>
          ))}
        </div>

        {/* Submit/Next Button */}
        <div className="button-section">
          {!currentShowResult ? (
            <button 
              className="submit-btn" 
              onClick={handleSubmit}
              disabled={(currentSelectedOptions || []).length === 0}
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
        {currentShowResult && (
          <div className="result-details">
            <h3>Correct Answer{currentQuestion.answer.length > 1 ? 's' : ''}:</h3>
            <div className="correct-answers">
              {currentQuestion.answer.map((ans, index) => {
                // Find the shuffled index for each correct answer
                const shuffledIdx = currentOptionIndexMap.findIndex(origIdx => origIdx === ans - 1);
                return (
                  <span key={index} className="correct-answer">
                    {String.fromCharCode(65 + shuffledIdx)}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Quiz;