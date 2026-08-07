import { roles, status as userStatus } from "../utils/constant/enums.js";

export const up = async (db, client) => {
  console.log("Running migration: backfill users (UP)");

  await db.collection('users').updateMany(
    {
      $or: [
        { role: { $exists: false } },
        { isVerified: { $exists: false } },
        { status: { $exists: false } }
      ]
    },
    {
      $set: {
        role: roles.MEMBER,
        isVerified: false,
        status: userStatus.VERIFIED
      }
    }
  );
};

export const down = async (db, client) => {
  console.log("Running migration: backfill users (DOWN)");
  // Intentionally non-destructive.
};
