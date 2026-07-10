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
   cp .env.example .env
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

For a normal start, use `npm start`.

## Health check

Once the server is running, request:

```text
GET http://localhost:3000/health
```

Expected response:

```json
{
  "status": "ok"
}
```
