import { taskStatus, taskPriority } from "../utils/constant/enums.js";

export const up = async (db, client) => {
  console.log("Running migration: backfill tasks (UP)");

  await db.collection('tasks').updateMany(
    {
      $or: [
        { status: { $exists: false } },
        { priority: { $exists: false } }
      ]
    },
    {
      $set: {
        status: taskStatus.TODO,
        priority: taskPriority.LOW
      }
    }
  );
};

export const down = async (db, client) => {
  console.log("Running migration: backfill tasks (DOWN)");
  // Intentionally non-destructive.
};
