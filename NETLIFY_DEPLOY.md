# Netlify Configuration for TruthLens

## Option 1: Deploy Frontend Only (Recommended for Netlify)

Netlify is optimized for static sites. For this app to work on Netlify:

### Step 1: Update the API URL
The frontend needs to point to an external API. You can either:

1. **Use a separate backend** (like Render, Railway, or Heroku for the server)
2. **Use Netlify Functions** for serverless backend

### Step 2: Deploy to Netlify

1. Push your code to GitHub
2. Go to https://app.netlify.com
3. Click "Add new site" → "Import an existing project"
4. Select your GitHub repository
5. Build settings:
   - Build command: `npm run build`
   - Publish directory: `client/build`
6. Click "Deploy"

### Step 3: Set up the backend

For the API to work, you have two options:

**Option A: Use a free backend service**
- Deploy the server to Render.com (free): https://render.com
- Update the API URL in the frontend

**Option B: Use Netlify Functions**
- Create a `/netlify/functions` folder
- Move server logic to serverless functions

---

## Option 2: Deploy Full Stack with Netlify

### netlify.toml (root directory)
```toml
[build]
  command = "npm run build"
  publish = "client/build"
  functions = "netlify/functions"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```

---

## Current Status

The project is currently configured for local development with:
- Frontend: React on port 3000 (dev) / served statically in production
- Backend: Node.js Express on port 5000

To deploy to Netlify, you need to separate the backend or use external hosting.
