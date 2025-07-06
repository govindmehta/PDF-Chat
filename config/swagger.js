// utils/swagger.js
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'PDF Helper AI API',
      version: '1.0.0',
      description: 'API documentation for PDF Helper AI backend',
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
      },
    ],
  },
  apis: ['./routes/*.js'], // You can point to your route files with JSDoc comments
};

const swaggerSpec = swaggerJsdoc(options);

export { swaggerSpec, swaggerUi };
