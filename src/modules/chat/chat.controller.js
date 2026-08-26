import Task from "../../../database/models/task.model.js";
import Message from "../../../database/models/message.model.js";

/**
 * ChatController handles the business logic for real-time task group chat.
 * It strictly focuses on processing events, validating access, and database interactions,
 * leaving the Socket.io infrastructure to the Gateway.
 */
export class ChatController {
  
  /**
   * Handles a user joining a task's chat room and returning message history.
   */
  async joinTaskRoom(socket, payload) {
    try {
      const { taskId } = payload;
      if (!taskId) {
        return socket.emit("error", { message: "Task ID is required" });
      }

      // Fetch task and check association
      const task = await Task.findById(taskId).populate("project");
      if (!task) {
        return socket.emit("error", { message: "Task not found" });
      }

      const project = task.project;
      if (!project) {
        return socket.emit("error", { message: "Associated project not found" });
      }

      // Validate if user has access to project / task
      const isCreator = project.creator.toString() === socket.user._id.toString();
      const isMember = project.members.some(
        (memberId) => memberId.toString() === socket.user._id.toString()
      );
      const isTaskAssignee = task.assignee.toString() === socket.user._id.toString();
      const isTaskCreator = task.creator.toString() === socket.user._id.toString();

      if (!isCreator && !isMember && !isTaskAssignee && !isTaskCreator) {
        return socket.emit("error", { message: "You are not authorized to access this task chat" });
      }

      // Join Socket.io room
      const roomName = `task:${taskId}`;
      socket.join(roomName);
      console.log(`User ${socket.user.userName} joined room: ${roomName}`);

      // Fetch last 50 messages as history
      const history = await Message.find({ task: taskId })
        .sort({ createdAt: 1 })
        .limit(50)
        .populate("sender", "userName email role image");

      socket.emit("message_history", history);
    } catch (error) {
      socket.emit("error", { message: "Failed to join task chat: " + error.message });
    }
  }

  /**
   * Handles a user sending a new message to the room.
   */
  async sendMessage(io, socket, payload) {
    try {
      const { taskId, content } = payload;
      if (!taskId || !content) {
        return socket.emit("error", { message: "Task ID and content are required" });
      }

      const roomName = `task:${taskId}`;
      // Verify client is in the room
      if (!socket.rooms.has(roomName)) {
        return socket.emit("error", { message: "You must join the task room first" });
      }

      const task = await Task.findById(taskId);
      if (!task) {
        return socket.emit("error", { message: "Task not found" });
      }

      // Create & Save message to Mongo
      const newMessage = await Message.create({
        task: taskId,
        project: task.project,
        sender: socket.user._id,
        content,
      });

      const populatedMessage = await Message.findById(newMessage._id).populate(
        "sender",
        "userName email role image"
      );

      // Broadcast message to everyone in the room
      io.to(roomName).emit("new_message", populatedMessage);
    } catch (error) {
      socket.emit("error", { message: "Failed to send message: " + error.message });
    }
  }

  /**
   * Handles user typing status indicator.
   */
  handleTyping(socket, payload) {
    const { taskId } = payload;
    if (taskId) {
      socket.to(`task:${taskId}`).emit("user_typing", {
        userId: socket.user._id,
        userName: socket.user.userName,
      });
    }
  }

  /**
   * Handles user stop typing status indicator.
   */
  handleStopTyping(socket, payload) {
    const { taskId } = payload;
    if (taskId) {
      socket.to(`task:${taskId}`).emit("user_stop_typing", {
        userId: socket.user._id,
      });
    }
  }
}

export default new ChatController();
