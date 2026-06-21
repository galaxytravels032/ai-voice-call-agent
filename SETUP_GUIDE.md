# AI Voice Call Agent - Complete Setup Guide

## 🚀 Quick Start with Docker

The fastest way to get started is using Docker Compose:

```bash
# Clone repository
git clone https://github.com/galaxytravels032/ai-voice-call-agent.git
cd ai-voice-call-agent

# Copy environment variables
cp .env.example .env

# Add your API keys to .env
# OPENAI_API_KEY=sk_your_key_here
# ELEVENLABS_API_KEY=your_key_here

# Start both frontend and backend
docker-compose up --build
```

Then visit: `http://localhost:5173`

## 🔧 Local Development Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- OpenAI API key
- Elevenlabs API key (optional, for TTS)

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your API keys
# OPENAI_API_KEY=sk_...
# ELEVENLABS_API_KEY=...

# Start development server
npm run dev
```

Backend runs on: `http://localhost:3001`
WebSocket: `ws://localhost:3001/ws/voice`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend runs on: `http://localhost:5173`

## 📱 How to Use

1. **Open the web app** at `http://localhost:5173`
2. **Click "Connect"** to connect to the voice agent
3. **Choose input method:**
   - **Voice**: Press "Start Recording" to speak, then "Stop Recording"
   - **Text**: Type a message and press "Send"
4. **Get responses**: The AI will respond with both text and audio
5. **Disconnect** when done

## 🏗️ Architecture

### Backend Flow
```
User Audio
    ↓
WebSocket Server
    ↓
Whisper (Transcription)
    ↓
GPT-4 (AI Response)
    ↓
Elevenlabs (Text-to-Speech)
    ↓
Response to Client
```

### Frontend Flow
```
User Audio Input
    ↓
MediaRecorder API
    ↓
WebSocket Send
    ↓
Receive AI Response
    ↓
Display & Play Audio
```

## 📚 API Endpoints

### REST API
- `GET /api/health` - Health check
- `POST /api/voice/start` - Start a call session
- `POST /api/voice/end/:callId` - End a call session
- `GET /api/voice/status/:callId` - Get call status

### WebSocket Events

**Client → Server:**
```json
// Audio data
{ "type": "audio", "data": "base64_encoded_audio" }

// Text message
{ "type": "text", "data": "user message" }

// Start call
{ "type": "start" }

// End call
{ "type": "end" }
```

**Server → Client:**
```json
// Text response
{ "type": "text", "data": "AI response" }

// Audio response
{ "type": "audio", "data": "base64_encoded_audio" }

// Error
{ "type": "error", "data": "error message" }
```

## 🔐 Environment Variables

Create `.env` file with:

```bash
# Backend
PORT=3001
NODE_ENV=development

# OpenAI
OPENAI_API_KEY=sk_your_openai_key
OPENAI_MODEL=gpt-4

# Elevenlabs (optional for TTS)
ELEVENLABS_API_KEY=your_elevenlabs_key
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM

# Frontend
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001

# Logging
LOG_LEVEL=debug
```

## 📦 Project Structure

```
ai-voice-call-agent/
├── backend/
│   ├── src/
│   │   ├── index.ts              # Main server
│   │   ├── routes/
│   │   │   ├── voice.ts          # Voice endpoints
│   │   │   └── health.ts         # Health check
│   │   ├── services/
│   │   │   ├── openai.ts         # OpenAI integration
│   │   │   └── tts.ts            # Text-to-Speech
│   │   ├── websocket/
│   │   │   └── handler.ts        # WebSocket logic
│   │   └── utils/
│   │       └── logger.ts         # Winston logger
│   ├── package.json
│   ├── tsconfig.json
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── main.tsx              # Entry point
│   │   ├── App.tsx               # Main app
│   │   ├── index.css             # Global styles
│   │   ├── components/
│   │   │   ├── VoiceAgent.tsx    # Main component
│   │   │   └── VoiceAgent.css    # Component styles
│   │   └── hooks/
│   │       └── useVoiceAgent.ts  # Voice hook
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── Dockerfile
│   └── .eslintrc.cjs
├── docker-compose.yml
├── .env.example
└── README.md
```

## 🚢 Production Deployment

### Docker Build

```bash
# Build images
docker build -t ai-voice-backend ./backend
docker build -t ai-voice-frontend ./frontend

# Run containers
docker run -p 3001:3001 --env-file .env ai-voice-backend
docker run -p 5173:5173 ai-voice-frontend
```

### Deployment Platforms

**Backend (Node.js):**
- Heroku
- Railway
- Render
- AWS EC2
- Google Cloud Run

**Frontend (React):**
- Vercel
- Netlify
- GitHub Pages
- AWS S3 + CloudFront

## 🛠️ Development Commands

### Backend
```bash
cd backend
npm run dev          # Development with hot reload
npm run build        # Build TypeScript
npm start           # Production start
npm run lint        # Run ESLint
npm run type-check  # TypeScript check
```

### Frontend
```bash
cd frontend
npm run dev         # Development server
npm run build       # Production build
npm run preview     # Preview production build
npm run lint        # Run ESLint
```

## 🐛 Troubleshooting

### Microphone not working
- Ensure HTTPS or localhost
- Check browser permissions
- Verify `getUserMedia` is supported

### WebSocket connection failed
- Check backend is running
- Verify WebSocket URL in frontend
- Check CORS configuration

### OpenAI API errors
- Verify API key is valid
- Check rate limits
- Ensure model name is correct (gpt-4)

### Audio playback not working
- Check browser audio permissions
- Verify TTS service is configured
- Check audio format compatibility

## 📈 Future Enhancements

- [ ] Call recording and playback
- [ ] Conversation history with database
- [ ] Custom AI personalities
- [ ] Multi-language support
- [ ] Real-time transcription display
- [ ] Call analytics dashboard
- [ ] Mobile app (React Native)
- [ ] Video calling support
- [ ] Advanced NLP processing
- [ ] Custom knowledge base integration

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

For issues and questions:
- Open a GitHub issue
- Check existing discussions
- Review the troubleshooting section

## 🎓 Learn More

- [OpenAI API Docs](https://platform.openai.com/docs)
- [Elevenlabs Documentation](https://elevenlabs.io/docs)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [React Documentation](https://react.dev)
- [Express.js Guide](https://expressjs.com)
