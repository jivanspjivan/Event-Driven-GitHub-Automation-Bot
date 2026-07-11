const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const sessionMiddleware = require('./middleware/session');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/authRoutes');
const repositoryRoutes = require('./routes/repositoryRoutes');
const automationRoutes = require('./routes/automationRoutes');
const webhookRoutes = require('./routes/webhookRoutes');

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }),
);
app.use('/api/webhooks/github', express.raw({ type: 'application/json', limit: '1mb' }), webhookRoutes);
app.use(express.json({ limit: '1mb' }));
app.use(sessionMiddleware);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/repositories', repositoryRoutes);
app.use('/api/automations', automationRoutes);

// Error middleware must be registered after all application routes.
app.use(notFound);
app.use(errorHandler);

module.exports = app;
