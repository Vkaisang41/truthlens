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
  'will blow your mind', 'breaking', 'exclusive',
  'urgent', 'warned', 'exposed', 'scandal', 'lie',
  'fake', 'false', 'hoax', 'conspiracy', 'cover-up',
  'they don\'t want you to know', 'censored', 'hidden',
  'shocking truth', 'you need to see this', 'click here',
  'act now', 'limited time', 'don\'t miss', 'final warning',
  'dead', 'died', 'killed', 'murder', 'missing'
];

// Emotional manipulation triggers
const EMOTIONAL_TRIGGERS = {
  fear: ['hide', 'danger', 'warning', 'threat', 'scary', 'terrifying', 'dead', 'died', 'killed', 'murder', 'warning', 'alert', 'urgent', 'emergency', 'crisis', 'risk', 'fatal'],
  anger: ['outrage', 'furious', 'angry', 'hate', 'despise', 'war', 'attack', 'enemy', 'traitor'],
  sadness: ['tragic', 'devastating', 'heartbreaking', 'tragedy', 'suffer', 'victim', 'tragedy'],
  surprise: ['shocked', 'unexpected', 'sudden', 'bombshell', 'breaking', 'just in'],
  excitement: ['amazing', 'incredible', 'fantastic', 'wonderful', 'breakthrough', 'revolutionary']
};

