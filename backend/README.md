# GitHub Automation Bot

Initial Express API setup for the GitHub automation bot.

## Prerequisites

- Node.js 22 or later
- npm

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a local environment file:

   ```bash
   cp ../.env.example ../.env
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

For a normal start, use `npm start`.

## Health check

Once the server is running, request:

```text
GET http://localhost:3001/health
```

Expected response:

```json
{
  "status": "ok"
}
```

## GitHub login

The backend implements GitHub's OAuth web flow with these routes:

- `GET /api/auth/github` starts login and redirects to GitHub.
- `GET /api/auth/github/callback` validates the OAuth state, exchanges the code, and creates a session.
- `GET /api/auth/me` returns the logged-in user.
- `POST /api/auth/logout` destroys the session.

Create a GitHub App in GitHub **Settings → Developer settings → GitHub Apps**. For local development, configure:

```text
Homepage URL:              http://localhost:3000
Callback URL:              http://localhost:3001/api/auth/github/callback
```

Copy the app's client ID and generate a client secret, then set these values in the root `.env`:

```dotenv
GITHUB_CLIENT_ID=your-client-id
GITHUB_CLIENT_SECRET=your-client-secret
GITHUB_CALLBACK_URL=http://localhost:3001/api/auth/github/callback
SESSION_SECRET=use-a-long-random-value
```

Open `http://localhost:3001/api/auth/github` in a browser to test login. A successful callback redirects to `http://localhost:3000/dashboard`.

The current session store is suitable for local development only. Replace it with a persistent database or Redis-backed store before deploying multiple instances or using the app in production.
