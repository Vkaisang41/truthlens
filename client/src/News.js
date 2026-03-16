import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './News.css';

// API URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// News categories with images (using placeholder images)
const NEWS_CATEGORIES = {
  politics: {
    title: 'Politics',
    description: 'Latest political news and analysis',
    image: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&h=400&fit=crop',
    headlines: [
      "President announces new economic policy for 2025",
      "Senate passes controversial healthcare bill",
      "Election results show unexpected turn in swing states",
      "Political scandal emerges involving senior officials",
      "New trade agreement signed between major nations",
      "Opposition party wins historic election victory",
      "Government unveils infrastructure spending plan"
    ]
  },
  football: {
    title: 'Football',
    description: 'Sports news and football updates',
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&h=400&fit=crop',
    headlines: [
      "Champions League final scheduled for June",
      "Star player transfers to rival club in record deal",
      "National team announces squad for upcoming tournament",
      "Controversial refereeing decision sparks debate",
      "Legendary coach announces retirement after successful career",
      "Underdog team shocks world with quarter-final win",
      "New stadium construction approved by council"
    ]
  },
  technology: {
    title: 'Technology',
    description: 'Tech industry news and innovations',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=400&fit=crop',
    headlines: [
      "Tech giant unveils revolutionary AI assistant",
      "Major security breach affects millions of users",
      "New smartphone features groundbreaking battery technology",
      "Startup raises billions in latest funding round",
      "Scientists develop quantum computer breakthrough",
      "Electric vehicle company announces affordable model",
      "Social media platform launches new privacy features"
    ]
  },
  business: {
    title: 'Business',
    description: 'Financial news and market updates',
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&h=400&fit=crop',
    headlines: [
      "Stock market reaches all-time high",
      "Major company announces massive layoffs",
      "Central bank adjusts interest rates",
      "Merger between industry giants approved",
      "Entrepreneur becomes youngest billionaire",
      "Cryptocurrency regains mainstream acceptance",
      "Real estate prices surge in major cities"
    ]
  },
  health: {
    title: 'Health',
    description: 'Health and medical news',
    image: 'https://images.unsplash.com/photo-1505576399279-565b52d4ac71?w=800&h=400&fit=crop',
    headlines: [
      "New study reveals benefits of daily exercise",
      "Breakthrough treatment shows promise for cancer patients",
      "Health officials warn about seasonal illness",
      "Mental health awareness campaign launches nationwide",
      "Scientists discover new vaccine for rare disease",
      "Experts recommend new dietary guidelines",
      "Hospital implements revolutionary patient care system"
    ]
  },
  entertainment: {
    title: 'Entertainment',
    description: 'Movies, music and celebrity news',
    image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&h=400&fit=crop',
    headlines: [
      "Blockbuster movie breaks box office records",
      "Award-winning singer announces world tour",
      "Streaming platform reveals hit series renewal",
      "Celebrity couple confirms relationship at event",
      "Classic band reunites for anniversary tour",
      "New streaming service launches with exclusive content",
      "Film festival announces competition lineup"
    ]
  }
};

function News({ onAnalyze }) {
  const [selectedCategory, setSelectedCategory] = useState('politics');
  const [analyzingHeadline, setAnalyzingHeadline] = useState(null);

  const analyzeHeadline = async (headline) => {
    setAnalyzingHeadline(headline);
    
    try {
      const res = await fetch(`${API_URL}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ headline })
      });
      
      const data = await res.json();
      if (onAnalyze) {
        onAnalyze(data, headline);
      } else {
        alert(`Analysis: ${data.credibilityScore}% - ${data.credibilityScore >= 80 ? 'Likely Credible' : data.credibilityScore >= 50 ? 'Moderate Risk' : 'Likely Fake'}`);
      }
    } catch (err) {
      console.error('Analysis failed:', err);
    } finally {
      setAnalyzingHeadline(null);
    }
  };

  return (
    <div className="news-page">
      <Link to="/" className="back-link">&larr; Back to Analyzer</Link>
      <div className="news-hero">
        <h1>News Categories</h1>
        <p>Browse headlines by category and analyze them for credibility</p>
      </div>

      <div className="category-grid">
        {Object.entries(NEWS_CATEGORIES).map(([key, category]) => (
          <div 
            key={key} 
            className={`category-card ${selectedCategory === key ? 'active' : ''}`}
            onClick={() => setSelectedCategory(key)}
          >
            <img src={category.image} alt={category.title} />
            <div className="category-info">
              <h3>{category.title}</h3>
              <p>{category.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="headlines-section">
        <h2>{NEWS_CATEGORIES[selectedCategory].title} Headlines</h2>
        <div className="headlines-grid">
          {NEWS_CATEGORIES[selectedCategory].headlines.map((headline, index) => (
            <div 
              key={index} 
              className="headline-card"
              onClick={() => analyzeHeadline(headline)}
            >
              <div className="headline-number">{index + 1}</div>
              <p className="headline-text">{headline}</p>
              <button 
                className="analyze-btn"
                disabled={analyzingHeadline === headline}
              >
                {analyzingHeadline === headline ? 'Analyzing...' : 'Analyze'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default News;
