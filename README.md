# TaskFlow Backend

A robust Express.js and MongoDB-based RESTful API that powers the TaskFlow project management application. This backend provides secure authentication, comprehensive project management, and a robust task tracking system with full audit logging capabilities.

## 🚀 Features & Architecture Overview

The backend uses a standard Model-View-Controller (MVC) architecture adapted for an API (Model-Route-Controller-Repository). 

- **Framework**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM (Optimized with single & compound ESR indexes)
- **Caching**: Redis (Cache-aside pattern with graceful fallback)
- **Authentication**: JWT (JSON Web Tokens) with secure token invalidation tracking and hashing password.
- **Validation**: Zod for strict request payload validation.
- **Testing**: Jest and Supertest for API endpoint and unit testing.

### Core Modules
1. **Auth Module**: Handles user registration, secure login, password hashing (bcryptjs), and session/token tracking. 
2. **Project Module**: Allows authorized users to create projects, invite members, and manage project details. Access controls ensure only creators or admins can manage members.
3. **Task Module**: Manages tasks assigned to projects. Tracks statuses, priorities, due dates, and assignees.
4. **Audit Logging**: Automatically maintains an immutable `statusHistory` on tasks to track when statuses change and who changed them.

## 📂 Project Structure

```text
├── database/
│   ├── models/            # Mongoose schemas (User, Task, Project, Token)
│   ├── dbconnection.js    # MongoDB connection logic
│   └── seed.js            # Idempotent database seeding script
├── migrations/            # migrate-mongo scripts for schema/data evolution
├── src/
│   ├── modules/           # Feature modules (Auth, Project, Task)
│   │   ├── auth/          # Example of a typical module structure
│   │   │   ├── auth.controllers.js  # Request handlers and business logic
│   │   │   ├── auth.reposatory.js   # Database abstraction layer
│   │   │   ├── auth.router.js       # Express route definitions
│   │   │   └── auth.validation.js   # Zod schema validations
│   │   └── ...            # Other modules follow the same pattern
│   └── services/          # Core services (e.g., redis.service.js for caching)
├── tests/                 # Jest & Supertest API integration tests
├── utils/                 # Helpers, enums, global error handlers, token utils
├── index.js               # Application entry point & Express setup
├── migrate-mongo-config.js# Configuration for database migrations
└── package.json           # Dependencies and NPM scripts
```

## 📡 API Endpoints Documentation

> [!TIP]
> **Interactive API Swagger Documentation**: The full interactive Swagger/OpenAPI documentation is available at `http://localhost:3000/taskflow-docs` when the server is running. You can test and inspect all endpoints directly from your browser.

Below is a breakdown of the primary endpoints available for each model and what they do. Note that all endpoints (except signup and login) require a valid JWT token passed in the `authentication` header.

### Authentication & Users (`/auth`)
- **`POST /auth/signup`**: Registers a new user. Hashes the password before saving and validates email format.
- **`POST /auth/login`**: Authenticates a user. Returns a JWT access token if the credentials are valid.
- **`POST /auth/logout`**: Logs out the user by finding their active session token in the database and marking it as invalid/expired.
- **`GET /auth/users`**: Fetches a list of registered users (used in the frontend to populate the assignee dropdowns).
- **`GET /auth/profile`**: Fetches the authenticated user's profile details.
- **`PUT /auth/profile`**: Updates the authenticated user's profile.

### Projects (`/projects`)
- **`POST /projects`**: Creates a new project and assigns the requesting user as the `creator`.
- **`GET /projects`**: Retrieves all projects that the user has access to (either as a creator, a member, or an admin).
- **`GET /projects/:id`**: Fetches details for a specific project.
- **`PUT /projects/:id`**: Updates project details. *Only the project creator or an Admin can perform this action.*
- **`DELETE /projects/:id`**: Deletes a specific project. *Only an Admin can perform this action.*
- **`POST /projects/:id/members`**: Adds an existing user as a member to the project. *Only an Admin can perform this action.*
- **`DELETE /projects/:id/members/:userId`**: Removes a member from the project. *Only an Admin can perform this action.*

