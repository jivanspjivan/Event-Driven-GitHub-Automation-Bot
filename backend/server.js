const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const app = require('./app');
const logger = require('./config/logger');

const PORT = process.env.PORT || 3001;

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

app.listen(PORT, () => {
  logger.info('Server started', { port: Number(PORT), environment: process.env.NODE_ENV });
});
