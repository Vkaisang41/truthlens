require('dotenv').config();
const express = require("express");
const cors = require("cors");
const { Configuration, OpenAIApi } = require("openai");
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production' || process.argv.includes('--production');

// Middleware
app.use(cors());
app.use(express.json());

// OpenAI Configuration
let openai;
try {
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  openai = new OpenAIApi(configuration);
} catch (error) {
  console.log("OpenAI configuration pending - API key not set");
}

// Clickbait detection words
const CLICKBAIT_WORDS = [
  'miracle', 'shocking', 'unbelievable', 'you won\'t believe', 
  'what happened next', 'broke the internet', 'viral',
  'must-see', 'jaw-dropping', 'incredible', 'amazing',
  'this one trick', 'doctors hate', 'secret revealed',
  'will blow your mind', 'breaking', 'exclusive'
];

// Emotional manipulation triggers
const EMOTIONAL_TRIGGERS = {
  fear: ['hide', 'danger', 'warning', 'threat', 'scary', 'terrifying'],
  anger: ['outrage', 'furious', 'angry', 'hate', 'despise'],
  sadness: ['tragic', 'devastating', 'heartbreaking', 'tragedy'],
  surprise: ['shocked', 'unexpected', 'sudden', 'bombshell'],
  excitement: ['amazing', 'incredible', 'fantastic', 'wonderful']
};

// Analyze headline for basic patterns
function analyzeHeadlineBasic(headline) {
  const issues = [];
  const emotions = [];
  const lowerHeadline = headline.toLowerCase();
  
  // Check for clickbait words
  CLICKBAIT_WORDS.forEach(word => {
    if (lowerHeadline.includes(word)) {
      issues.push(`Clickbait phrase detected: "${word}"`);
    }
  });
  
  // Check for emotional manipulation
  Object.entries(EMOTIONAL_TRIGGERS).forEach(([emotion, triggers]) => {
    triggers.forEach(trigger => {
      if (lowerHeadline.includes(trigger)) {
        emotions.push(emotion);
        issues.push(`Emotional manipulation: ${emotion} (trigger: "${trigger}")`);
      }
    });
  });
  
  // Check for lack of source - only flag if other issues exist
  if (issues.length > 0 && !headline.match(/\b(according to|reported|study|research|official|from|by)\b/i)) {
    issues.push("No credible source cited");
  }
  
  // Check for all caps (sensationalism)
  if (headline === headline.toUpperCase() && headline.length > 10) {
    issues.push("Sensationalist capitalization detected");
  }
  
  // Check for excessive punctuation
  if (headline.match(/[!]{2,}|[?]{2,}|[...]{2,}/)) {
    issues.push("Excessive punctuation detected");
  }
  
  return { issues, emotions };
}

// Main analyze endpoint
app.post("/analyze", async (req, res) => {
  const { headline } = req.body;
  
  if (!headline || headline.trim() === "") {
    return res.status(400).json({ error: "Headline is required" });
  }
  
  if (headline.length > 500) {
    return res.status(400).json({ error: "Headline too long (max 500 characters)" });
  }
  
  console.log(`Analyzing headline: ${headline}`);
  
  try {
    // First do basic pattern analysis
    const { issues: basicIssues, emotions: basicEmotions } = analyzeHeadlineBasic(headline);
    
    // Try AI analysis if API key is available
    let aiAnalysis = null;
    if (openai && process.env.OPENAI_API_KEY) {
      try {
        const response = await openai.createChatCompletion({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are a fake news and clickbait detector. Analyze headlines for credibility. Return ONLY valid JSON with no markdown formatting. The JSON should have: credibilityScore (0-100 integer), issues (array of strings), emotions (array of strings)."
            },
            {
              role: "user",
              content: `Analyze this headline for fake news, clickbait, and emotional manipulation.
                      Return JSON with: credibilityScore (0-100), issues (array), emotions (array).
                      Headline: "${headline}"`
            }
          ],
          temperature: 0.3,
          max_tokens: 500
        });
        
        const content = response.data.choices[0].message.content.trim();
        // Try to parse the JSON response
        try {
          aiAnalysis = JSON.parse(content);
        } catch {
          // If JSON parsing fails, try to extract JSON from the response
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            aiAnalysis = JSON.parse(jsonMatch[0]);
          }
        }
      } catch (aiError) {
        console.log("AI analysis failed, using basic analysis only");
      }
    }
    
    // Combine results
    let credibilityScore;
    let issues;
    let emotions;
    
    if (aiAnalysis) {
      credibilityScore = aiAnalysis.credibilityScore || 50;
      issues = [...basicIssues, ...(aiAnalysis.issues || [])];
      // Remove duplicates from issues
      issues = [...new Set(issues)];
      emotions = [...new Set([...basicEmotions, ...(aiAnalysis.emotions || [])])];
    } else {
      // Use basic analysis only
      credibilityScore = basicIssues.length > 0 ? 
        Math.max(20, 80 - (basicIssues.length * 15)) : 75;
      issues = basicIssues.length > 0 ? basicIssues : ["No obvious issues detected"];
      emotions = basicEmotions.length > 0 ? basicEmotions : ["neutral"];
    }
    
    // Ensure score is within bounds
    credibilityScore = Math.max(0, Math.min(100, credibilityScore));
    
    const result = {
      credibilityScore,
      issues,
      emotions,
      headline,
      analyzedAt: new Date().toISOString()
    };
    
    console.log(`Analysis complete. Score: ${credibilityScore}`);
    res.json(result);
    
  } catch (err) {
    console.error("Analysis error:", err);
    res.status(500).json({ error: "Analysis failed. Please try again." });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ 
    status: "healthy", 
    timestamp: new Date().toISOString(),
    openaiConfigured: !!process.env.OPENAI_API_KEY
  });
});

// Serve static files in production (catch-all route)
if (isProduction) {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`TruthLens server running on port ${PORT}`);
  console.log(`OpenAI API: ${process.env.OPENAI_API_KEY ? 'Configured' : 'Not configured (using basic analysis)'}`);
});
