import React, { useState, useRef } from 'react';
import './LandingPage.css';

function LandingPage({ onStartQuiz , onStartQuizWithFilepath}) {
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [selectedCert, setSelectedCert] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const mainContentRef = useRef(null);

  const certifications = [
    {
      id: 'dva-c02',
      name: 'AWS DVA-C02',
      fullName: 'AWS Certified Developer - Associate',
      icon: '🚀',
      color: '#64ffda',
      available: true,
      external: 'https://github.com/Ditectrev/Amazon-Web-Services-AWS-Developer-Associate-DVA-C02-Practice-Tests-Exams-Questions-Answers/blob/main/README.md',
      filepath: '/resource/dva-c02/dva-c02-0.json',
    },
    {
      id: 'dva-c02-practice1',
      name: 'AWS DVA-C02 P1',
      fullName: 'AWS Certified Developer - Associate',
      icon: '🏗️',
      color: '#00d4ff',
      available: true,
      external: null,
      filepath: '/resource/dva-c02/dva-c02-1.json',
    },
    {
      id: 'dva-c02-practice2',
      name: 'AWS DVA-C02 P2',
      fullName: 'AWS Certified SysOps Administrator - Associate',
      icon: '⚙️',
      color: '#ff6b6b',
      available: true,
      external: null,
      filepath: '/resource/dva-c02/dva-c02-2.json',
    },
    {
      id: 'dva-c02-practice3',
      name: 'AWS DVA-C02 P3',
      fullName: 'AWS Certified Cloud Practitioner',
      icon: '☁️',
      color: '#4ecdc4',
      available: true,
      external: null,
      filepath: '/resource/dva-c02/dva-c02-3.json',
    },
    {
      id: 'dva-c02-practice4',
      name: 'AWS DVA-C02 P4',
      fullName: 'AWS Certified Cloud Practitioner',
      icon: '🖌️',
      color: '#F6D6AD',
      available: true,
      external: null,
      filepath: '/resource/dva-c02/dva-c02-4.json',
    },
    {
      id: 'dva-c02-practice5',
      name: 'AWS DVA-C02 P5',
      fullName: 'AWS Certified Cloud Practitioner',
      icon: '✏️',
      color: '#C3DDFD',
      available: true,
      external: null,
      filepath: '/resource/dva-c02/dva-c02-5.json',
    },
    {
      id: 'dva-c02-practice6',
      name: 'AWS DVA-C02 P6',
      fullName: 'AWS Certified Cloud Practitioner',
      icon: '🐝',
      color: '#FFAAA5',
      available: true,
      external: null,
      filepath: '/resource/dva-c02/dva-c02-6.json',
    }

  ];

  // Filter certifications by search query
  const filteredCertifications = certifications.filter(cert => {
    const q = searchQuery.trim().toLowerCase();
    return (
      cert.name.toLowerCase().includes(q) ||
      cert.fullName.toLowerCase().includes(q)
    );
  });

  const handleCertificationClick = (cert) => {
    if (cert.available) {
      // Clear quiz cache for this certification before starting
      localStorage.removeItem('quizState_' + cert.id);
      onStartQuiz(cert.id, cert.filepath); 
    } else {
      setSelectedCert(cert);
      setShowComingSoon(true);
    }
  };

  const handleCloseComingSoon = () => {
    setShowComingSoon(false);
    setSelectedCert(null);
  };

  const handleTakeTestClick = () => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="landing-page">
      <div className="split-layout-wrapper">
        <div className="split-layout">
          {/* Left Section: Logo and App Name */}
          <div className="left-section">
            <div className="logo-app-container">
              <img src="/logo512.png" alt="MockTest Logo" className="logo-icon large" />
              <h1 className="logo-text large">MockTest</h1>
              <button className="take-test-btn" onClick={handleTakeTestClick}>
                <span>Take a Test Now</span>
                <span className="arrow-icon">▼</span>
              </button>
            </div>
          </div>
          {/* Right Section: Features */}
          <div className="right-section">
            <div className="features-section vertical">
              <div className="features-vertical-list">
                <div className="feature-item">
                  <div className="feature-icon">📚</div>
                  <div className="feature-text">
                    <h4>Comprehensive Coverage</h4>
                    <p>Questions cover all exam objectives and domains</p>
                  </div>
                </div>
                <div className="feature-item">
                  <div className="feature-icon">🎯</div>
                  <div className="feature-text">
                    <h4>Real Exam Format</h4>
                    <p>Practice with questions that mirror the actual exam</p>
                  </div>
                </div>
                <div className="feature-item">
                  <div className="feature-icon">📊</div>
                  <div className="feature-text">
                    <h4>Detailed Analytics</h4>
                    <p>Track your progress and identify weak areas</p>
                  </div>
                </div>
                <div className="feature-item">
                  <div className="feature-icon">🔄</div>
                  <div className="feature-text">
                    <h4>Unlimited Practice</h4>
                    <p>Take tests as many times as you need</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="floating-element"></div>
        {/* Remove the down arrow container since button is now in left section */}
      </div>
      {/* Main Content */}
      <div className="main-content" ref={mainContentRef}>
        <div className="welcome-section">
          <h2 className="welcome-title">
            Choose Your Certification Path
          </h2>
          <p className="welcome-description">
            Select a certification below to start practicing with our comprehensive MCQ tests. 
            Each test is designed to help you prepare for the real AWS certification exam.
          </p>
        </div>

        {/* Search Bar */}
        <div className="search-bar-container">
          <input
            type="text"
            className="search-bar"
            placeholder="Search certifications..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Certification Cards */}
        <div className="certifications-grid">
          {filteredCertifications.map((cert) => (
            <div 
              key={cert.id}
              className={`certification-card ${!cert.available ? 'coming-soon' : ''}`}
              onClick={() => handleCertificationClick(cert)}
              style={{ '--accent-color': cert.color }}
            >
              {/* External Link Button at Top Right */}
              {cert.external && (
                <button
                  className="external-link-btn top-right"
                  title="Go to official AWS certification page"
                  onClick={e => {
                    e.stopPropagation();
                    window.open(cert.external, '_blank', 'noopener noreferrer');
                  }}
                >
                  <span role="img" aria-label="external link">🔗</span>
                </button>
              )}
              <div className="card-header">
                <div className="cert-icon">{cert.icon}</div>
                <div className="cert-info">
                  <h3 className="cert-name">{cert.name}</h3>
                  <p className="cert-full-name">{cert.fullName}</p>
                </div>
              </div>
              {/* Removed cert-description for compactness */}
              <div className="card-footer compact-footer">
                <span className="start-text">
                  {cert.available ? 'Start Practice' : 'Coming Soon'}
                </span>
                <div className="arrow-icon">
                  {cert.available ? '→' : '⏳'}
                </div>
              </div>
              {!cert.available && (
                <div className="coming-soon-overlay">
                  <span>Coming Soon</span>
                </div>
              )}
              <div className="card-glow"></div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="landing-footer">
          <p>Ready to ace your AWS certification? Choose a path and start practicing today with MockTest!</p>
        </div>
      </div>

      {/* Coming Soon Modal (unchanged) */}
      {showComingSoon && (
        <div className="coming-soon-modal">
          <div className="coming-soon-content">
            <div className="coming-soon-header">
              <div className="coming-soon-icon">⏳</div>
              <h2>Coming Soon!</h2>
            </div>
            <div className="coming-soon-body">
              <h3>{selectedCert?.name} - {selectedCert?.fullName}</h3>
              <p>We're working hard to bring you practice tests for this certification. Stay tuned for updates on MockTest!</p>
              <div className="coming-soon-features">
                <div className="feature-preview">
                  <span className="feature-icon">📝</span>
                  <span>Comprehensive Question Bank</span>
                </div>
                <div className="feature-preview">
                  <span className="feature-icon">🎯</span>
                  <span>Exam-Style Questions</span>
                </div>
                <div className="feature-preview">
                  <span className="feature-icon">📊</span>
                  <span>Progress Tracking</span>
                </div>
              </div>
            </div>
            <button className="close-btn" onClick={handleCloseComingSoon}>
              Got it!
            </button>
          </div>
        </div>
      )}
      {/* Intellectual Property Notice */}
      <div className="ip-notice">
        We respect intellectual property rights. If you believe this content infringes on your rights, contact at heyom7@gmail.com for request removal.
      </div>
    </div>
  );
}

export default LandingPage; 