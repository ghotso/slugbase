import swaggerJsdoc from 'swagger-jsdoc';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Determine if we're running from compiled JS (production) or TS source (development)
// When running from dist/, __dirname will be dist/config, and routes will be at ../routes/
// In production, files are .js, in development they're .ts
const isProduction = __dirname.includes('dist');
const fileExtension = isProduction ? 'js' : 'ts';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SlugBase API',
      version: '1.0.0',
      description: 'API documentation for SlugBase - A bookmark management system',
      contact: {
        name: 'SlugBase',
      },
    },
    servers: [
      {
        url: process.env.BASE_URL || 'http://localhost:5000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'token',
        },
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        cookieAuth: [],
      },
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    // Use appropriate file extension based on environment
    // In development: scans .ts files from src/
    // In production: scans .js files from dist/
    join(__dirname, `../routes/*.${fileExtension}`),
    join(__dirname, `../routes/**/*.${fileExtension}`),
    join(__dirname, `../**/*.${fileExtension}`),
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
