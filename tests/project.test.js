import request from "supertest";
import app from "../index.js";
import User from "../database/models/user.model.js";
import { roles } from "../utils/constant/enums.js";

describe("Project Endpoints", () => {
  let adminToken;
  let adminUserId;
  let regularUserId;

  beforeEach(async () => {
    // ===> create admin user
    const adminRes = await request(app).post("/auth/signup").send({
      userName: "Admin User",
      email: "admin@example.com",
      password: "Password123",
      Cpassword: "Password123",
      mobileNumber: "01012345678",
      gender: "male",
    });

    // ===> make user an admin in DB directly for testing
    const admin = await User.findOneAndUpdate(
      { email: "admin@example.com" },
      { role: roles.ADMIN },
      { new: true }
    );
    adminUserId = admin._id.toString();

    // ===> login as admin
    const loginRes = await request(app).post("/auth/login").send({
      email: "admin@example.com",
      password: "Password123",
    });
    adminToken = process.env.TOKEN_PRIFEX2 + " " + loginRes.body.accessToken;

    // ===> create a regular user
    const userRes = await request(app).post("/auth/signup").send({
      userName: "Regular User",
      email: "user@example.com",
      password: "Password123",
      Cpassword: "Password123",
      mobileNumber: "01112345678",
      gender: "male",
    });

    const userInDb = await User.findOne({ email: "user@example.com" });
    regularUserId = userInDb._id.toString();
  });

  it("admin should successfully create a new project", async () => {
    const res = await request(app)
      .post("/projects")
      .set("authentication", adminToken)
      .send({
        name: "New Test Project",
        description: "This is a strictly over 20 characters description for the project.",
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe("New Test Project");
  });

  it("admin should be able to add member to project", async () => {
    // ===> create project
    const projectRes = await request(app)
      .post("/projects")
      .set("authentication", adminToken)
      .send({
        name: "Test Project for Members",
        description: "This is a strictly over 20 characters description for the project.",
      });
    const projectId = projectRes.body.data._id;

    // ===> add member
    const res = await request(app)
      .post(`/projects/${projectId}/members`)
      .set("authentication", adminToken)
      .send({ userId: regularUserId });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
  });

  it("adding an invalid userId as a project member should fail with 404", async () => {
    // ===> create project
    const projectRes = await request(app)
      .post("/projects")
      .set("authentication", adminToken)
      .send({
        name: "Test Project Error",
        description: "This is a strictly over 20 characters description for the project.",
      });
    const projectId = projectRes.body.data._id;

    // ===> add invalid member
    const fakeObjectId = "507f1f77bcf86cd799439011";
    const res = await request(app)
      .post(`/projects/${projectId}/members`)
      .set("authentication", adminToken)
      .send({ userId: fakeObjectId });

    expect(res.statusCode).toEqual(404);
  });
  it("should fail to create a project if no authentication token is provided", async () => {
    const res = await request(app)
      .post("/projects")
      .send({
        name: "Unauthorized Project",
        description: "This should fail due to lack of auth token.",
      });

    // Expect 401 Unauthorized or similar error status for missing token
    expect([400, 401, 403]).toContain(res.statusCode); // Allow any error depending on implementation
  });

  it("should fail to add a member to a project for a regular user (not admin)", async () => {
    // Generate regular user token
    const loginRes = await request(app).post("/auth/login").send({
      email: "user@example.com",
      password: "Password123",
    });
    const userToken = process.env.TOKEN_PRIFEX2 + " " + loginRes.body.accessToken;

    // Create project as admin first
    const projectRes = await request(app)
      .post("/projects")
      .set("authentication", adminToken)
      .send({
        name: "Admin Project",
        description: "This is a strictly over 20 characters description for the project.",
      });
    const projectId = projectRes.body.data._id;

    // Regular user attempts to add a member
    const res = await request(app)
      .post(`/projects/${projectId}/members`)
      .set("authentication", userToken)
      .send({
        userId: adminUserId, // Just trying to add someone
      });

    // Expect forbidden status because user is not admin
    expect([401, 403]).toContain(res.statusCode);
  });
});
