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
- **Wallet & Credits**: Earn virtual credits after each test based on WPM, accuracy, score, and leaderboard rank
- **Paper Trading**: Simulated asset trading (AETH, BYTE, VELO, NOVA) using earned credits — no real money involved
- **Cosmetic Shop**: Unlock font themes, UI skins, and avatars with credits
- **Challenge Mode**: Optional animated prompt card (moving and/or resizing) with a credit bonus multiplier

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 18, Tailwind CSS
- **Backend**: Next.js API Routes (TypeScript)
- **Database**: PostgreSQL with Prisma ORM
- **Testing**: Jest with ts-jest

## Project Structure

```
├── app/
│   ├── page.tsx                    # Single-page typing test UI
│   ├── layout.tsx                  # Root layout
│   ├── globals.css                 # Global styles
│   ├── components/
│   │   ├── WalletPanel.tsx         # Wallet balance & transaction history
│   │   ├── TradingPanel.tsx        # Paper-trading UI
│   │   └── ShopPanel.tsx           # Cosmetic shop UI
│   └── api/
│       ├── prompt/route.ts         # GET /api/prompt
│       ├── submit/route.ts         # POST /api/submit
│       ├── leaderboard/route.ts    # GET /api/leaderboard
│       ├── wallet/route.ts         # GET /api/wallet
│       ├── wallet/award/route.ts   # POST /api/wallet/award
│       ├── portfolio/route.ts      # GET /api/portfolio
│       ├── trade/route.ts          # POST /api/trade
│       ├── shop/route.ts           # GET /api/shop
│       ├── shop/buy/route.ts       # POST /api/shop/buy
│       └── shop/equip/route.ts     # POST /api/shop/equip
├── lib/
│   ├── prompts.ts                  # Prompt library with difficulty levels
│   ├── scoring.ts                  # WPM, accuracy, score calculations
│   ├── wallet.ts                   # Credit reward formula
│   ├── trading.ts                  # Mock asset definitions & price simulation
│   ├── shop.ts                     # Cosmetic catalog
│   └── db.ts                       # Prisma client singleton
├── prisma/
│   ├── schema.prisma               # Database schema
│   ├── seed.ts                     # Catalog seeder (run with: npx prisma db seed)
│   └── migrations/                 # SQL migration files
├── __tests__/
│   ├── scoring.test.ts
│   ├── prompts.test.ts
│   ├── wallet.test.ts
│   ├── trading.test.ts
│   └── shop.test.ts
├── jest.config.js
├── .env.example
└── package.json
```

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (local or hosted, e.g. [Neon](https://neon.tech))

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

Edit `.env` with your PostgreSQL connection strings:

```
DATABASE_URL="postgresql://user:password@host:5432/aether_evo?sslmode=require"
DIRECT_URL="postgresql://user:password@host:5432/aether_evo?sslmode=require"
```

For **Neon**, use the pooled connection URL for `DATABASE_URL` and the direct (unpooled) URL for `DIRECT_URL`.

### 3. Set Up Database

```bash
# Run database migrations
npx prisma migrate dev --name init

# Seed the cosmetic catalog
npx prisma db seed
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

### `POST /api/wallet/award`

Awards credits after a completed test. Called automatically by the UI after `/api/submit`.

### `GET /api/wallet?username=...`

Returns wallet balance and last 10 credit transactions.

### `GET /api/portfolio?username=...`

Returns paper-trading holdings with current mock prices and unrealized P&L.

### `POST /api/trade`

Buy or sell a mock asset using wallet credits.

### `GET /api/shop?username=...`

Returns all cosmetic items with owned/equipped status.

### `POST /api/shop/buy` / `POST /api/shop/equip`

Purchase or equip a cosmetic item.

## Scoring System

- **WPM** = (correctChars / 5) / (durationSec / 60)
- **Accuracy** = correctChars / totalChars
- **Score** = round(WPM × Accuracy)
- **Next Difficulty**:
  - Low accuracy (<80%) or low WPM (<30) → Easy
  - Medium accuracy/WPM → Medium
  - High accuracy (>95%) and high WPM (>60) → Hard

## Known Limitations

The wallet, trading, and shop API routes (`/api/wallet/award`, `/api/trade`, `/api/shop/buy`, `/api/shop/equip`)
currently authenticate users by trusting a `username` field in the request body. There is no session-based
authentication. This is acceptable for a class demo but should not be used in a public production deployment
without adding proper session/cookie-based authentication (e.g., [NextAuth.js](https://next-auth.js.org/)).

## Deployment

### Deploy to Vercel with Neon PostgreSQL

1. **Create a free Neon database** at [neon.tech](https://neon.tech).
   - Copy the **pooled connection string** for `DATABASE_URL`.
   - Copy the **direct (unpooled) connection string** for `DIRECT_URL`.

2. **Set environment variables in Vercel**:
   - `DATABASE_URL` — pooled Neon connection string
   - `DIRECT_URL` — direct Neon connection string

3. **Run the migration locally** against the real database before merging:
   ```bash
   # Point your local .env at the real Neon DATABASE_URL / DIRECT_URL
   npx prisma migrate dev --name add_wallet_trading_shop
   ```
   Commit the generated `prisma/migrations/…` SQL file.

4. **Seed the cosmetic catalog** against the real database:
   ```bash
   npx prisma db seed
   ```

5. **Push and deploy**. The Vercel build command (`prisma generate && prisma migrate deploy && next build`) runs migrations automatically on every deploy.

## Database Schema

| Model | Key Fields |
|-------|-----------|
| **User** | id, username (unique), createdAt |
| **TestSession** | id, username, prompt, typedText, durationSec, wpm, accuracy, errorCount, score, difficulty |
| **Wallet** | id, username (unique), balance |
| **CreditTransaction** | id, username, amount, reason, sessionId (unique) |
| **PortfolioHolding** | id, username, symbol, quantity, avgBuyPrice |
| **Trade** | id, username, symbol, type, quantity, price, total |
| **CosmeticItem** | id, name (unique), category, description, price, data |
| **UserCosmetic** | id, username, cosmeticId, equipped |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Make your changes and add tests
4. Run `npm test` to verify
5. Submit a pull request

## License

This project is licensed under the **MIT License**.

