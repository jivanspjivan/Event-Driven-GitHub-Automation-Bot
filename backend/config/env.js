const required = (name) => {
  const value = process.env[name];

  if (!value) {
    const error = new Error(`Missing required environment variable: ${name}`);
    error.statusCode = 503;
    throw error;
  }

  return value;
};

module.exports = { required };
