export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  environment: process.env.NODE_ENV || 'development',
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  database: {
    url: process.env.DATABASE_URL,
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback_secret',
    expiresIn: process.env.JWT_EXPIRATION || '15m',
    refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRATION || '7d',
  },
  ollama: {
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
  },
});
