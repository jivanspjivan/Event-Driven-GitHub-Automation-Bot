const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const app = require('./app');

const PORT = process.env.PORT || 3001;

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
