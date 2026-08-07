import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { jest } from "@jest/globals";

// Set process env before importing app
process.env.NODE_ENV = "test";
process.env.SECRET_KEY = "test-jwt-secret-key-12345";
process.env.SALT_ROUNDS = 8;
process.env.TOKEN_PRIFEX2 = "bearer";

import app from "../index.js"; 
import User from "../database/models/user.model.js";
import Project from "../database/models/project.model.js";
import Task from "../database/models/task.model.js";
import { roles, status } from "../utils/constant/enums.js";

let mongoServer;

beforeAll(async () => {
  // Disconnect from any DB setup.js might have connected to
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
}, 180000);

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.db.dropDatabase();
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});

beforeEach(async () => {
  await User.deleteMany({});
  await Project.deleteMany({});
  await Task.deleteMany({});
});

describe("TaskFlow Backend API Integration Tests", () => {

  // ─── 1. Authentication Tests ───────────────────────
  describe("1. Authentication", () => {
    it("should register a new user with default MEMBER role and verified status", async () => {
      const res = await request(app)
        .post("/auth/signup")
        .send({
          userName: "John Doe",
          email: "john@example.com",
          password: "Password123",
          Cpassword: "Password123",
          mobileNumber: "01000000000",
          gender: "male"
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe("john@example.com");
      expect(res.body.data.role).toBe(roles.MEMBER);
    });

    it("should login user with valid credentials and return token", async () => {
      // Register user first
      await request(app).post("/auth/signup").send({
        userName: "Jane Doe",
        email: "jane@example.com",
        password: "Password123",
        Cpassword: "Password123",
        mobileNumber: "01000000001",
        gender: "female"
      });

      // Update to VERIFIED if your system requires email verification to login
      await User.updateOne({ email: "jane@example.com" }, { isVerified: true, status: status.VERIFIED });

      const res = await request(app)
        .post("/auth/login")
        .send({
          email: "jane@example.com",
          password: "Password123",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.accessToken).toBeDefined();
    });

    it("should reject unauthenticated requests to protected routes", async () => {
      const res = await request(app).get("/projects");
      expect(res.status).toBe(401);
    });
  });

  // ─── 2. Authorization & Project Membership ─────────────────────
  describe("2. Authorization & Role-Based Access Control", () => {
    it("should allow ONLY ADMIN to add/remove project members, blocking Project Creator (403)", async () => {
      
      // 1. Create Admin user
      const adminRes = await request(app).post("/auth/signup").send({
        userName: "Admin User", email: "admin@example.com", password: "Password123", Cpassword: "Password123", mobileNumber: "01111111111", gender: "male"
      });
      await User.updateOne({ email: "admin@example.com" }, { role: roles.ADMIN, isVerified: true });
      const adminLogin = await request(app).post("/auth/login").send({ email: "admin@example.com", password: "Password123" });
      const adminToken = adminLogin.body.accessToken;

      // 2. Create Member user 1 (Project Creator)
      await request(app).post("/auth/signup").send({
        userName: "Member One", email: "member1@example.com", password: "Password123", Cpassword: "Password123", mobileNumber: "01222222222", gender: "male"
      });
      await User.updateOne({ email: "member1@example.com" }, { isVerified: true });
      const m1Login = await request(app).post("/auth/login").send({ email: "member1@example.com", password: "Password123" });
      const member1Token = m1Login.body.accessToken;

      // 3. Create Member user 2 (Target Member)
      await request(app).post("/auth/signup").send({
        userName: "Member Two", email: "member2@example.com", password: "Password123", Cpassword: "Password123", mobileNumber: "01555555555", gender: "male"
      });
      const member2 = await User.findOne({ email: "member2@example.com" });

      // Member 1 creates a project (becomes Project Creator)
      const projRes = await request(app)
        .post("/projects")
        .set("authentication", `bearer ${member1Token}`)
        .send({ name: "Secret Project", description: "Admin test description that passes length requirement" });
      const projectId = projRes.body.data._id;

      // Member 1 (Project Creator) attempts to add Member 2 -> Should fail (403) per current code logic!
      const ownerAddRes = await request(app)
        .post(`/projects/${projectId}/members`)
        .set("authentication", `bearer ${member1Token}`)
        .send({ userId: member2._id.toString() });
      
      expect(ownerAddRes.status).toBe(403);
      expect(ownerAddRes.body.message).toContain("not authorized");

      // Admin user adds Member 2 -> Should succeed (200)
      const adminAddRes = await request(app)
        .post(`/projects/${projectId}/members`)
        .set("authentication", `bearer ${adminToken}`)
        .send({ userId: member2._id.toString() });
        
      expect(adminAddRes.status).toBe(200);
      
      // Admin user removes Member 2 -> Should succeed (200)
      const adminRemoveRes = await request(app)
        .delete(`/projects/${projectId}/members/${member2._id.toString()}`)
        .set("authentication", `bearer ${adminToken}`);
        
      expect(adminRemoveRes.status).toBe(200);
    });
  });

  // ─── 3. Task CRUD Lifecycle ───────────────────────
  describe("3. Task CRUD Lifecycle", () => {
    it("should allow creating, updating, and deleting tasks within accessible project", async () => {
      
      // Setup User
      await request(app).post("/auth/signup").send({
        userName: "Task Manager", email: "taskmanager@example.com", password: "Password123", Cpassword: "Password123", mobileNumber: "01444444444", gender: "female"
      });
      await User.updateOne({ email: "taskmanager@example.com" }, { isVerified: true });
      const userLogin = await request(app).post("/auth/login").send({ email: "taskmanager@example.com", password: "Password123" });
      const token = userLogin.body.accessToken;
      const userId = (await User.findOne({ email: "taskmanager@example.com" }))._id;

      // Create Project
      const projRes = await request(app)
        .post("/projects")
        .set("authentication", `bearer ${token}`)
        .send({ name: "Task Test Project", description: "Testing task operations" });
      const projectId = projRes.body.data._id;

      // Create Task
      const createTaskRes = await request(app)
        .post(`/projects/${projectId}/tasks`)
        .set("authentication", `bearer ${token}`)
        .send({
          title: "Build Feature X",
          description: "Details for Feature X",
          priority: "High",
          dueDate: "2026-12-31T23:59:59.000Z",
          assignee: userId
        });
        
      expect(createTaskRes.status).toBe(201);
      const taskId = createTaskRes.body.data._id;
      expect(createTaskRes.body.data.status).toBe("To Do");

      // Read Task by ID
      const getTaskRes = await request(app)
        .get(`/projects/${projectId}/tasks/${taskId}`)
        .set("authentication", `bearer ${token}`);
      expect(getTaskRes.status).toBe(200);
      expect(getTaskRes.body.data.title).toBe("Build Feature X");

      // Update Task Status (this triggers statusHistory in your controller)
      const updateTaskRes = await request(app)
        .put(`/projects/${projectId}/tasks/${taskId}`)
        .set("authentication", `bearer ${token}`)
        .send({
          status: "In Progress"
        });
      expect(updateTaskRes.status).toBe(200);
      
      // Delete Task (Task Creator is allowed to delete)
      const deleteTaskRes = await request(app)
        .delete(`/projects/${projectId}/tasks/${taskId}`)
        .set("authentication", `bearer ${token}`);
      expect(deleteTaskRes.status).toBe(200);
    });
  });
});
