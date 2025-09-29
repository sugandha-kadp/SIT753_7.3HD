# CourseFlow

CourseFlow is a lightweight course management experience that focuses on delivering curated learning content to students while giving instructors an easy way to curate modules.

## Getting started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Provide a `.env` file with your MongoDB connection string and JWT secret:
   ```env
   MONGODB_URI=mongodb://localhost:27017/courseflow
   JWT_SECRET=super-secret-key
   ```
3. Seed the default instructor and student accounts:
   ```bash
   npm run seed
   ```
4. Start the application:
   ```bash
   npm run dev
   ```

## Default accounts

| Role       | Email                     | Password       |
| ---------- | ------------------------- | -------------- |
| Instructor | `instructor@example.com`  | `Password123!` |
| Student    | `student@example.com`     | `Password123!` |

No self-registration flow is provided; use the seeded accounts to sign in.

## Available scripts

- `npm run dev` – run the development server with hot reload.
- `npm run start` – run the production server.
- `npm run test` – execute the API test suite.
- `npm run seed` – populate the database with the default CourseFlow users.
