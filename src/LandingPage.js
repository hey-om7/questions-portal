import React, { useState } from 'react';
import './LandingPage.css';

function LandingPage({ onStartQuiz }) {
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [selectedCert, setSelectedCert] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const certifications = [
    {
      id: 'dva-c02',
      name: 'AWS DVA-C02',
      fullName: 'AWS Certified Developer - Associate',
      // description: 'Validate your expertise in developing and maintaining applications on the AWS platform.',
      icon: '🚀',
      color: '#64ffda',
      available: true,
      external: 'https://github.com/Ditectrev/Amazon-Web-Services-AWS-Developer-Associate-DVA-C02-Practice-Tests-Exams-Questions-Answers/blob/main/README.md'
    },
    {
      id: 'saa-c03',
      name: 'AWS SAA-C03',
      fullName: 'AWS Certified Solutions Architect - Associate',
      // description: 'Demonstrate your ability to design distributed systems on AWS.',
      icon: '🏗️',
      color: '#00d4ff',
      available: false,
      external: null
    },
    {
      id: 'soa-c02',
      name: 'AWS SOA-C02',
      fullName: 'AWS Certified SysOps Administrator - Associate',
      // description: 'Show your expertise in deploying, managing, and operating workloads on AWS.',
      icon: '⚙️',
      color: '#ff6b6b',
      available: false,
      external: null
    },
    {
      id: 'clf-c02',
      name: 'AWS CLF-C02',
      fullName: 'AWS Certified Cloud Practitioner',
      // description: 'Build your AWS Cloud knowledge and validate your foundational understanding.',
      icon: '☁️',
      color: '#4ecdc4',
      available: false,
      external: null
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
      onStartQuiz(cert.id);
    } else {
      setSelectedCert(cert);
      setShowComingSoon(true);
    }
  };

  const handleCloseComingSoon = () => {
    setShowComingSoon(false);
    setSelectedCert(null);
  };

  return (
    <div className="landing-page">
      <div className="landing-container">
        {/* Header */}
        <div className="landing-header">
          <div className="logo-section">
            <img src="/logo512.png" alt="MockTest Logo" className="logo-icon" />
            <h1 className="logo-text">MockTest</h1>
          </div>
          <p className="tagline">Master AWS certifications with interactive practice tests on MockTest</p>
        </div>

        {/* Main Content */}
        <div className="main-content">
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

          {/* Features Section */}
          <div className="features-section">
            <h3 className="features-title">Why Choose MockTest?</h3>
            <div className="features-grid">
              <div className="feature-item">
                <div className="feature-icon">📚</div>
                <h4>Comprehensive Coverage</h4>
                <p>Questions cover all exam objectives and domains</p>
              </div>
              <div className="feature-item">
                <div className="feature-icon">🎯</div>
                <h4>Real Exam Format</h4>
                <p>Practice with questions that mirror the actual exam</p>
              </div>
              <div className="feature-item">
                <div className="feature-icon">📊</div>
                <h4>Detailed Analytics</h4>
                <p>Track your progress and identify weak areas</p>
              </div>
              <div className="feature-item">
                <div className="feature-icon">🔄</div>
                <h4>Unlimited Practice</h4>
                <p>Take tests as many times as you need</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="landing-footer">
          <p>Ready to ace your AWS certification? Choose a path and start practicing today with MockTest!</p>
        </div>
      </div>

      {/* Coming Soon Modal */}
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
    </div>
  );
}

export default LandingPage; 