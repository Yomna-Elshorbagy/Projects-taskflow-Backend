import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";
import { verifyAndGetUser } from "../middelwares/auth.js";
import chatController from "../modules/chat/chat.controller.js";

/**
 * AppGateway acts as the central hub for ALL WebSocket connections.
 * It handles the infrastructure layer: Socket.io initialization, 
 * Redis Pub/Sub adapter setup, authentication, and global event routing.
 * 
 * Business logic for specific features is delegated to module-specific controllers 
 * (e.g. ChatController, NotificationController).
 */
class AppGateway {
  io = null;

  async init(httpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    // ==> Setup Redis Adapter for Socket.io (Infrastructure)
    if (process.env.NODE_ENV !== "test") {
      try {
        const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
        const pubClient = createClient({ url: redisUrl });
        const subClient = pubClient.duplicate();

        await Promise.all([pubClient.connect(), subClient.connect()]);
        this.io.adapter(createAdapter(pubClient, subClient));
        console.log("Socket.io Redis adapter initialized successfully");
      } catch (err) {
        console.error("Failed to initialize Socket.io Redis adapter:", err);
      }
    }

    // ==> Authentication Middleware (Infrastructure)
    this.io.use(async (socket, next) => {
      try {
        const tokenStr = socket.handshake.auth?.token || socket.handshake.headers?.authorization;
        if (!tokenStr) {
          return next(new Error("Authentication token is required"));
        }

        const user = await verifyAndGetUser(tokenStr);
        socket.user = user;
        next();
      } catch (error) {
        next(new Error("Authentication failed: " + error.message));
      }
    });

    // ==> Event Routing (Infrastructure)
    this.io.on("connection", (socket) => {
      console.log(`User connected: ${socket.user.userName} (${socket.id})`);

      // --- Chat Module Events ---
      socket.on("join_task", (payload) => chatController.joinTaskRoom(socket, payload));
      socket.on("send_message", (payload) => chatController.sendMessage(this.io, socket, payload));
      socket.on("typing", (payload) => chatController.handleTyping(socket, payload));
      socket.on("stop_typing", (payload) => chatController.handleStopTyping(socket, payload));

      // --- Future Module Events (e.g. Notifications) will go here ---

      socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.user.userName}`);
      });
    });
  }
}

export default new AppGateway();
