import mongoose, { Schema } from "mongoose";
import { taskStatus, taskPriority } from "../../utils/constant/enums.js";

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: [3, "Title must be at least 3 characters long"],
    },
    description: {
      type: String,
      trim: true,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(taskStatus),
      default: taskStatus.TODO,
    },
    priority: {
      type: String,
      enum: Object.values(taskPriority),
      default: taskPriority.LOW,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    creator: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignee: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    statusHistory: [
      {
        oldStatus: { type: String },
        newStatus: { type: String, required: true },
        changedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
        changedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

taskSchema.index({ project: 1 });
taskSchema.index({ project: 1, assignee: 1 });
taskSchema.index({ project: 1, status: 1 });
taskSchema.index({ assignee: 1, dueDate: 1 });

const Task = mongoose.model("Task", taskSchema);
export default Task;
