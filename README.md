# 🎭 Psych!

A real-time multiplayer bluffing party game built with Vue 3 and Firebase.

Everyone sees the same question. You write a fake answer to fool your friends. The more people you fool, the more points you score.

**Play now →** https://shashi1562.github.io/psych-game/
---

## How It Works

| Phase | What happens |
|---|---|
| ✍️ **Write** | A question appears. Everyone writes a fake answer that sounds real. |
| 🗳️ **Vote** | All answers (fakes + the real one) are shown. Pick the one you think is genuine. |
| 🎭 **Reveal** | Answers reveal one by one. See who fooled who. |
| 🏆 **Score** | +1,000 for spotting the real answer · +500 for each person you fooled |

---

## Tech Stack

- **Frontend** — Vue 3 + Vite + Tailwind CSS
- **State** — Pinia
- **Backend** — Firebase Firestore (real-time listeners)
- **Auth** — Firebase Anonymous Authentication
- **Hosting** — Firebase Hosting
- **PWA** — vite-plugin-pwa

---

## Project Structure

```
src/
├── components/
│   ├── BaseModal.vue      # Reusable modal wrapper
│   ├── HowToPlay.vue      # How to play card
│   ├── PlayerRow.vue      # Player card row
│   └── TimerRing.vue      # SVG countdown timer
├── data/
│   └── questions.js       # 65+ question bank
├── stores/
│   ├── auth.js            # Firebase anonymous auth
│   └── game.js            # All game state & Firestore logic
├── utils/
│   └── sounds.js          # Web Audio API sound effects
└── views/
    ├── HomeView.vue        # Landing page
    ├── LobbyView.vue       # Room lobby
    ├── GameView.vue        # Game (write / vote / reveal phases)
    └── ResultsView.vue     # Final scores & podium
```

---

## Local Setup

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/psych-game.git
cd psych-game
npm install
```

### 2. Create your Firebase project

Go to [console.firebase.google.com](https://console.firebase.google.com) and:

1. Create a new project
2. Enable **Authentication → Anonymous**
3. Create a **Firestore database** (production mode, `us-central` region)

### 3. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in your Firebase credentials:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### 4. Deploy Firestore security rules

```bash
npx firebase-tools login
npx firebase-tools use YOUR_PROJECT_ID
npx firebase-tools deploy --only firestore:rules
```

### 5. Run locally

```bash
npm run dev
```

App runs at `http://localhost:5173`

---

## Deployment

```bash
npm run build
npx firebase-tools deploy --only hosting
```

Or deploy everything at once:

```bash
npm run deploy
```

---

## Game Flow (technical)

```
lobby → writing → voting → reveal → (repeat) → final_results
```

- The **host's browser** runs all game coordination — no Cloud Functions needed (works on Firebase free Spark plan)
- Firestore real-time listeners sync state to all players instantly
- AI-free — all bluffing is human-written

---

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | `your-project.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Your Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | `your-project.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Sender ID from Firebase console |
| `VITE_FIREBASE_APP_ID` | App ID from Firebase console |

> ⚠️ Never commit `.env` — it's in `.gitignore`

---

## Contributing

1. Fork the repo
2. Create a branch: `git checkout -b feature/my-feature`
3. Commit: `git commit -m "Add my feature"`
4. Push: `git push origin feature/my-feature`
5. Open a pull request

---

## License

MIT — do whatever you want with it.
