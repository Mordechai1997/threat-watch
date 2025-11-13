# 🛡️ ThreatWatch Dashboard

A comprehensive IP threat intelligence dashboard that aggregates data from multiple security APIs to provide unified threat analysis.

## 📋 Table of Contents

- [About](#about)
- [Technology Stack](#technology-stack)
- [Features](#features)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [API Integration](#api-integration)
- [Architecture Decisions](#architecture-decisions)

## 🎯 About

ThreatWatch Dashboard is a full-stack application that provides real-time IP threat intelligence by aggregating data from three leading security providers:
- **AbuseIPDB** - Abuse confidence scores and reports
- **IPQualityScore** - VPN/Proxy detection and fraud scoring
- **IPAPI** - Geolocation and ISP information

> **Note on Technology Choice:**  
> Although the assignment specified React + Node.js, I implemented it in Next.js to leverage an integrated full-stack framework with API routes, simplifying deployment and reducing boilerplate.

## 🚀 Technology Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **Redux Toolkit** - State management
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling

### Backend
- **Next.js API Routes** - Backend-for-Frontend (BFF) pattern
- **Axios** - HTTP client for external APIs

### Key Libraries
- `@reduxjs/toolkit` - Redux state management
- `react-redux` - React bindings for Redux
- `axios` - Promise-based HTTP client

## ✨ Features

### Core Features
1. **IP Address Validation** - Real-time IPv4 format validation
2. **Multi-Source Data Aggregation** - Combines data from 3 threat intelligence APIs
3. **Unified Threat Display** - Shows 8 core fields:
   - IP Address
   - Hostname
   - ISP
   - Country
   - Abuse/Reputation Score
   - Total Abuse Reports
   - VPN/Proxy Detection
   - Fraud Score

### Bonus Features
4. **Risk Level Calculation** - Dynamic risk assessment (LOW/MEDIUM/HIGH)
5. **Search History** - Persistent history of last 10 lookups
6. **Rate Limit Handling** - Graceful degradation when APIs rate limit
7. **Resilient Architecture** - Works with partial data if some APIs fail

## 📦 Installation

### Prerequisites
- Node.js 18.x or higher
- npm or yarn package manager

### Steps

1. **Clone the repository**
```bash
git clone <repository-url>
cd threatwatch-dashboard
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
Create a `.env.local` file in the root directory:
```bash
cp .env.example .env.local
```

## 🔐 Environment Variables

Create a `.env.local` file with the following variables:

```env
# AbuseIPDB API Key
ABUSEIPDB_API_KEY=your_abuseipdb_api_key_here

# IPQualityScore API Key
IPQS_API_KEY=your_ipqualityscore_api_key_here

# Note: IPAPI does not require an API key for basic usage
```

### How to Get API Keys

1. **AbuseIPDB**
   - Sign up at [https://www.abuseipdb.com](https://www.abuseipdb.com)
   - Navigate to API section
   - Generate a new API key

2. **IPQualityScore**
   - Sign up at [https://www.ipqualityscore.com](https://www.ipqualityscore.com)
   - Go to API Keys section
   - Copy your private API key

## 🏃 Running the Application

### Development Mode

Start the development server:

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

### Production Build

Build and start the production server:

```bash
# Build for production
npm run build

# Start production server
npm start
```

### Other Commands

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format
```

## 📁 Project Structure

```
threatwatch-dashboard/
├── app/
│   ├── api/
│   │   └── threats/
│   │       └── route.ts          # BFF API endpoint
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
├── components/
│   ├── IpInputForm.tsx           # IP input with validation
│   ├── ThreatDataDisplay.tsx    # Main data display
│   └── SearchHistory.tsx         # History sidebar
├── redux/
│   ├── store.ts                  # Redux store configuration
│   ├── threatsSlice.ts           # Threats state slice
│   └── ReduxProvider.tsx         # Client-side provider
├── services/
│   └── threatApi.ts              # External API integrations
├── types/
│   └── threat.ts                 # TypeScript type definitions
├── utils/
│   ├── aggregator.ts             # Data aggregation logic
│   ├── validation.ts             # IP validation
│   ├── strings.ts                # Application strings
│   └── constants.ts              # Global constants
└── public/                       # Static assets
```

## 🔌 API Integration

### Backend-for-Frontend (BFF) Pattern

The application uses a BFF pattern where the Next.js API route (`/api/threats`) acts as an aggregation layer:

```
Client → Next.js API Route → [AbuseIPDB, IPQualityScore, IPAPI] → Aggregated Response
```

### API Endpoint

**GET** `/api/threats?ip={ipAddress}`

**Response:**
```json
{
  "ipAddress": "8.8.8.8",
  "hostname": "dns.google",
  "isp": "Google LLC",
  "country": "United States",
  "abuseScore": 0,
  "totalReports": 0,
  "vpnProxyDetected": false,
  "fraudScore": 0
}
```

### Error Handling

The API handles various error scenarios:
- **400** - Invalid IP format
- **429** - Rate limit exceeded
- **500** - Internal server error or all sources failed

## 🏗️ Architecture Decisions

### Why Next.js?

1. **Unified Codebase** - Frontend and backend in one project
2. **API Routes** - Built-in serverless functions for BFF pattern
3. **Type Safety** - Seamless TypeScript integration across stack
4. **Performance** - Built-in optimizations and caching
5. **Deployment** - Simple deployment to Vercel or similar platforms

### State Management

**Redux Toolkit** was chosen for:
- Centralized state management
- Built-in async thunk support
- DevTools integration
- Type-safe actions and reducers

### Data Persistence

- **localStorage** - Stores search history (last 10 lookups)
- **Client-side only** - Prevents hydration mismatches with SSR

### Risk Calculation Algorithm

Risk levels are determined by:
- **HIGH**: Abuse score ≥ 75 OR (VPN/Proxy + Fraud score ≥ 50)
- **MEDIUM**: Abuse score ≥ 30 OR Fraud score ≥ 30
- **LOW**: All other cases

## 🎨 Design Patterns

### Component Organization
- **Presentational Components** - Pure UI rendering
- **Container Components** - Connect to Redux state
- **Custom Hooks** - Reusable logic (`useThreatLookup`)

### Code Quality
- **TypeScript** - Full type coverage
- **Modular Architecture** - Single responsibility principle
- **Centralized Constants** - Easy maintenance
- **Error Boundaries** - Graceful error handling

## 🧪 Testing Recommendations

While not implemented in this version, recommended testing approach:

```bash
# Unit tests
- IP validation logic
- Risk calculation algorithm
- Data aggregation functions

# Integration tests
- API route responses
- Redux state updates
- Component interactions

# E2E tests
- Complete user flows
- Error scenarios
- Rate limiting behavior
```

## 🚀 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 📝 License

This project is licensed under the MIT License.

## 👨‍💻 Author

Created as part of a technical assessment demonstrating full-stack development capabilities with modern web technologies.

---

**Questions or Issues?**  
Feel free to open an issue or reach out for clarification on any aspect of the implementation.