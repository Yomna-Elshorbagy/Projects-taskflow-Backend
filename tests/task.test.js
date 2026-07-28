import request from "supertest";
import app from "../index.js";
import User from "../database/models/user.model.js";
import { roles } from "../utils/constant/enums.js";

describe("Task Endpoints", () => {
  let adminToken;
  let adminUserId;
  let projectId;

  beforeEach(async () => {
    // 1. Create & Login Admin
    await request(app).post("/auth/signup").send({
      userName: "Admin Task",
      email: "admin_task@example.com",
      password: "Password123",
      Cpassword: "Password123",
      mobileNumber: "01099998888",
      gender: "male",
    });

    const admin = await User.findOneAndUpdate(
      { email: "admin_task@example.com" },
      { role: roles.ADMIN },
      { new: true }
    );
    adminUserId = admin._id.toString();

    const loginRes = await request(app).post("/auth/login").send({
      email: "admin_task@example.com",
      password: "Password123",
    });
    adminToken = process.env.TOKEN_PRIFEX2 + " " + loginRes.body.accessToken;

    // 2. Create a Project
    const projectRes = await request(app)
      .post("/projects")
      .set("authentication", adminToken)
      .send({
        name: "Test Project for Tasks",
        description: "This is a strictly over 20 characters description for the project.",
      });

    projectId = projectRes.body.data._id;
  });

  it("should successfully create a task in the project", async () => {
    const res = await request(app)
      .post(`/projects/${projectId}/tasks`)
      .set("authentication", adminToken)
      .send({
        title: "New Task Title",
        description: "This is a strictly over 20 characters description for the task.",
        dueDate: "2027-12-31T00:00:00.000Z",
        assignee: adminUserId,
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe("New Task Title");
    expect(res.body.data.project.toString()).toBe(projectId);
  });

  it("should successfully fetch tasks for a project", async () => {
    // ===> create task
    await request(app)
      .post(`/projects/${projectId}/tasks`)
      .set("authentication", adminToken)
      .send({
        title: "Another Task",
        description: "This is a strictly over 20 characters description for the task.",
        dueDate: "2027-12-31T00:00:00.000Z",
        assignee: adminUserId,
      });

    // ===> fetch tasks
    const res = await request(app)
      .get(`/projects/${projectId}/tasks`)
      .set("authentication", adminToken);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].title).toBe("Another Task");
  });
});
