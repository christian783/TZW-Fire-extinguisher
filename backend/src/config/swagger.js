const swaggerJsdoc = require("swagger-jsdoc");

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "RESTful Boilerplate API",
      version: "1.0.0",
      description: "Reusable Express REST API foundation with JWT authentication, validation, pagination, logging, and standard response shapes."
    },
    servers: [
      {
        url: "http://localhost:5000",
        description: "Local development server"
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      },
      schemas: {
        StandardSuccessResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string", example: "Request completed successfully" },
            data: { type: "object" },
            total: { type: "integer", example: 0 },
            page: { type: "integer", example: 1 },
            totalPages: { type: "integer", example: 1 }
          }
        },
        StandardErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string", example: "Error description" },
            errors: {
              type: "array",
              items: { type: "object" }
            }
          }
        },
        User: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            firstName: { type: "string", example: "Jane" },
            lastName: { type: "string", example: "Doe" },
            email: { type: "string", format: "email", example: "jane@example.com" },
            role: { type: "string", enum: ["ADMIN", "USER"], example: "USER" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" }
          }
        }
      }
    }
  },
  apis: ["./src/routes/*.js"]
});

module.exports = swaggerSpec;
