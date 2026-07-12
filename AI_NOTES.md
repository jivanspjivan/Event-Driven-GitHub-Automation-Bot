# AI Notes

## AI tools and models used

I used OpenAI Codex, powered by a GPT-5-family model, as a pair-programming assistant throughout this project. I used it for architecture discussion, implementation, debugging, test creation, UI refinement, Git workflow support, and documentation. The assistant inspected and edited the repository, ran backend tests and frontend production builds, reviewed logs, and helped interpret responses from GitHub, Slack, Neon, ngrok, and Render.

I did not use repository-specific AI instruction files such as `AGENTS.md`, `CLAUDE.md`, or `.cursorrules`. The working context came from the assignment, my prompts, and our iterative debugging conversation. I have therefore included this disclosure instead of adding an instruction file that was not actually used.

## How the work was divided

I made the product decisions, created and configured the external accounts, supplied the credentials through local or hosted environment variables, chose the repositories and test events, and manually verified the user-visible behavior. I also reviewed the UI repeatedly and directed detailed changes to hierarchy, spacing, colors, loading states, pagination, mobile behavior, and feedback messages.

Codex translated those decisions into code. It proposed service boundaries, created database migrations, implemented controllers and services, added tests, ran verification commands, and helped maintain the feature-to-`develop`-to-`main` Git workflow. It also helped diagnose integration failures by comparing browser requests, application logs, webhook headers, HTTP status codes, database rows, and deployment configuration. I did not treat a generated change as complete until it built or passed the relevant tests and I checked the behavior manually.

## Key decisions I made

### 1. Deliver the core flow with GitHub OAuth before attempting GitHub App authentication

The assignment allows OAuth for the core requirements and lists GitHub App installation authentication as a stretch goal. I chose OAuth so I could complete a reliable end-to-end flow within the available time. The application requests `read:user` and `repo`, uses OAuth state validation, stores the browser session in PostgreSQL, and encrypts the durable automation credential with AES-256-GCM. A GitHub App would be the next authentication improvement because installation tokens provide narrower repository-scoped permissions.

### 2. Make webhook processing durable instead of performing all external calls inside the request

GitHub can retry webhook deliveries, and GitHub or Slack can be temporarily unavailable. I chose a PostgreSQL-backed workflow rather than relying only on an in-memory cron job. The webhook handler verifies the signature, inserts the delivery and one workflow job in a transaction, and returns `202`. The worker claims jobs using row locks and `SKIP LOCKED`, records `unprocessed`, `running`, `success`, and `failed` states, retries failures with delay, and recovers stale running jobs. A unique GitHub delivery ID prevents normal replay from creating duplicate work.

### 3. Automate issue triage rather than create another ticket system

The practical problem was helping a development team respond to QA issues, not creating duplicate Jira-style tickets. I chose a rule that reacts to a newly opened GitHub issue, applies an existing label, assigns a developer, notifies Slack, and records each action. This keeps the source of truth in GitHub and gives the dashboard an auditable history of what the bot attempted and whether each downstream action succeeded.

## Hardest AI-assisted wrong turn

The hardest issue was production authentication across two Render services. The frontend and backend were deployed on different `onrender.com` hostnames. The AI initially treated this mainly as an environment-variable and CORS problem, and the separate-service deployment looked correct because the frontend, backend health endpoint, OAuth callback, and CORS headers were all individually reachable.

After GitHub authorization, however, the frontend called `/api/auth/me` and received `401`. Local authentication still worked. I noticed that the browser's copied request had no `Cookie` header and reported `sec-fetch-site: cross-site` and `sec-fetch-storage-access: none`. We then inspected the deployed response and confirmed that the backend was correctly issuing `Secure; SameSite=None` and the correct CORS origin. That proved the remaining failure was Chrome blocking the session as a third-party cookie, not a missing database session.

We fixed the server-side part by making the cookie policy environment-aware: local HTTP keeps `SameSite=Lax`, while production uses `SameSite=None; Secure`. For the current Render demo, allowing third-party cookies for the Render site completes login. The more important lesson is that the AI should have identified the cross-site-cookie risk before recommending separate platform subdomains. The production-grade fix is to serve the frontend and API from the same site, or use custom subdomains under one registrable domain. I would make that deployment decision earlier next time.

## What I would improve with more time

- Serve the React application and API from the same site so authentication works without a browser exception.
- Authenticate as a GitHub App and create repository webhooks automatically after installation.
- Add richer rule conditions for title keywords, authors, labels, and pull-request events.
- Remove the remaining plaintext OAuth token copy from session data and load only the encrypted credential when GitHub API access is required.
- Add integration tests using a temporary PostgreSQL database and mocked GitHub/Slack servers, plus CI for tests, migrations, and the frontend build.
- Strengthen external-action idempotency around the narrow crash window between a successful Slack request and saving its result.
- Add an optional free LLM triage step for summaries and priority suggestions after the core flow is fully reliable.
- Add production monitoring, alerting, and a clearer operator view for retries and permanently failed jobs.

The AI accelerated implementation substantially, but the most valuable work remained verifying assumptions against real external services. The webhook content type, callback URLs, cookie attributes, browser privacy behavior, and hosted environment variables could not be considered correct from code review alone; they had to be tested through the complete deployed flow.
