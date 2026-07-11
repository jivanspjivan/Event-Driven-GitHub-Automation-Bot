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

Authenticated repository routes:

- `GET /api/repositories` returns repositories available to the signed-in user and the current selection.
- `PUT /api/repositories/selection` selects a repository using `{ "repositoryId": 123 }`.
- `DELETE /api/repositories/selection` clears the current selection.

Repository access requests the `repo` OAuth scope so private repositories can be listed. Users
with an older session must sign out and authorize the application again to grant this scope.

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
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/github_automation_bot
DATABASE_SSL=false
GITHUB_WEBHOOK_SECRET=replace-with-a-random-webhook-secret
LOG_LEVEL=debug
TOKEN_ENCRYPTION_KEY=replace-with-64-hexadecimal-characters
```

## PostgreSQL

Create the database, set `DATABASE_URL` in the root `.env`, and apply the schema before starting
the API:

```bash
createdb github_automation_bot
npm run db:migrate
npm run dev
```

The migration creates persistent users, repositories, repository selections, and sessions. Set
`DATABASE_SSL=true` when the hosted PostgreSQL provider requires TLS.

Open `http://localhost:3001/api/auth/github` in a browser to test login. A successful callback redirects to `http://localhost:3000/dashboard`.

GitHub access tokens are stored inside the server-side session. Use TLS for database connections
and restrict database access in production.

## Webhook automation

Run `npm run db:migrate`, select a repository, and create a rule with
`POST /api/automations` using `{ "eventName": "push" }`. Supported events are `push`,
`pull_request`, and `issues`. The initial `record_event` action records matched deliveries without
changing the repository.

To triage newly opened issues, create a rule with:

```json
{
  "eventName": "issues",
  "actionType": "triage_issue",
  "configuration": { "label": "bug", "assignee": "developer-login" }
}
```

The rule runs only for the GitHub `issues.opened` action. It verifies that the configured user can
be assigned, adds the label without removing existing labels, adds the assignee without removing
existing assignees, and records the outcome in `webhook_deliveries`.

In the selected repository's GitHub webhook settings, use the public URL
`https://your-api.example/api/webhooks/github`, content type `application/json`, and the same secret
as `GITHUB_WEBHOOK_SECRET`. Recent results are available from `GET /api/automations/deliveries`.

## Logging

Winston writes structured application logs to the console. Every HTTP request receives an
`X-Trace-Id` response header, and its start, completion, duration, webhook processing, and errors
use the same trace ID. Set `LOG_LEVEL=debug` locally or `LOG_LEVEL=info` in production. Request
bodies, authorization headers, cookies, GitHub tokens, and webhook payloads are not logged.
