import mongoose, { Schema } from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: [3, "Project name must be at least 3 characters long"],
    },
    description: {
      type: String,
      trim: true,
    },
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      }
    ],
    creator: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    }
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

projectSchema.virtual("totalTasks", {
  ref: "Task",
  localField: "_id",
  foreignField: "project",
  count: true,
});

projectSchema.virtual("completedTasks", {
  ref: "Task",
  localField: "_id",
  foreignField: "project",
  match: { status: "Done" },
  count: true,
});

projectSchema.index({ creator: 1 });
projectSchema.index({ members: 1 });

const Project = mongoose.model("Project", projectSchema);
export default Project;
