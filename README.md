# 🎯 AI Voice Call Center - Sonic 3.5

Enterprise-grade AI-powered call center platform with real-time monitoring, multi-language support, and live listening capabilities.

## ✨ Features

### Core Capabilities
- ✅ **Vapi Integration** - Advanced voice AI calling
- ✅ **LiveKit Integration** - Live listening & supervision
- ✅ **Multi-Language Support** - 10+ languages with localization
- ✅ **Real-Time Monitoring** - WebSocket-based live updates
- ✅ **Call Recording & Transcription** - Automatic documentation
- ✅ **Sentiment Analysis** - Customer emotion tracking
- ✅ **Batch Operations** - Process thousands of calls

### Support Types
- 📞 **Customer Support** - Issue resolution
- 🛍️ **Sales Calls** - Lead qualification
- 📋 **Surveys** - Feedback collection
- 📞 **Callbacks** - Automated follow-ups
- 🔧 **Custom** - Your own workflows

### Analytics & Reporting
- 📊 Real-time dashboards
- 📈 Performance metrics
- 💰 Cost tracking per minute/call
- 📱 Mobile-friendly interface
- 📁 Data export (JSON/CSV)

### Enterprise Features
- 🔐 Role-based access control
- 📞 Queue management
- 👥 Team collaboration
- 🎙️ Recording & compliance
- 🔄 Integration APIs
- ⚡ High availability

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB
- Redis
- Azure account
- Vapi API key
- LiveKit credentials

### Installation

```bash
# Clone repository
git clone https://github.com/galaxytravels032/ai-voice-call-agent.git
cd ai-voice-call-agent

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Configure environment variables
# - VAPI_API_KEY
# - LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET
# - MONGODB_URI
# - REDIS_URL

# Build TypeScript
npm run build

# Start development server
npm run dev
```

## 📖 API Documentation

### Initiate Call
```bash
POST /api/v1/calls/initiate
Content-Type: application/json

{
  "phoneNumber": "+1234567890",
  "language": "en",
  "callType": "support",
  "userId": "user123",
  "assistantId": "asst_xxx",
  "metadata": {
    "customerId": "cust_123",
    "issueType": "billing"
  }
}
```

### Batch Initiate Calls
```bash
POST /api/v1/calls/batch/initiate
Content-Type: application/json

{
  "calls": [
    {
      "phoneNumber": "+1111111111",
      "language": "en",
      "callType": "support",
      "userId": "user1",
      "assistantId": "asst_xxx"
    },
    {
      "phoneNumber": "+2222222222",
      "language": "es",
      "callType": "sales",
      "userId": "user2",
      "assistantId": "asst_yyy"
    }
  ]
}
```

### Get Call Status
```bash
GET /api/v1/calls/{callId}/status
```

### Get Call Transcript
```bash
GET /api/v1/calls/{callId}/transcript
```

### End Call
```bash
POST /api/v1/calls/{callId}/end
```

### Call History
```bash
GET /api/v1/calls/history/{userId}?limit=50&offset=0
```

### Live Listening
```bash
POST /api/v1/calls/{callId}/live-listen
Content-Type: application/json

{
  "supervisorId": "supervisor123"
}

Response:
{
  "callId": "call_xxx",
  "roomName": "call-call_xxx-room",
  "token": "jwt_token",
  "liveKitUrl": "wss://livekit.example.com"
}
```

### Dashboard Analytics
```bash
GET /api/v1/analytics/dashboard/{userId}?days=7
```

### Performance Metrics
```bash
GET /api/v1/analytics/performance/{userId}?days=30
```

### Language Analytics
```bash
GET /api/v1/analytics/languages/{userId}
```

### Export Data
```bash
GET /api/v1/analytics/export/{userId}?format=json
# Or: format=csv
```

## 🌍 Supported Languages

