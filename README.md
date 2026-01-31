# Your-Edu-Interativo 🚀

An interactive educational platform powered by AI that transforms videos into gamified learning experiences.

## 🏗️ Monorepo Structure

```
your-edu-interativo/
├── apps/
│   ├── web/          # React + Vite frontend
│   └── api/          # FastAPI backend
├── scripts/
│   └── dev.sh        # Development startup script
└── package.json      # Root orchestration
```

## ✨ Features

- 📹 **Video Analysis**: Upload local videos or use YouTube URLs
- 🎯 **AI-Generated Challenges**: Gemini AI creates educational quizzes and code exercises
- 🎮 **Gamification**: XP system, levels, and progress tracking
- 🔒 **Secure**: API keys never exposed to frontend
- ⚡ **Modern Stack**: React 19, FastAPI, TypeScript, Python 3.11+

## 🛠️ Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.11+ and pip
- **Gemini API Key** from [Google AI Studio](https://aistudio.google.com/app/apikey)

## 🚀 Quick Start

### 1. Clone and Install

```bash
cd your-edu-interativo

# Install all dependencies (root, web, and api)
npm install
cd apps/web && npm install && cd ../..
```

### 2. Configure Environment

Create `.env` file in the root directory:

```bash
# .env
GEMINI_API_KEY=your_gemini_api_key_here
API_PORT=8000
CORS_ORIGINS=http://localhost:5173,http://localhost:5174
```

### 3. Setup Python Environment

```bash
cd apps/api
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ../..
```

### 4. Run Development Servers

**Option A - Automated (Linux/Mac):**
```bash
./scripts/dev.sh
```

**Option B - Manual:**
```bash
# Terminal 1 - Backend
cd apps/api
source venv/bin/activate
python -m uvicorn main:app --reload --port 8000

# Terminal 2 - Frontend
cd apps/web
npm run dev
```

### 5. Open Your Browser

- **Frontend**: http://localhost:5173
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/api/health

## 📁 Project Structure

### Frontend (`apps/web/`)
```
web/
├── components/
│   ├── ChallengeOverlay.tsx  # Quiz/Code challenge UI
│   └── XPBar.tsx             # Gamification progress bar
├── services/
│   ├── apiClient.ts          # HTTP client for backend
│   ├── geminiService.ts      # Video analysis (calls backend)
│   └── youtubeService.ts     # YouTube URL parsing
├── views/
│   └── Home.tsx              # Landing page
└── App.tsx                   # Main application
```

### Backend (`apps/api/`)
```
api/
├── routers/
│   ├── challenges.py         # Challenge generation endpoints
│   └── youtube.py            # YouTube parsing endpoints
├── services/
│   └── gemini_service.py     # Gemini AI integration
├── schemas/
│   ├── challenges.py         # Pydantic models for challenges
│   └── youtube.py            # Pydantic models for YouTube
└── main.py                   # FastAPI application
```

## 🔌 API Endpoints

### Health
- `GET /api/health` - Server health check

### YouTube
- `POST /api/youtube/parse` - Extract video/playlist ID from URL
- `GET /api/youtube/oembed` - Fetch video metadata

### Challenges
- `POST /api/challenges/generate` - Generate challenges from uploaded video

## 🎮 How It Works

1. **Upload Video**: Choose a local video file or paste a YouTube URL
2. **AI Analysis**: Gemini AI analyzes the content (backend-side)
3. **Challenges Generated**: Quiz questions and code exercises are created
4. **Interactive Learning**: Challenges appear at specific timestamps during playback
5. **Earn XP**: Correct answers grant experience points and level-ups

## 🔐 Security

- ✅ Gemini API key stored server-side only (`.env`)
- ✅ No API calls from browser to external services
- ✅ CORS configured for localhost development
- ✅ Input validation with Pydantic schemas

## 🧪 Testing

### Backend
```bash
cd apps/api
source venv/bin/activate
curl http://localhost:8000/api/health
```

### Frontend
```bash
cd apps/web
npm run build  # Test production build
npm run preview
```

## 📦 Build for Production

```bash
# Build frontend
cd apps/web
npm run build

# Backend runs with uvicorn (no build needed)
cd ../api
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000
```

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 8000 (backend)
lsof -ti:8000 | xargs kill -9

# Kill process on port 5173 (frontend)
lsof -ti:5173 | xargs kill -9
```

### Python Module Not Found
```bash
cd apps/api
source venv/bin/activate
pip install -r requirements.txt
```

### CORS Errors
Ensure `.env` has correct CORS_ORIGINS and backend is running on port 8000.

## 📄 License

MIT

## 🤝 Contributing

This is an educational project. Feel free to fork and experiment!

---

**Powered by Gemini 2.5 Flash & Next-Gen UI** 🌟
