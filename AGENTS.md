# Mochi Garden — Development Guide for Copilot Sessions

## Project Overview

**Mochi Garden** is a cute Telegram Serverless bot + Mini App. It requires:
- No VPS, external database, or third-party backend
- All code runs on **Telegram Serverless**
- Database uses Telegram's built-in **tgcloud db**
- Static assets (Mini App) hosted on Telegram Serverless

## Architecture

```
source/
├── dist/
│   └── index.html          ← Mini App frontend (single HTML file)
├── tgcloud/
│   ├── schema.js           ← Database schema (mochi_profiles table)
│   ├── handlers/
│   │   ├── message.js      ← /start, /help, command handlers
│   │   └── callback_query.js ← Button interaction handlers
│   ├── endpoints/
│   │   ├── getProfile.js   ← HTTP endpoint for fetching user profile
│   │   └── doAction.js     ← HTTP endpoint for performing game actions
│   └── lib/
│       └── mochi.js        ← Core game logic (ensureProfile, performAction)
├── package.json
└── tgcloud.jsonc           ← Telegram Serverless configuration

.github/workflows/
└── (future CI/CD workflows)
```

## Database Schema

The `mochi_profiles` table stores:
- `user_id` (INTEGER PRIMARY KEY) — Telegram numeric user ID
- `name` (TEXT) — User's display name
- `hearts` (INTEGER) — Total hearts collected (0–∞)
- `level` (INTEGER) — Calculated from hearts: `level = floor(hearts / 10) + 1`
- `last_daily` (TEXT) — ISO date (YYYY-MM-DD) of last daily claim (UTC)

### Level Progression
- **Level 1**: 0–9 hearts
- **Level 2**: 10–19 hearts
- **Level 3**: 20–29 hearts
- etc.

## Bot Commands

All commands are handled in `tgcloud/handlers/message.js`:

- `/start` — Initialize user, show welcome + inline buttons
- `/help` — List all available commands
- `/pet` — Pet Mochi (2 hearts, randomized response)
- `/quest` — Receive a random small real-world challenge (1 heart)
- `/fortune` — Get a cute fortune (1 heart)
- `/daily` — Claim 5 hearts once per calendar day (UTC)
- `/stats` — Display current hearts, level, and progress

**Inline Buttons** (same actions as commands):
- 🐰 Pet Mochi → `pet`
- 🌱 Tiny quest → `quest`
- 🔮 Fortune cookie → `fortune`
- 💖 Daily hug → `daily`

## Mini App Endpoints

Frontend calls these HTTP endpoints via `Telegram.WebApp.Serverless.call()`:

### `getProfile` (input: none)
**Returns**: `{ name, hearts, level, lastDaily }`

Fetches the current user's profile. Always calls `ensureProfile()` internally to create missing profiles on first call.

### `doAction` (input: `{ action: string }`)
**Returns**: `{ message, gained, profile: { name, hearts, level, lastDaily } }`

Performs an action (pet/quest/fortune/daily) for the authenticated user.

**Security**: Both endpoints validate that `ctx.initData.user` exists (Telegram-verified identity). Never trust client-provided user IDs.

## Frontend (Mini App)

**Single file**: `source/dist/index.html`

### Features
- Pastel pink/lavender/mint color scheme
- 🐰 Bunny emoji mascot with emoji reactions
- Heart and level counters with progress bar
- Four action buttons
- Real-time result display
- Telegram theme detection (light/dark)
- Animated bunny emoji on action
- Haptic feedback on button press (if supported)
- Graceful error message if opened outside Telegram

### Calling Endpoints
```javascript
function call(name, input = {}) {
  return new Promise((resolve, reject) => {
    if (!tg?.Serverless?.call) {
      reject(new Error('Please open this Mini App from Telegram'));
      return;
    }
    tg.Serverless.call(name, input, (err, data) =>
      err ? reject(new Error(err.message)) : resolve(data)
    );
  });
}
```

## Game Logic

**File**: `source/tgcloud/lib/mochi.js`

### `ensureProfile(user)`
- Creates user profile if not exists
- Updates name on each call
- Returns complete profile object
- Uses upsert: `onConflictDoUpdate` to prevent race conditions

