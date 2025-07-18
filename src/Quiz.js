import React, { useState, useEffect, useRef } from 'react';
import './App.css';

// Gemini logo using the SVG from public/images/gemini-icon.svg
const GeminiLogo = () => (
  <img src="/images/gemini-icon.svg" alt="Gemini Logo" width={28} height={28} style={{ display: 'block' }} />
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

  // Draggable Gemini bubble state
  const [bubblePos, setBubblePos] = useState({ top: 110, left: null, right: 32 });
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const bubbleRef = useRef(null);
  const dragMoved = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const DRAG_THRESHOLD = 5; // px

  // Helper for spinner gradient
  const spinnerGradientId = 'gemini-spinner-gradient';

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

  // Handle drag start
  const handleBubbleMouseDown = (e) => {
    e.preventDefault();
    setDragging(true);
    dragMoved.current = false;
    const rect = bubbleRef.current.getBoundingClientRect();
    const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
    setDragOffset({
      x: clientX - rect.left,
      y: clientY - rect.top,
    });
    dragStartPos.current = { x: clientX, y: clientY };
  };

  // Handle drag move
  useEffect(() => {
    if (!dragging) return;
    const handleMove = (e) => {
      let clientX, clientY;
      if (e.type.startsWith('touch')) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      // Only set dragMoved if moved more than threshold
      if (!dragMoved.current) {
        const dx = clientX - dragStartPos.current.x;
        const dy = clientY - dragStartPos.current.y;
        if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
          dragMoved.current = true;
        }
      }
      const newLeft = clientX - dragOffset.x;
      const newTop = clientY - dragOffset.y;
      setBubblePos({ top: Math.max(0, newTop), left: Math.max(0, newLeft), right: null });
    };
    const handleUp = () => setDragging(false);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };
  }, [dragging, dragOffset]);

  // Only trigger click if not dragged
  const handleBubbleClick = (e) => {
    if (dragMoved.current) {
      dragMoved.current = false;
      return;
    }
    handleGeminiButtonClick(e);
  };

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
    const optionsText = currentShuffledOptions
      .map((opt, idx) => `${String.fromCharCode(65 + idx)}. ${opt}`)
      .join('\n');
    const explainQuestionPrompt = 'Explain the question in a brief sentence.';
    const explainOptionsPrompt = 'For each option, explain in a short brief sentence why it is correct or incorrect.';
    try {
      // Gemini 2.0 Flash API endpoint (v1beta)
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': key,
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: currentQuestion?.question || '' },
              { text: explainQuestionPrompt },
              { text: 'Options:' },
              { text: optionsText },
              { text: explainOptionsPrompt },
            ]
          }]
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
      {/* Gemini Floating Button (Draggable) */}
      {questions.length > 0 && currentQuestionIndex < questions.length && (
        <div
          ref={bubbleRef}
          style={{
            position: 'fixed',
            top: bubblePos.top,
            left: bubblePos.left !== null ? bubblePos.left : 'auto',
            right: bubblePos.right !== null ? bubblePos.right : 'auto',
            zIndex: 1000,
            cursor: dragging ? 'grabbing' : 'grab',
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: '#fff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: dragging ? 'none' : 'box-shadow 0.2s',
            opacity: dragging ? 0.85 : 1,
            userSelect: 'none',
          }}
          title="Ask Gemini to explain this question"
          onClick={handleBubbleClick}
          onMouseDown={handleBubbleMouseDown}
          onTouchStart={handleBubbleMouseDown}
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
            background: 'rgba(15, 15, 35, 0.85)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={handleCloseGeminiDialog}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, #18182f 0%, #23234a 100%)',
              borderRadius: 18,
              padding: 32,
              minWidth: 340,
              maxWidth: 500,
              boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
              position: 'relative',
              border: '1.5px solid #23234a',
              maxHeight: '80vh',
              overflow: 'auto',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 18 }}>
              <GeminiLogo />
              <span style={{ fontWeight: 700, fontSize: 22, marginLeft: 14, color: '#64ffda', letterSpacing: 1 }}>Gemini Explain</span>
            </div>
            {awaitingApiKey ? (
              <form onSubmit={handleApiKeySubmit} style={{ display: 'flex', flexDirection: 'column', height: 220, justifyContent: 'space-between' }}>
                <div>
                  <label style={{ fontWeight: 500, marginBottom: 8, display: 'block', color: '#64ffda', fontSize: 15 }}>Enter Gemini API Key:</label>
                  <div style={{ fontSize: 14, color: '#b0b0c3', marginBottom: 10 }}>
                    Please enter your Gemini API token. You can obtain one from the Gemini API documentation page.
                  </div>
                  <input
                    type="password"
                    value={apiKeyInput}
                    onChange={e => setApiKeyInput(e.target.value)}
                    style={{
                      width: '100%',
                      padding: 10,
                      borderRadius: 6,
                      border: '1.5px solid #23234a',
                      marginBottom: 16,
                      background: '#23234a',
                      color: '#fff',
                      fontSize: 15,
                    }}
                    placeholder="Enter API Key"
                    autoFocus
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'row', gap: 12, justifyContent: 'flex-end', marginTop: 12 }}>
                  <button
                    type="button"
                    style={{
                      padding: '10px 24px',
                      borderRadius: 8,
                      background: 'transparent',
                      color: '#64ffda',
                      border: '2px solid',
                      borderImage: 'linear-gradient(135deg, #64ffda, #00d4ff) 1',
                      fontWeight: 700,
                      fontSize: 16,
                      letterSpacing: 0.5,
                      boxShadow: '0 2px 8px rgba(100,255,218,0.08)',
                      transition: 'background 0.2s, color 0.2s, box-shadow 0.2s',
                      cursor: 'pointer',
                      height: 48,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    onMouseOver={e => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #23234a 0%, #18182f 100%)';
                      e.currentTarget.style.color = '#00d4ff';
                    }}
                    onMouseOut={e => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#64ffda';
                    }}
                    onClick={() => window.open('https://aistudio.google.com/app/apikey', '_blank', 'noopener noreferrer')}
                  >
                    Get API Key
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 20 20"
                      fill="none"
                      style={{ marginLeft: 6, display: 'inline-block', verticalAlign: 'middle' }}
                    >
                      <path d="M7 13L17 3M17 3H10M17 3V10" stroke="#64ffda" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: '10px 24px',
                      borderRadius: 8,
                      background: 'linear-gradient(135deg, #64ffda, #00d4ff)',
                      color: '#18182f',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: 16,
                      letterSpacing: 0.5,
                      boxShadow: '0 2px 12px rgba(100,255,218,0.18)',
                      transition: 'background 0.2s, color 0.2s, box-shadow 0.2s',
                      cursor: 'pointer',
                      height: 48,
                    }}
                    onMouseOver={e => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #00d4ff, #64ffda)';
                      e.currentTarget.style.color = '#18182f';
                    }}
                    onMouseOut={e => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #64ffda, #00d4ff)';
                      e.currentTarget.style.color = '#18182f';
                    }}
                  >
                    Save
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <div style={{ marginBottom: 12, color: '#b0b0c3', fontSize: 16 }}>
                  <span style={{ fontWeight: 500, color: '#64ffda' }}>Question:</span> {currentQuestion?.question}
                </div>
                <div style={{
                  background: 'rgba(100,255,218,0.07)',
                  color: '#fff',
                  borderRadius: 8,
                  padding: '14px 16px',
                  minHeight: 32,
                  fontSize: 16,
                  border: '1.5px solid #23234a',
                  marginTop: 4,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  minHeight: 60,
                  maxHeight: '40vh',
                  overflowY: 'auto',
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                  flex: 1,
                }}>
                  {geminiLoading ? (
                    <div style={{
                      display: 'flex',
                      flex: 1,
                      minHeight: 80,
                      width: '100%',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <svg width="36" height="36" viewBox="0 0 36 36" style={{ display: 'block' }}>
                        <defs>
                          <linearGradient id={spinnerGradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#64ffda" />
                            <stop offset="100%" stopColor="#00d4ff" />
                          </linearGradient>
                        </defs>
                        <circle
                          cx="18" cy="18" r="15"
                          fill="none"
                          stroke="#23234a"
                          strokeWidth="5"
                          opacity="0.18"
                        />
                        <circle
                          cx="18" cy="18" r="15"
                          fill="none"
                          stroke={`url(#${spinnerGradientId})`}
                          strokeWidth="5"
                          strokeDasharray="80 40"
                          strokeLinecap="round"
                          style={{
                            transformOrigin: '50% 50%',
                            animation: 'spinGemini 1s linear infinite',
                          }}
                        />
                        <style>{`@keyframes spinGemini { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                      </svg>
                    </div>
                  ) : geminiResponse?.trim()
                    ? geminiResponse.trim().split(/\r?\n/).filter(Boolean).map((line, idx) => (
                        <div key={idx} style={{ marginBottom: 8, width: '100%' }}>{renderGeminiResponse(line)}</div>
                      ))
                    : (!geminiLoading && !geminiError && 'No explanation available.')}
                </div>
                <button
                  onClick={() => handleGeminiExplain()}
                 style={{
                   padding: '10px 20px',
                   borderRadius: 6,
                   background: 'linear-gradient(135deg, #64ffda, #00d4ff)',
                   color: '#18182f',
                   border: 'none',
                   fontWeight: 700,
                   fontSize: 16,
                   marginRight: 10,
                   marginTop: 16,
                   letterSpacing: 0.5,
                 }}
                  disabled={geminiLoading}
                >
                  Re-Explain
                </button>
                <button
                  onClick={handleCloseGeminiDialog}
                 style={{
                   padding: '10px 20px',
                   borderRadius: 6,
                   background: 'rgba(255,255,255,0.08)',
                   color: '#fff',
                   border: '1.5px solid #23234a',
                   fontWeight: 700,
                   fontSize: 16,
                   marginTop: 16,
                   letterSpacing: 0.5,
                 }}
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