# TruthLens

AI-Powered Fake News Detector - Detect clickbait, emotional manipulation, and assess news credibility using AI/NLP.

**Developer**: Vincent Kaisang

![TruthLens](https://img.shields.io/badge/TruthLens-Fake%20News%20Detector-blue) ![React](https://img.shields.io/badge/React-19.x-blue) ![Node.js](https://img.shields.io/badge/Node.js-Express-green) ![OpenAI](https://img.shields.io/badge/OpenAI-GPT-orange)

## Features

- **Clickbait Detection** - Identifies sensationalist phrases and clickbait patterns
- **Emotion Analysis** - Detects emotional manipulation (fear, anger, surprise, etc.)
- **AI-Powered** - Uses OpenAI GPT for advanced credibility analysis
- **Credibility Score** - Clear 0-100 score with color-coded indicators
- **History** - Stores recent analyses for quick reference
- **Dark Mode** - Toggle between light and dark themes
- **Responsive** - Works on desktop and mobile

## Tech Stack

- **Frontend**: React 19, CSS
- **Backend**: Node.js, Express
- **AI**: OpenAI GPT-3.5-turbo
- **APIs**: RESTful design

## Project Structure

```
truthlens/
├── client/                 # React frontend
│   ├── src/
│   │   ├── App.js          # Main UI component
│   │   └── App.css         # Styling
│   └── package.json
├── server/                 # Node.js backend
│   ├── server.js           # Express server with /analyze endpoint
│   ├── package.json
│   └── .env                # Environment variables (API keys)
├── package.json            # Root package with scripts
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v14+)
- npm or yarn
- OpenAI API key (optional - works with basic analysis without it)

### Installation

1. **Clone or download this project**

2. **Install all dependencies:**
   ```bash
   npm run install:all
   ```

   Or install individually:
   ```bash
   # Install root dependencies
   npm install
   
   # Install server dependencies
   cd server
   npm install
   
   # Install client dependencies
   cd ../client
   npm install
   ```

### Configuration

1. **Set up OpenAI API key** (optional but recommended for AI analysis):
   
   Edit `server/.env` and add your API key:
   ```
   PORT=5000
   OPENAI_API_KEY=your_openai_api_key_here
   ```
   
   Get your API key from: https://platform.openai.com/api-keys

### Running the Application

**Start the backend server:**
```bash
# Terminal 1 - Start server
npm run server
# Or: cd server && npm start
```

**Start the frontend (in a new terminal):**
```bash
# Terminal 2 - Start client
npm run client
# Or: cd client && npm start
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

## API Endpoints

### POST /analyze

Analyzes a news headline for credibility.

**Request:**
```json
{
  "headline": "Scientists discover miracle cure doctors hide!"
}
```

**Response:**
```json
{
  "credibilityScore": 60,
  "issues": [
    "Clickbait phrase detected: miracle",
    "Emotional manipulation: fear (trigger: hide)",
    "No credible source cited"
  ],
  "emotions": ["fear", "surprise"],
  "headline": "Scientists discover miracle cure doctors hide!",
  "analyzedAt": "2024-01-15T10:30:00.000Z"
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "openaiConfigured": true
}
```

## Usage

1. Open http://localhost:3000 in your browser
2. Paste a news headline in the input field
3. Click "Analyze Headline"
4. View the credibility score and analysis results:
   - **Green (80-100)**: Likely credible
   - **Yellow (50-79)**: Moderate risk
   - **Red (0-49)**: Likely fake/clickbait

## Sample Headlines to Test

- [PASS] "Study: Regular exercise improves heart health, according to new research"
- [WARN] "Scientists discover miracle cure doctors hide!"
- [FAIL] "You won't BELIEVE what happened next! SHOCKING!"

## How It Works

### Basic Analysis (No API Key)
- Pattern matching for clickbait words
- Detection of emotional triggers
- Source citation checks
- Sensationalism detection

### AI Analysis (With OpenAI API)
- Uses GPT-3.5-turbo for advanced analysis
- Contextual understanding of headlines
- Structured JSON output parsing

## Portfolio Highlights

- [x] AI + Rule-based hybrid analysis
- [x] Emotion detection for headlines
- [x] Structured JSON backend
- [x] Full-stack React + Node app
- [x] Production-ready structure
- [x] Easy to extend

## Future Enhancements

- [ ] Browser extension for social media
- [ ] URL analysis for article sources
- [ ] Fact-check API integration
- [ ] User accounts and saved analyses
- [ ] Charts for emotional manipulation over time
- [ ] Multi-language support

## License

ISC

## Disclaimer

This tool provides automated analysis and should be used as one of many resources when evaluating news credibility. Always verify important information from multiple reputable sources.
