# 🎵 Raga — Soundscape, Unlocked

Raga is a premium, next-generation music player ecosystem featuring a **Next.js 16 Web App** and an **Expo React Native Mobile App**, backed by a scalable **Node.js Express API Server**. Raga personalizes your listening experience with AI-powered recommendations, account-wide library sync, synced lyrics, and responsive interactive player layouts.

---

## 🌟 Key Features

*   **Unified Account Sync**: Playlists, Liked Songs, User Mood/Vibe Preferences, and **Recently Played tracks** are fully synchronized across Web and Mobile platforms in real-time under a shared PostgreSQL database.
*   **Immersive Music Playback**: A true fullscreen overlay player with animated bouncing equalizer visualizers (that react to play/pause states) and customized seek/volume controls.
*   **AI-Powered Recommendations**: An AI Smart Mix recommendation engine that analyzes user listening histories and interaction weights (likes, skips, playlist additions) to tailor personalized feeds.
*   **Synced Lyrics Support**: Automatic fetching and parsing of time-synced lyrics that scroll in real-time with track progress.
*   **Secure Authentication**: Secure sign-in/sign-up flows powered by Clerk with customized high-contrast dark themes.

---

## 🏗️ Repository Architecture

The repository is structured as a monorepo containing three core packages:

```
Raga/
├── server/      # Node.js + Express API Backend (Prisma ORM, PostgreSQL, ML Recommendations)
├── web/         # Next.js 16 Frontend Web App (Tailwind v4, Shadcn, Clerk, HTML5 Audio)
└── mobile/      # Expo React Native App (AsyncStorage, Audio Playback)
```

### 1. ⚡ Backend Server (`/server`)
*   **Framework**: Node.js & Express.
*   **Database & ORM**: PostgreSQL database connected via Prisma Client.
*   **Key Functions**:
    *   Saves Clerk webhook user events.
    *   Maintains lists for User Preferences, Playlists, and Likes.
    *   Tracks user playback logs and skips to build recommendation vectors.
    *   Self-pings every 2 minutes using Cron to prevent Render server sleep cycles.

### 2. 🖥️ Web App (`/web`)
*   **Framework**: Next.js 16 (Turbopack, App Router).
*   **Styling**: Tailwind CSS v4, Vanilla CSS, and Shadcn UI components.
*   **State Management**: Context-based HTML5 Audio Provider controlling global audio states (volume, queue, current position).

### 3. 📱 Mobile App (`/mobile`)
*   **Framework**: React Native & Expo.
*   **Playback**: Native Expo Audio engine.
*   **Storage**: Offline fallback cache.

---

## 🚀 Getting Started

### 1. Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed (v18+ recommended) and a PostgreSQL database instance running (e.g. Supabase or Neon).

### 2. Setup the Backend Server
1.  Navigate to the server directory:
    ```bash
    cd server
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure your environment variables in `.env`:
    ```env
    PORT=5000
    DATABASE_URL=postgresql://...
    JWT_SECRET=your_jwt_secret
    ```
4.  Run Prisma migrations to setup the schema:
    ```bash
    npx prisma db push
    ```
5.  Start the development server:
    ```bash
    npm run dev
    ```

### 3. Setup the Frontend Web App
1.  Navigate to the web directory:
    ```bash
    cd ../web
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure your Clerk & API variables in `.env`:
    ```env
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_pub_key
    CLERK_SECRET_KEY=your_clerk_secret_key
    NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
    NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
    NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
    ```
4.  Launch the Next.js dev server:
    ```bash
    npm run dev
    ```

### 4. Setup the Mobile Expo App
1.  Navigate to the mobile directory:
    ```bash
    cd ../mobile
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the Expo development server:
    ```bash
    npm run start
    ```

---

## 🎨 UI/UX Design System

Raga follows a sleek, dark-mode design system reminiscent of modern premium music platforms:
*   **Primary color**: Spotify Green (`#1DB954`).
*   **Backgrounds**: Pitch Black (`#090909`) and deep grey panels (`#121212`, `#181818`).
*   **Typography**: Serif branding using the **Cinzel** Google Font, paired with clean geometric **Inter** body text.
