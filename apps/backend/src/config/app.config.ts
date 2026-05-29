import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.BACKEND_PORT || process.env.PORT || '3000', 10) || 3000,
  apiPrefix: process.env.API_PREFIX || 'api',
  swaggerEnabled: process.env.SWAGGER_ENABLED === 'true',
  corsEnabled: process.env.CORS_ENABLED === 'true',
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
})); 
