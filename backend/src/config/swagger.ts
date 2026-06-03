import swaggerJsdoc from "swagger-jsdoc";

const standardErrorResponse = {
  type: "object",
  properties: {
    success: { type: "boolean", example: false },
    message: { type: "string", example: "Error description" },
    errors: {
      type: "array",
      items: { $ref: "#/components/schemas/ValidationError" }
    }
  }
};

const passwordRules = {
  type: "string",
  minLength: 8,
  maxLength: 128,
  format: "password",
  example: "StrongPass123!"
};

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "TZW Fire Extinguisher Management API",
      version: "1.0.0",
      description:
        "RESTful microservices-oriented API gateway for TZW LTD fire extinguisher inventory, inspection scheduling, maintenance logging, compliance reporting, notifications, JWT auth, OTP verification, and RBAC."
    },
    servers: [
      {
        url: "http://localhost:5000",
        description: "Local API gateway"
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
        StandardErrorResponse: standardErrorResponse,
        ValidationError: {
          type: "object",
          properties: {
            field: { type: "string", example: "email" },
            message: { type: "string", example: "A valid email is required" }
          }
        },
        RegisterRequest: {
          type: "object",
          required: ["firstName", "lastName", "email", "password"],
          properties: {
            firstName: { type: "string", minLength: 2, maxLength: 100, example: "Jane" },
            lastName: { type: "string", minLength: 2, maxLength: 100, example: "Doe" },
            email: { type: "string", format: "email", example: "jane@example.com" },
            password: passwordRules,
            role: {
              type: "string",
              enum: ["ADMIN", "INSPECTOR", "USER"],
              default: "USER",
              example: "INSPECTOR",
              description: "Role selector is available in this training template so testers can exercise all RBAC-protected features."
            }
          }
        },
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email", example: "jane@example.com" },
            password: { type: "string", format: "password", example: "StrongPass123!" }
          }
        },
        VerifyOtpRequest: {
          type: "object",
          required: ["email", "otp"],
          properties: {
            email: { type: "string", format: "email", example: "jane@example.com" },
            otp: { type: "string", minLength: 6, maxLength: 6, pattern: "^[0-9]{6}$", example: "123456" }
          }
        },
        ResendOtpRequest: {
          type: "object",
          required: ["email"],
          properties: {
            email: { type: "string", format: "email", example: "jane@example.com" }
          }
        },
        ChangePasswordRequest: {
          type: "object",
          required: ["currentPassword", "newPassword"],
          properties: {
            currentPassword: { type: "string", format: "password", example: "OldPass123!" },
            newPassword: passwordRules
          }
        },
        ResetPasswordRequest: {
          type: "object",
          required: ["email", "otp", "password"],
          properties: {
            email: { type: "string", format: "email", example: "jane@example.com" },
            otp: { type: "string", minLength: 6, maxLength: 6, pattern: "^[0-9]{6}$", example: "123456" },
            password: passwordRules
          }
        },
        OtpData: {
          type: "object",
          properties: {
            userId: { type: "string", format: "uuid" },
            email: { type: "string", format: "email", example: "jane@example.com" },
            expiresAt: { type: "string", format: "date-time" }
          }
        },
        AuthData: {
          type: "object",
          properties: {
            user: { $ref: "#/components/schemas/User" },
            token: { type: "string", description: "JWT access token" }
          }
        },
        User: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            firstName: { type: "string", example: "Jane" },
            lastName: { type: "string", example: "Doe" },
            email: { type: "string", format: "email", example: "jane@example.com" },
            role: { type: "string", enum: ["ADMIN", "INSPECTOR", "USER"], example: "INSPECTOR" },
            emailVerified: { type: "boolean", example: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" }
          }
        },
        UserUpdateRequest: {
          type: "object",
          properties: {
            firstName: { type: "string", minLength: 2, maxLength: 100, example: "Jane" },
            lastName: { type: "string", minLength: 2, maxLength: 100, example: "Doe" },
            role: { type: "string", enum: ["ADMIN", "INSPECTOR", "USER"], example: "INSPECTOR" },
            emailVerified: { type: "boolean", example: true }
          }
        },
        FireExtinguisher: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            serialNumber: { type: "string", example: "TZW-FE-0001" },
            location: { type: "string", example: "Warehouse A - Loading Bay" },
            type: { type: "string", enum: ["WATER", "CO2", "FOAM", "DRY_CHEMICAL"], example: "CO2" },
            size: { type: "string", enum: ["1.5 lb", "5 lb", "9 lb", "12 lb"], example: "5 lb" },
            installationDate: { type: "string", format: "date", example: "2026-01-15" },
            expiryDate: { type: "string", format: "date", example: "2031-01-15" },
            status: {
              type: "string",
              enum: ["ACTIVE", "DUE_FOR_INSPECTION", "MAINTENANCE_REQUIRED", "EXPIRED", "RETIRED"],
              example: "ACTIVE"
            },
            notes: { type: "string", nullable: true, example: "Mounted beside the loading bay exit." },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" }
          }
        },
        FireExtinguisherCreateRequest: {
          type: "object",
          required: ["serialNumber", "location", "type", "size", "installationDate", "expiryDate"],
          properties: {
            serialNumber: { type: "string", minLength: 2, maxLength: 80, example: "TZW-FE-0001" },
            location: { type: "string", minLength: 2, maxLength: 255, example: "Warehouse A - Loading Bay" },
            type: { type: "string", enum: ["WATER", "CO2", "FOAM", "DRY_CHEMICAL"], example: "CO2" },
            size: { type: "string", enum: ["1.5 lb", "5 lb", "9 lb", "12 lb"], example: "5 lb" },
            installationDate: { type: "string", format: "date", example: "2026-01-15" },
            expiryDate: { type: "string", format: "date", example: "2031-01-15" },
            status: { type: "string", enum: ["ACTIVE", "DUE_FOR_INSPECTION", "MAINTENANCE_REQUIRED", "EXPIRED", "RETIRED"], example: "ACTIVE" },
            notes: { type: "string", nullable: true, maxLength: 5000 }
          }
        },
        FireExtinguisherUpdateRequest: {
          type: "object",
          properties: {
            serialNumber: { type: "string", minLength: 2, maxLength: 80, example: "TZW-FE-0001" },
            location: { type: "string", minLength: 2, maxLength: 255, example: "Warehouse A - Loading Bay" },
            type: { type: "string", enum: ["WATER", "CO2", "FOAM", "DRY_CHEMICAL"], example: "CO2" },
            size: { type: "string", enum: ["1.5 lb", "5 lb", "9 lb", "12 lb"], example: "5 lb" },
            installationDate: { type: "string", format: "date", example: "2026-01-15" },
            expiryDate: { type: "string", format: "date", example: "2031-01-15" },
            status: { type: "string", enum: ["ACTIVE", "DUE_FOR_INSPECTION", "MAINTENANCE_REQUIRED", "EXPIRED", "RETIRED"], example: "ACTIVE" },
            notes: { type: "string", nullable: true, maxLength: 5000 }
          }
        },
        Inspection: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            extinguisherId: { type: "string", format: "uuid" },
            scheduledDate: { type: "string", format: "date", example: "2026-06-15" },
            scheduledTime: { type: "string", example: "09:30" },
            status: { type: "string", enum: ["SCHEDULED", "COMPLETED", "OVERDUE", "CANCELLED"], example: "SCHEDULED" },
            result: { type: "string", enum: ["PASS", "FAIL", "NEEDS_MAINTENANCE"], nullable: true },
            findings: { type: "string", nullable: true },
            recommendations: { type: "string", nullable: true },
            inspectorId: { type: "string", format: "uuid", nullable: true },
            requestedById: { type: "string", format: "uuid" },
            completedAt: { type: "string", format: "date-time", nullable: true }
          }
        },
        InspectionScheduleRequest: {
          type: "object",
          required: ["extinguisherId", "scheduledDate", "scheduledTime"],
          properties: {
            extinguisherId: { type: "string", format: "uuid" },
            scheduledDate: { type: "string", format: "date", example: "2026-06-15" },
            scheduledTime: { type: "string", example: "09:30" },
            inspectorId: { type: "string", format: "uuid", nullable: true },
            notes: { type: "string", nullable: true, maxLength: 5000 }
          }
        },
        InspectionUpdateRequest: {
          type: "object",
          properties: {
            scheduledDate: { type: "string", format: "date", example: "2026-06-16" },
            scheduledTime: { type: "string", example: "13:00" },
            status: { type: "string", enum: ["SCHEDULED", "COMPLETED", "OVERDUE", "CANCELLED"] },
            result: { type: "string", enum: ["PASS", "FAIL", "NEEDS_MAINTENANCE"], nullable: true },
            findings: { type: "string", nullable: true, maxLength: 5000 },
            recommendations: { type: "string", nullable: true, maxLength: 5000 },
            inspectorId: { type: "string", format: "uuid", nullable: true }
          }
        },
        MaintenanceLog: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            extinguisherId: { type: "string", format: "uuid" },
            inspectorId: { type: "string", format: "uuid" },
            actionTaken: { type: "string", example: "Replaced pressure gauge and cleaned cylinder." },
            maintenanceDate: { type: "string", format: "date", example: "2026-06-15" },
            issuesIdentified: { type: "string", nullable: true, example: "Pressure below acceptable threshold." },
            recommendations: { type: "string", nullable: true, example: "Inspect again in 30 days." }
          }
        },
        MaintenanceCreateRequest: {
          type: "object",
          required: ["extinguisherId", "actionTaken", "maintenanceDate"],
          properties: {
            extinguisherId: { type: "string", format: "uuid" },
            actionTaken: { type: "string", minLength: 2, maxLength: 5000 },
            maintenanceDate: { type: "string", format: "date" },
            issuesIdentified: { type: "string", nullable: true, maxLength: 5000 },
            recommendations: { type: "string", nullable: true, maxLength: 5000 },
            nextStatus: { type: "string", enum: ["ACTIVE", "DUE_FOR_INSPECTION", "MAINTENANCE_REQUIRED", "EXPIRED", "RETIRED"], example: "ACTIVE" }
          }
        },
        MaintenanceUpdateRequest: {
          type: "object",
          properties: {
            actionTaken: { type: "string", minLength: 2, maxLength: 5000 },
            maintenanceDate: { type: "string", format: "date" },
            issuesIdentified: { type: "string", nullable: true, maxLength: 5000 },
            recommendations: { type: "string", nullable: true, maxLength: 5000 }
          }
        },
        OperationalNotification: {
          type: "object",
          properties: {
            type: { type: "string", example: "EXPIRY_UPCOMING" },
            title: { type: "string", example: "Extinguisher nearing expiry" },
            message: { type: "string", example: "TZW-FE-0001 expires on 2026-06-30." },
            extinguisherId: { type: "string", format: "uuid" }
          }
        }
      }
    }
  },
  apis: ["./src/app.ts", "./src/routes/*.ts", "./src/services/**/*.ts"]
});

export default swaggerSpec;