### Tasks (`/projects/:projectId/tasks`)
- **`POST /projects/:projectId/tasks`**: Creates a new task within a specific project. Requires title, description, due date, and an assignee.
- **`GET /projects/:projectId/tasks`**: Fetches all tasks belonging to the specified project. Supports filtering via query parameters (`?status=...&priority=...`).
- **`GET /projects/:projectId/tasks/:taskId`**: Fetches details for a specific task.
- **`PUT /projects/:projectId/tasks/:taskId`**: Updates a task (e.g., changing its status from 'To Do' to 'In Progress'). *If the status is changed, this method automatically logs the change into the `statusHistory` array.*
- **`DELETE /projects/:projectId/tasks/:taskId`**: Deletes a specific task. *Only the task creator or an Admin can perform this action.*

## 🔍 Pagination, Sorting, Search & Filtering (ApiFeatures)

Both `/projects` and `/projects/:projectId/tasks` endpoints support advanced querying using our custom `ApiFeatures` engine.

### 1. Pagination
To paginate results, supply `page` and `limit` as query parameters. By default, if they are omitted, the API returns **all items**.
- **`page`** (optional): The current page number (starts at `1`).
- **`limit`** (optional): The number of items to return per page.

**Example Response Metadata:**
When pagination parameters are present (or default values apply), the API includes a `pagination` object:
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalItems": 25,
    "totalPages": 3
  }
}
```

### 2. Sorting
Sort items by specifying the `sort` query parameter. Supply field names comma-separated. Prefix a field name with `-` for descending order.
- **Example**: `GET /projects/:projectId/tasks?sort=dueDate,-createdAt` (sorts by due date ascending, and then by creation date descending).
- **Default Sort**: If not specified, results default to `-createdAt` (newest first).

### 3. Searching
Search items dynamically using a case-insensitive regex search by passing the `search` query parameter.
- **Projects**: Searches across the `name` and `description` fields.
  - **Example**: `GET /projects?search=marketing`
- **Tasks**: Searches across the `title` and `description` fields.
  - **Example**: `GET /projects/:projectId/tasks?search=database`

### 4. General Filtering
Any key-value pair passed in the query string that is not a reserved keyword (`page`, `limit`, `sort`, `search`) is treated as an exact match filter.
- **Example**: `GET /projects/:projectId/tasks?status=In Progress&priority=High` (returns only tasks with "In Progress" status and "High" priority).

## 📋 Prerequisites

- **Node.js** (v18 or higher recommended)
- **MongoDB** (Local instance or MongoDB Atlas cluster)
- **Redis** (Local instance or Upstash cluster. *Not required if using Docker*)
- **npm** or **yarn**

## 🛠️ Environment Variables Setup

Create a `.env` file in the root directory of the backend project. The application requires the following environment variables to run successfully:

```env
# Application Settings
port=3000
APPLICATION_NAME='TaskFlow App'

# Database & Cache Connections
MONGODB_ATLAS='mongodb+srv://<username>:<password>@cluster0.mongodb.net/taskflow?retryWrites=true&w=majority'
REDIS_URL='redis://localhost:6379'

# Cloudinary (Default Avatar Images)
SECURE_URL='https://res.cloudinary.com/...'
PUBLIC_ID='profile-image_id'

# JWT Authentication Secrets
SECRET_KEY='your_super_secret_jwt_key'
EMAIL_KEY='your_email_verification_secret'
SECRETKEYRESETPASS='your_password_reset_secret'

# Email Config (Nodemailer) for further updates 
SENDEMAIL='your_email@gmail.com'
SENDEMAILPASSWORD='your_app_password'

