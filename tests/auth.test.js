import request from "supertest";
import app from "../index.js";
import User from "../database/models/user.model.js";

describe("Auth Endpoints", () => {
  const testUser = {
    userName: "Test User",
    email: "test@example.com",
    password: "Password123",
    Cpassword: "Password123",
    mobileNumber: "01012345678",
    gender: "male",
  };

  it("should successfully register a new user", async () => {
    const res = await request(app).post("/auth/signup").send(testUser);
    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);

    // ===> verify user is saved in DB
    const userInDb = await User.findOne({ email: testUser.email });
    expect(userInDb).toBeTruthy();
  });

  it("should not register a user with duplicate email", async () => {
    // ===> register first time
    await request(app).post("/auth/signup").send(testUser);

    // ===> attempt second time
    const res = await request(app).post("/auth/signup").send(testUser);
    expect(res.statusCode).toEqual(409);
    expect(res.body.success).toBe(false);
  });

  it("should successfully login", async () => {
    await request(app).post("/auth/signup").send(testUser);

    const res = await request(app).post("/auth/login").send({
      email: testUser.email,
      password: testUser.password,
    });

    if (res.statusCode === 500) {
      console.log("LOGIN 500 ERROR:", res.body);
    }

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.accessToken).toBeDefined();
  });

  it("should fail login with invalid password", async () => {
    await request(app).post("/auth/signup").send(testUser);

    const res = await request(app).post("/auth/login").send({
      email: testUser.email,
      password: "WrongPassword123",
    });

    expect(res.statusCode).toEqual(401);
  });
});
