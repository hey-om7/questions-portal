import React, { useState, useEffect } from 'react';
import './App.css';

// Gemini logo SVG (simple placeholder, replace with your own if needed)
const GeminiLogo = () => (
  <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="16" fill="#4285F4"/>
    <circle cx="16" cy="16" r="10" fill="#fff"/>
    <circle cx="16" cy="16" r="6" fill="#4285F4"/>
  </svg>
);

function shuffleArrayWithMapping(array) {
  const arr = array.map((item, idx) => ({ item, originalIndex: idx }));
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Helper to check array validity
function isValidArray(arr, len) {
  return Array.isArray(arr) && arr.length === len;
}

function Quiz({ certificationId, filepath, onBackToLanding }) {
  // LocalStorage key (namespace by certificationId if present)
  const storageKey = certificationId ? `quizState_${certificationId}` : 'quizState';

  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState([]); // Array of arrays, one per question
  const [showResult, setShowResult] = useState([]); // Array of booleans, one per question
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [shuffledOptions, setShuffledOptions] = useState([]); // Array of arrays, one per question
  const [optionIndexMap, setOptionIndexMap] = useState([]); // Array of arrays, one per question

  // Gemini dialog state
  const [showGeminiDialog, setShowGeminiDialog] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [geminiLoading, setGeminiLoading] = useState(false);
  const [geminiError, setGeminiError] = useState('');
  const [geminiResponse, setGeminiResponse] = useState('');
  const [awaitingApiKey, setAwaitingApiKey] = useState(false);

  // Restore state from localStorage on mount (after questions are loaded)
  useEffect(() => {
    if (!filepath) return;
    // Ensure only one slash between base and path
    const url = process.env.PUBLIC_URL.replace(/\/$/, '') + '/' + filepath.replace(/^\//, '');
    fetch(url)
      .then(response => {
        if (!response.ok) throw new Error('File not found');
        return response.json();
      })
      .then(data => {
        setQuestions(data);
      })
      .catch(error => {
        console.error('Error loading questions:', error);
      });
  }, [filepath]);

  // Restore quiz state from localStorage after questions are loaded, or shuffle if not present
  useEffect(() => {
    if (questions.length === 0) return;
    const saved = localStorage.getItem(storageKey);
    // Prepare defaults for shuffling
    const defaultShuffledOptions = [];
    const defaultOptionIndexMap = [];
    for (let i = 0; i < questions.length; i++) {
      const shuffled = shuffleArrayWithMapping(questions[i].options);
      defaultShuffledOptions.push(shuffled.map(obj => obj.item));
      defaultOptionIndexMap.push(shuffled.map(obj => obj.originalIndex));
    }
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        let restoredIndex = typeof parsed.currentQuestionIndex === 'number' && parsed.currentQuestionIndex < questions.length
          ? parsed.currentQuestionIndex
          : 0;
        setCurrentQuestionIndex(restoredIndex);
        setSelectedOptions(isValidArray(parsed.selectedOptions, questions.length) ? parsed.selectedOptions : Array(questions.length).fill([]));
        setShowResult(isValidArray(parsed.showResult, questions.length) ? parsed.showResult : Array(questions.length).fill(false));
        setOptionIndexMap(isValidArray(parsed.optionIndexMap, questions.length) ? parsed.optionIndexMap : defaultOptionIndexMap);
        setShuffledOptions(isValidArray(parsed.shuffledOptions, questions.length) ? parsed.shuffledOptions : defaultShuffledOptions);
        setScore(typeof parsed.score === 'number' ? parsed.score : 0);
      } catch (e) {
        setSelectedOptions(Array(questions.length).fill([]));
        setShowResult(Array(questions.length).fill(false));
        setOptionIndexMap(defaultOptionIndexMap);
        setShuffledOptions(defaultShuffledOptions);
        setScore(0);
      }
    } else {
      setSelectedOptions(Array(questions.length).fill([]));
      setShowResult(Array(questions.length).fill(false));
      setOptionIndexMap(defaultOptionIndexMap);
      setShuffledOptions(defaultShuffledOptions);
      setScore(0);
    }
  }, [questions]);

  // Save progress to localStorage whenever currentQuestionIndex or selectedOptions changes
  useEffect(() => {
    if (
      questions.length === 0 ||
      !isValidArray(selectedOptions, questions.length) ||
      !isValidArray(showResult, questions.length) ||
      !isValidArray(optionIndexMap, questions.length) ||
      !isValidArray(shuffledOptions, questions.length)
    ) return;
    const stateToSave = {
      currentQuestionIndex,
      selectedOptions,
      showResult,
      optionIndexMap,
      shuffledOptions,
      score,
    };
    localStorage.setItem(storageKey, JSON.stringify(stateToSave));
  }, [currentQuestionIndex, selectedOptions, showResult, optionIndexMap, shuffledOptions, score, questions.length]);

  // On mount, try to load Gemini API key from localStorage
  useEffect(() => {
    const key = localStorage.getItem('geminiApiKey');
    if (key) setGeminiApiKey(key);
  }, []);

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

  // Handler for floating Gemini button
  const handleGeminiButtonClick = () => {
    setGeminiError('');
    setGeminiResponse('');
    if (!geminiApiKey) {
      setAwaitingApiKey(true);
      setShowGeminiDialog(true);
    } else {
      setAwaitingApiKey(false);
      setShowGeminiDialog(true);
      handleGeminiExplain();
    }
  };

  // Handler for API key submission
  const handleApiKeySubmit = (e) => {
    e.preventDefault();
    if (apiKeyInput.trim()) {
      localStorage.setItem('geminiApiKey', apiKeyInput.trim());
      setGeminiApiKey(apiKeyInput.trim());
      setAwaitingApiKey(false);
      setGeminiError('');
      setGeminiResponse('');
      handleGeminiExplain(apiKeyInput.trim());
    }
  };

  // Handler for Gemini API call
  const handleGeminiExplain = async (overrideKey) => {
    setGeminiLoading(true);
    setGeminiError('');
    setGeminiResponse('');
    const key = overrideKey || geminiApiKey;
    const prompt = `${currentQuestion?.question || ''}\n\nExplain this in 1 brief short sentence.`;
    try {
      // Gemini 2.0 Flash API endpoint (v1beta)
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': key,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });
      const data = await response.json();
      if (
        data &&
        data.candidates &&
        data.candidates[0] &&
        data.candidates[0].content &&
        data.candidates[0].content.parts &&
        data.candidates[0].content.parts[0] &&
        typeof data.candidates[0].content.parts[0].text === 'string'
      ) {
        setGeminiResponse(data.candidates[0].content.parts[0].text);
      } else if (data.error && data.error.message) {
        setGeminiError(data.error.message);
      } else {
        setGeminiError('Unexpected response from Gemini API.');
      }
    } catch (err) {
      setGeminiError('Failed to fetch from Gemini API.');
    } finally {
      setGeminiLoading(false);
    }
  };

  // Handler to close Gemini dialog
  const handleCloseGeminiDialog = () => {
    setShowGeminiDialog(false);
    setGeminiError('');
    setGeminiResponse('');
    setApiKeyInput('');
  };

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
  };

  // In handleNext, clear cache if moving past last question
  const handleNext = () => {
    if (currentQuestionIndex + 1 >= questions.length) {
      // Quiz is complete after this, clear cache
      localStorage.removeItem(storageKey);
    }
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

  // Remove cache clearing from render block
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
    // Quiz complete, do NOT clear localStorage here
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
    <div className="app" style={{ position: 'relative' }}>
      {/* Gemini Floating Button */}
      {questions.length > 0 && currentQuestionIndex < questions.length && (
        <div
          style={{
            position: 'fixed',
            top: 110, // adjust as needed to align with question number
            right: 32,
            zIndex: 1000,
            cursor: 'pointer',
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: '#fff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'box-shadow 0.2s',
          }}
          title="Ask Gemini to explain this question"
          onClick={handleGeminiButtonClick}
        >
          <GeminiLogo />
        </div>
      )}

      {/* Gemini Dialog */}
      {showGeminiDialog && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.35)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={handleCloseGeminiDialog}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 12,
              padding: 24,
              minWidth: 320,
              maxWidth: 480,
              boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
              position: 'relative',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
              <GeminiLogo />
              <span style={{ fontWeight: 600, fontSize: 20, marginLeft: 12 }}>Gemini Explain</span>
            </div>
            {awaitingApiKey ? (
              <form onSubmit={handleApiKeySubmit}>
                <label style={{ fontWeight: 500, marginBottom: 8, display: 'block' }}>Enter Gemini API Key:</label>
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={e => setApiKeyInput(e.target.value)}
                  style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc', marginBottom: 12 }}
                  placeholder="sk-..."
                  autoFocus
                />
                <button type="submit" style={{ padding: '8px 16px', borderRadius: 4, background: '#4285F4', color: '#fff', border: 'none', fontWeight: 600 }}>
                  Save & Continue
                </button>
              </form>
            ) : (
              <div>
                <div style={{ marginBottom: 12, color: '#333', fontSize: 16 }}>
                  <span style={{ fontWeight: 500 }}>Question:</span> {currentQuestion?.question}
                </div>
                <div style={{ minHeight: 48, marginBottom: 12 }}>
                  {geminiLoading && <span>Loading explanation...</span>}
                  {geminiError && <span style={{ color: 'red' }}>{geminiError}</span>}
                  <div style={{
                    background: '#f5f7fa',
                    color: '#222',
                    borderRadius: 6,
                    padding: '12px 14px',
                    minHeight: 32,
                    fontSize: 15,
                    border: '1px solid #e0e0e0',
                    marginTop: 4,
                    whiteSpace: 'pre-line',
                  }}>
                    {geminiResponse?.trim()
                      ? renderGeminiResponse(geminiResponse)
                      : (!geminiLoading && !geminiError && 'No explanation available.')}
                  </div>
                </div>
                <button
                  onClick={() => handleGeminiExplain()}
                  style={{ padding: '8px 16px', borderRadius: 4, background: '#4285F4', color: '#fff', border: 'none', fontWeight: 600, marginRight: 8 }}
                  disabled={geminiLoading}
                >
                  Re-Explain
                </button>
                <button
                  onClick={handleCloseGeminiDialog}
                  style={{ padding: '8px 16px', borderRadius: 4, background: '#eee', color: '#333', border: 'none', fontWeight: 600 }}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

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
            <span>Score: {score}/{currentQuestionIndex}</span>
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

function renderGeminiResponse(text) {
  // Replace **bold** with <b>bold</b>, but only for text that starts and ends with **
  // Use regex to match **...**
  const parts = [];
  let lastIndex = 0;
  const regex = /\*\*([^*]+)\*\*/g;
  let match;
  let key = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(<b key={key++}>{match[1]}</b>);
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts;
}