export const up = async (db, client) => {
  console.log("Running migration: backfill projects (UP)");

  await db.collection('projects').updateMany(
    { members: { $exists: false } },
    { $set: { members: [] } }
  );
};

export const down = async (db, client) => {
  console.log("Running migration: backfill projects (DOWN)");
  // Intentionally non-destructive.
};
