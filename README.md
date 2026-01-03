# ClearMind

A cognitive behavioral therapy (CBT) application that helps users identify cognitive distortions in their thinking, provides AI-powered reframes, and offers curated exercises to overcome maladaptive thought patterns.

## Features

- **Thought Analysis**: Input your thoughts via text or voice and get AI-powered analysis
- **Cognitive Distortion Detection**: Identifies 10 common cognitive distortions:
  - All-or-Nothing Thinking
  - Overgeneralization
  - Mental Filtering
  - Disqualifying the Positive
  - Jumping to Conclusions
  - Magnification/Catastrophizing
  - Emotional Reasoning
  - Should Statements
  - Labeling
  - Personalization
- **AI Reframing**: Get healthier perspectives on your thoughts using Claude AI
- **CBT Exercise Library**: Access curated exercises like thought records, grounding techniques, and more
- **Progress Tracking**: Track your patterns over time (optional account creation)
- **Voice Input**: Use speech-to-text to express your thoughts naturally

## Tech Stack

- **Frontend**: React + Vite
- **Backend**: Python (FastAPI)
- **AI**: Claude API (Anthropic)
- **Speech-to-Text**: Web Speech API

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.9+
- Anthropic API key (optional, falls back to rule-based analysis)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/clearmind.git
cd clearmind
```

2. Install all dependencies:
```bash
npm run install:all
```

3. Configure environment variables:
```bash
# Edit server/.env and add your Anthropic API key
ANTHROPIC_API_KEY=your_api_key_here
```

4. Start the development servers:
```bash
npm run dev
```

The app will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000

## API Endpoints

### Thought Analysis
- `POST /api/analyze` - Analyze a thought for cognitive distortions

### Exercises
- `GET /api/exercises` - List all CBT exercises
- `GET /api/exercises/{id}` - Get exercise details
- `GET /api/exercises/for-distortion/{distortion_id}` - Get exercises for a specific distortion

### Authentication (Optional)
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

## Project Structure

```
clearmind/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   └── context/        # React context providers
│   └── package.json
├── server/                 # FastAPI backend
│   ├── app/
│   │   ├── routers/        # API route handlers
│   │   ├── services/       # Business logic
│   │   ├── models/         # Database models
│   │   └── data/           # Static data (distortions, exercises)
│   ├── requirements.txt
│   └── .env
├── package.json            # Root package.json for scripts
└── README.md
```

## Usage

1. Open the app in your browser
2. Type or speak a thought that's bothering you
3. Click "Analyze Thought"
4. Review the identified cognitive distortions
5. Read the AI-generated healthier perspectives
6. Try the suggested CBT exercises

## Disclaimer

ClearMind is a self-help tool and is not a substitute for professional mental health care. If you're experiencing significant distress, please consult a licensed mental health professional.

## License

MIT
