import React, { useState } from 'react';
import './App.css';

function App() {
  const [headline, setHeadline] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const [darkMode, setDarkMode] = useState(false);

  const analyzeHeadline = async () => {
    if (!headline.trim()) {
      setError('Please enter a headline to analyze');
      return;
    }

    setLoading(true);
    setError('');
    
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    try {
      const res = await fetch('http://localhost:5000/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ headline }),
        signal: controller.signal
      });
      
      const data = await res.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
        setHistory(prev => [{ headline, result: data, time: new Date() }, ...prev.slice(0, 9)]);
      }
    } catch (err) {
      setError('Failed to connect to server. Make sure the backend is running on port 5000.');
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981'; // green
    if (score >= 50) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Likely Credible';
    if (score >= 50) return 'Moderate Risk';
    return 'Likely Fake';
  };

  const getEmotionEmoji = (emotion) => {
    const emojis = {
      fear: '😨',
      anger: '😠',
      sadness: '😢',
      surprise: '😲',
      excitement: '🤩',
      neutral: '😐',
      joy: '😊',
      trust: '🤝',
      anticipation: '🔮'
    };
    return emojis[emotion?.toLowerCase()] || '😐';
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      analyzeHeadline();
    }
  };

  const clearHistory = () => {
    setHistory([]);
    setResult(null);
  };

  return (
    <div className={`app ${darkMode ? 'dark-mode' : ''}`}>
      <div className="container">
        <header className="header">
          <div className="logo">
            <span className="logo-icon">🔍</span>
            <h1>TruthLens</h1>
          </div>
          <p className="tagline">AI-Powered Fake News Detector</p>
          <button 
            className="theme-toggle" 
            onClick={() => setDarkMode(!darkMode)}
          >
            {darkMode ? '☀️ Light' : '🌙 Dark'}
          </button>
        </header>

        <main className="main-content">
          <section className="input-section">
            <div className="input-wrapper">
              <textarea
                type="text"
                placeholder="Paste a news headline or article title here..."
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                onKeyDown={handleKeyPress}
                className="headline-input"
                rows={3}
              />
              <button 
                className="analyze-btn"
                onClick={analyzeHeadline}
                disabled={loading}
              >
                {loading ? (
                  <span className="loading">
                    <span className="spinner"></span>
                    Analyzing...
                  </span>
                ) : (
                  <>Analyze Headline</>
                )}
              </button>
            </div>
            {error && <div className="error-message">{error}</div>}
          </section>

          {result && (
            <section className="results-section">
              <div className="score-card">
                <div 
                  className="score-circle"
                  style={{ 
                    borderColor: getScoreColor(result.credibilityScore),
                    background: `radial-gradient(circle, ${getScoreColor(result.credibilityScore)}20 0%, transparent 70%)`
                  }}
                >
                  <span 
                    className="score-value"
                    style={{ color: getScoreColor(result.credibilityScore) }}
                  >
                    {result.credibilityScore}
                  </span>
                  <span className="score-label">{getScoreLabel(result.credibilityScore)}</span>
                </div>
              </div>

              <div className="analysis-grid">
                <div className="issues-card">
                  <h3>⚠️ Issues Detected</h3>
                  {result.issues && result.issues.length > 0 ? (
                    <ul className="issues-list">
                      {result.issues.map((issue, index) => (
                        <li key={index} className="issue-item">{issue}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="no-issues">No major issues detected</p>
                  )}
                </div>

                <div className="emotions-card">
                  <h3>💭 Emotional Analysis</h3>
                  <div className="emotions-list">
                    {result.emotions && result.emotions.length > 0 ? (
                      result.emotions.map((emotion, index) => (
                        <span 
                          key={index} 
                          className="emotion-badge"
                          title={emotion}
                        >
                          {getEmotionEmoji(emotion)} {emotion}
                        </span>
                      ))
                    ) : (
                      <span className="emotion-badge neutral">
                        😐 Neutral
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="headline-display">
                <strong>Original Headline:</strong>
                <p>"{result.headline}"</p>
              </div>
            </section>
          )}

          {history.length > 0 && !result && (
            <section className="history-section">
              <div className="history-header">
                <h3>📜 Recent Analyses</h3>
                <button className="clear-btn" onClick={clearHistory}>Clear All</button>
              </div>
              <div className="history-list">
                {history.map((item, index) => (
                  <div 
                    key={index} 
                    className="history-item"
                    onClick={() => {
                      setHeadline(item.headline);
                      setResult(item.result);
                    }}
                  >
                    <span className="history-score" style={{ color: getScoreColor(item.result.credibilityScore) }}>
                      {item.result.credibilityScore}
                    </span>
                    <span className="history-headline">{item.headline}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="features-section">
            <h2>How It Works</h2>
            <div className="features-grid">
              <div className="feature-card">
                <span className="feature-icon">🎯</span>
                <h3>Clickbait Detection</h3>
                <p>Identifies sensationalist phrases and clickbait patterns commonly used in fake news</p>
              </div>
              <div className="feature-card">
                <span className="feature-icon">💭</span>
                <h3>Emotion Analysis</h3>
                <p>Detects emotional manipulation tactics like fear, anger, and surprise triggers</p>
              </div>
              <div className="feature-card">
                <span className="feature-icon">🤖</span>
                <h3>AI-Powered</h3>
                <p>Uses OpenAI GPT for advanced analysis when API key is configured</p>
              </div>
              <div className="feature-card">
                <span className="feature-icon">📊</span>
                <h3>Credibility Score</h3>
                <p>Provides a clear 0-100 score to help you assess headline reliability</p>
              </div>
            </div>
          </section>
        </main>

        <footer className="footer">
          <p>TruthLens - Fighting misinformation with AI</p>
          <p className="disclaimer">
            This tool provides automated analysis and should be used as one of many resources 
            when evaluating news credibility.
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
