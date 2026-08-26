import { createServer } from "http";
import { io as Client } from "socket.io-client";
import app from "../index.js";
import appGateway from "../src/socket/app.gateway.js";
import User from "../database/models/user.model.js";
import Project from "../database/models/project.model.js";
import Task from "../database/models/task.model.js";
import Message from "../database/models/message.model.js";
import Token from "../database/models/token.model.js";
import { generateToken } from "../utils/token.js";

describe("WebSockets (Socket.io) Real-Time Chat tests", () => {
  let httpServer, port, clientSocket, authUser, validTokenStr, project, task;

  beforeAll(async () => {
    // 1. Setup a test HTTP server on an ephemeral port (0 = OS picks a free port)
    httpServer = createServer(app);
    await appGateway.init(httpServer);
    await new Promise((resolve) => {
      httpServer.listen(0, () => {
        port = httpServer.address().port;
        resolve();
      });
    });
  });

  afterAll(async () => {
    // 2. Shut down the server after all tests finish
    await new Promise((resolve) => httpServer.close(resolve));
  });

  beforeEach(async () => {
    // 3. Clear all relevant collections and seed test data
    await User.deleteMany({});
    await Project.deleteMany({});
    await Task.deleteMany({});
    await Message.deleteMany({});
    await Token.deleteMany({});

    // Create a verified user that will connect via socket
    // NOTE: status enum value is lowercase "verified" per enums.js
    authUser = await User.create({
      userName: "Authorized User",
      email: "authorized@example.com",
      password: "Password123",
      gender: "male",
      isVerified: true,
      status: "verified",
    });

    // Generate a JWT token and persist it in the Token collection
    // TOKEN_PRIFEX2 = "bearer" (from .env) - so prefix is "bearer"
    const jwtToken = await generateToken({ payload: { _id: authUser._id } });
    validTokenStr = `bearer ${jwtToken}`;

    await Token.create({
      token: jwtToken,
      userId: authUser._id,
      isValid: true,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60), // 1 hour from now
    });

    // Create a project where authUser is the creator
    project = await Project.create({
      name: "Test Project",
      description: "Project for websocket testing",
      creator: authUser._id,
      members: [],
    });

    // Create a task inside the project assigned to authUser
    task = await Task.create({
      title: "Test Task",
      description: "Task for websocket testing",
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24),
      creator: authUser._id,
      assignee: authUser._id,
      project: project._id,
    });
  });

  afterEach(() => {
    // 4. Disconnect the socket client after each test if still open
    if (clientSocket && clientSocket.connected) {
      clientSocket.disconnect();
    }
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. Authentication Tests
  // ─────────────────────────────────────────────────────────────────────────────

  it("should successfully connect with a valid authentication token", (done) => {
    clientSocket = Client(`http://localhost:${port}`, {
      auth: { token: validTokenStr },
    });

    clientSocket.on("connect", () => {
      expect(clientSocket.connected).toBe(true);
      done();
    });

    clientSocket.on("connect_error", (err) => {
      done(err);
    });
  });

  it("should reject connection with missing token", (done) => {
    // No auth provided — should trigger middleware rejection
    clientSocket = Client(`http://localhost:${port}`);

    clientSocket.on("connect", () => {
      done(new Error("Connection should have been rejected but was allowed"));
    });

    clientSocket.on("connect_error", (err) => {
      expect(err.message).toContain("Authentication token is required");
      done();
    });
  });

  it("should reject connection with an invalid/garbage token", (done) => {
    clientSocket = Client(`http://localhost:${port}`, {
      auth: { token: "bearer totally-invalid-token" },
    });

    clientSocket.on("connect", () => {
      done(new Error("Connection should have been rejected"));
    });

    clientSocket.on("connect_error", (err) => {
      expect(err.message).toContain("Authentication failed");
      done();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. Room Join Tests
  // ─────────────────────────────────────────────────────────────────────────────

  it("should allow joining room and retrieve task message history", (done) => {
    clientSocket = Client(`http://localhost:${port}`, {
      auth: { token: validTokenStr },
    });

    clientSocket.on("connect", () => {
      clientSocket.emit("join_task", { taskId: task._id.toString() });
    });

    clientSocket.on("message_history", (history) => {
      // history should be an empty array since no messages exist yet
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBe(0);
      done();
    });

    clientSocket.on("error", (err) => {
      done(new Error(`Unexpected error: ${err.message}`));
    });
  });

  it("should reject joining a room if user is not a project member", async () => {
    // Create an unrelated user who has no access to the project
    const stranger = await User.create({
      userName: "Stranger User",
      email: "stranger@example.com",
      password: "Password123",
      gender: "male",
      isVerified: true,
      status: "verified",
    });

    const strangerJwt = await generateToken({ payload: { _id: stranger._id } });
    const strangerToken = `bearer ${strangerJwt}`;

    await Token.create({
      token: strangerJwt,
      userId: stranger._id,
      isValid: true,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
    });

    clientSocket = Client(`http://localhost:${port}`, {
      auth: { token: strangerToken },
    });

    return new Promise((resolve, reject) => {
      clientSocket.on("connect", () => {
        // Try to sneak into the authorized user's task room
        clientSocket.emit("join_task", { taskId: task._id.toString() });
      });

      clientSocket.on("error", (err) => {
        try {
          expect(err.message).toContain("not authorized");
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. Messaging Tests
  // ─────────────────────────────────────────────────────────────────────────────

  it("should persist message in MongoDB and broadcast to room on send_message", (done) => {
    clientSocket = Client(`http://localhost:${port}`, {
      auth: { token: validTokenStr },
    });

    clientSocket.on("connect", () => {
      clientSocket.emit("join_task", { taskId: task._id.toString() });
    });

    clientSocket.on("message_history", () => {
      // Once we have joined the room, send a message
      clientSocket.emit("send_message", {
        taskId: task._id.toString(),
        content: "Testing real-time messaging",
      });
    });

    clientSocket.on("new_message", async (msg) => {
      try {
        // Verify the broadcast message structure
        expect(msg.content).toEqual("Testing real-time messaging");
        expect(msg.sender._id).toEqual(authUser._id.toString());

        // Verify the message was actually saved in MongoDB
        const savedMessage = await Message.findOne({ task: task._id });
        expect(savedMessage).toBeTruthy();
        expect(savedMessage.content).toEqual("Testing real-time messaging");
        done();
      } catch (err) {
        done(err);
      }
    });

    clientSocket.on("error", (err) => {
      done(new Error(`Unexpected error: ${err.message}`));
    });
  });
});
