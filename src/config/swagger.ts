import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Hotel API',
      version: '1.0.0',
      description:
        'API REST profesional para gestión hotelera: habitaciones, huéspedes y reservas.',
      contact: {
        name: 'Hotel API Support',
      },
    },
    servers: [
      {
        url: 'http://localhost:{port}',
        description: 'Development server',
        variables: {
          port: {
            default: '3000',
          },
        },
      },
    ],
    tags: [
      { name: 'Health', description: 'Health check endpoint' },
      { name: 'Rooms', description: 'Room management' },
      { name: 'Guests', description: 'Guest management' },
      { name: 'Bookings', description: 'Booking management' },
    ],
    components: {
      schemas: {
        ApiError: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  example: 'Validation failed',
                },
                code: {
                  type: 'string',
                  example: 'VALIDATION_ERROR',
                },
                details: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      path: { type: 'string' },
                      message: { type: 'string' },
                      received: {},
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: [path.join(__dirname, '../routes/*.ts'), path.join(__dirname, '../routes/*.js')],
};

export const swaggerSpec = swaggerJsdoc(options);
