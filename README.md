# TaskFlow Backend

A robust Express.js and MongoDB-based RESTful API that powers the TaskFlow project management application. This backend provides secure authentication, comprehensive project management, and a robust task tracking system with full audit logging capabilities.

## 🚀 Features & Architecture Overview

The backend uses a standard Model-View-Controller (MVC) architecture adapted for an API (Model-Route-Controller-Repository). 

- **Framework**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens) with secure token invalidation tracking and hashing password.
- **Validation**: Zod for strict request payload validation.
- **Testing**: Jest and Supertest for API endpoint and unit testing.

### Core Modules
1. **Auth Module**: Handles user registration, secure login, password hashing (bcryptjs), and session/token tracking. 
2. **Project Module**: Allows authorized users to create projects, invite members, and manage project details. Access controls ensure only creators or admins can manage members.
3. **Task Module**: Manages tasks assigned to projects. Tracks statuses, priorities, due dates, and assignees.
4. **Audit Logging**: Automatically maintains an immutable `statusHistory` on tasks to track when statuses change and who changed them.

## 📡 API Endpoints Documentation

Below is a breakdown of the primary endpoints available for each model and what they do. Note that all endpoints (except signup and login) require a valid JWT token passed in the `authentication` header.

### Authentication & Users (`/auth`)
- **`POST /auth/signup`**: Registers a new user. Hashes the password before saving and validates email format.
- **`POST /auth/login`**: Authenticates a user. Returns a JWT access token if the credentials are valid.
- **`POST /auth/logout`**: Logs out the user by finding their active session token in the database and marking it as invalid/expired.
- **`GET /auth/users`**: Fetches a list of registered users (used in the frontend to populate the assignee dropdowns).

### Projects (`/projects`)
- **`POST /projects`**: Creates a new project and assigns the requesting user as the `creator`.
- **`POST /projects/:projectId/members`**: Adds an existing user as a member to the project. *Only the project creator or an Admin can perform this action.*
- **`GET /projects`**: (If implemented) Retrieves all projects that the user has access to (either as a creator, a member, or an admin).

### Tasks (`/projects/:projectId/tasks`)
- **`POST /projects/:projectId/tasks`**: Creates a new task within a specific project. Requires title, description, due date, and an assignee.
- **`GET /projects/:projectId/tasks`**: Fetches all tasks belonging to the specified project. Supports filtering via query parameters (`?status=...&priority=...`).
- **`GET /projects/:projectId/tasks/:taskId`**: Fetches details for a specific task.
- **`PUT /projects/:projectId/tasks/:taskId`**: Updates a task (e.g., changing its status from 'To Do' to 'In Progress'). *If the status is changed, this method automatically logs the change into the `statusHistory` array.*
- **`DELETE /projects/:projectId/tasks/:taskId`**: Deletes a specific task. *Only the task creator or an Admin can perform this action.*
## 📋 Prerequisites

- **Node.js** (v18 or higher recommended)
- **MongoDB** (Local instance or MongoDB Atlas cluster)
- **npm** or **yarn**

## 🛠️ Environment Variables Setup

Create a `.env` file in the root directory of the backend project. The application requires the following environment variables to run successfully:

```env
# Application Port
PORT=3000
APPLICATION_NAME=TaskFlow

# Database Connection
MONGODB_ATLAS=mongodb+srv://<username>:<password>@cluster0.mongodb.net/taskflow?retryWrites=true&w=majority

# JWT Authentication Secrets
SECRET_KEY=your_super_secret_jwt_key
EMAIL_KEY=your_email_verification_secret
SECRETKEYRESETPASS=your_password_reset_secret

# Token Prefixes (Required for Auth Middleware)
# Example values you can use:
TOKEN_PRIFEX1=reset__
TOKEN_PRIFEX2=Bearer__
```

*(Note: Never commit your `.env` file to version control. If deploying to Vercel, add these exact keys to your project's Environment Variables settings).*

## 💻 Installation & Setup

1. **Clone the repository and navigate to the backend folder:**
   ```bash
   cd "Project Name"
   ```

2. **Install all dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   The server should start on `http://localhost:3000` (or whatever `PORT` you configured).

## 🧪 Testing

This project uses **Jest** alongside **Supertest** to execute endpoint tests on an isolated test database.

**To run the test suite:**
```bash
npm run test
```

This will run tests across:
- **Auth Endpoints** (Registration, Login, Validations)
- **Project Endpoints** (Creation, Member Management)
- **Task Endpoints** (Creation, Fetching, Status Update Audit Logs)

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