# Auth Config
TOKEN_PRIFEX1="reset-password"
TOKEN_PRIFEX2="bearer"
SALT_ROUNDS=8
```

*(Note: Never commit your `.env` file to version control. If deploying to Vercel, add these exact keys to your project's Environment Variables settings).*

## 💻 Installation & Setup

### Local Setup (Standard)

1. **Clone the repository and navigate to the backend folder:**
   ```bash
   cd "Project Name"
   ```

2. **Install all dependencies:**
   ```bash
   npm install
   ```

   3. **Start the server:**
      
      - **Standard Mode**:
        ```bash
        npm start
        ```
      - **All-in-One Mode** (Starts Redis & MongoDB via Docker, then starts the Node server):
        ```bash
        npm run start:all
        ```
      - **Development Mode** (Auto-restarts when files change using `nodemon`):
        ```bash
        npx nodemon index.js  or nodemon 
        ```
   The server should start on `http://localhost:3000` (or whatever `PORT` you configured).

### 🐳 Local Setup (Docker Compose - Recommended)

To run the application alongside a dedicated MongoDB database instance and a Redis caching server locally with high performance, isolated environments, and zero installation requirements on your host machine (except Docker):

1. **Ensure you have Docker & Docker Compose installed.**
2. **Configure your `.env` file** in the root directory. (Docker Compose automatically merges your environment configurations from `.env` and redirects database/cache traffic internally to the containerized services).
3. **Build and start the containers:**
   ```bash
   docker compose up --build -d
   ```
4. **Access the application**: The API will be available at `http://localhost:3000`. You can also connect to the local MongoDB database using Compass/shell at `mongodb://localhost:27017/taskflow`.
5. **Stop the containers:**
   ```bash
   docker compose down
   ```
   *(Optional) To completely clean up and free disk space by removing the cached Docker images along with the containers, run:*
   ```bash
   docker compose down --rmi all
   ```


## 🗄️ Database Migrations

Because MongoDB is schema-less, we use **`migrate-mongo`** to handle database state evolution, index creation, and data backfilling in a safe, repeatable way.

### Why `migrate-mongo` is the Best Choice:
- **Cloud Scaling Safety**: Running migrations as a decoupled CI/CD CLI step prevents race conditions when multiple server instances (e.g. Docker containers) boot simultaneously.
- **State Tracking**: Automatically tracks which migrations have run in a `changelog` collection.
- **Atomic Operations**: Prevents parallel execution and data corruption.

### Migration Commands:
```bash
# Apply pending migrations
npm run migrate:up

# Rollback the last migration
npm run migrate:down

# Create a new timestamped migration script
npm run migrate:create <name>

# Check migration execution status
npm run migrate:status
```

## 🌱 Database Seeding

Database seeding populates the database with an initial, predictable dataset. This is essential for instant developer onboarding and consistent QA testing environments.

### How to Run:
Our seeder is built with **Idempotency** (using `upsert`), meaning it safely updates data without duplicating it if run multiple times.

```bash
# Standard Run (Safely adds missing default users and projects)
npm run seed

# Wipe Run (Completely erases the database and starts fresh)
node database/seed.js --wipe
```

## 🧪 Testing

This project uses **Jest** alongside **Supertest** and **MongoMemoryServer** to execute robust unit and end-to-end integration tests on an isolated, in-memory test database.

### Test Commands:
You have total control over which test suites to run:

```bash
# Run ALL tests (Unit + Integration)
npm run test

# Run ONLY Unit tests
npm run test:unit

# Run ONLY End-to-End Integration tests
npm run test:integration
```

**Integration Tests Cover:**
- **Auth Endpoints**: Registration, Login, Profile updates, and JWT Token assignments.
- **Project Endpoints**: Project Creation, and strictly testing Admin-only Member Management (RBAC).
- **Task Endpoints**: Task Creation, Fetching, Status Update Audit Logs, and proper Deletion authorization.

## 🚢 Deployment (Vercel)

This backend is pre-configured to be deployed as Serverless Functions on Vercel. 

1. Push your code to a GitHub repository.
2. Import the project into Vercel.
3. Add **all environment variables** from your `.env` file into the Vercel Dashboard.
4. In your MongoDB Atlas Dashboard, go to **Network Access** and add `0.0.0.0/0` to allow Vercel's serverless functions to connect to the database.

The `vercel.json` file handles routing all traffic to the Express app gracefully:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.js"
    }
  ]
}
```
