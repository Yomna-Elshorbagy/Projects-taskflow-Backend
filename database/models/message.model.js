import mongoose, { Schema } from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    task: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

messageSchema.index({ task: 1, createdAt: 1 });

const Message = mongoose.model("Message", messageSchema);
export default Message;