// Analyze headline for basic patterns
function analyzeHeadlineBasic(headline) {
  const issues = [];
  const emotions = [];
  const proof = []; // Detailed proof for each issue
  const lowerHeadline = headline.toLowerCase();
  
  // Check for clickbait words
  CLICKBAIT_WORDS.forEach(word => {
    if (lowerHeadline.includes(word)) {
      issues.push(`Clickbait phrase detected: "${word}"`);
      proof.push({
        type: 'clickbait',
        issue: `Clickbait word: "${word}"`,
        explanation: `The word "${word}" is commonly used in sensationalist or misleading headlines to attract clicks. Legitimate news rarely uses such words.`,
        severity: 'high'
      });
    }
  });
  
  // Check for emotional manipulation
  Object.entries(EMOTIONAL_TRIGGERS).forEach(([emotion, triggers]) => {
    triggers.forEach(trigger => {
      if (lowerHeadline.includes(trigger)) {
        emotions.push(emotion);
        issues.push(`Emotional manipulation: ${emotion} (trigger: "${trigger}")`);
        proof.push({
          type: 'emotional',
          issue: `Emotional trigger: ${emotion}`,
          explanation: `The word "${trigger}" triggers ${emotion} emotions. Fake news often uses emotional words to manipulate readers into sharing without verifying.`,
          severity: 'high'
        });
      }
    });
  });
  
  // Check for lack of source
  const hasSource = headline.match(/\b(according to|reported|study|research|official|from|by|said|says|announced|confirmed|published|journal|university|college)\b/i);
  if (!hasSource) {
    issues.push("No credible source cited");
    proof.push({
      type: 'source',
      issue: 'Missing source attribution',
      explanation: 'This headline does not cite any credible source like a study, official statement, or recognized news outlet. Without a source, the information cannot be verified.',
      severity: 'high'
    });
  }
  
  // Check for all caps (sensationalism)
  if (headline === headline.toUpperCase() && headline.length > 10) {
    issues.push("Sensationalist capitalization detected");
    proof.push({
      type: 'formatting',
      issue: 'ALL CAPS usage',
      explanation: 'Using all capital letters is a common tactic in fake news to create urgency and excitement. Professional news outlets rarely use this format.',
      severity: 'medium'
    });
  }
  
  // Check for excessive punctuation
  if (headline.match(/[!]{2,}|[?]{2,}|[...]{2,}/)) {
    issues.push("Excessive punctuation detected");
    proof.push({
      type: 'formatting',
      issue: 'Excessive punctuation',
      explanation: 'Multiple exclamation marks or question marks are clickbait tactics to create false urgency. Legitimate news uses standard punctuation.',
      severity: 'medium'
    });
  }
  
  // Check for question marks in suspicious contexts
  if (headline.includes('?') && lowerHeadline.includes('you')) {
    issues.push("Leading question detected - common in clickbait");
    proof.push({
      type: 'clickbait',
      issue: 'Leading question format',
      explanation: 'Questions like "You won\'t believe..." or "What happened next?" are designed to spark curiosity and encourage clicking without providing real information.',
      severity: 'medium'
    });
  }
  
  // Check for absolute words
  const absoluteWords = ['always', 'never', 'everyone', 'nobody', 'all', 'none', '100%', 'guaranteed'];
  absoluteWords.forEach(word => {
    if (lowerHeadline.includes(word)) {
      issues.push(`Absolute word detected: "${word}" - often indicates unreliable content`);
      proof.push({
        type: 'language',
        issue: `Absolute claim: "${word}"`,
        explanation: `The word "${word}" makes an absolute claim. In reality, very few things are always true or never true. Such words often indicate misinformation.`,
        severity: 'medium'
      });
    }
  });
  
  // Check for URL/links in headline (if present)
  if (lowerHeadline.includes('http') || lowerHeadline.includes('www.')) {
    proof.push({
      type: 'formatting',
      issue: 'URL in headline',
      explanation: 'Headlines should summarize news, not include raw URLs. This is common in spam and fake news.',
      severity: 'low'
    });
  }
  
  // Check for unverified claims
  const unverifiedClaims = ['exposed', 'leaked', 'secret', 'undercover', 'revealed truth', 'conspiracy'];
  unverifiedClaims.forEach(word => {
    if (lowerHeadline.includes(word)) {
      issues.push(`Unverified claim: "${word}"`);
      proof.push({
        type: 'claim',
        issue: `Unverified claim: "${word}"`,
        explanation: `Claims about "exposed", "leaked", or "secret" information are often fabricated. Real whistleblowers go through proper channels.`,
        severity: 'high'
      });
    }
  });
  
  return { issues, emotions, proof };
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
    const { issues: basicIssues, emotions: basicEmotions, proof: basicProof } = analyzeHeadlineBasic(headline);
    
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
      // Use basic analysis only - more strict scoring
      const issueCount = basicIssues.length;
      if (issueCount === 0) {
        // No issues detected - but verify if headline looks trustworthy
        if (headline.match(/\b(study|research|university|scientist|according to|official|published)\b/i)) {
          credibilityScore = 85; // Likely credible with source
        } else if (headline.length < 20) {
          credibilityScore = 60; // Too short to verify
        } else {
          credibilityScore = 50; // Neutral - no issues but no source either
        }
      } else if (issueCount === 1) {
        credibilityScore = 55;
      } else if (issueCount === 2) {
        credibilityScore = 40;
      } else if (issueCount === 3) {
        credibilityScore = 25;
      } else {
        credibilityScore = 15;
      }
      issues = basicIssues;
      emotions = basicEmotions.length > 0 ? basicEmotions : ["neutral"];
    }
    
    // Ensure score is within bounds
    credibilityScore = Math.max(0, Math.min(100, credibilityScore));
    
    // Get detailed proof
    let detailedProof = basicProof || [];
    
    // Add AI proof if available
    if (aiAnalysis && aiAnalysis.proof) {
      detailedProof = [...detailedProof, ...aiAnalysis.proof];
    }
    
    const result = {
      credibilityScore,
      issues,
      emotions,
      proof: detailedProof,
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

// AI Chatbot endpoint
app.post("/chat", async (req, res) => {
  const { message } = req.body;
  
  if (!message || message.trim() === "") {
    return res.status(400).json({ error: "Message is required" });
  }
  
  console.log(`Chat message: ${message}`);
  
  try {
    // If OpenAI is configured, use it for smart responses
    if (openai && process.env.OPENAI_API_KEY) {
      const response = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are TruthLens AI Assistant, a helpful chatbot for the TruthLens fake news detector app. 
You help users understand how to use the app, explain how fake news detection works, and answer questions about news credibility.

Key features of TruthLens:
- Analyzes headlines for clickbait patterns
- Detects emotional manipulation
- Uses AI (GPT) for advanced analysis when API key is configured
- Provides a credibility score from 0-100
- Shows issues detected and emotions found

Keep responses friendly, helpful, and concise. Maximum 2-3 sentences.`
          },
          {
            role: "user",
            content: message
          }
        ],
        temperature: 0.7,
        max_tokens: 300
      });
      
      const reply = response.data.choices[0].message.content;
      res.json({ reply, timestamp: new Date().toISOString() });
    } else {
      // Fallback responses without OpenAI
      const lowerMessage = message.toLowerCase();
      let reply = "";
      
      if (lowerMessage.includes("how") && (lowerMessage.includes("use") || lowerMessage.includes("work"))) {
        reply = "Simply paste any news headline or article title in the input box and click 'Analyze Headline'. You'll get a credibility score from 0-100 and details about any issues detected!";
      } else if (lowerMessage.includes("score") || lowerMessage.includes("credibility")) {
        reply = "The credibility score ranges from 0-100. Scores 80-100 mean the headline is likely credible, 50-79 is moderate risk, and 0-49 means it's likely fake or clickbait.";
      } else if (lowerMessage.includes("what") && lowerMessage.includes("fake") || lowerMessage.includes("detect")) {
        reply = "TruthLens detects clickbait phrases, emotional manipulation (fear, anger, surprise), sensationalist language, and lack of credible sources in headlines.";
      } else if (lowerMessage.includes("hello") || lowerMessage.includes("hi") || lowerMessage.includes("hey")) {
        reply = "Hello! I'm the TruthLens AI Assistant. Ask me anything about how to use the app or how fake news detection works!";
      } else if (lowerMessage.includes("thank")) {
        reply = "You're welcome! Feel free to ask if you have any more questions about using TruthLens.";
      } else {
        reply = "I'm here to help! You can ask me things like 'How do I use this app?' or 'What does the credibility score mean?' to learn more about TruthLens.";
      }
      
      res.json({ reply, timestamp: new Date().toISOString() });
    }
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ error: "Chat failed. Please try again." });
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
