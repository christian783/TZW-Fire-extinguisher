# AGENTS.md

Guidance for agents working in this repository. Read this before changing code.

## Project Summary

This is the TZW LTD Fire Extinguisher Management System.

- Root npm workspaces: `backend` and `frontend`.
- Backend: TypeScript, Express 4 API gateway, PostgreSQL, Sequelize, JWT auth, OTP signup/password recovery, RBAC, Swagger UI, Winston/Morgan logging, express-validator.
- Frontend: TypeScript, Vite, React 19, React Router, Axios, Mantine UI, Mantine notifications, JWT-backed auth context.
- Architecture: standalone Express microservices behind an API Gateway. Each service has its own process, port, and database name.

## Safety Rules

- Run `git status --short` before editing when possible. Do not revert unrelated user changes.
- Keep frontend-facing API paths stable unless the user explicitly asks for a breaking change.
- Do not commit secrets from `backend/.env`. Use `backend/.env.example` for documented env names.
- Do not commit generated output: `node_modules/`, `dist/`, `build/`, `logs/`, `.env*`, or `*.log`.
- If changing auth token shape, update backend JWT generation and `frontend/src/context/AuthContext.tsx` together.
- If changing backend response shapes, update frontend consumers and Swagger docs together.
- If changing service boundaries, update `microservices.md`.

## Repository Map

```text
.
  package.json
  package-lock.json
  AGENTS.md
  microservices.md
  backend/
    server.ts
    .env.example
    tsconfig.json
    src/app.ts                   # legacy compatibility app, gateway lives in src/gateway
    src/gateway/
    src/config/
    src/middleware/
    src/models/User.ts
    src/routes/
      authRoutes.ts
      userRoutes.ts
    src/services/
      extinguishers/
      inspections/
      maintenance/
      notifications/
      reports/
    src/utils/
  frontend/
    vite.config.ts
    tsconfig.json
    src/App.tsx
    src/api/axios.ts
    src/context/AuthContext.tsx
    src/components/
    src/pages/
      Login.tsx
      Register.tsx
      VerifyOtp.tsx
      Dashboard.tsx
      Extinguishers.tsx
      Inspections.tsx
      Maintenance.tsx
      Reports.tsx
      Users.tsx
    src/types.ts
```

## Commands

Use workspace scripts:

```bash
npm install
npm run dev
npm run start
npm run build
npm run dev --workspace backend
npm run dev --workspace frontend
```

On Windows PowerShell, prefer `npm.cmd`:

```bash
npm.cmd run build
npm.cmd run dev --workspace frontend
```

## Environment

Backend env lives in `backend/.env.example`:

- `PORT`
- `NODE_ENV`
- `FRONTEND_ORIGIN`
- `DB_HOST`
- `DB_USER`
- `DB_PASS`
- `DB_NAME`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`

Frontend defaults to `http://localhost:5000/api` unless `VITE_API_URL` is set.

## Backend Rules

Keep the gateway/service layering:

- `src/app.ts`: gateway middleware, docs, health, route mounting, 404, errors.
- `src/routes`: Auth and User service route contracts.
- `src/services/<service>`: domain service route/controller/model logic.
- `src/models`: shared identity model until auth/user are extracted.
- `src/middleware`: auth, role, validation, error handling.
- `src/utils`: platform helpers only.
- `src/config`: DB, CORS, Swagger.

For new endpoints:

1. Add route validation with `express-validator`.
2. Call `validate` before controllers.
3. Wrap async controllers with `asyncHandler`.
4. Use `sendSuccess` for success responses.
5. Throw `new AppError(message, statusCode, errors)` for operational errors.
6. Add or update Swagger docs in the route file.
7. Add or update shared schemas in `backend/src/config/swagger.ts`.
8. Mount service routers in `backend/src/app.ts`.

Preserve standard success responses:

```json
{
  "success": true,
  "message": "",
  "data": {},
  "total": 0,
  "page": 1,
  "totalPages": 1
}
```

Preserve standard error responses:

```json
{
  "success": false,
  "message": "Error description",
  "errors": []
}
```

## Services

Current standalone services:

- Authentication Service: `/api/auth`
- User Management Service: `/api/users`
- Fire Extinguisher Management Service: `/api/extinguishers`
- Inspection Scheduling Service: `/api/inspections`
- Maintenance Logging Service: `/api/maintenance`
- Reporting Service: `/api/reports`
- Notification Service: `/api/notifications`

Service process entrypoints:

- `backend/src/gateway/server.ts`
- `backend/src/services/auth/server.ts`
- `backend/src/services/users/server.ts`
- `backend/src/services/extinguishers/server.ts`
- `backend/src/services/inspectionMaintenance/server.ts`
- `backend/src/services/reports/server.ts`
- `backend/src/services/notifications/server.ts`

Each service must use its own `*_DB_NAME` from `backend/.env.example`. Do not add cross-service database queries; call the owning service over HTTP.

Notifications are email-only and must use Nodemailer. Domain events must flow through RabbitMQ using `backend/src/platform/rabbitmq.ts`; do not reintroduce direct internal HTTP notification delivery. Use SMTP env vars in `backend/.env`; do not hardcode Gmail app passwords in source files.

Do not reintroduce generic sample resources like `Task`. The domain is fire safety operations.

## Auth Contract

Public auth routes:

- `POST /api/auth/register`
- `POST /api/auth/verify-otp`
- `POST /api/auth/resend-otp`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/validate-token`
- `GET /api/auth/me`
- `PATCH /api/auth/change-password`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

JWT payload fields expected by the frontend:

```js
{
  id,
  firstName,
  lastName,
  email,
  role,
  exp
}
```

Roles are:

- `ADMIN`
- `INSPECTOR`
- `USER`

## Frontend Rules

- Use Mantine components for forms, tables, modals, app shell, navigation, and notifications.
- Use `@mantine/form` for local form state/validation.
- Use `@tabler/icons-react` for icon buttons.
- Keep authenticated pages inside `AppLayout`.
- Keep protected pages behind `ProtectedRoute`.
- Add API types to `frontend/src/types.ts`.
- Use `frontend/src/api/axios.ts` for API calls so auth headers and 401 handling stay consistent.

When adding a page:

1. Create the page under `frontend/src/pages`.
2. Add the route to `frontend/src/App.tsx`.
3. Add navigation to `frontend/src/components/AppLayout.tsx`.
4. Use responsive Mantine layouts.
5. Run the frontend build.

## Swagger And Docs

Swagger UI is configured in `backend/src/config/swagger.ts` and scans:

- `backend/src/app.ts`
- `backend/src/routes/*.ts`
- `backend/src/services/**/*.ts`
- compiled equivalents under `backend/dist`

Every public endpoint must have a Swagger block. Protected routes should include `bearerAuth`.

Update `microservices.md` when service responsibilities, ERD, deployment, exports, or user manual behavior changes.

## Verification

There is no automated test suite configured yet. At minimum:

- Run `npm.cmd run build --workspace backend` after backend changes.
- Run `npm.cmd run build --workspace frontend` after frontend changes.
- Run `npm.cmd run build` for full-stack changes.
- Load the compiled Swagger spec when changing docs.
- Verify protected frontend flows redirect unauthenticated users to `/login`.

Important smoke paths:

- Auth: register, verify OTP, login, me, change password, forgot/reset password.
- Users: list/update/delete as Admin.
- Extinguishers: list/create/update/delete with role gates.
- Inspections: list/schedule/update/delete with role gates.
- Maintenance: list/create/update/delete with role gates.
- Reports: dashboard and CSV/PDF export.
- Notifications: operational notification list.