| Code | Language | Voice | Transcriber |
|------|----------|-------|-------------|
| en | English | Neural2-C | en-US |
| es | Spanish | Neural2-A | es-ES |
| fr | French | Neural2-A | fr-FR |
| de | German | Neural2-B | de-DE |
| it | Italian | Neural2-A | it-IT |
| pt | Portuguese | Neural2-A | pt-BR |
| ja | Japanese | Neural2-B | ja-JP |
| zh | Chinese | Neural3-A | zh-CN |
| ar | Arabic | Neural2-A | ar-XA |
| hi | Hindi | Neural2-A | hi-IN |

## 📊 Pricing Model

- **Per Minute**: $0.10/minute (configurable)
- **Per Call**: $0.50 base + per-minute charges
- **Monthly**: Enterprise custom pricing

## 🔧 Deployment

### Azure Functions
```bash
npm run deploy:azure
```

### GitHub Actions (Automated)
Push to `main` or `develop` branches to trigger deployment.

```bash
git push origin feature/sonic-3.5-call-center
```

## 🎙️ Live Monitoring Architecture

```
Agent Call (Vapi) 
    ↓
LiveKit Room 
    ↓
Supervisor WebSocket 
    ↓
Real-time Dashboard
```

## 📈 Metrics Dashboard

**Real-time Metrics:**
- Total active calls
- Average call duration
- Success rate %
- Cost per minute
- Sentiment analysis
- Language distribution
- Call type breakdown

## 🛡️ Security Features

- JWT authentication
- Role-based access control
- Encrypted call recordings
- PII redaction
- Compliance logging
- HIPAA/GDPR ready

## 📱 WebSocket Events

```javascript
// Connect to WebSocket
const socket = io('ws://localhost:3000');

// Subscribe to call
socket.emit('subscribe-call', 'call_xxx');

// Listen for updates
socket.on('live-stats', (data) => {
  console.log('Active calls:', data.activeCalls);
  console.log('Recent calls:', data.recentCalls);
});

// Subscribe to dashboard
socket.emit('subscribe-dashboard', 'user123');

socket.on('call-initiated', (data) => {
  console.log('New call:', data);
});

socket.on('call-ended', (data) => {
  console.log('Call ended:', data);
});
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- CallService.test.ts
```

## 📝 Logging

```bash
# View logs
npm run dev -- --log-level=debug

# Tail production logs
# (Configure based on Azure setup)
```

## 🔄 Update Script (Minimal Call Duration)

The system automatically:
- ⏱️ Tracks call duration from initiation to completion
- 📊 Records metrics every call
- 🔄 Updates cost calculations hourly
- 📈 Aggregates daily statistics
- 🧹 Cleans old logs monthly

**Scheduled Tasks:**
- Every hour: Update call costs
- Every 6 hours: Aggregate metrics
- Daily midnight: Calculate daily reports
- Monthly: Cleanup old data

## 🤝 Integration Examples

### Make.com Integration
```javascript
// Trigger call from Make.com webhook
const response = await fetch('http://your-domain/api/v1/calls/initiate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phoneNumber: data.phone,
    language: data.language,
    callType: 'support',
    userId: data.userId,
    assistantId: process.env.VAPI_ASSISTANT_ID
  })
});
```

### Stripe Payment Integration
```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Charge customer after call
const charge = await stripe.charges.create({
  amount: totalCost * 100, // cents
  currency: 'usd',
  customer: customerId,
  description: `AI Call Center - ${callId}`
});
```

## 📞 Support

- 📧 Email: support@example.com
- 🐛 Issues: GitHub Issues
- 💬 Community: Discord/Slack

## 📄 License

MIT License - see LICENSE file

## 🙏 Acknowledgments

- Vapi for voice AI
- LiveKit for real-time communication
- MongoDB for data storage
- Azure for cloud infrastructure

---

**Version:** 3.5.0  
**Last Updated:** 2026-06-22  
**Status:** Production Ready ✅