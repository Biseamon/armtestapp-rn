# Arm Wrestling Pro - Web App

React web version of the Arm Wrestling Pro training tracker.

## Tech Stack

- **Framework:** React 19 + Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **State Management:** React Context
- **Routing:** React Router DOM
- **Charts:** Recharts
- **Icons:** Lucide React

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account (shared with mobile app)

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

## Features

### Current (Foundation)
- ✅ React + TypeScript + Vite
- ✅ Tailwind CSS with dark mode
- ✅ Supabase integration
- ✅ Authentication system
- ✅ Theme toggle

### Planned
- 🔜 Dashboard with stats
- 🔜 Workout logging
- 🔜 Progress charts
- 🔜 Calendar view
- 🔜 Profile settings

## Data Sync

**Uses the same Supabase database as the mobile app.**
All data automatically syncs between mobile and web!

## Deployment

Recommended: **Vercel**

```bash
npm run build
# Deploy dist/ folder
```