### `performAction(user, action)`
- Validates action is in `['pet', 'quest', 'fortune', 'daily']`
- **Daily duplicate prevention**: Checks `profile.lastDaily === today` (UTC date). If true, returns 0 hearts.
- Awards hearts: 2 (pet), 1 (quest), 1 (fortune), 5 (daily)
- Calculates new level: `floor(hearts / 10) + 1`
- Updates database atomically
- Returns: `{ profile, message, gained }`

### Heart and Level Calculation
```javascript
const newHearts = profile.hearts + hearts;
const newLevel = Math.floor(newHearts / 10) + 1;
```

## Deployment Workflow

### Prerequisites
1. Telegram bot created with @BotFather
2. Serverless enabled on the bot
3. CLI Access token obtained from @BotFather → Bot → Serverless → CLI Access
4. Node.js 18+ installed locally

### Steps

1. **Install dependencies**
   ```bash
   cd source
   npm install
   ```

2. **Authenticate with Telegram Serverless**
   ```bash
   npx tgcloud login
   ```
   Paste the CLI Access token when prompted.

3. **First deploy**
   ```bash
   npm run deploy
   ```
   Copy the printed app URL (e.g., `https://app12345.tgcloud.ai/`).

4. **Set Mini App URL**
   - Open `source/tgcloud/handlers/message.js`
   - Replace `https://REPLACE_WITH_YOUR_APP_URL/` with the actual URL
   - Save and commit

5. **Deploy again**
   ```bash
   npm run deploy
   ```

6. **Run database migration**
   ```bash
   npm run migrate
   ```
   Confirm table creation when prompted.

7. **Verify in @BotFather**
   - Open @BotFather → your bot → Serverless → Mini App Files
   - Confirm frontend files are deployed
   - Test bot in Telegram: `/start`, `/help`, click buttons

## Scripts

In `source/package.json`:
- `npm run deploy` — Push code and static assets to Telegram Serverless
- `npm run migrate` — Create/update database schema
- `npm run status` — Check deployment status and app URL

## Important Security Notes

1. **CLI Access Token**: Store securely. Never commit to git. Add to `.env` locally and use environment variables in CI/CD if needed.
2. **User ID**: Always obtain from `ctx.initData.user` (Telegram-verified), never from client input.
3. **Input Validation**: All action names validated server-side. No trust of client values.
4. **Database**: Concurrent updates handled via SQL upsert for profiles, atomic updates for actions.
5. **No Secrets in Code**: tgcloud.jsonc, handlers, and endpoints contain no tokens or credentials.

## Testing

Current tests (if implemented):
- Reward logic: Pet (2), Quest (1), Fortune (1), Daily (5)
- Daily duplicate prevention: Second claim in same day returns 0
- Level progression: `level = floor(hearts / 10) + 1`
- Input validation: Invalid actions rejected server-side

To add/run tests:
```bash
cd source
npm test  # (if test runner configured)
```

## Future Enhancements

Suggested without breaking current design:
1. **Collectible Accessories**: Add `accessories` array to profiles
2. **Streak System**: Track consecutive daily claims
3. **Leaderboard**: Top 10 users by hearts (with privacy considerations)
4. **Mini-Games**: Rock-paper-scissors, memory match, etc.
5. **Settings**: Notification preferences, timezone override
6. **Gifting**: Send hearts to other users
7. **Themes**: Alternate color schemes

## Troubleshooting

### "Open Mochi from inside Telegram"
Mini App opened in regular browser, not inside Telegram client. Test must be from bot menu.

### "Unknown action" or button doesn't work
- Verify button `callback_data` matches `doAction.js` allowed list
- Check endpoint returns correct response format
- Inspect browser console for network errors

### Daily reward claimed multiple times
- Should be impossible if `last_daily` check works
- Verify UTC timezone is used consistently
- Check database for concurrent update issues (shouldn't happen with upsert)

### Mini App URL not updating
- Must deploy twice: once to get URL, edit handler, then push again
- Verify exact URL is copied (no trailing spaces or slashes)

## Official References

- [Telegram Serverless Docs](https://blogfork.telegram.org/bots/serverless)
- [Telegram Mini Apps](https://core.telegram.org/bots/webapps)
- [Telegram Bot API](https://core.telegram.org/bots/api)

---

**Last Updated**: 2026-10-10
**Maintainer**: Copilot sessions
