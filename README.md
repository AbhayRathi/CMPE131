# Aether Evo — Gamified Typing Test Platform

A minimal full-stack web application for gamified typing tests, built with Next.js 15, TypeScript, Prisma, and PostgreSQL.

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791?logo=postgresql&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38B2AC?logo=tailwind-css&logoColor=white)

## Features

- **Typing Test UI**: Real-time WPM, accuracy, error count, and timer countdown
- **Mode Selection**: 30-second and 60-second test modes
- **Difficulty Levels**: Easy, medium, and hard — auto-adjusting based on performance
- **Guest Mode**: No sign-up required, just start typing
- **Leaderboard**: Top 10 scores displayed below results
- **Prompt System**: Curated prompts per difficulty level with fallback support
- **Full-Stack API**: RESTful routes for prompts, submissions, and leaderboard
- **Database Storage**: All test sessions stored in PostgreSQL via Prisma

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 18, Tailwind CSS
- **Backend**: Next.js API Routes (TypeScript)
- **Database**: PostgreSQL with Prisma ORM
- **Testing**: Jest with ts-jest

## Project Structure

```
├── app/
│   ├── page.tsx                  # Single-page typing test UI
│   ├── layout.tsx                # Root layout
│   ├── globals.css               # Global styles
│   └── api/
│       ├── prompt/route.ts       # GET /api/prompt
│       ├── submit/route.ts       # POST /api/submit
│       └── leaderboard/route.ts  # GET /api/leaderboard
├── lib/
│   ├── prompts.ts                # Prompt library with difficulty levels
│   ├── scoring.ts                # WPM, accuracy, score calculations
│   └── db.ts                     # Prisma client singleton
├── prisma/
│   └── schema.prisma             # Database schema (User, TestSession)
├── __tests__/
│   ├── scoring.test.ts           # Scoring logic tests (41 tests)
│   └── prompts.test.ts           # Prompt system tests (9 tests)
├── jest.config.js                # Jest configuration
├── .env.example                  # Environment variable template
└── package.json
```

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database

### 1. Clone & Install

```bash
git clone https://github.com/AbhayRathi/CMPE131.git
cd CMPE131
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your PostgreSQL connection string:

```
DATABASE_URL="postgresql://user:password@localhost:5432/aether_evo?schema=public"
```

### 3. Set Up Database

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Run Tests

```bash
npm test
```

## API Routes

### `GET /api/prompt`

Returns a random typing prompt based on difficulty.

**Query Parameters:**
- `difficulty` (optional): `easy` | `medium` | `hard` (default: `easy`)

**Response:**
```json
{
  "prompt": "The cat sat on the mat...",
  "difficulty": "easy"
}
```

### `POST /api/submit`

Submits typing test results, computes metrics, and stores in the database.

**Request Body:**
```json
{
  "username": "Player1",
  "prompt": "The cat sat on the mat...",
  "typedText": "The cat sat on the mat...",
  "durationSec": 30,
  "difficulty": "easy"
}
```

**Response:**
```json
{
  "id": "session-id",
  "wpm": 65.5,
  "accuracy": 0.98,
  "errorCount": 2,
  "score": 64,
  "nextDifficulty": "medium"
}
```

### `GET /api/leaderboard`

Returns top 10 test sessions sorted by score.

**Response:**
```json
{
  "leaderboard": [
    {
      "id": "...",
      "username": "Player1",
      "wpm": 65.5,
      "accuracy": 0.98,
      "score": 64,
      "difficulty": "medium",
      "durationSec": 30,
      "createdAt": "2026-01-01T00:00:00Z"
    }
  ]
}
```

## Scoring System

- **WPM** = (correctChars / 5) / (durationSec / 60)
- **Accuracy** = correctChars / totalChars
- **Score** = round(WPM × Accuracy)
- **Next Difficulty**:
  - Low accuracy (<80%) or low WPM (<30) → Easy
  - Medium accuracy/WPM → Medium
  - High accuracy (>95%) and high WPM (>60) → Hard

## Database Schema

| Model | Fields |
|-------|--------|
| **User** | id, username (unique), createdAt |
| **TestSession** | id, username, prompt, typedText, durationSec, wpm, accuracy, errorCount, score, difficulty, createdAt |

The leaderboard queries directly from `test_sessions` — no separate table needed.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Make your changes and add tests
4. Run `npm test` to verify
5. Submit a pull request

## License

This project is licensed under the **MIT License**.
